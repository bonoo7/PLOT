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
        methods: ["GET", "POST"]
    }
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

    io.to(roomCode).emit('startDrafting', { duration });

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

    // 🎁 قدرة المزور - التركيب الذكي: كلمة رابعة بعد 60 ثانية
    const forger = room.players.find(p => p.role === ROLE_TYPES.FORGER || p.role === 'ARCHITECT');
    if (forger && room.currentScenario.keywords.length >= 4) {
        setTimeout(() => {
            const fourthKeyword = room.currentScenario.keywords[3];
            io.to(forger.id).emit('forgerBonus', { keyword: fourthKeyword });
            console.log(`✨ قدرة المزور: تم إرسال الكلمة الرابعة "${fourthKeyword}" لـ ${forger.name}`);
        }, 30000); // بعد 30 ثانية (معدّل من 60 لأن المدة الكلية 90)
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
                    answer: scenario.answer,
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
                    authorName: scenario.playerName
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

    // بعد انتهاء العرض: بدء المرحلة الثانية
    setTimeout(() => {
        startCulpritVoting(roomCode);
    }, currentDelay + 1000);
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
        console.log(`✅ All votes received, ending round...`);
        endRound(roomCode);
    }
}

function calculateScores(room) {
    const scores = {};
    const breakdown = {};  // تفصيل النقاط لكل لاعب
    const teamScores = {
        [TEAMS.CRIME]: 0,
        [TEAMS.INVESTIGATION]: 0,
        [TEAMS.NEUTRAL]: 0
    };

    // Initialize for all players
    room.players.forEach(p => {
        scores[p.id] = 0;
        breakdown[p.id] = [];
    });

    // Find key roles using new role IDs (with fallback to old ones)
    const culprit = room.players.find(p => p.role === ROLE_TYPES.CULPRIT || p.role === 'WITNESS');
    const forger = room.players.find(p => p.role === ROLE_TYPES.FORGER || p.role === 'ARCHITECT');
    const chiefDetective = room.players.find(p => p.role === ROLE_TYPES.CHIEF_DETECTIVE || p.role === 'DETECTIVE');
    const infiltrator = room.players.find(p => p.role === ROLE_TYPES.INFILTRATOR || p.role === 'SPY');
    const accomplice = room.players.find(p => p.role === ROLE_TYPES.ACCOMPLICE || p.role === 'ACCOMPLICE');
    const lawyer = room.players.find(p => p.role === ROLE_TYPES.LAWYER || p.role === 'LAWYER');
    const saboteur = room.players.find(p => p.role === ROLE_TYPES.SABOTEUR || p.role === 'TRICKSTER');

    // ============================================
    // 1. نقاط أصوات الجودة (Quality Votes)
    // ============================================
    // حساب عدد الأصوات لكل سيناريو
    const qualityVoteCounts = {}; // { scenarioIndex: count }
    
    room.players.forEach((player, index) => {
        qualityVoteCounts[index] = 0;
    });

    Object.values(room.qualityVotes).forEach(scenarioIndex => {
        qualityVoteCounts[scenarioIndex]++;
    });

    // منح النقاط لكل لاعب حسب عدد أصوات الجودة
    room.players.forEach((player, index) => {
        const count = qualityVoteCounts[index] || 0;
        if (count > 0) {
            const points = count * 200; // 200 نقطة لكل صوت جودة
            scores[player.id] += points;
            breakdown[player.id].push(`✨ جودة السيناريو: +${points} (${count} × 200)`);
        }
    });

    // نقاط الكتابة في الوقت المناسب (+100 لكل من أرسل)
    room.players.forEach(p => {
        if (room.answers[p.id]) {
            scores[p.id] += 100;
            breakdown[p.id].push(`⏰ كتابة في الوقت: +100`);
        }
    });

    // ============================================
    // 2. تحليل أصوات الجاني (Culprit Votes)
    // ============================================
    const culpritVoteCounts = {}; // { playerId: count }
    
    room.players.forEach(p => {
        culpritVoteCounts[p.id] = 0;
    });

    Object.values(room.culpritVotes).forEach(playerId => {
        culpritVoteCounts[playerId]++;
    });

    // تحديد من حصل على أكثر الأصوات
    const totalPlayers = room.players.length;
    const culpritVotes = culpritVoteCounts[culprit?.id] || 0;
    const culpritCaught = culprit && culpritVotes >= (totalPlayers / 2); // 50% أو أكثر

    // ============================================
    // 3. منطق فوز/خسارة الفرق
    // ============================================
    let crimeTeamWon = false;
    let investigationTeamWon = false;

    // تحديد الفريق الفائز (بناءً على الأغلبية)
    if (culpritCaught) {
        investigationTeamWon = true;
        breakdown[culprit.id] = breakdown[culprit.id] || [];
        breakdown[culprit.id].push(`🚨 تم القبض عليك من المحقق!`);
    } else if (!culpritCaught) {
        crimeTeamWon = true;
        breakdown[culprit.id] = breakdown[culprit.id] || [];
        breakdown[culprit.id].push(`✅ نجوت من الاتهام!`);
    }

    // ============================================
    // 4. مكافآت ومعاقبات الفرق
    // ============================================
    if (crimeTeamWon) {
        const crimeMembers = room.players.filter(p => {
            const roleInfo = getRoleInfo(p.role);
            return roleInfo && roleInfo.team === TEAMS.CRIME;
        });

        // مكافأة جماعية للفريق (+2500 لكل عضو)
        crimeMembers.forEach(p => {
            scores[p.id] += 2500;
            breakdown[p.id].push(`🔴 فوز فريق الجريمة: +2500`);
            teamScores[TEAMS.CRIME] += 2500;
        });

        // مكافأة الجاني (إضافية)
        if (culprit) {
            scores[culprit.id] += 500;
            breakdown[culprit.id].push(`🎭 الجاني نجا: +500 إضافية`);
        }

        // مكافأة المزور إذا تفوق على الجاني (في Quality Votes)
        const culpritQualityVotes = qualityVoteCounts[room.players.findIndex(p => p.id === culprit?.id)] || 0;
        const forgerIndex = room.players.findIndex(p => p.id === forger?.id);
        const forgerQualityVotes = qualityVoteCounts[forgerIndex] || 0;
        
        if (forger && forgerQualityVotes >= culpritQualityVotes && forgerQualityVotes > 0) {
            scores[forger.id] += 2000;
            breakdown[forger.id].push(`🧩 المزور تفوق: +2000 (${forgerQualityVotes} أصوات)`);
            
            // مكافأة للفريق
            crimeMembers.forEach(p => {
                if (p.id !== forger.id) {
                    scores[p.id] += 500;
                    breakdown[p.id].push(`🧩 المزور نجح: +500`);
                }
            });
        }
    } else if (investigationTeamWon) {
        // عقوبة فريق الجريمة
        const crimeMembers = room.players.filter(p => {
            const roleInfo = getRoleInfo(p.role);
            return roleInfo && roleInfo.team === TEAMS.CRIME;
        });

        // الجاني يخسر 60%
        if (culprit) {
            const culpritScore = scores[culprit.id];
            const penalty = Math.floor(culpritScore * 0.6);
            scores[culprit.id] -= penalty;
            breakdown[culprit.id].push(`❌ تم القبض عليك: -60% (-${penalty} نقطة)`);
        }

        // الشريك يخسر 30%
        if (accomplice) {
            const accompliceScore = scores[accomplice.id];
            const penalty = Math.floor(accompliceScore * 0.3);
            scores[accomplice.id] -= penalty;
            breakdown[accomplice.id].push(`⚠️ فشل في حماية الجاني: -30% (-${penalty} نقطة)`);
        }
    }

    // ============================================
    // 5. مكافآت فريق التحقيق
    // ============================================
    if (investigationTeamWon) {
        const investigationMembers = room.players.filter(p => {
            const roleInfo = getRoleInfo(p.role);
            return roleInfo && roleInfo.team === TEAMS.INVESTIGATION;
        });

        // مكافأة جماعية للفريق (+2000 لكل عضو)
        investigationMembers.forEach(p => {
            scores[p.id] += 2000;
            breakdown[p.id].push(`🔵 فوز فريق التحقيق: +2000`);
            teamScores[TEAMS.INVESTIGATION] += 2000;
        });

        // مكافأة المحقق الرئيسي إذا صوّت للجاني الصحيح (+500)
        if (chiefDetective && room.culpritVotes[chiefDetective.id] === culprit?.id) {
            scores[chiefDetective.id] += 500;
            breakdown[chiefDetective.id].push(`🎯 المحقق صوّت صح: +500 إضافية`);
        }
    } else if (crimeTeamWon) {
        // لا عقوبة على المحقق (الأغلبية هي من فشلت)
    }

    // نقاط استنتاج عامة (لجميع اللاعبين الذين صوّتوا صح)
    room.players.forEach(p => {
        if (room.culpritVotes[p.id] === culprit?.id) {
            // لا نعطي نقاط إضافية هنا لأن الفوز الجماعي يعطي مكافأة للفريق
            // لكن يمكن إضافة نقاط صغيرة للتشجيع
            if (p.id !== chiefDetective?.id) { // المحقق أخذ مكافأته
                scores[p.id] += 100;
                breakdown[p.id].push(`✅ صوّت للجاني الصحيح: +100`);
            }
        }
    });

    // ============================================
    // 6. مكافآت خاصة للأدوار
    // ============================================

    // المحامي - حماية الموكل
    if (lawyer && lawyer.lawyerClient) {
        const clientVotes = culpritVoteCounts[lawyer.lawyerClient] || 0;
        if (clientVotes === 0 || !culpritCaught) {
            scores[lawyer.id] += 1500;
            breakdown[lawyer.id].push(`⚖️ حماية الموكل: +1500`);
        }
    }

    // المخترق - تقليد الجاني (Quality Votes)
    const infiltratorIndex = room.players.findIndex(p => p.id === infiltrator?.id);
    const culpritIndex = room.players.findIndex(p => p.id === culprit?.id);
    
    const infiltratorVotes = qualityVoteCounts[infiltratorIndex] || 0;
    const culpritQualityVotes = qualityVoteCounts[culpritIndex] || 0;
    
    if (infiltrator && Math.abs(infiltratorVotes - culpritQualityVotes) <= 1 && infiltratorVotes > 0) {
        scores[infiltrator.id] += 1500;
        breakdown[infiltrator.id].push(`🕵️ تقليد ممتاز: +1500 (${infiltratorVotes} أصوات)`);
    }

    // المخرب - الفوضى الإبداعية (Quality Votes)
    const saboteurIndex = room.players.findIndex(p => p.id === saboteur?.id);
    const saboteurVotes = qualityVoteCounts[saboteurIndex] || 0;
    
    if (saboteur && saboteurVotes >= 2) {
        scores[saboteur.id] += 3000;
        breakdown[saboteur.id].push(`😈 الفوضى الناجحة: +3000 (${saboteurVotes} أصوات)`);
        
        // مكافأة إضافية إذا لم يكتشف
        if (identityVotes[saboteur.id] === 0) {
            scores[saboteur.id] += 1500;
            breakdown[saboteur.id].push(`😈 لم يكتشف: +1500`);
        }
    }

    // استخدام القدرات بنجاح (+300)
    room.players.forEach(p => {
        if (room.abilitiesUsed && room.abilitiesUsed[p.id]) {
            scores[p.id] += 300;
            breakdown[p.id].push(`⚡ استخدام قدرة: +300`);
        }
    });

    // Add 0 score note for players with no breakdown
    room.players.forEach(p => {
        if (!breakdown[p.id] || breakdown[p.id].length === 0) {
            if (!breakdown[p.id]) breakdown[p.id] = [];
            breakdown[p.id].push(`لم يحصل على نقاط إضافية`);
        }
    });

    return { 
        scores, 
        breakdown,
        teamScores,
        crimeTeamWon,
        investigationTeamWon,
        culpritCaught // تم تعريفه في السطر 475
    };
}

function endRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const { scores: roundScores, breakdown, teamScores, crimeTeamWon, investigationTeamWon, culpritCaught } = calculateScores(room);

    // Update total scores
    room.players.forEach(p => {
        p.score += (roundScores[p.id] || 0);
    });

    // حساب أعضاء الفرق
    const crimeMembers = room.players.filter(p => {
        const roleInfo = getRoleInfo(p.role);
        return roleInfo && roleInfo.team === TEAMS.CRIME;
    });
    
    const investigationMembers = room.players.filter(p => {
        const roleInfo = getRoleInfo(p.role);
        return roleInfo && roleInfo.team === TEAMS.INVESTIGATION;
    });

    const results = room.players.map(p => {
        // Ensure breakdown is valid
        let playerBreakdown = breakdown[p.id];
        if (!playerBreakdown || !Array.isArray(playerBreakdown) || playerBreakdown.length === 0) {
            playerBreakdown = ["لم يحصل على نقاط إضافية"];
        }

        const roleInfo = getRoleInfo(p.role);

        return {
            name: p.name,
            role: getRoleName(p.role),
            roleId: p.role,
            team: roleInfo ? roleInfo.team : TEAMS.NEUTRAL,
            teamName: roleInfo && roleInfo.team === TEAMS.CRIME ? 'فريق الجريمة' : 
                     roleInfo && roleInfo.team === TEAMS.INVESTIGATION ? 'فريق التحقيق' : 'محايد',
            roundScore: roundScores[p.id] || 0,
            totalScore: p.score,
            breakdown: playerBreakdown
        };
    }).sort((a, b) => b.totalScore - a.totalScore);

    // إرسال النتائج مع معلومات الفريق
    io.to(roomCode).emit('roundResults', { 
        results,
        teamScores,
        crimeTeamWon,
        investigationTeamWon,
        culpritCaught,
        crimeMembers: crimeMembers.map(p => ({ name: p.name, score: p.score })),
        investigationMembers: investigationMembers.map(p => ({ name: p.name, score: p.score }))
    });
    room.state = 'RESULTS';
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

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

                // Add player first
                room.players.push(player);
                socket.join(roomCode.toUpperCase());

                // Fill with Bots (Total 8 players)
                let botCount = 0;
                while (room.players.length < 8) {
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

        // Assign Roles (NEW SYSTEM - Teams)
        let shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random());
        const rolesForCount = getRolesForPlayerCount(shuffledPlayers.length);
        
        // Shuffle roles
        let shuffledRoles = [...rolesForCount].sort(() => 0.5 - Math.random());

        // Handle Tutorial Forced Role
        if (room.isTutorial && room.tutorialData) {
            const { userId, role } = room.tutorialData;
            const targetPlayerIndex = shuffledPlayers.findIndex(p => p.id === userId);

            if (targetPlayerIndex !== -1) {
                // Remove target player from shuffle list temporarily
                const targetPlayer = shuffledPlayers[targetPlayerIndex];
                shuffledPlayers.splice(targetPlayerIndex, 1);

                // Assign role to target player
                targetPlayer.role = role;

                // Remove that role from available roles
                const roleIndex = shuffledRoles.indexOf(role);
                if (roleIndex !== -1) {
                    shuffledRoles.splice(roleIndex, 1);
                } else {
                    shuffledRoles.shift();
                }

                // Assign roles to others
                shuffledPlayers.forEach((player, index) => {
                    player.role = shuffledRoles[index];
                });

                // Add target player back
                shuffledPlayers.push(targetPlayer);
            } else {
                // Fallback if player not found
                shuffledPlayers.forEach((player, index) => {
                    player.role = shuffledRoles[index];
                });
            }
        } else {
            // Standard Assignment
            shuffledPlayers.forEach((player, index) => {
                player.role = shuffledRoles[index];
            });
        }

        // Find special roles for relationship logic
        const culpritPlayer = shuffledPlayers.find(p => p.role === ROLE_TYPES.CULPRIT);
        const accomplicePlayer = shuffledPlayers.find(p => p.role === ROLE_TYPES.ACCOMPLICE);
        const lawyerPlayer = shuffledPlayers.find(p => p.role === ROLE_TYPES.LAWYER);

        // Assign Lawyer's Client (if Lawyer exists)
        if (lawyerPlayer) {
            // Pick a random player from Crime team (excluding Lawyer himself)
            const crimeTeamMembers = shuffledPlayers.filter(p => {
                const roleInfo = getRoleInfo(p.role);
                return roleInfo && roleInfo.team === TEAMS.CRIME && p.id !== lawyerPlayer.id;
            });
            
            if (crimeTeamMembers.length > 0) {
                const client = crimeTeamMembers[Math.floor(Math.random() * crimeTeamMembers.length)];
                lawyerPlayer.lawyerClient = client.id;
            }
        }

        // Assign and send role data
        shuffledPlayers.forEach((player) => {
            const role = player.role;
            const roleInfo = getRoleInfo(role);
            
            if (!roleInfo) {
                console.error(`Role info not found for: ${role}`);
                return;
            }

            let roleData = {
                role: role,
                roleName: roleInfo.nameAr,
                roleNameEn: roleInfo.nameEn,
                description: roleInfo.description,
                goal: roleInfo.goal,
                team: roleInfo.team,
                teamName: roleInfo.team === TEAMS.CRIME ? 'فريق الجريمة' : 
                         roleInfo.team === TEAMS.INVESTIGATION ? 'فريق التحقيق' : 'محايد',
                emoji: roleInfo.emoji,
                ability: roleInfo.ability,
                info: null,
                round: room.currentRound,
                totalRounds: room.totalRounds,
                isTutorial: room.isTutorial
            };

            // Assign role-specific information
            if (role === ROLE_TYPES.CULPRIT) {
                roleData.info = room.currentScenario.story;
            } else if (role === ROLE_TYPES.FORGER) {
                roleData.info = `كلماتك المفتاحية: ${room.currentScenario.keywords.join(' - ')}`;
            } else if (role === ROLE_TYPES.CHIEF_DETECTIVE || role === ROLE_TYPES.ANALYST || role === ROLE_TYPES.OFFICER) {
                roleData.info = `عنوان القضية: ${room.currentScenario.title}`;
            } else if (role === ROLE_TYPES.ACCOMPLICE) {
                roleData.info = `الجاني هو: ${culpritPlayer ? culpritPlayer.name : 'غير معروف'}. احمه!`;
                roleData.targetPlayer = culpritPlayer ? culpritPlayer.name : null;
            } else if (role === ROLE_TYPES.LAWYER) {
                const clientPlayer = shuffledPlayers.find(p => p.id === player.lawyerClient);
                roleData.info = `موكلك هو: ${clientPlayer ? clientPlayer.name : 'غير معروف'}. دافع عنه!`;
                roleData.targetPlayer = clientPlayer ? clientPlayer.name : null;
            } else if (role === ROLE_TYPES.SABOTEUR) {
                roleData.info = `كلمتك الدخيلة: ${room.currentScenario.tricksterWord}`;
            } else if (role === ROLE_TYPES.WITNESS) {
                roleData.info = "لا توجد معلومات إضافية. راقب وحلل.";
            } else {
                roleData.info = "انتظر التعليمات...";
            }

            io.to(player.id).emit('roleAssigned', roleData);
        });

        // 😈 قدرة المخرب - الفوضى الإبداعية: رؤية جميع الأدوار لمدة 2 ثانية
        const saboteur = shuffledPlayers.find(p => p.role === ROLE_TYPES.SABOTEUR || p.role === 'TRICKSTER');
        if (saboteur && room.currentRound === 1) {
            // فقط في الجولة الأولى
            const allRoles = shuffledPlayers.map(p => ({
                name: p.name,
                role: getRoleName(p.role),
                emoji: getRoleInfo(p.role)?.emoji || '❓'
            }));
            
            io.to(saboteur.id).emit('saboteurReveal', { 
                roles: allRoles, 
                duration: 2000  // 2 ثانية
            });
            console.log(`😈 قدرة المخرب: كشف الأدوار لـ ${saboteur.name}`);
        }

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
            startNewRound(roomCode);
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
