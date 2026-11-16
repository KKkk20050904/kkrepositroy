@echo off
chcp 65001 >nul
title 校园闲置交易 - 后端服务
cd /d "%~dp0server"

echo ============================================
echo   校园闲置交易 后端服务
echo   数据库：本机 MySQL 8.0（3306，开机自启）
echo ============================================
echo.

node app.js

if %errorlevel% neq 0 (
  echo.
  echo [启动失败] 请确认：
  echo   1. 已安装 Node.js（node -v 可查看）
  echo   2. 在 server 目录执行过 npm install
  echo   3. 本机 MySQL80 服务已启动（services.msc 中查看）
  pause
)
