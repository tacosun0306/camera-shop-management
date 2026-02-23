@echo off
chcp 65001 >nul
title 相機店管理系統 - 雲端部署助手

cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║        相機店管理系統 - 雲端部署助手                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 此助手將協助您將系統部署到雲端
echo.
echo ════════════════════════════════════════════════════════════
echo.

REM 檢查 Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未安裝 Git！
    echo.
    echo 請先安裝 Git: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
echo ✅ Git 已安裝

REM 檢查是否已初始化
if not exist ".git" (
    echo.
    echo [步驟 1/4] 初始化 Git 倉庫...
    git init
    git config user.name "Camera Shop"
    git config user.email "camera@example.com"
    echo ✅ Git 倉庫已初始化
) else (
    echo ✅ Git 倉庫已存在
)

echo.
echo [步驟 2/4] 添加檔案到 Git...
git add .
echo ✅ 檔案已添加

echo.
echo [步驟 3/4] 提交變更...
git commit -m "部署到雲端" 2>nul
if %errorlevel% equ 0 (
    echo ✅ 變更已提交
) else (
    echo ℹ️  沒有新的變更需要提交
)

echo.
echo [步驟 4/4] 準備推送到 GitHub...
echo.
echo ════════════════════════════════════════════════════════════
echo   接下來的步驟：
echo ════════════════════════════════════════════════════════════
echo.
echo 1️⃣  創建 GitHub 倉庫
echo    → 前往: https://github.com/new
echo    → 倉庫名稱: camera-shop-management
echo    → 選擇 Public（公開）
echo    → 不要勾選任何初始化選項
echo    → 點擊 Create repository
echo.
echo 2️⃣  推送代碼到 GitHub
echo.
set /p github_url="請輸入 GitHub 倉庫網址（例如：https://github.com/用戶名/camera-shop-management.git）: "

if "%github_url%"=="" (
    echo.
    echo ❌ 未輸入倉庫網址
    echo.
    pause
    exit /b 1
)

echo.
echo 正在連接到 GitHub...
git remote remove origin 2>nul
git remote add origin %github_url%
git branch -M main

echo.
echo 正在推送代碼...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo ✅ 代碼已成功推送到 GitHub！
    echo ════════════════════════════════════════════════════════════
    echo.
    echo 🚀 下一步：部署到雲端
    echo.
    echo 📋 後端部署（Render）：
    echo    1. 前往: https://render.com/
    echo    2. 使用 GitHub 登入
    echo    3. 創建 New Web Service
    echo    4. 連接你的倉庫: camera-shop-management
    echo    5. Root Directory: backend
    echo    6. Build Command: npm install ^&^& npm run build
    echo    7. Start Command: npm start
    echo    8. 添加環境變數:
    echo       NODE_ENV = production
    echo       JWT_SECRET = your-secret-key
    echo    9. 點擊 Deploy
    echo.
    echo 🌐 前端部署（Vercel）：
    echo    1. 前往: https://vercel.com/
    echo    2. 使用 GitHub 登入
    echo    3. Import Project
    echo    4. 選擇 camera-shop-management
    echo    5. Root Directory: frontend
    echo    6. Framework: Vite（自動偵測）
    echo    7. 點擊 Deploy
    echo.
    echo 📖 詳細步驟請查看: 雲端部署指南.md
    echo.
) else (
    echo.
    echo ❌ 推送失敗！
    echo.
    echo 可能的原因：
    echo  • GitHub 倉庫網址錯誤
    echo  • 需要先登入 GitHub（執行: git config --global credential.helper wincred）
    echo  • 網路連接問題
    echo.
    echo 💡 手動推送指令：
    echo    git remote add origin %github_url%
    echo    git branch -M main
    echo    git push -u origin main
    echo.
)

pause
