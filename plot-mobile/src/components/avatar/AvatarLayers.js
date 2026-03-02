import React from 'react';
import { G, Path, Circle, Rect, Ellipse, Line, Polygon } from 'react-native-svg';

// Color palettes: Realistic skin tones + Vibrant / Noir
export const avatarColors = [
    // Realistic skin tones
    '#FDDBB4', // Very Light
    '#FDF5E6', // Old Lace / Paper
    '#FFF8DC', // Cornsilk
    '#F5CBA7', // Light Peachy
    '#E59866', // Medium Warm
    '#CA6F1E', // Dark Warm
    '#784212', // Very Dark Brown
    // Pastels & Fun
    '#FFC0CB', // Pink
    '#FF69B4', // Hot Pink
    '#FFD700', // Gold / Bright Yellow
    '#ADFF2F', // Neon Green
    '#00FF7F', // Spring Green
    '#00BFFF', // Deep Sky Blue
    '#00CED1', // Dark Turquoise
    '#1E90FF', // Dodger Blue
    '#9370DB', // Medium Purple
    '#8A2BE2', // Blue Violet
    '#FF6347', // Tomato Red
    '#FF4500', // Orange Red
    // Noir
    '#A0522D', // Sienna Brown
    '#696969', // Dim Gray
    '#2C3E50', // Dark Slate (Very Noir)
];

// 1. Bases (Faces/Bodies)
export const bases = [
    // 0: Toast / Soft Square
    ({ color }) => (
        <Path d="M20,30 Q20,10 50,10 Q80,10 80,30 L85,80 Q85,95 50,95 Q15,95 15,80 Z" fill={color} stroke="#111" strokeWidth="3" />
    ),
    // 1: Egg / Bean shape
    ({ color }) => (
        <Path d="M50,10 C80,10 90,60 75,90 C60,105 40,105 25,90 C10,60 20,10 50,10 Z" fill={color} stroke="#111" strokeWidth="3" />
    ),
    // 2: Onigiri / Triangle (softened peak)
    ({ color }) => (
        <Path d="M50,18 C63,18 82,68 83,84 C83,94 17,94 17,84 C17,68 37,18 50,18 Z" fill={color} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
    ),
    // 3: Mushroom Cap (Wide head)
    ({ color }) => (
        <Path d="M10,50 C10,10 90,10 90,50 Q90,95 50,95 Q10,95 10,50 Z" fill={color} stroke="#111" strokeWidth="3" />
    ),
    // 4: Pear / Blob (Bottom heavy - simplified)
    ({ color }) => (
        <Path d="M50,18 C35,18 22,30 22,50 C22,68 28,90 50,93 C72,90 78,68 78,50 C78,30 65,18 50,18 Z" fill={color} stroke="#111" strokeWidth="3" />
    ),
    // 5: Hexagon (Robot/Blocky style)
    ({ color }) => (
        <Path d="M50,10 L85,30 L85,70 L50,90 L15,70 L15,30 Z" fill={color} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
    ),
    // 6: Classic Round (Simple & clean)
    ({ color }) => (
        <Circle cx="50" cy="52" r="40" fill={color} stroke="#111" strokeWidth="3" />
    ),
    // 7: Cat Face (Triangle ears on round head)
    ({ color }) => (
        <G>
            <Circle cx="50" cy="55" r="38" fill={color} stroke="#111" strokeWidth="3" />
            <Path d="M18,28 L10,5 L35,22 Z" fill={color} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <Path d="M82,28 L90,5 L65,22 Z" fill={color} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <Path d="M20,22 L14,8 L30,20 Z" fill="#FFB6C1" />
            <Path d="M80,22 L86,8 L70,20 Z" fill="#FFB6C1" />
        </G>
    ),
    // 8: Ghost Blob (Wavy bottom)
    ({ color }) => (
        <Path d="M15,20 Q15,5 50,5 Q85,5 85,20 L85,75 Q78,85 70,78 Q62,70 55,78 Q50,85 45,78 Q38,70 30,78 Q22,85 15,75 Z" fill={color} stroke="#111" strokeWidth="3" />
    ),
];

