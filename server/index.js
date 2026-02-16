const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const db = require('./database');
const { handleSendOffer, handleMastermindForward, handleOfferResponse } = require('./logic/offers');
const { calculateScores } = require('./logic/scoring');
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
        waitingFor,
        caseTitle: room.currentScenario.title, // Add case title for UI
        template: room.gameMode === 'BLITZ' ? room.currentScenario.template : null
    });

    // 📺 Host Hint: Show simple hint on Host Screen
    if (room.hostId && room.currentScenario.simpleHint) {
        io.to(room.hostId).emit('hostHint', { hint: room.currentScenario.simpleHint });
    }

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
    try {
        // استخدام محرك الذكاء الجديد (DeepSeek AI) لتوليد إجابة ذكية
        const targetText = await generateBotAnswer(bot.role, room.currentScenario, [], room.gameMode);
        
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
    } catch (error) {
        console.error(`❌ Bot ${bot.name} failed to draft:`, error);
        // Fallback: Submit a simple answer
        room.answers[bot.id] = "لم أستطع كتابة سيناريو...";
        io.to(room.hostId).emit('playerSubmitted', { playerId: bot.id, playerName: bot.name });
        checkDraftingComplete(room.id || Object.keys(rooms).find(key => rooms[key] === room));
    }
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
                // ✅ GUARD: Check if bot already voted
                if (room.qualityVotes[p.id] !== undefined) return;

                const qualityVote = generateQualityVote(
                    room.players.map(player => room.answers[player.id] || '')
                );
                room.qualityVotes[p.id] = qualityVote;
                
                // 🆕 إرسال للهوست أن البوت صوّت
                io.to(room.hostId).emit('voteReceived', {
                    phase: 'QUALITY',
                    playerId: p.id,
                    playerName: p.name,
                    choice: qualityVote,
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

    // 🔍 عرض التلميح الدرامي (Dramatic Hint)
    if (room.currentScenario.hint) {
        setTimeout(() => {
            io.to(roomCode).emit('revealStep', {
                step: 'HINT',
                data: {
                    hint: room.currentScenario.hint
                }
            });
        }, currentDelay);
        currentDelay += 5000; // 5 ثواني لقراءة التلميح
    }

    // بعد انتهاء العرض: الانتقال مباشرة إلى التصويت على الجاني
    setTimeout(() => {
        console.log(`⏰ Dramatic reveal finished. Starting discussion for room ${roomCode}`);
        startDiscussion(roomCode);
    }, currentDelay + 1000);
}

// ============================================
// 🗣️ DISCUSSION PHASE
// ============================================
function startDiscussion(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    console.log(`🗣️ Starting Discussion Phase for room ${roomCode}`);
    room.state = 'DISCUSSION';

    // 🕵️‍♂️ RESOLVE DETECTIVE ABILITY (Discussion Start)
    const detective = room.players.find(p => p.role === ROLE_TYPES.DETECTIVE);
    if (detective && detective.investigationTarget) {
        const target = room.players.find(p => p.id === detective.investigationTarget);
        if (target) {
            let roleInfo = getRoleInfo(target.role);
            let resultTeam = roleInfo ? roleInfo.team : TEAMS.JUSTICE;
            let resultTeamName = (resultTeam === TEAMS.CRIME) ? 'فريق الجريمة' : 'فريق العدالة';
            let isSabotaged = false;
            
            // Check Sabotage (Misdirection)
            if (target.sabotagedBy) {
                isSabotaged = true; // Internal flag, maybe useful for debugging but shouldn't spoil it
                
                // Flip the result
                if (resultTeam === TEAMS.CRIME) {
                    resultTeam = TEAMS.JUSTICE;
                    resultTeamName = 'فريق العدالة';
                } else {
                    resultTeam = TEAMS.CRIME;
                    resultTeamName = 'فريق الجريمة';
                }
                
                console.log(`Sabotage Effect: ${target.name} team flipped to ${resultTeamName}`);
            }

            // Emit result to Detective ONLY
            io.to(detective.id).emit('abilityResult', {
                type: 'INVESTIGATE',
                targetName: target.name,
                result: resultTeamName,
                isSabotaged: isSabotaged
            });
        }
        // Clear target so it doesn't trigger again
        detective.investigationTarget = null;
    }

    io.to(roomCode).emit('discussionStarted', {
        timer: 120
    });
}

// ============================================
// 🔍 PHASE 2: CULPRIT VOTING (مع أسماء)
// ============================================
function startCulpritVoting(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'CULPRIT_VOTING';
    room.culpritVotes = {}; // ✅ Reset votes to prevent carry-over/double counting

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
                // ✅ GUARD: Check if bot already voted
                if (room.culpritVotes[p.id] !== undefined) return;

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
                io.to(room.hostId).emit('voteReceived', {
                    phase: 'CULPRIT',
                    playerId: p.id,
                    playerName: p.name,
                    choice: culpritVote.identity,
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
    
    // Better logic: Check if all NON-ELIMINATED players have voted
    const activePlayers = room.players.filter(p => !p.eliminated);
    const voteCount = Object.keys(room.culpritVotes).length;

    console.log(`🔍 Culprit Voting: ${voteCount}/${activePlayers.length} votes received`);
    
    if (voteCount >= activePlayers.length) {
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
        // Random pick for now to avoid stuck game loop
        const randomIdx = Math.floor(Math.random() * candidates.length);
        const selectedId = candidates[randomIdx];
        resolveElimination(roomCode, selectedId);
        return;
    }
    
    if (candidates.length === 0) {
        // Should not happen, but safe fallback
         endRound(roomCode, { winner: 'DRAW', reason: 'لم يصوت أحد!' });
         return;
    }

    resolveElimination(roomCode, candidates[0]);
}

function resolveElimination(roomCode, eliminatedId) {
    const room = rooms[roomCode];
    const eliminatedPlayer = room.players.find(p => p.id === eliminatedId);
    
    if (!eliminatedPlayer) return;
    
    const roleInfo = getRoleInfo(eliminatedPlayer.role);
    
    // Mark as Eliminated
    eliminatedPlayer.eliminated = true;
    
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

/*
function calculateScores(room, result) {
    // ... Legacy function replaced by server/logic/scoring.js ...
    return {};
}
*/

function endRound(roomCode, result) {
    const room = rooms[roomCode];
    if (!room) return;

    room.roundOutcome = result ? result.winner : null; // Save outcome for Next Round Logic

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
        scores: results, // Renamed from results to scores to match Client
        teamScores,
        crimeTeamWon,
        investigationTeamWon,
        culpritCaught,
        crimeTeam: crimeMembers.map(p => ({ id: p.id, name: p.name, score: p.score, roleName: getRoleName(p.role) })), // Renamed to crimeTeam
        justiceTeam: investigationMembers.map(p => ({ id: p.id, name: p.name, score: p.score, roleName: getRoleName(p.role) })), // Renamed to justiceTeam
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

    // Remove Duplicate endDiscussion here (handled around line 1455)

    // Host creates a room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            hostId: socket.id,
            players: [],
            state: 'LOBBY', // LOBBY, PLAYING, END
            currentRound: 0,
            totalRounds: 3,
            usedScenarios: [],
            gameMode: 'CLASSIC' // CLASSIC or BLITZ
        };
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
        console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    // Update Game Settings (Host Only)
    socket.on('updateGameSettings', ({ roomCode, settings }) => {
        const room = rooms[roomCode];
        if (room && room.hostId === socket.id) {
            if (settings.gameMode) {
                room.gameMode = settings.gameMode;
            }
            if (settings.totalRounds) {
                room.totalRounds = settings.totalRounds;
            }
            
            // Notify all players in lobby
            io.to(roomCode).emit('gameSettingsUpdated', {
                gameMode: room.gameMode,
                totalRounds: room.totalRounds
            });
        }
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
                    isLeader: existingPlayer.isLeader,
                    gameMode: room.gameMode
                });

                console.log(`${playerName} reconnected to room ${roomCode}`);

                // If game is running, send current state
                if (room.state === 'PLAYING' || room.state === 'DRAFTING' || room.state === 'PRESENTATION' || room.state === 'VOTING' || room.state === 'QUALITY_VOTING' || room.state === 'CULPRIT_VOTING' || room.state === 'DISCUSSION' || room.state === 'DRAMATIC_REVEAL') {
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
                        socket.emit('startDrafting', { 
                            duration: 90,
                            caseTitle: room.currentScenario.title // Ensure title is sent on reconnect
                        }); // Approximate
                    } else if (room.state === 'PRESENTATION') {
                        socket.emit('startPresentation');
                    } else if (room.state === 'DISCUSSION') {
                        socket.emit('discussionStarted', {
                            timer: 120
                        });
                    } else if (room.state === 'QUALITY_VOTING') {
                        // Resend voting data
                        const anonymousAnswers = room.players.map(p => ({
                            index: room.players.indexOf(p),
                            answer: room.answers[p.id] || "...",
                            // Don't send names in Quality Voting
                        }));
                        socket.emit('qualityVotingStarted', {
                            scenarios: anonymousAnswers
                        });
                    } else if (room.state === 'CULPRIT_VOTING') {
                        // Resend voting data
                        const scenariosWithAuthors = room.players.map((p, index) => ({
                            index: index,
                            playerId: p.id,
                            playerName: p.name,
                            answer: room.answers[p.id] || "لم يكتب شيئاً..."
                        }));
                        socket.emit('culpritVotingStarted', {
                            scenarios: scenariosWithAuthors
                        });
                    } else if (room.state === 'DRAMATIC_REVEAL') {
                         socket.emit('dramaticRevealStarted', {
                            totalScenarios: room.players.length
                        });
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
                
                // If Eliminated, ensure they get spectator role info
                if (existingPlayer.eliminated) {
                    socket.emit('roleAssigned', {
                        role: 'SPECTATOR',
                        roleName: 'مستبعد',
                        description: 'لقد تم إقصاؤك من اللعبة. يمكنك المشاهدة فقط.',
                        info: 'انتظر حتى نهاية الجولة.',
                        round: room.currentRound,
                        totalRounds: room.totalRounds,
                        isTutorial: room.isTutorial,
                        isSpectator: true
                    });
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
                isLeader: isLeader,
                gameMode: room.gameMode
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

    // ✅ Add Single Bot (Host Action)
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

        // Add ONE bot if space available (Max 8)
        if (room.players.length < 8) {
            const botCount = room.players.filter(p => p.isBot).length + 1;
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

            // Notify everyone
            io.to(roomCode).emit('playerJoined', room.players);
            console.log(`🤖 Added 1 bot to room ${roomCode} by host request`);
        } else {
            socket.emit('error', 'العدد مكتمل (الحد الأقصى 8)');
        }
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
        room.answers = {};
        room.votes = {};
        room.drafts = {};
        room.qualityVotes = {};
        room.culpritVotes = {};
        room.submissionTimes = {};
        room.roundOutcome = null;
        
        // 🔄 Notify Players about New Round
        io.to(roomCode).emit('newRoundStarted', {
            round: room.currentRound,
            totalRounds: room.totalRounds
        });

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

        // Reset elimination status for all players for the new round
        room.players.forEach(p => {
            p.eliminated = false;
        });

        // Assign Roles to ALL players
        assignRoles(room, room.players, roomCode);
    }


        

            




        










    // Assign Roles Logic
    function assignRoles(room, players, passedRoomCode) {
        // 1️⃣ Shuffle players
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

        // 2️⃣ Get roles for count
        const rolesForCount = getRolesForPlayerCount(players.length);

        // 3️⃣ Assign roles
        let roleIndex = 0;
        shuffledPlayers.forEach((player) => {
            // Keep preferred role if set (for debugging/tutorial)
            if (!player.preferredRole) {
                player.role = rolesForCount[roleIndex];
                roleIndex++;
            } else {
                // If preferred role used, remove it from available roles if possible
                const prefIndex = rolesForCount.indexOf(player.preferredRole);
                if (prefIndex > -1) {
                    rolesForCount.splice(prefIndex, 1);
                }
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
            player.investigationTarget = null;
            player.sabotageTarget = null;
            
            // Log for debugging
            console.log(`Assigned ${player.role} to ${player.name}`);
        });

        // Special Role Intel Logic
        const crimeTeam = shuffledPlayers.filter(p => {
             const info = getRoleInfo(p.role);
             return info && info.team === TEAMS.CRIME;
        });
        
        const beneficiary = shuffledPlayers.find(p => p.role === ROLE_TYPES.BENEFICIARY);
        const detective = shuffledPlayers.find(p => p.role === ROLE_TYPES.DETECTIVE);

        // Assign and send role data
        const roomCode = passedRoomCode || room.id || Object.keys(rooms).find(key => rooms[key] === room); // Try to find ID

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
            // Witness gets Keywords
            else if (role === ROLE_TYPES.WITNESS) {
                specialInfo = {
                    type: 'WITNESS_INTEL',
                    keywords: room.currentScenario.keywords
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
                score: player.score,
                round: room.currentRound,
                totalRounds: room.totalRounds,
                isTutorial: room.isTutorial
            };

            io.to(player.id).emit('roleAssigned', roleData);
        });
        
        // Notify Host
        if (roomCode) {
            io.to(roomCode).emit('gameStarted', {
                title: room.isTutorial ? `(تدريب) ${room.currentScenario.title}` : room.currentScenario.title,
                round: room.currentRound,
                totalRounds: room.totalRounds,
                isTutorial: room.isTutorial,
                roomCode: roomCode
            });
            console.log(`Round ${room.currentRound} started in room ${roomCode}`);
            
            // Start Drafting Phase after 5 seconds
            setTimeout(() => {
                startDraftingPhase(roomCode);
            }, 5000);
        }
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
                player.sabotageTarget = targetId; // Track who Saboteur targeted for Scoring
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

    // ============================================
    // 💰 V4 OFFERS MECHANISM
    // ============================================
    socket.on('sendOffer', ({ roomCode, targetId, amount, isViaMastermind }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        const result = handleSendOffer(io, room, player, { targetId, amount, isViaMastermind });
        if (result.success) {
            socket.emit('offerResult', { success: true, message: result.message });
        } else {
            socket.emit('offerResult', { success: false, message: result.message });
        }
    });

    socket.on('respondToOffer', ({ roomCode, offerId, accepted }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        handleOfferResponse(io, room, player, { offerId, accepted });
    });

    socket.on('mastermindSelectTarget', ({ roomCode, targetId, amount }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player && player.role === ROLE_TYPES.MASTERMIND) {
             handleMastermindForward(io, room, player, { targetId, amount });
             socket.emit('offerResult', { success: true, message: 'تم تحويل العرض بنجاح.' });
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

        // Check Round Restriction (Abilities start from Round 2, except Seer and Witness)
        // Seer and Witness use abilities implicitly or explicitly at different times.
        // Detective/Saboteur usually R2+.
        // Let's stick to simple rules: Abilities available always or per role logic.
        
        // But wait, user said "adjust roles and abilities so they can be used effectively".
        // Let's remove the restriction "Round < 2" if it blocks fun, or keep it if game balance requires.
        // Usually investigation starts after some evidence. Round 1 has evidence (Drafts).
        // So Round 1 Drafting phase -> Use ability?
        // Detective checks AFTER drafting? Or during?
        // In UI, it is used during Drafting phase.
        // Let's allow it in Round 1 too, to make it more interactive from start.
        
        if (player.role === ROLE_TYPES.SEER && abilityType === 'REVELATION') {
             // 🔮 Seer Ability: Auto-submit Real Story (Silent)
             
             let answerText = "";

             if (room.gameMode === 'BLITZ') {
                 // Blitz Mode: Unreliable Revelation (70% Accuracy)
                 const template = room.currentScenario.template;
                 const blanks = room.currentScenario.blanks || [];
                 const parts = template.split('_____');
                 
                 const revealedBlanks = [];
                 
                 // We only need to generate the "blanks" values
                 // The client will reconstruct the story
                 for (let i = 0; i < parts.length - 1; i++) {
                     if (Math.random() < 0.7) {
                         revealedBlanks.push(blanks[i] || "_____");
                     } else {
                         revealedBlanks.push("???"); // 30% failure
                     }
                 }
                 
                 // Send to player to fill their inputs
                 socket.emit('fillBlitzBlanks', { blanks: revealedBlanks });
                 
                 player.abilityUsed = true;
                 return; // Don't submit, let them edit and submit
                 
             } else {
                 // Classic Mode: Full Story
                 const realStory = room.currentScenario.fullStory || room.currentScenario.story;
                 answerText = Array.isArray(realStory) ? realStory.join('\n') : realStory;
                 
                 // 1. Submit as Answer
                 room.answers[socket.id] = answerText;
                 
                 // 2. Track submission time
                 if (!room.submissionTimes) room.submissionTimes = {};
                 room.submissionTimes[socket.id] = Date.now();
                 
                 // 3. Mark ability used
                 player.abilityUsed = true;
                 
                 // 4. Notify Host
                 io.to(room.hostId).emit('playerSubmitted', { playerId: player.id, playerName: player.name });
                 
                 // 5. Notify Seer (Success without content)
                 socket.emit('abilityResult', {
                     type: 'REVELATION_SUCCESS',
                     message: 'تم نسخ القصة الحقيقية وإرسالها بنجاح! (لم تظهر لك لضمان السرية)'
                 });
                 
                 // 6. Check if phase complete
                 checkDraftingComplete(roomCode);
             }
             
        } else if (player.role === ROLE_TYPES.DETECTIVE && abilityType === 'INVESTIGATE') {
            // 🕵️ Detective Ability
            const targetPlayer = room.players.find(p => p.id === targetId);
            if (!targetPlayer) return;

            // Store request instead of executing immediately
            player.investigationTarget = targetId;
            player.abilityUsed = true;
            
            socket.emit('abilityResult', {
                type: 'INVESTIGATE',
                targetName: targetPlayer.name,
                result: 'قيد المعالجة... ستظهر النتيجة بعد انتهاء التصويت على السيناريوهات.',
                isPending: true
            });
            
        } else if (player.role === ROLE_TYPES.WITNESS && abilityType === 'FLASH_MEMORY') {
             // 👁️ Witness Ability: Show keywords again
             socket.emit('abilityResult', {
                 type: 'FLASH_MEMORY',
                 keywords: room.currentScenario.keywords
             });
             player.abilityUsed = true;

        } else if (player.role === ROLE_TYPES.SABOTEUR && abilityType === 'SABOTAGE') {
             // 🧨 Saboteur Ability
             const targetPlayer = room.players.find(p => p.id === targetId);
             if (!targetPlayer) return;
             
             targetPlayer.sabotagedBy = player.id;
             
             socket.emit('abilityResult', {
                 type: 'SABOTAGE',
                 message: `تم تخريب سجل ${targetPlayer.name}. سيظهر عكس حقيقته للمحقق.`
             });
             
             player.abilityUsed = true;
        }
    });

    // Legacy Handlers Removed (detectiveCheck, saboteurSabotage, seerReveal)
    // All abilities should use 'useAbility' event now.

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
            io.to(room.hostId).emit('voteReceived', {
                phase: 'QUALITY',
                playerId: player.id,
                playerName: player.name,
                choice: scenarioIndex,
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

            // ⛔ Prevent eliminated players from voting
            if (player.eliminated) {
                socket.emit('error', 'أنت مستبعد من التصويت!');
                return;
            }
            
            // Prevent self-voting
            if (playerId === socket.id) return;
            
            // ⛔ Prevent voting for eliminated players
            const targetPlayer = room.players.find(p => p.id === playerId);
            if (targetPlayer && targetPlayer.eliminated) {
                socket.emit('error', 'هذا اللاعب مستبعد بالفعل!');
                return;
            }
            
            room.culpritVotes[socket.id] = playerId;
            
            // 🆕 إرسال للهوست أن اللاعب صوّت
            io.to(room.hostId).emit('voteReceived', {
                phase: 'CULPRIT',
                playerId: player.id,
                playerName: player.name,
                choice: playerId,
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
            const voter = room.players.find(p => p.id === socket.id);
            if (!voter || voter.isExcluded) return; // Prevent excluded players from voting

            if (room.state === 'QUALITY_VOTING') {
                room.qualityVotes[socket.id] = qualityVote;
                checkQualityVotingComplete(roomCode);
            } else if (room.state === 'CULPRIT_VOTING') {
                const target = room.players.find(p => p.id === identityVote);
                
                // Prevent voting for excluded players
                if (target && target.isExcluded) {
                    socket.emit('error', 'لا يمكنك التصويت للاعب مستبعد!');
                    return;
                }

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
                room.roundOutcome = null; 
                // Notify players we are returning to Discussion/Game (Round continues)
                io.to(roomCode).emit('roundContinued', { round: room.currentRound });
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
