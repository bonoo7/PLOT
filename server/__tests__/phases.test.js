/**
 * اختبارات مرحلة اللعبة — game/phases.js
 *
 * نستخدم Jest mocks لعزل التبعيات الخارجية (Socket.IO و state)
 * ونختبر منطق checkDraftingComplete و checkQualityVotingComplete.
 */

// ─── Mock الاعتماديات ─────────────────────────────────────────────
jest.mock('../state', () => ({ rooms: {} }));

// Mock جميع وحدات تستخدم Socket.IO
jest.mock('../botAI', () => ({
    generateBotAnswer: jest.fn().mockResolvedValue('bot answer'),
    analyzeSuspicion: jest.fn().mockReturnValue([]),
    generateBotVote: jest.fn().mockReturnValue(0),
    generateQualityVote: jest.fn().mockReturnValue(0),
    generateSmartCulpritVote: jest.fn().mockReturnValue(null),
    generateSmartQualityVote: jest.fn().mockReturnValue(0),
    shouldUseAbility: jest.fn().mockReturnValue(false)
}));

jest.mock('../scenarios', () => ([
    { id: 1, title: 'Test Case', keywords: ['كلمة'], solution: 'الحل', template: 'القالب', simpleHint: 'تلميح' }
]));

const stateModule = require('../state');

// ─── Helper ───────────────────────────────────────────────────────
function makeRoom(playerIds, answersObj = {}) {
    return {
        state: 'DRAFTING',
        players: playerIds.map(id => ({ id, name: `Player ${id}`, eliminated: false, isBot: false })),
        answers: answersObj,
        timer: null,
        currentScenario: { title: 'Test', keywords: [] },
        gameMode: 'STANDARD',
        hostId: null,
        qualityVotes: {},
        culpritVotes: {}
    };
}

// ─── checkDraftingComplete ────────────────────────────────────────
describe('checkDraftingComplete', () => {
    let phases;
    const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        close: jest.fn()
    };

    beforeEach(() => {
        jest.resetModules();
        jest.mock('../state', () => ({ rooms: {} }));
        jest.mock('../botAI', () => ({
            generateBotAnswer: jest.fn().mockResolvedValue('answer'),
            analyzeSuspicion: jest.fn().mockReturnValue([]),
            generateBotVote: jest.fn().mockReturnValue(0),
            generateQualityVote: jest.fn().mockReturnValue(0),
            generateSmartCulpritVote: jest.fn().mockReturnValue(null),
            generateSmartQualityVote: jest.fn().mockReturnValue(0),
            shouldUseAbility: jest.fn().mockReturnValue(false)
        }));
        jest.mock('../scenarios', () => ([
            { id: 1, title: 'Test Case', keywords: [], solution: 'solution', template: '', simpleHint: '' }
        ]));

        phases = require('../game/phases');
        phases.initPhases(mockIo);
        mockIo.to.mockClear();
        mockIo.emit.mockClear();
    });

    it('does nothing when room does not exist', () => {
        const { rooms } = require('../state');
        // rooms is empty — no crash expected
        expect(() => phases.checkDraftingComplete('NONEXISTENT')).not.toThrow();
    });

    it('does nothing when not all players have submitted', () => {
        const { rooms } = require('../state');
        const room = makeRoom(['p1', 'p2']);
        room.answers = { p1: 'answer1' }; // only 1 of 2 submitted
        rooms['TEST1'] = room;

        phases.checkDraftingComplete('TEST1');
        // state should remain DRAFTING since not everyone submitted
        expect(rooms['TEST1'].state).toBe('DRAFTING');
    });

    it('advances phase when all active players have submitted', () => {
        const { rooms } = require('../state');
        const room = makeRoom(['p1', 'p2']);
        room.answers = { p1: 'answer1', p2: 'answer2' }; // all submitted
        room.timer = setInterval(() => {}, 99999);
        rooms['TEST2'] = room;

        phases.checkDraftingComplete('TEST2');
        // After all submit, state changes away from DRAFTING
        expect(rooms['TEST2'].state).not.toBe('DRAFTING');
    });

    it('ignores eliminated players when checking completion', () => {
        const { rooms } = require('../state');
        const room = {
            state: 'DRAFTING',
            players: [
                { id: 'p1', eliminated: false },
                { id: 'p2', eliminated: true } // eliminated
            ],
            answers: { p1: 'answer1' }, // only active player submitted
            timer: setInterval(() => {}, 99999),
            currentScenario: { title: 'Test', keywords: [] },
            gameMode: 'STANDARD',
            hostId: null
        };
        rooms['TEST3'] = room;

        phases.checkDraftingComplete('TEST3');
        // p2 is eliminated, so p1 alone is enough
        expect(rooms['TEST3'].state).not.toBe('DRAFTING');
    });
});

// ─── checkQualityVotingComplete ───────────────────────────────────
describe('checkQualityVotingComplete', () => {
    let phases;
    const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    };

    beforeEach(() => {
        jest.resetModules();
        jest.mock('../state', () => ({ rooms: {} }));
        jest.mock('../botAI', () => ({
            generateBotAnswer: jest.fn().mockResolvedValue('answer'),
            analyzeSuspicion: jest.fn().mockReturnValue([]),
            generateBotVote: jest.fn().mockReturnValue(0),
            generateQualityVote: jest.fn().mockReturnValue(0),
            generateSmartCulpritVote: jest.fn().mockReturnValue(null),
            generateSmartQualityVote: jest.fn().mockReturnValue(0),
            shouldUseAbility: jest.fn().mockReturnValue(false)
        }));
        jest.mock('../scenarios', () => ([
            { id: 1, title: 'Test Case', keywords: [], solution: 'solution', template: '', simpleHint: '' }
        ]));

        phases = require('../game/phases');
        phases.initPhases(mockIo);
        mockIo.to.mockClear();
        mockIo.emit.mockClear();
    });

    it('does nothing when room does not exist', () => {
        expect(() => phases.checkQualityVotingComplete('NONEXISTENT')).not.toThrow();
    });

    it('does nothing when not all active players have voted', () => {
        const { rooms } = require('../state');
        const room = {
            state: 'QUALITY_VOTING',
            players: [
                { id: 'p1', eliminated: false },
                { id: 'p2', eliminated: false }
            ],
            qualityVotes: { p1: 0 }, // only 1 of 2 voted
            timer: null,
            answers: {},
            currentScenario: { keywords: [] }
        };
        rooms['QV1'] = room;

        phases.checkQualityVotingComplete('QV1');
        expect(rooms['QV1'].state).toBe('QUALITY_VOTING');
    });
});
