const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const db = require('./database');
require('dotenv').config();  // تحميل متغيرات البيئة

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Redirect legacy paths to root
app.get(['/host.html', '/player.html'], (req, res) => {
    res.redirect('/');
});

// Handle SPA routing - send index.html for all other routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    upgrade: true,
});

// Game State
const rooms = {};

// Scenarios Data
const scenarios = require('./scenarios');

// Roles System (NEW)
const { 
    TEAMS, 
    ROLE_TYPES, 
    ROLES, 
    getRoleInfo, 
    getRolesForPlayerCount,
    getTeamMembers 
} = require('./roles');

// Bot AI Engine (NEW)
const { 
    generateBotAnswer, 
    analyzeSuspicion,
    generateBotVote,
    generateQualityVote, // 🆕 التصويت على جودة السيناريو
    shouldUseAbility 
} = require('./botAI');

// DeepSeek AI Integration
const { testConnection } = require('./deepseekAI');

function getRoleName(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.nameAr : roleId;
}

function getRoleDescription(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.description : '';
}

function getRoleGoal(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.goal : '';
}

function getRoleTeam(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.team : TEAMS.NEUTRAL;
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function checkDraftingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (Object.keys(room.answers).length === room.players.length) {
        clearInterval(room.timer);
        startPresentationPhase(roomCode);
    }
}

function startDraftingPhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'DRAFTING';
    room.answers = {};
    room.drafts = {}; // Reset drafts
    const duration = 90; // seconds

    // إرسال قائمة اللاعبين الذين ينتظرون (جميع اللاعبين في البداية)
    const waitingFor = room.players.map(p => p.id);
    
    io.to(roomCode).emit('startDrafting', { 
        duration,
        waitingFor 
    });

    // Start Timer
    let timeLeft = duration;
    room.timer = setInterval(() => {
        timeLeft--;
        io.to(roomCode).emit('timerUpdate', timeLeft);

        if (timeLeft <= 0) {
            clearInterval(room.timer);
            startPresentationPhase(roomCode);
        }
    }, 1000);

    // Witness Flash Memory (V4)
    const witness = room.players.find(p => p.role === ROLE_TYPES.WITNESS);
    if (witness) {
        io.to(witness.id).emit('witnessFlash', { 
            keywords: room.currentScenario.keywords 
        });
    }

    // Handle Bots - مع تأخير متدرج لتجنب Rate Limit
    room.players.forEach((p, index) => {
        if (p.isBot) {
            // تأخير متدرج: كل بوت يبدأ بعد الآخر بـ 2 ثانية
            setTimeout(() => {
                simulateBotDrafting(room, p);
            }, index * 2000); // 0s, 2s, 4s, 6s, etc.
        }
    });
}

async function simulateBotDrafting(room, bot) {
    // استخدام محرك الذكاء الجديد (DeepSeek AI) لتوليد إجابة ذكية
    const targetText = await generateBotAnswer(bot.role, room.currentScenario, []);
    
    // Simulate typing
    let charIndex = 0;
    const typingSpeed = 50 + Math.random() * 100; // Random speed

    const typingInterval = setInterval(() => {
        if (charIndex < targetText.length) {
            if (!room.drafts[bot.id]) room.drafts[bot.id] = "";
            room.drafts[bot.id] += targetText[charIndex];
            charIndex++;
        } else {
            clearInterval(typingInterval);
        }
    }, typingSpeed);

    // Submit after delay (10-30 seconds)
    const submitDelay = 10000 + Math.random() * 20000;
    setTimeout(() => {
        room.answers[bot.id] = targetText;
        // Notify host
        io.to(room.hostId).emit('playerSubmitted', { playerId: bot.id, playerName: bot.name });
        checkDraftingComplete(room.id || Object.keys(rooms).find(key => rooms[key] === room));
    }, submitDelay);
}

function startPresentationPhase(roomCode) {
    // ❌ تم إلغاء مرحلة العرض القديمة
    // الانتقال مباشرة إلى التصويت على الجودة
    startVotingPhase(roomCode);
}

function checkVotingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (Object.keys(room.votes).length === room.players.length) {
        endRound(roomCode);
    }
}

// ============================================
// 🎬 PHASE 1: QUALITY VOTING (بدون أسماء)
// ============================================
function startVotingPhase(roomCode) {
    startQualityVoting(roomCode);
}

function startQualityVoting(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'QUALITY_VOTING';
    room.qualityVotes = {}; // { playerId: scenarioIndex }
    room.culpritVotes = {}; // سيتم ملؤها في المرحلة الثانية

    // إرسال السيناريوهات بدون أسماء
    const anonymousScenarios = room.players.map((p, index) => ({
        index: index,
        answer: room.answers[p.id] || "لم يكتب شيئاً...",
        // ❌ بدون name
    }));

    io.to(roomCode).emit('qualityVotingStarted', {
        scenarios: anonymousScenarios
    });

    // البوتات تصوت على الجودة
    room.players.forEach(p => {
        if (p.isBot) {
            setTimeout(() => {
                const qualityVote = generateQualityVote(
                    room.players.map(player => room.answers[player.id] || '')
                );
                room.qualityVotes[p.id] = qualityVote;
                
                // 🆕 إرسال للهوست أن البوت صوّت
                io.to(room.host).emit('voteReceived', {
                    phase: 'QUALITY',
                    playerName: p.name,
                    totalVotes: Object.keys(room.qualityVotes).length,
                    totalPlayers: room.players.length
                });
                
                checkQualityVotingComplete(roomCode);
            }, 3000 + Math.random() * 7000); // 3-10 ثواني
        }
    });
}

function checkQualityVotingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (Object.keys(room.qualityVotes).length === room.players.length) {
        startDramaticReveal(roomCode);
    }
}

