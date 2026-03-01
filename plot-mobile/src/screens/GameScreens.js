/**
 * GameScreens.js - Barrel Export File
 * 
 * هذا الملف يُعيد تصدير الشاشات من ملفاتها المنفصلة للحفاظ على التوافقية
 * مع AppNavigator.js وأي ملف يستورد منه.
 *
 * الشاشات المنفصلة:
 *   - game/GameScreen.js     — شاشة الكشف عن الهوية السرية
 *   - game/DraftingScreen.js — شاشة كتابة التقرير (كلاسيك + بلتز)
 */

export { GameScreen } from './game/GameScreen';
export { DraftingScreen } from './game/DraftingScreen';
