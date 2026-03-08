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
import { AppNavigatorV2 } from './src/design-v2/navigation/AppNavigatorV2';
import { useGameStore } from './src/store/useGameStore';
import { SocketProvider } from './src/hooks/useGameSocket';
import { theme } from './src/styles/theme';
import GlobalRTLWrapper from './src/components/GlobalRTLWrapper';
import NotificationToast from './src/components/NotificationToast';
import { initSounds } from './src/utils/soundManager';
import ReconnectBanner from './src/design-v2/components/ReconnectBanner';

// Force RTL (Native early enforcement)
if (Platform.OS !== 'web') {
    try {
        I18nManager.forceRTL(true);
        I18nManager.allowRTL(true);
        // Hide Navigation Bar on Android (initial setup — listener managed inside App component)
        if (Platform.OS === 'android') {
            NavigationBar.setVisibilityAsync("hidden");
            NavigationBar.setBehaviorAsync("overlay-swipe");
        }
    } catch (e) {
        console.error('RTL/Nav config error:', e);
    }
}

export const navigationRef = createNavigationContainerRef();

const AppContent = () => {
    const designVersion = useGameStore(s => s.designVersion);
    const ActiveNavigator = designVersion === 'v2' ? AppNavigatorV2 : AppNavigator;

    // إدارة NavigationBar listener مع cleanup لمنع تسرب الذاكرة
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const hideNavBar = async () => {
            try {
                await NavigationBar.setVisibilityAsync("hidden");
                await NavigationBar.setBehaviorAsync("overlay-swipe");
            } catch (e) {
                console.warn('Could not hide nav bar', e);
            }
        };

        const listener = NavigationBar.addVisibilityListener(({ visibility }) => {
            if (visibility === 'visible') {
                setTimeout(hideNavBar, 3000);
            }
        });

        return () => {
            listener?.remove?.();
        };
    }, []);

    // تهيئة مؤثرات الصوت عند تشغيل التطبيق
    useEffect(() => {
        initSounds();
    }, []);

    return (
        <SocketProvider navigationRef={navigationRef}>
            <ReconnectBanner />
            <NavigationContainer ref={navigationRef}>
                <ActiveNavigator />
            </NavigationContainer>
            <NotificationToast />
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
