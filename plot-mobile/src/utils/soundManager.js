import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// التراكات الفعلية — قد تشترك عدة مراحل في نفس التراك
const TRACK_FILES = {
    opening:         require('../../assets/sounds/opening_loop.wav'),
    quality_voting:  require('../../assets/sounds/quality_voting_loop.wav'),
    dramatic_reveal: require('../../assets/sounds/dramatic_reveal_loop.wav'),
    discussion:      require('../../assets/sounds/discussion_loop.wav'),
    culprit_voting:  require('../../assets/sounds/culprit_voting_loop.wav'),
    results:         require('../../assets/sounds/results_loop.wav'),
};

// ربط المرحلة بالتراك المناسب
const STAGE_TRACKS = {
    setup: 'opening',
    lobby: 'opening',
    game_intro: 'opening',
    drafting: 'opening',
    quality_voting: 'quality_voting',
    dramatic_reveal: 'dramatic_reveal',
    discussion: 'discussion',
    culprit_voting: 'culprit_voting',
    results: 'results',
};

const loadedSounds = {};       // Native sounds (expo-av)
let soundEnabled    = true;
let currentTrackId   = null;   // هوية التراك الحالي
let currentWebAudio  = null;   // Web fallback (HTMLAudioElement)
let musicTransition  = Promise.resolve();

function queueMusicTransition(action) {
    musicTransition = musicTransition.then(action, action);
    return musicTransition;
}

function getTrackId(stageName) {
    return STAGE_TRACKS[stageName] || null;
}

/**
 * تهيئة نظام الصوت وتحميل الأصوات مسبقاً (Native only — web يستخدم HTMLAudioElement)
 */
export async function initSounds() {
    if (Platform.OS === 'web') return;
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        });
        for (const [trackId, file] of Object.entries(TRACK_FILES)) {
            try {
                const { sound } = await Audio.Sound.createAsync(file, {
                    shouldPlay: false,
                    isLooping: true,
                    volume: 0.7,
                });
                loadedSounds[trackId] = sound;
            } catch (e) {
                // ملف غير موجود أو خطأ في التحميل — نتجاهل بهدوء
            }
        }
    } catch (e) {
        // الجهاز لا يدعم الصوت
    }
}

/**
 * تشغيل موسيقى مرحلة (تشغيل متكرر — يوقف الموسيقى السابقة تلقائياً)
 * @param {string} name - اسم المرحلة
 */
export function playMusic(name) {
    return queueMusicTransition(async () => {
        const trackId = getTrackId(name);
        if (!soundEnabled) return;
        if (!trackId) return;
        if (currentTrackId === trackId) return;

        await stopMusicNow();
        currentTrackId = trackId;

        if (Platform.OS === 'web') {
            try {
                const rawUrl = TRACK_FILES[trackId];
                const url = typeof rawUrl === 'string' ? rawUrl : null;
                if (!url) { currentTrackId = null; return; }
                const audio = new window.Audio(url);
                audio.loop   = true;
                audio.volume = 0.7;
                await audio.play();
                currentWebAudio = audio;
            } catch (e) {
                currentTrackId = null;
            }
            return;
        }

        const sound = loadedSounds[trackId];
        if (!sound) { currentTrackId = null; return; }
        try {
            await sound.setPositionAsync(0);
            await sound.playAsync();
        } catch (e) {
            currentTrackId = null;
        }
    });
}

/**
 * إيقاف الموسيقى الحالية
 */
async function stopMusicNow() {
    const prev = currentTrackId;
    currentTrackId = null;

    if (Platform.OS === 'web') {
        if (currentWebAudio) {
            currentWebAudio.pause();
            currentWebAudio.currentTime = 0;
            currentWebAudio = null;
        }
        return;
    }

    if (prev && loadedSounds[prev]) {
        try { await loadedSounds[prev].stopAsync(); } catch (e) {}
    }
}

export function stopMusic() {
    return queueMusicTransition(stopMusicNow);
}

/**
 * تشغيل مؤثر صوتي قصير (غير متكرر)
 * @param {string} name - اسم الصوت
 */
export async function playSound(name) {
    if (!soundEnabled || Platform.OS === 'web') return;
    const sound = loadedSounds[name];
    if (!sound) return;
    try {
        await sound.replayAsync();
    } catch (e) {}
}

/** تفعيل/تعطيل الأصوات */
export async function setSoundEnabled(enabled) {
    soundEnabled = enabled;
    if (!enabled) await stopMusic();
}
export function isSoundEnabled() { return soundEnabled; }

/** تحرير جميع الأصوات المحملة */
export async function unloadSounds() {
    await stopMusic();
    for (const sound of Object.values(loadedSounds)) {
        try { await sound.unloadAsync(); } catch (e) {}
    }
}
