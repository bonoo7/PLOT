import React from 'react';
import { View, Text, StyleSheet, Image, Platform, ScrollView, ImageBackground } from 'react-native';

const THEME = {
    colors: {
        background: '#F5F5DC', // Beige / Old Paper
        text: '#2F4F4F',       // Charcoal
        accentRed: '#B22222',  // Stamp Red
        accentYellow: '#E1AD01', // Post-it Yellow
        folderTab: '#E8E4C9',  // Slightly darker beige for variation
        shadow: 'rgba(0,0,0,0.2)'
    },
    fonts: {
        // Courier New is standard for typewriter feel. 
        // On Android 'monospace' is the safe fallback.
        main: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        heading: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // Should ideally be a rougher font
    }
};

const GlobalLayout = ({ children, title, showStamp = false, stampText = "سري للغاية" }) => {
    return (
        <View style={styles.container}>
            {/* Background Texture (Optional: could be an image) */}
            <View style={styles.backgroundTexture} />

            {/* Main Folder Container */}
            <ImageBackground
                source={require('../../assets/bg_paper.png')}
                style={styles.folderContainer}
                imageStyle={{ opacity: 0.8 }}
                resizeMode="cover"
            >
                {/* Light Overlay for better text contrast */}
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />

                {/* Folder Tab (Visual element) */}
                <View style={styles.folderTab}>
                    <Text style={styles.tabText}>P.L.O.T - CASE FILE #892</Text>
                </View>

                {/* Paper Content Area */}
                <View style={styles.paperContent}>

                    {/* Header Area */}
                    <View style={styles.header}>
                        <View style={styles.headerLine} />
                        <Text style={styles.headerTitle}>{title || "ملف العملية"}</Text>
                        <View style={styles.headerLine} />
                    </View>

                    {/* Optional Stamp */}
                    {showStamp && (
                        <View style={styles.stampContainer}>
                            <View style={styles.stampBox}>
                                <Text style={styles.stampText}>{stampText}</Text>
                            </View>
                        </View>
                    )}

                    {/* Main Content */}
                    <View style={styles.contentBody}>
                        {children}
                    </View>

                    {/* Footer / Watermark */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>وكالة المخابرات المركزية - قسم التحقيقات الخاصة</Text>
                    </View>
                </View>
            </ImageBackground>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2b2b2b', // Dark desk background behind the folder
        alignItems: 'center',
        justifyContent: 'center',
        padding: Platform.OS === 'web' ? 20 : 10,
    },
    backgroundTexture: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#333', // Fallback
        opacity: 0.1,
    },
    folderContainer: {
        width: '100%',
        maxWidth: 800, // Limit width for web/tablet
        flex: 1,
        backgroundColor: THEME.colors.background,
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#dcd8b8',
        elevation: 5,
    },
    folderTab: {
        backgroundColor: THEME.colors.folderTab,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        flexDirection: 'row-reverse', // Arabic alignment
    },
    tabText: {
        fontFamily: THEME.fonts.main,
        fontSize: 12,
        color: '#888',
        letterSpacing: 1,
    },
    paperContent: {
        flex: 1,
        padding: 20,
        // Add subtle paper grain if possible via image background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'center',
    },
    headerLine: {
        height: 2,
        backgroundColor: THEME.colors.text,
        flex: 1,
        opacity: 0.5,
    },
    headerTitle: {
        fontFamily: THEME.fonts.heading,
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginHorizontal: 15,
        textTransform: 'uppercase',
    },
    stampContainer: {
        position: 'absolute',
        top: 10,
        left: 20,
        transform: [{ rotate: '-15deg' }],
        zIndex: 10,
        opacity: 0.8,
    },
    stampBox: {
        borderWidth: 4,
        borderColor: THEME.colors.accentRed,
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    stampText: {
        color: THEME.colors.accentRed,
        fontFamily: THEME.fonts.heading,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    contentBody: {
        flex: 1,
    },
    footer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(47, 79, 79, 0.2)', // Charcoal text low opacity
        paddingTop: 10,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: THEME.fonts.main,
        fontSize: 10,
        color: THEME.colors.text,
        opacity: 0.6,
    }
});

export default GlobalLayout;
