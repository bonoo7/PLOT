import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/useGameStore';
import { useSocket, ROUTES } from '../hooks/useGameSocket';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { Avatar } from '../components/avatar/Avatar';
import { AvatarEditor } from '../components/avatar/AvatarEditor';

/**
 * TrainingRoleSelectScreen - V3
 */
export const TrainingRoleSelectScreen = () => {
  const { isDesktop } = useResponsiveLayout();
  const navigation = useNavigation();
  const setSelectedTrainingRole = useGameStore((state) => state.setSelectedTrainingRole);

  const roles = [
    { id: 'CULPRIT', nameAr: 'الجاني', description: 'فريق الجريمة: تعرف القصة الكاملة', icon: '🎭' },
    { id: 'WITNESS', nameAr: 'الشاهد', description: 'فريق العدالة: تلمح كلمات القصة', icon: '👁️' },
    { id: 'DETECTIVE', nameAr: 'المحقق', description: 'فريق العدالة: تكشف هوية الفرق', icon: '🔍' },
    { id: 'SABOTEUR', nameAr: 'المخرب', description: 'فريق الجريمة: تقلب نتائج التحقيق', icon: '🧨' },
    { id: 'MINISTER', nameAr: 'الوزير', description: 'فريق العدالة: تعرف شخصيات هامة', icon: '📜' },
    { id: 'BENEFICIARY', nameAr: 'المستفيد', description: 'فريق الجريمة: تبدأ بنقاط إضافية', icon: '💰' },
    { id: 'SEER', nameAr: 'العراف', description: 'فريق العدالة: تنسخ القصة الحقيقية', icon: '🔮' },
    { id: 'MASTERMIND', nameAr: 'العقل المدبر', description: 'فريق الجريمة: تعرف أعضاء عصابتك', icon: '🧠' },
  ];

  const handleSelectRole = (roleId) => {
    setSelectedTrainingRole(roleId);
    navigation.navigate(ROUTES.TRAINING_JOIN);
  };

  return (
    <MinimalLayout>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <MinimalHeader title="تدريب فردي" subtitle="اختر الدور الذي تريد لعبه" />

        <ScrollView
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.roleCard, isDesktop && styles.roleCardDesktop]}
              onPress={() => handleSelectRole(role.id)}
              activeOpacity={0.8}
            >
              {theme.roleImages && theme.roleImages[role.id] ? (
                <Image
                  source={theme.roleImages[role.id]}
                  style={styles.roleCardImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.roleIcon}>{role.icon}</Text>
              )}
              <Text style={styles.roleName}>{role.nameAr}</Text>
              <Text style={styles.roleDesc}>{role.description}</Text>
            </TouchableOpacity>
          ))}

          {/* Random Role */}
          <TouchableOpacity
            style={[styles.roleCard, styles.randomCard, isDesktop && styles.roleCardDesktop]}
            onPress={() => handleSelectRole(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.roleIcon}>🎲</Text>
            <Text style={styles.roleName}>عشوائي</Text>
            <Text style={styles.roleDesc}>اختيار عشوائي</Text>
          </TouchableOpacity>
        </ScrollView>

        <MinimalButton
          title="رجوع"
          onPress={() => navigation.goBack()}
          variant="secondary"
          style={styles.backButton}
        />
      </View>
    </MinimalLayout>
  );
};

/**
 * TrainingJoinScreen - V4 (Manual Room Code Entry)
 * اللاعب يختار دوره ويدخل كود الغرفة التي أنشأها المضيف.
 * عند الانضمام يُضيف الخادم 3 بوتات تلقائياً بترتيب الأدوار.
 */
