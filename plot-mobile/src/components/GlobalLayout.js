import { View, Text, StyleSheet, Image, Platform, ImageBackground, useWindowDimensions, StatusBar } from 'react-native';
import { theme } from '../styles/theme';

const GlobalLayout = ({ children, title, showStamp = false, stampText = "سري للغاية" }) => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const isWeb = Platform.OS === 'web';

    // Dynamic Sizing
    const maxFolderWidth = isWeb ? 1000 : 90; // Web: reduced width, Mobile: 90%
    const folderHeight = isWeb ? '85%' : '85%'; // Reduced height for all modes

    return (
        <View style={styles.container}>
            {/* Hide Status Bar on Mobile for Full Screen effect */}
            {!isWeb && <StatusBar hidden />}

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
                        // Web: Fixed max. Mobile Landscape: 80% (wide enough). Mobile Portrait: 85% (show bg).
                        maxWidth: isWeb ? maxFolderWidth : (isLandscape ? '80%' : '85%'),
                        // Web/Landscape: 85% height. Portrait: 80% to show desk top/bottom.
                        height: isLandscape ? '85%' : (isWeb ? '90%' : '75%'),
                        paddingHorizontal: isWeb ? 0 : 5
                    }
                ]}>
                    {/* Folder Tab */}
                    <View style={[styles.folderTab, { width: isLandscape ? 250 : 180, marginBottom: -2 }]}>
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
                        <View style={[styles.header, { marginBottom: isLandscape ? 15 : 10 }]}>
                            <View style={styles.headerLine} />
                            <Text style={[
                                styles.headerTitle,
                                { fontSize: isWeb ? 32 : (isLandscape ? 22 : 18) }
                            ]}>{title || "ملف العملية"}</Text>
                            <View style={styles.headerLine} />
                        </View>

                        {/* Optional Stamp */}
                        {showStamp && (
                            <View style={[
                                styles.stampContainer,
                                {
                                    width: isWeb ? 120 : 100,
                                    height: isWeb ? 80 : 60,
                                    left: isWeb ? 40 : 20
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
        backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker
    },
    folderWrapper: {
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
    },
    folderTab: {
        backgroundColor: '#d6c68b',
        height: 30,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        marginLeft: '5%', // Relative margin
        justifyContent: 'center',
        paddingHorizontal: 15,
        zIndex: 1,
        marginBottom: -1,
    },
    tabText: {
        fontFamily: theme.fonts.main,
        fontSize: 10,
        color: '#5c5236',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    folderContainer: {
        flex: 1,
        width: '100%',
        padding: 12,
        overflow: 'hidden',
        borderRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        justifyContent: 'center',
    },
    headerLine: {
        height: 2,
        backgroundColor: '#2F4F4F',
        flex: 1,
        opacity: 0.6,
    },
    headerTitle: {
        fontFamily: theme.fonts.heading,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginHorizontal: 10,
        textTransform: 'uppercase',
    },
    stampContainer: {
        position: 'absolute',
        top: 15,
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
        justifyContent: 'center', // ✅ Center vertically for menu
    },
    footer: {
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: 'rgba(47, 79, 79, 0.2)',
        paddingTop: 5,
        alignItems: 'center',
        marginBottom: 5,
    },
    footerText: {
        fontFamily: theme.fonts.main,
        fontSize: 8,
        color: '#555',
        opacity: 0.7,
        letterSpacing: 1,
    }
});

export default GlobalLayout;
