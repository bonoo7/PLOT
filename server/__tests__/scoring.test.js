const { calculateScores } = require('../logic/scoring');
const { TEAMS, ROLE_TYPES } = require('../roles');

// ─── Helpers ──────────────────────────────────────────────
function makePlayer(overrides) {
    return {
        id: overrides.id || 'p1',
        name: overrides.name || 'Player',
        role: overrides.role || ROLE_TYPES.WITNESS,
        eliminated: false,
        isBot: false,
        acceptedOffer: null,
        abilityUsed: false,
        ...overrides
    };
}

function makeRoom(players, overrides = {}) {
    return {
        players,
        qualityVotes: {},
        answers: {},
        currentScenario: { keywords: [] },
        ...overrides
    };
}

// ─── Basic Scoring ──────────────────────────────────────────
describe('calculateScores — basic', () => {
    it('returns zero scores when no votes and no result', () => {
        const room = makeRoom([
            makePlayer({ id: 'p1', role: ROLE_TYPES.WITNESS }),
            makePlayer({ id: 'p2', role: ROLE_TYPES.CULPRIT }),
        ]);
        const { scores } = calculateScores(room, null);
        expect(scores.p1).toBe(0);
        expect(scores.p2).toBe(0);
    });

    it('awards 200 points per quality vote received', () => {
        const room = makeRoom(
            [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' })],
            { qualityVotes: { voter1: 0, voter2: 0 } } // both voted for index 0 (p1)
        );
        const { scores } = calculateScores(room, null);
        expect(scores.p1).toBe(400); // 2 votes × 200
        expect(scores.p2).toBe(0);
    });
});

// ─── Win Bonus ──────────────────────────────────────────────
describe('calculateScores — win bonus', () => {
    it('awards 2000 to all members of winning team', () => {
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT });
        const detective = makePlayer({ id: 'd1', role: ROLE_TYPES.DETECTIVE });
        const room = makeRoom([culprit, detective]);
        const result = { winner: TEAMS.CRIME };

        const { scores } = calculateScores(room, result);
        expect(scores.c1).toBeGreaterThanOrEqual(2000);
        expect(scores.d1).toBe(0); // JUSTICE lost
    });

    it('awards 2000 to JUSTICE team when they win', () => {
        const detective = makePlayer({ id: 'd1', role: ROLE_TYPES.DETECTIVE });
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT });
        const room = makeRoom([detective, culprit]);
        const result = { winner: TEAMS.JUSTICE };

        const { scores } = calculateScores(room, result);
        expect(scores.d1).toBeGreaterThanOrEqual(2000);
        expect(scores.c1).toBe(0);
    });
});

// ─── Culprit Survival Bonus ─────────────────────────────────
describe('calculateScores — culprit bonus', () => {
    it('awards culprit +500 when CRIME wins', () => {
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT });
        const room = makeRoom([culprit]);
        const result = { winner: TEAMS.CRIME };

        const { scores } = calculateScores(room, result);
        expect(scores.c1).toBe(2500); // 2000 team win + 500 survival
    });

    it('does NOT award culprit +500 when JUSTICE wins', () => {
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT });
        const room = makeRoom([culprit]);
        const result = { winner: TEAMS.JUSTICE };

        const { scores } = calculateScores(room, result);
        expect(scores.c1).toBe(0); // lost, no bonus
    });
});

// ─── Detective Bonus ────────────────────────────────────────
describe('calculateScores — detective bonus', () => {
    it('awards detective +1000 when correctly identifying culprit without sabotage', () => {
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT });
        const detective = makePlayer({
            id: 'd1',
            role: ROLE_TYPES.DETECTIVE,
            investigationTarget: 'c1'
        });
        const room = makeRoom([culprit, detective]);
        const result = { winner: TEAMS.JUSTICE };

        const { scores } = calculateScores(room, result);
        expect(scores.d1).toBe(3000); // 2000 win + 1000 detective
    });

    it('does NOT award detective bonus when target was sabotaged', () => {
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT, sabotagedBy: 's1' });
        const detective = makePlayer({
            id: 'd1',
            role: ROLE_TYPES.DETECTIVE,
            investigationTarget: 'c1'
        });
        const room = makeRoom([culprit, detective]);
        const result = { winner: TEAMS.JUSTICE };

        const { scores } = calculateScores(room, result);
        expect(scores.d1).toBe(2000); // win only, no detection bonus
    });

    it('does NOT award detective bonus when offer was accepted', () => {
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT });
        const detective = makePlayer({
            id: 'd1',
            role: ROLE_TYPES.DETECTIVE,
            investigationTarget: 'c1',
            acceptedOffer: { senderId: 'x', originalSenderId: 'x', type: 'BRIBE' }
        });
        const room = makeRoom([culprit, detective]);
        const result = { winner: TEAMS.JUSTICE };

        const { scores } = calculateScores(room, result);
        expect(scores.d1).toBe(2000); // win only
    });
});

// ─── Saboteur Bonus ─────────────────────────────────────────
describe('calculateScores — saboteur bonus', () => {
    it('awards saboteur +1000 when they sabotage the detective target', () => {
        const culprit = makePlayer({ id: 'c1', role: ROLE_TYPES.CULPRIT });
        const detective = makePlayer({
            id: 'd1',
            role: ROLE_TYPES.DETECTIVE,
            investigationTarget: 'c1'
        });
        const saboteur = makePlayer({
            id: 's1',
            role: ROLE_TYPES.SABOTEUR,
            sabotageTarget: 'c1'
        });
        const room = makeRoom([culprit, detective, saboteur]);
        const result = { winner: TEAMS.CRIME };

        const { scores } = calculateScores(room, result);
        expect(scores.s1).toBe(3000); // 2000 team win + 1000 sabotage
    });
});

// ─── Return shape ────────────────────────────────────────────
describe('calculateScores — return shape', () => {
    it('returns crimeTeamWon and investigationTeamWon flags correctly', () => {
        const room = makeRoom([makePlayer({ id: 'p1' })]);
        const resultCrime = calculateScores(room, { winner: TEAMS.CRIME });
        expect(resultCrime.crimeTeamWon).toBe(true);
        expect(resultCrime.investigationTeamWon).toBe(false);

        const resultJustice = calculateScores(room, { winner: TEAMS.JUSTICE });
        expect(resultJustice.crimeTeamWon).toBe(false);
        expect(resultJustice.investigationTeamWon).toBe(true);
    });

    it('returns breakdown array for each player', () => {
        const room = makeRoom([makePlayer({ id: 'p1' })]);
        const { breakdown } = calculateScores(room, null);
        expect(Array.isArray(breakdown.p1)).toBe(true);
    });
});
