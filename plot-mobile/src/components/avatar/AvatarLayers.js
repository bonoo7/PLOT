import React from 'react';
import { G, Path, Circle, Rect, Ellipse } from 'react-native-svg';

// Color palettes for base skin (Pastel, Noir, & Vibrant Mix)
export const avatarColors = [
    '#FDF5E6', // Old lace (Paper)
    '#FFF8DC', // Cornsilk
    '#FFC0CB', // Pink
    '#FF69B4', // Hot Pink (Vibrant)
    '#FF4500', // Orange Red (Vibrant)
    '#FFD700', // Gold / Bright Yellow (Vibrant)
    '#ADFF2F', // Green Yellow (Neon Green)
    '#00FF7F', // Spring Green (Vibrant)
    '#00CED1', // Dark Turquoise (Cyan/Vibrant)
    '#1E90FF', // Dodger Blue (Bright Blue)
    '#9370DB', // Medium Purple
    '#8A2BE2', // Blue Violet (Neon Purple)
    '#A0522D', // Sienna (Brown)
    '#696969', // Dim Gray (Noir style)
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
    // 2: Onigiri / Triangle
    ({ color }) => (
        <Path d="M50,15 C65,15 85,70 85,85 C85,95 15,95 15,85 C15,70 35,15 50,15 Z" fill={color} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
    ),
    // 3: Mushroom Cap (Wide head)
    ({ color }) => (
        <Path d="M10,50 C10,10 90,10 90,50 Q90,95 50,95 Q10,95 10,50 Z" fill={color} stroke="#111" strokeWidth="3" />
    ),
    // 4: Pear / Blob (Bottom heavy)
    ({ color }) => (
        <Path d="M50,20 C70,20 65,50 85,75 C95,90 80,95 50,95 C20,95 5,90 15,75 C35,50 30,20 50,20 Z" fill={color} stroke="#111" strokeWidth="3" />
    ),
    // 5: Hexagon (Robot/Blocky style)
    ({ color }) => (
        <Path d="M50,10 L85,30 L85,70 L50,90 L15,70 L15,30 Z" fill={color} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
    )
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
    // 1: Derpy / Googly Eyes (Looking opposite ways)
    () => (
        <G>
            <Circle cx="30" cy="45" r="10" fill="#FFF" stroke="#111" strokeWidth="2.5" />
            <Circle cx="70" cy="45" r="10" fill="#FFF" stroke="#111" strokeWidth="2.5" />
            <Circle cx="26" cy="45" r="3" fill="#111" />
            <Circle cx="74" cy="43" r="3" fill="#111" />
        </G>
    ),
    // 2: Suspicious / Squinting
    () => (
        <G>
            <Path d="M22,44 Q33,35 44,44 Z" fill="#111" />
            <Path d="M78,44 Q67,35 56,44 Z" fill="#111" />
        </G>
    ),
    // 3: Detective Glasses (Big round specs)
    () => (
        <G stroke="#111" strokeWidth="3">
            <Circle cx="32" cy="45" r="13" fill="rgba(255,255,255,0.9)" />
            <Circle cx="68" cy="45" r="13" fill="rgba(255,255,255,0.9)" />
            <Path d="M45,45 L55,45" />
            {/* Glint */}
            <Path d="M25,40 Q32,35 38,40" stroke="#FFF" strokeWidth="2" fill="none" />
            <Path d="M61,40 Q68,35 74,40" stroke="#FFF" strokeWidth="2" fill="none" />
            {/* Tiny pupils */}
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
    // 5: Hearts (Love)
    () => (
        <G fill="#FF4B4B" stroke="#111" strokeWidth="1.5">
            <Path d="M33,52 L23,40 A6,6 0 0 1 33,34 A6,6 0 0 1 43,40 Z" />
            <Path d="M67,52 L57,40 A6,6 0 0 1 67,34 A6,6 0 0 1 77,40 Z" />
        </G>
    ),
    // 6: Dots (Classic minimalist)
    () => (
        <G fill="#111">
            <Circle cx="30" cy="45" r="3" />
            <Circle cx="70" cy="45" r="3" />
        </G>
    )
];

// 3. Hair (Actual hair styles, no hats)
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
    // 3: Floppy Bunny/Dog Ears (Cute)
    () => (
        <G>
            <Path d="M25,20 C10,-10 -5,20 15,40 Z" fill="#FDF5E6" stroke="#111" strokeWidth="2.5" />
            <Path d="M75,20 C90,-10 105,20 85,40 Z" fill="#FDF5E6" stroke="#111" strokeWidth="2.5" />
            {/* Innner Pink */}
            <Path d="M25,15 C15,0 5,20 15,35 Z" fill="#FFB6C1" />
            <Path d="M75,15 C85,0 95,20 85,35 Z" fill="#FFB6C1" />
        </G>
    ),
    // 4: Elegant Swoop (Fancy hair)
    () => (
        <Path d="M15,40 Q15,10 50,10 Q80,10 85,35 C70,15 40,20 15,40 Z" fill="#E67E22" stroke="#111" strokeWidth="2" />
    ),
    // 5: Curly Afro / Fluffy
    () => (
        <Path d="M20,40 C10,30 20,10 40,15 C50,0 70,5 75,20 C90,15 95,35 85,45 C95,60 70,65 75,50 Z" fill="#8B4513" stroke="#111" strokeWidth="2.5" />
    ),
    // 6: Straight Long Bangs
    () => (
        <Path d="M15,50 L20,30 Q50,15 80,30 L85,50 L80,25 Q50,5 20,25 Z" fill="#8E44AD" stroke="#111" strokeWidth="2" />
    )
];

