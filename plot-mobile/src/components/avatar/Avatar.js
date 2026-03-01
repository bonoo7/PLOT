import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg from 'react-native-svg';
import { bases, eyes, hairs, hats, mouths, accessories } from './AvatarLayers';

/**
 * Avatar Component - Displays the customizable SVG Avatar.
 * 
 * @param {Object} config { base, eyes, hair, mouth, color }
 * @param {number} size Size of the avatar (width & height)
 * @param {boolean} isSpeaking True to enable jiggle animation
 * @param {boolean} disableAnimation True to turn off breathing/blinking
 */
export const Avatar = ({ config, size = 60, isSpeaking = false, disableAnimation = false, style }) => {
    // Use Animated for simplicity if reanimated is not strictly required.
    const breatheAnim = useRef(new Animated.Value(0)).current;
    const speakAnim = useRef(new Animated.Value(0)).current;
    const blinkAnim = useRef(new Animated.Value(1)).current;

    // 1. Breathing Animation (slow up/down & scale)
    useEffect(() => {
        if (disableAnimation) return;

        Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin)
                }),
                Animated.timing(breatheAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin)
                })
            ])
        ).start();
    }, [disableAnimation]);

    // 2. Blinking Animation (Random intervals)
    useEffect(() => {
        if (disableAnimation) return;

        let timeout;
        const blink = () => {
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start(() => {
                // Next blink between 3 to 7 seconds
                const nextBlink = Math.random() * 4000 + 3000;
                timeout = setTimeout(blink, nextBlink);
            });
        };

        timeout = setTimeout(blink, 2000);
        return () => clearTimeout(timeout);
    }, [disableAnimation]);

    // 3. Speaking Jiggle Animation
    useEffect(() => {
        if (disableAnimation) return;

        if (isSpeaking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(speakAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
                    Animated.timing(speakAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
                    Animated.timing(speakAnim, { toValue: -3, duration: 100, useNativeDriver: true }),
                    Animated.timing(speakAnim, { toValue: 3, duration: 100, useNativeDriver: true }),
                    Animated.timing(speakAnim, { toValue: 0, duration: 150, useNativeDriver: true })
                ])
            ).start();
        } else {
            speakAnim.setValue(0);
            speakAnim.stopAnimation();
        }
    }, [isSpeaking, disableAnimation]);

    // Interpolations
    const breatheScaleY = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.03]
    });

    const breatheTranslateY = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -2]
    });

    const speakRotate = speakAnim.interpolate({
        inputRange: [-5, 5],
        outputRange: ['-5deg', '5deg']
    });

    // Render Parts
    const BasePart = bases[config?.base] || bases[0];
    const EyesPart = eyes[config?.eyes] || eyes[0];
    const HairPart = hairs[config?.hair] || hairs[0];
    const HatPart = hats[config?.hat] || hats[0];
    const MouthPart = mouths[config?.mouth] || mouths[0];
    const AccessoryPart = accessories[config?.accessory] || accessories[0];
    const color = config?.color || '#FFF8DC';

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Animated.View style={[
                StyleSheet.absoluteFill,
                {
                    transform: [
                        { translateY: breatheTranslateY },
                        { scaleY: breatheScaleY },
                        { rotate: isSpeaking ? speakRotate : '0deg' }
                    ]
                }
            ]}>
                <Svg width="100%" height="100%" viewBox="0 0 100 100">
                    <BasePart color={color} />
                    <HairPart />
                    <HatPart />
                    <MouthPart />
                    <AccessoryPart />
                </Svg>

                {/* Since React Native SVG doesn't support Animated wrapper inside SVG directly easily, 
            we wrap eyes in a separate SVG layer to apply standard Animated transforms. */}
                <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: blinkAnim }] }]}>
                    <Svg width="100%" height="100%" viewBox="0 0 100 100">
                        <EyesPart />
                    </Svg>
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible'
    }
});
