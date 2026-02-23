import React, { useEffect } from 'react';
import { View, StyleSheet, I18nManager, Platform } from 'react-native';

/**
 * GlobalRTLWrapper
 * Wraps the entire app to enforce RTL layout direction.
 * Works on both Web and Native.
 */
const GlobalRTLWrapper = ({ children }) => {
  useEffect(() => {
    // Native RTL Enforcement
    if (Platform.OS !== 'web') {
      try {
        if (!I18nManager.isRTL) {
          I18nManager.forceRTL(true);
          I18nManager.allowRTL(true);
        }
      } catch (e) {
        console.error('RTL Error:', e);
      }
    } else {
      // Web RTL Enforcement
      try {
        document.dir = 'rtl';
        document.documentElement.setAttribute('dir', 'rtl');
        document.body.style.direction = 'rtl';
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GlobalRTLWrapper;
