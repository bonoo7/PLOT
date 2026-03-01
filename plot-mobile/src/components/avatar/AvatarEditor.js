import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Avatar } from './Avatar';
import { AVATAR_BOUNDS, avatarColors, getRandomAvatar } from './AvatarLayers';
import MinimalButton from '../minimal/MinimalButton';
import { spacing, borderRadius, fonts } from '../../styles/responsive';
import { theme } from '../../styles/theme';

export const AvatarEditor = ({ visible, initialConfig, onSave, onCancel }) => {
    const [config, setConfig] = useState(initialConfig || getRandomAvatar());

    // Reset config if modal becomes visible with new initialConfig
    useEffect(() => {
        if (visible) {
            setConfig(initialConfig || getRandomAvatar());
        }
    }, [visible, initialConfig]);

    const handleNext = (feature, max) => {
        setConfig(prev => ({ ...prev, [feature]: (prev[feature] + 1) % max }));
    };

    const handlePrev = (feature, max) => {
        setConfig(prev => ({ ...prev, [feature]: (prev[feature] - 1 + max) % max }));
    };

    const handleNextColor = () => {
        const currentIndex = avatarColors.indexOf(config.color);
        const nextIndex = (currentIndex + 1) % avatarColors.length;
        setConfig(prev => ({ ...prev, color: avatarColors[nextIndex] }));
    };

    const handlePrevColor = () => {
        const currentIndex = avatarColors.indexOf(config.color);
        const prevIndex = (currentIndex - 1 + avatarColors.length) % avatarColors.length;
        setConfig(prev => ({ ...prev, color: avatarColors[prevIndex] }));
    };

    const renderSelector = (label, feature, max) => (
        <View style={styles.selectorRow}>
            <Text style={styles.selectorLabel}>{label}</Text>
            <View style={styles.controls}>
                <TouchableOpacity style={styles.arrowButton} onPress={() => handlePrev(feature, max)}>
                    <Text style={styles.arrowText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.valueText}>{config[feature] + 1} / {max}</Text>
                <TouchableOpacity style={styles.arrowButton} onPress={() => handleNext(feature, max)}>
                    <Text style={styles.arrowText}>▶</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>اصنع شخصيتك</Text>

                    <View style={styles.previewContainer}>
                        <Avatar config={config} size={150} />
                    </View>

                    <ScrollView style={styles.selectorsContainer} showsVerticalScrollIndicator={false}>
                        {renderSelector('الجسم', 'base', AVATAR_BOUNDS.bases)}
                        {renderSelector('العيون', 'eyes', AVATAR_BOUNDS.eyes)}
                        {renderSelector('الشعر', 'hair', AVATAR_BOUNDS.hairs)}
                        {renderSelector('القبعة', 'hat', AVATAR_BOUNDS.hats)}
                        {renderSelector('الفم', 'mouth', AVATAR_BOUNDS.mouths)}
                        {renderSelector('الإكسسوار', 'accessory', AVATAR_BOUNDS.accessories)}

                        <View style={styles.selectorRow}>
                            <Text style={styles.selectorLabel}>لون البشرة</Text>
                            <View style={styles.controls}>
                                <TouchableOpacity style={styles.arrowButton} onPress={handlePrevColor}>
                                    <Text style={styles.arrowText}>◀</Text>
                                </TouchableOpacity>
                                <View style={[styles.colorPreview, { backgroundColor: config.color }]} />
                                <TouchableOpacity style={styles.arrowButton} onPress={handleNextColor}>
                                    <Text style={styles.arrowText}>▶</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.actions}>
                        <MinimalButton title="إلغاء" onPress={onCancel} variant="secondary" style={styles.actionBtn} />
                        <MinimalButton title="حفظ" onPress={() => onSave(config)} style={styles.actionBtn} />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.m,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FDF5E6',
        borderRadius: borderRadius.large,
        padding: spacing.l,
        borderWidth: 2,
        borderColor: '#D2B48C',
        alignItems: 'center',
    },
    title: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.large,
        color: theme.colors.text,
        marginBottom: spacing.m,
    },
    previewContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: borderRadius.medium,
        marginBottom: spacing.s,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    selectorsContainer: {
        width: '100%',
        maxHeight: 280,
    },
    selectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
        backgroundColor: 'rgba(210, 180, 140, 0.2)',
        borderRadius: borderRadius.small,
    },
    selectorLabel: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.medium,
        color: '#333',
        flex: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    arrowButton: {
        padding: spacing.xs,
        backgroundColor: '#000',
        borderRadius: borderRadius.small,
    },
    arrowText: {
        color: '#FFF',
        fontSize: fonts.medium,
    },
    valueText: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.medium,
        minWidth: 40,
        textAlign: 'center',
    },
    colorPreview: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#000',
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        marginTop: spacing.m,
        gap: spacing.m,
    },
    actionBtn: {
        flex: 1,
    }
});
