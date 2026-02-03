import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text,
  StatusBar,
  SafeAreaView,
  Platform,
  I18nManager,
  Alert
} from 'react-native';
import io from 'socket.io-client';
import { registerRootComponent } from 'expo';
import { theme } from './src/styles/theme';
import { RoleSelectScreen } from './src/screens/RoleSelectScreen_v2';
import { LoginScreen, LobbyScreen } from './src/screens/PlayerScreens_v2';
import { HostSetupScreen, HostLobbyScreen } from './src/screens/HostScreens_v2';
import { TrainingRoleSelectScreen, TrainingJoinScreen } from './src/screens/TrainingScreens';
import { GameScreen, DraftingScreen } from './src/screens/GameScreens';
import { QualityVotingScreen, CulpritVotingScreen, WaitingRevealScreen, EndScreen, PlayerDramaticRevealScreen } from './src/screens/VotingScreens';
import { HostGameScreen, HostVotingScreen, HostResultsScreen, HostGameIntroScreen, HostDraftingScreen, HostDramaticRevealScreen } from './src/screens/HostGameScreens';
import GlobalLayout from './src/components/GlobalLayout';

// Force RTL
if (Platform.OS !== 'web') {
  try {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
  } catch (e) {
    console.error('RTL Error:', e);
  }
}

// Server configuration
const DEV_SERVER_IP = process.env.EXPO_PUBLIC_DEV_SERVER_IP || '192.168.8.19';
const DEV_SERVER_PORT = process.env.EXPO_PUBLIC_DEV_SERVER_PORT || 3000;
const PROD_SERVER_URL = process.env.EXPO_PUBLIC_PROD_SERVER_URL || 'http://localhost:3000';

const SOCKET_URL = Platform.OS === 'web'
  ? PROD_SERVER_URL
  : (__DEV__ ? `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}` : PROD_SERVER_URL);

console.log('🌐 Socket URL:', SOCKET_URL);

// الشاشات الممكنة
const SCREENS = {
  ROLE_SELECT: 'ROLE_SELECT',
  
  // شاشات التدريب
  TRAINING_ROLE_SELECT: 'TRAINING_ROLE_SELECT',
  TRAINING_JOIN: 'TRAINING_JOIN',
  
  // شاشات المضيف
  HOST_SETUP: 'HOST_SETUP',
  HOST_LOBBY: 'HOST_LOBBY',
  HOST_GAME_INTRO: 'HOST_GAME_INTRO',
  HOST_GAME: 'HOST_GAME',
  HOST_DRAFTING: 'HOST_DRAFTING',
  HOST_DRAMATIC_REVEAL: 'HOST_DRAMATIC_REVEAL',
  HOST_QUALITY_VOTING: 'HOST_QUALITY_VOTING',
  HOST_CULPRIT_VOTING: 'HOST_CULPRIT_VOTING',
  HOST_RESULTS: 'HOST_RESULTS',
  HOST_END: 'HOST_END',
  
  // شاشات اللاعب
  LOGIN: 'LOGIN',
  LOBBY: 'LOBBY',
  GAME: 'GAME',
  DRAFTING: 'DRAFTING',
  QUALITY_VOTING: 'QUALITY_VOTING',
  PLAYER_DRAMATIC_REVEAL: 'PLAYER_DRAMATIC_REVEAL',
  CULPRIT_VOTING: 'CULPRIT_VOTING',
  WAITING: 'WAITING',
  END: 'END',
};

