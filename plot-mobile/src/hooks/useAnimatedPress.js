import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

/**
 * useAnimatedPress — micro-interaction hook
 * Gives any pressable element a satisfying scale-down + spring-bounce feel.
 *
 * Usage:
 *   const { scaleAnim, pressHandlers } = useAnimatedPress();
 *   <Animated.View style={{ transform: [{ scale: scaleAnim }] }} {...pressHandlers}>
 */
export function useAnimatedPress({ pressedScale = 0.93, springConfig } = {}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const config = springConfig || {
        tension: 300,
        friction: 10,
        useNativeDriver: true,
    };

    const handlePressIn = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: pressedScale,
            tension: 400,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim, pressedScale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            ...config,
        }).start();
    }, [scaleAnim, config]);

    return {
        scaleAnim,
        pressHandlers: {
            onPressIn: handlePressIn,
            onPressOut: handlePressOut,
        },
    };
}

export default useAnimatedPress;