// 2. Eyes
export const eyes = [
    // 0: Big Cute Anime Eyes
    () => (
        <G>
            <Ellipse cx="33" cy="45" rx="8" ry="12" fill="#111" />
            <Ellipse cx="67" cy="45" rx="8" ry="12" fill="#111" />
            <Circle cx="35" cy="40" r="3" fill="#FFF" />
            <Circle cx="69" cy="40" r="3" fill="#FFF" />
            <Circle cx="31" cy="49" r="1.5" fill="#FFF" />
            <Circle cx="65" cy="49" r="1.5" fill="#FFF" />
        </G>
    ),
    // 1: Derpy / Googly Eyes
    () => (
        <G>
            <Circle cx="30" cy="45" r="10" fill="#FFF" stroke="#111" strokeWidth="2.5" />
            <Circle cx="70" cy="45" r="10" fill="#FFF" stroke="#111" strokeWidth="2.5" />
            <Circle cx="26" cy="45" r="3" fill="#111" />
            <Circle cx="74" cy="43" r="3" fill="#111" />
        </G>
    ),
    // 2: Suspicious / Squinting (improved)
    () => (
        <G>
            <Path d="M22,47 C28,41 38,41 44,47 C38,44 28,44 22,47 Z" fill="#111" />
            <Path d="M56,47 C62,41 72,41 78,47 C72,44 62,44 56,47 Z" fill="#111" />
        </G>
    ),
    // 3: Detective Glasses (Big round specs)
    () => (
        <G stroke="#111" strokeWidth="3">
            <Circle cx="32" cy="45" r="13" fill="rgba(255,255,255,0.9)" />
            <Circle cx="68" cy="45" r="13" fill="rgba(255,255,255,0.9)" />
            <Path d="M45,45 L55,45" />
            <Path d="M25,40 Q32,35 38,40" stroke="#FFF" strokeWidth="2" fill="none" />
            <Path d="M61,40 Q68,35 74,40" stroke="#FFF" strokeWidth="2" fill="none" />
            <Circle cx="32" cy="45" r="2" fill="#111" stroke="none" />
            <Circle cx="68" cy="45" r="2" fill="#111" stroke="none" />
        </G>
    ),
    // 4: Tired / Bags under eyes
    () => (
        <G>
            <Path d="M25,45 Q33,40 41,45" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M59,45 Q67,40 75,45" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Circle cx="33" cy="48" r="4" fill="#111" />
            <Circle cx="67" cy="48" r="4" fill="#111" />
            <Path d="M25,52 Q33,56 41,52" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" />
            <Path d="M59,52 Q67,56 75,52" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" />
        </G>
    ),
    // 5: Hearts (Love) — fixed path
    () => (
        <G fill="#FF4B4B" stroke="#111" strokeWidth="1">
            <Path d="M33,50 C33,50 22,42 22,36 C22,31 27,28 33,33 C39,28 44,31 44,36 C44,42 33,50 33,50 Z" />
            <Path d="M67,50 C67,50 56,42 56,36 C56,31 61,28 67,33 C73,28 78,31 78,36 C78,42 67,50 67,50 Z" />
        </G>
    ),
    // 6: Dots (Classic minimalist)
    () => (
        <G fill="#111">
            <Circle cx="30" cy="45" r="3" />
            <Circle cx="70" cy="45" r="3" />
        </G>
    ),
    // 7: Star Eyes ✦
    () => (
        <G fill="#F1C40F" stroke="#111" strokeWidth="1">
            <Path d="M33,37 L35,43 L41,45 L35,47 L33,53 L31,47 L25,45 L31,43 Z" />
            <Path d="M67,37 L69,43 L75,45 L69,47 L67,53 L65,47 L59,45 L65,43 Z" />
        </G>
    ),
    // 8: Winking (one closed, one open)
    () => (
        <G>
            <Ellipse cx="33" cy="45" rx="8" ry="10" fill="#111" />
            <Circle cx="35" cy="41" r="3" fill="#FFF" />
            <Path d="M57,45 Q67,38 77,45" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
        </G>
    ),
    // 9: Sparkle Anime (large with shine)
    () => (
        <G>
            <Ellipse cx="32" cy="46" rx="10" ry="13" fill="#1A237E" />
            <Ellipse cx="68" cy="46" rx="10" ry="13" fill="#1A237E" />
            <Ellipse cx="32" cy="46" rx="7" ry="10" fill="#3949AB" />
            <Ellipse cx="68" cy="46" rx="7" ry="10" fill="#3949AB" />
            <Circle cx="36" cy="40" r="4" fill="#FFF" />
            <Circle cx="72" cy="40" r="4" fill="#FFF" />
            <Circle cx="30" cy="50" r="2" fill="#FFF" opacity="0.7" />
            <Circle cx="66" cy="50" r="2" fill="#FFF" opacity="0.7" />
        </G>
    ),
];

