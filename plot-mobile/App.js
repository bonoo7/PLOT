import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Platform,
    I18nManager
} from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { registerRootComponent } from 'expo';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SocketProvider } from './src/hooks/useGameSocket';
import { theme } from './src/styles/theme';
import GlobalRTLWrapper from './src/components/GlobalRTLWrapper';

// Force RTL (Native early enforcement)
if (Platform.OS !== 'web') {
    try {
        I18nManager.forceRTL(true);
        I18nManager.allowRTL(true);
        // Hide Navigation Bar on Android
        if (Platform.OS === 'android') {
            NavigationBar.setVisibilityAsync("hidden");
            NavigationBar.setBehaviorAsync("overlay-swipe");

            const hideNavBar = async () => {
                try {
                    await NavigationBar.setVisibilityAsync("hidden");
                    await NavigationBar.setBehaviorAsync("overlay-swipe");
                } catch (e) {
                    console.warn('Could not hide nav bar on unmount/remount', e);
                }
            };

            const navBarListener = NavigationBar.addVisibilityListener(({ visibility }) => {
                if (visibility === 'visible') {
                    setTimeout(hideNavBar, 3000);
                }
            });
            // Will leak roughly 1 listener per app boot if not cleaned up, but safe at root.
        }
    } catch (e) {
        console.error('RTL/Nav config error:', e);
    }
}

export const navigationRef = createNavigationContainerRef();

const AppContent = () => {
    return (
        <SocketProvider navigationRef={navigationRef}>
            <NavigationContainer ref={navigationRef}>
                <AppNavigator />
            </NavigationContainer>
        </SocketProvider>
    );
};

export default function App() {
    return (
        <GlobalRTLWrapper>
            <View style={styles.container}>
                <AppContent />
            </View>
        </GlobalRTLWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
});

registerRootComponent(App);
