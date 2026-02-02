# إعدادات متغيرات البيئة - Environment Variables Setup

## نظرة عامة
يستخدم التطبيق متغيرات البيئة لإدارة إعدادات الخادم بشكل ديناميكي، مما يسهل التطوير والإنتاج دون الحاجة لتعديل الكود.

## الملفات المطلوبة
- `.env` - ملف الإعدادات المحلي (غير مضاف لـ Git)

## متغيرات البيئة المتاحة

### للتطوير (Development)
```env
EXPO_PUBLIC_DEV_SERVER_IP=192.168.8.9
EXPO_PUBLIC_DEV_SERVER_PORT=3000
```

**الوصف:**
- `EXPO_PUBLIC_DEV_SERVER_IP`: عنوان IP للخادم المحلي (غير الويب)
- `EXPO_PUBLIC_DEV_SERVER_PORT`: منفذ الخادم (الافتراضي: 3000)

### للإنتاج (Production)
```env
EXPO_PUBLIC_PROD_SERVER_URL=http://localhost:3000
```

**الوصف:**
- `EXPO_PUBLIC_PROD_SERVER_URL`: عنوان URL الكامل للخادم الإنتاجي

## كيفية الاستخدام

### الخطوة 1: إنشاء ملف `.env`
انسخ الإعدادات التالية إلى ملف `.env` في جذر `plot-mobile`:

```env
EXPO_PUBLIC_DEV_SERVER_IP=192.168.8.9
EXPO_PUBLIC_DEV_SERVER_PORT=3000
EXPO_PUBLIC_PROD_SERVER_URL=http://localhost:3000
```

### الخطوة 2: تخصيص الإعدادات
عدّل قيم IP والمنفذ حسب بيئتك:

```bash
# للتطوير على شبكة محلية
EXPO_PUBLIC_DEV_SERVER_IP=192.168.x.x  # استبدل بـ IP جهازك

# للاختبار المحلي
EXPO_PUBLIC_DEV_SERVER_IP=127.0.0.1
```

### الخطوة 3: إعادة تشغيل التطبيق
```bash
# لـ Expo
npx expo start --clear

# أو
npm run start
```

## القيم الافتراضية
إذا لم تُحدد متغيرات البيئة، سيستخدم التطبيق القيم الافتراضية:
- `DEV_SERVER_IP`: `192.168.8.9`
- `DEV_SERVER_PORT`: `3000`
- `PROD_SERVER_URL`: `http://localhost:3000`

## أمثلة شائعة

### تطوير على شبكة محلية WiFi
```env
EXPO_PUBLIC_DEV_SERVER_IP=192.168.1.100
EXPO_PUBLIC_DEV_SERVER_PORT=3000
EXPO_PUBLIC_PROD_SERVER_URL=http://example.com:3000
```

### تطوير محلي فقط
```env
EXPO_PUBLIC_DEV_SERVER_IP=127.0.0.1
EXPO_PUBLIC_DEV_SERVER_PORT=3000
EXPO_PUBLIC_PROD_SERVER_URL=http://localhost:3000
```

### إنتاج على السحابة
```env
EXPO_PUBLIC_PROD_SERVER_URL=https://api.myapp.com
```

## ملاحظات أمان ⚠️
- لا تضع بيانات حساسة أو مفاتيح API في ملف `.env`
- ملف `.env` مُستثنى من Git (موجود في `.gitignore`)
- كل مطور يحتاج لملفه الخاص حسب بيئته
- لا تشارك ملفات `.env` عبر GitHub أو أنظمة التحكم

## استكشاف الأخطاء

**المشكلة:** التطبيق لا يتصل بالخادم
**الحل:**
1. تحقق من أن `.env` موجود وصحيح
2. تأكد من صحة عنوان IP والمنفذ
3. اختبر الاتصال: `ping 192.168.8.9`
4. تحقق من أن الخادم يعمل على المنفذ 3000

**المشكلة:** المتغيرات لا تُقرأ بعد التعديل
**الحل:** أعد تشغيل التطبيق مع `--clear`

## مراجع إضافية
- [Expo Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [React Native Configuration](https://reactnative.dev/docs/environmental-setup)
