import React from 'react';
import { SafeAreaView, View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScanLines from './ScanLines';
import { getColors, sp, useLayout, zones } from '../tokens';

const TerminalLayout = ({ top, bottom, children, style, centerStyle }) => {
  const c = getColors();
  const { contentMaxW } = useLayout();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar style="light" hidden={Platform.OS !== 'web'} />
      <ScanLines />
      <View style={[styles.inner, { maxWidth: contentMaxW }]}> 
        {top ? <View style={[styles.topZone, { borderBottomColor: c.divider, minHeight: zones.topMin }]}>{top}</View> : null}
        <View style={[styles.centerZone, centerStyle, style]}>{children}</View>
        {bottom ? (
          <View
            style={[
              styles.bottomZone,
              {
                borderTopColor: c.divider,
                minHeight: zones.bottomMin,
                paddingBottom: Platform.OS === 'ios' ? 20 : sp.s,
              },
            ]}
          >
            {bottom}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    zIndex: 1,
  },
  topZone: {
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
    borderBottomWidth: 1,
  },
  centerZone: {
    flex: 1,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  bottomZone: {
    borderTopWidth: 1,
    paddingHorizontal: sp.m,
    paddingTop: sp.s,
  },
});

export default TerminalLayout;
