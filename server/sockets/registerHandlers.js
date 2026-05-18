const crypto = require('crypto');
const logger = require('../utils/logger');
const { rooms } = require('../state');
const scenarios = require('../scenarios');
const { TEAMS, ROLE_TYPES, ROLES, getRoleInfo, getTeamMembers, getRolesForPlayerCount } = require('../roles');
const { getRoleName, getRoleDescription, getRoleGoal, getRoleTeam, generateRoomCode, buildBotKnowledge } = require('../utils/serverUtils');
const phases = require('../game/phases');
const { handleSendOffer, handleMastermindForward, handleOfferResponse } = require('../logic/offers');

// Helper to generate a random avatar configuration matching the React Native component bounds
const generateRandomBotAvatar = () => {
    const avatarColors = [
        '#FDDBB4', '#FDF5E6', '#FFF8DC', '#F5CBA7', '#E59866', '#CA6F1E', '#784212',
        '#FFC0CB', '#FF69B4', '#FFD700', '#ADFF2F', '#00FF7F', '#00BFFF',
        '#00CED1', '#1E90FF', '#9370DB', '#8A2BE2', '#FF6347', '#FF4500',
        '#A0522D', '#696969', '#2C3E50'
    ];
    return {
        base: Math.floor(Math.random() * 9),
        eyes: Math.floor(Math.random() * 10),
        eyebrows: Math.floor(Math.random() * 5),
        hair: Math.floor(Math.random() * 16),
        hat: Math.floor(Math.random() * 8),
        mouth: Math.floor(Math.random() * 10),
        accessory: Math.floor(Math.random() * 10),
        color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    };
};

