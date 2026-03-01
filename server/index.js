const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
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
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Redirect legacy paths to root
app.get(['/host.html', '/player.html'], (req, res) => {
    res.redirect('/');
});

// ============================================
// 🛡️ ADMIN DASHBOARD (Extracted)
// ============================================
registerAdminRoutes(app);

// Handle SPA routing - send index.html for all other routes
app.get(/^(?!\/admin)(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
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
    console.log(`🚀 Server running on port ${PORT}`);

    // اختبار الاتصال بـ GitHub Models AI
    console.log('🔍 Testing GitHub Models AI connection...');
    const isConnected = await testConnection();

    if (isConnected) {
        console.log('✅ GitHub Models AI: متصل وجاهز للاستخدام');
        console.log('🤖 البوتات ستستخدم الذكاء الصناعي (GPT-4o-mini) لتوليد إجابات واقعية');
    } else {
        console.log('⚠️ GitHub Models AI: غير متصل - سيتم استخدام القوالب الافتراضية');
    }
});

// ============================================
// 🛡️ Global Error Handlers — منع انهيار الخادم
// ============================================
process.on('uncaughtException', (err) => {
    console.error('❌ uncaughtException:', err.message);
    console.error(err.stack);
    // لا نوقف الخادم — نسجّل الخطأ فقط
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ unhandledRejection at:', promise, 'reason:', reason);
});
