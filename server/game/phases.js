
const { rooms } = require('../state');
const scenarios = require('../scenarios');
const { TEAMS, ROLE_TYPES, ROLES, getRoleInfo, getRolesForPlayerCount, getTeamMembers } = require('../roles');
const { getRoleName, getRoleDescription, getRoleGoal, getRoleTeam, generateRoomCode, buildBotKnowledge } = require('../utils/serverUtils');
const { calculateScores } = require('../logic/scoring');
const { generateBotAnswer, analyzeSuspicion, generateBotVote, generateQualityVote, generateSmartCulpritVote, generateSmartQualityVote, shouldUseAbility } = require('../botAI');

let ioInstance;
function initPhases(io) { ioInstance = io; }

function executeBotAbilities(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const bots = room.players.filter(p => p.isBot && !p.eliminated);
    const validTargets = room.players.filter(p => !p.eliminated);

    bots.forEach(bot => {
        // 1. المحقق: يفحص لاعباً عشوائياً (لا يعرف من هو الجاني)
        if (bot.role === 'DETECTIVE' && !bot.abilityUsed) {
            const targets = validTargets.filter(p => p.id !== bot.id);
            if (targets.length > 0) {
                const target = targets[Math.floor(Math.random() * targets.length)];
                const targetTeam = getRoleInfo(target.role)?.team;

                bot.investigationResult = {
                    targetId: target.id,
                    targetName: target.name,
                    targetTeam
                };
                bot.abilityUsed = true;
                console.log(`🤖 [BOT] Detective ${bot.name} investigated ${target.name} (${targetTeam})`);
            }
        }

        // 2. المخرب: يخرب بشكل عشوائي أو يستهدف المحقق إذا عرفه (نادر)
        else if (bot.role === 'SABOTEUR' && !bot.abilityUsed) {
            const targets = validTargets.filter(p => p.id !== bot.id && getRoleInfo(p.role)?.team !== 'CRIME');
            if (targets.length > 0) {
                const target = targets[Math.floor(Math.random() * targets.length)];

                // تطبيق التخريب الفعلي — ينعكس على نتيجة تحقيق المحقق
                target.sabotagedBy = bot.id;
                target.sabotageType = 'INVESTIGATION_FLIP';

                bot.abilityUsed = true;
                console.log(`🤖 [BOT] Saboteur ${bot.name} sabotaged ${target.name}`);
            }
        }

        // 3. العراف: يكشف القصة الحقيقية (بنسبة 50% لعدم كشف نفسه فوراً)
        else if (bot.role === 'SEER' && !bot.abilityUsed) {
            if (Math.random() > 0.5) {
                // استبدال إجابة العراف بالقصة الحقيقية
                room.answers[bot.id] = `(وحي العراف): ${room.currentScenario.solution}`;
                bot.abilityUsed = true;
                console.log(`🤖 [BOT] Seer ${bot.name} used revelation`);
            }
        }
    });
}

function checkDraftingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.state !== 'DRAFTING') return;

    const activePlayers = room.players.filter(p => !p.eliminated);
    const submittedCount = Object.keys(room.answers).filter(id => {
        const p = room.players.find(pl => pl.id === id);
        return p && !p.eliminated;
    }).length;

    if (submittedCount >= activePlayers.length) {
        clearInterval(room.timer);
        executeBotAbilities(roomCode); // 🤖 قدرات البوتات قبل التصويت
        startPresentationPhase(roomCode);
    }
}

// ============================================
// 🤖 BOT ABILITIES & KNOWLEDGE
// ============================================


function startDraftingPhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'DRAFTING';
    room.draftStartTime = Date.now();
    room.answers = {};
    room.drafts = {}; // Reset drafts
    const duration = 90; // seconds

    // Only active players participate
    const waitingFor = room.players.filter(p => !p.eliminated).map(p => p.id);

    ioInstance.to(roomCode).emit('startDrafting', {
        duration,
        waitingFor,
        caseTitle: room.currentScenario.title, // Add case title for UI
        template: room.gameMode === 'BLITZ' ? room.currentScenario.template : null
    });

    // 📺 Host Hint: Show simple hint on Host Screen
    if (room.hostId && room.currentScenario.simpleHint) {
        ioInstance.to(room.hostId).emit('hostHint', { hint: room.currentScenario.simpleHint });
    }

    // Start Timer
    let timeLeft = duration;
    room.timer = setInterval(() => {
        timeLeft--;
        ioInstance.to(roomCode).emit('timerUpdate', timeLeft);

        if (timeLeft <= 0) {
            clearInterval(room.timer);
            startPresentationPhase(roomCode);
        }
    }, 1000);

    // Witness Flash Memory (V4)
    const witness = room.players.filter(p => p.role === ROLE_TYPES.WITNESS && !p.eliminated);
    witness.forEach(w => {
        let flashKeywords = room.currentScenario.keywords;

        if (room.gameMode === 'BLITZ') {
            // In Blitz, filter out keywords that are actually the answers (blanks)
            const blanks = room.currentScenario.blanks || [];
            // Filter keywords that are NOT contained in any blank
            flashKeywords = flashKeywords.filter(k =>
                !blanks.some(b => b.includes(k) || k.includes(b))
            );

            if (flashKeywords.length === 0) {
                flashKeywords = room.currentScenario.keywords.slice(0, 3);
            }
        }

        ioInstance.to(w.id).emit('witnessFlash', {
            keywords: flashKeywords
        });
    });

    // ✅ الجاني: يُرسل السيناريو الحقيقي تلقائياً (لا يكتب بنفسه)
    const culprits = room.players.filter(p => p.role === ROLE_TYPES.CULPRIT && !p.eliminated && !p.isBot);
    culprits.forEach(culprit => {
        let culpritAnswer = '';

        if (room.gameMode === 'BLITZ' && room.currentScenario.template && room.currentScenario.blanks) {
            // في وضع Blitz: يملأ الفراغات بالإجابات الصحيحة تلقائياً
            let filled = room.currentScenario.template;
            room.currentScenario.blanks.forEach(blank => {
                filled = filled.replace('_____', blank);
            });
            culpritAnswer = filled;
        } else {
            // في وضع Classic: يُرسل القصة الكاملة
            const realStory = room.currentScenario.fullStory || room.currentScenario.story;
            culpritAnswer = Array.isArray(realStory) ? realStory.join('\n') : (realStory || '');
        }

        // تسجيل الإجابة تلقائياً
        room.answers[culprit.id] = culpritAnswer;
        if (!room.submissionTimes) room.submissionTimes = {};
        room.submissionTimes[culprit.id] = Date.now() + 2000; // بعد ثانيتين

        // إبلاغ الجاني أن التقرير تم إرساله تلقائياً
        setTimeout(() => {
            if (!rooms[roomCode]) return;
            ioInstance.to(culprit.id).emit('culpritAutoSubmit', {
                answer: culpritAnswer,
                message: '📋 تم إرسال القصة الحقيقية تلقائياً بصفتك الجاني.'
            });
            ioInstance.to(room.hostId).emit('playerSubmitted', { playerId: culprit.id, playerName: culprit.name });
            checkDraftingComplete(roomCode);
        }, 2000);
    });

    // Handle Bots - only active ones
    room.players.forEach((p, index) => {
        if (p.isBot && !p.eliminated) {
            // تأخير متدرج: كل بوت يبدأ بعد الآخر بـ 2 ثانية
            setTimeout(() => {
                simulateBotDrafting(roomCode, p);
            }, index * 2000); // 0s, 2s, 4s, 6s, etc.
        }
    });
}

