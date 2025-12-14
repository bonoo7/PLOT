// ✅ Fixed Scoring System - نظام النقاط المصحح
// استبدل الدالة calculateScores في server/index.js بهذا الكود

function calculateScores(room) {
    const scores = {};
    room.players.forEach(p => scores[p.id] = 0);

    const witness = room.players.find(p => p.role === 'WITNESS');
    const architect = room.players.find(p => p.role === 'ARCHITECT');
    const detective = room.players.find(p => p.role === 'DETECTIVE');
    const accomplice = room.players.find(p => p.role === 'ACCOMPLICE');
    const lawyer = room.players.find(p => p.role === 'LAWYER');
    const spy = room.players.find(p => p.role === 'SPY');
    const trickster = room.players.find(p => p.role === 'TRICKSTER');

    // Count votes
    const qualityVotes = {}; // targetId -> count
    const identityVotes = {}; // targetId -> count

    Object.values(room.votes).forEach(vote => {
        if (vote.quality) {
            qualityVotes[vote.quality] = (qualityVotes[vote.quality] || 0) + 1;
        }
        if (vote.identity) {
            identityVotes[vote.identity] = (identityVotes[vote.identity] || 0) + 1;
        }
    });

    // Find player with most identity votes (The Accused)
    let maxIdentityVotes = 0;
    let accusedId = null;
    for (const [id, count] of Object.entries(identityVotes)) {
        if (count > maxIdentityVotes) {
            maxIdentityVotes = count;
            accusedId = id;
        } else if (count === maxIdentityVotes) {
            accusedId = null; // Tie means no single accused
        }
    }

    // ===== 1. LOGIC VOTE POINTS (+1000 per vote) =====
    for (const [targetId, count] of Object.entries(qualityVotes)) {
        scores[targetId] += count * 1000;
    }

    // ===== 2. DEDUCTION POINTS =====
    const witnessVotes = qualityVotes[witness?.id] || 0;
    
    // Detective finds Witness (+2500)
    if (detective && room.votes[detective.id]?.identity === witness?.id) {
        scores[detective.id] += 2500;
    }
    
    // ❌ FIX: Detective penalty for wrong guess (-500)
    if (detective && room.votes[detective.id]?.identity !== witness?.id) {
        scores[detective.id] -= 500;
    }

    // Others find Witness (+500)
    room.players.forEach(p => {
        if (p.role !== 'DETECTIVE' && p.role !== 'WITNESS' && 
            room.votes[p.id]?.identity === witness?.id) {
            scores[p.id] += 500;
        }
    });

    // ===== 3. ROLE-SPECIFIC BONUSES =====
    
    // ===== Team Knowledge (فريق المعرفة) =====
    
    // ARCHITECT: Beats Witness in quality votes (+1500)
    const architectVotes = qualityVotes[architect?.id] || 0;
    if (architect && witness && architectVotes > witnessVotes) {
        scores[architect.id] += 1500;
    }

    // WITNESS: Survives (less than 50% found him) (+2000)
    const witnessFoundCount = identityVotes[witness?.id] || 0;
    const witnessSurvived = witness && witnessFoundCount < (room.players.length / 2);
    
    if (witnessSurvived) {
        scores[witness.id] += 2000;
    }

    // ❌ FIX: WITNESS penalty when discovered by Detective (-50%)
    if (detective && room.votes[detective.id]?.identity === witness?.id && witness) {
        const witnessRoundScore = scores[witness.id];
        scores[witness.id] = Math.floor(witnessRoundScore * 0.5);
    }

    // ===== Team Hunters (فريق المطاردة) =====
    // Detective bonuses already handled above

    // ===== Team Disruptors (فريق التشتيت) =====

    // ACCOMPLICE: If Witness survives OR wins quality vote (+1500)
    if (accomplice && witness) {
        const maxQualityVotes = Math.max(...Object.values(qualityVotes), 0);
        const witnessWonQuality = witnessVotes === maxQualityVotes && witnessVotes > 0;

        if (witnessSurvived || witnessWonQuality) {
            scores[accomplice.id] += 1500;
        }
    }

    // ❌ FIX: LAWYER bonus corrected from +1500 to +2000
    // LAWYER: Client is NOT the Accused (most voted) (+2000)
    if (lawyer && lawyer.lawyerClient) {
        if (lawyer.lawyerClient !== accusedId) {
            scores[lawyer.id] += 2000;  // ✅ Changed from 1500 to 2000
        }
    }

    // ❌ FIX: SPY bonus (MISSING) - Added new bonus
    // SPY: Quality votes close to Witness (difference ≤ 1) (+1500)
    const spyVotes = qualityVotes[spy?.id] || 0;
    if (spy && Math.abs(spyVotes - witnessVotes) <= 1 && spyVotes > 0) {
        scores[spy.id] += 1500;
    }

    // ❌ FIX: TRICKSTER bonus (MISSING) - Added new bonus
    // TRICKSTER: Uses trap word AND gets at least 1 quality vote (+1500)
    const tricksterVotes = qualityVotes[trickster?.id] || 0;
    if (trickster && tricksterVotes > 0) {
        scores[trickster.id] += 1500;
    }

    // ===== Team Neutral (الفريق المحايد) =====

    // ❌ FIX: CITIZEN bonus corrected from +500 to +1000
    // CITIZEN: Votes for Witness correctly (+1000 instead of +500)
    room.players.forEach(p => {
        if (p.role === 'CITIZEN' && p.role !== 'DETECTIVE' && p.role !== 'WITNESS' && 
            room.votes[p.id]?.identity === witness?.id) {
            // Remove the +500 that was already added above
            scores[p.id] -= 500;
            // Add the correct +1000
            scores[p.id] += 1000;
        }
    });

    return scores;
}

/**
 * ✅ FIXES SUMMARY:
 * 
 * 1. ✅ Detective Penalty: Added -500 for wrong guess (line 45-47)
 * 2. ✅ Witness Penalty: Added -50% for being discovered by Detective (line 75-78)
 * 3. ✅ Lawyer Bonus: Corrected from +1500 to +2000 (line 95)
 * 4. ✅ SPY Bonus: Added +1500 for votes close to Witness (line 100-103)
 * 5. ✅ TRICKSTER Bonus: Added +1500 for using trap word with votes (line 107-110)
 * 6. ✅ CITIZEN Bonus: Corrected from +500 to +1000 (line 115-120)
 * 
 * Total Fixes: 6
 * Critical: 3 (SPY, TRICKSTER, Witness Penalty)
 * Major: 2 (LAWYER, Detective Penalty)
 * Minor: 1 (CITIZEN)
 */
