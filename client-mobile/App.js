import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, I18nManager } from 'react-native';
import io from 'socket.io-client';
import { theme } from './src/styles/theme';

// Force RTL
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Replace with your computer's local IP address
const SOCKET_URL = 'http://192.168.1.X:3000'; 

export default function App() {
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('LOGIN'); // LOGIN, LOBBY, GAME
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roleData, setRoleData] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('joinedRoom', (data) => {
      setScreen('LOBBY');
    });

    newSocket.on('roleAssigned', (data) => {
      setRoleData(data);
      setScreen('GAME');
    });

    newSocket.on('error', (msg) => {
      Alert.alert('خطأ', msg);
    });

    return () => newSocket.close();
  }, []);

  const handleJoin = () => {
    if (!playerName || !roomCode) {
      Alert.alert('تنبيه', 'الرجاء إدخال الاسم ورمز الغرفة');
      return;
    }
    socket.emit('joinRoom', { roomCode, playerName });
  };

  if (screen === 'LOGIN') {
    return (
      <View style={styles.container}>
        <View style={styles.stampContainer}>
          <Text style={styles.stamp}>سري</Text>
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
          <Text style={styles.buttonText}>انضمام للمهمة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'LOBBY') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>تم قبول التصريح</Text>
        <Text style={styles.subtitle}>أهلاً بالعميل {playerName}</Text>
        <Text style={[styles.status, { color: theme.colors.accentRed }]}>وضع الاستعداد</Text>
        
        <View style={[styles.stampContainer, { transform: [{ rotate: '10deg' }], marginTop: 50 }]}>
          <Text style={styles.stamp}>بانتظار القيادة</Text>
        </View>
      </View>
    );
  }

  if (screen === 'GAME' && roleData) {
    return (
      <View style={styles.container}>
        <Text style={[styles.roleTitle, { color: theme.colors.accentRed }]}>{roleData.roleName}</Text>
        <Text style={styles.roleDesc}>{roleData.description}</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>معلومات سرية:</Text>
          <Text style={styles.infoText}>{roleData.info}</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 30,
    fontFamily: 'Courier New', // Will fallback on Android
  },
  subtitle: {
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: 10,
  },
  input: {
    width: '80%',
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.text,
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.text,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 20,
    shadowColor: theme.colors.accentYellow,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  stampContainer: {
    borderWidth: 3,
    borderColor: theme.colors.accentRed,
    padding: 10,
    marginBottom: 30,
    transform: [{ rotate: '-5deg' }],
  },
  stamp: {
    color: theme.colors.accentRed,
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
  }
});