// 3. Hair (16 styles)
export const hairs = [
    // 0: None / Bald
    () => null,
    // 1: Messy Anime Spikes
    () => (
        <Path d="M15,35 Q10,15 25,10 Q30,0 45,5 Q55,-5 65,5 Q75,0 80,15 Q95,20 85,35 Q75,25 65,30 Q60,15 45,20 Q35,15 30,30 Q20,25 15,35 Z" fill="#34495E" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
    ),
    // 2: Pompadour (Elvis style)
    () => (
        <G>
            <Path d="M20,35 C20,5 75,-10 85,25 C75,5 35,15 20,35 Z" fill="#111" />
            <Path d="M20,35 C15,45 5,40 10,25" fill="#111" />
        </G>
    ),
    // 3: Floppy Bunny/Dog Ears
    () => (
        <G>
            <Path d="M25,20 C10,-10 -5,20 15,40 Z" fill="#FDF5E6" stroke="#111" strokeWidth="2.5" />
            <Path d="M75,20 C90,-10 105,20 85,40 Z" fill="#FDF5E6" stroke="#111" strokeWidth="2.5" />
            <Path d="M25,15 C15,0 5,20 15,35 Z" fill="#FFB6C1" />
            <Path d="M75,15 C85,0 95,20 85,35 Z" fill="#FFB6C1" />
        </G>
    ),
    // 4: Elegant Swoop (Fancy side sweep)
    () => (
        <Path d="M15,40 Q15,10 50,10 Q80,10 85,35 C70,15 40,20 15,40 Z" fill="#E67E22" stroke="#111" strokeWidth="2" />
    ),
    // 5: Curly Afro / Fluffy (enlarged to cover head)
    () => (
        <Path d="M12,45 C5,30 8,8 25,8 C30,0 45,-5 55,0 C65,-5 75,2 80,12 C95,10 98,32 90,45 C97,58 80,68 80,55 C88,70 65,72 68,55 C60,75 40,75 32,55 C35,72 12,70 20,55 C10,60 5,48 12,45 Z" fill="#6B3A2A" stroke="#111" strokeWidth="2.5" />
    ),
    // 6: Straight Long Bangs (fixed)
    () => (
        <G>
            <Path d="M14,50 L14,20 Q50,5 86,20 L86,50 Q80,30 50,28 Q20,30 14,50 Z" fill="#8E44AD" stroke="#111" strokeWidth="2" />
            <Path d="M14,50 L14,90 Q20,100 50,100 Q80,100 86,90 L86,50" fill="#8E44AD" stroke="none" />
        </G>
    ),
    // 7: High Ponytail
    () => (
        <G>
            <Path d="M20,30 Q20,8 50,8 Q80,8 80,30 Q75,20 50,18 Q25,20 20,30 Z" fill="#C0392B" stroke="#111" strokeWidth="2" />
            <Path d="M48,8 C46,0 40,-15 50,-20 C55,-15 55,-5 52,8 Z" fill="#C0392B" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
            <Path d="M50,-20 C52,-30 60,-25 55,-15 C50,-10 48,-5 50,-20 Z" fill="#C0392B" stroke="#111" strokeWidth="1.5" />
        </G>
    ),
    // 8: Short Bob (straight, covers ears)
    () => (
        <G>
            <Path d="M12,30 Q12,5 50,5 Q88,5 88,30 L88,60 Q88,65 80,65 Q70,68 50,68 Q30,68 20,65 Q12,65 12,60 Z" fill="#2C3E50" stroke="#111" strokeWidth="2.5" />
            <Path d="M12,60 Q10,50 12,40" stroke="#2C3E50" strokeWidth="8" fill="none" strokeLinecap="round" />
            <Path d="M88,60 Q90,50 88,40" stroke="#2C3E50" strokeWidth="8" fill="none" strokeLinecap="round" />
        </G>
    ),
    // 9: Undercut Fade (short sides, tall top)
    () => (
        <G>
            <Path d="M20,45 Q18,20 30,10 Q50,3 70,10 Q82,20 80,45 Q75,30 50,28 Q25,30 20,45 Z" fill="#E74C3C" stroke="#111" strokeWidth="2.5" />
            <Path d="M20,45 Q15,50 15,60" stroke="#888" strokeWidth="6" fill="none" strokeLinecap="round" />
            <Path d="M80,45 Q85,50 85,60" stroke="#888" strokeWidth="6" fill="none" strokeLinecap="round" />
        </G>
    ),
    // 10: Twin Braids
    () => (
        <G>
            <Path d="M18,28 Q18,5 50,5 Q82,5 82,28 Q75,15 50,15 Q25,15 18,28 Z" fill="#8B4513" stroke="#111" strokeWidth="2" />
            <Path d="M15,35 C10,50 12,65 18,80 C20,88 14,92 18,80" stroke="#8B4513" strokeWidth="7" fill="none" strokeLinecap="round" />
            <Path d="M85,35 C90,50 88,65 82,80 C80,88 86,92 82,80" stroke="#8B4513" strokeWidth="7" fill="none" strokeLinecap="round" />
            <Path d="M13,55 L23,52 M11,65 L21,62 M13,75 L21,73" stroke="#6B3410" strokeWidth="2" strokeLinecap="round" />
            <Path d="M87,55 L77,52 M89,65 L79,62 M87,75 L79,73" stroke="#6B3410" strokeWidth="2" strokeLinecap="round" />
        </G>
    ),
    // 11: Long Straight (falls past face)
    () => (
        <G>
            <Path d="M14,20 Q14,3 50,3 Q86,3 86,20 L86,85 Q80,95 75,90 L75,25 Q50,18 25,25 L25,90 Q20,95 14,85 Z" fill="#1A5276" stroke="#111" strokeWidth="2.5" />
        </G>
    ),
    // 12: Bun / Top Knot
    () => (
        <G>
            <Path d="M22,32 Q22,8 50,8 Q78,8 78,32 Q72,18 50,18 Q28,18 22,32 Z" fill="#784212" stroke="#111" strokeWidth="2" />
            <Circle cx="50" cy="5" r="12" fill="#784212" stroke="#111" strokeWidth="2.5" />
            <Path d="M42,8 Q50,2 58,8" stroke="#5D3A1A" strokeWidth="2" fill="none" />
        </G>
    ),
    // 13: Spiky Short (upward spikes)
    () => (
        <G fill="#1B2631" stroke="#111" strokeWidth="2">
            <Path d="M20,32 L15,8 L28,20 L32,5 L42,18 L50,2 L58,18 L68,5 L72,20 L85,8 L80,32 Q65,18 50,18 Q35,18 20,32 Z" strokeLinejoin="round" />
        </G>
    ),
    // 14: Wavy Medium
    () => (
        <G>
            <Path d="M14,22 Q14,3 50,3 Q86,3 86,22 L88,55 C82,45 78,60 72,50 C66,40 62,55 56,48 C50,40 44,55 38,48 C32,40 28,55 22,50 C16,45 12,55 14,55 Z" fill="#27AE60" stroke="#111" strokeWidth="2.5" />
        </G>
    ),
    // 15: Mohawk (center strip)
    () => (
        <G>
            <Path d="M38,32 Q38,5 50,2 Q62,5 62,32 Q58,18 50,15 Q42,18 38,32 Z" fill="#E74C3C" stroke="#111" strokeWidth="2.5" />
            <Path d="M45,2 L43,-8 L50,-12 L57,-8 L55,2" fill="#E74C3C" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
            <Path d="M15,50 Q18,35 38,32" stroke="#555" strokeWidth="6" fill="none" strokeLinecap="round" />
            <Path d="M85,50 Q82,35 62,32" stroke="#555" strokeWidth="6" fill="none" strokeLinecap="round" />
        </G>
    ),
];

