const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// مسار قاعدة البيانات — يمكن تغييره عبر متغير بيئي (خارج مجلد الكود)
const DB_FILE = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, 'db.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
    const initialData = { players: {}, matches: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// قراءة متزامنة (تُستخدم فقط عند بدء التشغيل)
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading DB:', err);
        return { players: {}, matches: [] };
    }
}

// ============================================
// 🔒 Atomic Write بـ Promise Lock لمنع Race Conditions
// ============================================
let writeLock = Promise.resolve();

async function writeDB(data) {
    writeLock = writeLock.then(async () => {
        const temp = DB_FILE + '.tmp';
        try {
            await fsPromises.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
            await fsPromises.rename(temp, DB_FILE); // عملية ذرية: لا يحدث تلف عند التعطل
        } catch (err) {
            console.error('Error writing DB:', err);
            // تنظيف الملف المؤقت إذا فشلت العملية
            try { await fsPromises.unlink(temp); } catch (_) {}
        }
    });
    return writeLock;
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

    updatePlayerStats: async (name, stats) => {
        // استخدم lock لضمان عدم فقدان بيانات عند التزامن
        writeLock = writeLock.then(async () => {
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
            if (stats.role) {
                p.rolesPlayed[stats.role] = (p.rolesPlayed[stats.role] || 0) + 1;
            }
            await writeDB(data);
        });
        return writeLock;
    },

    saveMatch: async (matchData) => {
        writeLock = writeLock.then(async () => {
            const data = readDB();
            data.matches.push({ ...matchData, timestamp: new Date().toISOString() });
            await writeDB(data);
        });
        return writeLock;
    },

    getLeaderboard: () => {
        const data = readDB();
        return Object.values(data.players)
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 10);
    }
};

module.exports = db;
