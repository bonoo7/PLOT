import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * useEntranceAnimation — mount entrance animation hook
 * Slides element in from below while fading in.
 *
 * Usage:
 *   const entranceStyle = useEntranceAnimation({ delay: 100 });
 *   <Animated.View style={[styles.card, entranceStyle]}>
 *
 * Options:
 *   delay      — ms before animation starts (for stagger effects)
 *   duration   — total animation duration in ms (default 350)
 *   distance   — translateY start distance (default 30)
 *   autoPlay   — start on mount (default true)
 */
export function useEntranceAnimation({
    delay = 0,
    duration = 350,
    distance = 30,
    autoPlay = true,
} = {}) {
    const translateY = useRef(new Animated.Value(distance)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!autoPlay) return;

        const animation = Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
            }),
        ]);

        animation.start();

        return () => animation.stop();
    }, [delay, duration, distance, autoPlay]);

    return {
        opacity,
        transform: [{ translateY }],
    };
}

/**
 * useStaggeredEntrance — helper for lists where each item enters with a delay.
 *
 * Usage:
 *   const getItemStyle = useStaggeredEntrance({ count: items.length, stagger: 60 });
 *   items.map((item, i) => (
 *     <Animated.View style={getItemStyle(i)}>
 *   ))
 */
export function useStaggeredEntrance({ count = 5, stagger = 60, duration = 350, distance = 30 } = {}) {
    const animations = useRef(
        Array.from({ length: count }, () => ({
            translateY: new Animated.Value(distance),
            opacity: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        const anims = animations.slice(0, count).map((anim, i) =>
            Animated.parallel([
                Animated.timing(anim.translateY, {
                    toValue: 0,
                    duration,
                    delay: i * stagger,
                    useNativeDriver: true,
                }),
                Animated.timing(anim.opacity, {
                    toValue: 1,
                    duration,
                    delay: i * stagger,
                    useNativeDriver: true,
                }),
            ])
        );

        const sequence = Animated.parallel(anims);
        sequence.start();

        return () => sequence.stop();
    }, [count, stagger, duration]);

    return (index) => {
        const anim = animations[index] || animations[animations.length - 1];
        return {
            opacity: anim.opacity,
            transform: [{ translateY: anim.translateY }],
        };
    };
}

export default useEntranceAnimation;
