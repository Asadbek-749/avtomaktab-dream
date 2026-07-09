@echo off
echo Tizim ishga tushirilmoqda... Iltimos, ikkita qora oyna ochilishini kuting.

:: Fayl turgan asosiy papkaga o'tish (Windows xatolarining oldini olish uchun)
cd /d "%~dp0"

:: Backendni alohida oynada ishga tushirish
start cmd /k "cd backend && npm run dev"

:: Frontendni alohida oynada ishga tushirish
start cmd /k "npm run dev"

echo Barchasi tayyor! Brauzeringizda http://localhost:5173 manzilini oching.