export const TrainingJoinScreen = () => {
  const { isDesktop } = useResponsiveLayout();
  const navigation = useNavigation();
  const { socket } = useSocket();

  // Store state
  const selectedRole = useGameStore((state) => state.selectedTrainingRole);
  const playerName = useGameStore((state) => state.playerName);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const connecting = useGameStore((state) => state.connecting);
  const setConnecting = useGameStore((state) => state.setConnecting);
  const setUserRole = useGameStore((state) => state.setUserRole);
  const myAvatar = useGameStore((state) => state.myAvatar);
  const setMyAvatar = useGameStore((state) => state.setMyAvatar);
  const [showAvatarEditor, React_useState] = React.useState(false);

  const [roomCode, setRoomCode] = React.useState('');

  const handleJoinTraining = () => {
    if (!socket) {
      Alert.alert('خطأ', 'لم يتم الاتصال بالخادم بعد.');
      return;
    }
    if (!playerName.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال اسمك أولاً.');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length < 4) {
      Alert.alert('تنبيه', 'الرجاء إدخال كود الغرفة الصحيح.');
      return;
    }

    setConnecting(true);
    setUserRole('PLAYER');

    // ✅ الانضمام للغرفة مع الدور المحدد
    // Khadam adds bots automatically
    socket.emit('joinRoom', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      desiredRole: selectedRole,
      avatar: myAvatar
    });
  };

  const getRoleInfo = (roleId) => {
    const roles = {
      'CULPRIT': { nameAr: 'الجاني', icon: '🎭' },
      'MASTERMIND': { nameAr: 'العقل المدبر', icon: '🧠' },
      'SABOTEUR': { nameAr: 'المخرب', icon: '🧨' },
      'BENEFICIARY': { nameAr: 'المستفيد', icon: '💰' },
      'DETECTIVE': { nameAr: 'المحقق', icon: '🔍' },
      'WITNESS': { nameAr: 'الشاهد', icon: '👁️' },
      'SEER': { nameAr: 'العراف', icon: '🔮' },
      'MINISTER': { nameAr: 'الوزير', icon: '📜' },
    };
    return roles[roleId] || { nameAr: 'دور عشوائي', icon: '🎲' };
  };

  const roleInfo = getRoleInfo(selectedRole);

  return (
    <MinimalLayout>
      <View style={[styles.container, { maxWidth: 500 }]}>
        <MinimalHeader title="تدريب فردي" subtitle="انضم للغرفة" />

        <MinimalCard style={{ padding: spacing.m }}>
          {/* Avatar & Role Display */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.m }}>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Avatar config={myAvatar} size={80} />
              <MinimalButton
                title="تخصيص الشخصية 🔄"
                onPress={() => React_useState(true)}
                variant="secondary"
                size="small"
                style={{ marginTop: spacing.xs }}
              />
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[styles.label, { marginBottom: 4 }]}>دورك المختار</Text>
              <View style={[styles.selectedRoleBox, { marginBottom: 0, padding: spacing.xs }]}>
                <Text style={styles.selectedRoleText}>{roleInfo.nameAr}</Text>
              </View>
            </View>
          </View>

          {/* Inputs */}
          <View style={{ flexDirection: 'row', gap: spacing.s }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>اسمك</Text>
              <MinimalTextInput
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="الاسم"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>كود الغرفة</Text>
              <MinimalTextInput
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase())}
                placeholder="XXXX"
                maxLength={6}
              />
            </View>
          </View>
        </MinimalCard>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>🤖 سيضيف المضيف 3 بوتات تلقائياً عند انضمامك</Text>
          <Text style={[styles.infoText, { marginTop: 4, fontSize: 11 }]}>🎮 المضيف يتحكم ببدء اللعبة وإضافة بوتات إضافية</Text>
        </View>

        <View style={styles.buttonGroup}>
          <MinimalButton
            title={connecting ? 'جاري الانضمام...' : 'انضم للتدريب'}
            onPress={handleJoinTraining}
            disabled={connecting || !playerName.trim() || roomCode.trim().length < 4}
            loading={connecting}
          />
          <MinimalButton
            title="رجوع"
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
        </View>
      </View>

      <AvatarEditor
        visible={showAvatarEditor}
        initialConfig={myAvatar}
        onSave={(config) => {
          setMyAvatar(config);
          React_useState(false);
        }}
        onCancel={() => React_useState(false)}
      />
    </MinimalLayout>
  );
};

// Helper Input Component for V3
const MinimalTextInput = ({ value, onChangeText, placeholder, maxLength }) => (
  <TextInput
    style={styles.textInput}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    maxLength={maxLength}
    placeholderTextColor="#999"
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: spacing.m,
    gap: spacing.m,
    alignItems: 'center',
  },
  containerDesktop: {
    maxWidth: 1000,
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.m,
    paddingBottom: spacing.l,
  },
  roleCard: {
    width: '45%',
    minWidth: 140,
    backgroundColor: '#FDF5E6',
    borderRadius: borderRadius.small,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D2B48C',
  },
  roleCardDesktop: {
    width: '30%',
    minWidth: 200,
  },
  randomCard: {
    backgroundColor: '#FFF8DC',
    borderColor: '#DAA520',
  },
  roleCardImage: { width: 100, height: 100, marginBottom: spacing.s },
  roleIcon: { fontSize: 32, marginBottom: spacing.s },
  roleName: { fontFamily: theme.fonts.bold, fontSize: fonts.medium, color: '#333', marginBottom: 4 },
  roleDesc: { fontFamily: theme.fonts.main, fontSize: fonts.tiny, color: '#666', textAlign: 'center' },
  backButton: { width: '100%', maxWidth: 300 },

  // Join Screen
  label: { color: '#8B4513', marginBottom: spacing.xs, fontFamily: theme.fonts.bold },
  selectedRoleBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: spacing.s,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    marginBottom: spacing.m,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCC'
  },
  selectedRoleText: { fontSize: fonts.medium, fontFamily: theme.fonts.bold, color: theme.colors.primary },
  inputGroup: { width: '100%', marginBottom: spacing.m },
  // Custom Input Styles
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: borderRadius.small,
    padding: spacing.m,
    fontFamily: theme.fonts.main,
    fontSize: fonts.medium,
    width: '100%',
    textAlign: 'right' // Arabic support
  },
  infoBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: spacing.s,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: '#DAA520',
    marginBottom: spacing.m
  },
  infoText: { color: '#DAA520', fontSize: fonts.small, textAlign: 'center' },
  buttonGroup: { width: '100%', gap: spacing.s }
});
