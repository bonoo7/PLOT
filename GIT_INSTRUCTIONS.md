# تعليمات رفع المشروع على GitHub

## الخطوات:

### 1. إنشاء مستودع جديد على GitHub
- اذهب إلى https://github.com/new
- أدخل اسم المستودع: `plot-game` (أو أي اسم تختاره)
- اختر Public
- بدون README أو gitignore (قد أضفناهما بالفعل)
- اضغط "Create repository"

### 2. ربط المستودع المحلي بـ GitHub
استبدل `YourUsername` باسم حسابك على GitHub:

```bash
cd C:\Users\6rga3\plot

git remote add origin https://github.com/YourUsername/plot-game.git
git branch -M main
git push -u origin main
```

### 3. إضافة وصف المشروع
- اذهب لصفحة المستودع على GitHub
- اضغط Settings > Edit repository details
- أضف الوصف:
  ```
  Interactive party deduction game for 3-10 players
  ```

### 4. إضافة Topics
في نفس الصفحة، أضف:
- `game`
- `party-game`
- `react-native`
- `nodejs`
- `socket-io`
- `arabic`

### 5. تفعيل الميزات (اختياري)
- Discussions: للمناقشات والأفكار
- Wiki: للتوثيق الإضافي

## الأوامر الإجمالية:

```bash
cd C:\Users\6rga3\plot
git remote add origin https://github.com/YourUsername/plot-game.git
git branch -M main
git push -u origin main
```

## بعد الرفع:

يمكنك الآن:
- إنشاء branches جديدة للميزات
- استقبال Pull Requests من المساهمين
- تتبع الأخطاء في Issues
- نشر الإصدارات في Releases

## الملفات المهمة على GitHub:

- **README.md**: يظهر على الصفحة الرئيسية
- **CONTRIBUTING.md**: دليل للمساهمين
- **.gitignore**: ملفات لا تُرفع
- **LICENSE**: الترخيص (يمكنك إضافة MIT License من GitHub)

## الخطوات التالية:

1. أضف LICENSE من GitHub (اضغط Add file -> Create new file)
2. اختر MIT License من القائمة

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge...
```

---

**تم تجهيز المشروع بنجاح! جاهز للرفع على GitHub** ✅
