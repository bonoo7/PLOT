/**
 * CaseHeader.js — TOP ZONE content for V2.
 * Shows context-relevant persistent info (room code, role, phase).
 *
 * Props:
 *   mode        'host' | 'player' | 'neutral'
 *   roomCode    string
 *   phase       string  (e.g. "مرحلة الكتابة")
 *   round       string  (e.g. "جولة 2/3")
 *   roleName    string  (player's role name)
 *   roleEmoji   string  (role emoji)
 *   playerId    string  (shown small, tap → onIdPress)
 *   onIdPress   fn
 *   title       string  (for neutral / entry screens)
 *   subtitle    string
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, fontSize, fontFamily, radius } from '../tokens';

const CaseHeader = ({
  mode = 'neutral',
  roomCode,
  phase,
  round,
  roleName,
  roleEmoji,
  playerId,
  onIdPress,
  title,
  subtitle,
  extra,       // extra element rendered in the right zone
}) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const setThemeMode = useGameStore(s => s.setThemeMode);
  const c = getColors(themeMode);
  const roleData = useGameStore(s => s.roleData);
  const scenario = useGameStore(s => s.scenario);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Navigation for native refresh (navigate to root)
  let navigation;
  try { navigation = useNavigation(); } catch {}

  const handleRefresh = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.location.reload();
    } else {
      // Navigate to entry screen
      try { navigation?.reset({ index: 0, routes: [{ name: 'RoleSelect' }] }); } catch {}
    }
  };

  const handleToggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <View style={styles.row}>

      {/* Role Info Modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowRoleModal(false)}
        >
          <View style={[styles.modal, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: c.surface, borderBottomColor: c.divider }]}>
              <Text style={[styles.modalHeaderText, { color: c.textMuted }]}>◈ ملف الدور ◈</Text>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: sp.m }}>
              {/* Role name + emoji */}
              <View style={styles.modalRoleRow}>
                <Text style={styles.modalEmoji}>{roleData?.emoji || roleEmoji || '👤'}</Text>
                <View style={{ gap: sp.xxs }}>
                  <Text style={[styles.modalRoleName, { color: c.text }]}>
                    {roleData?.roleName || roleName || '—'}
                  </Text>
                  {roleData?.team ? (
                    <Text style={[styles.modalSectionLabel, { color: roleData.team === 'CRIME' ? c.red : c.green }]}>
                      {roleData.team === 'CRIME' ? '⚫ فريق الجريمة' : '⚪ فريق العدالة'}
                    </Text>
                  ) : null}
                </View>
              </View>
              {/* Description */}
              {roleData?.description ? (
                <View style={[styles.modalSection, { borderColor: c.border }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.textMuted }]}>الوصف</Text>
                  <Text style={[styles.modalSectionText, { color: c.text }]}>
                    {roleData.description}
                  </Text>
                </View>
              ) : null}
              {/* Goal */}
              {roleData?.goal ? (
                <View style={[styles.modalSection, { borderColor: c.blue }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.blue }]}>الهدف</Text>
                  <Text style={[styles.modalSectionText, { color: c.text }]}>{roleData.goal}</Text>
                </View>
              ) : null}
              {/* Secret info (roleData.info) */}
              {roleData?.info ? (
                <View style={[styles.modalSection, { borderColor: c.gold }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.gold }]}>معلومة سرية</Text>
                  <Text style={[styles.modalSectionText, { color: c.text }]}>{roleData.info}</Text>
                </View>
              ) : null}
              {/* العقل المدبر: أعضاء الفريق */}
              {roleData?.role === 'MASTERMIND' && roleData?.specialInfo?.crimeTeam ? (
                <View style={[styles.modalSection, { borderColor: c.red }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.red }]}>أعضاء فريق الجريمة</Text>
                  {roleData.specialInfo.crimeTeam.map((m, i) => (
                    <Text key={i} style={[styles.modalSectionText, { color: c.text }]}>
                      • {m.name} — {m.roleName || m.role}
                    </Text>
                  ))}
                </View>
              ) : null}
              {/* الوزير: المستفيد والمحقق */}
              {roleData?.role === 'MINISTER' && roleData?.specialInfo ? (
                <View style={[styles.modalSection, { borderColor: c.blue }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.blue }]}>معلومات سرية</Text>
                  {roleData.specialInfo.detective ? (
                    <Text style={[styles.modalSectionText, { color: c.text }]}>🕵️ المحقق: {roleData.specialInfo.detective.name}</Text>
                  ) : null}
                  {roleData.specialInfo.beneficiary ? (
                    <Text style={[styles.modalSectionText, { color: c.text }]}>💰 المستفيد: {roleData.specialInfo.beneficiary.name}</Text>
                  ) : null}
                </View>
              ) : null}
              {/* الشاهد: الكلمات المفتاحية */}
              {roleData?.role === 'WITNESS' && roleData?.specialInfo?.keywords ? (
                <View style={[styles.modalSection, { borderColor: c.gold }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.gold }]}>الكلمات المفتاحية</Text>
                  <Text style={[styles.modalSectionText, { color: c.text }]}>{roleData.specialInfo.keywords.join(' — ')}</Text>
                </View>
              ) : null}
              {/* Secret hint */}
              {roleData?.secretHint ? (
                <View style={[styles.modalSection, { borderColor: c.gold, backgroundColor: c.surfaceAlt }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.gold }]}>🔑 تلميح سري</Text>
                  <Text style={[styles.modalSectionText, { color: c.text }]}>{roleData.secretHint}</Text>
                </View>
              ) : null}
              {/* المحقق: نتيجة التحقيق */}
              {roleData?.role === 'DETECTIVE' && roleData?.abilityResult ? (
                <View style={[styles.modalSection, {
                  borderColor: roleData.abilityResult.isPending
                    ? c.border
                    : roleData.abilityResult.isSabotaged ? c.red : c.green
                }]}>
                  <Text style={[styles.modalSectionLabel, {
                    color: roleData.abilityResult.isPending
                      ? c.textMuted
                      : roleData.abilityResult.isSabotaged ? c.red : c.green
                  }]}>
                    🕵️ نتيجة التحقيق {
                      roleData.abilityResult.isPending
                        ? '⏳ (قيد المعالجة)'
                        : roleData.abilityResult.isSabotaged ? '⚠️ (ملفقة)' : '✓'
                    }
                  </Text>
                  {roleData.abilityResult.targetName ? (
                    <Text style={[styles.modalSectionText, { color: c.text }]}>
                      🎯 الهدف: {roleData.abilityResult.targetName}
                    </Text>
                  ) : null}
                  {!roleData.abilityResult.isPending ? (
                    <Text style={[styles.modalSectionText, {
                      color: roleData.abilityResult.isSabotaged ? c.red : c.green,
                      fontWeight: '700'
                    }]}>
                      النتيجة: {roleData.abilityResult.result || '—'}
                    </Text>
                  ) : (
                    <Text style={[styles.modalSectionText, { color: c.textMuted, fontStyle: 'italic' }]}>
                      ستظهر النتيجة بعد مرحلة التصويت
                    </Text>
                  )}
                </View>
              ) : null}
              {/* المخرب: الهدف المُخرَّب */}
              {roleData?.role === 'SABOTEUR' && roleData?.abilityResult ? (
                <View style={[styles.modalSection, { borderColor: c.red }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.red }]}>🧨 هدف التضليل</Text>
                  {roleData.abilityResult.targetName ? (
                    <Text style={[styles.modalSectionText, { color: c.text }]}>اللاعب: {roleData.abilityResult.targetName}</Text>
                  ) : null}
                  {roleData.abilityResult.message ? (
                    <Text style={[styles.modalSectionText, { color: c.text }]}>{roleData.abilityResult.message}</Text>
                  ) : null}
                </View>
              ) : null}
              {/* المستفيد: العروض المُرسلة */}
              {roleData?.role === 'BENEFICIARY' && roleData?.offersSent?.length > 0 ? (
                <View style={[styles.modalSection, { borderColor: c.gold }]}>
                  <Text style={[styles.modalSectionLabel, { color: c.gold }]}>💰 العروض المُرسلة</Text>
                  {roleData.offersSent.map((offer, i) => (
                    <Text key={i} style={[styles.modalSectionText, { color: c.text }]}>
                      • {offer.targetName}: {offer.amount} نقطة
                    </Text>
                  ))}
                </View>
              ) : null}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { borderTopColor: c.divider }]}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: c.textMuted }]}>— إغلاق —</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── LEFT / Main Info ── */}
      <View style={styles.left}>
        {mode === 'host' && (
          <>
            {roomCode ? (
              <View style={[styles.codePill, { backgroundColor: c.red }]}>
                <Text style={[styles.codeText, { color: '#FFF' }]}>{roomCode}</Text>
              </View>
            ) : null}
            {phase ? <Text style={[styles.phase, { color: c.text }]}>{phase}</Text> : null}
          </>
        )}

        {mode === 'player' && (
          <>
            {roleEmoji || roleName ? (
              <TouchableOpacity
                style={styles.roleRow}
                onPress={() => setShowRoleModal(true)}
                activeOpacity={0.7}
              >
                {roleEmoji ? <Text style={styles.roleEmoji}>{roleEmoji}</Text> : null}
                {roleName  ? <Text style={[styles.roleName, { color: c.text }]}>{roleName}</Text> : null}
                <Text style={[styles.roleTapHint, { color: c.textMuted }]}>ℹ</Text>
              </TouchableOpacity>
            ) : null}
            {scenario ? (
              <Text style={[styles.caseName, { color: c.textMuted }]} numberOfLines={1}>📁 {scenario}</Text>
            ) : null}
          </>
        )}

        {mode === 'neutral' && title ? (
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        ) : null}

        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>

      {/* ── RIGHT / Secondary Info + Utility Buttons ── */}
      <View style={styles.right}>
        {mode === 'host' && round ? (
          <View style={[styles.pill, { borderColor: c.border }]}>
            <Text style={[styles.pillText, { color: c.textSub }]}>{round}</Text>
          </View>
        ) : null}

        {mode === 'player' && playerId ? (
          <TouchableOpacity
            onPress={onIdPress}
            style={[styles.pill, styles.idPill, { borderColor: c.gold }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, { color: c.gold }]}>#{playerId}</Text>
          </TouchableOpacity>
        ) : null}

        {mode === 'neutral' && roomCode ? (
          <View style={[styles.codePill, { backgroundColor: c.red }]}>
            <Text style={[styles.codeText, { color: '#FFF' }]}>{roomCode}</Text>
          </View>
        ) : null}
        {extra ? extra : null}

        {/* ── Utility Buttons (always visible) ── */}
        <View style={styles.utilRow}>
          <TouchableOpacity
            style={[styles.utilBtn, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}
            onPress={handleToggleTheme}
            activeOpacity={0.7}
          >
            <Text style={styles.utilIcon}>{themeMode === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.utilBtn, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.utilIcon}>↺</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.m,
  },
  left: {
    flex: 1,
    gap: sp.xxs,
  },
  right: {
    alignItems: 'flex-end',
    gap: sp.xxs,
  },
  codePill: {
    paddingHorizontal: sp.m,
    paddingVertical: sp.xxs + 1,
    borderRadius: radius.s,
    alignSelf: 'flex-start',
  },
  codeText: {
    fontSize: fontSize.heading,
    fontFamily: fontFamily.mono,
    fontWeight: '900',
    letterSpacing: 2,
  },
  phase: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.xs,
  },
  roleEmoji: {
    fontSize: fontSize.heading,
  },
  roleName: {
    fontSize: fontSize.medium,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  title: {
    fontSize: fontSize.title,
    fontFamily: fontFamily.mono,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
  },
  pill: {
    borderWidth: 1,
    borderRadius: radius.s,
    paddingHorizontal: sp.s,
    paddingVertical: sp.xxs,
  },
  roleTapHint: {
    fontSize: fontSize.label,
    marginLeft: sp.xxs,
    opacity: 0.6,
  },
  caseName: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp.xl,
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1.5,
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: sp.s,
    paddingHorizontal: sp.m,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  modalHeaderText: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  modalBody: {
    maxHeight: 320,
    padding: sp.m,
  },
  modalRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.m,
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 32,
  },
  modalRoleName: {
    fontSize: fontSize.title,
    fontFamily: fontFamily.mono,
    fontWeight: '900',
  },
  modalSection: {
    borderWidth: 1,
    borderRadius: radius.s,
    padding: sp.m,
    gap: sp.xs,
  },
  modalSectionLabel: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalSectionText: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    lineHeight: fontSize.body * 1.6,
    textAlign: 'right',
  },
  modalClose: {
    borderTopWidth: 1,
    paddingVertical: sp.m,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
    letterSpacing: 2,
  },
  pillText: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  utilRow: {
    flexDirection: 'row',
    gap: sp.xs,
    marginTop: sp.xxs,
  },
  utilBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.s,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilIcon: {
    fontSize: 13,
    lineHeight: 16,
  },
});

export default CaseHeader;
