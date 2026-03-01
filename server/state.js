/**
 * server/state.js
 * 
 * يحتوي على حالة الخادم العامة.
 * تخزين `rooms` هنا يمنع أخطاء الاستيراد الدائري (Circular Dependencies)
 * بين ملفات الأحداث وملفات تشغيل المراحل.
 */

// كائن جميع الغرف النشطة في الذاكرة
const rooms = {};

module.exports = {
    rooms
};
