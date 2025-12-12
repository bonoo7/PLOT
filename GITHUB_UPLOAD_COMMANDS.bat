@echo off
REM نسخ هذه الأوامر والصقها في PowerShell واحدة تلو الأخرى

REM الأمر الأول:
cd C:\Users\6rga3\plot

REM الأمر الثاني:
git remote add origin https://github.com/bonoo7/plot-game.git

REM الأمر الثالث:
git branch -M main

REM الأمر الرابع (سيطلب منك كلمة المرور):
git push -u origin main

ECHO.
ECHO اذا لم يعمل، قد تحتاج لإنشاء GitHub Personal Access Token من:
ECHO https://github.com/settings/tokens
ECHO.
