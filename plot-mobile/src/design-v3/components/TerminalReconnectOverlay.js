import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, fontFamily, fontSize } from '../tokens';
import ScanLines from './ScanLines';
import BlinkCursor from './BlinkCursor';

export default function TerminalReconnectOverlay() {
  const reconnecting = useGameStore((s) => s.reconnecting);
  const c = getColors();

  // Internal state to track if we should show the boot screen
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isSynced, setIsSynced] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // We keep track of reconnection lifecycle
  useEffect(() => {
    if (reconnecting) {
      setIsSynced(false);
      setVisible(true);
      // Fade in the screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start appending boot steps
      setLogs(['[SYSTEM] INITIALIZING BOOT SEQUENCE...']);

      const t1 = setTimeout(() => {
        setLogs((prev) => [...prev, '[SYSTEM] BOOTING SYSTEM CLIENT V3.7...']);
      }, 3000 * 0.1);

      const t2 = setTimeout(() => {
        setLogs((prev) => [...prev, '[SYSTEM] CONNECTING TO HOST PORT 3000...']);
      }, 3000 * 0.25);

      const t3 = setTimeout(() => {
        setLogs((prev) => [...prev, '>> NETWORK HANDSHAKE: SECURED']);
      }, 3000 * 0.4);

      const t4 = setTimeout(() => {
        setLogs((prev) => [...prev, '[SYSTEM] RECOVERING PLAYER DOSSIER STATE...']);
      }, 3000 * 0.6);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else {
      // Reconnected!
      if (visible) {
        setIsSynced(true);
        setLogs((prev) => [
          ...prev,
          '[SYSTEM] STATE RECOVERY COMPLETED -> DONE',
          '>> PLOT TERMINAL CORE: [READY]',
        ]);

        // Wait a bit, then fade out
        const fadeOutTimeout = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            setLogs([]);
          });
        }, 800);

        return () => clearTimeout(fadeOutTimeout);
      }
    }
  }, [reconnecting]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: c.bg, opacity: fadeAnim }]}>
      <ScanLines />
      <View style={styles.content}>
        {logs.map((log, idx) => (
          <Text key={idx} style={[styles.logText, { color: c.accentGreen }]}>
            {log}
          </Text>
        ))}
        <View style={styles.cursorRow}>
          <Text style={[styles.logText, { color: c.accentGreen }]}>▋</Text>
          <BlinkCursor />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  logText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    lineHeight: 28,
    textAlign: 'left',
    marginVertical: 2,
  },
  cursorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});
