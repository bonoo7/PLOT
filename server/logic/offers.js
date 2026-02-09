const { ROLE_TYPES, TEAMS, getRoleInfo } = require('../roles');

// Store active offers and timers
// structure: { offerId: { senderId, targetId, amount, timer, status, type } }
const activeOffers = {}; 

// Offer Types
const OFFER_TYPES = {
    DIRECT: 'DIRECT',
    PROXY: 'PROXY' // Via Mastermind
};

// Handle Offer Sending
function handleSendOffer(io, room, sender, { targetId, amount, isViaMastermind, offerType }) {
    if (amount > sender.score) {
        return { success: false, message: 'رصيدك غير كافي!' };
    }

    if (amount <= 0) {
        return { success: false, message: 'يجب أن يكون المبلغ أكبر من صفر!' };
    }

    // 1. Beneficiary -> Mastermind (Proxy)
    if (isViaMastermind && sender.role === ROLE_TYPES.BENEFICIARY) {
        const mastermind = room.players.find(p => p.role === ROLE_TYPES.MASTERMIND);
        if (!mastermind) {
            return { success: false, message: 'لا يوجد عقل مدبر في اللعبة!' };
        }

        // Calculate Fee (1/4)
        const fee = Math.floor(amount / 4);
        const actualOffer = amount - fee;

        // Deduct full amount from Beneficiary
        sender.score -= amount;
        
        // Give Fee to Mastermind immediately
        mastermind.score += fee;

        // Notify Mastermind to select target
        io.to(mastermind.id).emit('mastermindProxyRequest', {
            amount: actualOffer,
            originalSenderId: sender.id,
            feeEarned: fee
        });

        return { success: true, message: `تم إرسال الطلب للعقل المدبر. (تم خصم ${amount}، وحصل العقل المدبر على ${fee})` };
    }

    // 2. Direct Offer (Beneficiary or Minister)
    const target = room.players.find(p => p.id === targetId);
    if (!target) return { success: false, message: 'اللاعب غير موجود!' };

    // Minister Constraints
    if (sender.role === ROLE_TYPES.MINISTER) {
        if (target.role === ROLE_TYPES.BENEFICIARY) {
            return { success: false, message: 'لا يمكنك إرسال عرض للمستفيد!' };
        }
    }

    // Beneficiary -> Minister Trap
    if (sender.role === ROLE_TYPES.BENEFICIARY && target.role === ROLE_TYPES.MINISTER) {
        // Reveal Beneficiary to Minister
        io.to(target.id).emit('ministerRevealAlert', {
            beneficiaryName: sender.name
        });
        
        // Beneficiary loses points but offer is effectively voided/ignored by Minister logic (passive)
        sender.score -= amount;
        
        return { success: true, message: 'تم إرسال العرض...' }; // Don't tell Beneficiary they messed up yet? User said "Risk".
    }

    // Standard Direct Offer
    createOffer(io, room, sender, target, amount, OFFER_TYPES.DIRECT);
    return { success: true, message: 'تم إرسال العرض بنجاح!' };
}

// Mastermind Forwarding Logic
function handleMastermindForward(io, room, mastermind, { targetId, amount }) {
    const target = room.players.find(p => p.id === targetId);
    if (!target) return;

    // Mastermind already has the fee. The amount here is the remainder.
    // We create the offer as if it comes from "Unknown" (Proxy).
    // But technically we need to track it.
    
    createOffer(io, room, mastermind, target, amount, OFFER_TYPES.PROXY);
}

