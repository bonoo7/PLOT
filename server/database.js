const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        players: {},
        matches: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading DB:', err);
        return { players: {}, matches: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing DB:', err);
    }
}

const db = {
    getPlayer: (name) => {
        const data = readDB();
        return data.players[name] || {
            name: name,
            gamesPlayed: 0,
            wins: 0,
            totalScore: 0,
            rolesPlayed: {}
        };
    },

    updatePlayerStats: (name, stats) => {
        const data = readDB();
        if (!data.players[name]) {
            data.players[name] = {
                name: name,
                gamesPlayed: 0,
                wins: 0,
                totalScore: 0,
                rolesPlayed: {}
            };
        }

        const p = data.players[name];
        p.gamesPlayed += 1;
        p.totalScore += stats.score;
        if (stats.isWinner) p.wins += 1;
        
        // Update role stats
        if (stats.role) {
            p.rolesPlayed[stats.role] = (p.rolesPlayed[stats.role] || 0) + 1;
        }

        writeDB(data);
    },

    saveMatch: (matchData) => {
        const data = readDB();
        data.matches.push({
            ...matchData,
            timestamp: new Date().toISOString()
        });
        writeDB(data);
    },

    getLeaderboard: () => {
        const data = readDB();
        return Object.values(data.players)
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 10); // Top 10
    }
};

module.exports = db;