// 3.5 Hats (8 styles)
export const hats = [
    // 0: No Hat
    () => null,
    // 1: Fedora Hat (Classic Noir - improved brim)
    () => (
        <G>
            <Path d="M30,22 Q50,12 70,22 L68,8 Q50,2 32,8 Z" fill="#2C3E50" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
            <Path d="M8,26 Q50,32 92,26 Q85,22 70,22 Q50,18 30,22 Q15,22 8,26 Z" fill="#2C3E50" stroke="#111" strokeWidth="2" />
            <Path d="M30,22 Q50,17 70,22" stroke="#E67E22" strokeWidth="3" fill="none" />
        </G>
    ),
    // 2: Police Siren / Beacon
    () => (
        <G>
            <Path d="M40,15 Q50,0 60,15 Z" fill="#E74C3C" stroke="#111" strokeWidth="2" />
            <Rect x="35" y="15" width="30" height="5" fill="#34495E" stroke="#111" strokeWidth="2" rx="2" />
            <Path d="M60,10 L80,-5 M40,10 L20,-5" stroke="#F1C40F" strokeWidth="2" strokeDasharray="2,4" />
        </G>
    ),
    // 3: Detective Deerstalker (Sherlock)
    () => (
        <G>
            <Path d="M25,25 Q50,5 75,25 L75,22 Q50,2 25,22 Z" fill="#95A5A6" stroke="#111" strokeWidth="2" />
            <Path d="M25,25 Q15,20 8,26" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <Path d="M75,25 Q85,20 92,26" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <Path d="M35,14 Q50,0 65,14" fill="#7F8C8D" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
            <Circle cx="50" cy="3" r="3.5" fill="#2C3E50" stroke="#111" strokeWidth="1.5" />
        </G>
    ),
    // 4: Crown (Royal)
    () => (
        <G>
            <Path d="M25,25 L20,5 L35,15 L50,0 L65,15 L80,5 L75,25 Z" fill="#F1C40F" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <Circle cx="20" cy="5" r="3" fill="#E74C3C" />
            <Circle cx="50" cy="0" r="3" fill="#3498DB" />
            <Circle cx="80" cy="5" r="3" fill="#E74C3C" />
        </G>
    ),
    // 5: Cowboy Hat
    () => (
        <G>
            <Path d="M5,30 Q50,15 95,30 L85,25 Q50,5 15,25 Z" fill="#D35400" stroke="#111" strokeWidth="2.5" />
            <Path d="M30,25 Q50,0 70,25" fill="#E67E22" stroke="#111" strokeWidth="2.5" />
        </G>
    ),
    // 6: Wizard Hat (tall pointy with stars)
    () => (
        <G>
            <Path d="M50,-10 L32,28 Q50,22 68,28 Z" fill="#4A235A" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <Path d="M18,28 Q50,38 82,28" fill="#6C3483" stroke="#111" strokeWidth="2" />
            <Path d="M45,5 L46,8 L43,8 L45,5 Z" fill="#F1C40F" />
            <Path d="M55,12 L56,15 L53,15 L55,12 Z" fill="#F1C40F" />
            <Path d="M48,18 L49,21 L46,21 L48,18 Z" fill="#F1C40F" />
        </G>
    ),
    // 7: Beret (French style)
    () => (
        <G>
            <Path d="M15,28 Q15,5 50,5 Q85,5 85,28 Q70,15 50,15 Q30,15 15,28 Z" fill="#922B21" stroke="#111" strokeWidth="2.5" />
            <Path d="M15,28 Q50,35 85,28" stroke="#7B241C" strokeWidth="3" fill="none" />
            <Circle cx="68" cy="10" r="4" fill="#922B21" stroke="#111" strokeWidth="1.5" />
        </G>
    ),
];

