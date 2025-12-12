# 📝 خطوات الرفع على GitHub

## معلوماتك:
- **اسم المستخدم**: bonoo7
- **البريد**: 6rga3ah511@gmail.com

## لإكمال الرفع:

### الخطوة 1: إنشاء مستودع GitHub جديد
1. اذهب إلى: https://github.com/new
2. أدخل:
   - Repository name: `plot-game`
   - Description: `Interactive party deduction game for 3-10 players`
   - اختر: Public
3. اضغط: Create repository

### الخطوة 2: إنشاء GitHub Personal Access Token
1. اذهب إلى: https://github.com/settings/tokens
2. اضغط: "Generate new token (classic)"
3. ملء البيانات:
   - Note: plot-game-upload
   - Expiration: 90 days
   - Select scopes: اختر "repo"
4. اضغط: Generate token
5. **انسخ التوكن الطويل** (مهم جداً!)

### الخطوة 3: الرفع من PowerShell

بعد إنشاء التوكن، افتح PowerShell واكتب:

```powershell
cd C:\Users\6rga3\plot

git remote add origin https://github.com/bonoo7/plot-game.git

git branch -M main

git push -u origin main
```

عند طلب كلمة المرور:
- **Username**: bonoo7
- **Password**: (الصق التوكن هنا)

## ملاحظات مهمة:
⚠️ التوكن حساس جداً - لا تشاركه مع أحد
⚠️ التوكن سيظهر مرة واحدة فقط - انسخه فوراً
⚠️ إذا ضعت التوكن، أنشئ واحداً جديداً

## بعد الرفع:
✅ ستظهر رسالة: "Branch 'main' set up to track remote branch 'main' from 'origin'."
✅ اذهب إلى: https://github.com/bonoo7/plot-game
✅ يجب أن ترى جميع الملفات
