@echo off
setlocal enabledelayedexpansion

set "CONFIG_FILE=src-tauri\tauri.conf.json"

if not exist "%CONFIG_FILE%" (
    echo [ERROR] Cannot find %CONFIG_FILE%. Run this script from the project root.
    exit /b 1
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json).version"`) do (
    set "VERSION=%%A"
)

if "%VERSION%"=="" (
    echo [ERROR] Could not parse version from %CONFIG_FILE%.
    exit /b 1
)

set "TAG=v%VERSION%"

echo ==========================================
echo  Releasing Locus Studio Next %TAG%
echo ==========================================

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
    exit /b 1
)

echo.
echo [4/4] Creating and pushing tag %TAG%...
git tag %TAG%
if errorlevel 1 (
    echo [ERROR] Tag %TAG% may already exist locally.
    exit /b 1
)

git push origin %TAG%
if errorlevel 1 (
    echo [ERROR] Failed to push tag %TAG%.
    exit /b 1
)

echo.
echo ==========================================
echo  Done! GitHub Actions should now be building %TAG%.
echo  Check: https://github.com/DivanDoge/Locus-Studio-Next/actions
echo ==========================================

endlocal