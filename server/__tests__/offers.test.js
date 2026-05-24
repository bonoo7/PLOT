/**
 * اختبارات نظام العروض السرية والرشاوى الذكية — logic/offers.js & botAI.js
 */

jest.mock('../state', () => ({ rooms: {} }));

const { handleSendOffer, handleMastermindForward, handleOfferResponse } = require('../logic/offers');
const { ROLE_TYPES, TEAMS } = require('../roles');
const stateModule = require('../state');

describe('Offers and Bot AI Logic', () => {
    let mockIo;
    let room;

    beforeEach(() => {
        jest.useFakeTimers();
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };
        
        // تجهيز الغرفة واللاعبين الافتراضيين
        room = {
            state: 'DRAFTING',
            players: [
                { id: 'beneficiary', name: 'Beneficiary Bot', role: ROLE_TYPES.BENEFICIARY, team: TEAMS.CRIME, score: 1000, isBot: true },
                { id: 'mastermind', name: 'Mastermind Bot', role: ROLE_TYPES.MASTERMIND, team: TEAMS.CRIME, score: 500, isBot: true, specialInfo: { crimeTeam: [{ id: 'beneficiary' }, { id: 'mastermind' }] } },
                { id: 'detective', name: 'Detective Bot', role: ROLE_TYPES.DETECTIVE, team: TEAMS.JUSTICE, score: 200, isBot: true },
                { id: 'minister', name: 'Minister Player', role: ROLE_TYPES.MINISTER, team: TEAMS.JUSTICE, score: 1000, isBot: false },
                { id: 'witness', name: 'Witness Bot', role: ROLE_TYPES.WITNESS, team: TEAMS.JUSTICE, score: 300, isBot: true }
            ],
            offers: {},
            answers: {},
            currentScenario: { keywords: ['gold', 'secret'], tricksterWord: 'apple' }
        };
        stateModule.rooms['TEST_ROOM'] = room;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('rejects sending offers if amount exceeds sender score', () => {
        const sender = room.players.find(p => p.id === 'beneficiary');
        const result = handleSendOffer(mockIo, room, sender, { targetId: 'detective', amount: 1500 });
        expect(result.success).toBe(false);
        expect(result.message).toBe('رصيدك غير كافي!');
    });

    it('triggers the minister reveal trap if Beneficiary sends direct offer to Minister', () => {
        const sender = room.players.find(p => p.id === 'beneficiary');
        const result = handleSendOffer(mockIo, room, sender, { targetId: 'minister', amount: 300 });
        
        expect(result.success).toBe(true);
        // التحقق من تفعيل حدث التنبيه للوزير بكشف هوية المستفيد
        expect(mockIo.to).toHaveBeenCalledWith('minister');
        expect(mockIo.emit).toHaveBeenCalledWith('ministerRevealAlert', {
            beneficiaryName: 'Beneficiary Bot'
        });
        expect(sender.score).toBe(700); // خصم المبلغ
    });

    it('automatically forwards proxy offers if the Mastermind is a bot', () => {
        const sender = room.players.find(p => p.id === 'beneficiary');
        const result = handleSendOffer(mockIo, room, sender, { targetId: 'detective', amount: 400, isViaMastermind: true });

        expect(result.success).toBe(true);
        expect(sender.score).toBe(600); // خصم المبلغ بالكامل من المستفيد
        
        const mastermind = room.players.find(p => p.id === 'mastermind');
        expect(mastermind.score).toBe(600); // الماستر مايند يأخذ رسوم الوساطة (100) فوراً

        // محاكاة مرور وقت تفكير البوت الماستر مايند لإعادة التوجيه تلقائياً
        jest.advanceTimersByTime(5000);

        // يجب أن يختار الماستر مايند لاعباً من خارج فريق الجريمة (Detective أو Minister أو Witness)
        const activeOffers = Object.values(room.offers);
        expect(activeOffers.length).toBe(1);
        expect(activeOffers[0].type).toBe('PROXY');
        expect(activeOffers[0].amount).toBe(300); // العرض الصافي بعد الرسوم
        expect(['detective', 'minister', 'witness']).toContain(activeOffers[0].targetId);
    });

    it('automatically decides on offer if the target is a bot player', () => {
        const sender = room.players.find(p => p.id === 'minister');
        
        // إرسال عرض إلى بوت الشاهد (Witness Bot) بمبلغ مغرٍ
        handleSendOffer(mockIo, room, sender, { targetId: 'witness', amount: 300 });

        const activeOffers = Object.values(room.offers);
        expect(activeOffers.length).toBe(1);
        const offerId = activeOffers[0].id;

        // محاكاة مرور الوقت لتفكير البوت واتخاذ القرار تلقائياً
        jest.advanceTimersByTime(5000);

        // البوت الشاهد يجب أن يقبل لعرض أكبر من 250 نقطة
        const witness = room.players.find(p => p.id === 'witness');
        expect(witness.acceptedOffer).not.toBeNull();
        expect(witness.acceptedOffer.amount).toBe(300);
        expect(witness.score).toBe(600); // 300 + 300
    });
});