// 4. Mouths (10 expressions)
export const mouths = [
    // 0: Cute Cat Mouth (:3)
    () => (
        <Path d="M40,65 Q45,70 50,65 Q55,70 60,65" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    ),
    // 1: Big Goofy Smile with Teeth
    () => (
        <G>
            <Path d="M30,65 Q50,85 70,65 Z" fill="#FFF" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <Path d="M40,65 L40,75 M60,65 L60,75" stroke="#111" strokeWidth="2.5" />
        </G>
    ),
    // 2: Bubblegum Blowing
    () => (
        <G>
            <Path d="M45,70 L55,70" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
            <Circle cx="55" cy="65" r="15" fill="#FF69B4" fillOpacity="0.8" stroke="#FF1493" strokeWidth="2" />
            <Path d="M48,58 Q55,53 62,58" stroke="#FFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        </G>
    ),
    // 3: Shocked 'O'
    () => (
        <Ellipse cx="50" cy="70" rx="6" ry="10" fill="#111" />
    ),
    // 4: Tongue Sticking Out (Playful)
    () => (
        <G>
            <Path d="M35,65 Q50,70 65,65" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <Path d="M42,68 C42,80 58,80 58,68 Z" fill="#E74C3C" stroke="#111" strokeWidth="2" />
            <Path d="M50,68 L50,75" stroke="#111" strokeWidth="1.5" />
        </G>
    ),
    // 5: Neutral / Flat line
    () => (
        <Path d="M35,70 L65,70" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    ),
    // 6: Simple Smile
    () => (
        <Path d="M35,65 Q50,75 65,65" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    ),
    // 7: Frown / Sad
    () => (
        <Path d="M35,72 Q50,62 65,72" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    ),
    // 8: Smirk (one-sided grin)
    () => (
        <Path d="M38,70 Q52,64 65,68" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    ),
    // 9: Zipped / Silent mouth
    () => (
        <G>
            <Path d="M35,68 Q50,72 65,68" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <Path d="M40,68 L40,72 M47,67 L47,72 M53,67 L53,72 M60,67 L60,72" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        </G>
    ),
];

