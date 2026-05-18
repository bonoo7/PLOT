#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const net      = require('net');
const readline = require('readline');
const os       = require('os');
const path     = require('path');
const fs       = require('fs');

// ─────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  gold:   '\x1b[33m\x1b[1m',
};

const W = 60;
function stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
function pad(s, w) { return s + ' '.repeat(Math.max(0, w - stripAnsi(s).length)); }

function header() {
  const title  = '🎮  THE PLOT  |  الحبكة  🎮';
  const inner  = W - 2;
  const spaces = Math.max(0, inner - stripAnsi(title).length);
  const lpad   = Math.floor(spaces / 2);
  const rpad   = spaces - lpad;
  console.log(`\n${C.gold}╔${'═'.repeat(inner)}╗`);
  console.log(`║${' '.repeat(lpad)}${title}${' '.repeat(rpad)}║`);
  console.log(`╚${'═'.repeat(inner)}╝${C.reset}\n`);
}

function section(title) {
  const t = `  ${title}  `;
  const left  = Math.floor((W - stripAnsi(t).length) / 2);
  const right = W - stripAnsi(t).length - left;
  console.log(`\n${C.dim}${'─'.repeat(left)}${C.reset}${C.bold}${t}${C.reset}${C.dim}${'─'.repeat(right)}${C.reset}`);
}

const ok   = (m) => console.log(`  ${C.green}✔${C.reset}  ${m}`);
const warn = (m) => console.log(`  ${C.yellow}⚠${C.reset}  ${m}`);
const fail = (m) => console.log(`  ${C.red}✖${C.reset}  ${m}`);
const info = (m) => console.log(`  ${C.cyan}›${C.reset}  ${m}`);

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name]) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
}

function checkPort(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.unref();
    s.on('error', () => resolve(false));
    s.listen(port, '0.0.0.0', () => { s.close(); resolve(true); });
  });
}

// Kill any process holding the given port (Windows only)
function killPort(port) {
  return new Promise((resolve) => {
    try {
      const find = spawnSync('netstat', ['-ano'], { shell: true });
      const lines = (find.stdout || '').toString().split('\n');
      const pids = new Set();
      lines.forEach(line => {
        const m = line.match(/:(\d+)\s+.*?LISTENING\s+(\d+)/);
        if (m && parseInt(m[1]) === port) pids.add(m[2]);
      });
      if (pids.size === 0) { resolve(false); return; }
      pids.forEach(pid => {
        try { spawnSync('taskkill', ['/PID', pid, '/F'], { shell: true }); } catch {}
      });
      resolve(true);
    } catch { resolve(false); }
  });
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Handle Ctrl+C inside the prompt
    rl.on('SIGINT', () => { rl.close(); console.log(''); process.exit(0); });
    rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
  });
}

