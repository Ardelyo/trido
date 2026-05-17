@echo off
title Trido - AI Digital Classroom
color 0B
echo.
echo  =========================================
echo   Trido - AI-Powered Digital Classroom
echo  =========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js is not installed.
  echo Please download and install Node.js from https://nodejs.org
  echo Then run this file again.
  echo.
  :: Try to open nodejs.org in browser
  start "" "https://nodejs.org"
  pause
  exit /b 1
)

echo [1/3] Node.js found: 
node --version

echo [2/3] Installing dependencies (first run may take ~30 seconds)...
call npm install --omit=dev --prefer-offline --silent 2>nul
if %errorlevel% neq 0 (
  call npm install --omit=dev --silent
)

echo [3/3] Starting Trido server...
echo.
echo  =========================================
echo   Server ready at: http://localhost:3000
echo   Press Ctrl+C to stop.
echo  =========================================
echo.

:: Launch browser after 3 seconds in background
start "" /b cmd /c "timeout /t 3 /nobreak >nul && call :OpenBrowser"
goto :StartServer

:OpenBrowser
:: Try Chrome first, then Edge, then default browser
set CHROME_PATH=
for %%p in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
  if exist %%p ( set CHROME_PATH=%%p & goto :LaunchChrome )
)
:LaunchChrome
if defined CHROME_PATH (
  start "" %CHROME_PATH% --app=http://localhost:3000 --window-size=1400,900 --disable-extensions
  goto :eof
)

:: Try Edge
for %%p in (
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do (
  if exist %%p (
    start "" %%p --app=http://localhost:3000 --window-size=1400,900
    goto :eof
  )
)

:: Fall back to default browser
start "" "http://localhost:3000"
goto :eof

:StartServer
npm start
pause