// 5. Facial Accessories (10 styles)
export const accessories = [
    // 0: None
    () => null,
    // 1: Handlebar Mustache (Fancy)
    () => (
        <Path d="M20,70 C30,60 45,65 50,65 C55,65 70,60 80,70 C75,75 55,70 50,75 C45,70 25,75 20,70 Z" fill="#111" />
    ),
    // 2: Noir Cigar / Pipe
    () => (
        <G>
            <Path d="M55,70 L75,78" stroke="#8B4513" strokeWidth="4" strokeLinecap="round" />
            <Path d="M72,78 L78,85 L85,82 L80,75 Z" fill="#654321" stroke="#111" strokeWidth="2" />
            <Path d="M80,75 Q85,65 75,55" stroke="#BDC3C7" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="3,3" />
        </G>
    ),
    // 3: Anime Blush Lines
    () => (
        <G stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" opacity="0.6">
            <Path d="M20,55 L25,50 M25,55 L30,50 M30,55 L35,50" />
            <Path d="M65,55 L70,50 M70,55 L75,50 M75,55 L80,50" />
        </G>
    ),
    // 4: Monocle
    () => (
        <G>
            <Circle cx="67" cy="45" r="14" fill="none" stroke="#F1C40F" strokeWidth="2.5" />
            <Path d="M77,55 L85,85" stroke="#F1C40F" strokeWidth="1.5" />
        </G>
    ),
    // 5: Scar (Battle damage)
    () => (
        <G>
            <Path d="M15,30 L40,55" stroke="#C0392B" strokeWidth="3" />
            <Path d="M25,35 L33,40 M20,40 L28,45 M30,48 L38,53" stroke="#C0392B" strokeWidth="2" />
        </G>
    ),
    // 6: Bandage (Cheek)
    () => (
        <G>
            <Rect x="40" y="52" width="20" height="8" fill="#F5DEB3" stroke="#111" strokeWidth="1.5" rx="2" transform="rotate(-15 50 56)" />
            <Rect x="45" y="54" width="10" height="4" fill="#FFF" transform="rotate(-15 50 56)" />
        </G>
    ),
    // 7: Round Sunglasses
    () => (
        <G stroke="#111" strokeWidth="2.5">
            <Circle cx="33" cy="45" r="12" fill="rgba(0,0,0,0.7)" />
            <Circle cx="67" cy="45" r="12" fill="rgba(0,0,0,0.7)" />
            <Path d="M45,45 L55,45" />
            <Path d="M8,38 L21,42" strokeLinecap="round" />
            <Path d="M92,38 L79,42" strokeLinecap="round" />
        </G>
    ),
    // 8: Bow Tie
    () => (
        <G fill="#E74C3C" stroke="#111" strokeWidth="1.5">
            <Path d="M35,85 L45,78 L50,83 L45,88 Z" />
            <Path d="M65,85 L55,78 L50,83 L55,88 Z" />
            <Circle cx="50" cy="83" r="3" fill="#C0392B" />
        </G>
    ),
    // 9: Short Beard / Stubble
    () => (
        <G fill="#555" opacity="0.8">
            <Path d="M28,72 Q50,82 72,72 Q65,90 50,92 Q35,90 28,72 Z" />
            <Path d="M25,62 Q28,72 35,75" stroke="#555" strokeWidth="2" fill="none" opacity="0.5" />
            <Path d="M75,62 Q72,72 65,75" stroke="#555" strokeWidth="2" fill="none" opacity="0.5" />
        </G>
    ),
];