function registerHandlers(io) {

    /** تنظيف غرفة بأمان: يُوقف التايمر أولاً ثم يحذف الغرفة */
    function safeDeleteRoom(roomCode) {
        const room = rooms[roomCode];
        if (!room) return;
        if (room.timer) {
            clearInterval(room.timer);
            room.timer = null;
        }
        delete rooms[roomCode];
    }

    // ============================================
    // 🔒 Input Validation Helpers
    // ============================================

    /** تنظيف اسم اللاعب من محتوى HTML الخبيث */
    function sanitizePlayerName(name) {
        if (!name || typeof name !== 'string') return '';
        return name
            .trim()
            .substring(0, 50)
            .replace(/[<>"'&]/g, '')
            .replace(/[\x00-\x1F\x7F]/g, '') // إزالة control characters
            .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g, ''); // إزالة zero-width وRTL override
    }

    /** فحص صحة المدخلات العامة */
    function validateInput(data, rules) {
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            if (rule.required && (value === undefined || value === null || value === '')) {
                return `الحقل "${field}" مطلوب`;
            }
            if (value !== undefined && rule.type && typeof value !== rule.type) {
                return `الحقل "${field}" يجب أن يكون ${rule.type}`;
            }
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
                return `الحقل "${field}" يتجاوز الحد الأقصى (${rule.maxLength} حرف)`;
            }
        }
        return null; // لا يوجد خطأ
    }

    io.on('connection', (socket) => {
        logger.info('✅ User connected:', socket.id, 'from', socket.handshake.address);
        logger.info('📊 Total connections:', io.engine.clientsCount);

        // Handle connection errors
        socket.on('error', (error) => {
            logger.error('❌ Socket error:', socket.id, error);
        });

        socket.on('connect_error', (error) => {
            logger.error('❌ Connection error:', socket.id, error);
        });

        // Host creates a room
        socket.on('createRoom', () => {
            const roomCode = generateRoomCode(rooms);
            const hostToken = crypto.randomUUID();
            rooms[roomCode] = {
                hostId: socket.id,
                hostToken,
                players: [],
                state: 'LOBBY', // LOBBY, PLAYING, END
                currentRound: 0,
                totalRounds: 3,
                usedScenarios: [],
                gameMode: 'BLITZ' // CLASSIC or BLITZ
            };
            socket.join(roomCode);
            // ✅ إرسال gameMode والـ hostToken مع الكود حتى يتمكن الهوست من إعادة الانضمام لاحقاً
            socket.emit('roomCreated', { roomCode, gameMode: 'BLITZ', hostToken });
            logger.info(`Room created: ${roomCode} by ${socket.id} `);

            // Auto-cleanup: delete unused lobby rooms after 30 minutes
            setTimeout(() => {
                if (rooms[roomCode] && rooms[roomCode].state === 'LOBBY') {
                    safeDeleteRoom(roomCode);
                    logger.info(`🧹 Unused lobby room ${roomCode} auto - cleaned`);
                }
            }, 30 * 60 * 1000);
        });

        // Host reconnect — يُحدّث hostId بعد التحقق من hostToken
        socket.on('rejoinHost', ({ roomCode, hostToken }) => {
            const normalizedCode = roomCode && roomCode.toUpperCase();
            const room = normalizedCode && rooms[normalizedCode];
            if (!room) {
                socket.emit('roomNotFound');
                return;
            }

            if (!hostToken || room.hostToken !== hostToken) {
                logger.warn(`Unauthorized rejoinHost attempt for room ${normalizedCode} from ${socket.id}`);
                socket.emit('error', 'غير مصرح: رمز المضيف غير صحيح');
                return;
            }

            room.hostId = socket.id;
            socket.join(normalizedCode);
            logger.info(`Host rejoined room ${normalizedCode}`);

            // Build phase-specific payload so host UI can restore correctly
            const phaseData = {};
            if (room.state === 'DRAFTING') {
                const elapsed = Math.floor((Date.now() - (room.draftStartTime || Date.now())) / 1000);
                phaseData.timeLeft = Math.max(0, 90 - elapsed);
                phaseData.waitingFor = room.players
                    .filter(p => !room.answers[p.id] && !p.eliminated)
                    .map(p => p.id);
            } else if (room.state === 'QUALITY_VOTING') {
                phaseData.scenarios = room.players.map((p, index) => ({
                    index,
                    answer: room.answers[p.id] || '...',
                }));
                phaseData.liveVotes = [];
            } else if (room.state === 'CULPRIT_VOTING') {
                phaseData.scenarios = room.players.map((p, index) => ({
                    index,
                    playerId: p.id,
                    playerName: p.name,
                    answer: room.answers[p.id] || 'لم يكتب شيئاً...',
                }));
                phaseData.liveVotes = [];
            } else if (room.state === 'RESULTS') {
                phaseData.roundResults = room.lastRoundResult || null;
            }

            socket.emit('hostRejoined', {
                state: room.state,
                gameMode: room.gameMode,
                totalRounds: room.totalRounds,
                currentRound: room.currentRound,
                players: room.players.map(p => ({
                    id: p.id, name: p.name, score: p.score || 0,
                    connected: p.connected, eliminated: p.eliminated,
                })),
                ...phaseData,
            });
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
        socket.on('joinRoom', ({ roomCode, playerName, desiredRole, avatar }) => {
            // فحص وتنظيف المدخلات
            const validationError = validateInput(
                { roomCode, playerName },
                {
                    roomCode: { required: true, type: 'string', maxLength: 10 },
                    playerName: { required: true, type: 'string' }
                }
            );
            if (validationError) {
                socket.emit('error', validationError);
                return;
            }
            playerName = sanitizePlayerName(playerName);
            if (!playerName) {
                socket.emit('error', 'اسم اللاعب غير صالح');
                return;
            }

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
                        gameMode: room.gameMode,
                        isReconnect: room.state !== 'LOBBY' && room.state !== 'END' // ← لا تُعيد لـ LOBBY إذا اللعبة جارية
                    });

                    logger.info(`${playerName} reconnected to room ${roomCode} `);

                    // If game is running, send current state
                    if (room.state !== 'LOBBY' && room.state !== 'END') {
                        // 1. Send game started info
                        socket.emit('gameStarted', {
                            title: room.currentScenario.title,
                            round: room.currentRound,
                            totalRounds: room.totalRounds
                        });

                        // 2. Send role info (Correctly populated)
                        if (existingPlayer.role) {
                            const roleInfo = getRoleInfo(existingPlayer.role);
                            const scenario = room.currentScenario;

                            let infoContent = "انتظر التعليمات...";

                            // Populate role specific info based on role type
                            if (existingPlayer.role === ROLE_TYPES.WITNESS) {
                                // Witness sees keywords for 2 seconds typically, on reconnect we can show them again or history
                                infoContent = `الكلمات المفتاحية: ${scenario.keywords.join(' - ')} `;
                            } else if (existingPlayer.role === ROLE_TYPES.DETECTIVE) {
                                infoContent = `عنوان القضية: ${scenario.title} `;
                            } else if (existingPlayer.role === ROLE_TYPES.SEER) {
                                infoContent = `لديك القدرة على كشف القصة`;
                            } else if (existingPlayer.role === ROLE_TYPES.CULPRIT) {
                                infoContent = `القصة الكاملة: ${scenario.story} `;
                            } else if (existingPlayer.role === ROLE_TYPES.MASTERMIND) {
                                const crimeMembers = room.players.filter(p => {
                                    const r = getRoleInfo(p.role);
                                    return r && r.team === TEAMS.CRIME && p.id !== existingPlayer.id;
                                }).map(p => `${p.name} (${getRoleName(p.role)})`);
                                infoContent = `أعضاء فريقك: ${crimeMembers.join(', ')} `;
                            } else if (existingPlayer.role === ROLE_TYPES.MINISTER) {
                                const keyRoles = room.players.filter(p =>
                                    p.role === ROLE_TYPES.DETECTIVE || p.role === ROLE_TYPES.BENEFICIARY
                                ).map(p => `${p.name} (${getRoleName(p.role)})`);
                                infoContent = `الأدوار المكشوفة لك: ${keyRoles.join(', ')} `;
                            } else if (existingPlayer.role === ROLE_TYPES.SABOTEUR) {
                                infoContent = "مهمتك تخريب تحقيقات المحقق.";
                            } else if (existingPlayer.role === ROLE_TYPES.BENEFICIARY) {
                                infoContent = "لديك رصيد إضافي +1000.";
                            }

                            let roleData = {
                                role: existingPlayer.role,
                                roleName: getRoleName(existingPlayer.role),
                                description: getRoleDescription(existingPlayer.role),
                                team: roleInfo.team,
                                emoji: roleInfo.emoji,
                                goal: getRoleGoal(existingPlayer.role),
                                ability: roleInfo.ability,
                                info: infoContent,
                                secretHint: existingPlayer.secretHint, // Restore hint if any
                                round: room.currentRound,
                                totalRounds: room.totalRounds,
                                isTutorial: room.isTutorial
                            };

                            socket.emit('roleAssigned', roleData);
                        }

                        // 3. Send Phase Specific Data to move client to correct screen
                        if (room.state === 'DRAFTING') {
                            const elapsed = Math.floor((Date.now() - (room.draftStartTime || Date.now())) / 1000);
                            const remaining = Math.max(0, 90 - elapsed);
                            const playerAnswer = room.answers[existingPlayer.id];
                            socket.emit('startDrafting', {
                                duration: remaining,
                                caseTitle: room.currentScenario.title,
                                template: room.currentScenario.template || null, // Blitz mode
                                waitingFor: room.players.filter(p => !room.answers[p.id] && !p.eliminated).map(p => p.id),
                                alreadySubmitted: !!playerAnswer,      // ← هل اللاعب أرسل مسبقاً؟
                                submittedAnswer: playerAnswer || ''    // ← استعد إجابته
                            });
                        } else if (room.state === 'DISCUSSION') {
                            socket.emit('discussionStarted', {
                                timer: 120,
                                hint: room.currentScenario.hint // Restore hint
                            });
                            // Resend speaker if any
                            // We need to track current speaker in room object (not currently done explicitly in robust way for reconnect)
                        } else if (room.state === 'QUALITY_VOTING') {
                            const anonymousAnswers = room.players.map(p => ({
                                index: room.players.indexOf(p),
                                answer: room.answers[p.id] || "..."
                            }));
                            socket.emit('qualityVotingStarted', {
                                scenarios: anonymousAnswers
                            });
                        } else if (room.state === 'DRAMATIC_REVEAL') {
                            socket.emit('dramaticRevealStarted', {
                                totalScenarios: room.players.length
                            });
                            // We might need to send current reveal step too? Complex for V1.
                        } else if (room.state === 'CULPRIT_VOTING') {
                            const scenariosWithAuthors = room.players.map((p, index) => ({
                                index: index,
                                playerId: p.id,
                                playerName: p.name,
                                answer: room.answers[p.id] || "لم يكتب شيئاً..."
                            }));
                            socket.emit('culpritVotingStarted', {
                                scenarios: scenariosWithAuthors
                            });
                        } else if (room.state === 'RESULTS') {
                            // Send last round results
                            // We need to store last results in room object to resend
                            if (room.lastRoundResult) {
                                socket.emit('roundResults', room.lastRoundResult);
                            }
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
                    connected: true,
                    avatar: avatar || null
                };

                // ✅ Handle Training Mode Join Logic
                if (desiredRole) {
                    logger.info(`🎓 Training Mode Join: ${playerName} wants to be ${desiredRole} `);
                    room.isTutorial = true;
                    room.totalRounds = 3; // التدريب يستمر 3 جولات
                    player.role = desiredRole;
                    player.preferredRole = desiredRole; // Persist preference

                    // Add player first
                    room.players.push(player);
                    socket.join(roomCode.toUpperCase());

                    // ✅ وضع التدريب: إضافة 3 بوتات بترتيب الأدوار (مع تجاهل دور اللاعب)
                    const TRAINING_ROLE_ORDER = [
                        ROLE_TYPES.CULPRIT,      // 1. الجاني
                        ROLE_TYPES.WITNESS,      // 2. الشاهد
                        ROLE_TYPES.DETECTIVE,    // 3. المحقق
                        ROLE_TYPES.SABOTEUR,     // 4. المخرب
                        ROLE_TYPES.BENEFICIARY,  // 5. المستفيد
                        ROLE_TYPES.MINISTER,     // 6. الوزير
                        ROLE_TYPES.SEER,         // 7. العراف
                        ROLE_TYPES.MASTERMIND,   // 8. العقل المدبر
                    ];

                    const ROLE_NAMES_AR = {
                        CULPRIT: 'الجاني', WITNESS: 'الشاهد', DETECTIVE: 'المحقق',
                        SABOTEUR: 'المخرب', BENEFICIARY: 'المستفيد', MINISTER: 'الوزير',
                        SEER: 'العراف', MASTERMIND: 'العقل المدبر'
                    };

                    // الأدوار المتاحة للبوتات (باستثناء دور اللاعب)
                    const availableRoles = TRAINING_ROLE_ORDER.filter(r => r !== desiredRole);

                    let botCount = 0;
                    const BOTS_TO_ADD = 3; // يضاف 3 بوتات تلقائياً فقط
                    for (let i = 0; i < BOTS_TO_ADD && i < availableRoles.length; i++) {
                        botCount++;
                        const botRole = availableRoles[i];
                        const botRoleName = ROLE_NAMES_AR[botRole] || botRole;
                        const botId = `bot_${Date.now()}_${botCount} `;
                        room.players.push({
                            id: botId,
                            name: `Bot ${botCount} 🤖 (${botRoleName})`,
                            score: 0,
                            role: botRole,           // الدور محدد مسبقاً
                            preferredRole: botRole,  // ✅ يحفظ الدور في مسار assignRoles
                            isLeader: false,
                            connected: true,
                            isBot: true,
                            avatar: generateRandomBotAvatar()
                        });
                    }

                    logger.info(`✅ Training Mode: Added ${botCount} bots.Total players: ${room.players.length} `);
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

                logger.info(`${playerName} joined room ${roomCode} ${desiredRole ? '(Training Mode)' : ''} `);

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
                socket.emit('roomNotFound');
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
                const botId = `bot_${Date.now()}_${botCount} `;

                // Determine preferred role for this bot based on current count and existing preferences
                // 1. Get ideal role distribution for (current count + 1)
                const targetCount = room.players.length + 1;
                const idealRoles = getRolesForPlayerCount(targetCount);

                // 2. Identify roles already "taken" by players with preferredRole
                const takenRoles = room.players
                    .filter(p => p.preferredRole)
                    .map(p => p.preferredRole);

                // 3. Find first role in idealRoles that isn't taken
                // We need to match the specific "slot" logic if possible, or just fill gaps.
                // The assignRoles logic fills linearly from idealRoles list, skipping taken ones.
                // So if we want this bot to "be" the next role, we should assign it as preferredRole?
                // Actually, if we assign preferredRole to the bot, it LOCKS it.
                // If we don't, it might get shuffled.
                // The user wants to "add bots one by one according to roles". 
                // This implies visual feedback or certainty.
                // Let's assign preferredRole to the bot to guarantee the distribution order.

                let nextRole = null;

                // Filter out roles that are already preferred by others
                const availableRoles = [...idealRoles];
                takenRoles.forEach(taken => {
                    const idx = availableRoles.indexOf(taken);
                    if (idx !== -1) availableRoles.splice(idx, 1);
                });

                // The bot takes the next available role from the ideal list
                // However, ideal list grows. 
                // E.g. 3 players: [C, D, W]. 4 players: [C, D, W, M].
                // If we have 3 players (C, D, W taken), and add 4th.
                // idealRoles(4) = [C, D, W, M].
                // Available = [M]. So bot gets Mastermind.

                // What if we have 1 player (no pref). Add bot 1.
                // idealRoles(2) = [C, D]. 
                // taken = []. 
                // available = [C, D]. 
                // Bot gets C? Then Human gets D?
                // If we assign C to bot, it's locked. Human is forced to D.
                // This seems to be what is requested: "Add bot... according to roles".

                // BUT: randomized shuffling in assignRoles might be desired for humans?
                // "Upon adding bots manually... add one by one... according to basic roles... respecting existing players"
                // If the user wants to CONSTRUCT the game composition, we should lock roles.

                // Let's try to find the "new" role introduced by incrementing count.
                // roles(n) vs roles(n+1). The difference is usually the last one, but not always if priority changes.
                // In getRolesForPlayerCount, it adds sequentially.
                // So the "new" role is the last one in idealRoles.

                // Wait, if I have 1 player (Human).
                // Add Bot 1 -> Count 2. roles=[C, D]. Human has no pref.
                // Should Bot be C or D?
                // If I assume Human fills one slot, Bot fills the other.
                // If I lock Bot to C, Human is D.
                // If I lock Bot to D, Human is C.
                // The previous logic didn't lock bots in Lobby.

                // If the user request implies "I want to add a Detective Bot", then I should lock it.
                // The UI shows " + Bot (Detective) ".
                // So yes, I should lock it.

                // Which role to lock?
                // The UI uses `nextRole` logic: `ROLE_ORDER[players.length]`.
                // Let's use the SAME logic as UI to be consistent.

                // UI Logic:
                const ROLE_ORDER = [
                    ROLE_TYPES.CULPRIT,     // 1. الجاني
                    ROLE_TYPES.WITNESS,     // 2. الشاهد
                    ROLE_TYPES.DETECTIVE,   // 3. المحقق
                    ROLE_TYPES.SABOTEUR,    // 4. المخرب
                    ROLE_TYPES.MINISTER,    // 5. الوزير (كان المستفيد)
                    ROLE_TYPES.BENEFICIARY, // 6. المستفيد (كان الوزير)
                    ROLE_TYPES.SEER,        // 7. العراف
                    ROLE_TYPES.MASTERMIND   // 8. العقل المدبر
                ];

                // We need to find the first role in ROLE_ORDER that is NOT taken by any existing player (preferred)
                // AND we want to fill up to current count.

                // Actually, simply assigning the `nextRole` from the list based on current count is risky if players have random prefs.
                // But usually players don't have prefs in Host mode.
                // In Training mode, they do.

                // Algorithm:
                // 1. Get set of preferred roles from existing players.
                // 2. Iterate ROLE_ORDER.
                // 3. Skip roles that are taken.
                // 4. Assign the first available role to the new bot.
                // 5. BUT: We only want to assign ONE role.
                // And we want it to be consistent with "adding one by one".

                // If I have 1 player (preferred=Detective).
                // ROLE_ORDER: C, D, W, M...
                // C is free. D is taken. W is free.
                // Should the new bot be C? Yes.
                // Next bot? W.

                // If I have 1 player (No pref).
                // C is free.
                // Bot 1 -> C.
                // Bot 2 -> D.
                // Human -> ? (Will be assigned leftover, e.g. W).

                // This seems fair.

                let assignedRole = null;
                let assignedRoleName = "";

                for (const roleCode of ROLE_ORDER) {
                    if (!takenRoles.includes(roleCode)) {
                        // Check if this role is already assigned to a bot we just added?
                        // We need to check all players in room.
                        const isAssigned = room.players.some(p => p.preferredRole === roleCode);
                        if (!isAssigned) {
                            assignedRole = roleCode;
                            const info = getRoleInfo(roleCode);
                            assignedRoleName = info ? `(${info.nameAr})` : "";
                            break;
                        }
                    }
                }

                room.players.push({
                    id: botId,
                    name: `Bot ${botCount} 🤖 ${assignedRoleName} `,
                    score: 0,
                    role: assignedRole, // Set as role (will be preferredRole in logic)
                    preferredRole: assignedRole, // Lock it
                    isLeader: false,
                    connected: true,
                    isBot: true,
                    avatar: generateRandomBotAvatar()
                });

                // Notify everyone
                io.to(roomCode).emit('playerJoined', room.players);
                logger.info(`🤖 Added 1 bot(${assignedRole}) to room ${roomCode} `);
            } else {
                socket.emit('error', 'العدد مكتمل (الحد الأقصى 8)');
            }
        });

        // Host starts the game
        socket.on('startGame', () => {
            // Preserve isTutorial flag — don't hardcode false
            const currentRoom = Object.values(rooms).find(r => r.hostId === socket.id);
            phases.startGameLogic(socket, currentRoom?.isTutorial || false);
        });

        // Start Tutorial Match
        socket.on('startTutorial', (desiredRole) => {
            logger.info('Received startTutorial event from:', socket.id);
            phases.startTutorialLogic(socket, desiredRole);
        });























        // Assign Roles Logic — ضامن عدم التكرار

        // Helper function to end game

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

        // ============================================
        // 💰 V4 OFFERS MECHANISM
        // ============================================
        socket.on('sendOffer', ({ roomCode, targetId, amount, isViaMastermind }) => {
            const room = rooms[roomCode];
            if (!room) return;
            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;

            // ✅ حد عرض واحد كل جولة (فحص جانب الخادم)
            if (player.offerSentThisRound) {
                socket.emit('offerResult', { success: false, message: '⚠️ لقد أرسلت عرضاً بالفعل هذه الجولة!' });
                return;
            }

            const result = handleSendOffer(io, room, player, { targetId, amount, isViaMastermind });
            if (result.success) {
                player.offerSentThisRound = true; // ✅ تسجيل أن العرض أُرسل
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
            // فحص المدخلات ومنع هجمات حجم البيانات
            const validationError = validateInput(
                { roomCode, answer },
                {
                    roomCode: { required: true, type: 'string', maxLength: 10 },
                    answer: { required: true, type: 'string', maxLength: 5000 }
                }
            );
            if (validationError) {
                socket.emit('error', validationError);
                return;
            }
            const room = rooms[roomCode];
            if (room && room.state === 'DRAFTING') {
                room.answers[socket.id] = answer;

                // Check for Blitz Sabotage (Word Swap)
                const player = room.players.find(p => p.id === socket.id);
                if (player && player.sabotageType === 'WORD_SWAP') {
                    phases.applyBlitzSabotage(room, socket.id);
                }

                // 👮 قدرة الضابط - تتبع وقت الإرسال
                if (!room.submissionTimes) {
                    room.submissionTimes = {};
                }
                room.submissionTimes[socket.id] = Date.now();

                // Notify host
                if (player) {
                    io.to(room.hostId).emit('playerSubmitted', { playerId: socket.id, playerName: player.name });
                }

                // Check if all players submitted
                phases.checkDraftingComplete(roomCode);
            }
        });

        // Helper: Apply Sabotage Word Swap

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
                    // Blitz Mode: نسب متناقصة لكل فراغ (70% للأول، 50% للثاني، 30% للثالث...)
                    const template = room.currentScenario.template;
                    const blanks = room.currentScenario.blanks || [];
                    const parts = template.split('_____');

                    const revealedBlanks = [];
                    // نسبة الدقة: تبدأ من 70% وتنقص 20% لكل فراغ (بحد أدنى 10%)
                    for (let i = 0; i < parts.length - 1; i++) {
                        const accuracy = Math.max(0.1, 0.7 - (i * 0.2));
                        if (Math.random() < accuracy) {
                            revealedBlanks.push(blanks[i] || '_____');
                        } else {
                            revealedBlanks.push('???'); // فراغ لم يُكشف
                        }
                    }

                    // بناء النص الكامل من القالب + الفراغات المكشوفة
                    let finalAnswer = '';
                    parts.forEach((part, idx) => {
                        finalAnswer += part;
                        if (idx < parts.length - 1) {
                            finalAnswer += revealedBlanks[idx];
                        }
                    });

                    // ✅ إرسال فوري - لا يمكن للعراف التعديل
                    room.answers[socket.id] = finalAnswer;
                    if (!room.submissionTimes) room.submissionTimes = {};
                    room.submissionTimes[socket.id] = Date.now();
                    player.abilityUsed = true;

                    // إبلاغ العراف بالفراغات المكشوفة ثم قفل التقرير فوراً
                    socket.emit('fillBlitzBlanks', { blanks: revealedBlanks });
                    socket.emit('abilityResult', {
                        type: 'REVELATION_SUCCESS',
                        message: `🔮 تم إرسال تقريرك تلقائياً بعد الوحي!(الفراغ الأول: 70 %، الثاني: 50 %، وهكذا...)`
                    });

                    io.to(room.hostId).emit('playerSubmitted', { playerId: player.id, playerName: player.name });
                    phases.checkDraftingComplete(roomCode);

                } else {
                    // Classic Mode: Full Story - إرسال فوري ومباشر
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
                    phases.checkDraftingComplete(roomCode);
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
                // 👁️ Witness Ability
                let flashKeywords = room.currentScenario.keywords || [];

                if (room.gameMode === 'BLITZ') {
                    const blanks = room.currentScenario.blanks || [];
                    const template = room.currentScenario.template || '';

                    // ✅ تحسين: نُبقي الكلمات التي تعطي السياق وتُحذف كلمات أدوات الفراغ الحرفية
                    const filtered = flashKeywords.filter(kw => {
                        // لا تُظهر كلمة إذا كانت هي نفسها الإجابة الصحيحة للفراغ
                        const isBlankAnswer = blanks.some(b => b === kw || b.includes(kw));
                        // لا تُظهر كلمة قصيرة جداً (أقل من 3 أحرف)
                        const isTooShort = kw.length < 3;
                        return !isBlankAnswer && !isTooShort;
                    });

                    // إذا بقي شيء بعد التصفية استخدمه، وإلا أرسل الكلمات الأصلية
                    flashKeywords = filtered.length >= 2 ? filtered : (room.currentScenario.keywords || ['ركز', 'السياق', 'القضية']);
                }

                socket.emit('abilityResult', {
                    type: 'FLASH_MEMORY',
                    keywords: flashKeywords
                });
                player.abilityUsed = true;

            } else if (player.role === ROLE_TYPES.SABOTEUR && abilityType === 'SABOTAGE') {
                // 🧨 Saboteur Ability — نفس التأثير في كلا الوضعين (Classic + Blitz)
                const targetPlayer = room.players.find(p => p.id === targetId);
                if (!targetPlayer) return;

                targetPlayer.sabotagedBy = player.id;
                targetPlayer.sabotageType = 'INVESTIGATION_FLIP';
                player.sabotageTarget = targetId; // ✅ حفظ الهدف على المخرب نفسه لحساب النقاط

                socket.emit('abilityResult', {
                    type: 'SABOTAGE',
                    targetName: targetPlayer.name,
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
                phases.startCulpritVoting(roomCode);
            }
        });

        // ============================================
        // المرحلة الأولى: Quality Voting
        // ============================================
        socket.on('submitQualityVote', ({ roomCode, scenarioIndex }) => {
            if (validateInput({ roomCode, scenarioIndex }, {
                roomCode: { required: true, type: 'string', maxLength: 10 },
                scenarioIndex: { required: true, type: 'number' }
            })) { socket.emit('error', 'مدخلات غير صالحة'); return; }
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

                phases.checkQualityVotingComplete(roomCode);
            }
        });

        // ============================================
        // المرحلة الثانية: Culprit Voting
        // ============================================
        socket.on('submitCulpritVote', ({ roomCode, playerId }) => {
            if (validateInput({ roomCode, playerId }, {
                roomCode: { required: true, type: 'string', maxLength: 10 },
                playerId: { required: true, type: 'string', maxLength: 100 }
            })) { socket.emit('error', 'مدخلات غير صالحة'); return; }
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

                phases.checkCulpritVotingComplete(roomCode);
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
                if (!voter || voter.eliminated) return; // Prevent eliminated players from voting

                if (room.state === 'QUALITY_VOTING') {
                    room.qualityVotes[socket.id] = qualityVote;
                    phases.checkQualityVotingComplete(roomCode);
                } else if (room.state === 'CULPRIT_VOTING') {
                    const target = room.players.find(p => p.id === identityVote);

                    // Prevent voting for excluded players
                    if (target && target.isExcluded) {
                        socket.emit('error', 'لا يمكنك التصويت للاعب مستبعد!');
                        return;
                    }

                    room.culpritVotes[socket.id] = identityVote;
                    phases.checkCulpritVotingComplete(roomCode);
                }
            }
        });

        // Host requests next round
        socket.on('nextRound', async ({ roomCode: providedCode } = {}) => {
            let roomCode = null;

            // Priority 1: استخدم roomCode المُرسل من العميل مباشرة (أكثر موثوقية)
            if (providedCode && rooms[providedCode.toUpperCase()]) {
                roomCode = providedCode.toUpperCase();
                // تحديث hostId إذا تغيّر (حالة إعادة الاتصال)
                if (rooms[roomCode].hostId !== socket.id) {
                    rooms[roomCode].hostId = socket.id;
                }
            }

            // Priority 2: Fallback — بحث بـ hostId
            if (!roomCode) {
                for (const code in rooms) {
                    if (rooms[code].hostId === socket.id) {
                        roomCode = code;
                        break;
                    }
                }
            }

            logger.info(`[nextRound] room = ${roomCode} socket = ${socket.id.substring(0, 8)} provided = ${providedCode} `);

            if (roomCode) {
                // ✅ دائماً أضف الـ socket للغرفة لضمان استلام الأحداث
                await socket.join(roomCode);
                const room = rooms[roomCode];
                if (room.roundOutcome === 'CONTINUE') {
                    room.roundOutcome = null;
                    room.roundEnded = false;      // ✅ FIX-A: allow second endRound call in CONTINUE flow
                    room.votingProcessed = false; // ✅ FIX-A: reset for new voting round
                    io.to(roomCode).emit('roundContinued', { round: room.currentRound });
                    phases.startDiscussion(roomCode);
                } else {
                    phases.startNewRound(roomCode);
                }
            } else {
                logger.warn(`[nextRound] Room not found! socket = ${socket.id} `);
            }
        });

        socket.on('disconnect', () => {
            logger.info('User disconnected:', socket.id);
            // Handle disconnection logic
            for (const code in rooms) {
                const room = rooms[code];
                const player = room.players.find(p => p.id === socket.id);

                if (player) {
                    player.connected = false;
                    // We don't remove the player to allow reconnection
                    // But we notify others
                    io.to(code).emit('playerJoined', room.players); // Update list to show status

                    // If in voting phase, check if we can proceed now that a player disconnected
                    if (room.state === 'CULPRIT_VOTING') {
                        phases.checkCulpritVotingComplete(code);
                    } else if (room.state === 'QUALITY_VOTING') {
                        phases.checkQualityVotingComplete(code);
                    }

                    break;
                }
            }
        });
    });
}
module.exports = registerHandlers;
