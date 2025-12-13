const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

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

function getRoleName(role) {
    const names = {
        'WITNESS': 'الشاهد',
        'ARCHITECT': 'المهندس',
        'DETECTIVE': 'المحقق',
        'SPY': 'الجاسوس',
        'ACCOMPLICE': 'المتواطئ',
        'LAWYER': 'المحامي',
        'TRICKSTER': 'المخادع',
        'CITIZEN': 'مواطن'
    };
    return names[role] || role;
}

function getRoleDescription(role) {
     const descs = {
        'WITNESS': 'أنت الوحيد الذي يعرف الحقيقة. اكتب تبريراً مقنعاً دون أن تكشف نفسك.',
        'ARCHITECT': 'لديك كلمات مبعثرة. ابنِ كذبة متماسكة لتبدو كأنك تعرف القصة.',
        'DETECTIVE': 'مهمتك كشف الشاهد والمهندس. راقب الإجابات بدقة.',
        'SPY': 'حاول معرفة القصة ونسخها.',
        'ACCOMPLICE': 'أنت تعرف الشاهد. مهمتك حمايته وتضليل المحقق.',
        'LAWYER': 'لديك موكل. دافع عنه وتأكد من عدم حصوله على أصوات اتهام.',
        'TRICKSTER': 'أدخل الكلمة الدخيلة في إجابتك بشكل مضحك.',
        'CITIZEN': 'حاول أن تبدو بريئاً.'
    };
    return descs[role] || '';
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

    // Handle Bots
    room.players.forEach(p => {
        if (p.isBot) {
            simulateBotDrafting(room, p);
        }
    });
}

function simulateBotDrafting(room, bot) {
    let targetText = "";
    if (bot.role === 'WITNESS') {
        targetText = room.currentScenario.story;
    } else if (bot.role === 'ARCHITECT') {
        targetText = `أعتقد أن القصة تتعلق بـ ${room.currentScenario.keywords.join(' و ')}... ربما حدث شيء غريب!`;
    } else if (bot.role === 'TRICKSTER') {
        targetText = `بصراحة، رأيت ${room.currentScenario.tricksterWord} يطير في السماء وكان المنظر مضحكاً جداً!`;
    } else {
        const excuses = [
            "كنت نائماً وقت الحادث ولا أعرف شيئاً.",
            "سمعت ضجة كبيرة ولكن لم أرَ التفاصيل.",
            "أظن أن الفاعل هرب من النافذة الخلفية.",
            "لا علاقة لي بهذا الأمر، أنا بريء!"
        ];
        targetText = excuses[Math.floor(Math.random() * excuses.length)];
    }

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
    const room = rooms[roomCode];
    if (!room) return;
    
    room.state = 'PRESENTATION';
    io.to(roomCode).emit('startPresentation');
    
    // Send answers to host
    const answersList = room.players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        answer: room.answers[p.id] || "لم يكتب شيئاً..."
    }));
    
    io.to(room.hostId).emit('receiveAnswers', answersList);
    
    // Start Voting Phase after 10 seconds of reading answers
    setTimeout(() => {
        startVotingPhase(roomCode);
    }, 10000);
}

function checkVotingComplete(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (Object.keys(room.votes).length === room.players.length) {
        endRound(roomCode);
    }
}

function startVotingPhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'VOTING';
    room.votes = {}; // { playerId: { quality: targetId, identity: targetId } }
    
    // Send answers list to players for voting (without names for quality vote)
    const anonymousAnswers = room.players.map(p => ({
        id: p.id,
        answer: room.answers[p.id] || "..."
    }));

    // Send players list for identity vote
    const playersList = room.players.map(p => ({
        id: p.id,
        name: p.name
    }));

    io.to(roomCode).emit('startVoting', { 
        answers: anonymousAnswers,
        players: playersList
    });

    // Handle Bots Voting
    room.players.forEach(p => {
        if (p.isBot) {
            setTimeout(() => {
                // Bot votes randomly
                // Quality Vote: Random player who is NOT self
                const otherPlayers = room.players.filter(op => op.id !== p.id);
                const qualityTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
                
                // Identity Vote: Random player
                const identityTarget = room.players[Math.floor(Math.random() * room.players.length)].id;

                room.votes[p.id] = { quality: qualityTarget, identity: identityTarget };
                checkVotingComplete(roomCode);
            }, 5000 + Math.random() * 10000); // Vote after 5-15 seconds
        }
    });
}

