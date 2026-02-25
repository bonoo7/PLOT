const fs = require('fs');
const lines = fs.readFileSync('server/index.js', 'utf-8').split('\n');
lines.forEach((line, i) => {
    if (line.includes('function createRoom')) {
        console.log(`${i+1}: ${line.trim()}`);
    } else if (line.includes('socket.on(\'createRoom\'')) {
        console.log(`${i+1}: ${line.trim()}`);
    }
});
