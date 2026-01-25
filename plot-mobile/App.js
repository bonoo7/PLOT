import React, { useState, useEffect, useRef } from 'react';
import { registerRootComponent } from 'expo';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, I18nManager, ScrollView, Modal, Image, ImageBackground, Animated, LayoutAnimation, UIManager, Platform, useWindowDimensions } from 'react-native';
import io from 'socket.io-client';
import { theme } from './src/styles/theme';
import RoleAvatar from './components/RoleAvatar';
import BackgroundWatermark from './components/BackgroundWatermark';
import RedactedText from './components/RedactedText';
import GlobalLayout from './src/components/GlobalLayout'; // ✅ New Import

// Force RTL
if (Platform.OS !== 'web') {
  try {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
  } catch (e) {
    console.error('RTL Error:', e);
  }
}

// Replace with your computer's local IP address
const SOCKET_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'  // ✅ تصحيح: الخادم يعمل على 3000، ليس 8081
  : (__DEV__ ? 'http://192.168.8.9:3000' : 'http://localhost:3000');

console.log('🌐 SOCKET_URL:', SOCKET_URL, 'Platform:', Platform.OS);

export default function App() {
  console.log('App rendering, Platform:', Platform.OS);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Responsive Styles
  const responsiveStyles = {
    paperContainer: {
      width: isLandscape ? (width > 1000 ? '50%' : '70%') : '100%',
      maxWidth: 800,
      alignSelf: 'center',
    },
    menuContent: {
      flexDirection: isLandscape ? 'row' : 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    fileButtonContainer: {
      // In landscape: 28% to safely fit 3 items with margins. Portrait: 100% full width.
      width: isLandscape ? '28%' : '100%',
      margin: isLandscape ? '2%' : 0,
      marginBottom: 20,
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental && !global.nativeFabricUIManager) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('ROLE_SELECT');
  const [userRole, setUserRole] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [generatedRoomCode, setGeneratedRoomCode] = useState('');
  const [hostCodeInput, setHostCodeInput] = useState('');  // ✅ للتحقق من كود المضيف
  const [showHostCodeModal, setShowHostCodeModal] = useState(false);  // ✅ لعرض نموذج كود المضيف
  const [roleData, setRoleData] = useState(null);
  const [gameTitle, setGameTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [votingData, setVotingData] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [abilityUsed, setAbilityUsed] = useState(false);
  const [players, setPlayers] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [submittedPlayers, setSubmittedPlayers] = useState([]);
  const [tutorialModalVisible, setTutorialModalVisible] = useState(false);
  const [isTutorialFlow, setIsTutorialFlow] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [desiredTutorialRole, setDesiredTutorialRole] = useState(null); // ✅ حالة جديدة لتخزين الدور المطلوب للتدريب

  // Ref to access current state inside socket callbacks
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [screen]);

  const userRoleRef = React.useRef(userRole);
  const isTutorialFlowRef = React.useRef(isTutorialFlow);

  useEffect(() => {
    userRoleRef.current = userRole;
  }, [userRole]);

  useEffect(() => {
    isTutorialFlowRef.current = isTutorialFlow;
  }, [isTutorialFlow]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setSocketConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error);
      setSocketConnected(false);
      Alert.alert('خطأ في الاتصال', `لا يمكن الاتصال بالخادم على ${SOCKET_URL}\n\nخطأ: ${error.message}`);
    });

    newSocket.on('roomCreated', (code) => {
      console.log('🎪 Room created with code:', code, 'User role:', userRoleRef.current);
      setRoomCode(code);
      if (userRoleRef.current === 'HOST') {
        console.log('🎪 Setting screen to HOST_LOBBY');
        setScreen('HOST_LOBBY');
      } else if (isTutorialFlowRef.current) {
        setTutorialModalVisible(true);
      }
    });

    newSocket.on('joinedRoom', (data) => {
      console.log('✅ Joined room:', data);
      if (userRoleRef.current === 'PLAYER') {
        setScreen('LOBBY');
        // Do not reopen modal, role is already selected
      }
      if (data.isLeader) {
        setIsLeader(true);
      }
    });

    newSocket.on('playerJoined', (playersList) => {
      setPlayers(playersList);
    });

    newSocket.on('gameStarted', (data) => {
      if (data.roomCode) setRoomCode(data.roomCode);
      setGameTitle(data.title);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setAnswer('');
      setIsSubmitted(false);
      setSelectedQuality(null);
      setSelectedIdentity(null);
      setAbilityUsed(false);
      setSubmittedPlayers([]);

      if (userRoleRef.current === 'HOST') {
        setScreen('HOST_GAME');
      }
      // Player screen is set by roleAssigned
    });

    // ✅ معالج التدريب - إرسال كود المدير
    newSocket.on('tutorialStarted', (data) => {
      console.log('🎓 Tutorial started:', data);
      setRoomCode(data.roomCode);
      setGeneratedRoomCode(data.hostCode);
      // سيتم الانتقال إلى GAME بعد roleAssigned
    });

    newSocket.on('roleAssigned', (data) => {
      setRoleData(data);
      if (userRoleRef.current === 'PLAYER') {
        setScreen('GAME');
      }
    });

    newSocket.on('startDrafting', ({ duration }) => {
      setTimeLeft(duration);
      setIsSubmitted(false);
      setAnswer('');
      setSubmittedPlayers([]);
      if (userRoleRef.current === 'HOST') {
        setScreen('HOST_DRAFTING');
      } else {
        setScreen('DRAFTING');
      }
    });

    newSocket.on('timerUpdate', (time) => {
      setTimeLeft(time);
    });

    newSocket.on('playerSubmitted', ({ playerName }) => {
      setSubmittedPlayers(prev => [...prev, playerName]);
    });

    newSocket.on('startPresentation', () => {
      if (userRoleRef.current === 'HOST') {
        setScreen('HOST_PRESENTATION');
      } else {
        setScreen('PRESENTATION');
      }
    });

    newSocket.on('receiveAnswers', (answersList) => {
      setAnswers(answersList);
    });

    newSocket.on('startVoting', (data) => {
      setVotingData(data);
      setIsSubmitted(false);
      if (userRoleRef.current === 'HOST') {
        setScreen('HOST_VOTING');
      } else {
        setScreen('VOTING');
      }
    });

    newSocket.on('roundResults', ({ results: resultsList }) => {
      setResults(resultsList);
      if (userRoleRef.current === 'HOST') {
        setScreen('HOST_RESULTS');
      } else {
        setScreen('RESULTS');
      }
    });

    newSocket.on('gameEnded', ({ results: resultsList, leaderboard: leaderboardData }) => {
      setResults(resultsList);
      setLeaderboard(leaderboardData || []);
      if (userRoleRef.current === 'HOST') {
        setScreen('HOST_END');
      } else {
        setScreen('END');
      }
    });

    newSocket.on('abilityResult', (data) => {
      if (data.type === 'EAGLE_EYE') {
        Alert.alert('عين الصقر', `نص الشاهد:\n\n"${data.content}"`);
        setAbilityUsed(true);
      } else if (data.type === 'INTERROGATION') {
        Alert.alert('نتيجة الاستجواب', data.content);
        setAbilityUsed(true);
      }
    });

    newSocket.on('error', (msg) => {
      console.log('❌ Socket error:', msg);
      Alert.alert('خطأ', msg);
    });

    return () => newSocket.close();
  }, []);

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    return code;
  };

  const handleSelectHostRole = () => {
    setUserRole('HOST');
    const newCode = generateRoomCode();
    setGeneratedRoomCode(newCode);
    setRoomCode(newCode);
    setScreen('HOST_SETUP');
  };

  const handleSelectPlayerRole = () => {
    setUserRole('PLAYER');
    setScreen('LOGIN');
  };

  const handleCreateRoom = () => {
    const currentSocket = socketRef.current;
    console.log('🎪 handleCreateRoom called, socketConnected:', socketConnected, 'socket.connected:', currentSocket?.connected);

    if (!currentSocket) {
      Alert.alert('خطأ', 'Socket لم يتم إنشاؤه بعد');
      return;
    }

    // إذا كان متصل - أرسل مباشرة
    if (currentSocket.connected) {
      console.log('🎪 Socket connected, emitting createRoom');
      currentSocket.emit('createRoom');
      return;
    }

    // إذا لم يكن متصل - انتظر قليلاً
    console.log('⏳ Socket not connected yet, waiting...');
    Alert.alert('جارٍ الاتصال', 'يرجى الانتظار أثناء الاتصال بالخادم...');

    let attempts = 0;
    const checkConnection = setInterval(() => {
      attempts++;
      console.log('⏳ Attempt', attempts, 'connected:', currentSocket.connected);

      if (currentSocket.connected) {
        clearInterval(checkConnection);
        console.log('🎪 Connected after wait, emitting createRoom');
        currentSocket.emit('createRoom');
      } else if (attempts > 10) { // 5 seconds max wait
        clearInterval(checkConnection);
        Alert.alert('خطأ في الاتصال', `لا يمكن الاتصال بالخادم على ${SOCKET_URL}\n\nالحل:\n1. تأكد من تشغيل الخادم (npm start)\n2. تحقق من رقم IP الصحيح`);
      }
    }, 500);
  };

  const handleJoin = () => {
    if (!playerName || !roomCode) {
      Alert.alert('تنبيه', 'الرجاء إدخال الاسم ورمز الغرفة');
      return;
    }
    const currentSocket = socketRef.current;
    if (!currentSocket) {
      Alert.alert('خطأ', 'لم يتم الاتصال بالخادم بعد');
      return;
    }

    // ✅ إرسال الدور المطلوب في حال التدريب
    const joinPayload = {
      roomCode,
      playerName
    };

    if (isTutorialFlow && desiredTutorialRole) {
      joinPayload.desiredRole = desiredTutorialRole;
    }

    currentSocket.emit('joinRoom', joinPayload);
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  // ✅ التحقق من كود المضيف
  const handleVerifyHostCode = () => {
    if (hostCodeInput.trim() === generatedRoomCode) {
      setShowHostCodeModal(false);
      setHostCodeInput('');
      // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
      Alert.alert('✅ تحقق النجح', `كود المضيف صحيح! الكود: ${generatedRoomCode}`);
    } else {
      Alert.alert('❌ خطأ', 'كود المضيف غير صحيح!');
      setHostCodeInput('');
    }
  };

  const handleSelectTraining = () => {
    setUserRole('PLAYER');
    setIsTutorialFlow(true);
    setPlayerName('المتدرب');
    setTutorialModalVisible(true);
  };

  const handleStartTutorial = (role = null) => {
    // ✅ بدلاً من إرسال الأمر للسيرفر مباشرة، ننتقل لصفحة الدخول
    setDesiredTutorialRole(role);
    setTutorialModalVisible(false);
    setScreen('LOGIN');

    // socket.emit('startTutorial', role); // ❌ Disabled
  };

  const handleFillBots = () => {
    socket.emit('fillBots');
  };

  const handleNextRound = () => {
    socket.emit('nextRound');
  };

  const handleRestart = () => {
    socket.emit('startGame');
  };

  // QR Code Component - simple display without library
  const handleBackToRoleSelect = () => {
    setScreen('ROLE_SELECT');
    setUserRole(null);
    setIsTutorialFlow(false);
    setPlayerName('');
    setRoomCode('');
    setGeneratedRoomCode('');
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;
    socket.emit('submitAnswer', { roomCode, answer });
    setIsSubmitted(true);
  };

  const handleDraftChange = (text) => {
    setAnswer(text);
    socket.emit('updateDraft', { roomCode, draft: text });
  };

  const handleUseAbility = () => {
    if (roleData?.role === 'SPY') {
      socket.emit('useAbility', { roomCode, abilityType: 'EAGLE_EYE' });
    }
  };

  const handleInterrogate = (targetId) => {
    if (roleData?.role === 'DETECTIVE' && !abilityUsed) {
      socket.emit('useAbility', { roomCode, abilityType: 'INTERROGATION', targetId });
    }
  };

  const handleSubmitVote = () => {
    if (!selectedQuality || !selectedIdentity) {
      Alert.alert('تنبيه', 'يجب اختيار أفضل إجابة وتخمين الشاهد');
      return;
    }
    socket.emit('submitVote', {
      roomCode,
      qualityVote: selectedQuality,
      identityVote: selectedIdentity
    });
    setIsSubmitted(true);
  };

  // --- SCREENS ---

  if (screen === 'ROLE_SELECT') {
    return (
      <GlobalLayout title="تصنيف العملاء" showStamp={false}>
        <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: '100%' }}
            contentContainerStyle={[responsiveStyles.menuContent, { paddingVertical: 10, flexGrow: 1, justifyContent: 'center' }]}
          >
            <TouchableOpacity activeOpacity={0.7}
              style={[styles.fileButtonContainer, responsiveStyles.fileButtonContainer]}
              onPress={handleSelectHostRole}
            >
              <ImageBackground source={require("./assets/file.png")} style={styles.fileButtonBackground} resizeMode="contain">
                <View style={styles.fileContent}>
                  <Text style={styles.roleButtonTextBlack}>مدير اللعبة</Text>
                  <Text style={styles.roleButtonSubtextBlack}>أنشئ غرفة وأدر اللعبة</Text>
                </View>
                <View style={styles.stampContainerSmall}>
                  <Text style={styles.stampSmall}>سري للغاية</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}
              style={[styles.fileButtonContainer, responsiveStyles.fileButtonContainer]}
              onPress={handleSelectPlayerRole}
            >
              <ImageBackground source={require("./assets/file.png")} style={styles.fileButtonBackground} resizeMode="contain">
                <View style={styles.fileContent}>
                  <Text style={styles.roleButtonTextBlack}>لاعب</Text>
                  <Text style={styles.roleButtonSubtextBlack}>انضم إلى غرفة موجودة</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}
              style={[styles.fileButtonContainer, responsiveStyles.fileButtonContainer]}
              onPress={handleSelectTraining}
            >
              <ImageBackground source={require("./assets/file.png")} style={styles.fileButtonBackground} resizeMode="contain">
                <View style={styles.fileContent}>
                  <Text style={styles.roleButtonTextBlack}>تدريب فردي</Text>
                  <Text style={styles.roleButtonSubtextBlack}>العب ضد الروبوتات</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <Modal visible={tutorialModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>اختر دورك للتدريب</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                {['WITNESS', 'ARCHITECT', 'DETECTIVE', 'SPY', 'ACCOMPLICE', 'LAWYER', 'TRICKSTER', 'CITIZEN'].map(role => (
                  <TouchableOpacity activeOpacity={0.7} key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>{role}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleStartTutorial(null)} style={[styles.modalButton, { backgroundColor: '#ddd' }]}>
                  <Text style={styles.modalButtonText}>عشوائي</Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </GlobalLayout>
    );
  }

  if (screen === 'HOST_SETUP') {
    return (
      <GlobalLayout title="إعدادات المدير" showStamp={false}>
        <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
        <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />

        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', padding: 15, borderRadius: 8, marginBottom: 30, width: '80%', borderWidth: 1, borderColor: '#aaa' }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 8, textAlign: 'right', fontWeight: 'bold' }}>
              📡 حالة الاتصال:
            </Text>
            {socketConnected ? (
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.accentRed, textAlign: 'right' }}>
                ✅ مفعل وجاهز
              </Text>
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#B22222', textAlign: 'right' }}>
                  ❌ غير متصل
                </Text>
                <Text style={{ fontSize: 12, color: '#2F4F4F', marginTop: 5, textAlign: 'right' }}>
                  الخادم: {SOCKET_URL}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleCreateRoom}>
            <Text style={styles.buttonText}>إنشاء الغرفة (Create Room)</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}
            style={[styles.button, { backgroundColor: '#2F4F4F', marginTop: 15 }]}
            onPress={handleBackToRoleSelect}
          >
            <Text style={styles.buttonText}>رجوع</Text>
          </TouchableOpacity>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'HOST_LOBBY') {
    return (
      <GlobalLayout title="غرفة العمليات" showStamp={true}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20, width: '100%' }}>
          <Text style={styles.screenLabel}>رمز الغرفة</Text>
          <View style={styles.roomCodeBox}>
            <Text style={styles.roomCode}>{roomCode}</Text>
          </View>

          <Text style={styles.screenLabel}>العملاء المتصلون ({players.length})</Text>
          <View style={styles.playerList}>
            {players.map((p, i) => (
              <View key={i} style={styles.playerCard}>
                <Text style={styles.playerCardText}>{p.name}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.7}
            style={[styles.button, { opacity: players.length >= 3 ? 1 : 0.5 }]}
            onPress={handleStartGame}
            disabled={players.length < 3}
          >
            <Text style={styles.buttonText}>بدء المهمة</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}
            style={[styles.button, { marginTop: 10, backgroundColor: '#2F4F4F' }]}
            onPress={handleFillBots}
          >
            <Text style={styles.buttonText}>🤖 تعبئة بوتات</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}
            style={[styles.button, { marginTop: 10, backgroundColor: '#E1AD01' }]}
            onPress={() => setShowHostCodeModal(true)}
          >
            <Text style={styles.buttonText}>🔐 التحقق من كود المضيف</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal stays outside or inside? Inside is fine if absolute positioned, but GlobalLayout has overflow hidden... 
            Actually Modals in React Native are native and sit on top. So it's fine. 
        */}
        <Modal visible={showHostCodeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🔐 التحقق من كود المضيف</Text>
              <Text style={{ fontSize: 12, color: '#2F4F4F', textAlign: 'center', marginBottom: 15 }}>
                أدخل كود المضيف للتحقق من الهوية
              </Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كود المضيف"
                value={hostCodeInput}
                onChangeText={setHostCodeInput}
                placeholderTextColor="#999"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setShowHostCodeModal(false)}>
                  <Text style={styles.buttonText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#2F4F4F' }]} onPress={handleVerifyHostCode}>
                  <Text style={styles.buttonText}>تحقق</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </GlobalLayout>
    );
  }

  if (screen === 'HOST_GAME' || screen === 'HOST_DRAFTING') {
    return (
      <GlobalLayout title={gameTitle || "المهمة جارية"} showStamp={false}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.timer}>{timeLeft}</Text>
          <Text style={styles.subtitle}>جاري كتابة التقارير...</Text>
          <View style={styles.playerList}>
            {submittedPlayers.map((name, index) => (
              <View key={index} style={[styles.playerCard, { backgroundColor: '#e0ffe0' }]}>
                <Text style={styles.playerCardText}>{name} ✅</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'HOST_PRESENTATION') {
    return (
      <GlobalLayout title="التقارير الواردة" showStamp={false}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 20 }}>
          <View style={styles.answersList}>
            {answers.map((item, index) => (
              <View key={index} style={styles.answerCardSquare}>
                <View style={{ flex: 1, justifyContent: 'center', width: '100%' }}>
                  <Text style={styles.answerText} numberOfLines={8} adjustsFontSizeToFit>"{item.answer}"</Text>
                </View>
                <Text style={styles.answerAuthor}>- {item.playerName}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'HOST_VOTING') {
    return (
      <GlobalLayout title="مرحلة التصويت" showStamp={false}>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Text style={styles.subtitle}>العملاء يقومون بالتصويت الآن...</Text>
        </View>
      </GlobalLayout>
    );
  }

  if (screen === 'HOST_RESULTS') {
    return (
      <GlobalLayout title="نتائج الجولة" showStamp={false}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 20 }}>
          <View style={styles.resultsList}>
            {results.map((player, index) => (
              <View key={index} style={[styles.resultCard, { borderWidth: 3, borderColor: '#333', padding: 15, marginBottom: 15, backgroundColor: '#fafaf5' }]}>
                <View style={{ marginBottom: 15, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#333' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>#{index + 1} {player.name}</Text>
                  <Text style={{ color: '#666', fontSize: 13, marginTop: 5 }}>{player.role}</Text>
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: 'bold', color: '#E1AD01', fontSize: 18 }}>+{player.roundScore}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>المجموع: {player.totalScore}</Text>
                  </View>
                </View>

                <View>
                  <Text style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 14 }}>📊 كيف حصل على نقاطه:</Text>
                  {player.breakdown && player.breakdown.length > 0 ? (
                    player.breakdown.map((item, idx) => {
                      const isNegative = item.includes('-') && !item.includes('لم');
                      const bgColor = isNegative ? '#ffebee' : '#e8f5e9';
                      const borderColor = isNegative ? '#B22222' : '#E1AD01';
                      const textColor = isNegative ? '#c62828' : '#1b5e20';

                      return (
                        <View key={idx} style={{ backgroundColor: bgColor, padding: 10, marginVertical: 5, borderLeftWidth: 4, borderLeftColor: borderColor, borderRadius: 4 }}>
                          <Text style={{ color: textColor, fontSize: 13, fontWeight: '500' }}>{item}</Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ color: '#2F4F4F', fontSize: 12 }}>لا توجد نقاط</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleNextRound}>
            <Text style={styles.buttonText}>الجولة التالية</Text>
          </TouchableOpacity>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'HOST_END') {
    return (
      <GlobalLayout title="النتائج النهائية" showStamp={true} stampText="انتهت المهمة">
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 20 }}>
          <View style={styles.resultsList}>
            {results.map((player, index) => (
              <View key={index} style={styles.resultCard}>
                <Text>{index === 0 ? '🏆 ' : ''} #{index + 1} {player.name}</Text>
                <Text>{player.totalScore} نقطة</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleRestart}>
            <Text style={styles.buttonText}>لعبة جديدة</Text>
          </TouchableOpacity>
        </ScrollView>
      </GlobalLayout>
    );
  }

  // --- PLAYER SCREENS ---

  if (screen === 'LOGIN') {
    return (
      <GlobalLayout title="تسجيل الدخول" showStamp={false}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          <View style={styles.stampContainer}>
            <Text style={styles.stamp}>سري للغاية</Text>
          </View>
          <Text style={styles.title}>تسجيل الدخول</Text>

          <TextInput
            style={styles.input}
            placeholder="الاسم الحركي"
            value={playerName}
            onChangeText={setPlayerName}
            placeholderTextColor="#666"
          />

          <TextInput
            style={styles.input}
            placeholder="رمز الغرفة"
            value={roomCode}
            onChangeText={(text) => setRoomCode(text.toUpperCase())}
            placeholderTextColor="#666"
            maxLength={4}
          />

          <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleJoin}>
            <Text style={styles.buttonText}>
              {isTutorialFlow ? 'انضمام للتدريب' : 'انضمام للمهمة'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}
            style={[styles.button, { backgroundColor: '#2F4F4F', marginTop: 10 }]}
            onPress={handleBackToRoleSelect}
          >
            <Text style={styles.buttonText}>رجوع</Text>
          </TouchableOpacity>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'LOBBY') {
    return (
      <GlobalLayout title="تم قبول التصريح" showStamp={true} stampText="بانتظار القيادة">
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.subtitle}>أهلاً بالعميل {playerName}</Text>
          <Text style={[styles.status, { color: theme.colors.accentRed }]}>وضع الاستعداد</Text>

          {isTutorialFlow && (
            <View style={{ backgroundColor: '#F5F5DC', borderWidth: 1, borderColor: '#B22222', borderRadius: 8, padding: 12, marginVertical: 15 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2F4F4F', textAlign: 'right', marginBottom: 5 }}>📝 ملاحظة تدريب:</Text>
              <Text style={{ fontSize: 11, color: '#2F4F4F', textAlign: 'right', lineHeight: 18 }}>سيتم اللعب مع 3 بوتات ذكية تحاكي أدوار مختلفة (شاهد، مهندس، محتال). البوتات ستكتب وترسل إجاباتها تلقائياً! 🤖</Text>
            </View>
          )}

          {/* Existing 'Wait for leader' stamp was removed in favor of GlobalLayout stamp */}

          <TouchableOpacity activeOpacity={0.7}
            style={[styles.button, { marginTop: 30, backgroundColor: '#B22222' }]}
            onPress={() => setTutorialModalVisible(true)}
          >
            <Text style={styles.buttonText}>بدء تدريب (Tutorial)</Text>
          </TouchableOpacity>

          <Modal visible={tutorialModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>اختر دورك للتدريب</Text>
                <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                  {['WITNESS', 'ARCHITECT', 'DETECTIVE', 'SPY', 'ACCOMPLICE', 'LAWYER', 'TRICKSTER', 'CITIZEN'].map(role => (
                    <TouchableOpacity activeOpacity={0.7} key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                      <Text style={styles.modalButtonText}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity activeOpacity={0.7} onPress={() => handleStartTutorial(null)} style={[styles.modalButton, { backgroundColor: '#ddd' }]}>
                    <Text style={styles.modalButtonText}>عشوائي</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'GAME' && roleData) {
    return (
      <GlobalLayout title="هوية العميل" showStamp={true} stampText="سري للغاية">
        <View style={{ alignItems: 'center', marginBottom: 15, width: '100%' }}>
          <RoleAvatar role={roleData.role} size={100} />
        </View>

        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          <Text style={[styles.roleTitle, { color: theme.colors.accentRed, textAlign: 'center' }]}>{roleData.roleName}</Text>
          <Text style={styles.roleDesc}>{roleData.description}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>معلومات سرية:</Text>
            <Text style={styles.infoText}>{roleData.info}</Text>
          </View>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'DRAFTING') {
    return (
      <GlobalLayout title="تقرير المهمة" showStamp={isSubmitted} stampText="تم الإرسال">
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <View style={{ width: '100%', padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 5 }}>
                <Text style={{ textAlign: 'right', fontWeight: 'bold', color: theme.colors.accentRed }}>{gameTitle}</Text>
                <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>أنت: {roleData?.roleName}</Text>
                <RedactedText text={roleData?.info} />
              </View>
            </View>
            <View style={{ marginLeft: 10 }}>
              <RoleAvatar role={roleData?.role} size={80} showLabel={false} />
            </View>
          </View>

          <Text style={styles.timer}>{timeLeft}s</Text>
          <Text style={styles.title}>اكتب تبريرك</Text>

          {!isSubmitted ? (
            <>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="اكتب قصتك هنا..."
                value={answer}
                onChangeText={handleDraftChange}
                multiline
                maxLength={140}
                placeholderTextColor="#666"
              />
              <Text style={{ alignSelf: 'flex-end', marginRight: '10%' }}>{answer.length}/140</Text>

              {roleData?.role === 'SPY' && (roleData?.round >= 2 || roleData?.isTutorial) && !abilityUsed && (
                <TouchableOpacity activeOpacity={0.7}
                  style={[styles.button, { backgroundColor: theme.colors.accentYellow, marginBottom: 10 }]}
                  onPress={handleUseAbility}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text }]}>👁️ عين الصقر</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleSubmitAnswer}>
                <Text style={styles.buttonText}>إرسال</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.subtitle}>بانتظار التقارير الأخرى...</Text>
          )}
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'PRESENTATION') {
    return (
      <GlobalLayout title="وقت المواجهة" showStamp={false}>
        {/* Avatar floating top right is hard with this layout, putting it inline or removing it for now. 
              Actually, putting it at top of scroll. */}
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          <View style={{ marginBottom: 20 }}>
            <RoleAvatar role={roleData?.role} size={80} showLabel={false} />
          </View>
          <Text style={styles.subtitle}>انظر للشاشة الرئيسية</Text>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'VOTING' && votingData) {
    if (isSubmitted) {
      return (
        <GlobalLayout title="التصويت" showStamp={true} stampText="تم التصويت">
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
          </View>
          <Text style={styles.subtitle}>بانتظار النتائج...</Text>
        </GlobalLayout>
      );
    }

    return (
      <GlobalLayout title="التصويت" showStamp={false}>
        <ScrollView
          style={{ width: '100%', flex: 1 }}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
        >
          <View style={{ marginBottom: 10 }}>
            <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
          </View>

          {roleData?.role === 'DETECTIVE' && (roleData?.round >= 2 || roleData?.isTutorial) && !abilityUsed && (
            <Text style={{ color: theme.colors.accentRed, fontWeight: 'bold', marginBottom: 10 }}>
              🕵️ يمكنك الضغط مطولاً على إجابة لاستجواب صاحبها
            </Text>
          )}

          <View style={{ width: '90%' }}>
            <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>1. أفضل إجابة</Text>
            {votingData.answers.map((item) => (
              <TouchableOpacity activeOpacity={0.7}
                key={item.id}
                style={[
                  styles.voteButton,
                  selectedQuality === item.id && styles.selectedVote,
                  item.id === socket.id && styles.disabledVote
                ]}
                onPress={() => {
                  if (item.id !== socket.id) setSelectedQuality(item.id);
                  else Alert.alert('تنبيه', 'لا يمكنك التصويت لنفسك!');
                }}
                onLongPress={() => {
                  if (roleData?.role === 'DETECTIVE' && (roleData?.round >= 2 || roleData?.isTutorial) && !abilityUsed && item.id !== socket.id) {
                    Alert.alert(
                      'استجواب',
                      'هل تريد استجواب هذا المشتبه به؟',
                      [{ text: 'إلغاء', style: 'cancel' }, { text: 'نعم', onPress: () => handleInterrogate(item.id) }]
                    );
                  }
                }}
                disabled={item.id === socket.id}
              >
                <Text style={[styles.voteText, item.id === socket.id && { color: '#2F4F4F' }]}>
                  "{item.answer}"
                </Text>
                <Text style={{ fontSize: 12, color: '#666', textAlign: 'right', marginTop: 4 }}>
                  - {item.name} {item.id === socket.id ? '(أنت)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ width: '90%', marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>2. من هو الشاهد؟</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {votingData.players.map((player) => (
                <TouchableOpacity activeOpacity={0.7}
                  key={player.id}
                  style={[styles.playerButton, selectedIdentity === player.id && styles.selectedVote]}
                  onPress={() => setSelectedIdentity(player.id)}
                >
                  <Text style={[styles.voteText, { textAlign: 'center', fontSize: 14 }]}>{player.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleSubmitVote}>
            <Text style={styles.buttonText}>إرسال التصويت</Text>
          </TouchableOpacity>
        </ScrollView>
      </GlobalLayout>
    );
  }

  if (screen === 'RESULTS') {
    return (
      <GlobalLayout title="النتائج" showStamp={false}>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
        </View>
        <Text style={styles.subtitle}>انظر للشاشة الرئيسية</Text>
      </GlobalLayout>
    );
  }

  if (screen === 'END') {
    return (
      <GlobalLayout title="نهاية اللعبة" showStamp={true} stampText="انتهت المهمة">
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <RoleAvatar role={roleData?.role} size={50} showLabel={false} />
        </View>
        <Text style={styles.subtitle}>شكراً لمشاركتك</Text>

        <TouchableOpacity activeOpacity={0.7} style={[styles.button, { backgroundColor: '#666', marginTop: 30 }]} onPress={handleBackToRoleSelect}>
          <Text style={styles.buttonText}>خروج</Text>
        </TouchableOpacity>
      </GlobalLayout>
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2F4F4F',  // ✅ رمادي فحمي (خلفية مظلمة للتباين)
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
  },
  paperContainer: {
    width: '100%',
    backgroundColor: '#F5F5DC',  // ✅ بيج ورق قديم (الأساس)
    borderWidth: 2,              // ✅ حد أسمك
    borderColor: '#B22222',      // ✅ أحمر باهت (أختام)
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    position: 'relative',
    marginTop: 20,
  },
  fileContainer: {
    width: '100%',
    height: '90%',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperClip: {
    position: 'absolute',
    top: -10,
    right: 10, // Visual left in RTL
    width: 50,
    height: 100,
    zIndex: 5,
  },
  tape: {
    position: 'absolute',
    top: -25,
    alignSelf: 'center',
    width: 130,
    height: 65,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 20,
    fontFamily: 'Courier New',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4e342e',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    width: '90%',
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: '#3e2723',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#3e2723',
    fontFamily: 'Courier New',
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#3e2723',
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
    borderRadius: 2,
    transform: [{ scale: 1 }],
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f4e4bc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
  stampContainer: {
    borderWidth: 4,
    borderColor: theme.colors.accentRed,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 20,
    transform: [{ rotate: '-5deg' }],
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  stamp: {
    color: theme.colors.accentRed,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  roleTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  roleDesc: {
    fontSize: 18,
    lineHeight: 26,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2F4F4F',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
  },
  infoLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 20, // Larger
    fontWeight: 'bold', // Bolder
    textAlign: 'right', // Arabic alignment
    lineHeight: 30,
    color: '#1a1a1a', // Darker black
  },
  roleButton: {
    width: '85%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: theme.colors.accentYellow,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
  },
  roleButtonIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  roleButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.background,
    marginBottom: 5,
  },
  roleButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  roomCodeBox: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 20,
    transform: [{ rotate: '2deg' }],
  },
  roomCode: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 10,
    fontFamily: 'Courier New',
  },
  screenLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
    marginTop: 20,
  },
  playerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 20,
    gap: 15,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.text,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 120,
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  confidentialBadge: {
    position: 'absolute',
    top: -8,
    right: -5,
    backgroundColor: theme.colors.accentRed,
    paddingHorizontal: 4,
    paddingVertical: 2,
    transform: [{ rotate: '5deg' }],
    zIndex: 1,
  },
  confidentialText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  enhancedCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: theme.colors.accentRed,
    borderRadius: 4,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerCardText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.accentRed,
    marginBottom: 20,
  },
  answersList: {
    width: '100%',
    marginVertical: 20,
    gap: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  answerCard: {
    backgroundColor: '#fffcf0',
    borderWidth: 2,
    borderColor: '#2F4F4F',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  answerCardSquare: {
    backgroundColor: '#fffcf0',
    borderWidth: 2,
    borderColor: '#2F4F4F',
    width: '45%', // 2 per row
    minHeight: 150, // Allow growth if needed, but flex wrap helps.
    // aspectRatio: 1, // REMOVE AspectRatio to allow vertical growth for long text
    padding: 10,
    margin: '2.5%',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  answerText: {
    fontSize: 16, // Reduced from 18
    fontWeight: 'bold',
    color: '#2e2e2e',
    marginVertical: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    flexWrap: 'wrap', // Ensure wrapping
  },
  answerAuthor: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    marginTop: 10,
  },
  resultsList: {
    width: '100%',
    marginVertical: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.text,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 8,
    flexDirection: 'column', // Changed to column for small screens, or let it wrap
    width: '100%',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: theme.colors.text,
    textAlign: 'right',
    width: '100%',
  },
  voteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.text,
    padding: 10,
    marginBottom: 8,
    width: '100%',
    borderRadius: 5,
    alignSelf: 'center',
  },
  playerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.text,
    padding: 10,
    margin: 5,
    minWidth: 100,
    alignItems: 'center',
    borderRadius: 5,
  },
  selectedVote: {
    backgroundColor: theme.colors.accentYellow,
    borderColor: theme.colors.accentRed,
    borderWidth: 2,
  },
  disabledVote: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  voteText: {
    fontSize: 14, // Reduced from 16
    color: theme.colors.text,
    textAlign: 'right',
    flexWrap: 'wrap',
    width: '100%',
    lineHeight: 20, // Better line spacing for reading
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.text,
  },
  modalButton: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: theme.colors.accentRed,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fileButtonContainer: {
    width: '90%',
    height: 120, // Reduced from 160
    marginBottom: 15,
  },
  fileButtonBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10, // Reduced padding
  },
  menuContainer: {
    width: '95%',
    backgroundColor: 'rgba(245, 245, 220, 0.6)', // More subtle paper color
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(178, 34, 34, 0.4)',
    padding: 10,
    maxHeight: '90%', // More space
    alignItems: 'center',
  },
  roleButtonTextBlack: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Courier New',
  },
  roleButtonSubtextBlack: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  redactedText: {
    backgroundColor: 'black',
    color: 'black',
    paddingHorizontal: 5,
  },
  stampContainerSmall: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderWidth: 2,
    borderColor: theme.colors.accentRed,
    paddingVertical: 5,
    paddingHorizontal: 10,
    transform: [{ rotate: '-10deg' }],
    borderRadius: 2,
  },
  stampSmall: {
    color: theme.colors.accentRed,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  roleTitle: {
    fontSize: 28, // Reduced from 36
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    flexWrap: 'wrap', // Wrap long names
  },
});

registerRootComponent(App);




