import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, I18nManager, AppRegistry, ScrollView, Modal, Image, ImageBackground, Animated, LayoutAnimation, UIManager, Platform } from 'react-native';
import io from 'socket.io-client';
import { theme } from './src/styles/theme';
import RoleAvatar from './components/RoleAvatar';
import BackgroundWatermark from './components/BackgroundWatermark';
import RedactedText from './components/RedactedText';

// Force RTL
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Replace with your computer's local IP address
const SOCKET_URL = __DEV__ ? 'http://192.168.8.19:3000' : 'http://localhost:3000';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental && !global.nativeFabricUIManager) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

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
    setTutorialModalVisible(true);
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
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, width: '100%'}}>
          <Text style={[styles.title, {marginBottom: 30, color: '#f4e4bc'}]}>اختر دورك</Text>
          
          <View style={styles.menuContainer}>
            <ScrollView style={{width: '100%'}} contentContainerStyle={{alignItems: 'center', paddingVertical: 20}}>
              <TouchableOpacity activeOpacity={0.7} 
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

              <TouchableOpacity activeOpacity={0.7} 
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

              <TouchableOpacity activeOpacity={0.7} 
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
          </View>

          <Modal visible={tutorialModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>اختر دورك للتدريب</Text>
                <ScrollView style={{maxHeight: 300, width: '100%'}}>
                  {['WITNESS', 'ARCHITECT', 'DETECTIVE', 'SPY', 'ACCOMPLICE', 'LAWYER', 'TRICKSTER', 'CITIZEN'].map(role => (
                     <TouchableOpacity activeOpacity={0.7} key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                       <Text style={styles.modalButtonText}>{role}</Text>
                     </TouchableOpacity>
                  ))}
                  <TouchableOpacity activeOpacity={0.7} onPress={() => handleStartTutorial(null)} style={[styles.modalButton, {backgroundColor: '#ddd'}]}>
                       <Text style={styles.modalButtonText}>عشوائي</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
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
          <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleCreateRoom}>
            <Text style={styles.buttonText}>إنشاء الغرفة</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} 
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

            <TouchableOpacity activeOpacity={0.7} 
              style={[styles.button, {opacity: players.length >= 3 ? 1 : 0.5}]}
              onPress={handleStartGame}
              disabled={players.length < 3}
            >
              <Text style={styles.buttonText}>بدء المهمة</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} 
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
                     <TouchableOpacity activeOpacity={0.7} key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                       <Text style={styles.modalButtonText}>{role}</Text>
                     </TouchableOpacity>
                  ))}
                  <TouchableOpacity activeOpacity={0.7} onPress={() => handleStartTutorial(null)} style={[styles.modalButton, {backgroundColor: '#ddd'}]}>
                       <Text style={styles.modalButtonText}>عشوائي</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
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
                <View key={index} style={[styles.resultCard, {borderWidth: 3, borderColor: '#333', padding: 15, marginBottom: 15, backgroundColor: '#fafaf5'}]}>
                  <View style={{marginBottom: 15, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#333'}}>
                    <Text style={{fontWeight: 'bold', fontSize: 16}}>#{index + 1} {player.name}</Text>
                    <Text style={{color: '#666', fontSize: 13, marginTop: 5}}>{player.role}</Text>
                    <View style={{marginTop: 10}}>
                      <Text style={{fontWeight: 'bold', color: '#2ecc71', fontSize: 18}}>+{player.roundScore}</Text>
                      <Text style={{color: '#666', fontSize: 12}}>المجموع: {player.totalScore}</Text>
                    </View>
                  </View>
                  
                  <View>
                    <Text style={{fontWeight: 'bold', marginBottom: 10, fontSize: 14}}>📊 كيف حصل على نقاطه:</Text>
                    {player.breakdown && player.breakdown.length > 0 ? (
                      player.breakdown.map((item, idx) => {
                        const isNegative = item.includes('-') && !item.includes('لم');
                        const bgColor = isNegative ? '#ffebee' : '#e8f5e9';
                        const borderColor = isNegative ? '#f44336' : '#2ecc71';
                        const textColor = isNegative ? '#c62828' : '#1b5e20';
                        
                        return (
                          <View key={idx} style={{backgroundColor: bgColor, padding: 10, marginVertical: 5, borderLeftWidth: 4, borderLeftColor: borderColor, borderRadius: 4}}>
                            <Text style={{color: textColor, fontSize: 13, fontWeight: '500'}}>{item}</Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={{color: '#999', fontSize: 12}}>لا توجد نقاط</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleNextRound}>
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
            <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleRestart}>
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
          
          <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleJoin}>
            <Text style={styles.buttonText}>
              {isTutorialFlow ? 'انضمام للتدريب' : 'انضمام للمهمة'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} 
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

          <TouchableOpacity activeOpacity={0.7} 
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
                     <TouchableOpacity activeOpacity={0.7} key={role} onPress={() => handleStartTutorial(role)} style={styles.modalButton}>
                       <Text style={styles.modalButtonText}>{role}</Text>
                     </TouchableOpacity>
                  ))}
                  <TouchableOpacity activeOpacity={0.7} onPress={() => handleStartTutorial(null)} style={[styles.modalButton, {backgroundColor: '#ddd'}]}>
                       <Text style={styles.modalButtonText}>عشوائي</Text>
                  </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setTutorialModalVisible(false)} style={styles.cancelButton}>
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
                    <RedactedText text={roleData?.info} />
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
              <TouchableOpacity activeOpacity={0.7} 
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
                <TouchableOpacity activeOpacity={0.7} 
                  key={player.id} 
                  style={[styles.playerButton, selectedIdentity === player.id && styles.selectedVote]}
                  onPress={() => setSelectedIdentity(player.id)}
                >
                  <Text style={styles.voteText}>{player.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleSubmitVote}>
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
          
          <TouchableOpacity activeOpacity={0.7} style={[styles.button, {backgroundColor: '#666'}]} onPress={handleBackToRoleSelect}>
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
    backgroundColor: '#2c2c2c',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paperContainer: {
    width: '100%',
    backgroundColor: '#f4e4bc',
    borderWidth: 1,
    borderColor: '#8d6e63',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 30,
    fontFamily: 'Courier New',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 24,
    color: '#4e342e',
    marginBottom: 10,
  },
  input: {
    width: '80%',
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: '#5d4037',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#3e2723',
    fontFamily: 'Courier New',
  },
  button: {
    backgroundColor: '#3e2723',
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
    borderRadius: 2,
    transform: [{ scale: 1 }],
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#f4e4bc',
    fontSize: 18,
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
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 30,
    color: theme.colors.text,
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
    fontSize: 18,
    textAlign: 'right',
    lineHeight: 24,
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
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
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
  },
  answerCard: {
    backgroundColor: '#fffcf0',
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  answerText: {
    fontSize: 16,
    color: theme.colors.text,
    marginVertical: 10,
    fontStyle: 'italic',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 15,
    marginBottom: 10,
    width: '100%',
    borderRadius: 5,
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
    height: 160,
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
  menuContainer: {
    width: '95%',
    backgroundColor: 'rgba(244, 228, 188, 0.9)', // Paper color with opacity
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#8d6e63',
    padding: 15,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
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
});

AppRegistry.registerComponent('main', () => App);




