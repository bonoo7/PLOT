const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

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
const scenarios = [
    {
        id: 1,
        title: "سرقة منتصف الليل",
        story: "لص اقتحم متجراً لسرقة كعكة عيد ميلاد، لكنه نام داخل المتجر بسبب تعاطي دواء منوم بالخطأ.",
        keywords: ["دواء", "نوم", "كعكة"],
        tricksterWord: "زرافة"
    },
    {
        id: 2,
        title: "الهروب الكبير",
        story: "حاول سجين الهروب بحفر نفق، لكنه انتهى به المطاف في غرفة استراحة الحراس يشاهد التلفاز معهم.",
        keywords: ["نفق", "حراس", "تلفاز"],
        tricksterWord: "بيتزا"
    }
];

function getRoleName(role) {
    const names = {
        'WITNESS': 'الشاهد',
        'ARCHITECT': 'المهندس',
        'DETECTIVE': 'المحقق',
        'SPY': 'الجاسوس',
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

function startDraftingPhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.state = 'DRAFTING';
    room.answers = {};
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
}

function calculateScores(room) {
    const scores = {};
    room.players.forEach(p => scores[p.id] = 0);

    const witness = room.players.find(p => p.role === 'WITNESS');
    const architect = room.players.find(p => p.role === 'ARCHITECT');
    const detective = room.players.find(p => p.role === 'DETECTIVE');

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
    if (witness && witnessFoundCount < (room.players.length / 2)) {
        scores[witness.id] += 2000;
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
            state: 'LOBBY' // LOBBY, PLAYING, END
        };
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
        console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    // Player joins a room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms[roomCode.toUpperCase()];
        
        if (room) {
            if (room.state !== 'LOBBY') {
                socket.emit('error', 'اللعبة بدأت بالفعل');
                return;
            }
            
            const player = {
                id: socket.id,
                name: playerName,
                score: 0,
                role: null
            };
            
            room.players.push(player);
            socket.join(roomCode.toUpperCase());
            
            // Notify player they joined
            socket.emit('joinedRoom', { roomCode: roomCode.toUpperCase(), playerId: socket.id });
            
            // Notify host (and everyone in room) about new player
            io.to(roomCode.toUpperCase()).emit('playerJoined', room.players);
            
            console.log(`${playerName} joined room ${roomCode}`);
        } else {
            socket.emit('error', 'الغرفة غير موجودة');
        }
    });

    // Host starts the game
    socket.on('startGame', () => {
        console.log('Received startGame request from:', socket.id);
        
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
            console.log('Error: Room not found for host:', socket.id);
            socket.emit('error', 'حدث خطأ: لم يتم العثور على الغرفة. حاول إعادة إنشاء الغرفة.');
            return;
        }

        console.log(`Starting game for room ${roomCode} with ${room.players.length} players`);

        if (room.players.length < 3) {
            console.log('Error: Not enough players');
            socket.emit('error', 'عدد اللاعبين غير كافٍ (الحد الأدنى 3)');
            return;
        }

        room.state = 'PLAYING';
        
        // Select random scenario
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        room.currentScenario = scenario;

        // Assign Roles
        const shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random());
        const roles = ['WITNESS', 'ARCHITECT', 'DETECTIVE'];
        
        // Add more roles if players > 3
        if (shuffledPlayers.length > 3) roles.push('SPY');
        if (shuffledPlayers.length > 4) roles.push('TRICKSTER');
        while (roles.length < shuffledPlayers.length) {
            roles.push('CITIZEN');
        }

        // Shuffle roles
        const shuffledRoles = roles.sort(() => 0.5 - Math.random());

        // Assign and send data
        shuffledPlayers.forEach((player, index) => {
            const role = shuffledRoles[index];
            player.role = role;
            
            let roleData = {
                role: role,
                roleName: getRoleName(role),
                description: getRoleDescription(role),
                info: null
            };

            if (role === 'WITNESS') {
                roleData.info = scenario.story;
            } else if (role === 'ARCHITECT') {
                roleData.info = `كلماتك المفتاحية: ${scenario.keywords.join(' - ')}`;
            } else if (role === 'DETECTIVE') {
                roleData.info = `عنوان القضية: ${scenario.title}`;
            } else if (role === 'TRICKSTER') {
                roleData.info = `كلمتك الدخيلة: ${scenario.tricksterWord}`;
            } else {
                roleData.info = "انتظر التعليمات...";
            }

            io.to(player.id).emit('roleAssigned', roleData);
        });

        // Notify Host
        io.to(roomCode).emit('gameStarted', {
            title: scenario.title
        });
        
        console.log(`Game started in room ${roomCode}`);
        
        // Start Drafting Phase after 5 seconds (to let players read roles)
        setTimeout(() => {
            startDraftingPhase(roomCode);
        }, 5000);
    });

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
            if (Object.keys(room.answers).length === room.players.length) {
                clearInterval(room.timer);
                startPresentationPhase(roomCode);
            }
        }
    });

    socket.on('submitVote', ({ roomCode, qualityVote, identityVote }) => {
        const room = rooms[roomCode];
        if (room && room.state === 'VOTING') {
            room.votes[socket.id] = { quality: qualityVote, identity: identityVote };
            
            // Check if all voted
            if (Object.keys(room.votes).length === room.players.length) {
                endRound(roomCode);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle disconnection logic (remove player, etc.) - Basic implementation for now
        for (const code in rooms) {
            const room = rooms[code];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(code).emit('playerJoined', room.players); // Update list
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
