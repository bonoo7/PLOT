#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');
const path = require('path');

// Get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          🎮 الحبكة - THE PLOT GAME 🎮                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`📱 Server IP Address: ${localIP}`);
console.log(`📡 Server URL: http://${localIP}:3000\n`);

// Start server
const serverPath = path.join(__dirname, 'server');
const clientPath = path.join(__dirname, 'plot-mobile');

console.log('🚀 Starting server...');
const server = exec(`cd "${serverPath}" && npm start`, (error, stdout, stderr) => {
    if (error) console.error(`Server error: ${error.message}`);
});

server.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data}`);
});

// Wait for server to start before starting client
setTimeout(() => {
    console.log('\n🚀 Starting mobile app...');
    const client = exec(`cd "${clientPath}" && npx expo start --clear`, (error, stdout, stderr) => {
        if (error) console.error(`Client error: ${error.message}`);
    });

    client.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        // Display QR code info
        if (output.includes('Expo Go') || output.includes('QR') || output.includes('Scan')) {
            console.log('\n✅ QR Code is displayed above!');
            console.log('📷 Scan the QR code with your phone to run the app\n');
        }
    });

    client.stderr.on('data', (data) => {
        console.log(`[CLIENT] ${data}`);
    });
}, 3000);

server.stderr.on('data', (data) => {
    console.log(`[SERVER] ${data}`);
});

console.log('\n✅ Both server and client starting...');
console.log('Press Ctrl+C to stop\n');
