import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// persist session data in sessionStorage on web (survives refresh, not tab close), no-op on native
const safeSessionStorage = (() => {
    try { return typeof sessionStorage !== 'undefined' ? sessionStorage : null; }
    catch { return null; }
})();

const sessionStorage = safeSessionStorage
    ? createJSONStorage(() => safeSessionStorage)
    : createJSONStorage(() => ({ getItem: () => null, setItem: () => {}, removeItem: () => {} }));

export const useGameStore = create(
    persist(
        (set) => ({
    // Core App State
    roomCode: '',
    generatedRoomCode: '',
    hostToken: null, // رمز سري يُستخدم لإعادة انضمام الهوست بأمان
    playerName: '',
    userRole: null, // 'HOST' | 'PLAYER' | null
    players: [],
    socketId: null,
    myAvatar: null,

    // UI State
    themeMode: 'light', // 'light' or 'dark'
    designVersion: 'v3', // 'v1' | 'v2' | 'v3'

    // Game Settings/Info
    gameMode: 'BLITZ', // CLASSIC or BLITZ — الوضع الافتراضي هو Blitz
    currentRound: 1,
    totalRounds: 3,
    scenario: '', // Current title/case
    template: '', // For blitz mode

    // Round State
    timeLeft: 300,
    answer: '',
    isSubmitted: false,
    waitingFor: [], // Array of player IDs host is waiting for

    // Voting State
    scenarios: [], // Answers to vote on
    hasVoted: false,
    selectedScenario: null,
    selectedCulprit: null,
    liveVotes: [],

    // Reveal State
    revealedScenarios: [],
    currentReveal: null,

    // Discussion Phase
    speakingPlayerId: null,
    lastHint: null,

    // Results
    roundResults: null,
    finalResults: null, // نتائج نهاية اللعبة — تُحفظ بعد gameEnded ولا تُمسح في resetGame

    // Player specific
    roleData: null,
    connecting: false,
    reconnecting: false,
    selectedTrainingRole: null,
    pendingAbilityResult: null, // نتيجة القدرة — تُعرض مرة واحدة فقط في الجولة
    abilityResultSeen: false,   // هل تم الاطلاع على النتيجة في هذه الجولة؟
    voteTieInfo: null,          // بيانات التعادل في التصويت { candidates, message }
    // نظام الإشعارات — بديل آمن لـ Alert.alert داخل hooks
    notification: null, // { title, message, type: 'info'|'warning'|'error' } | null

    // Actions
    setThemeMode: (mode) => set({ themeMode: mode }),
    setDesignVersion: (v) => set({ designVersion: v }),
    setRoomCode: (code) => set({ roomCode: code }),
    setGeneratedRoomCode: (code) => set({ generatedRoomCode: code }),
    setHostToken: (token) => set({ hostToken: token }),
    setPlayerName: (name) => set({ playerName: name }),
    setUserRole: (role) => set({ userRole: role }),
    setPlayers: (players) => set({ players }),
    setSocketId: (id) => set({ socketId: id }),
    setMyAvatar: (avatar) => set({ myAvatar: avatar }),

    setGameMode: (mode) => set({ gameMode: mode }),
    setCurrentRound: (round) => set({ currentRound: round }),
    setTotalRounds: (total) => set({ totalRounds: total }),
    setScenario: (scenario) => set({ scenario }),
    setTemplate: (template) => set({ template }),

    setTimeLeft: (time) => set({ timeLeft: time }),
    setAnswer: (answer) => set({ answer }),
    setIsSubmitted: (isSubmitted) => set({ isSubmitted }),
    setWaitingFor: (waitingFor) => set({ waitingFor }),

    setScenarios: (scenarios) => set({ scenarios }),
    setHasVoted: (hasVoted) => set({ hasVoted }),
    setSelectedScenario: (selected) => set({ selectedScenario: selected }),
    setSelectedCulprit: (selected) => set({ selectedCulprit: selected }),
    setLiveVotes: (updater) => set(state => ({
        liveVotes: typeof updater === 'function' ? updater(state.liveVotes) : updater
    })),

    setRevealedScenarios: (reveals) => set({ revealedScenarios: reveals }),
    setCurrentReveal: (reveal) => set({ currentReveal: reveal }),

    setSpeakingPlayerId: (id) => set({ speakingPlayerId: id }),
    setLastHint: (hint) => set({ lastHint: hint }),

    setRoundResults: (results) => set({ roundResults: results }),
    setFinalResults: (results) => set({ finalResults: results }),

    setRoleData: (data) => set({ roleData: data }),
    setPendingAbilityResult: (result) => set({ pendingAbilityResult: result }),
    setAbilityResultSeen: (seen) => set({ abilityResultSeen: seen }),
    setVoteTieInfo: (info) => set({ voteTieInfo: info }),
    setConnecting: (connecting) => set({ connecting }),
    setReconnecting: (reconnecting) => set({ reconnecting }),
    setSelectedTrainingRole: (role) => set({ selectedTrainingRole: role }),
    setNotification: (notification) => set({ notification }),
    clearNotification: () => set({ notification: null }),

    // Helpers
    clearRoundState: () => set({
        answer: '',
        isSubmitted: false,
        hasVoted: false,
        selectedScenario: null,
        selectedCulprit: null,
        liveVotes: [],
        revealedScenarios: [],
        currentReveal: null,
        roundResults: null,
        pendingAbilityResult: null,
        abilityResultSeen: false,
        voteTieInfo: null,
    }),

    resetGame: () => set({
        roomCode: '',
        generatedRoomCode: '',
        hostToken: null,
        playerName: '',
        userRole: null,
        players: [],
        socketId: null,
        roleData: null,
        scenario: '',
        template: '',
        gameMode: 'BLITZ',
        currentRound: 1,
        totalRounds: 3,
        // Round State
        answer: '',
        isSubmitted: false,
        hasVoted: false,
        selectedScenario: null,
        selectedCulprit: null,
        liveVotes: [],
        revealedScenarios: [],
        currentReveal: null,
        roundResults: null,
        speakingPlayerId: null,
        lastHint: null,
        waitingFor: [],
        scenarios: [],
        // Connection State
        connecting: false,
        reconnecting: false,
        // Ability State
        pendingAbilityResult: null,
        abilityResultSeen: false,
        voteTieInfo: null,
        selectedTrainingRole: null,
    }),
    }),
    {
        name: 'plot-game-session',
        storage: sessionStorage,
        partialize: (state) => ({
            roomCode: state.roomCode,
            playerName: state.playerName,
            userRole: state.userRole,
            hostToken: state.hostToken,
            myAvatar: state.myAvatar,
            gameMode: state.gameMode,
            designVersion: state.designVersion,
            themeMode: state.themeMode,
        }),
    }
));
