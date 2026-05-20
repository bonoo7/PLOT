const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');
const logger = require('./utils/logger');
const db = require('./database');
const phases = require('./game/phases');
const { rooms } = require('./state');
const registerAdminRoutes = require('./routes/adminRoutes');
const registerHandlers = require('./sockets/registerHandlers');
const { handleSendOffer, handleMastermindForward, handleOfferResponse } = require('./logic/offers');
const { calculateScores } = require('./logic/scoring');
const { testConnection } = require('./githubAI'); // Note: assuming it or its proxy is here, wait I'll check its path 
require('dotenv').config();  // تحميل متغيرات البيئة

// ============================================
// 🔍 Sentry — تتبع الأخطاء في الإنتاج
// ============================================
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV || 'production',
    });
    logger.info('✅ Sentry error tracking initialized');
}

const app = express();

// تقييد CORS بالنطاقات المسموح بها فقط
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// 🚦 Rate Limiting — الحماية من إساءة الاستخدام
// ============================================
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // دقيقة واحدة
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/admin', adminLimiter);
app.use('/health', apiLimiter);

// Redirect legacy paths to root
app.get(['/host.html', '/player.html'], (req, res) => {
    res.redirect('/');
});

// ============================================
// 🛡️ ADMIN DASHBOARD (Extracted)
// ============================================
registerAdminRoutes(app);

// ============================================
// ❤️ Health Check — لمراقبة حالة الخادم
// ============================================
app.get('/health', (req, res) => {
    const { rooms } = require('./state');
    res.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        activeRooms: Object.keys(rooms).length,
        activeConnections: io ? io.engine.clientsCount : 0,
        timestamp: new Date().toISOString()
    });
});

// Handle SPA routing - send index.html for all other routes
app.get(/^(?!\/admin)(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    upgrade: true,
});

// ============================================
// 🚦 Socket.IO Rate Limiting — منع الاتصالات المفرطة
// ============================================
const socketConnectionCounts = new Map(); // ip → { count, resetAt }
const SOCKET_RATE_LIMIT = parseInt(process.env.SOCKET_RATE_LIMIT || '20');  // max per window
const SOCKET_RATE_WINDOW = 60 * 1000; // 1 minute

io.use((socket, next) => {
    const ip = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || socket.handshake.address
        || 'unknown';

    const now = Date.now();
    const entry = socketConnectionCounts.get(ip);

    if (!entry || now > entry.resetAt) {
        socketConnectionCounts.set(ip, { count: 1, resetAt: now + SOCKET_RATE_WINDOW });
        return next();
    }

    if (entry.count >= SOCKET_RATE_LIMIT) {
        logger.warn(`Socket rate limit exceeded for IP: ${ip} (${entry.count} connections)`);
        return next(new Error('Rate limit exceeded. Too many connections from this IP.'));
    }

    entry.count++;
    next();
});

// تنظيف Map كل 5 دقائق لمنع تسرب الذاكرة
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of socketConnectionCounts) {
        if (now > entry.resetAt) socketConnectionCounts.delete(ip);
    }
}, 5 * 60 * 1000);

// 1. تمرير كائن الـ socket server لمرحلة اللعبة
phases.initPhases(io);

// 2. تسجيل الاستماع للأحداث (Sockets)
registerHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT}`);

    // اختبار الاتصال بـ GitHub Models AI
    logger.info('🔍 Testing GitHub Models AI connection...');
    const isConnected = await testConnection();

    if (isConnected) {
        logger.info('✅ GitHub Models AI: متصل وجاهز للاستخدام');
        logger.info('🤖 البوتات ستستخدم الذكاء الصناعي (GPT-4o-mini) لتوليد إجابات واقعية');
    } else {
        logger.warn('⚠️ GitHub Models AI: غير متصل - سيتم استخدام القوالب الافتراضية');
    }
});

// ============================================
// 🛡️ Global Error Handlers — منع انهيار الخادم
// ============================================
process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { message: err.message, stack: err.stack });
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
    // لا نوقف الخادم — نسجّل الخطأ فقط
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('unhandledRejection', { reason: String(reason) });
    if (process.env.SENTRY_DSN && reason instanceof Error) Sentry.captureException(reason);
});

// ============================================
// 🔒 Graceful Shutdown — إغلاق نظيف عند إيقاف الخادم
// ============================================
let isShuttingDown = false;
function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`${signal} received — closing server gracefully...`);

    // إجبار الخروج بعد 5 ثوانٍ
    const forceExit = setTimeout(() => {
        logger.warn('Forced shutdown after timeout');
        process.exit(1);
    }, 5000);
    forceExit.unref(); // لا يمنع Node من الخروج الطبيعي

    // إغلاق اتصالات Socket.IO
    io.close(() => logger.info('All Socket.IO connections closed'));

    // إغلاق جميع اتصالات HTTP المفتوحة فوراً ثم إيقاف الخادم
    if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
    }
    server.close(() => {
        logger.info('HTTP server closed');
        clearTimeout(forceExit);
        process.exit(0);
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK')); // Windows Ctrl+C