function App() {
  // Socket state
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connecting, setConnecting] = useState(false);
  
  // Screen & role state
  const [screen, setScreen] = useState(SCREENS.ROLE_SELECT);
  const [userRole, setUserRole] = useState(null); // 'HOST' or 'PLAYER'
  
  // Training state
  const [selectedTrainingRole, setSelectedTrainingRole] = useState(null);
  
  // Player state
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  
  // Host state
  const [generatedRoomCode, setGeneratedRoomCode] = useState('');
  
  // Game state
  const [players, setPlayers] = useState([]);
  const [roleData, setRoleData] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [scenario, setScenario] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Voting state
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedCulprit, setSelectedCulprit] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [liveVotes, setLiveVotes] = useState([]);
  const [waitingFor, setWaitingFor] = useState([]);
  
  // Results state
  const [roundResults, setRoundResults] = useState(null);
  
  // Dramatic Reveal state
  const [revealedScenarios, setRevealedScenarios] = useState([]);
  const [currentReveal, setCurrentReveal] = useState(null);
  
  // Socket connection
  useEffect(() => {
    if (socket || socketRef.current) return;
    
    console.log('🔌 Connecting to socket...');
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setConnecting(false);
    });
    
    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnecting(false);
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // HOST events
    socket.on('roomCreated', (roomCode) => {
      console.log('🏠 Room created:', roomCode);
      setGeneratedRoomCode(roomCode);
      setConnecting(false);
      setScreen(SCREENS.HOST_LOBBY);
    });
    
    socket.on('playerJoined', (players) => {
      console.log('👥 Player joined:', players.length);
      setPlayers(players || []);
    });
    
    // PLAYER events
    socket.on('joinedRoom', (data) => {
      console.log('✅ Joined room:', data.roomCode);
      setRoomCode(data.roomCode);
      setConnecting(false);
      setScreen(SCREENS.LOBBY);
    });
    
    socket.on('gameStarted', (data) => {
      console.log('🎮 Game started:', data);
      
      // Store scenario and round info
      if (data.title) setScenario(data.title);
      if (data.round) setCurrentRound(data.round);
      if (data.totalRounds) setTotalRounds(data.totalRounds);
      
      // Navigate to appropriate screen
      if (userRole === 'HOST') {
        setScreen(SCREENS.HOST_GAME_INTRO);
      } else {
        // Player will receive roleAssigned next
        setScreen(SCREENS.GAME);
      }
    });
    
    socket.on('roleAssigned', (roleData) => {
      console.log('🎭 Role assigned:', roleData);
      setRoleData(roleData);
      // Stay on GAME screen to show role
    });
    
    socket.on('startDrafting', (data) => {
      console.log('📝 Drafting started');
      setScenario(data.scenario || scenario);
      setTimeLeft(data.duration || 300);
      setIsSubmitted(false);
      setAnswer('');
      
      if (userRole === 'HOST') {
        setScreen(SCREENS.HOST_DRAFTING);
        setWaitingFor(data.waitingFor || players.map(p => p.id));
      } else {
        setScreen(SCREENS.DRAFTING);
      }
    });
    
    socket.on('timerUpdate', (timeLeft) => {
      setTimeLeft(timeLeft);
    });
    
    socket.on('playerSubmitted', (data) => {
      console.log('✓ Player submitted:', data.playerName);
      setWaitingFor(prev => prev.filter(id => id !== data.playerId));
    });
    
    socket.on('qualityVotingStarted', (data) => {
      console.log('🗳️ Quality voting started');
      setScenarios(data.scenarios || []);
      setHasVoted(false);
      setSelectedScenario(null);
      
      if (userRole === 'HOST') {
        setScreen(SCREENS.HOST_QUALITY_VOTING);
        setLiveVotes([]);
      } else {
        setScreen(SCREENS.QUALITY_VOTING);
      }
    });
    
    socket.on('dramaticRevealStarted', (data) => {
      console.log('🎬 Dramatic reveal started');
      setRevealedScenarios([]);
      setCurrentReveal(null);
      
      if (userRole === 'HOST') {
        setScreen(SCREENS.HOST_DRAMATIC_REVEAL);
      } else {
        setScreen(SCREENS.PLAYER_DRAMATIC_REVEAL);
      }
    });
    
    socket.on('revealStep', (data) => {
      console.log('🎭 Reveal step:', data.step || data.type);
      
      // Update current reveal and add to revealed list
      const step = data.step || data.type; // دعم كلا الاسمين
      
      if (step === 'SCENARIO' || step === 'scenario') {
        setCurrentReveal({ 
          text: data.data.answer || data.data.text,
          index: data.data.index,
          position: data.data.position,
          total: data.data.total
        });
      } else if (step === 'VOTERS' || step === 'votes') {
        setCurrentReveal(prev => ({ 
          ...prev, 
          voters: data.data.voters,
          voteCount: data.data.voteCount
        }));
      } else if (step === 'AUTHOR' || step === 'author') {
        setCurrentReveal(prev => {
          const complete = { 
            ...prev, 
            author: data.data.authorName || data.data.author 
          };
          // Add to revealed scenarios
          setRevealedScenarios(prev => [...prev, complete]);
          return complete;
        });
      } else if (step === 'NO_VOTES') {
        // السيناريوهات بدون أصوات
        const noVoteScenarios = data.data.scenarios || [];
        setRevealedScenarios(prev => [...prev, ...noVoteScenarios.map(s => ({
          text: s.answer,
          author: s.authorName,
          voteCount: 0,
          voters: []
        }))]);
      }
    });
    
    socket.on('culpritVotingStarted', (data) => {
      console.log('🔍 Culprit voting started');
      setScenarios(data.scenarios || []);
      setHasVoted(false);
      setSelectedCulprit(null);
      
      if (userRole === 'HOST') {
        setScreen(SCREENS.HOST_CULPRIT_VOTING);
        setLiveVotes([]);
      } else {
        setScreen(SCREENS.CULPRIT_VOTING);
      }
    });
    
    socket.on('voteReceived', (data) => {
      console.log('📊 Vote received:', data);
      setLiveVotes(prev => [...prev, data]);
    });
    
    socket.on('roundResults', (data) => {
      console.log('🏆 Round results');
      setRoundResults(data);
      if (userRole === 'HOST') {
        setScreen(SCREENS.HOST_RESULTS);
      } else {
        setScreen(SCREENS.WAITING);
      }
    });
    
    socket.on('startPresentation', () => {
      console.log('🎭 Presentation started');
      setScreen(SCREENS.WAITING);
    });
    
    socket.on('error', (message) => {
      console.error('❌ Socket error:', message);
      setConnecting(false);
      Alert.alert('خطأ', message || 'حدث خطأ غير متوقع');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnecting(false);
      Alert.alert('خطأ في الاتصال', 'فشل الاتصال بالخادم. تأكد من تشغيل الخادم.');
    });
    
    return () => {
      socket.off('roomCreated');
      socket.off('playerJoined');
      socket.off('joinedRoom');
      socket.off('gameStarted');
      socket.off('roleAssigned');
      socket.off('startDrafting');
      socket.off('timerUpdate');
      socket.off('playerSubmitted');
      socket.off('qualityVotingStarted');
      socket.off('culpritVotingStarted');
      socket.off('voteReceived');
      socket.off('roundResults');
      socket.off('startPresentation');
      socket.off('dramaticRevealStarted');
      socket.off('revealStep');
      socket.off('error');
      socket.off('connect_error');
    };
  }, [socket, userRole]);
  
  // Handlers
  const handleSelectHost = () => {
    setUserRole('HOST');
    setScreen(SCREENS.HOST_SETUP);
  };
  
  const handleSelectPlayer = () => {
    setUserRole('PLAYER');
    setScreen(SCREENS.LOGIN);
  };
  
  const handleSelectTraining = () => {
    setUserRole('PLAYER');
    setScreen(SCREENS.TRAINING_ROLE_SELECT);
  };
  
  const handleTrainingRoleSelect = (roleId) => {
    setSelectedTrainingRole(roleId);
    setScreen(SCREENS.TRAINING_JOIN);
  };
  
  const handleTrainingJoin = () => {
    if (!socket || !playerName.trim() || !roomCode.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم ورمز الغرفة');
      return;
    }
    console.log('📤 Emitting joinRoom event with desired role:', selectedTrainingRole);
    setConnecting(true);
    socket.emit('joinRoom', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      desiredRole: selectedTrainingRole, // إرسال الدور المطلوب
    });
  };
  
  const handleBackFromTraining = () => {
    if (screen === SCREENS.TRAINING_JOIN) {
      setScreen(SCREENS.TRAINING_ROLE_SELECT);
      setSelectedTrainingRole(null);
    } else {
      setScreen(SCREENS.ROLE_SELECT);
      setUserRole(null);
    }
  };
  
  const handleCreateRoom = () => {
    if (!socket) {
      Alert.alert('خطأ', 'لم يتم الاتصال بالخادم بعد');
      return;
    }
    console.log('📤 Emitting createRoom event');
    setConnecting(true);
    socket.emit('createRoom'); // تم تصحيح اسم الحدث
  };
  
  const handleJoinRoom = () => {
    if (!socket || !playerName.trim() || !roomCode.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم ورمز الغرفة');
      return;
    }
    console.log('📤 Emitting joinRoom event');
    setConnecting(true);
    socket.emit('joinRoom', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    });
  };
  
  const handleStartGame = () => {
    if (!socket) return;
    console.log('📤 Emitting startGame event');
    socket.emit('startGame');
  };
  
  const handleRoleReady = () => {
    // Player is ready after seeing their role - just wait for startDrafting event
    console.log('✅ Player ready');
  };
  
  const handleSubmitAnswer = () => {
    if (!socket || !answer.trim() || isSubmitted) return;
    console.log('📤 Emitting submitAnswer event');
    socket.emit('submitAnswer', {
      roomCode,
      answer: answer.trim(),
    });
    setIsSubmitted(true);
  };
  
  const handleVoteQuality = (scenarioIndex) => {
    if (!socket || hasVoted) return;
    console.log('📤 Emitting submitQualityVote event');
    socket.emit('submitQualityVote', {
      roomCode,
      scenarioIndex,
    });
    setHasVoted(true);
    setSelectedScenario(scenarioIndex);
  };
  
  const handleVoteCulprit = (playerIdOrIndex) => {
    if (!socket || hasVoted) return;
    console.log('📤 Emitting submitCulpritVote event');
    socket.emit('submitCulpritVote', {
      roomCode,
      playerId: playerIdOrIndex,
    });
    setHasVoted(true);
    setSelectedCulprit(playerIdOrIndex);
  };
  
  const handleContinue = () => {
    if (!socket) return;
    console.log('📤 Emitting nextRound event');
    socket.emit('nextRound');
  };
  
  const handleFillBots = () => {
    if (!socket) return;
    console.log('📤 Emitting fillBots event');
    socket.emit('fillBots');
  };
  
  const handleExit = () => {
    if (socket) {
      socket.disconnect();
    }
    setScreen(SCREENS.ROLE_SELECT);
    setUserRole(null);
    setPlayerName('');
    setRoomCode('');
    setGeneratedRoomCode('');
    setPlayers([]);
    setRoleData(null);
    setAnswer('');
    setIsSubmitted(false);
    setHasVoted(false);
  };
  
  // Render screens
  const renderScreen = () => {
    switch (screen) {
      case SCREENS.ROLE_SELECT:
        return (
          <RoleSelectScreen
            onSelectHost={handleSelectHost}
            onSelectPlayer={handleSelectPlayer}
            onSelectTraining={handleSelectTraining}
          />
        );
      
      // شاشات التدريب
      case SCREENS.TRAINING_ROLE_SELECT:
        return (
          <TrainingRoleSelectScreen
            onSelectRole={handleTrainingRoleSelect}
            onBack={() => setScreen(SCREENS.ROLE_SELECT)}
          />
        );
      
      case SCREENS.TRAINING_JOIN:
        return (
          <TrainingJoinScreen
            selectedRole={selectedTrainingRole}
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onJoin={handleTrainingJoin}
            connecting={connecting}
            onBack={handleBackFromTraining}
          />
        );
      
      // شاشات المضيف
      case SCREENS.HOST_SETUP:
        return (
          <HostSetupScreen
            onCreateRoom={handleCreateRoom}
            connecting={connecting}
          />
        );
      
      case SCREENS.HOST_LOBBY:
        return (
          <HostLobbyScreen
            roomCode={generatedRoomCode}
            players={players}
            onStartGame={handleStartGame}
            onFillBots={handleFillBots}
          />
        );
      
      case SCREENS.HOST_GAME_INTRO:
        return (
          <HostGameIntroScreen
            scenarioTitle={scenario}
            round={currentRound}
            totalRounds={totalRounds}
          />
        );
      
      case SCREENS.HOST_DRAFTING:
        return (
          <HostDraftingScreen
            players={players}
            waitingFor={waitingFor}
            timeLeft={timeLeft}
          />
        );
      
      case SCREENS.HOST_DRAMATIC_REVEAL:
        return (
          <HostDramaticRevealScreen
            revealedScenarios={revealedScenarios}
            currentReveal={currentReveal}
          />
        );
      
      case SCREENS.HOST_QUALITY_VOTING:
        return (
          <HostVotingScreen
            votingType="quality"
            scenarios={scenarios}
            liveVotes={liveVotes}
            players={players}
          />
        );
      
      case SCREENS.HOST_CULPRIT_VOTING:
        return (
          <HostVotingScreen
            votingType="culprit"
            scenarios={scenarios}
            liveVotes={liveVotes}
            players={players}
          />
        );
      
      case SCREENS.HOST_RESULTS:
        return (
          <HostResultsScreen
            roundResults={roundResults}
            onContinue={handleContinue}
          />
        );
      
      // شاشات اللاعب
      case SCREENS.LOGIN:
        return (
          <LoginScreen
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onJoinRoom={handleJoinRoom}
            connecting={connecting}
          />
        );
      
      case SCREENS.LOBBY:
        return (
          <LobbyScreen
            players={players}
            roomCode={roomCode}
          />
        );
      
      case SCREENS.GAME:
        return (
          <GameScreen 
            roleData={roleData}
            onReady={handleRoleReady}
          />
        );
      
      case SCREENS.DRAFTING:
        return (
          <DraftingScreen
            answer={answer}
            setAnswer={setAnswer}
            onSubmit={handleSubmitAnswer}
            timeLeft={timeLeft}
            isSubmitted={isSubmitted}
            scenario={scenario}
          />
        );
      
      case SCREENS.QUALITY_VOTING:
        return (
          <QualityVotingScreen
            scenarios={scenarios}
            onVote={handleVoteQuality}
            hasVoted={hasVoted}
            selectedScenario={selectedScenario}
          />
        );
      
      case SCREENS.PLAYER_DRAMATIC_REVEAL:
        return <PlayerDramaticRevealScreen />;
      
      case SCREENS.CULPRIT_VOTING:
        return (
          <CulpritVotingScreen
            scenarios={scenarios}
            onVote={handleVoteCulprit}
            hasVoted={hasVoted}
            selectedCulprit={selectedCulprit}
          />
        );
      
      case SCREENS.WAITING:
        return <WaitingRevealScreen />;
      
      case SCREENS.END:
        return (
          <EndScreen
            results={roundResults}
            onExit={handleExit}
          />
        );
      
      // شاشات المضيف الإضافية
      case SCREENS.HOST_DRAFTING:
        return (
          <HostGameScreen
            players={players}
            waitingFor={waitingFor}
          />
        );
      
      case SCREENS.HOST_QUALITY_VOTING:
        return (
          <HostVotingScreen
            votingType="quality"
            scenarios={scenarios}
            liveVotes={liveVotes}
            players={players}
          />
        );
      
      case SCREENS.HOST_CULPRIT_VOTING:
        return (
          <HostVotingScreen
            votingType="culprit"
            scenarios={scenarios}
            liveVotes={liveVotes}
            players={players}
          />
        );
      
      case SCREENS.HOST_RESULTS:
        return (
          <HostResultsScreen
            roundResults={roundResults}
            onContinue={handleContinue}
            isLastRound={false}
          />
        );
      
      case SCREENS.HOST_END:
        return (
          <EndScreen
            results={roundResults}
            onExit={handleExit}
          />
        );
      
      default:
        return (
          <View style={styles.tempScreen}>
            <Text style={styles.tempText}>🚧 قيد التطوير</Text>
            <Text style={styles.tempSubtext}>{screen}</Text>
          </View>
        );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={theme.colors.background}
      />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tempScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  tempText: {
    fontSize: 48,
    marginBottom: 20,
  },
  tempSubtext: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
});

registerRootComponent(App);
export default App;