// ============================================
// 🎭 DRAMATIC REVEAL (العرض التشويقي)
// ============================================
function startDramaticReveal(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'DRAMATIC_REVEAL';

    // تحليل النتائج: عدد الأصوات لكل سيناريو
    const voteCounts = {}; // { scenarioIndex: count }
    const voteDetails = {}; // { scenarioIndex: [voterNames] }

    room.players.forEach((player, index) => {
        voteCounts[index] = 0;
        voteDetails[index] = [];
    });

    Object.entries(room.qualityVotes).forEach(([voterId, scenarioIndex]) => {
        voteCounts[scenarioIndex]++;
        const voter = room.players.find(p => p.id === voterId);
        if (voter) {
            voteDetails[scenarioIndex].push(voter.name);
        }
    });

    // ترتيب السيناريوهات حسب عدد الأصوات (من الأعلى للأسفل)
    const sortedScenarios = room.players
        .map((player, index) => ({
            index: index,
            playerId: player.id,
            playerName: player.name,
            answer: room.answers[player.id] || "لم يكتب شيئاً...",
            voteCount: voteCounts[index],
            voters: voteDetails[index]
        }))
        .sort((a, b) => b.voteCount - a.voteCount);

    // فصل السيناريوهات التي حصلت على أصوات عن التي لم تحصل
    const scenariosWithVotes = sortedScenarios.filter(s => s.voteCount > 0);
    const scenariosWithoutVotes = sortedScenarios.filter(s => s.voteCount === 0);

    // إرسال بداية العرض
    io.to(roomCode).emit('dramaticRevealStarted', {
        totalScenarios: scenariosWithVotes.length + (scenariosWithoutVotes.length > 0 ? 1 : 0)
    });

    // العرض التدريجي
    let currentDelay = 0;

    scenariosWithVotes.forEach((scenario, idx) => {
        // Step 1: عرض السيناريو (3 ثواني)
        setTimeout(() => {
            io.to(roomCode).emit('revealStep', {
                step: 'SCENARIO',
                data: {
                    index: scenario.index,
                    text: scenario.answer,
                    position: idx + 1,
                    total: scenariosWithVotes.length
                }
            });
        }, currentDelay);
        currentDelay += 3000;

        // Step 2: عرض الأصوات (2.5 ثانية)
        setTimeout(() => {
            io.to(roomCode).emit('revealStep', {
                step: 'VOTERS',
                data: {
                    index: scenario.index,
                    voters: scenario.voters,
                    voteCount: scenario.voteCount
                }
            });
        }, currentDelay);
        currentDelay += 2500;

        // Step 3: كشف الكاتب (2 ثانية)
        setTimeout(() => {
            io.to(roomCode).emit('revealStep', {
                step: 'AUTHOR',
                data: {
                    index: scenario.index,
                    author: scenario.playerName
                }
            });
        }, currentDelay);
        currentDelay += 2000;
    });

    // عرض السيناريوهات بدون أصوات (إن وُجدت)
    if (scenariosWithoutVotes.length > 0) {
        setTimeout(() => {
            io.to(roomCode).emit('revealStep', {
                step: 'NO_VOTES',
                data: {
                    scenarios: scenariosWithoutVotes.map(s => ({
                        index: s.index,
                        authorName: s.playerName,
                        answer: s.answer
                    }))
                }
            });
        }, currentDelay);
        currentDelay += 3000;
    }

    // بعد انتهاء العرض: بدء مرحلة النقاش (بدلاً من التصويت على الجاني مباشرة)
    setTimeout(() => {
        startDiscussion(roomCode);
    }, currentDelay + 1000);
}

// ============================================
// 🗣️ DISCUSSION PHASE
// ============================================
function startDiscussion(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'DISCUSSION';

    // 🕵️‍♂️ RESOLVE DETECTIVE & SABOTEUR ABILITIES
    const detective = room.players.find(p => p.role === ROLE_TYPES.DETECTIVE);
    if (detective && detective.investigatedTarget) {
        const target = room.players.find(p => p.id === detective.investigatedTarget);
        if (target) {
            let roleInfo = getRoleInfo(target.role);
            let resultTeam = roleInfo ? roleInfo.team : TEAMS.JUSTICE;
            
            // Check Sabotage (Misdirection)
            // If target was sabotaged, flip the result
            if (target.sabotagedBy) {
                // If Crime -> Justice, If Justice -> Crime
                resultTeam = (resultTeam === TEAMS.CRIME) ? TEAMS.JUSTICE : TEAMS.CRIME;
                console.log(`Sabotage Effect: ${target.name} team flipped to ${resultTeam}`);
            }

            io.to(detective.id).emit('detectiveResult', {
                targetName: target.name,
                resultTeam: resultTeam,
                teamName: (resultTeam === TEAMS.CRIME) ? 'فريق الجريمة' : 'فريق العدالة'
            });
        }
    }

    io.to(roomCode).emit('discussionStarted');
}

// ============================================
// 🔍 PHASE 2: CULPRIT VOTING (مع أسماء)
// ============================================
function startCulpritVoting(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'CULPRIT_VOTING';

    // إرسال السيناريوهات مع الأسماء
    const scenariosWithAuthors = room.players.map((p, index) => ({
        index: index,
        playerId: p.id,
        playerName: p.name,
        answer: room.answers[p.id] || "لم يكتب شيئاً..."
    }));

    io.to(roomCode).emit('culpritVotingStarted', {
        scenarios: scenariosWithAuthors
    });

    // البوتات تصوت على الجاني
    room.players.forEach(p => {
        if (p.isBot) {
            setTimeout(() => {
                const answersData = room.players.map(player => ({
                    id: player.id,
                    name: player.name,
                    role: player.role,
                    team: player.team,
                    answer: room.answers[player.id] || ''
                }));
                
                const culpritVote = generateBotVote(
                    p.role,
                    p.team,
                    room.players,
                    answersData,
                    room.currentScenario,
                    'medium'
                );
                
                room.culpritVotes[p.id] = culpritVote.identity;
                
                // 🆕 إرسال للهوست أن البوت صوّت
                io.to(room.host).emit('voteReceived', {
                    phase: 'CULPRIT',
                    playerName: p.name,
                    totalVotes: Object.keys(room.culpritVotes).length,
                    totalPlayers: room.players.length
                });
                
                checkCulpritVotingComplete(roomCode);
            }, 3000 + Math.random() * 7000); // 3-10 ثواني
        }
    });
}

function checkCulpritVotingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const votesReceived = Object.keys(room.culpritVotes).length;
    const totalPlayers = room.players.length;
    
    console.log(`🔍 Culprit Voting: ${votesReceived}/${totalPlayers} votes received`);
    
    if (votesReceived === totalPlayers) {
        console.log(`✅ All votes received, processing result...`);
        handleVotingResult(roomCode);
    }
}

function handleVotingResult(roomCode) {
    const room = rooms[roomCode];
    // Count votes
    const counts = {};
    Object.values(room.culpritVotes).forEach(targetId => {
        counts[targetId] = (counts[targetId] || 0) + 1;
    });

    // Find max
    let maxVotes = 0;
    let candidates = [];
    Object.entries(counts).forEach(([id, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            candidates = [id];
        } else if (count === maxVotes) {
            candidates.push(id);
        }
    });

    // Handle Tie
    if (candidates.length > 1) {
        if (!room.isReVote) {
             room.isReVote = true;
             // Reset votes
             room.culpritVotes = {};
             io.to(roomCode).emit('votingTie', { candidates });
             startDiscussion(roomCode);
             return;
        } else {
             // Tie again -> Crime Wins
             endRound(roomCode, { winner: TEAMS.CRIME, reason: 'TIE_BREAK' }); 
             return;
        }
    }

    const eliminatedId = candidates[0];
    const eliminatedPlayer = room.players.find(p => p.id === eliminatedId);
    const roleInfo = getRoleInfo(eliminatedPlayer.role);
    
    if (eliminatedPlayer.role === ROLE_TYPES.CULPRIT) {
        // Justice Wins
        endRound(roomCode, { 
            winner: TEAMS.JUSTICE, 
            reason: 'تم القبض على الجاني!',
            eliminatedPlayer: {
                name: eliminatedPlayer.name,
                roleName: getRoleName(eliminatedPlayer.role)
            }
        });
    } else if (roleInfo.team === TEAMS.JUSTICE) {
        // Crime Wins
        endRound(roomCode, { 
            winner: TEAMS.CRIME, 
            reason: `تم القضاء على ${eliminatedPlayer.name} (عضو في فريق العدالة)!`, 
            victim: eliminatedPlayer.name,
            eliminatedPlayer: {
                name: eliminatedPlayer.name,
                roleName: getRoleName(eliminatedPlayer.role)
            }
        });
    } else if (roleInfo.team === TEAMS.CRIME) {
        // Crime Member (not Culprit) -> Continue
        eliminatedPlayer.isEliminated = true;
        
        // End round with CONTINUE status so players see who was eliminated
        endRound(roomCode, { 
            winner: 'CONTINUE', 
            reason: 'تم استبعاد عضو من عصابة الجريمة، لكنه ليس الجاني!', 
            eliminatedPlayer: { 
                name: eliminatedPlayer.name, 
                roleName: getRoleName(eliminatedPlayer.role) 
            } 
        });
    }
}

function calculateScores(room, result) {
    const scores = {};
    const breakdown = {};
    const teamScores = {
        [TEAMS.CRIME]: 0,
        [TEAMS.JUSTICE]: 0
    };

    // Initialize for all players
    room.players.forEach(p => {
        scores[p.id] = 0;
        breakdown[p.id] = [];
    });

    // 1. Quality Votes (نقاط جودة السيناريو)
    const qualityVoteCounts = {}; 
    room.players.forEach((player, index) => {
        qualityVoteCounts[index] = 0;
    });

    if (room.qualityVotes) {
        Object.values(room.qualityVotes).forEach(scenarioIndex => {
            qualityVoteCounts[scenarioIndex]++;
        });

        room.players.forEach((player, index) => {
            const count = qualityVoteCounts[index] || 0;
            if (count > 0) {
                const points = count * 200;
                scores[player.id] += points;
                breakdown[player.id].push(`✨ جودة السيناريو: +${points} (${count} × 200)`);
            }
        });
    }

    // 2. Win/Loss Logic (Result based)
    if (result) {
        const winnerTeam = result.winner;
        
        // Team Win Bonus
        room.players.forEach(p => {
            const roleInfo = getRoleInfo(p.role);
            if (roleInfo && roleInfo.team === winnerTeam) {
                const bonus = 2000;
                scores[p.id] += bonus;
                breakdown[p.id].push(`🏆 فوز الفريق: +${bonus}`);
                teamScores[winnerTeam] += bonus;
            }
        });

        // Culprit Bonus
        if (winnerTeam === TEAMS.CRIME) {
            const culprit = room.players.find(p => p.role === ROLE_TYPES.CULPRIT);
            if (culprit) {
                scores[culprit.id] += 2500;
                breakdown[culprit.id].push(`🎭 نجاة الجاني: +2500`);
            }
        } else if (winnerTeam === TEAMS.JUSTICE) {
             const culprit = room.players.find(p => p.role === ROLE_TYPES.CULPRIT);
             if (culprit) {
                 scores[culprit.id] -= 1000; // Penalty?
                 breakdown[culprit.id].push(`👮 تم القبض عليك: -1000`);
             }
        }
    }

    return { 
        scores, 
        breakdown, 
        teamScores, 
        crimeTeamWon: result ? result.winner === TEAMS.CRIME : false, 
        investigationTeamWon: result ? result.winner === TEAMS.JUSTICE : false,
        culpritCaught: result ? result.winner === TEAMS.JUSTICE : false
    };
}