// 6. Eyebrows (5 styles)
export const eyebrows = [
    // 0: None
    () => null,
    // 1: Normal / Neutral
    () => (
        <G stroke="#111" strokeWidth="3" strokeLinecap="round" fill="none">
            <Path d="M22,32 Q33,28 44,32" />
            <Path d="M56,32 Q67,28 78,32" />
        </G>
    ),
    // 2: Thick & Bold
    () => (
        <G fill="#111">
            <Path d="M22,35 Q33,27 44,33 Q33,30 22,35 Z" />
            <Path d="M56,35 Q67,27 78,33 Q67,30 56,35 Z" />
        </G>
    ),
    // 3: Angry / Furrowed (inner ends lower)
    () => (
        <G stroke="#111" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <Path d="M22,30 Q33,36 44,32" />
            <Path d="M56,32 Q67,36 78,30" />
        </G>
    ),
    // 4: Raised / Surprised (arched high)
    () => (
        <G stroke="#111" strokeWidth="3" strokeLinecap="round" fill="none">
            <Path d="M22,28 Q33,20 44,28" />
            <Path d="M56,28 Q67,20 78,28" />
        </G>
    ),
];

export const AVATAR_BOUNDS = {
    bases: bases.length,
    eyes: eyes.length,
    hairs: hairs.length,
    hats: hats.length,
    mouths: mouths.length,
    accessories: accessories.length,
    eyebrows: eyebrows.length,
    colors: avatarColors.length
};

export const getRandomAvatar = () => ({
    base: Math.floor(Math.random() * bases.length),
    eyes: Math.floor(Math.random() * eyes.length),
    hair: Math.floor(Math.random() * hairs.length),
    hat: Math.floor(Math.random() * hats.length),
    mouth: Math.floor(Math.random() * mouths.length),
    accessory: Math.floor(Math.random() * accessories.length),
    eyebrows: Math.floor(Math.random() * eyebrows.length),
    color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
});
