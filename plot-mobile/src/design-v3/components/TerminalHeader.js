import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import GlitchText from './GlitchText';
import { buildAsciiBar, fontFamily, fontSize, getColors, sp } from '../tokens';
import { useGameStore } from '../../store/useGameStore';
import TerminalCard from './TerminalCard';
import TerminalButton from './TerminalButton';

const TerminalHeader = ({ title, subtitle, roomCode, playerName, roleName, roleEmoji, round, totalRounds, phase }) => {
  const c = getColors();
  const roleData = useGameStore((s) => s.roleData);
  const [showModal, setShowModal] = useState(false);

  const numericRound = typeof round === 'number' ? round : Number(String(round || '').split('/')[0]);
  const numericTotal = totalRounds || Number(String(round || '').split('/')[1]);
  const roundLabel = numericRound && numericTotal ? `${numericRound}/${numericTotal}` : typeof round === 'string' ? round : null;
  const roundBar = numericRound && numericTotal ? buildAsciiBar(numericRound, numericTotal, 8).text : null;
  const mainTitle = title || phase || roleName || 'SYSTEM';

  return (
    <View style={[styles.box, { borderColor: c.borderBright, backgroundColor: c.bgAlt }]}>
      <View style={styles.rowTop}>
        <Text style={[styles.brand, { color: c.accentGreen }]}>[PLOT]</Text>
        {roundBar ? <Text style={[styles.roundBar, { color: c.textMuted }]}>{roundBar}</Text> : <View style={{ flex: 1 }} />}
        {roundLabel ? <Text style={[styles.roundText, { color: c.accentCyan }]}>{`ROUND ${roundLabel}`}</Text> : null}
      </View>
      <View style={styles.rowMid}>
        <GlitchText text={`> ${mainTitle}`} glitch intensity="low" style={[styles.title, { color: c.textPrimary }]} />
        {roomCode ? <Text style={[styles.code, { color: c.accentGreen }]}>{`▶ ${roomCode} ◀`}</Text> : null}
      </View>
      {(subtitle || playerName || roleName) ? (
        <View style={styles.rowBottom}>
          <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={1}>{subtitle || playerName || ''}</Text>
          {(roleName || roleEmoji || roleData) ? (
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.roleBtn}>
              <Text style={[styles.role, { color: c.accentYellow }]}>
                {`${roleEmoji || roleData?.emoji || ''} ${roleName || roleData?.roleName || ''} 📁`.trim()}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Role Details Modal - Retro Terminal Style */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TerminalCard
              title="> PLAYER DOSSIER"
              tone={roleData?.team === 'CRIME' ? 'danger' : roleData?.team === 'NEUTRAL' ? 'warning' : 'success'}
            >
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ gap: sp.m }} showsVerticalScrollIndicator={false}>
                {/* Header Info */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalEmoji}>{roleData?.emoji || roleEmoji || '👤'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalRoleName, { color: c.textPrimary }]}>
                      {roleData?.roleName || roleName || 'UNKNOWN'}
                    </Text>
                    <Text
                      style={[
                        styles.modalTeam,
                        {
                          color:
                            roleData?.team === 'CRIME'
                              ? c.accentRed
                              : roleData?.team === 'NEUTRAL'
                              ? c.accentYellow
                              : c.accentGreen,
                        },
                      ]}
                    >
                      {roleData?.team === 'CRIME'
                        ? '[ CRIMINALS ALLIANCE ]'
                        : roleData?.team === 'NEUTRAL'
                        ? '[ NEUTRAL TARGET ]'
                        : '[ JUSTICE LEAGUE ]'}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {roleData?.description && (
                  <View style={[styles.section, { borderColor: c.border }]}>
                    <Text style={[styles.sectionLabel, { color: c.textMuted }]}>التعريف بالدور</Text>
                    <Text style={[styles.sectionText, { color: c.textPrimary }]}>{roleData.description}</Text>
                  </View>
                )}

                {/* Goal */}
                {roleData?.goal && (
                  <View style={[styles.section, { borderColor: c.border }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentCyan }]}>الهدف الاستراتيجي</Text>
                    <Text style={[styles.sectionText, { color: c.textPrimary }]}>{roleData.goal}</Text>
                  </View>
                )}

                {/* Secret Hint */}
                {roleData?.secretHint && (
                  <View style={[styles.section, { borderColor: c.accentRed }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentRed }]}>🔑 تلميح سري</Text>
                    <Text style={[styles.sectionText, { color: c.textPrimary }]}>{roleData.secretHint}</Text>
                  </View>
                )}

                {/* Secret Info / Intel */}
                {roleData?.info && (
                  <View style={[styles.section, { borderColor: c.accentYellow }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentYellow }]}>👁️ معلومة سرية</Text>
                    <Text style={[styles.sectionText, { color: c.textPrimary }]}>{roleData.info}</Text>
                  </View>
                )}

                {/* Crime Team Members */}
                {roleData?.specialInfo?.crimeTeam && (
                  <View style={[styles.section, { borderColor: c.accentRed }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentRed }]}>🎭 شركاء الجريمة</Text>
                    {roleData.specialInfo.crimeTeam.map((p, idx) => (
                      <Text key={idx} style={[styles.sectionText, { color: c.textPrimary }]}>
                        {`• ${p.name} ── ${p.roleName || p.role}`}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Minister / Seer intel */}
                {roleData?.specialInfo?.detective && (
                  <View style={[styles.section, { borderColor: c.accentCyan }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentCyan }]}>📡 تفاصيل المحقق والوزير</Text>
                    <Text style={[styles.sectionText, { color: c.textPrimary }]}>
                      🕵️ المحقق: {roleData.specialInfo.detective.name}
                    </Text>
                    {roleData.specialInfo.beneficiary && (
                      <Text style={[styles.sectionText, { color: c.textPrimary }]}>
                        💰 المستفيد: {roleData.specialInfo.beneficiary.name}
                      </Text>
                    )}
                  </View>
                )}

                {/* Witness keywords */}
                {roleData?.specialInfo?.keywords && (
                  <View style={[styles.section, { borderColor: c.accentYellow }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentYellow }]}>👁️ الكلمات المفتاحية</Text>
                    <Text style={[styles.sectionText, { color: c.accentGreen, fontWeight: 'bold' }]}>
                      {roleData.specialInfo.keywords.join('  ──  ')}
                    </Text>
                  </View>
                )}

                {/* Ability result (Detective / Saboteur result) */}
                {roleData?.abilityResult && (
                  <View style={[styles.section, { borderColor: c.accentGreen }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentGreen }]}>⚡ نتيجة القدرة المستخدمة</Text>
                    {roleData.role === 'DETECTIVE' ? (
                      <>
                        <Text style={[styles.sectionText, { color: c.textPrimary }]}>
                          تم التحقيق مع: {roleData.abilityResult.targetName}
                        </Text>
                        <Text style={[styles.sectionText, { color: c.accentYellow }]}>
                          النتيجة الحقيقية: {roleData.abilityResult.result}
                        </Text>
                        {roleData.abilityResult.isSabotaged && (
                          <Text style={[styles.sectionText, { color: c.accentRed }]}>
                            ⚠️ تحذير: قد تكون النتيجة ملفقة من قبل المخرب!
                          </Text>
                        )}
                      </>
                    ) : roleData.role === 'SABOTEUR' ? (
                      <>
                        <Text style={[styles.sectionText, { color: c.textPrimary }]}>
                          تم تضليل: {roleData.abilityResult.targetName}
                        </Text>
                        <Text style={[styles.sectionText, { color: c.textPrimary }]}>
                          {roleData.abilityResult.message}
                        </Text>
                      </>
                    ) : null}
                  </View>
                )}

                {/* Beneficiary offers sent */}
                {roleData?.offersSent && roleData.offersSent.length > 0 && (
                  <View style={[styles.section, { borderColor: c.accentYellow }]}>
                    <Text style={[styles.sectionLabel, { color: c.accentYellow }]}>💰 العروض المرسلة</Text>
                    {roleData.offersSent.map((off, idx) => (
                      <Text key={idx} style={[styles.sectionText, { color: c.textPrimary }]}>
                        {`• اللاعب: ${off.targetName} ── القيمة: ${off.amount} نقطة (${
                          off.accepted ? 'مقبول ✓' : off.refunded ? 'مسترجع ↺' : 'قيد الانتظار ⏳'
                        })`}
                      </Text>
                    ))}
                  </View>
                )}
              </ScrollView>

              <TerminalButton
                title="إغلاق الملف"
                onPress={() => setShowModal(false)}
                size="sm"
                style={{ marginTop: sp.s }}
              />
            </TerminalCard>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
    gap: sp.xs,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.s,
  },
  rowMid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.s,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.s,
  },
  brand: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
  },
  roundBar: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    writingDirection: 'ltr',
  },
  roundText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    fontWeight: '700',
  },
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    fontWeight: '700',
  },
  subtitle: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
  },
  roleBtn: {
    alignSelf: 'flex-end',
  },
  role: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,7,18,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp.l,
  },
  modalContainer: {
    maxWidth: 480,
    width: '100%',
    maxHeight: '85%',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.m,
    marginBottom: sp.s,
  },
  modalEmoji: {
    fontSize: 48,
  },
  modalRoleName: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
  },
  modalTeam: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    marginTop: 2,
  },
  section: {
    borderWidth: 1,
    padding: sp.s,
    marginTop: sp.xs,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  sectionLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  sectionText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.4,
    textAlign: 'right',
  },
});

export default TerminalHeader;
