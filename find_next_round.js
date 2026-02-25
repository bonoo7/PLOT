const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes("socket.on('nextRound'")) {
        console.log(`Found nextRound at line ${index + 1}: ${line}`);
    }
    if (line.includes("gameMode: 'CLASSIC'")) {
        console.log(`Found gameMode at line ${index + 1}: ${line}`);
    }
});