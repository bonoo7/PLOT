# 🚀 خطوات الرفع على GitHub

## الخطوة 1: إنشاء مستودع GitHub جديد

1. اذهب إلى https://github.com/new
2. أملء الحقول:
   - **Repository name**: `plot-game`
   - **Description**: `Interactive party deduction game for 3-10 players`
   - **Public** (اختر هذا الخيار)
   - بدون README, .gitignore, أو LICENSE (لديك بالفعل)
3. اضغط "Create repository"

---

## الخطوة 2: الرفع من سطر الأوامر

**استبدل `YourUsername` باسم حسابك على GitHub:**

```bash
cd C:\Users\6rga3\plot

# ربط المستودع البعيد
git remote add origin https://github.com/YourUsername/plot-game.git

# إعادة تسمية الفرع الرئيسي
git branch -M main

# رفع الملفات
git push -u origin main
```

---

## الخطوة 3: التحقق من الرفع

- اذهب إلى https://github.com/YourUsername/plot-game
- تأكد من ظهور جميع الملفات والمجلدات
- التحقق من README.md يظهر على الصفحة الرئيسية

---

## الخطوة 4: تكوين المستودع (اختياري لكن موصى به)

### أضف وصفاً:
1. اضغط Settings
2. اضغط Edit في "About"
3. أضف الوصف والـ Topics

### فعّل الميزات:
1. **Discussions**: للأسئلة والنقاش
2. **Projects**: لتتبع المهام
3. **Actions** (اختياري): للاختبارات التلقائية

---

## ملفات git الحالية

✅ تم بالفعل:
- git init
- 4 commits منطقية
- .gitignore جاهز
- LICENSE موجود
- جميع الملفات في المرحلة (staged)

---

## بعد الرفع: الخطوات التالية

### 1. تفعيل Discussions
```
Settings > Discussions > Enable for this repository
```

### 2. إضافة GitHub Pages (اختياري)
```
Settings > Pages > Select main branch > /root folder
```

### 3. إنشاء Release
```
تحت Code > Releases > Create a new release
- Tag: v1.0.0
- Title: Version 1.0.0 - Initial Release
- Description: [انسخ من PROJECT_COMPLETION_SUMMARY.md]
```

---

## الأوامر السريعة للمستقبل

```bash
# إنشاء فرع جديد
git checkout -b feature/your-feature-name

# رفع التغييرات
git add .
git commit -m "type: description"
git push origin feature/your-feature-name

# إنشاء Pull Request من GitHub UI
```

---

## المشاكل الشائعة والحلول

### المشكلة: "fatal: pathspec 'plot-mobile' did not match any files"
**الحل**: تم إضافة plot-mobile كـ git submodule. هذا طبيعي وآمن.

### المشكلة: "Permission denied (publickey)"
**الحل**: 
```bash
# تحقق من SSH keys
ssh -T git@github.com

# أو استخدم HTTPS بدلاً من SSH
```

### المشكلة: "branch main set up to track remote branch main from origin"
**الحل**: هذا رسالة نجاح، وليس خطأ ✅

---

## التحقق من الرفع الناجح

```bash
# تحقق من الاتصال
git remote -v

# النتيجة المتوقعة:
# origin  https://github.com/YourUsername/plot-game.git (fetch)
# origin  https://github.com/YourUsername/plot-game.git (push)
```

---

## الروابط المهمة بعد الرفع

- **Repository**: `https://github.com/YourUsername/plot-game`
- **Issues**: `https://github.com/YourUsername/plot-game/issues`
- **Discussions**: `https://github.com/YourUsername/plot-game/discussions`
- **Projects**: `https://github.com/YourUsername/plot-game/projects`

---

## ملخص الحالة الحالية

| العنصر | الحالة |
|------|--------|
| Git Repository | ✅ مهيأ |
| Commits | ✅ 4 commits جاهزة |
| .gitignore | ✅ موجود |
| LICENSE | ✅ MIT License |
| Documentation | ✅ شامل |
| Ready for GitHub | ✅ نعم |

---

**المشروع جاهز 100% للرفع على GitHub! 🎉**
