@echo off
title Campus Secondhand Trade - Backend
cd /d "%~dp0server"

echo ============================================
echo   Campus Secondhand Trade - Backend Service
echo   Database: local MySQL 8.0, port 3306
echo ============================================
echo.

node app.js

if %errorlevel% neq 0 (
  echo.
  echo [FAILED] Please check:
  echo   1. Node.js installed? Run: node -v
  echo   2. npm install done in server folder?
  echo   3. MySQL80 service running? Check services.msc
  pause
)