function endRound(roomCode, result) {
    const room = rooms[roomCode];
    if (!room) return;

    room.roundOutcome = result.winner; // Save outcome for Next Round Logic

    const { scores: roundScores, breakdown, teamScores, crimeTeamWon, investigationTeamWon, culpritCaught } = calculateScores(room, result);

    // Update total scores
    room.players.forEach(p => {
        p.score += (roundScores[p.id] || 0);
    });

    // Get members
    const crimeMembers = room.players.filter(p => {
        const roleInfo = getRoleInfo(p.role);
        return roleInfo && roleInfo.team === TEAMS.CRIME;
    });
    
    const investigationMembers = room.players.filter(p => {
        const roleInfo = getRoleInfo(p.role);
        return roleInfo && roleInfo.team === TEAMS.JUSTICE;
    });

    const results = room.players.map(p => {
        let playerBreakdown = breakdown[p.id];
        if (!playerBreakdown || !Array.isArray(playerBreakdown) || playerBreakdown.length === 0) {
            playerBreakdown = ["لم يحصل على نقاط إضافية"];
        }

        const roleInfo = getRoleInfo(p.role);

        return {
            name: p.name,
            role: getRoleName(p.role),
            roleId: p.role,
            team: roleInfo ? roleInfo.team : TEAMS.JUSTICE,
            teamName: roleInfo && roleInfo.team === TEAMS.CRIME ? 'فريق الجريمة' : 'فريق العدالة',
            roundScore: roundScores[p.id] || 0,
            totalScore: p.score,
            breakdown: playerBreakdown,
            // Reveal info if they were the eliminated one or it's the culprit
            isEliminated: result && result.eliminatedPlayer && result.eliminatedPlayer.name === p.name,
            isCulprit: p.role === ROLE_TYPES.CULPRIT
        };
    }).sort((a, b) => b.totalScore - a.totalScore);

    // Send Results
    io.to(roomCode).emit('roundResults', { 
        winner: result ? result.winner : null,
        results,
        teamScores,
        crimeTeamWon,
        investigationTeamWon,
        culpritCaught,
        crimeMembers: crimeMembers.map(p => ({ id: p.id, name: p.name, score: p.score, roleName: getRoleName(p.role) })),
        investigationMembers: investigationMembers.map(p => ({ id: p.id, name: p.name, score: p.score, roleName: getRoleName(p.role) })),
        reason: result ? result.reason : null,
        victim: result ? result.victim : null,
        eliminatedPlayer: result ? result.eliminatedPlayer : null
    });
    room.state = 'RESULTS';
}

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id, 'from', socket.handshake.address);
    console.log('📊 Total connections:', io.engine.clientsCount);
    
    // Handle connection errors
    socket.on('error', (error) => {
        console.error('❌ Socket error:', socket.id, error);
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', socket.id, error);
    });

    // Discussion Controls
    socket.on('setSpeaker', ({ roomCode, playerId }) => {
        const room = rooms[roomCode];
        if (!room) return;

        io.to(roomCode).emit('speakerUpdated', { playerId });
    });

    socket.on('endDiscussion', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;

        // Transition to Culprit Voting
        startCulpritVoting(roomCode);
    });

    // Host creates a room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            hostId: socket.id,
            players: [],
            state: 'LOBBY', // LOBBY, PLAYING, END
            currentRound: 0,
            totalRounds: 3,
            usedScenarios: []
        };
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
        console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    // Player joins a room
    socket.on('joinRoom', ({ roomCode, playerName, desiredRole }) => {
        const room = rooms[roomCode.toUpperCase()];

        if (room) {
            // Check if player already exists (Reconnection)
            const existingPlayer = room.players.find(p => p.name === playerName);

            if (existingPlayer) {
                // Update socket ID
                existingPlayer.id = socket.id;
                existingPlayer.connected = true;
                socket.join(roomCode.toUpperCase());

                // Notify player they joined
                socket.emit('joinedRoom', {
                    roomCode: roomCode.toUpperCase(),
                    playerId: socket.id,
                    isLeader: existingPlayer.isLeader
                });

                console.log(`${playerName} reconnected to room ${roomCode}`);

                // If game is running, send current state
                if (room.state === 'PLAYING' || room.state === 'DRAFTING' || room.state === 'PRESENTATION' || room.state === 'VOTING') {
                    // Send game started info
                    socket.emit('gameStarted', {
                        title: room.currentScenario.title,
                        round: room.currentRound,
                        totalRounds: room.totalRounds
                    });

                    // Send role info
                    if (existingPlayer.role) {
                        let roleData = {
                            role: existingPlayer.role,
                            roleName: getRoleName(existingPlayer.role),
                            description: getRoleDescription(existingPlayer.role),
                            info: null,
                            round: room.currentRound,
                            totalRounds: room.totalRounds,
                            isTutorial: room.isTutorial
                        };

                        const scenario = room.currentScenario;
                        if (existingPlayer.role === 'WITNESS') {
                            roleData.info = scenario.story;
                        } else if (existingPlayer.role === 'ARCHITECT') {
                            roleData.info = `كلماتك المفتاحية: ${scenario.keywords.join(' - ')}`;
                        } else if (existingPlayer.role === 'DETECTIVE') {
                            roleData.info = `عنوان القضية: ${scenario.title}`;
                        } else if (existingPlayer.role === 'TRICKSTER') {
                            roleData.info = `كلمتك الدخيلة: ${scenario.tricksterWord}`;
                        } else {
                            roleData.info = "انتظر التعليمات...";
                        }
                        socket.emit('roleAssigned', roleData);
                    }

                    // Send phase specific data
                    if (room.state === 'DRAFTING') {
                        // We don't have exact time left stored, but client will sync on next tick
                        socket.emit('startDrafting', { duration: 90 }); // Approximate
                    } else if (room.state === 'PRESENTATION') {
                        socket.emit('startPresentation');
                    } else if (room.state === 'VOTING') {
                        // Resend voting data
                        const anonymousAnswers = room.players.map(p => ({
                            id: p.id,
                            answer: room.answers[p.id] || "..."
                        }));
                        const playersList = room.players.map(p => ({
                            id: p.id,
                            name: p.name
                        }));
                        socket.emit('startVoting', {
                            answers: anonymousAnswers,
                            players: playersList
                        });
                    }
                }
                return;
            }

            // New Player
            const isLeader = room.players.length === 0;

            const player = {
                id: socket.id,
                name: playerName,
                score: 0,
                role: null, // Will be set later or if desiredRole is present
                isLeader: isLeader,
                connected: true
            };

            // ✅ Handle Training Mode Join Logic
            if (desiredRole) {
                console.log(`🎓 Training Mode Join: ${playerName} wants to be ${desiredRole}`);
                room.isTutorial = true;
                room.totalRounds = 1;
                player.role = desiredRole;
                player.preferredRole = desiredRole; // Persist preference

                // Add player first
                room.players.push(player);
                socket.join(roomCode.toUpperCase());

                // Fill with 3 Bots (Total 4 players - minimum for game)
                let botCount = 0;
                while (room.players.length < 4) {
                    botCount++;
                    const botId = `bot_${Date.now()}_${botCount}`;
                    room.players.push({
                        id: botId,
                        name: `Bot ${botCount} 🤖`,
                        score: 0,
                        role: null, // Will be assigned by startGame
                        isLeader: false,
                        connected: true,
                        isBot: true
                    });
                }
                
                console.log(`✅ Training Mode: Added ${botCount} bots. Total players: ${room.players.length}`);
            } else {
                room.players.push(player);
                socket.join(roomCode.toUpperCase());
            }

            // Notify player they joined
            socket.emit('joinedRoom', {
                roomCode: roomCode.toUpperCase(),
                playerId: socket.id,
                isLeader: isLeader
            });

            // Notify host (and everyone in room) about new player
            io.to(roomCode.toUpperCase()).emit('playerJoined', room.players);

            console.log(`${playerName} joined room ${roomCode} ${desiredRole ? '(Training Mode)' : ''}`);

            // Late Join Logic
            if (room.state !== 'LOBBY' && room.state !== 'END') {
                player.role = 'CITIZEN'; // Assign default role

                // Send game started info
                socket.emit('gameStarted', {
                    title: room.currentScenario.title,
                    round: room.currentRound,
                    totalRounds: room.totalRounds
                });

                // Send role info
                socket.emit('roleAssigned', {
                    role: 'CITIZEN',
                    roleName: getRoleName('CITIZEN'),
                    description: getRoleDescription('CITIZEN'),
                    info: "لقد انضممت متأخراً. حاول المساعدة في التصويت.",
                    round: room.currentRound,
                    totalRounds: room.totalRounds,
                    isTutorial: room.isTutorial
                });
            }

        } else {
            socket.emit('error', 'الغرفة غير موجودة');
        }
    });

    // ✅ Fill Room with Bots (Host Action)
    socket.on('fillBots', () => {
        // Find room where this socket is host
        let roomCode = null;
        let room = null;
        for (const code in rooms) {
            if (rooms[code].hostId === socket.id) {
                roomCode = code;
                room = rooms[code];
                break;
            }
        }

        if (!room) {
            socket.emit('error', 'أنت لست مضيفاً لأي غرفة');
            return;
        }

        // Fill up to 8 players
        let botCount = 0;
        let addedCount = 0;
        while (room.players.length < 8) {
            botCount++;
            addedCount++;
            const botId = `bot_${Date.now()}_${botCount}`;
            room.players.push({
                id: botId,
                name: `Bot ${botCount} 🤖`,
                score: 0,
                role: null,
                isLeader: false,
                connected: true,
                isBot: true
            });
        }

        io.to(roomCode).emit('playerJoined', room.players);
        console.log(`🤖 Added ${addedCount} bots to room ${roomCode} by host request`);
    });

    // Host starts the game
    socket.on('startGame', () => {
        startGameLogic(socket, false);
    });

    // Start Tutorial Match
    socket.on('startTutorial', (desiredRole) => {
        console.log('Received startTutorial event from:', socket.id);
        startTutorialLogic(socket, desiredRole);
    });

    function startTutorialLogic(socket, desiredRole) {
        console.log('Starting tutorial logic for:', socket.id);

        // Always create a new room for tutorial
        const roomCode = generateRoomCode();
        console.log('Generated tutorial room code:', roomCode);

        const room = {
            hostId: socket.id,
            players: [],
            state: 'LOBBY',
            currentRound: 0,
            totalRounds: 1,
            usedScenarios: [],
            isTutorial: true,
            hostCode: roomCode
        };
        rooms[roomCode] = room;
        // socket.join(roomCode); // Do not join socket yet, wait for manual join

        // Add Bots - 7 Bots to make 8 players total
        let botCount = 0;
        while (room.players.length < 7) {
            botCount++;
            const botId = `bot_${Date.now()}_${botCount}`;
            room.players.push({
                id: botId,
                name: `Bot ${botCount} 🤖`,
                score: 0,
                role: null,
                isLeader: false,
                connected: true,
                isBot: true
            });
        }

        // Setup tutorial data
        if (desiredRole) {
            // We store the socket ID temporarily to map the role when they join
            room.tutorialData = { userId: socket.id, role: desiredRole };
        } else {
            room.tutorialData = null;
        }

        // Emit Code to User so they can enter it manually
        socket.emit('tutorialCreated', {
            roomCode: roomCode,
            message: `Tm oluşturuldu. Lütfen kodu girin: ${roomCode}`
        });

        console.log(`Created tutorial room ${roomCode} with 7 bots. Waiting for user to join.`);
    }

    function startGameLogic(socket, isTutorial, desiredRole = null) {
        console.log('Received startGame request from:', socket.id);

        // Find room where this socket is host OR leader
        let roomCode = null;
        let room = null;

        // Check if host
        for (const code in rooms) {
            if (rooms[code].hostId === socket.id) {
                roomCode = code;
                room = rooms[code];
                break;
            }
        }

        // Check if leader player
        if (!room) {
            for (const code in rooms) {
                const player = rooms[code].players.find(p => p.id === socket.id);
                if (player && player.isLeader) {
                    roomCode = code;
                    room = rooms[code];
                    break;
                }
            }
        }

        if (!room) {
            console.log('Error: Room not found for host/leader:', socket.id);
            socket.emit('error', 'حدث خطأ: لم يتم العثور على الغرفة أو ليس لديك صلاحية.');
            return;
        }

        console.log(`Starting game for room ${roomCode} with ${room.players.length} players`);

        if (room.players.length < 3) {
            console.log('Error: Not enough players');
            socket.emit('error', 'عدد اللاعبين غير كافٍ (الحد الأدنى 3)');
            return;
        }

        // Reset game state if starting new game
        if (room.state === 'LOBBY' || room.state === 'END') {
            room.currentRound = 0;
            room.usedScenarios = [];
            room.players.forEach(p => p.score = 0);
            room.isTutorial = false;
            room.totalRounds = 3;
            room.tutorialData = null;
        }

        startNewRound(roomCode);
    }

    function startNewRound(roomCode) {
        const room = rooms[roomCode];
        if (!room) return;

        room.currentRound++;

        if (room.currentRound > room.totalRounds) {
            endGame(roomCode);
            return;
        }

        room.state = 'PLAYING';

        // Select random scenario that hasn't been used
        let availableScenarios = scenarios.filter(s => !room.usedScenarios.includes(s.id));

        // If Tutorial, use a specific simple scenario if available, or just random
        if (room.isTutorial) {
            // Try to find a simple one or just pick first
            const tutorialScenario = scenarios.find(s => s.id === 1) || scenarios[0];
            room.currentScenario = tutorialScenario;
        } else {
            if (availableScenarios.length === 0) {
                // Reset used scenarios if all used
                room.usedScenarios = [];
                availableScenarios = scenarios;
            }
            room.currentScenario = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
        }

        room.usedScenarios.push(room.currentScenario.id);

        // Assign Roles (V4 - Team System)
        let shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random());
        let rolesForCount = [...getRolesForPlayerCount(shuffledPlayers.length)];
        
        // 1️⃣ Assign Preferred Roles first
        shuffledPlayers.forEach(p => {
            if (p.preferredRole) {
                p.role = p.preferredRole;
                
                // Remove from pool if exists, otherwise remove least important role
                const index = rolesForCount.indexOf(p.preferredRole);
                if (index !== -1) {
                    rolesForCount.splice(index, 1);
                } else {
                    rolesForCount.pop(); // Remove last added role (least important)
                }
            }
        });

        // 2️⃣ Shuffle remaining roles
        rolesForCount.sort(() => 0.5 - Math.random());

        // 3️⃣ Assign remaining roles to players without role
        let roleIndex = 0;
        shuffledPlayers.forEach((player) => {
            if (!player.preferredRole) {
                player.role = rolesForCount[roleIndex];
                roleIndex++;
            }
            
            player.score = 0; 
            
            // Set starting points for Minister/Beneficiary
            const roleInfo = getRoleInfo(player.role);
            if (roleInfo && roleInfo.startPoints) {
                player.score = roleInfo.startPoints;
            }

            // Reset ability usage flags
            player.abilityUsed = false;
            player.sabotagedBy = null;
            player.investigatedBy = null;
        });

        // Special Role Intel Logic
        const crimeTeam = shuffledPlayers.filter(p => {
             const info = getRoleInfo(p.role);
             return info && info.team === TEAMS.CRIME;
        });
        
        const beneficiary = shuffledPlayers.find(p => p.role === ROLE_TYPES.BENEFICIARY);
        const detective = shuffledPlayers.find(p => p.role === ROLE_TYPES.DETECTIVE);

        // Assign and send role data
        shuffledPlayers.forEach((player) => {
            const role = player.role;
            const roleInfo = getRoleInfo(role);
            
            if (!roleInfo) {
                console.error(`Role info not found for: ${role}`);
                return;
            }

            let specialInfo = null;

            // Culprit gets full story
            if (role === ROLE_TYPES.CULPRIT) {
                specialInfo = room.currentScenario.fullStory; 
            } 
            // Mastermind gets Crime Team list
            else if (role === ROLE_TYPES.MASTERMIND) {
                specialInfo = {
                    type: 'MASTERMIND_INTEL',
                    crimeTeam: crimeTeam.map(p => ({ id: p.id, name: p.name, role: p.role }))
                };
            }
            // Minister gets Beneficiary & Detective
            else if (role === ROLE_TYPES.MINISTER) {
                specialInfo = {
                    type: 'MINISTER_INTEL',
                    beneficiary: beneficiary ? { id: beneficiary.id, name: beneficiary.name } : null,
                    detective: detective ? { id: detective.id, name: detective.name } : null
                };
            }

            let roleData = {
                role: role,
                roleName: roleInfo.nameAr,
                roleNameEn: roleInfo.nameEn,
                description: roleInfo.description,
                goal: roleInfo.goal,
                team: roleInfo.team,
                teamName: roleInfo.team === TEAMS.CRIME ? 'فريق الجريمة' : 'فريق العدالة',
                emoji: roleInfo.emoji,
                ability: roleInfo.ability,
                info: null,
                specialInfo: specialInfo,
                round: room.currentRound,
                totalRounds: room.totalRounds,
                isTutorial: room.isTutorial
            };

            io.to(player.id).emit('roleAssigned', roleData);
        });



        // Notify Host
        io.to(roomCode).emit('gameStarted', {
            title: room.isTutorial ? `(تدريب) ${room.currentScenario.title}` : room.currentScenario.title,
            round: room.currentRound,
            totalRounds: room.totalRounds,
            isTutorial: room.isTutorial,
            roomCode: roomCode
        });

        console.log(`Round ${room.currentRound} started in room ${roomCode}`);

        // Start Drafting Phase after 5 seconds (to let players read roles)
        setTimeout(() => {
            startDraftingPhase(roomCode);
        }, 5000);
    }

    // Helper function to end game
    function endGame(roomCode) {
        const room = rooms[roomCode];
        if (!room) return;

        room.state = 'END';
        const finalResults = room.players.map(p => ({
            name: p.name,
            totalScore: p.score
        })).sort((a, b) => b.totalScore - a.totalScore);

        // Save stats to DB
        const matchData = {
            roomCode,
            players: []
        };

        const winnerScore = finalResults[0]?.totalScore || 0;

        room.players.forEach(p => {
            const isWinner = p.score === winnerScore && p.score > 0;

            // Update player stats
            db.updatePlayerStats(p.name, {
                score: p.score,
                isWinner: isWinner,
                role: p.role // Note: This only saves the LAST role played, ideally we track all roles per round, but for now this is simple
            });

            matchData.players.push({
                name: p.name,
                score: p.score,
                role: p.role
            });
        });

        db.saveMatch(matchData);

        // Get updated leaderboard
        const leaderboard = db.getLeaderboard();

        io.to(roomCode).emit('gameEnded', {
            results: finalResults,
            leaderboard: leaderboard
        });
    }

    /* 
    // Old startGame implementation removed
    socket.on('startGame', () => {
        // ... (logic moved to startNewRound)
    });
    */

    // ============================================
    // 🛡️ V4 ABILITIES HANDLERS
    // ============================================
    socket.on('saboteurSabotage', ({ roomCode, targetId }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player && player.role === ROLE_TYPES.SABOTEUR) {
            const target = room.players.find(p => p.id === targetId);
            if (target) {
                target.sabotagedBy = player.id;
                player.abilityUsed = true;
                console.log(`Saboteur ${player.name} sabotaged ${target.name}`);
            }
        }
    });

    socket.on('detectiveCheck', ({ roomCode, targetId }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player && player.role === ROLE_TYPES.DETECTIVE) {
            const target = room.players.find(p => p.id === targetId);
            if (target) {
                player.investigatedTarget = targetId;
                player.abilityUsed = true;
                console.log(`Detective ${player.name} checked ${target.name}`);
            }
        }
    });

    socket.on('seerReveal', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player && player.role === ROLE_TYPES.SEER) {
            // Auto-submit real story
            const realStory = room.currentScenario.fullStory || room.currentScenario.story; // Fallback
            // Ensure we handle arrays or strings correctly
            const answerText = Array.isArray(realStory) ? realStory.join('\n') : realStory;
            
            room.answers[socket.id] = answerText;
            io.to(room.hostId).emit('playerSubmitted', { playerId: player.id, playerName: player.name });
            checkDraftingComplete(roomCode);
            console.log(`Seer ${player.name} used Revelation`);
        }
    });

    socket.on('submitAnswer', ({ roomCode, answer }) => {
        const room = rooms[roomCode];
        if (room && room.state === 'DRAFTING') {
            room.answers[socket.id] = answer;

            // 👮 قدرة الضابط - تتبع وقت الإرسال
            if (!room.submissionTimes) {
                room.submissionTimes = {};
            }
            room.submissionTimes[socket.id] = Date.now();

            // Notify host
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                io.to(room.hostId).emit('playerSubmitted', { playerId: socket.id, playerName: player.name });
            }

            // Check if all players submitted
            checkDraftingComplete(roomCode);
        }
    });

    // Real-time draft update for Spy ability
    socket.on('updateDraft', ({ roomCode, draft }) => {
        const room = rooms[roomCode];
        if (room && room.state === 'DRAFTING') {
            if (!room.drafts) room.drafts = {};
            room.drafts[socket.id] = draft;
        }
    });

    // Handle Special Abilities
    socket.on('useAbility', ({ roomCode, abilityType, targetId }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        // Check Round Restriction (Abilities start from Round 2)
        // Allow if Tutorial OR Round >= 2
        if (!room.isTutorial && room.currentRound < 2) {
            socket.emit('error', 'القدرات الخاصة تفتح في الجولة الثانية!');
            return;
        }

        if (player.role === 'SPY' && abilityType === 'EAGLE_EYE') {
            // ... (Spy logic)
            // Find Witness
            const witness = room.players.find(p => p.role === 'WITNESS');
            if (!witness) return;

            const witnessDraft = (room.drafts && room.drafts[witness.id]) || "";

            // Obfuscate text (replace 30% of characters with *)
            let obfuscated = witnessDraft.split('').map(char => {
                return Math.random() > 0.7 ? '*' : char;
            }).join('');

            socket.emit('abilityResult', {
                type: 'EAGLE_EYE',
                content: obfuscated || "الشاهد لم يكتب شيئاً بعد..."
            });
        } else if (player.role === 'DETECTIVE' && abilityType === 'INTERROGATION') {
            const targetPlayer = room.players.find(p => p.id === targetId);
            if (!targetPlayer) return;

            // Calculate "Accuracy"
            // Logic: Compare target's answer with Scenario keywords
            const targetAnswer = room.answers[targetId] || "";
            const keywords = room.currentScenario.keywords;

            let matchCount = 0;
            keywords.forEach(kw => {
                if (targetAnswer.includes(kw)) matchCount++;
            });

            // Witness should have high match, Architect medium, others low
            // But let's make it a percentage based on role for simplicity/fun
            let accuracy = 0;
            if (targetPlayer.role === 'WITNESS') {
                accuracy = Math.floor(Math.random() * 20) + 80; // 80-100%
            } else if (targetPlayer.role === 'ARCHITECT') {
                accuracy = Math.floor(Math.random() * 30) + 40; // 40-70%
            } else {
                accuracy = Math.floor(Math.random() * 30); // 0-30%
            }

            socket.emit('abilityResult', {
                type: 'INTERROGATION',
                content: `تحليل الإجابة:\nنسبة الدقة: ${accuracy}%\nالمصداقية: ${accuracy > 50 ? 'عالية' : 'منخفضة'}`
            });
        } else if ((player.role === ROLE_TYPES.OFFICER || player.role === 'OFFICER') && abilityType === 'OBSERVATION') {
            // 👮 قدرة الضابط - الملاحظة الدقيقة
            if (!room.submissionTimes) {
                socket.emit('abilityResult', {
                    type: 'OBSERVATION',
                    content: 'لا توجد بيانات عن أوقات الإرسال بعد.'
                });
                return;
            }

            // حساب الأوقات النسبية
            const times = Object.entries(room.submissionTimes);
            if (times.length === 0) {
                socket.emit('abilityResult', {
                    type: 'OBSERVATION',
                    content: 'لم يرسل أحد إجابته بعد.'
                });
                return;
            }

            const earliestTime = Math.min(...times.map(([_, time]) => time));
            
            const timingData = times.map(([playerId, timestamp]) => {
                const playerObj = room.players.find(p => p.id === playerId);
                const relativeTime = Math.floor((timestamp - earliestTime) / 1000);
                return {
                    name: playerObj ? playerObj.name : 'غير معروف',
                    time: relativeTime
                };
            }).sort((a, b) => a.time - b.time);

            const timingText = timingData.map((data, idx) => {
                const emoji = idx === 0 ? '⚡' : idx === 1 ? '🏃' : idx === 2 ? '🚶' : '🐌';
                return `${emoji} ${data.name}: ${data.time === 0 ? 'فوراً' : `+${data.time}ث`}`;
            }).join('\n');

            socket.emit('abilityResult', {
                type: 'OBSERVATION',
                content: `⏱️ أوقات الإرسال:\n\n${timingText}\n\n💡 ملاحظة: الجاني عادةً يرسل سريعاً لأنه يعرف القصة!`
            });
        }
    });

    // Discussion Phase Controls
    socket.on('setSpeaker', ({ roomCode, playerId }) => {
        const room = rooms[roomCode];
        if (room && (room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isLeader))) {
            io.to(roomCode).emit('speakerUpdated', { playerId });
        }
    });

    socket.on('endDiscussion', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (room && (room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isLeader))) {
            startCulpritVoting(roomCode);
        }
    });

    // ============================================
    // المرحلة الأولى: Quality Voting
    // ============================================
    socket.on('submitQualityVote', ({ roomCode, scenarioIndex }) => {
        const room = rooms[roomCode];
        if (room && room.state === 'QUALITY_VOTING') {
            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;

            // منع التصويت لنفسك
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (scenarioIndex === playerIndex) {
                socket.emit('error', 'لا يمكنك التصويت لنفسك!');
                return;
            }

            room.qualityVotes[socket.id] = scenarioIndex;
            
            // 🆕 إرسال للهوست أن اللاعب صوّت
            io.to(room.host).emit('voteReceived', {
                phase: 'QUALITY',
                playerName: player.name,
                totalVotes: Object.keys(room.qualityVotes).length,
                totalPlayers: room.players.length
            });
            
            checkQualityVotingComplete(roomCode);
        }
    });

    // ============================================
    // المرحلة الثانية: Culprit Voting
    // ============================================
    socket.on('submitCulpritVote', ({ roomCode, playerId }) => {
        const room = rooms[roomCode];
        if (room && room.state === 'CULPRIT_VOTING') {
            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;
            
            room.culpritVotes[socket.id] = playerId;
            
            // 🆕 إرسال للهوست أن اللاعب صوّت
            io.to(room.host).emit('voteReceived', {
                phase: 'CULPRIT',
                playerName: player.name,
                totalVotes: Object.keys(room.culpritVotes).length,
                totalPlayers: room.players.length
            });
            
            checkCulpritVotingComplete(roomCode);
        }
    });

    // ============================================
    // OLD submitVote (للتوافقية المؤقتة - سيتم إزالته)
    // ============================================
    socket.on('submitVote', ({ roomCode, qualityVote, identityVote }) => {
        // هذا للتوافقية مع الكود القديم - سيتم إزالته بعد تحديث Client
        const room = rooms[roomCode];
        if (room) {
            if (room.state === 'QUALITY_VOTING') {
                room.qualityVotes[socket.id] = qualityVote;
                checkQualityVotingComplete(roomCode);
            } else if (room.state === 'CULPRIT_VOTING') {
                room.culpritVotes[socket.id] = identityVote;
                checkCulpritVotingComplete(roomCode);
            }
        }
    });

    // Host requests next round
    socket.on('nextRound', () => {
        // Find room where this socket is host
        let roomCode = null;
        for (const code in rooms) {
            if (rooms[code].hostId === socket.id) {
                roomCode = code;
                break;
            }
        }

        if (roomCode) {
            const room = rooms[roomCode];
            // Check if game should continue (e.g. Crime member eliminated but not Culprit)
            if (room.roundOutcome === 'CONTINUE') {
                room.roundOutcome = null; // Reset so we don't loop forever if next vote is also continue (actually we want to loop if continues again)
                // Return to Discussion
                startDiscussion(roomCode);
            } else {
                startNewRound(roomCode);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle disconnection logic
        for (const code in rooms) {
            const room = rooms[code];
            const player = room.players.find(p => p.id === socket.id);

            if (player) {
                player.connected = false;
                // We don't remove the player to allow reconnection
                // But we notify others
                io.to(code).emit('playerJoined', room.players); // Update list to show status
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // اختبار الاتصال بـ GitHub Models AI
    console.log('🔍 Testing GitHub Models AI connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
        console.log('✅ GitHub Models AI: متصل وجاهز للاستخدام');
        console.log('🤖 البوتات ستستخدم الذكاء الصناعي (GPT-4o-mini) لتوليد إجابات واقعية');
    } else {
        console.log('⚠️ GitHub Models AI: غير متصل - سيتم استخدام القوالب الافتراضية');
    }
});
