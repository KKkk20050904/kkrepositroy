@echo off
chcp 936 >nul
title 校园闲置物品交易 - 一键启动
cd /d "%~dp0"

echo ==========================================================
echo            校园闲置物品交易小程序  一键启动
echo ==========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] 没找到 Node.js
  echo     先去 https://nodejs.org 装一个 LTS 版本，装完重新双击本文件。
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [OK] Node.js %%v

echo.
echo [1/3] 检查后端依赖...
if not exist "server\node_modules" (
  echo       首次运行，正在安装依赖，大约 1 分钟...
  pushd server
  call npm install --registry=https://registry.npmmirror.com
  if errorlevel 1 (
    echo [X] 依赖安装失败，检查网络后重试。
    popd
    pause
    exit /b 1
  )
  popd
) else (
  echo       依赖已存在，跳过安装。
)

echo.
echo [2/3] 准备数据库，建库建表并导入 12 件示例商品...
chcp 65001 >nul
node scripts\setup-db.cjs
set "DBRC=%errorlevel%"
chcp 936 >nul
if not "%DBRC%"=="0" (
  echo.
  echo [X] 数据库准备失败，常见原因：
  echo     1. MySQL 没启动，先启动 MySQL
  echo     2. root 密码不是 123456，先执行 set DB_PASSWORD=你的密码 再双击本文件
  echo.
  pause
  exit /b 1
)

echo.
echo [3/3] 启动后端服务
echo       这个窗口就是服务本身，关掉窗口等于停止服务。
echo.
echo ----------------------------------------------------------
echo   商品列表  http://localhost:3000/api/goods
echo   健康检查  http://localhost:3000/api/health
echo   分类列表  http://localhost:3000/api/category
echo   前端页面  用 HBuilderX 导入 frontend 目录后运行到浏览器
echo ----------------------------------------------------------
echo.

chcp 65001 >nul
cd server
node app.js

echo.
echo Service stopped. Close this window or press any key.
pause