// 3.5 Hats (Separate from hair)
export const hats = [
    // 0: No Hat
    () => null,
    // 1: Fedora Hat (Classic Noir)
    () => (
        <G>
            <Path d="M10,25 Q50,15 90,25 L85,20 L70,5 L30,5 L15,20 Z" fill="#2C3E50" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
            <Path d="M18,20 L82,20" stroke="#E67E22" strokeWidth="4" />
            <Path d="M10,25 Q50,30 90,25" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
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
    // 3: Detective Deerstalker Hat (Sherlock)
    () => (
        <G>
            <Path d="M25,25 Q50,5 75,25" fill="#95A5A6" stroke="#111" strokeWidth="2" />
            <Path d="M25,25 Q15,20 10,25" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <Path d="M75,25 Q85,20 90,25" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <Path d="M35,15 Q50,0 65,15" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <Circle cx="50" cy="5" r="3" fill="#111" />
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
    )
];

// 4. Mouths (Expressions only)
export const mouths = [
    // 0: Cute Cat Mouth (:3)
    () => (
        <Path d="M40,65 Q45,70 50,65 Q55,70 60,65" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    ),
    // 1: Big Goofy Smile with Tooth
    () => (
        <G>
            <Path d="M30,65 Q50,85 70,65 Z" fill="#FFF" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <Path d="M40,65 L40,75 M60,65 L60,75" stroke="#111" strokeWidth="2.5" />
        </G>
    ),
    // 2: Bubblegum Blowing (Big pink circle)
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
    )
];

// 5. Facial Accessories
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
    // 5: Scar (Eyepatch/Battle damage)
    () => (
        <G>
            <Path d="M15,30 L40,55" stroke="#C0392B" strokeWidth="3" />
            <Path d="M25,35 L33,40 M20,40 L28,45 M30,48 L38,53" stroke="#C0392B" strokeWidth="2" />
        </G>
    ),
    // 6: Bandage (Nose/Cheek)
    () => (
        <G>
            <Rect x="40" y="52" width="20" height="8" fill="#F5DEB3" stroke="#111" strokeWidth="1.5" rx="2" transform="rotate(-15 50 56)" />
            <Rect x="45" y="54" width="10" height="4" fill="#FFF" transform="rotate(-15 50 56)" />
        </G>
    )
];

export const AVATAR_BOUNDS = {
    bases: bases.length,
    eyes: eyes.length,
    hairs: hairs.length,
    hats: hats.length,
    mouths: mouths.length,
    accessories: accessories.length,
    colors: avatarColors.length
};

export const getRandomAvatar = () => ({
    base: Math.floor(Math.random() * bases.length),
    eyes: Math.floor(Math.random() * eyes.length),
    hair: Math.floor(Math.random() * hairs.length),
    hat: Math.floor(Math.random() * hats.length),
    mouth: Math.floor(Math.random() * mouths.length),
    accessory: Math.floor(Math.random() * accessories.length),
    color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
});
