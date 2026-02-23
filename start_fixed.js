#!/usr/bin/env node

const { exec, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const qrcode = require('qrcode-terminal');

// Force IP address as requested
const localIP = '192.168.8.48';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          🎮 الحبكة - THE PLOT GAME (FIXED) 🎮           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`📱 Server IP Address: ${localIP}`);
console.log(`🌐 Web App URL: http://${localIP}:3000 (Browser)\n`);

// Generate QR Code for Mobile App
const mobileUrl = `exp://${localIP}:8082`; // Using 8082 to avoid conflicts
console.log('📱 Scan this QR code with Expo Go App:');
qrcode.generate(mobileUrl, { small: true });
console.log(`Or enter URL manually: ${mobileUrl}\n`);

// Paths
const serverPath = path.join(__dirname, 'server');
const clientPath = path.join(__dirname, 'plot-mobile');

// Build Web App
console.log('🔨 Building Web App (syncing with Mobile)...');
try {
    execSync(`cd "${clientPath}" && npm run build:web`, { stdio: 'inherit' });
    console.log('✅ Web App built successfully!');
} catch (error) {
    console.error('❌ Failed to build Web App:', error.message);
}

// Start server
console.log('\n🚀 Starting server on port 3000...');
// Use PORT environment variable if needed, but for now default to 3000
const server = exec(`cd "${serverPath}" && npm start`, (error, stdout, stderr) => {
    if (error) console.error(`Server error: ${error.message}`);
});

server.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data}`);
});

// Wait for server to start before starting client
setTimeout(() => {
    console.log('\n🚀 Starting mobile app (Port 8082)...');
    // Ensure we bind to the specific IP if possible, or just default (0.0.0.0)
    const client = exec(`cd "${clientPath}" && set REACT_NATIVE_PACKAGER_HOSTNAME=${localIP} && set EXPO_DEVTOOLS_LISTEN_ADDRESS=${localIP} && npx expo start --clear --port 8082 --host lan`, (error, stdout, stderr) => {
        if (error) console.error(`Client error: ${error.message}`);
    });

    client.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        // Display QR code info
        if (output.includes('Expo Go') || output.includes('QR') || output.includes('Scan')) {
            console.log('\n✅ QR Code is displayed above!');
            console.log('📷 Scan the QR code with your phone to run the app\n');
            console.log('⚠️  If you cannot connect, ensure your firewall allows Node.js and Expo.\n');
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
