@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="--open-browser" goto :OpenBrowser

title Trido - AI Smartboard Classroom
color 0B
cls
echo.
echo  =======================================================
echo   TRIDO - AI Smartboard Classroom (Localhost Launcher)
echo  =======================================================
echo.

:: 1. Check if Trido is ALREADY running on port 3000
curl -s --max-time 1 http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
  echo  [OK] Server Trido sudah aktif di http://localhost:3000
  echo  Membuka Trido di browser Anda...
  call "%~f0" --open-browser
  exit /b 0
)

:: 2. Check Node.js installation
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js belum terpasang di komputer ini.
  echo  Silakan unduh dan pasang Node.js dari https://nodejs.org
  start "" "https://nodejs.org"
  pause
  exit /b 1
)

:: 3. Install dependencies ONLY if node_modules is missing (fast & clean, no scary audit spam)
if not exist "node_modules\tsx" (
  echo  [1/2] Menyiapkan komponen aplikasi untuk pertama kali ^(mohon tunggu 1-2 menit^)...
  call npm.cmd install --no-audit --no-fund --loglevel=error
  if %errorlevel% neq 0 (
    echo  [ERROR] Gagal memasang komponen. Pastikan koneksi internet aktif untuk instalasi pertama.
    pause
    exit /b 1
  )
) else (
  echo  [1/2] Komponen aplikasi siap.
)

:: 4. Start Server & Auto-Open Browser
echo  [2/2] Menyalakan Trido AI Smartboard di http://localhost:3000 ...
echo.
echo  =======================================================
echo   STATUS : AKTIF (http://localhost:3000)
echo   TIPS   : Jangan tutup jendela ini selama memakai Trido.
echo            Tekan Ctrl+C jika ingin mematikan server.
echo  =======================================================
echo.

start "" /b cmd /c "timeout /t 2 /nobreak >nul && "%~f0" --open-browser"

if exist "dist\index.html" (
  set "NODE_ENV=production"
) else (
  set "NODE_ENV=development"
)

call npx.cmd tsx server.ts
pause
exit /b 0

:OpenBrowser
set "CHROME_PATH="
for %%p in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
  if exist %%p (
    set "CHROME_PATH=%%~p"
    goto :LaunchChrome
  )
)

:LaunchChrome
if defined CHROME_PATH (
  start "" "%CHROME_PATH%" "http://localhost:3000/?app=true"
  goto :eof
)

for %%p in (
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do (
  if exist %%p (
    start "" "%%~p" "http://localhost:3000/?app=true"
    goto :eof
  )
)

start "" "http://localhost:3000/?app=true"
goto :eof