function calculateScores(room) {
    const scores = {};
    room.players.forEach(p => scores[p.id] = 0);

    const witness = room.players.find(p => p.role === 'WITNESS');
    const architect = room.players.find(p => p.role === 'ARCHITECT');
    const detective = room.players.find(p => p.role === 'DETECTIVE');
    const accomplice = room.players.find(p => p.role === 'ACCOMPLICE');
    const lawyer = room.players.find(p => p.role === 'LAWYER');

    // Count votes
    const qualityVotes = {}; // targetId -> count
    const identityVotes = {}; // targetId -> count

    Object.values(room.votes).forEach(vote => {
        if (vote.quality) {
            qualityVotes[vote.quality] = (qualityVotes[vote.quality] || 0) + 1;
        }
        if (vote.identity) {
            identityVotes[vote.identity] = (identityVotes[vote.identity] || 0) + 1;
        }
    });

    // Find player with most identity votes (The Accused)
    let maxIdentityVotes = 0;
    let accusedId = null;
    for (const [id, count] of Object.entries(identityVotes)) {
        if (count > maxIdentityVotes) {
            maxIdentityVotes = count;
            accusedId = id;
        } else if (count === maxIdentityVotes) {
            accusedId = null; // Tie means no single accused
        }
    }

    // 1. Logic Vote Points (+1000 per vote)
    for (const [targetId, count] of Object.entries(qualityVotes)) {
        scores[targetId] += count * 1000;
    }

    // 2. Deduction Points
    // Detective finds Witness (+2500)
    if (detective && room.votes[detective.id]?.identity === witness?.id) {
        scores[detective.id] += 2500;
    }

    // Others find Witness (+500)
    room.players.forEach(p => {
        if (p.role !== 'DETECTIVE' && p.role !== 'WITNESS' && room.votes[p.id]?.identity === witness?.id) {
            scores[p.id] += 500;
        }
    });

    // 3. Deception Points
    // Architect beats Witness in quality votes (+1500)
    const architectVotes = qualityVotes[architect?.id] || 0;
    const witnessVotes = qualityVotes[witness?.id] || 0;
    if (architect && witness && architectVotes > witnessVotes) {
        scores[architect.id] += 1500;
    }

    // Witness survives (less than 50% found him)
    const witnessFoundCount = identityVotes[witness?.id] || 0;
    const witnessSurvived = witness && witnessFoundCount < (room.players.length / 2);
    
    if (witnessSurvived) {
        scores[witness.id] += 2000;
    }

    // Accomplice Bonus: If Witness wins quality vote OR survives
    if (accomplice && witness) {
        // If Witness got most quality votes (or tied for most)
        const maxQualityVotes = Math.max(...Object.values(qualityVotes), 0);
        const witnessWonQuality = witnessVotes === maxQualityVotes && witnessVotes > 0;

        if (witnessSurvived || witnessWonQuality) {
            scores[accomplice.id] += 1500;
        }
    }

    // Lawyer Bonus: If Client is NOT the Accused (most voted)
    if (lawyer && lawyer.lawyerClient) {
        // If client didn't get the MOST votes (even if they got some)
        if (lawyer.lawyerClient !== accusedId) {
            scores[lawyer.id] += 1500;
        }
    }

    return scores;
}

function endRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const roundScores = calculateScores(room);
    
    // Update total scores
    room.players.forEach(p => {
        p.score += (roundScores[p.id] || 0);
    });

    const results = room.players.map(p => ({
        name: p.name,
        role: getRoleName(p.role),
        roundScore: roundScores[p.id] || 0,
        totalScore: p.score
    })).sort((a, b) => b.totalScore - a.totalScore);

    io.to(roomCode).emit('roundResults', { results });
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
    socket.on('joinRoom', ({ roomCode, playerName }) => {
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
                            totalRounds: room.totalRounds
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
                role: null,
                isLeader: isLeader,
                connected: true
            };
            
            room.players.push(player);
            socket.join(roomCode.toUpperCase());
            
            // Notify player they joined
            socket.emit('joinedRoom', { 
                roomCode: roomCode.toUpperCase(), 
                playerId: socket.id,
                isLeader: isLeader
            });
            
            // Notify host (and everyone in room) about new player
            io.to(roomCode.toUpperCase()).emit('playerJoined', room.players);
            
            console.log(`${playerName} joined room ${roomCode}`);

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
                    totalRounds: room.totalRounds
                });
            }

        } else {
            socket.emit('error', 'الغرفة غير موجودة');
        }
    });

    // Host starts the game
    socket.on('startGame', () => {
        startGameLogic(socket, false);
    });

    // Start Tutorial Match
    socket.on('startTutorial', (desiredRole) => {
        startGameLogic(socket, true, desiredRole);
    });

    function startGameLogic(socket, isTutorial, desiredRole = null) {
        console.log(`Received ${isTutorial ? 'startTutorial' : 'startGame'} request from:`, socket.id);
        
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

        if (!isTutorial && room.players.length < 3) {
            console.log('Error: Not enough players');
            socket.emit('error', 'عدد اللاعبين غير كافٍ (الحد الأدنى 3)');
            return;
        }

        // Add Bots for Tutorial if needed
        if (isTutorial) {
            let botCount = 0;
            // Ensure at least 4 players for a good experience
            while (room.players.length < 4) {
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
        }

        // Reset game state if starting new game
        if (room.state === 'LOBBY' || room.state === 'END') {
            room.currentRound = 0;
            room.usedScenarios = [];
            room.players.forEach(p => p.score = 0);
            room.isTutorial = isTutorial; // Set Tutorial Flag
            room.totalRounds = isTutorial ? 1 : 3; // Tutorial is 1 round
            
            if (isTutorial && desiredRole) {
                room.tutorialData = { userId: socket.id, role: desiredRole };
            } else {
                room.tutorialData = null;
            }
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

        // Assign Roles
        let shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random());
        const roles = ['WITNESS', 'ARCHITECT', 'DETECTIVE'];
        
        // Add more roles if players > 3
        if (shuffledPlayers.length > 3) roles.push('SPY');
        if (shuffledPlayers.length > 4) roles.push('ACCOMPLICE');
        if (shuffledPlayers.length > 5) roles.push('LAWYER');
        if (shuffledPlayers.length > 6) roles.push('TRICKSTER');
        
        while (roles.length < shuffledPlayers.length) {
            roles.push('CITIZEN');
        }

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
                const roleIndex = roles.indexOf(role);
                if (roleIndex !== -1) {
                    roles.splice(roleIndex, 1);
                } else {
                    // If role wasn't in the list (e.g. CITIZEN when not enough players), just replace a random role or add it?
                    // For simplicity, if it's a special role not in list, we swap it with something.
                    // But since we added bots to ensure 4 players, basic roles should be there.
                    // If user chose CITIZEN, we just remove one CITIZEN or random role.
                    // Let's just remove the first element to keep count correct.
                    roles.shift();
                }

                // Put target player back at the beginning (or separate list)
                // We will handle them separately or just push back and skip in loop?
                // Better: Assign to others then add target back.
                
                // Shuffle remaining roles
                const shuffledRoles = roles.sort(() => 0.5 - Math.random());
                
                // Assign roles to others
                shuffledPlayers.forEach((player, index) => {
                    player.role = shuffledRoles[index];
                });

                // Add target player back
                shuffledPlayers.push(targetPlayer);
            } else {
                // Fallback if player not found
                const shuffledRoles = roles.sort(() => 0.5 - Math.random());
                shuffledPlayers.forEach((player, index) => {
                    player.role = shuffledRoles[index];
                });
            }
        } else {
            // Standard Shuffle
            const shuffledRoles = roles.sort(() => 0.5 - Math.random());
            shuffledPlayers.forEach((player, index) => {
                player.role = shuffledRoles[index];
            });
        }

        // Find Witness for Accomplice logic
        const witnessIndex = shuffledRoles.indexOf('WITNESS');
        const witnessPlayer = witnessIndex !== -1 ? shuffledPlayers[witnessIndex] : null;

        // Assign and send data
        shuffledPlayers.forEach((player) => {
            const role = player.role;
            
            // Logic for Lawyer's Client (Random player who is NOT the Lawyer)
            let lawyerClientName = null;
            if (role === 'LAWYER') {
                const potentialClients = shuffledPlayers.filter(p => p.id !== player.id);
                const client = potentialClients[Math.floor(Math.random() * potentialClients.length)];
                player.lawyerClient = client.id; // Store client ID on lawyer player object
                lawyerClientName = client.name;
            }

            let roleData = {
                role: role,
                roleName: getRoleName(role),
                description: getRoleDescription(role),
                info: null,
                round: room.currentRound,
                totalRounds: room.totalRounds
            };

            if (role === 'WITNESS') {
                roleData.info = room.currentScenario.story;
            } else if (role === 'ARCHITECT') {
                roleData.info = `كلماتك المفتاحية: ${room.currentScenario.keywords.join(' - ')}`;
            } else if (role === 'DETECTIVE') {
                roleData.info = `عنوان القضية: ${room.currentScenario.title}`;
            } else if (role === 'ACCOMPLICE') {
                roleData.info = `الشاهد هو: ${witnessPlayer ? witnessPlayer.name : 'غير معروف'}. ساعده!`;
            } else if (role === 'LAWYER') {
                roleData.info = `موكلك هو: ${lawyerClientName}. دافع عنه!`;
            } else if (role === 'TRICKSTER') {
                roleData.info = `كلمتك الدخيلة: ${room.currentScenario.tricksterWord}`;
            } else {
                roleData.info = "انتظر التعليمات...";
            }

            io.to(player.id).emit('roleAssigned', roleData);
        });

        // Notify Host
        io.to(roomCode).emit('gameStarted', {
            title: room.isTutorial ? `(تدريب) ${room.currentScenario.title}` : room.currentScenario.title,
            round: room.currentRound,
            totalRounds: room.totalRounds,
            isTutorial: room.isTutorial
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
        }
    });

    socket.on('submitVote', ({ roomCode, qualityVote, identityVote }) => {
        const room = rooms[roomCode];
        if (room && room.state === 'VOTING') {
            // Prevent self-voting for quality
            if (qualityVote === socket.id) {
                socket.emit('error', 'لا يمكنك التصويت لنفسك!');
                return;
            }

            room.votes[socket.id] = { quality: qualityVote, identity: identityVote };
            
            // Check if all voted
            checkVotingComplete(roomCode);
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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
