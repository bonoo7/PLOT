import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useGameStore } from '../../store/useGameStore';

/**
 * شريط إشعار يظهر عند انقطاع الاتصال ومحاولة إعادة الاتصال
 */
export default function ReconnectBanner() {
    const reconnecting = useGameStore(s => s.reconnecting);
    if (!reconnecting) return null;

    return (
        <View style={styles.banner}>
            <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
            <Text style={styles.text}>جارٍ إعادة الاتصال...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#c0392b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    spinner: {
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Cairo-SemiBold',
        textAlign: 'center',
    },
});
