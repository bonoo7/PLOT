import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// خريطة الأصوات المتاحة — أضف ملفات MP3 هنا عند توفرها
// مثال: game_start: require('../../assets/sounds/game_start.mp3')
const SOUND_FILES = {};

const loadedSounds = {};
let soundEnabled = true;

/**
 * تهيئة نظام الصوت وتحميل الأصوات مسبقاً
 */
export async function initSounds() {
    if (Platform.OS === 'web') return;
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        });

        for (const [name, file] of Object.entries(SOUND_FILES)) {
            try {
                const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false });
                loadedSounds[name] = sound;
            } catch (e) {
                // ملف الصوت غير موجود — نتجاهل بهدوء
            }
        }
    } catch (e) {
        // الجهاز لا يدعم الصوت — نتجاهل
    }
}

/**
 * تشغيل صوت بالاسم
 * @param {string} name - اسم الصوت
 */
export async function playSound(name) {
    if (!soundEnabled || Platform.OS === 'web') return;
    const sound = loadedSounds[name];
    if (!sound) return;
    try {
        await sound.replayAsync();
    } catch (e) {
        // تجاهل أخطاء التشغيل
    }
}

/** تفعيل/تعطيل الأصوات */
export function setSoundEnabled(enabled) { soundEnabled = enabled; }
export function isSoundEnabled() { return soundEnabled; }

/** تحرير جميع الأصوات المحملة */
export async function unloadSounds() {
    for (const sound of Object.values(loadedSounds)) {
        try { await sound.unloadAsync(); } catch (e) {}
    }
}