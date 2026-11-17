@echo off
title Campus Secondhand Trade - Backend
cd /d "%~dp0server"

echo ============================================
echo   Campus Secondhand Trade - Backend Service
echo   Database: local MySQL 8.0, port 3306
echo ============================================
echo.

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo [INFO] Created .env from .env.example
    echo        If your MySQL password is not 123456, edit server\.env first.
    echo.
  )
)

node app.js

if %errorlevel% neq 0 (
  echo.
  echo [FAILED] Please check:
  echo   1. Node.js installed? Run: node -v
  echo   2. npm install done in server folder?
  echo   3. MySQL80 service running? Check services.msc
  echo   4. server\.env database settings correct?
  pause
)