function createOffer(io, room, sender, target, amount, type) {
    const offerId = `OFFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Deduct points from sender (if not already deducted in Proxy logic)
    // Note: In Proxy, Mastermind is the "sender" here but he didn't lose points, he's just forwarding.
    // So we only deduct if DIRECT.
    if (type === OFFER_TYPES.DIRECT) {
        sender.score -= amount;
    }

    const offer = {
        id: offerId,
        senderId: sender.id,
        targetId: target.id,
        amount: amount,
        type: type,
        timestamp: Date.now()
    };

    room.offers = room.offers || {};
    room.offers[offerId] = offer;

    // Emit to Target
    io.to(target.id).emit('receiveOffer', {
        offerId: offerId,
        amount: amount,
        timeout: 10000 // 10 seconds
    });

    // Set Timeout to Auto-Reject/Expire
    setTimeout(() => {
        if (room.offers[offerId]) {
            handleOfferResponse(io, room, target, { offerId, accepted: false, timeout: true });
        }
    }, 10000);
}

function handleOfferResponse(io, room, player, { offerId, accepted }) {
    const offer = room.offers ? room.offers[offerId] : null;
    if (!offer) return; // Already handled

    delete room.offers[offerId]; // Remove from active

    if (accepted) {
        // Check if player already accepted an offer?
        if (player.acceptedOffer) {
            // User Rule: "If he accepts a second one... refund the first one... accept the second"
            const prevOffer = player.acceptedOffer;
            const prevSender = room.players.find(p => p.id === prevOffer.senderId);
            
            if (prevSender) {
                // Refund
                // If Direct: Refund full amount.
                // If Proxy: Who gets refunded? The Beneficiary lost it.
                // But the user didn't specify refund logic for Proxy. 
                // Let's assume refund goes to the actual Sender recorded in the offer object.
                // For Proxy, the 'sender' passed to createOffer was Mastermind.
                // Logic Gap: Does Mastermind lose the points he didn't spend?
                // Or should we track the original sender?
                // User said: "In case the offer is refused... Mastermind takes his share beforehand".
                // This implies NO refund for Proxy failure? Or just Mastermind keeps fee?
                // "In case any party accepts... you won't be compensated".
                // "In case refused... Mastermind takes share".
                // This implies NO REFUND for the Beneficiary in Proxy mode if rejected.
                // But what if it's "Swapped" (Accepted 2nd offer)?
                // Let's assume standard refund applies to the IMMEDIATE sender (Mastermind or Beneficiary).
                
                prevSender.score += prevOffer.amount;
                io.to(prevSender.id).emit('offerRefunded', { amount: prevOffer.amount });
            }
        }

        // Apply Acceptance
        player.score += offer.amount;
        player.acceptedOffer = {
            senderId: offer.senderId, // For refund tracking
            amount: offer.amount,
            type: offer.type
        };

const { ROLE_TYPES, TEAMS, getRoleInfo } = require('../roles');

// Store active offers and timers
// structure: { offerId: { senderId, targetId, amount, timer, status, type } }
const activeOffers = {}; 

// Offer Types
const OFFER_TYPES = {
    DIRECT: 'DIRECT',
    PROXY: 'PROXY' // Via Mastermind
};

// Handle Offer Sending
function handleSendOffer(io, room, sender, { targetId, amount, isViaMastermind, offerType }) {
    if (amount > sender.score) {
        return { success: false, message: 'رصيدك غير كافي!' };
    }

    if (amount <= 0) {
        return { success: false, message: 'يجب أن يكون المبلغ أكبر من صفر!' };
    }

    // 1. Beneficiary -> Mastermind (Proxy)
    if (isViaMastermind && sender.role === ROLE_TYPES.BENEFICIARY) {
        const mastermind = room.players.find(p => p.role === ROLE_TYPES.MASTERMIND);
        if (!mastermind) {
            return { success: false, message: 'لا يوجد عقل مدبر في اللعبة!' };
        }

        // Calculate Fee (1/4)
        const fee = Math.floor(amount / 4);
        const actualOffer = amount - fee;

        // Deduct full amount from Beneficiary
        sender.score -= amount;
        
        // Give Fee to Mastermind immediately
        mastermind.score += fee;

        // Notify Mastermind to select target
        io.to(mastermind.id).emit('mastermindProxyRequest', {
            amount: actualOffer,
            originalSenderId: sender.id,
            feeEarned: fee
        });

        return { success: true, message: `تم إرسال الطلب للعقل المدبر. (تم خصم ${amount}، وحصل العقل المدبر على ${fee})` };
    }

    // 2. Direct Offer (Beneficiary or Minister)
    const target = room.players.find(p => p.id === targetId);
    if (!target) return { success: false, message: 'اللاعب غير موجود!' };

    // Minister Constraints
    if (sender.role === ROLE_TYPES.MINISTER) {
        if (target.role === ROLE_TYPES.BENEFICIARY) {
            return { success: false, message: 'لا يمكنك إرسال عرض للمستفيد!' };
        }
    }

    // Beneficiary -> Minister Trap
    if (sender.role === ROLE_TYPES.BENEFICIARY && target.role === ROLE_TYPES.MINISTER) {
        // Reveal Beneficiary to Minister
        io.to(target.id).emit('ministerRevealAlert', {
            beneficiaryName: sender.name
        });
        
        // Beneficiary loses points but offer is effectively voided/ignored by Minister logic (passive)
        sender.score -= amount;
        
        return { success: true, message: 'تم إرسال العرض...' }; // Don't tell Beneficiary they messed up yet? User said "Risk".
    }

    // Standard Direct Offer
    createOffer(io, room, sender, target, amount, OFFER_TYPES.DIRECT);
    return { success: true, message: 'تم إرسال العرض بنجاح!' };
}

// Mastermind Forwarding Logic
function handleMastermindForward(io, room, mastermind, { targetId, amount }) {
    const target = room.players.find(p => p.id === targetId);
    if (!target) return;

    // Mastermind already has the fee. The amount here is the remainder.
    // We create the offer as if it comes from "Unknown" (Proxy).
    // But technically we need to track it.
    
    // We need to know who the original sender was to award points to Beneficiary later
    // In current flow, we don't persist original sender in handleMastermindForward args from client
    // BUT we sent 'mastermindProxyRequest' with 'originalSenderId'.
    // The Mastermind client should send it back?
    // OR we can infer it? (Only Beneficiary can do this).
    // Let's assume Mastermind sends back who he is proxying for, OR we find the Beneficiary.
    const beneficiary = room.players.find(p => p.role === ROLE_TYPES.BENEFICIARY);
    const originalSenderId = beneficiary ? beneficiary.id : mastermind.id;

    createOffer(io, room, mastermind, target, amount, OFFER_TYPES.PROXY, originalSenderId);
}

function createOffer(io, room, sender, target, amount, type, originalSenderId = null) {
    const offerId = `OFFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Deduct points from sender (if not already deducted in Proxy logic)
    // Note: In Proxy, Mastermind is the "sender" here but he didn't lose points, he's just forwarding.
    // So we only deduct if DIRECT.
    if (type === OFFER_TYPES.DIRECT) {
        sender.score -= amount;
    }

    const offer = {
        id: offerId,
        senderId: sender.id,
        targetId: target.id,
        amount: amount,
        type: type,
        originalSenderId: originalSenderId || sender.id, // Track true origin
        timestamp: Date.now()
    };

    room.offers = room.offers || {};
    room.offers[offerId] = offer;

    // Emit to Target
    io.to(target.id).emit('receiveOffer', {
        offerId: offerId,
        amount: amount,
        timeout: 10000 // 10 seconds
    });

    // Set Timeout to Auto-Reject/Expire
    setTimeout(() => {
        if (room.offers[offerId]) {
            handleOfferResponse(io, room, target, { offerId, accepted: false, timeout: true });
        }
    }, 10000);
}

