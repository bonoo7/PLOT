import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, ScrollView, Pressable
} from 'react-native';
import Svg from 'react-native-svg';
import { Avatar } from './Avatar';
import {
    AVATAR_BOUNDS, avatarColors, getRandomAvatar,
    bases, eyes, eyebrows, hairs, hats, mouths, accessories
} from './AvatarLayers';
import MinimalButton from '../minimal/MinimalButton';
import { spacing, borderRadius, fonts } from '../../styles/responsive';
import { theme } from '../../styles/theme';

const THUMB_SIZE = 52;

// Renders a horizontal scrollable row of SVG thumbnails for a layer
const ThumbnailRow = ({ label, feature, layers, config, onSelect }) => (
    <View style={styles.section}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbScroll}
        >
            {layers.map((Layer, index) => {
                const isSelected = config[feature] === index;
                return (
                    <Pressable
                        key={index}
                        onPress={() => onSelect(feature, index)}
                        style={[styles.thumbBox, isSelected && styles.thumbBoxSelected]}
                    >
                        <Svg width={THUMB_SIZE} height={THUMB_SIZE} viewBox="0 0 100 100">
                            <Layer color={config.color || '#FFF8DC'} />
                        </Svg>
                        {isSelected && <View style={styles.selectedDot} />}
                    </Pressable>
                );
            })}
        </ScrollView>
    </View>
);

export const AvatarEditor = ({ visible, initialConfig, onSave, onCancel }) => {
    const [config, setConfig] = useState(initialConfig || getRandomAvatar());

    useEffect(() => {
        if (visible) setConfig(initialConfig || getRandomAvatar());
    }, [visible, initialConfig]);

    const handleSelect = (feature, index) => {
        setConfig(prev => ({ ...prev, [feature]: index }));
    };

    const handleRandomize = () => setConfig(getRandomAvatar());

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>اصنع شخصيتك</Text>
                        <TouchableOpacity style={styles.randomBtn} onPress={handleRandomize}>
                            <Text style={styles.randomBtnText}>🎲 عشوائي</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Avatar Preview */}
                    <View style={styles.previewContainer}>
                        <Avatar config={config} size={140} />
                    </View>

                    {/* Selectors */}
                    <ScrollView
                        style={styles.selectorsContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <ThumbnailRow label="الجسم" feature="base" layers={bases} config={config} onSelect={handleSelect} />
                        <ThumbnailRow label="العيون" feature="eyes" layers={eyes} config={config} onSelect={handleSelect} />
                        <ThumbnailRow label="الحواجب" feature="eyebrows" layers={eyebrows} config={config} onSelect={handleSelect} />
                        <ThumbnailRow label="الشعر" feature="hair" layers={hairs} config={config} onSelect={handleSelect} />
                        <ThumbnailRow label="القبعة" feature="hat" layers={hats} config={config} onSelect={handleSelect} />
                        <ThumbnailRow label="الفم" feature="mouth" layers={mouths} config={config} onSelect={handleSelect} />
                        <ThumbnailRow label="الإكسسوار" feature="accessory" layers={accessories} config={config} onSelect={handleSelect} />

                        {/* Color picker — grid of circles */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>لون البشرة</Text>
                            <View style={styles.colorGrid}>
                                {avatarColors.map((color, index) => {
                                    const isSelected = config.color === color;
                                    return (
                                        <Pressable
                                            key={index}
                                            onPress={() => setConfig(prev => ({ ...prev, color }))}
                                            style={[
                                                styles.colorCircle,
                                                { backgroundColor: color },
                                                isSelected && styles.colorCircleSelected
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <MinimalButton title="إلغاء" onPress={onCancel} variant="secondary" style={styles.actionBtn} />
                        <MinimalButton title="حفظ ✓" onPress={() => onSave(config)} style={styles.actionBtn} />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.m,
    },
    modalContent: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FDF5E6',
        borderRadius: borderRadius.large,
        padding: spacing.m,
        borderWidth: 2,
        borderColor: '#D2B48C',
        alignItems: 'center',
        maxHeight: '92%',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    title: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.large,
        color: theme.colors.text,
    },
    randomBtn: {
        backgroundColor: '#2C3E50',
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.small,
    },
    randomBtnText: {
        color: '#FFF',
        fontFamily: theme.fonts.main,
        fontSize: fonts.small,
    },
    previewContainer: {
        width: 150,
        height: 150,
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
        maxHeight: 320,
    },
    section: {
        marginBottom: spacing.s,
    },
    sectionLabel: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.small,
        color: '#555',
        marginBottom: 4,
        paddingHorizontal: 2,
    },
    thumbScroll: {
        gap: 6,
        paddingHorizontal: 2,
        paddingBottom: 4,
    },
    thumbBox: {
        width: THUMB_SIZE + 6,
        height: THUMB_SIZE + 6,
        borderRadius: borderRadius.small,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: 'rgba(210,180,140,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },
    thumbBoxSelected: {
        borderColor: '#F1C40F',
        backgroundColor: 'rgba(241,196,15,0.15)',
    },
    selectedDot: {
        position: 'absolute',
        bottom: 2,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F1C40F',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 2,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.15)',
    },
    colorCircleSelected: {
        borderColor: '#F1C40F',
        borderWidth: 3,
        transform: [{ scale: 1.15 }],
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
