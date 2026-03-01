import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Alert } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { DEV_SERVER_IP, DEV_SERVER_PORT, PROD_SERVER_URL } from '../constants/config';

// Compute the URL
const isWebBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

let SOCKET_URL;
if (isWebBrowser) {
    // On web browser, connect to same origin (server serves web bundle too)
    SOCKET_URL = window.location.origin;
} else if (__DEV__) {
    // On mobile dev, connect to local IP
    SOCKET_URL = `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}`;
} else {
    SOCKET_URL = PROD_SERVER_URL;
}

console.log('🌐 Socket URL:', SOCKET_URL);

// شاشات الملاحة (للاستخدام مع React Navigation)
export const ROUTES = {
    ROLE_SELECT: 'RoleSelect',
    HOW_TO_PLAY: 'HowToPlay',
    TRAINING_ROLE_SELECT: 'TrainingRoleSelect',
    TRAINING_JOIN: 'TrainingJoin',
    HOST_SETUP: 'HostSetup',
    HOST_LOBBY: 'HostLobby',
    HOST_GAME_INTRO: 'HostGameIntro',
    HOST_DRAFTING: 'HostDrafting',
    HOST_QUALITY_VOTING: 'HostQualityVoting',
    HOST_DRAMATIC_REVEAL: 'HostDramaticReveal',
    HOST_DISCUSSION: 'HostDiscussion',
    HOST_CULPRIT_VOTING: 'HostCulpritVoting',
    HOST_RESULTS: 'HostResults',
    LOGIN: 'Login',
    LOBBY: 'Lobby',
    GAME: 'Game',
    DRAFTING: 'Drafting',
    QUALITY_VOTING: 'QualityVoting',
    PLAYER_DRAMATIC_REVEAL: 'PlayerDramaticReveal',
    DISCUSSION: 'Discussion',
    CULPRIT_VOTING: 'CulpritVoting',
    WAITING: 'Waiting',
    END: 'End',
};

// --- Socket Context Setup ---
const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children, navigationRef }) => {
    const { socket, manualReconnect } = useGameSocket(navigationRef);

    return (
        <SocketContext.Provider value={{ socket, manualReconnect }}>
            {children}
        </SocketContext.Provider>
    );
};
// -----------------------------

