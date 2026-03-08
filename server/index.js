const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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
    // لا نوقف الخادم — نسجّل الخطأ فقط
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('unhandledRejection', { reason: String(reason) });
});

// ============================================
// 🔒 Graceful Shutdown — إغلاق نظيف عند إيقاف الخادم
// ============================================
function gracefulShutdown(signal) {
    logger.info(`${signal} received — closing server gracefully...`);
    io.close(() => {
        logger.info('All Socket.IO connections closed');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });
    // إجبار الخروج بعد 10 ثوانٍ في حال لم تُغلق الاتصالات
    setTimeout(() => {
        logger.warn('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
