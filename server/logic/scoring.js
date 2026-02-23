const { TEAMS, ROLE_TYPES, getRoleInfo } = require('../roles');

/**
 * Calculate scores for the round based on V4 rules
 * @param {Object} room - The room object containing players and game state
 * @param {Object} result - The round result (winner, eliminatedPlayer, etc.)
 * @returns {Object} Score calculation results
 */
function calculateScores(room, result) {
    const scores = {};
    const breakdown = {};
    const teamScores = {
        [TEAMS.CRIME]: 0,
        [TEAMS.JUSTICE]: 0
    };

    // Initialize for all players
    room.players.forEach(p => {
        scores[p.id] = 0;
        breakdown[p.id] = [];
    });

    // ==========================================
    // 1. Quality Votes (نقاط جودة السيناريو)
    // ==========================================
    // Rule: +200 points per vote received
    const qualityVoteCounts = {}; 
    const qualityVoteTotal = {}; // How many votes each scenario index got
    
    // Count votes per scenario index
    if (room.qualityVotes) {
        Object.values(room.qualityVotes).forEach(scenarioIndex => {
            qualityVoteTotal[scenarioIndex] = (qualityVoteTotal[scenarioIndex] || 0) + 1;
        });

        // Find max votes for Witness "Best Scenario" check
        let maxVotes = 0;
        Object.values(qualityVoteTotal).forEach(count => {
            if (count > maxVotes) maxVotes = count;
        });

        // Award points
        room.players.forEach((player, index) => {
            const count = qualityVoteTotal[index] || 0;
            
            // Standard Quality Points
            if (count > 0) {
                const points = count * 200;
                scores[player.id] += points;
                breakdown[player.id].push(`✨ جودة السيناريو: +${points} (${count} × 200)`);
            }

            // ==========================================
            // Witness Bonus (الشاهد)
            // ==========================================
            // Rule: +50 per keyword per vote IF voted as "Best Scenario" (Top Voted)
            // Rule: If accepted offer, keywords removed (0 points)
            if (player.role === ROLE_TYPES.WITNESS && count > 0 && count === maxVotes && !player.acceptedOffer) {
                const keywords = room.currentScenario.keywords || [];
                const playerAnswer = room.answers[player.id] || "";
                
                // Count used keywords
                let usedKeywords = 0;
                keywords.forEach(kw => {
                    if (playerAnswer.includes(kw)) usedKeywords++;
                });

                if (usedKeywords > 0) {
                    const witnessPoints = 50 * usedKeywords * count;
                    scores[player.id] += witnessPoints;
                    breakdown[player.id].push(`👁️ الشاهد (أفضل سيناريو): +${witnessPoints} (${usedKeywords} كلمات × ${count} أصوات)`);
                }
            } else if (player.role === ROLE_TYPES.WITNESS && player.acceptedOffer) {
                 breakdown[player.id].push(`❌ الشاهد: تم إلغاء النقاط لقبول العرض`);
            }

            // ==========================================
            // Seer Bonus (العراف)
            // ==========================================
            if (player.role === ROLE_TYPES.SEER) {
                // Check if ability was used (we need to track this in player object or room)
                // Assuming player.abilityUsed is true if they used "Revelation"
                const usedRevelation = player.abilityUsed === true; 
                
                // If accepted offer, revelation is cleared/disabled
                if (player.acceptedOffer) {
                     breakdown[player.id].push(`❌ العرّاف: تم إلغاء الوحي لقبول العرض`);
                } else if (usedRevelation) {
                    // Rule: +500 if used Revelation AND got highest votes
                    if (count > 0 && count === maxVotes) {
                        scores[player.id] += 500;
                        breakdown[player.id].push(`🔮 العرّاف (وحي ناجح): +500`);
                    }
                } else {
                    // Rule: +200 per vote if report is WITHOUT Revelation
                    if (count > 0) {
                        const seerPoints = count * 200;
                        scores[player.id] += seerPoints;
                        breakdown[player.id].push(`🔮 العرّاف (تقرير يدوي): +${seerPoints}`);
                    }
                }
            }
        });
    }

    // ==========================================
    // 2. Win/Loss Logic (Result based)
    // ==========================================
    if (result) {
        const winnerTeam = result.winner;
        
        // Team Win Bonus
        // Rule: Winning Team members get +2000
        room.players.forEach(p => {
            const roleInfo = getRoleInfo(p.role);
            if (roleInfo && roleInfo.team === winnerTeam) {
                const bonus = 2000;
                scores[p.id] += bonus;
                breakdown[p.id].push(`🏆 فوز الفريق: +${bonus}`);
                teamScores[winnerTeam] += bonus;
            }
        });

        // Check Accepted Offers & Award Sender Bonuses (V4 Offer Mechanism)
        room.players.forEach(p => {
             if (p.acceptedOffer) {
                 const { senderId, originalSenderId, type } = p.acceptedOffer;
                 
                 // 1. Beneficiary Bonus (+750)
                 // If original sender was Beneficiary
                 const originalSender = room.players.find(s => s.id === originalSenderId);
                 if (originalSender && originalSender.role === ROLE_TYPES.BENEFICIARY) {
                      scores[originalSender.id] += 750;
                      breakdown[originalSender.id].push(`💰 عرض مقبول: +750`);
                 }

                 // 2. Minister Bonus (+750)
                 if (originalSender && originalSender.role === ROLE_TYPES.MINISTER) {
                      scores[originalSender.id] += 750;
                      breakdown[originalSender.id].push(`📜 عرض مقبول: +750`);
                 }

                 // 3. Mastermind Bonus (+500) - Only if Proxy
                 if (type === 'PROXY') {
                      const proxySender = room.players.find(s => s.id === senderId);
                      if (proxySender && proxySender.role === ROLE_TYPES.MASTERMIND) {
                           scores[proxySender.id] += 500;
                           breakdown[proxySender.id].push(`🧠 عرض وسيط مقبول: +500`);
                      }
                 }
             }
        });

        // ==========================================
        // Individual Role Bonuses
        // ==========================================
        
        // Culprit (الجاني)
        // Rule: If survives (Crime Wins), +500
        if (winnerTeam === TEAMS.CRIME) {
            const culprit = room.players.find(p => p.role === ROLE_TYPES.CULPRIT);
            if (culprit) {
                scores[culprit.id] += 500;
                breakdown[culprit.id].push(`🎭 نجاة الجاني: +500`);
            }
        }
        
        // Detective (المحقق)
        // Rule: +1000 if revealed Culprit WITHOUT Saboteur interference
        // We need to pass investigation result data via room or player properties
        const detective = room.players.find(p => p.role === ROLE_TYPES.DETECTIVE);
        if (detective && detective.investigationTarget && !detective.acceptedOffer) {
            const target = room.players.find(p => p.id === detective.investigationTarget);
            
            // Check if successful finding Culprit
            if (target && target.role === ROLE_TYPES.CULPRIT) {
                // Check if sabotaged. Logic: If target was sabotaged, Detective got wrong result.
                // If the target (Culprit) was sabotaged, they would appear as Justice. 
                // Wait, Saboteur targets a player to FLIP their team.
                // If Culprit (Crime) is sabotaged, they appear as Justice. Detective FAILS to identify.
                // If Detective checks Culprit (Crime) and NOT sabotaged, they see Crime. Detective SUCCEEDS.
                
                // We need to check if the *investigated target* was sabotaged
                const targetWasSabotaged = target.sabotagedBy ? true : false;
                
                if (!targetWasSabotaged) { 
                     scores[detective.id] += 1000;
                     breakdown[detective.id].push(`🕵️‍♂️ كشف الجاني: +1000`);
                }
            }
        } else if (detective && detective.acceptedOffer) {
             breakdown[detective.id].push(`❌ المحقق: تم تعطيل القدرة لقبول العرض`);
        }

        // Saboteur (المخرب)
        // Rule: +1000 if target matches Detective's target AND successfully switched result
        const saboteur = room.players.find(p => p.role === ROLE_TYPES.SABOTEUR);
        if (saboteur && saboteur.sabotageTarget && detective && detective.investigatedTarget) {
            if (saboteur.sabotageTarget === detective.investigatedTarget) {
                // Logic: If detective checked someone, and saboteur targeted THAT someone, 
                // the result WAS flipped. So bonus applies.
                scores[saboteur.id] += 1000;
                breakdown[saboteur.id].push(`🧨 تخريب ناجح: +1000`);
            }
        }

    }

    return { 
        scores, 
        breakdown, 
        teamScores, 
        crimeTeamWon: result ? result.winner === TEAMS.CRIME : false, 
        investigationTeamWon: result ? result.winner === TEAMS.JUSTICE : false,
        culpritCaught: result ? result.winner === TEAMS.JUSTICE : false
    };
}

module.exports = { calculateScores };