export const useGameSocket = (navigationRef) => {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);
    const reconnectInterval = useRef(null);

    const {
        roomCode,
        playerName,
        userRole,
        setGeneratedRoomCode,
        setPlayers,
        setConnecting,
        setRoleData,
        setGameMode,
        setTotalRounds,
        setCurrentRound,
        setScenario,
        setRoundResults,
        setIsSubmitted,
        setAnswer,
        setHasVoted,
        setLiveVotes,
        setRevealedScenarios,
        setTemplate,
        setTimeLeft,
        setWaitingFor,
        setScenarios,
        setSelectedScenario,
        setCurrentReveal,
        setSpeakingPlayerId,
        setLastHint,
        setSelectedCulprit,
        clearRoundState,
        resetGame,
    } = useGameStore();

    const navigate = (routeName, params) => {
        if (navigationRef?.current && navigationRef.current.isReady()) {
            navigationRef.current.navigate(routeName, params);
        } else {
            console.warn(`Navigation Ref not ready. Wanted to navigate to ${routeName}`);
        }
    };

    useEffect(() => {
        if (socketRef.current) return; // Prevent multiple connections

        console.log('🔄 Initializing socket connection...');
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 10000, // 10 seconds timeout
            forceNew: true
        });

        setSocket(newSocket);
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('✅ Connected to socket server:', newSocket.id);
            setConnecting(false);
            if (reconnectInterval.current) {
                clearInterval(reconnectInterval.current);
                reconnectInterval.current = null;
            }
            // Auto rejoin if state already has roomCode (e.g. page refresh or socket reconnect)
            const state = useGameStore.getState();
            if (state.roomCode) {
                if (state.userRole === 'HOST') {
                    console.log('🔄 Rejoining as Host...');
                    newSocket.emit('rejoinHost', { roomCode: state.roomCode });
                } else if (state.playerName) {
                    console.log('🔄 Rejoining as Player...');
                    newSocket.emit('joinRoom', { roomCode: state.roomCode, playerName: state.playerName });
                }
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
            if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
                if (!reconnectInterval.current && roomCode && playerName) {
                    console.log('🔄 Attempting aggressive manual reconnect...');
                    reconnectInterval.current = setInterval(() => {
                        if (!newSocket.connected) {
                            console.log('🔁 Forcing reconnect...');
                            newSocket.connect();
                            newSocket.emit('joinRoom', { roomCode, playerName });
                        }
                    }, 3000);
                }
            }
        });

        newSocket.on('roomCreated', (data) => {
            // ✅ استخراج آمن - دائماً String
            let roomCode, gameMode;
            if (typeof data === 'string') {
                roomCode = data;
                gameMode = 'BLITZ'; // الافتراضي
            } else if (data && typeof data === 'object') {
                roomCode = String(data.roomCode || '');
                gameMode = String(data.gameMode || 'BLITZ');
            } else {
                console.error('❌ roomCreated: unexpected data format', data);
                return;
            }

            console.log('🏠 Room created:', roomCode, '| mode:', gameMode);
            setGeneratedRoomCode(roomCode);      // ✅ String فقط
            const { setRoomCode, setGameMode } = useGameStore.getState();
            setRoomCode(roomCode);               // ✅ String فقط
            setGameMode(gameMode);               // ✅ String فقط
            setConnecting(false);
            navigate(ROUTES.HOST_LOBBY);
        });

        // ✅ NEW: Handle Tutorial Room Created - auto join as player
        newSocket.on('tutorialCreated', ({ roomCode }) => {
            console.log('🎓 Tutorial room created:', roomCode);
            const state = useGameStore.getState();
            // Save the room code
            state.setRoomCode(roomCode);
            state.setConnecting(true);
            // Auto join the room with the desired role
            newSocket.emit('joinRoom', {
                roomCode,
                playerName: state.playerName,
                desiredRole: state.selectedTrainingRole // ✅ الاسم الصحيح الذي يفهمه الخادم
            });
        });

        newSocket.on('playerJoined', (players) => {
            console.log('👥 Players updated:', players);
            // The server sends the players array directly (not wrapped in an object)
            setPlayers(Array.isArray(players) ? players : (players.players || []));
        });

        newSocket.on('joinedRoom', (data) => {
            console.log('✅ Joined room success:', data.roomCode);
            if (data.roomCode) {
                const { setRoomCode } = useGameStore.getState();
                setRoomCode(data.roomCode);
            }
            setConnecting(false);
            navigate(ROUTES.LOBBY);
        });

        newSocket.on('gameSettingsUpdated', (data) => {
            console.log('⚙️ Game settings updated:', data);
            if (data.gameMode) setGameMode(data.gameMode);
            if (data.totalRounds) setTotalRounds(data.totalRounds);
        });

        newSocket.on('newRoundStarted', (data) => {
            console.log('🔄 New Round Started:', data);
            clearRoundState();
            const role = useGameStore.getState().userRole;
            if (role === 'HOST') {
                navigate(ROUTES.HOST_GAME_INTRO);
            }
        });

        newSocket.on('roundContinued', (data) => {
            console.log('🔄 Round Continued:', data);
            setRoundResults(null);
            Alert.alert('الجولة مستمرة!', 'لم يتم القبض على الجاني.');
        });

        newSocket.on('gameStarted', (data) => {
            console.log('🎮 Game started:', data);

            if (data.title) setScenario(data.title);
            if (data.round) setCurrentRound(data.round);
            if (data.totalRounds) setTotalRounds(data.totalRounds);

            const role = useGameStore.getState().userRole;
            if (role === 'HOST') {
                navigate(ROUTES.HOST_GAME_INTRO);
            } else {
                navigate(ROUTES.GAME);
            }
        });

        newSocket.on('roleAssigned', (roleData) => {
            console.log('🎭 Role assigned:', roleData);
            setRoleData(roleData);
        });

        newSocket.on('startDrafting', (data) => {
            console.log('📝 Drafting started');
            if (data.caseTitle) setScenario(data.caseTitle);
            if (data.template) setTemplate(data.template);
            setTimeLeft(data.duration || 300);

            if (data.alreadySubmitted) {
                setIsSubmitted(true);
                setAnswer(data.submittedAnswer || '');
            } else {
                setIsSubmitted(false);
                setAnswer('');
            }

            const role = useGameStore.getState().userRole;
            const currentPlayers = useGameStore.getState().players;

            if (role === 'HOST') {
                setWaitingFor(data.waitingFor || currentPlayers.map(p => p.id));
                navigate(ROUTES.HOST_DRAFTING);
            } else {
                navigate(ROUTES.DRAFTING);
            }
        });

        newSocket.on('hostHint', (data) => {
            console.log('📺 Host Hint received:', data);
            setLastHint(data.hint);
        });

        newSocket.on('secretHint', (data) => {
            console.log('🕵️ Secret Hint received:', data);
            setRoleData({ ...useGameStore.getState().roleData, secretHint: data.hint });
            Alert.alert("🕵️ تلميح سري!", `بصفتك الجاني، حصلت على تلميح:\n"${data.hint}"`);
        });

        newSocket.on('timerUpdate', (timeLeft) => {
            setTimeLeft(timeLeft);
        });

        newSocket.on('playerSubmitted', (data) => {
            console.log('✓ Player submitted:', data.playerName);
            setWaitingFor(useGameStore.getState().waitingFor.filter(id => id !== data.playerId));
        });

        newSocket.on('qualityVotingStarted', (data) => {
            console.log('🗳️ Quality voting started');
            setScenarios(data.scenarios || []);
            setHasVoted(false);
            setSelectedScenario(null);

            const role = useGameStore.getState().userRole;
            if (role === 'HOST') {
                setLiveVotes([]);
                navigate(ROUTES.HOST_QUALITY_VOTING);
            } else {
                navigate(ROUTES.QUALITY_VOTING);
            }
        });

        newSocket.on('dramaticRevealStarted', (data) => {
            console.log('🎬 Dramatic reveal started');
            setRevealedScenarios([]);
            setCurrentReveal(null);

            const role = useGameStore.getState().userRole;
            if (role === 'HOST') {
                navigate(ROUTES.HOST_DRAMATIC_REVEAL);
            } else {
                navigate(ROUTES.PLAYER_DRAMATIC_REVEAL);
            }
        });

        newSocket.on('revealStep', (data) => {
            console.log('🎭 Reveal step:', data.step || data.type);
            const step = data.step || data.type;
            const currentRev = useGameStore.getState().currentReveal;

            if (step === 'SCENARIO' || step === 'scenario') {
                setCurrentReveal({
                    text: data.data.answer || data.data.text,
                    index: data.data.index,
                    position: data.data.position,
                    total: data.data.total
                });
            } else if (step === 'VOTERS' || step === 'votes') {
                setCurrentReveal({
                    ...currentRev,
                    voters: data.data.voters,
                    voteCount: data.data.voteCount
                });
            } else if (step === 'AUTHOR' || step === 'author') {
                const complete = {
                    ...currentRev,
                    author: data.data.authorName || data.data.author
                };
                setCurrentReveal(complete);
                setRevealedScenarios([...useGameStore.getState().revealedScenarios, complete]);
            } else if (step === 'NO_VOTES') {
                const noVoteScenarios = data.data.scenarios || [];
                setRevealedScenarios([
                    ...useGameStore.getState().revealedScenarios,
                    ...noVoteScenarios.map(s => ({
                        text: s.answer,
                        author: s.authorName,
                        voteCount: 0,
                        voters: []
                    }))]);
            } else if (step === 'HINT') {
                setCurrentReveal({
                    type: 'HINT',
                    text: data.data.hint
                });
                setLastHint(data.data.hint);
            }
        });

        newSocket.on('discussionStarted', (data) => {
            console.log('🗣️ Discussion started');
            setSpeakingPlayerId(null);
            if (data && data.hint) {
                setLastHint(data.hint);
            }

            const role = useGameStore.getState().userRole;
            if (role === 'HOST') {
                navigate(ROUTES.HOST_DISCUSSION);
            } else {
                navigate(ROUTES.DISCUSSION);
            }
        });

        newSocket.on('speakerUpdated', (data) => {
            setSpeakingPlayerId(data.playerId);
        });

        newSocket.on('ministerRevealAlert', (data) => {
            Alert.alert('⚠️ تحذير للوزير', `المستفيد "${data.beneficiaryName}" حاول الاتصال بك!\nلقد كُشف لك.`);
        });

        newSocket.on('culpritVotingStarted', (data) => {
            console.log('🔍 Culprit voting started');
            setScenarios(data.scenarios || []);
            setHasVoted(false);
            setSelectedCulprit(null);

            const role = useGameStore.getState().userRole;
            if (role === 'HOST') {
                setLiveVotes([]);
                navigate(ROUTES.HOST_CULPRIT_VOTING);
            } else {
                navigate(ROUTES.CULPRIT_VOTING);
            }
        });

        newSocket.on('voteTie', (data) => {
            setHasVoted(false);
            setSelectedCulprit(null);
            setLiveVotes([]);
            Alert.alert('تنبيه', data.message || 'تعادل في الأصوات! أعد التصويت.');
        });

        newSocket.on('voteReceived', (data) => {
            setLiveVotes([...useGameStore.getState().liveVotes, data]);
        });

        newSocket.on('roundResults', (data) => {
            console.log('🏆 Round results');
            setRoundResults(data);
            if (data.round) setCurrentRound(data.round);
            if (data.totalRounds) setTotalRounds(data.totalRounds);

            const pName = useGameStore.getState().playerName;
            if (data.scores && pName) {
                const myResult = data.scores.find(s => s.name === pName);
                if (myResult !== undefined) {
                    const rData = useGameStore.getState().roleData;
                    if (rData) setRoleData({ ...rData, totalScore: myResult.totalScore });
                }
            }

            const role = useGameStore.getState().userRole;
            if (role === 'HOST') {
                navigate(ROUTES.HOST_RESULTS);
            } else {
                navigate(ROUTES.WAITING);
            }
        });

        newSocket.on('abilityResult', (data) => {
            console.log('⚡ Ability result:', data);

            const prevData = useGameStore.getState().roleData;
            if (prevData) {
                setRoleData({ ...prevData, abilityResult: data });
            }

            let title = 'نتيجة القدرة';
            let message = '';

            switch (data.type) {
                case 'INVESTIGATE':
                    title = '🕵️ تقرير المحقق';
                    message = `الهدف: ${data.targetName}\nالنتيجة: ${data.result}`;
                    break;
                case 'REVELATION':
                    title = '🔮 رؤية العراف';
                    message = `القصة الحقيقية:\n${data.content}`;
                    break;
                case 'REVELATION_SUCCESS':
                    title = '🔮 تم الوحي';
                    message = data.message;
                    setIsSubmitted(true);
                    break;
                case 'SABOTAGE':
                    title = '🧨 نتيجة التخريب';
                    message = data.message;
                    break;
                case 'FLASH_MEMORY':
                    title = '👁️ ذاكرة الشاهد';
                    message = `الكلمات المفتاحية:\n${data.keywords.join(' - ')}`;
                    break;
                default:
                    message = JSON.stringify(data);
            }
            Alert.alert(title, message);
        });

        newSocket.on('startPresentation', () => {
            navigate(ROUTES.WAITING);
        });

        // ✅ NEW: Handle game end (all rounds completed)
        newSocket.on('gameEnded', (data) => {
            console.log('🏁 Game ended, final results:', data);
            if (data.results) {
                setRoundResults(data);
            }
            navigate(ROUTES.END);
        });

        // ✅ الجاني: تم إرسال القصة الحقيقية تلقائياً
        newSocket.on('culpritAutoSubmit', ({ answer, message }) => {
            console.log('🎭 Culprit auto-submitted real story');
            setAnswer(answer);
            setIsSubmitted(true);
        });

        newSocket.on('error', (message) => {
            console.error('❌ Socket error:', message);
            setConnecting(false);
            Alert.alert('خطأ', message || 'حدث خطأ غير متوقع');
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            setConnecting(false);
        });

        newSocket.on('gameEnded', () => {
            console.log('🏁 Game ended — returning to main page');
            resetGame();
            navigate(ROUTES.ROLE_SELECT);
        });

        return () => {
            if (reconnectInterval.current) {
                clearInterval(reconnectInterval.current);
            }
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('roomCreated');
            newSocket.off('playerJoined');
            newSocket.off('joinedRoom');
            newSocket.off('gameStarted');
            newSocket.off('roleAssigned');
            newSocket.off('startDrafting');
            newSocket.off('timerUpdate');
            newSocket.off('playerSubmitted');
            newSocket.off('qualityVotingStarted');
            newSocket.off('culpritVotingStarted');
            newSocket.off('voteTie');
            newSocket.off('voteReceived');
            newSocket.off('roundResults');
            newSocket.off('abilityResult');
            newSocket.off('startPresentation');
            newSocket.off('dramaticRevealStarted');
            newSocket.off('revealStep');
            newSocket.off('discussionStarted');
            newSocket.off('speakerUpdated');
            newSocket.off('ministerRevealAlert');
            newSocket.off('gameSettingsUpdated');
            newSocket.off('newRoundStarted');
            newSocket.off('roundContinued');
            newSocket.off('secretHint');
            newSocket.off('hostHint');
            newSocket.off('error');
            newSocket.off('connect_error');
            newSocket.off('gameEnded');
            newSocket.disconnect();
        };
    }, []); // Run once

    const manualReconnect = () => {
        if (!newSocket || !roomCode || !playerName) return;
        useGameStore.getState().setReconnecting(true);
        newSocket.emit('joinRoom', { roomCode, playerName });
        setTimeout(() => useGameStore.getState().setReconnecting(false), 2000);
    };

    return { socket, manualReconnect };
};
