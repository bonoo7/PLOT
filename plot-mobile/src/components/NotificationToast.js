import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGameStore } from '../store/useGameStore';

const TYPE_COLORS = {
    info:    { bg: '#1a3a5c', border: '#2d6a9f', text: '#a8d4f5' },
    warning: { bg: '#3d2e00', border: '#b8860b', text: '#ffd700' },
    error:   { bg: '#4a1a1a', border: '#c0392b', text: '#f5a5a5' },
};

const AUTO_DISMISS_MS = 3000;

export default function NotificationToast() {
    const notification = useGameStore(s => s.notification);
    const clearNotification = useGameStore(s => s.clearNotification);

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;
    const timerRef = useRef(null);

    useEffect(() => {
        if (notification) {
            // Animate in
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();

            // Auto dismiss
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                dismissToast();
            }, AUTO_DISMISS_MS);
        } else {
            opacity.setValue(0);
            translateY.setValue(-20);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [notification]);

    const dismissToast = () => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => clearNotification());
    };

    if (!notification) return null;

    const colors = TYPE_COLORS[notification.type] || TYPE_COLORS.info;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    opacity,
                    transform: [{ translateY }],
                }
            ]}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                style={styles.inner}
                onPress={dismissToast}
                activeOpacity={0.8}
            >
                {notification.title ? (
                    <Text style={[styles.title, { color: colors.text }]}>
                        {notification.title}
                    </Text>
                ) : null}
                {notification.message ? (
                    <Text style={[styles.message, { color: colors.text }]}>
                        {notification.message}
                    </Text>
                ) : null}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 16,
        left: 16,
        right: 16,
        borderWidth: 1,
        borderRadius: 10,
        zIndex: 9999,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    inner: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'right',
    },
    message: {
        fontSize: 12,
        textAlign: 'right',
        opacity: 0.9,
    },
});
