import { View, Text, StyleSheet, Image, Platform, ImageBackground, useWindowDimensions, StatusBar } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, isSmallScreen, getContainerPadding } from '../styles/responsive';

const GlobalLayout = ({ children, title, showStamp = false, stampText = "سري للغاية" }) => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const isWeb = Platform.OS === 'web';
    const isMobile = Platform.OS !== 'web';
    const isSmall = isSmallScreen();

    // Dynamic Sizing responsive
    const maxFolderWidth = isWeb ? 1000 : '95%';
    const folderHeight = isLandscape ? '85%' : (isWeb ? '90%' : '80%');
    const tabWidth = isSmall ? 150 : (isLandscape ? 250 : 180);
    const titleFontSize = isWeb ? fonts.title : (isLandscape ? fonts.xlarge : fonts.large);
    const stampSize = isWeb ? 120 : (isSmall ? 80 : 100);

    return (
        <View style={styles.container}>
            {/* Hide Status Bar on Mobile for Full Screen effect */}
            {isMobile && <StatusBar hidden />}

            {/* Main Desk Background */}
            <ImageBackground
                source={require('../../assets/desk_background_noir.png')}
                style={styles.deskBackground}
                resizeMode="cover"
            >
                {/* Dark Overlay for focus */}
                <View style={styles.darkOverlay} />

                {/* Main Folder File */}
                <View style={[
                    styles.folderWrapper,
                    {
                        maxWidth: maxFolderWidth,
                        height: folderHeight,
                        paddingHorizontal: isMobile ? spacing.xs : 0,
                    }
                ]}>
                    {/* Folder Tab */}
                    <View style={[styles.folderTab, { width: tabWidth, marginBottom: -2 }]}>
                        <Text style={styles.tabText}>CASE FILE #892</Text>
                    </View>

                    {/* Folder Paper Texture */}
                    <ImageBackground
                        source={require('../../assets/paper_texture_vintage.png')}
                        style={styles.folderContainer}
                        imageStyle={{ borderRadius: 4 }}
                        resizeMode="cover"
                    >
                        {/* Header Area */}
                        <View style={[styles.header, { marginBottom: spacing.m }]}>
                            <View style={styles.headerLine} />
                            <Text style={[
                                styles.headerTitle,
                                { fontSize: titleFontSize }
                            ]}>{title || "ملف العملية"}</Text>
                            <View style={styles.headerLine} />
                        </View>

                        {/* Optional Stamp */}
                        {showStamp && (
                            <View style={[
                                styles.stampContainer,
                                {
                                    width: stampSize,
                                    height: stampSize * 0.67,
                                    left: isWeb ? 40 : (isSmall ? 10 : 20)
                                }
                            ]}>
                                <Image
                                    source={require('../../assets/stamp_secret.png')}
                                    style={styles.stampImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}

                        {/* Main Content - Centered */}
                        <View style={styles.contentBody}>
                            {children}
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>CONFIDENTIAL - TOP SECRET</Text>
                        </View>
                    </ImageBackground>
                </View>
            </ImageBackground>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f0f',
    },
    deskBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    folderWrapper: {
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: moderateScale(10) },
        shadowOpacity: 0.6,
        shadowRadius: moderateScale(15),
        elevation: 10,
    },
    folderTab: {
        backgroundColor: '#d6c68b',
        height: moderateScale(30),
        borderTopLeftRadius: moderateScale(8),
        borderTopRightRadius: moderateScale(8),
        marginLeft: '5%',
        justifyContent: 'center',
        paddingHorizontal: spacing.m,
        zIndex: 1,
        marginBottom: -1,
    },
    tabText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.tiny,
        color: '#5c5236',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    folderContainer: {
        flex: 1,
        width: '100%',
        padding: spacing.m,
        overflow: 'hidden',
        borderRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        justifyContent: 'center',
        direction: 'rtl', // Explicit RTL
    },
    headerLine: {
        height: 2,
        backgroundColor: theme.colors.text,
        flex: 1,
        opacity: 0.6,
    },
    headerTitle: {
        fontFamily: theme.fonts.bold,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginHorizontal: spacing.m,
        textTransform: 'uppercase',
    },
    stampContainer: {
        position: 'absolute',
        top: spacing.m,
        transform: [{ rotate: '-15deg' }],
        zIndex: 10,
        opacity: 0.85,
    },
    stampImage: {
        width: '100%',
        height: '100%',
    },
    contentBody: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        marginTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: 'rgba(47, 79, 79, 0.2)',
        paddingTop: spacing.xs,
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    footerText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.tiny,
        color: '#555',
        opacity: 0.7,
        letterSpacing: 1,
    }
});

export default GlobalLayout;
