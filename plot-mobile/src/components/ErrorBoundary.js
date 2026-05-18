import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('💥 ErrorBoundary caught:', error, info.componentStack);
    }

    handleReset() {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <View style={styles.container}>
                <Text style={styles.emoji}>⚠️</Text>
                <Text style={styles.title}>حدث خطأ غير متوقع</Text>
                <Text style={styles.message}>
                    {__DEV__ ? String(this.state.error) : 'الرجاء إعادة تشغيل التطبيق'}
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => this.handleReset()}>
                    <Text style={styles.buttonText}>المحاولة مجدداً</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080D18',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        direction: 'rtl',
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        color: '#E8DDB5',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    },
    message: {
        color: '#8B7355',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    button: {
        borderWidth: 1,
        borderColor: '#E8DDB5',
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    buttonText: {
        color: '#E8DDB5',
        fontSize: 16,
        fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    },
});

export default ErrorBoundary;
