@echo off
setlocal

cd /d "%~dp0"

set "RELEASE_EXE=src-tauri\target\release\nps_studio_next.exe"
set "DEBUG_EXE=src-tauri\target\debug\nps_studio_next.exe"

if /I "%~1"=="--built" goto RUN_BUILT

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found.
    echo Install Node.js 18+ and try again.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo Starting app in development mode...
call npm run tauri-dev

if errorlevel 1 (
    echo [ERROR] Failed to start app in dev mode.
    echo Tip: run with --built to launch the compiled executable.
    pause
    exit /b 1
)

exit /b 0

:RUN_BUILT

if exist "%RELEASE_EXE%" (
    start "Locus Studio Next" "%RELEASE_EXE%"
    exit /b 0
)

if exist "%DEBUG_EXE%" (
    start "Locus Studio Next" "%DEBUG_EXE%"
    exit /b 0
)

echo [ERROR] Built executable not found.
echo Build it first: npm run tauri build
pause
exit /b 1

endlocal