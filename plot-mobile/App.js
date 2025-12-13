import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, I18nManager, AppRegistry, ScrollView, Modal, Image, ImageBackground } from 'react-native';
import io from 'socket.io-client';
import { theme } from './src/styles/theme';
import RoleAvatar from './components/RoleAvatar';
import BackgroundWatermark from './components/BackgroundWatermark';

// Force RTL
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Replace with your computer's local IP address
const SOCKET_URL = __DEV__ ? 'http://192.168.8.19:3000' : 'http://localhost:3000';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('ROLE_SELECT'); // ROLE_SELECT, LOGIN, HOST_SETUP, LOBBY, GAME
  const [userRole, setUserRole] = useState(null); // 'HOST' or 'PLAYER'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [generatedRoomCode, setGeneratedRoomCode] = useState('');
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

  // Ref to access current state inside socket callbacks
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

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error);
      Alert.alert('خطأ في الاتصال', 'تأكد من عنوان IP وأن الخادم يعمل');
    });

    newSocket.on('roomCreated', (code) => {
      setRoomCode(code);
      if (userRoleRef.current === 'HOST') {
        setScreen('HOST_LOBBY');
      } else if (isTutorialFlowRef.current) {
        // In tutorial flow, we don't go to lobby, we show role selection
        setTutorialModalVisible(true);
      }
    });

    newSocket.on('joinedRoom', (data) => {
      console.log('✅ Joined room:', data);
      if (userRoleRef.current === 'PLAYER') {
        setScreen('LOBBY');
        if (isTutorialFlowRef.current) {
          setTutorialModalVisible(true);
        }
      }
      if (data.isLeader) {
        setIsLeader(true);
      }
    });

    newSocket.on('playerJoined', (playersList) => {
      setPlayers(playersList);
    });

    newSocket.on('gameStarted', (data) => {
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
    if (!socket) {
      Alert.alert('خطأ', 'لم يتم الاتصال بالخادم بعد');
      return;
    }
    // Host doesn't need a name in the current server logic, but we can send it if needed later
    // Server expects 'createRoom' with no args or args it ignores
    socket.emit('createRoom');
  };

  const handleJoin = () => {
    if (!playerName || !roomCode) {
      Alert.alert('تنبيه', 'الرجاء إدخال الاسم ورمز الغرفة');
      return;
    }
    if (!socket) {
      Alert.alert('خطأ', 'لم يتم الاتصال بالخادم بعد');
      return;
    }
    socket.emit('joinRoom', { roomCode, playerName });
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  const handleSelectTraining = () => {
    setUserRole('PLAYER');
    setIsTutorialFlow(true);
    setPlayerName('المتدرب');
    setScreen('LOGIN');
  };

  const handleStartTutorial = (role = null) => {
    setTutorialModalVisible(false);
    socket.emit('startTutorial', role);
  };

  const handleNextRound = () => {
    socket.emit('nextRound');
  };

  const handleRestart = () => {
    socket.emit('startGame');
  };

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
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={[styles.paperContainer, {flex: 1, maxHeight: '90%', paddingTop: 40}]}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
          <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <Text style={[styles.title, {marginBottom: 20}]}>اختر دورك</Text>
          
          <ScrollView style={{width: '100%'}} contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}>
            <TouchableOpacity 
              style={styles.fileButtonContainer} 
              onPress={handleSelectHostRole}
            >
              <ImageBackground source={require("./assets/file.png")} style={styles.fileButtonBackground} resizeMode="stretch">
                <View style={styles.fileContent}>
                  <Text style={styles.roleButtonTextBlack}>مدير اللعبة</Text>
                  <Text style={styles.roleButtonSubtextBlack}>أنشئ غرفة وأدر اللعبة</Text>
                </View>
                <View style={styles.stampContainerSmall}>
                   <Text style={styles.stampSmall}>سري للغاية</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.fileButtonContainer} 
              onPress={handleSelectPlayerRole}
            >
              <ImageBackground source={require("./assets/file.png")} style={styles.fileButtonBackground} resizeMode="stretch">
                <View style={styles.fileContent}>
                  <Text style={styles.roleButtonTextBlack}>لاعب</Text>
                  <Text style={styles.roleButtonSubtextBlack}>انضم إلى غرفة موجودة</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.fileButtonContainer} 
              onPress={handleSelectTraining}
            >
              <ImageBackground source={require("./assets/file.png")} style={styles.fileButtonBackground} resizeMode="stretch">
                <View style={styles.fileContent}>
                  <Text style={styles.roleButtonTextBlack}>تدريب فردي</Text>
                  <Text style={styles.roleButtonSubtextBlack}>العب ضد الروبوتات</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </ScrollView>

          <Modal visible={tutorialModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>اختر دورك للتدريب</Text>
                <ScrollView style={{maxHeight: 300, width: '100%'}}>
                  {['WITNESS', 'ARCHITECT', 'DETECTIVE', 'SPY', 'ACCOMPLICE', 'LAWYER', 'TRICKSTER', 'CITIZEN'].map(role => (
                     <TouchableOpacity key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                       <Text style={styles.modalButtonText}>{role}</Text>
                     </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => handleStartTutorial(null)} style={[styles.modalButton, {backgroundColor: '#ddd'}]}>
                       <Text style={styles.modalButtonText}>عشوائي</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  if (screen === 'HOST_SETUP') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <Text style={styles.title}>إعدادات مدير اللعبة</Text>
          <TouchableOpacity style={styles.button} onPress={handleCreateRoom}>
            <Text style={styles.buttonText}>إنشاء الغرفة</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, {backgroundColor: '#999', marginTop: 10}]} 
            onPress={handleBackToRoleSelect}
          >
            <Text style={styles.buttonText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === 'HOST_LOBBY') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}>
            <Text style={styles.stamp}>غرفة العمليات</Text>
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

            <TouchableOpacity 
              style={[styles.button, {opacity: players.length >= 3 ? 1 : 0.5}]}
              onPress={handleStartGame}
              disabled={players.length < 3}
            >
              <Text style={styles.buttonText}>بدء المهمة</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, {marginTop: 10, backgroundColor: '#2F4F4F'}]}
              onPress={() => setTutorialModalVisible(true)}
            >
              <Text style={styles.buttonText}>بدء تدريب (Tutorial)</Text>
            </TouchableOpacity>
          </ScrollView>

          <Modal visible={tutorialModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>اختر دورك للتدريب</Text>
                <ScrollView style={{maxHeight: 300, width: '100%'}}>
                  {['WITNESS', 'ARCHITECT', 'DETECTIVE', 'SPY', 'ACCOMPLICE', 'LAWYER', 'TRICKSTER', 'CITIZEN'].map(role => (
                     <TouchableOpacity key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                       <Text style={styles.modalButtonText}>{role}</Text>
                     </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => handleStartTutorial(null)} style={[styles.modalButton, {backgroundColor: '#ddd'}]}>
                       <Text style={styles.modalButtonText}>عشوائي</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  if (screen === 'HOST_GAME' || screen === 'HOST_DRAFTING') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}>
            <Text style={styles.title}>{gameTitle}</Text>
            <Text style={styles.timer}>{timeLeft}</Text>
            <Text style={styles.subtitle}>جاري كتابة التقارير...</Text>
            <View style={styles.playerList}>
              {submittedPlayers.map((name, index) => (
                <View key={index} style={[styles.playerCard, {backgroundColor: '#e0ffe0'}]}>
                  <Text style={styles.playerCardText}>{name} ✅</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  if (screen === 'HOST_PRESENTATION') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}>
            <Text style={styles.title}>التقارير الواردة</Text>
            <View style={styles.answersList}>
              {answers.map((item, index) => (
                <View key={index} style={styles.answerCard}>
                  <Text style={styles.answerText}>"{item.answer}"</Text>
                  <Text style={styles.answerAuthor}>- {item.playerName}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  if (screen === 'HOST_VOTING') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <Text style={styles.title}>مرحلة التصويت</Text>
          <Text style={styles.subtitle}>العملاء يقومون بالتصويت الآن...</Text>
        </View>
      </View>
    );
  }

  if (screen === 'HOST_RESULTS') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}>
            <Text style={styles.title}>نتائج الجولة</Text>
            <View style={styles.resultsList}>
              {results.map((player, index) => (
                <View key={index} style={styles.resultCard}>
                  <Text style={{flex: 1}}>#{index + 1} {player.name} ({player.role})</Text>
                  <Text>+{player.roundScore} (المجموع: {player.totalScore})</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleNextRound}>
              <Text style={styles.buttonText}>الجولة التالية</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  if (screen === 'HOST_END') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}>
            <Text style={styles.title}>النتائج النهائية</Text>
            <View style={styles.resultsList}>
              {results.map((player, index) => (
                <View key={index} style={styles.resultCard}>
                  <Text>{index === 0 ? '🏆 ' : ''} #{index + 1} {player.name}</Text>
                  <Text>{player.totalScore} نقطة</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleRestart}>
              <Text style={styles.buttonText}>لعبة جديدة</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  // --- PLAYER SCREENS ---

  if (screen === 'LOGIN') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
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
          
          <TouchableOpacity style={styles.button} onPress={handleJoin}>
            <Text style={styles.buttonText}>
              {isTutorialFlow ? 'انضمام للتدريب' : 'انضمام للمهمة'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, {backgroundColor: '#999', marginTop: 10}]} 
            onPress={handleBackToRoleSelect}
          >
            <Text style={styles.buttonText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === 'LOBBY') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <Text style={styles.title}>تم قبول التصريح</Text>
          <Text style={styles.subtitle}>أهلاً بالعميل {playerName}</Text>
          <Text style={[styles.status, { color: theme.colors.accentRed }]}>وضع الاستعداد</Text>
          
          <View style={[styles.stampContainer, { transform: [{ rotate: '10deg' }], marginTop: 50 }]}>
            <Text style={styles.stamp}>بانتظار القيادة</Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, {marginTop: 30, backgroundColor: '#2F4F4F'}]}
            onPress={() => setTutorialModalVisible(true)}
          >
            <Text style={styles.buttonText}>بدء تدريب (Tutorial)</Text>
          </TouchableOpacity>

          <Modal visible={tutorialModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>اختر دورك للتدريب</Text>
                <ScrollView style={{maxHeight: 300, width: '100%'}}>
                  {['WITNESS', 'ARCHITECT', 'DETECTIVE', 'SPY', 'ACCOMPLICE', 'LAWYER', 'TRICKSTER', 'CITIZEN'].map(role => (
                     <TouchableOpacity key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                       <Text style={styles.modalButtonText}>{role}</Text>
                     </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => handleStartTutorial(null)} style={[styles.modalButton, {backgroundColor: '#ddd'}]}>
                       <Text style={styles.modalButtonText}>عشوائي</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  if (screen === 'GAME' && roleData) {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <View style={{alignItems: 'center', marginBottom: 20}}>
            <RoleAvatar role={roleData.role} size={120} />
          </View>
          <Text style={[styles.roleTitle, { color: theme.colors.accentRed }]}>{roleData.roleName}</Text>
          <Text style={styles.roleDesc}>{roleData.description}</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>معلومات سرية:</Text>
            <Text style={styles.infoText}>{roleData.info}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (screen === 'DRAFTING') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
             <View style={{flex: 1}}>
                <View style={{width: '100%', padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 5}}>
                    <Text style={{textAlign: 'right', fontWeight: 'bold', color: theme.colors.accentRed}}>{gameTitle}</Text>
                    <Text style={{textAlign: 'right', fontWeight: 'bold'}}>أنت: {roleData?.roleName}</Text>
                    <Text style={{textAlign: 'right', fontSize: 12}}>{roleData?.info}</Text>
                </View>
             </View>
             <View style={{marginLeft: 10}}>
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
              <Text style={{alignSelf: 'flex-end', marginRight: '10%'}}>{answer.length}/140</Text>
              
              {roleData?.role === 'SPY' && (roleData?.round >= 2 || roleData?.isTutorial) && !abilityUsed && (
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.colors.accentYellow, marginBottom: 10 }]} 
                  onPress={handleUseAbility}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text }]}>👁️ عين الصقر</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.button} onPress={handleSubmitAnswer}>
                <Text style={styles.buttonText}>إرسال</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.stampContainer}>
              <Text style={styles.stamp}>تم الإرسال</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (screen === 'PRESENTATION') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <View style={{position: 'absolute', top: 10, right: 10}}>
            <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
          </View>
          <Text style={styles.title}>وقت المواجهة</Text>
          <Text style={styles.subtitle}>انظر للشاشة الرئيسية</Text>
        </View>
      </View>
    );
  }

  if (screen === 'VOTING' && votingData) {
    if (isSubmitted) {
      return (
        <View style={styles.container}>
          <BackgroundWatermark />
          <View style={styles.paperContainer}>
            <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
            <View style={{position: 'absolute', top: 10, right: 10}}>
                <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
            </View>
            <View style={styles.stampContainer}>
              <Text style={styles.stamp}>تم التصويت</Text>
            </View>
            <Text style={styles.subtitle}>بانتظار النتائج...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <View style={{position: 'absolute', top: 10, right: 10, zIndex: 100}}>
            <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
          </View>
          <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}>
            <Text style={styles.title}>التصويت</Text>
            
            {roleData?.role === 'DETECTIVE' && (roleData?.round >= 2 || roleData?.isTutorial) && !abilityUsed && (
               <Text style={{color: theme.colors.accentRed, fontWeight: 'bold', marginBottom: 10}}>
                 🕵️ يمكنك الضغط مطولاً على إجابة لاستجواب صاحبها
               </Text>
            )}

            <Text style={styles.sectionTitle}>1. أفضل إجابة (الأكثر إقناعاً)</Text>
            {votingData.answers.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.voteButton, 
                  selectedQuality === item.id && styles.selectedVote,
                  item.id === socket.id && styles.disabledVote
                ]}
                onPress={() => {
                  if (item.id !== socket.id) {
                    setSelectedQuality(item.id);
                  } else {
                    Alert.alert('تنبيه', 'لا يمكنك التصويت لنفسك!');
                  }
                }}
                onLongPress={() => {
                    if (roleData?.role === 'DETECTIVE' && (roleData?.round >= 2 || roleData?.isTutorial) && !abilityUsed && item.id !== socket.id) {
                        Alert.alert(
                            'استجواب',
                            'هل تريد استجواب هذا المشتبه به؟',
                            [
                                { text: 'إلغاء', style: 'cancel' },
                                { text: 'نعم', onPress: () => handleInterrogate(item.id) }
                            ]
                        );
                    }
                }}
                disabled={item.id === socket.id}
              >
                <Text style={[styles.voteText, item.id === socket.id && {color: '#999'}]}>
                  {item.answer} {item.id === socket.id ? '(أنت)' : ''}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>2. من هو الشاهد؟</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'}}>
              {votingData.players.map((player) => (
                <TouchableOpacity 
                  key={player.id} 
                  style={[styles.playerButton, selectedIdentity === player.id && styles.selectedVote]}
                  onPress={() => setSelectedIdentity(player.id)}
                >
                  <Text style={styles.voteText}>{player.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmitVote}>
              <Text style={styles.buttonText}>إرسال التصويت</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  if (screen === 'RESULTS') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <View style={{position: 'absolute', top: 10, right: 10}}>
            <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
          </View>
          <Text style={styles.title}>النتائج</Text>
          <Text style={styles.subtitle}>انظر للشاشة الرئيسية</Text>
        </View>
      </View>
    );
  }

  if (screen === 'END') {
    return (
      <View style={styles.container}>
        <BackgroundWatermark />
        <View style={styles.paperContainer}>
          <Image source={require("./assets/paperClip.png")} style={styles.paperClip} resizeMode="contain" />
            <Image source={require("./assets/tape.png")} style={styles.tape} resizeMode="contain" />
          <View style={{position: 'absolute', top: 10, right: 10}}>
            <RoleAvatar role={roleData?.role} size={60} showLabel={false} />
          </View>
          <View style={styles.stampContainer}>
            <Text style={styles.stamp}>انتهت المهمة</Text>
          </View>
          <Text style={styles.title}>نهاية اللعبة</Text>
          <Text style={styles.subtitle}>شكراً لمشاركتك</Text>
          
          <TouchableOpacity style={[styles.button, {backgroundColor: '#666'}]} onPress={handleBackToRoleSelect}>
            <Text style={styles.buttonText}>خروج</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.m,
  },
  paperContainer: {
    width: '100%',
    backgroundColor: theme.colors.lightBg,
    borderWidth: 2,
    borderColor: theme.colors.text,
    padding: theme.spacing.l,
    ...theme.shadows.card,
    position: 'relative',
    marginTop: theme.spacing.l,
    borderStyle: 'solid',
  },
  fileContainer: {
    width: '100%',
    height: '90%',
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperClip: {
    position: 'absolute',
    top: -5,
    right: 10,
    width: 30,
    height: 60,
    zIndex: 5,
    ...theme.shadows.light,
  },
  tape: {
    position: 'absolute',
    top: -25,
    alignSelf: 'center',
    width: 130,
    height: 65,
    zIndex: 10,
    ...theme.shadows.light,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.fonts.main,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
    fontFamily: theme.fonts.main,
  },
  input: {
    width: '85%',
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.text,
    fontSize: 18,
    marginBottom: theme.spacing.l,
    textAlign: 'center',
    color: theme.colors.text,
    fontFamily: theme.fonts.main,
    backgroundColor: theme.colors.lightBg,
  },
  button: {
    backgroundColor: theme.colors.accentGreen,
    paddingVertical: 14,
    paddingHorizontal: 35,
    marginTop: theme.spacing.l,
    ...theme.shadows.card,
    borderRadius: theme.borderRadius.small,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: theme.fonts.main,
  },
  stampContainer: {
    borderWidth: 3,
    borderColor: theme.colors.accentRed,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: theme.spacing.l,
    transform: [{ rotate: '-5deg' }],
    alignSelf: 'center',
    borderRadius: theme.borderRadius.small,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  stamp: {
    color: theme.colors.accentRed,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: theme.fonts.bold,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: theme.spacing.m,
    color: theme.colors.text,
  },
  roleTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
    color: theme.colors.text,
    fontFamily: theme.fonts.main,
  },
  roleDesc: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
    fontFamily: theme.fonts.main,
  },
  infoBox: {
    backgroundColor: theme.colors.darkOverlay,
    padding: theme.spacing.l,
    width: '100%',
    borderWidth: 2,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.medium,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
    fontSize: 15,
    textAlign: 'right',
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'right',
    lineHeight: 24,
    color: theme.colors.text,
    fontFamily: theme.fonts.main,
  },
  roleButton: {
    width: '90%',
    paddingVertical: 18,
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.m,
    alignItems: 'center',
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.card,
    borderWidth: 2,
    borderColor: theme.colors.text,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
    fontFamily: theme.fonts.main,
  },
  roleButtonSubtext: {
    fontSize: 13,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.8,
    fontFamily: theme.fonts.main,
  },
  roomCodeBox: {
    backgroundColor: theme.colors.text,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: theme.spacing.l,
    transform: [{ rotate: '2deg' }],
    borderRadius: theme.borderRadius.small,
    ...theme.shadows.card,
  },
  roomCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 8,
    fontFamily: theme.fonts.main,
  },
  screenLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.l,
    fontFamily: theme.fonts.bold,
  },
  playerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginVertical: theme.spacing.l,
    gap: theme.spacing.m,
  },
  playerCard: {
    backgroundColor: theme.colors.lightBg,
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 110,
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    borderRadius: theme.borderRadius.small,
    ...theme.shadows.light,
  },
  confidentialBadge: {
    position: 'absolute',
    top: -8,
    right: -5,
    backgroundColor: theme.colors.accentRed,
    paddingHorizontal: 5,
    paddingVertical: 2,
    transform: [{ rotate: '5deg' }],
    zIndex: 1,
    borderRadius: theme.borderRadius.small,
  },
  confidentialText: {
    color: theme.colors.white,
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontFamily: theme.fonts.bold,
  },
  playerCardText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
    fontFamily: theme.fonts.main,
  },
  timer: {
    fontSize: 44,
    fontWeight: 'bold',
    color: theme.colors.accentRed,
    marginBottom: theme.spacing.l,
    fontFamily: theme.fonts.main,
  },
  answersList: {
    width: '100%',
    marginVertical: theme.spacing.l,
    gap: theme.spacing.m,
  },
  answerCard: {
    backgroundColor: theme.colors.lightBg,
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.light,
  },
  answerText: {
    fontSize: 15,
    color: theme.colors.text,
    marginVertical: theme.spacing.m,
    fontStyle: 'italic',
    fontFamily: theme.fonts.main,
  },
  answerAuthor: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginTop: theme.spacing.m,
    opacity: 0.7,
    fontFamily: theme.fonts.main,
  },
  resultsList: {
    width: '100%',
    marginVertical: theme.spacing.l,
  },
  resultCard: {
    backgroundColor: theme.colors.lightBg,
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.light,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
    color: theme.colors.text,
    textAlign: 'right',
    width: '100%',
    fontFamily: theme.fonts.bold,
  },
  voteButton: {
    backgroundColor: theme.colors.lightBg,
    borderWidth: 2,
    borderColor: theme.colors.text,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    width: '100%',
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.light,
  },
  playerButton: {
    backgroundColor: theme.colors.lightBg,
    borderWidth: 2,
    borderColor: theme.colors.text,
    padding: theme.spacing.m,
    margin: theme.spacing.s,
    minWidth: 95,
    alignItems: 'center',
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.light,
  },
  selectedVote: {
    backgroundColor: theme.colors.accentYellow,
    borderColor: theme.colors.accentRed,
    borderWidth: 3,
  },
  disabledVote: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    opacity: 0.6,
  },
  voteText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'right',
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
    height: 120,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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
    paddingTop: 20,
  },
  roleButtonTextBlack: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Courier New',
  },
  roleButtonSubtextBlack: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  stampContainerSmall: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderWidth: 2,
    borderColor: theme.colors.accentRed,
    paddingVertical: 4,
    paddingHorizontal: 8,
    transform: [{ rotate: '-10deg' }],
    borderRadius: 4,
  },
  stampSmall: {
    color: theme.colors.accentRed,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

AppRegistry.registerComponent('main', () => App);


