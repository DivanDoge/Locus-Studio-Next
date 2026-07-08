@echo off
setlocal enabledelayedexpansion

set "CONFIG_FILE=package.json"

if not exist "%CONFIG_FILE%" (
    echo [ERROR] Cannot find %CONFIG_FILE%. Run this script from the project root.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found.
    echo Install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo [INFO] Syncing version from package.json to Tauri/Cargo files...
call npm run sync-version
if errorlevel 1 (
    echo [ERROR] Version sync failed.
    pause
    exit /b 1
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json).version"`) do (
    set "VERSION=%%A"
)

if "%VERSION%"=="" (
    echo [ERROR] Could not parse version from %CONFIG_FILE%.
    pause
    exit /b 1
)

set "TAG=v%VERSION%"

echo ==========================================
echo  Detected version in %CONFIG_FILE%: %VERSION%
echo  Tag to be created: %TAG%
echo ==========================================
echo.
echo Current git status:
echo ------------------------------------------
git status -s
echo ------------------------------------------
echo.
echo Existing local tags matching v*:
git tag -l "v*"
echo.

set /p CONFIRM="Proceed with commit, push and tag %TAG%? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [CANCELLED] Aborted by user. Nothing was pushed.
    pause
    exit /b 0
)

echo.
echo [1/4] Staging changes...
git add -A

echo.
echo [2/4] Committing...
git commit -m "Release %TAG%"
if errorlevel 1 (
    echo [INFO] Nothing to commit, continuing...
)

echo.
echo [3/4] Pushing to current branch...
git push
if errorlevel 1 (
    echo [ERROR] git push failed.
    pause
    exit /b 1
)

echo.
echo [4/4] Creating and pushing tag %TAG%...
git tag %TAG%
if errorlevel 1 (
    echo [ERROR] Tag %TAG% may already exist locally. Delete it first with: git tag -d %TAG%
    pause
    exit /b 1
)

git push origin %TAG%
if errorlevel 1 (
    echo [ERROR] Failed to push tag %TAG%.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  Done! GitHub Actions should now be building %TAG%.
echo  Check: https://github.com/DivanDoge/Locus-Studio-Next/actions
echo ==========================================

pause
endlocal