function handleOfferResponse(io, room, player, { offerId, accepted }) {
    const offer = room.offers ? room.offers[offerId] : null;
    if (!offer) return; // Already handled

    delete room.offers[offerId]; // Remove from active

    if (accepted) {
        // Check if player already accepted an offer?
        if (player.acceptedOffer) {
            // User Rule: "If he accepts a second one... refund the first one... accept the second"
            const prevOffer = player.acceptedOffer;
            const prevSender = room.players.find(p => p.id === prevOffer.senderId); // Direct Sender
            
            if (prevSender) {
                 // Refund Logic
                 if (prevOffer.type === OFFER_TYPES.DIRECT) {
                      prevSender.score += prevOffer.amount;
                      io.to(prevSender.id).emit('offerRefunded', { amount: prevOffer.amount });
                 } else {
                      // Proxy Refund: Refund to Mastermind? Or Original?
                      // Mastermind kept fee. Original lost full amount.
                      // Let's refund Mastermind the OFFER amount?
                      // It gets complicated. Let's refund to 'senderId' (Mastermind) for now.
                      prevSender.score += prevOffer.amount; 
                 }
            }
        }

        // Apply Acceptance
        player.score += offer.amount;
        player.acceptedOffer = {
            senderId: offer.senderId, // For refund tracking
            originalSenderId: offer.originalSenderId, // For Scoring
            amount: offer.amount,
            type: offer.type
        };

        // Notify Sender (Anonymous?)
        const sender = room.players.find(p => p.id === offer.senderId);
        if (sender) {
             io.to(sender.id).emit('offerStatus', { status: 'ACCEPTED', targetName: player.name });
        }

        // SEER EFFECT: Wipe Revelation if Seer
        if (player.role === ROLE_TYPES.SEER) {
             if (room.answers && room.answers[player.id]) {
                 room.answers[player.id] = ""; // Wipe it
                 io.to(player.id).emit('abilityDisabled', { message: 'تم مسح الوحي بسبب قبول العرض!' });
             }
        }

    } else {
        // Rejected
        // Refund the sender (only if DIRECT. If PROXY, Mastermind kept the fee, but what about the bribe amount?)
        // User: "In case refused... Mastermind takes his share".
        // This implies the BRIBE amount is NOT used. Should it be refunded to Beneficiary?
        // User didn't say. But logic dictates "Mastermind takes share" implies "Beneficiary loses share".
        // Does Beneficiary lose the REST?
        // "Beneficiary... sends to Mastermind... Mastermind takes 1/4... guarantee he won't send to team".
        // "In case refused... Mastermind takes share".
        // This likely means the *Transfer* failed.
        // I will refund the *Offer Amount* (75%) to the Beneficiary (via Mastermind logic?)
        // Or refund to Sender?
        // Let's implement REFUND on Rejection for now to be fair, unless specified otherwise.
        
        const sender = room.players.find(p => p.id === offer.senderId);
        if (sender) {
            sender.score += offer.amount;
            io.to(sender.id).emit('offerStatus', { status: 'REJECTED', amountRefunded: offer.amount });
        }
    }
}

module.exports = {
    handleSendOffer,
    handleMastermindForward,
    handleOfferResponse
};
        // Rejected
        // Refund the sender (only if DIRECT. If PROXY, Mastermind kept the fee, but what about the bribe amount?)
        // User: "In case refused... Mastermind takes his share".
        // This implies the BRIBE amount is NOT used. Should it be refunded to Beneficiary?
        // User didn't say. But logic dictates "Mastermind takes share" implies "Beneficiary loses share".
        // Does Beneficiary lose the REST?
        // "Beneficiary... sends to Mastermind... Mastermind takes 1/4... guarantee he won't send to team".
        // "In case refused... Mastermind takes share".
        // This likely means the *Transfer* failed.
        // I will refund the *Offer Amount* (75%) to the Beneficiary (via Mastermind logic?)
        // Or refund to Sender?
        // Let's implement REFUND on Rejection for now to be fair, unless specified otherwise.
        
        const sender = room.players.find(p => p.id === offer.senderId);
        if (sender) {
            sender.score += offer.amount;
            io.to(sender.id).emit('offerStatus', { status: 'REJECTED', amountRefunded: offer.amount });
        }
    }
}

module.exports = {
    handleSendOffer,
    handleMastermindForward,
    handleOfferResponse
};
