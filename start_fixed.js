#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// 1. Get local IP address dynamically
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();

// 2. Update plot-mobile/.env with current IP so Expo uses correct server
const envContent = `EXPO_PUBLIC_DEV_SERVER_IP=${localIP}
EXPO_PUBLIC_DEV_SERVER_PORT=3000
EXPO_PUBLIC_PROD_SERVER_URL=http://${localIP}:3000
`;
fs.writeFileSync(path.join(__dirname, 'plot-mobile', '.env'), envContent);

console.log('\n' + '═'.repeat(60));
console.log('🎮 الحبكة - THE PLOT GAME (DEVELOPMENT)');
console.log('═'.repeat(60) + '\n');
console.log(`📱 خادم اللعبة: http://${localIP}:3000`);
console.log(`🌐 لفتح اللعبة على المتصفح: انتظر ثوانٍ، ثم اضغط حرف 'w' في التيرمنال`);
console.log(`📱 لفتح اللعبة على الجوال: امسح الـ QR Code الخاص بـ Expo Go من الشاشة أدناه\n`);

const qrcode = require('qrcode-terminal');
const mobileUrl = `exp://${localIP}:8081`; // استخدام مسار التطبيق الافتراضي لـ Expo
qrcode.generate(mobileUrl, { small: true });

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 3. Build web before starting dev servers
console.log('🔨 جاري بناء نسخة الويب (expo export)...\n');
const buildResult = spawnSync(
    npmCmd,
    ['run', 'build:web'],
    { cwd: path.join(__dirname, 'plot-mobile'), stdio: 'inherit', shell: true }
);
if (buildResult.status !== 0) {
    console.log('\n⚠️ تحذير: فشل بناء الويب، لكن سيتم المتابعة...\n');
} else {
    console.log('\n✅ تم بناء الويب بنجاح!\n');
}

// 4. Start both using concurrently (with stdio: inherit for interactive Expo terminal!)
const child = spawn(
    npmCmd,
    ['run', 'start:dev'],
    { stdio: 'inherit', shell: true }
);

child.on('close', (code) => {
    process.exit(code);
});
