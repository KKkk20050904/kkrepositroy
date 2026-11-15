@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   校园闲置交易 - 模块2（发布/上传）一键启动
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] 没找到 Node.js，请先安装 Node 18 或更高版本：https://nodejs.org
  pause
  exit /b 1
)

echo [1/4] 检查并安装后端依赖...
if not exist "server\node_modules" (
  pushd server
  call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
  if errorlevel 1 (
    echo [X] 依赖安装失败，检查网络后重试
    popd & pause & exit /b 1
  )
  popd
) else (
  echo       依赖已就绪，跳过
)

echo [2/4] 准备数据库（建库、建表、分类种子）...
node scripts\setup-db.cjs
if errorlevel 1 (
  echo [X] 数据库准备失败，按上面的提示处理
  pause
  exit /b 1
)

echo [3/4] 启动后端服务...
start "模块2 后端" cmd /c "cd /d %~dp0server && node app.js"
timeout /t 4 /nobreak >nul

echo [4/4] 自测接口（注册 → 上传 → 发布 → 列表 → 详情）...
node scripts\smoke-test.cjs
echo.
echo 浏览器打开： http://127.0.0.1:3000/api/health
echo 想造几件示例商品： node scripts/seed-goods.cjs
echo 关闭：直接关掉「模块2 后端」窗口
pause