async function simulateBotDrafting(roomCode, bot) {
    const room = rooms[roomCode];
    if (!room || room.state !== 'DRAFTING') return;
    try {
        // ⚡ العراف: يرسل القصة الحقيقية مباشرة (قدرة الوحي)
        if (bot.role === ROLE_TYPES.SEER) {
            let answerText;
            if (room.gameMode === 'BLITZ' && room.currentScenario.template && room.currentScenario.blanks) {
                // في وضع الفراغات: يملأ الفراغات بالإجابات الصحيحة
                let filled = room.currentScenario.template;
                room.currentScenario.blanks.forEach(blank => {
                    filled = filled.replace('_____', blank);
                });
                answerText = filled;
            } else {
                const realStory = room.currentScenario.fullStory || room.currentScenario.story;
                answerText = Array.isArray(realStory) ? realStory.join('\n') : (realStory || '');
            }
            setTimeout(() => {
                if (!rooms[roomCode] || rooms[roomCode].state !== 'DRAFTING') return;
                room.answers[bot.id] = answerText;
                bot.abilityUsed = true;
                ioInstance.to(room.hostId).emit('playerSubmitted', { playerId: bot.id, playerName: bot.name });
                checkDraftingComplete(roomCode);
            }, 5000 + Math.random() * 5000);
            return;
        }
        // تمرير الإجابات السابقة للـ AI لتنويع كل بوت
        const prevAnswers = Object.values(room.answers).filter(Boolean);
        const scenarioWithContext = {
            ...room.currentScenario,
            _prevAnswers: prevAnswers.slice(-3).join(' | ') // آخر 3 إجابات كسياق
        };

        const targetText = await generateBotAnswer(bot.role, scenarioWithContext, prevAnswers, room.gameMode);

        if (!rooms[roomCode] || rooms[roomCode].state !== 'DRAFTING') return;

        // Simulate typing
        let charIndex = 0;
        const typingSpeed = 50 + Math.random() * 100; // Random speed

        bot._typingInterval = setInterval(() => {
            if (charIndex < targetText.length) {
                if (!room.drafts[bot.id]) room.drafts[bot.id] = "";
                room.drafts[bot.id] += targetText[charIndex];
                charIndex++;
            } else {
                clearInterval(bot._typingInterval);
                bot._typingInterval = null;
            }
        }, typingSpeed);

        // Submit after delay (10-30 seconds)
        const submitDelay = 10000 + Math.random() * 20000;
        bot._submitTimer = setTimeout(() => {
            bot._submitTimer = null;
            if (!rooms[roomCode] || rooms[roomCode].state !== 'DRAFTING') return;
            room.answers[bot.id] = targetText;
            // Notify host
            ioInstance.to(room.hostId).emit('playerSubmitted', { playerId: bot.id, playerName: bot.name });
            checkDraftingComplete(roomCode);
        }, submitDelay);
    } catch (error) {
        console.error(`❌ Bot ${bot.name} failed to draft:`, error);
        if (!rooms[roomCode] || rooms[roomCode].state !== 'DRAFTING') return;
        // Fallback: Submit a simple answer
        room.answers[bot.id] = "لم أستطع كتابة سيناريو...";
        ioInstance.to(room.hostId).emit('playerSubmitted', { playerId: bot.id, playerName: bot.name });
        checkDraftingComplete(roomCode);
    }
}

function startPresentationPhase(roomCode) {
    // ❌ تم إلغاء مرحلة العرض القديمة
    // الانتقال مباشرة إلى التصويت على الجودة
    startVotingPhase(roomCode);
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

    ioInstance.to(roomCode).emit('qualityVotingStarted', {
        scenarios: anonymousScenarios
    });

    // البوتات تصوت على الجودة
    room.players.forEach(p => {
        if (p.isBot) {
            setTimeout(() => {
                try {
                    // ✅ GUARD: Check if bot already voted
                    if (room.qualityVotes[p.id] !== undefined) return;

                    // 🤖 Smart Bot Quality Vote
                    const botKnowledge = buildBotKnowledge(p, room);
                    // ⛔ استبعاد اللاعبين المستبعدين من قائمة المرشحين
                    const playersPublic = room.players.filter(pl => !pl.eliminated).map(pl => ({ id: pl.id, name: pl.name }));
                    const answers = {};
                    room.players.filter(pl => !pl.eliminated).forEach(pl => { answers[pl.id] = room.answers[pl.id] || ''; });

                    let qualityVoteIndex = generateSmartQualityVote(
                        botKnowledge,
                        playersPublic,
                        answers,
                        room.currentScenario
                    );

                    // Fallback / Safety: Ensure index is valid
                    if (qualityVoteIndex === undefined || qualityVoteIndex === null || qualityVoteIndex < 0 || qualityVoteIndex >= room.players.length) {
                        qualityVoteIndex = (room.players.findIndex(pl => pl.id === p.id) + 1) % room.players.length;
                    }

                    room.qualityVotes[p.id] = qualityVoteIndex;

                    // 🆕 إرسال للهوست أن البوت صوّت
                    ioInstance.to(room.hostId).emit('voteReceived', {
                        phase: 'QUALITY',
                        playerId: p.id,
                        playerName: p.name,
                        choice: qualityVoteIndex,
                        totalVotes: Object.keys(room.qualityVotes).length,
                        totalPlayers: room.players.length
                    });

                    checkQualityVotingComplete(roomCode);
                } catch (e) {
                    console.error(`Bot ${p.id} crashed during Quality Voting:`, e);
                    // Fallback to random vote
                    room.qualityVotes[p.id] = (room.players.findIndex(pl => pl.id === p.id) + 1) % room.players.length;
                    checkQualityVotingComplete(roomCode);
                }
            }, 3000 + Math.random() * 7000); // 3-10 ثواني
        }
    });
}

function checkQualityVotingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    // Filter for active (non-eliminated) and connected players
    const activePlayers = room.players.filter(p => !p.eliminated && p.connected !== false);
    const voteCount = Object.keys(room.qualityVotes).length;

    if (voteCount >= activePlayers.length) {
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
    ioInstance.to(roomCode).emit('dramaticRevealStarted', {
        totalScenarios: scenariosWithVotes.length + (scenariosWithoutVotes.length > 0 ? 1 : 0)
    });

    // العرض التدريجي
    let currentDelay = 0;

    scenariosWithVotes.forEach((scenario, idx) => {
        // Step 1: عرض السيناريو (2 ثانية)
        setTimeout(() => {
            ioInstance.to(roomCode).emit('revealStep', {
                step: 'SCENARIO',
                data: {
                    index: scenario.index,
                    text: scenario.answer,
                    position: idx + 1,
                    total: scenariosWithVotes.length
                }
            });
        }, currentDelay);
        currentDelay += 2000;

        // Step 2: عرض الأصوات (1.5 ثانية)
        setTimeout(() => {
            ioInstance.to(roomCode).emit('revealStep', {
                step: 'VOTERS',
                data: {
                    index: scenario.index,
                    voters: scenario.voters,
                    voteCount: scenario.voteCount
                }
            });
        }, currentDelay);
        currentDelay += 1500;

        // Step 3: كشف الكاتب (2 ثانية)
        setTimeout(() => {
            ioInstance.to(roomCode).emit('revealStep', {
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
            ioInstance.to(roomCode).emit('revealStep', {
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
        currentDelay += 2000;
    }

    // 🔍 عرض التلميح الدرامي (Dramatic Hint)
    if (room.currentScenario.hint) {
        setTimeout(() => {
            ioInstance.to(roomCode).emit('revealStep', {
                step: 'HINT',
                data: {
                    hint: room.currentScenario.hint
                }
            });
        }, currentDelay);
        currentDelay += 4000; // 4 seconds duration
    }

    // بعد انتهاء العرض: الانتقال مباشرة إلى التصويت على الجاني
    setTimeout(() => {
        console.log(`⏰ Dramatic reveal finished. Starting discussion for room ${roomCode}`);
        startDiscussion(roomCode);
    }, currentDelay);
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
            ioInstance.to(detective.id).emit('abilityResult', {
                type: 'INVESTIGATE',
                targetName: target.name,
                result: resultTeamName,
                isSabotaged: isSabotaged
            });
            // ✅ لا نُصفّر investigationTarget هنا - scoring.js يحتاجه لحساب نقاط المحقق والمخرب
            // سيُصفَّر في assignRoles في الجولة التالية
        }
    }

    ioInstance.to(roomCode).emit('discussionStarted', {
        timer: 120,
        hint: room.currentScenario.hint // Pass hint to persist in discussion
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

    // إرسال السيناريوهات مع الأسماء — فقط اللاعبين النشطين (غير المستبعدين)
    const scenariosWithAuthors = room.players
        .filter(p => !p.eliminated)
        .map((p, index) => ({
            index: index,
            playerId: p.id,
            playerName: p.name,
            answer: room.answers[p.id] || "لم يكتب شيئاً..."
        }));

    ioInstance.to(roomCode).emit('culpritVotingStarted', {
        scenarios: scenariosWithAuthors
    });

    // البوتات تصوت على الجاني
    room.players.forEach(p => {
        if (p.isBot) {
            setTimeout(() => {
                try {
                    // ✅ GUARD: Check if bot already voted
                    if (room.culpritVotes[p.id] !== undefined) return;

                    const botKnowledge = buildBotKnowledge(p, room);
                    // ⛔ استبعاد اللاعبين المستبعدين من قائمة المرشحين
                    const playersPublic = room.players.filter(pl => !pl.eliminated).map(pl => ({ id: pl.id, name: pl.name }));
                    const answers = {};
                    room.players.filter(pl => !pl.eliminated).forEach(pl => { answers[pl.id] = room.answers[pl.id] || ''; });

                    let culpritVoteId = generateSmartCulpritVote(
                        botKnowledge,
                        playersPublic,
                        answers,
                        room.currentScenario
                    );

                    if (!culpritVoteId) {
                        const candidates = playersPublic.filter(pl => pl.id !== p.id);
                        culpritVoteId = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)].id : p.id;
                    }

                    room.culpritVotes[p.id] = culpritVoteId;

                    // 🆕 إرسال للهوست أن البوت صوّت
                    ioInstance.to(room.hostId).emit('voteReceived', {
                        phase: 'CULPRIT',
                        playerId: p.id,
                        playerName: p.name,
                        choice: culpritVoteId,
                        totalVotes: Object.keys(room.culpritVotes).length,
                        totalPlayers: room.players.length
                    });

                    checkCulpritVotingComplete(roomCode);
                } catch (e) {
                    console.error(`Bot ${p.id} crashed during Culprit Voting:`, e);
                    // Fallback to random candidate
                    const playersPublic = room.players.filter(pl => !pl.eliminated);
                    const candidates = playersPublic.filter(pl => pl.id !== p.id);
                    room.culpritVotes[p.id] = candidates.length > 0 ? candidates[0].id : p.id;
                    checkCulpritVotingComplete(roomCode);
                }
            }, 3000 + Math.random() * 7000); // 3-10 ثواني
        }
    });
}

function checkCulpritVotingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    // Better logic: Check if all NON-ELIMINATED and CONNECTED players have voted
    const activePlayers = room.players.filter(p => !p.eliminated && p.connected !== false);
    const voteCount = Object.keys(room.culpritVotes).length;

    console.log(`🔍 Culprit Voting: ${voteCount}/${activePlayers.length} votes received`);

    // Check if we have enough votes (considering some might have disconnected after voting)
    // Also, handle the case where voteCount > activePlayers (if someone voted then disconnected)
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
        if (targetId && targetId !== 'null' && targetId !== 'undefined') {
            counts[targetId] = (counts[targetId] || 0) + 1;
        }
    });

    if (Object.keys(counts).length === 0) {
        // Safe fallback if no valid votes are found
        const randomActivePlayer = room.players.find(p => !p.eliminated);
        if (randomActivePlayer) {
            counts[randomActivePlayer.id] = 1; // Force a valid fallback
        } else {
            endRound(roomCode, { winner: 'DRAW', reason: 'لم يصوت أحد بشكل صحيح ولا يوجد لاعبين نشطين!' });
            return;
        }
    }

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
        // Logic: 
        // 1. If first tie -> Reset votes and Re-vote (emit 'revote')
        // 2. If second tie (consecutive) -> Crime Team Wins

        if (!room.consecutiveTies) room.consecutiveTies = 0;

        if (room.consecutiveTies >= 1) {
            // Second consecutive tie -> Crime Wins
            endRound(roomCode, {
                winner: TEAMS.CRIME,
                reason: 'تعادل التصويت للمرة الثانية! يفوز فريق الجريمة.',
                victim: null
            });
            room.consecutiveTies = 0; // Reset
            return;
        }

        // First Tie -> Revote
        room.consecutiveTies++;
        room.culpritVotes = {}; // Reset votes

        ioInstance.to(roomCode).emit('voteTie', {
            candidates: candidates.map(id => {
                const p = room.players.find(pl => pl.id === id);
                return p ? p.name : 'Unknown';
            }),
            message: 'تعادل في الأصوات! سيتم إعادة التصويت.'
        });

        // Restart bot votes if needed
        room.players.forEach(p => {
            if (p.isBot) {
                setTimeout(() => {
                    try {
                        // Trigger bot vote again
                        const botKnowledge = buildBotKnowledge(p, room);
                        // ⛔ استبعاد اللاعبين المستبعدين
                        const playersPublic = room.players.filter(pl => !pl.eliminated).map(pl => ({ id: pl.id, name: pl.name }));
                        const answers = {};
                        room.players.filter(pl => !pl.eliminated).forEach(pl => { answers[pl.id] = room.answers[pl.id] || ''; });

                        let culpritVoteId = generateSmartCulpritVote(
                            botKnowledge,
                            playersPublic,
                            answers,
                            room.currentScenario
                        );

                        if (!culpritVoteId) {
                            const availableCandidates = playersPublic.filter(pl => pl.id !== p.id);
                            culpritVoteId = availableCandidates.length > 0 ? availableCandidates[Math.floor(Math.random() * availableCandidates.length)].id : p.id;
                        }

                        room.culpritVotes[p.id] = culpritVoteId;

                        ioInstance.to(room.hostId).emit('voteReceived', {
                            phase: 'CULPRIT',
                            playerId: p.id,
                            playerName: p.name,
                            choice: culpritVoteId,
                            totalVotes: Object.keys(room.culpritVotes).length,
                            totalPlayers: room.players.length
                        });

                        checkCulpritVotingComplete(roomCode);
                    } catch (e) {
                        console.error(`Bot ${p.id} crashed during Revote:`, e);
                        const candidates = room.players.filter(pl => !pl.eliminated && pl.id !== p.id);
                        room.culpritVotes[p.id] = candidates.length > 0 ? candidates[0].id : p.id;
                        checkCulpritVotingComplete(roomCode);
                    }
                }, 3000 + Math.random() * 5000);
            }
        });

        return;
    }

    // Reset tie counter on successful result
    room.consecutiveTies = 0;

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

    // Check if we should reveal roles
    const shouldRevealRoles = result && result.winner !== 'CONTINUE' && result.winner !== 'DRAW';

    const results = room.players.map(p => {
        let playerBreakdown = breakdown[p.id];
        if (!playerBreakdown || !Array.isArray(playerBreakdown) || playerBreakdown.length === 0) {
            playerBreakdown = ["لم يحصل على نقاط إضافية"];
        }

        const roleInfo = getRoleInfo(p.role);
        const isEliminated = result && result.eliminatedPlayer && result.eliminatedPlayer.name === p.name;

        // Reveal role if game over OR if this specific player was eliminated
        const revealThisPlayer = shouldRevealRoles || isEliminated;

        return {
            name: p.name,
            role: revealThisPlayer ? getRoleName(p.role) : '؟؟؟', // Mask Role
            roleId: revealThisPlayer ? p.role : null,            // Mask ID
            team: revealThisPlayer ? (roleInfo ? roleInfo.team : TEAMS.JUSTICE) : null,
            teamName: revealThisPlayer ? (roleInfo && roleInfo.team === TEAMS.CRIME ? 'فريق الجريمة' : 'فريق العدالة') : '؟؟؟',
            roundScore: roundScores[p.id] || 0,
            totalScore: p.score,
            breakdown: playerBreakdown,
            isEliminated: isEliminated,
            isCulprit: p.role === ROLE_TYPES.CULPRIT // Used for visual cues, maybe mask too?
        };
    }).sort((a, b) => b.totalScore - a.totalScore);

    // Send Results
    const resultPayload = {
        winner: result ? result.winner : null,
        scores: results,
        teamScores,
        crimeTeamWon,
        investigationTeamWon,
        culpritCaught,
        crimeTeam: crimeMembers.map(p => ({ id: p.id, name: p.name, score: p.score, roleName: getRoleName(p.role) })),
        justiceTeam: investigationMembers.map(p => ({ id: p.id, name: p.name, score: p.score, roleName: getRoleName(p.role) })),
        reason: result ? result.reason : null,
        victim: result ? result.victim : null,
        eliminatedPlayer: result ? result.eliminatedPlayer : null,
        round: room.currentRound,
        totalRounds: room.totalRounds,
        isLastRound: room.currentRound >= room.totalRounds
    };

    room.lastRoundResult = resultPayload; // Store for reconnection
    ioInstance.to(roomCode).emit('roundResults', resultPayload);
    room.state = 'RESULTS';
}

function startTutorialLogic(socket, desiredRole) {
    console.log('Starting tutorial logic for:', socket.id);

    // Always create a new room for tutorial
    const roomCode = generateRoomCode(rooms);
    console.log('Generated tutorial room code:', roomCode);

    const room = {
        hostId: socket.id,
        players: [],
        state: 'LOBBY',
        currentRound: 0,
        totalRounds: 3, // التدريب يستمر 3 جولات
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
        room.isTutorial = isTutorial || false;
        room.totalRounds = (isTutorial) ? 3 : room.totalRounds;
        room.tutorialData = null;
    }

    startNewRound(roomCode);
}

function startNewRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    // Clear any pending bot timers from the previous round
    room.players.forEach(p => {
        if (p._submitTimer) { clearTimeout(p._submitTimer); p._submitTimer = null; }
        if (p._typingInterval) { clearInterval(p._typingInterval); p._typingInterval = null; }
    });

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
    room.consecutiveTies = 0;

    // 🔄 Notify Players about New Round
    ioInstance.to(roomCode).emit('newRoundStarted', {
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




















// Assign Roles Logic — ضامن عدم التكرار
function assignRoles(room, players, passedRoomCode) {
    // ترتيب الأولويات الرسمية
    const PRIORITY_ORDER = [
        ROLE_TYPES.CULPRIT, ROLE_TYPES.WITNESS, ROLE_TYPES.DETECTIVE,
        ROLE_TYPES.SABOTEUR, ROLE_TYPES.BENEFICIARY, ROLE_TYPES.MINISTER,
        ROLE_TYPES.SEER, ROLE_TYPES.MASTERMIND
    ];

    // الأدوار المتاحة حسب عدد اللاعبين
    const rolesPool = getRolesForPlayerCount(players.length);

    // ===================================================
    // 1️⃣ منح اللاعبين الحقيقيين أدوارهم المفضلة أولاً (بالأولوية الزمنية - First Come First Served)
    // ===================================================
    const assignedRoles = new Set();

    // فرز: اللاعبون الحقيقيون أولاً، ثم البوتات
    const realPlayers = players.filter(p => !p.isBot && p.preferredRole);
    const bots = players.filter(p => p.isBot);
    const noPreference = players.filter(p => !p.isBot && !p.preferredRole);

    // اللاعبون الحقيقيون ذوو تفضيل
    for (const player of realPlayers) {
        const wanted = player.preferredRole;
        if (rolesPool.includes(wanted) && !assignedRoles.has(wanted)) {
            // ✅ الدور متاح وغير مأخوذ
            player.role = wanted;
            assignedRoles.add(wanted);
            console.log(`✅ ${player.name} → ${wanted} (preferred)`);
        } else {
            // ⚠️ الدور مأخوذ - يأخذ أول دور متاح من الـ pool
            const fallback = rolesPool.find(r => !assignedRoles.has(r));
            player.role = fallback || ROLE_TYPES.CITIZEN;
            if (fallback) assignedRoles.add(fallback);
            console.log(`⚠️ ${player.name} wanted ${wanted} (taken) → ${player.role}`);
        }
    }

    // ===================================================
    // 2️⃣ البوتات ذات preferredRole (من وضع التدريب)
    // ===================================================
    for (const bot of bots) {
        if (bot.preferredRole && rolesPool.includes(bot.preferredRole) && !assignedRoles.has(bot.preferredRole)) {
            bot.role = bot.preferredRole;
            assignedRoles.add(bot.preferredRole);
            console.log(`🤖 Bot ${bot.name} → ${bot.role} (preferred)`);
        } else {
            // البوت يأخذ أول دور متاح بالترتيب
            const fallback = PRIORITY_ORDER.find(r => rolesPool.includes(r) && !assignedRoles.has(r));
            bot.role = fallback || ROLE_TYPES.CITIZEN;
            if (fallback) assignedRoles.add(fallback);
            console.log(`🤖 Bot ${bot.name} → ${bot.role}`);
        }
    }

    // ===================================================
    // 3️⃣ اللاعبون الحقيقيون بدون تفضيل يأخذون ما تبقى
    // ===================================================
    for (const player of noPreference) {
        const fallback = PRIORITY_ORDER.find(r => rolesPool.includes(r) && !assignedRoles.has(r));
        player.role = fallback || ROLE_TYPES.CITIZEN;
        if (fallback) assignedRoles.add(fallback);
        console.log(`👤 ${player.name} → ${player.role} (auto)`);
    }

    // ===================================================
    // 4️⃣ إعادة تعيين النقاط والأعلام لكل لاعب
    // ===================================================
    players.forEach(player => {
        player.score = (room.currentRound === 1) ? 0 : player.score;

        // نقاط البداية للوزير والمستفيد (الجولة الأولى فقط)
        const roleInfo = getRoleInfo(player.role);
        if (room.currentRound === 1 && roleInfo && roleInfo.startPoints) {
            player.score = roleInfo.startPoints;
        }

        // إعادة تعيين أعلام الجولة
        player.abilityUsed = false;
        player.sabotagedBy = null;
        player.investigatedBy = null;
        player.investigationTarget = null;
        player.sabotageTarget = null;
        player.offerSentThisRound = false;
    });

    // الجمع لإرسال البيانات
    const allPlayers = [...realPlayers, ...bots, ...noPreference];


    // Special Role Intel Logic
    const crimeTeam = allPlayers.filter(p => {
        const info = getRoleInfo(p.role);
        return info && info.team === TEAMS.CRIME;
    });

    const beneficiary = allPlayers.find(p => p.role === ROLE_TYPES.BENEFICIARY);
    const detective = allPlayers.find(p => p.role === ROLE_TYPES.DETECTIVE);

    // Assign and send role data
    const roomCode = passedRoomCode || room.id || Object.keys(rooms).find(key => rooms[key] === room); // Try to find ID

    allPlayers.forEach((player) => {
        const role = player.role;
        const roleInfo = getRoleInfo(role);

        if (!roleInfo) {
            console.error(`Role info not found for: ${role}`);
            return;
        }

        let specialInfo = null;

        if (role === ROLE_TYPES.MASTERMIND) {
            specialInfo = {
                crimeTeam: crimeTeam.map(p => ({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    roleName: getRoleName(p.role)
                }))
            };
        } else if (role === ROLE_TYPES.MINISTER) {
            specialInfo = {
                detective: detective ? { id: detective.id, name: detective.name } : null,
                beneficiary: beneficiary ? { id: beneficiary.id, name: beneficiary.name } : null
            };
        }

        // Save specialInfo for bots to use later
        if (player.isBot) {
            player.specialInfo = specialInfo;
        }

        // Culprit gets full story
        if (role === ROLE_TYPES.CULPRIT) {
            // Use fullStory if available, otherwise story
            specialInfo = room.currentScenario.fullStory || room.currentScenario.story;
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

        // Store specialInfo on player object for use in voting and abilities
        player.specialInfo = specialInfo;

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

        ioInstance.to(player.id).emit('roleAssigned', roleData);
        // specialInfo is now stored on all players, including bots
        // (see assignment above)
    });

    // Notify Host
    if (roomCode) {
        ioInstance.to(roomCode).emit('gameStarted', {
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
        totalScore: p.score,
        role: p.role
    })).sort((a, b) => b.totalScore - a.totalScore);

    // Save stats to DB (wrapped in try-catch to prevent crash)
    let leaderboard = [];
    try {
        const winnerScore = finalResults[0]?.totalScore || 0;

        room.players.forEach(p => {
            const isWinner = p.score === winnerScore && p.score > 0;
            db.updatePlayerStats(p.name, {
                score: p.score,
                isWinner: isWinner,
                role: p.role
            });
        });

        db.saveMatch({ roomCode, players: room.players.map(p => ({ name: p.name, score: p.score, role: p.role })) });
        leaderboard = db.getLeaderboard() || [];
    } catch (dbErr) {
        console.error('⚠️ endGame DB error (non-fatal):', dbErr.message);
    }

    ioInstance.to(roomCode).emit('gameEnded', {
        results: finalResults,
        leaderboard: leaderboard
    });

    // Clean up room after 5 minutes
    setTimeout(() => {
        if (rooms[roomCode]) {
            if (rooms[roomCode].timer) clearInterval(rooms[roomCode].timer);
            delete rooms[roomCode];
        }
        console.log(`🧹 Room ${roomCode} cleaned up from memory`);
    }, 5 * 60 * 1000);
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
// Legacy handlers (saboteurSabotage, detectiveCheck, seerReveal) removed —
// client uses 'useAbility' exclusively.

function applyBlitzSabotage(room, targetId) {
    const answer = room.answers[targetId];
    if (!answer || typeof answer !== 'string') return;

    const targetPlayer = room.players.find(p => p.id === targetId);
    const tricksterWord = targetPlayer?.tricksterWord || "بطيخة";

    // Split into words
    const words = answer.split(/\s+/);

    // Find candidates (length > 3) to replace
    const candidates = [];
    words.forEach((w, i) => {
        if (w.length > 3) candidates.push(i);
    });

    if (candidates.length > 0) {
        const randomIdx = candidates[Math.floor(Math.random() * candidates.length)];
        words[randomIdx] = tricksterWord; // Swap!
        room.answers[targetId] = words.join(' ');
        console.log(`😈 Sabotage applied on ${targetPlayer.name}: Replaced word with ${tricksterWord}`);
    } else if (words.length > 0) {
        // Fallback: replace last word
        words[words.length - 1] = tricksterWord;
        room.answers[targetId] = words.join(' ');
    }
}



module.exports = {
    initPhases,
    executeBotAbilities, checkDraftingComplete, startDraftingPhase, simulateBotDrafting,
    startPresentationPhase, startVotingPhase, startQualityVoting, checkQualityVotingComplete,
    startDramaticReveal, startDiscussion, startCulpritVoting, checkCulpritVotingComplete,
    handleVotingResult, resolveElimination, endRound,
    startTutorialLogic, startGameLogic, startNewRound, assignRoles, endGame, applyBlitzSabotage
};


