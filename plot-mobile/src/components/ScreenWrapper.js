import React from 'react';
import { View, StyleSheet, ImageBackground, SafeAreaView, Platform } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { getTheme } from '../constants/theme';

/**
 * ScreenWrapper - A unifying wrapper for all screens to handle themes and background images.
 */
export const ScreenWrapper = ({ children, style, forceTheme }) => {
    const storeTheme = useGameStore(state => state.themeMode);
    // Allow a screen to force a specific theme (e.g., Drafting is always dark)
    const themeMode = forceTheme || storeTheme;
    const t = getTheme(themeMode);

    // Background images
    const bgImage = themeMode === 'dark'
        ? require('../../assets/bg_dark_noir.png')
        : require('../../assets/bg_light_noir.png');

    return (
        <ImageBackground
            source={bgImage}
            style={[styles.background, { backgroundColor: t.background }]}
            resizeMode="cover"
        >
            <View style={[styles.overlay, { backgroundColor: themeMode === 'dark' ? 'rgba(26, 28, 41, 0.7)' : 'rgba(244, 235, 208, 0.5)' }]}>
                <SafeAreaView style={[styles.safeArea, style]}>
                    {children}
                </SafeAreaView>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        // Provide a semi-transparent overlay to ensure text remains readable over complex generated backgrounds
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0, // Basic Android notch handling
    }
});
