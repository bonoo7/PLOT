import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { ROUTES } from '../../hooks/useGameSocket';
import {
    MinimalLayout,
    MinimalHeader,
    MinimalCard,
    MinimalButton,
    MinimalBadge,
} from '../../components/minimal';
import { theme } from '../../styles/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { gameScreenStyles as styles, getRoleEmoji } from './gameScreenStyles';

/**
 * GameScreen - شاشة الكشف عن الهوية السرية للاعب
 */
export const GameScreen = () => {
    const { isDesktop } = useResponsiveLayout();
    const navigation = useNavigation();
    const roleData = useGameStore((state) => state.roleData);
    const roomCode = useGameStore((state) => state.roomCode);

    if (!roleData) {
        return (
            <MinimalLayout>
                <Text style={styles.loadingText}>جاري استلام الملف السري...</Text>
            </MinimalLayout>
        );
    }

    const { role, roleName, description, info, specialInfo } = roleData;
    const emoji = getRoleEmoji(role);

    const handleReady = () => {
        navigation.navigate(ROUTES.WAITING);
    };

    const renderSpecialInfo = () => {
        if (!specialInfo && !info) return null;

        if (typeof info === 'string') return <Text style={styles.intelText}>{info}</Text>;
        if (typeof specialInfo === 'string') return <Text style={styles.intelText}>{specialInfo}</Text>;
        if (Array.isArray(specialInfo)) return <Text style={styles.intelText}>{specialInfo.join('\n')}</Text>;

        if (specialInfo?.type === 'MASTERMIND_INTEL') {
            return (
                <View>
                    <Text style={styles.intelTitle}>أعضاء فريق الجريمة:</Text>
                    {specialInfo.crimeTeam.map(p => (
                        <Text key={p.id} style={styles.intelText}>• {p.name} ({p.role})</Text>
                    ))}
                </View>
            );
        }
        if (specialInfo?.type === 'MINISTER_INTEL') {
            return (
                <View>
                    <Text style={styles.intelTitle}>معلومات سرية:</Text>
                    <Text style={styles.intelText}>• المستفيد: {specialInfo.beneficiary?.name || 'غير معروف'}</Text>
                    <Text style={styles.intelText}>• المحقق: {specialInfo.detective?.name || 'غير معروف'}</Text>
                </View>
            );
        }
        if (specialInfo?.type === 'WITNESS_INTEL') {
            return (
                <View>
                    <Text style={styles.intelTitle}>كلمات مفتاحية:</Text>
                    <Text style={styles.intelText}>{specialInfo.keywords.join(' - ')}</Text>
                </View>
            );
        }
        return <Text style={styles.intelText}>{JSON.stringify(specialInfo)}</Text>;
    };

    return (
        <MinimalLayout roleData={roleData} roomCode={roomCode} onRefresh={() => { }}>
            <View style={[styles.container, { maxWidth: isDesktop ? 900 : 600 }]}>

                {/* Top Section: Role Identity */}
                <View style={styles.identitySection}>
                    {theme.roleImages && theme.roleImages[role] ? (
                        <Image
                            source={theme.roleImages[role]}
                            style={styles.roleImageLarge}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.roleEmoji}>{emoji}</Text>
                    )}
                    <MinimalHeader title={roleName} subtitle="هويتك السرية" />
                </View>

                {/* Content Card */}
                <MinimalCard flex style={styles.dossierCard}>
                    <View style={styles.stampWrapper}>
                        <MinimalBadge text="TOP SECRET" variant="primary" />
                    </View>

                    <View style={styles.missionSection}>
                        <Text style={styles.label}>المهمة:</Text>
                        <Text style={styles.missionText}>{description}</Text>
                    </View>

                    <View style={styles.intelSection}>
                        <Text style={styles.label}>معلومات استخباراتية:</Text>
                        <View style={styles.intelBox}>
                            {renderSpecialInfo()}
                        </View>
                    </View>
                </MinimalCard>

                {/* Action Footer */}
                <View style={styles.footer}>
                    <MinimalButton
                        title="فهمت المهمة - ابدأ"
                        onPress={handleReady}
                        size="large"
                        style={styles.readyBtn}
                    />
                </View>

            </View>
        </MinimalLayout>
    );
};
