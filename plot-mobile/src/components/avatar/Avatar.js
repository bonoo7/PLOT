import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg from 'react-native-svg';
import { bases, eyes, eyebrows, hairs, hats, mouths, accessories } from './AvatarLayers';

/**
 * Avatar Component - Displays the customizable SVG Avatar.
 *
 * @param {Object} config { base, eyes, eyebrows, hair, hat, mouth, accessory, color }
 * @param {number} size Size of the avatar (width & height)
 * @param {boolean} isSpeaking True to enable jiggle animation
 * @param {boolean} disableAnimation True to turn off breathing/blinking
 */
export const Avatar = ({ config, size = 60, isSpeaking = false, disableAnimation = false, style }) => {
    const breatheAnim = useRef(new Animated.Value(0)).current;
    const speakAnim = useRef(new Animated.Value(0)).current;
    const blinkAnim = useRef(new Animated.Value(1)).current;

    // 1. Breathing Animation
    useEffect(() => {
        if (disableAnimation) return;
        Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                Animated.timing(breatheAnim, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) })
            ])
        ).start();
    }, [disableAnimation]);

    // 2. Blinking Animation
    useEffect(() => {
        if (disableAnimation) return;
        let timeout;
        const blink = () => {
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start(() => {
                timeout = setTimeout(blink, Math.random() * 4000 + 3000);
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

    const breatheScaleY = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
    const breatheTranslateY = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
    const speakRotate = speakAnim.interpolate({ inputRange: [-5, 5], outputRange: ['-5deg', '5deg'] });

    // Resolve layers with safe fallbacks
    const BasePart = bases[config?.base ?? 0] || bases[0];
    const EyesPart = eyes[config?.eyes ?? 0] || eyes[0];
    const EyebrowsPart = eyebrows[config?.eyebrows ?? 1] || eyebrows[1];
    const HairPart = hairs[config?.hair ?? 0] || hairs[0];
    const HatPart = hats[config?.hat ?? 0] || hats[0];
    const MouthPart = mouths[config?.mouth ?? 0] || mouths[0];
    const AccessoryPart = accessories[config?.accessory ?? 0] || accessories[0];
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
                {/* Base layers: body, hair, hat, eyebrows, mouth, accessory */}
                <Svg width="100%" height="100%" viewBox="0 0 100 100">
                    <BasePart color={color} />
                    <HairPart />
                    <HatPart />
                    <EyebrowsPart />
                    <MouthPart />
                    <AccessoryPart />
                </Svg>

                {/* Eyes layer separate for blink animation */}
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
