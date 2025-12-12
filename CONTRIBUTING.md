# دليل المساهمة - الحبكة

## كيفية البدء

1. استنساخ المشروع
```bash
git clone https://github.com/YourUsername/plot-game.git
cd plot-game
```

2. إنشاء فرع جديد
```bash
git checkout -b feature/your-feature-name
```

3. تثبيت الملفات
```bash
npm install
cd plot-mobile && npm install
cd ..
```

## معايير الكود

### JavaScript/React Native
```javascript
// ✅ صحيح
const handleSubmit = () => {
  console.log('Submitted');
};

// ❌ خاطئ
var handleSubmit = function() {
  console.log('Submitted');
};
```

### التعليقات
```javascript
// استخدم التعليقات للكود المعقد
const calculateScore = (votes) => {
  // حساب النقاط بناءً على عدد الأصوات
  return votes.length * 1000;
};
```

## نمط الـ Commit

```
type(scope): description

[optional body]
[optional footer]
```

### أنواع Commits:
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تعديل التوثيق
- `style`: تنسيق الكود
- `refactor`: إعادة هيكلة الكود
- `test`: إضافة اختبارات

### أمثلة:
```
feat(voting): add detective ability to scan answers

fix(socket): handle disconnect properly on mobile

docs: update installation instructions
```

## قائمة الفحص قبل الـ Pull Request

- [ ] قمت باختبار التغيير محلياً
- [ ] التوثيق محدث
- [ ] الكود يتبع معايير المشروع
- [ ] لا توجد أخطاء في الـ console
- [ ] التغييرات مرتبطة بـ issue أو feature محددة
- [ ] الـ commit messages واضحة

## الإبلاغ عن الأخطاء

عند إنشاء issue، تضمن:
- وصف واضح للمشكلة
- خطوات إعادة الإنتاج
- الخادم المتوقع مقابل الفعلي
- المتصفح/الجهاز المستخدم
- لقطات شاشة إذا أمكن

## الأسئلة والمناقشات

استخدم "Discussions" في GitHub للأسئلة والأفكار العامة.

---

شكراً على مساهمتك! 🎮