async function resolvePort(port, name) {
  const free = await checkPort(port);
  if (free) { ok(`Port ${C.bold}${port}${C.reset}  (${name})`); return port; }

  warn(`Port ${C.yellow}${port}${C.reset} (${name}) is already in use`);
  const answer = await ask(`     ${C.cyan}Kill process on port ${port} and continue? [Y/n]${C.reset} › `);

  if (answer.toLowerCase() === 'n') {
    fail(`Aborted. Free port ${port} and try again.`);
    process.exit(1);
  }

  const killed = await killPort(port);
  if (killed) {
    ok(`Killed process on port ${C.bold}${port}${C.reset}`);
    // Brief wait for OS to free the port
    await new Promise(r => setTimeout(r, 800));
    const nowFree = await checkPort(port);
    if (nowFree) { ok(`Port ${C.bold}${port}${C.reset}  (${name}) — cleared`); return port; }
  }

  // Fallback: use next port
  const next = port + 1;
  warn(`Could not free port ${port}, using ${C.bold}${next}${C.reset} instead`);
  return next;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  process.stdout.write('\x1Bc'); // clear terminal

  header();

  // ── Network ──────────────────────────────────────────────
  section('NETWORK');
  const localIP = getLocalIP();
  ok(`Local IP  →  ${C.bold}${localIP}${C.reset}`);

  // ── Ports ─────────────────────────────────────────────────
  section('PORTS');
  const serverPort = await resolvePort(3000, 'Game Server');
  const expoPort   = await resolvePort(8081, 'Expo / Mobile');

  // ── Config ────────────────────────────────────────────────
  section('CONFIG');
  const envContent =
    `EXPO_PUBLIC_DEV_SERVER_IP=${localIP}\n` +
    `EXPO_PUBLIC_DEV_SERVER_PORT=${serverPort}\n` +
    `EXPO_PUBLIC_PROD_SERVER_URL=http://${localIP}:${serverPort}\n`;
  fs.writeFileSync(path.join(__dirname, 'plot-mobile', '.env'), envContent);
  ok(`.env written  →  server = ${C.bold}${localIP}:${serverPort}${C.reset}`);

  // ── URLs ──────────────────────────────────────────────────
  section('URLS');
  info(`Game Server  →  ${C.bold}http://${localIP}:${serverPort}${C.reset}`);
  info(`Expo Go      →  ${C.bold}exp://${localIP}:${expoPort}${C.reset}`);
  info(`Web Browser  →  press ${C.bold}w${C.reset} in the Expo terminal after start`);

  // ── QR Code ───────────────────────────────────────────────
  section('QR CODE  (scan with Expo Go)');
  try {
    const qrcode = require('qrcode-terminal');
    qrcode.generate(`exp://${localIP}:${expoPort}`, { small: true });
  } catch {
    warn('qrcode-terminal not found — skipping QR');
  }

  // ── Build web ─────────────────────────────────────────────
  section('BUILD');
  console.log(`  ⏳  Building web bundle…\n`);
  const npmCmd = 'npm';
  const build  = spawnSync(npmCmd, ['run', 'build:web'],
    { cwd: path.join(__dirname, 'plot-mobile'), stdio: 'inherit', shell: true });

  if (build.status !== 0) {
    warn('Web build failed — mobile will still work');
  } else {
    ok('Web bundle ready');
  }

  // ── QR Code — Game Server (Web Browser) ───────────────────
  // يظهر بعد البناء مباشرةً ليبقى في أسفل التيرمنال
  section('QR CODE  (Game Server — open in browser 🌐)');
  try {
    const qrcode = require('qrcode-terminal');
    const gameUrl = `http://${localIP}:${serverPort}`;
    console.log(`\n  ${C.bold}${C.cyan}${gameUrl}${C.reset}\n`);
    qrcode.generate(gameUrl, { small: false });
    console.log();
  } catch {
    warn('qrcode-terminal not found — skipping QR');
  }

  // ── Launch ────────────────────────────────────────────────
  section('RUNNING');
  info(`Game Server  on port ${C.bold}${serverPort}${C.reset}`);
  info(`Expo         on port ${C.bold}${expoPort}${C.reset}`);
  console.log(`\n${C.dim}${'─'.repeat(W)}${C.reset}\n`);

  const env = { ...process.env, PORT: String(serverPort) };

  // Spawn server
  const server = spawn(npmCmd, ['start'],
    { cwd: path.join(__dirname, 'server'), stdio: 'inherit', shell: true, env });

  // Spawn Expo with explicit port (avoids the non-interactive prompt)
  const expo = spawn(
    'npx', ['expo', 'start', '--port', String(expoPort)],
    { cwd: path.join(__dirname, 'plot-mobile'), stdio: 'inherit', shell: true, env }
  );

  const cleanup = (code) => {
    try { server.kill(); } catch {}
    try { expo.kill();   } catch {}
    process.exit(code || 0);
  };

  server.on('close', cleanup);
  expo.on('close',   cleanup);
  process.on('SIGINT',  () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));
}

main().catch((e) => { console.error(e); process.exit(1); });
