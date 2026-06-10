@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git is not installed or not in PATH.
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Current folder is not a Git repository.
  exit /b 1
)

for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%B"
if "%BRANCH%"=="" (
  echo [ERROR] Could not detect current branch.
  exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Remote "origin" is not configured.
  echo Set it once with:
  echo   git remote add origin https://github.com/DivanDoge/Locus-Studio-Next.git
  exit /b 1
)

set "DEFAULT_VERSION="
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "(Get-Content package.json -Raw ^| ConvertFrom-Json).version"`) do (
  set "DEFAULT_VERSION=%%V"
)

if "%DEFAULT_VERSION%"=="" (
  set "DEFAULT_VERSION=2.0.0"
)

echo.
echo Current branch: %BRANCH%
echo Git remote origin:
git remote get-url origin
echo.

set /p "VERSION=Release version (without v) [%DEFAULT_VERSION%]: "
if "%VERSION%"=="" set "VERSION=%DEFAULT_VERSION%"

set "TAG=v%VERSION%"

echo.
set /p "DO_COMMIT=Commit all current changes first? [Y/n]: "
if /i "%DO_COMMIT%"=="" set "DO_COMMIT=Y"

if /i "%DO_COMMIT%"=="Y" (
  git add -A
  git diff --cached --quiet
  if errorlevel 1 (
    git commit -m "release: %TAG%"
    if errorlevel 1 (
      echo [ERROR] Commit failed. Resolve issues and try again.
      exit /b 1
    )
  ) else (
    echo [INFO] No staged changes to commit.
  )
)

echo.
echo Pushing branch %BRANCH%...
git push origin %BRANCH%
if errorlevel 1 (
  echo [ERROR] Failed to push branch.
  exit /b 1
)

git rev-parse "%TAG%" >nul 2>&1
if not errorlevel 1 (
  echo [ERROR] Tag %TAG% already exists locally.
  echo Delete it manually if needed: git tag -d %TAG%
  exit /b 1
)

git ls-remote --tags origin "refs/tags/%TAG%" | findstr /r "." >nul
if not errorlevel 1 (
  echo [ERROR] Tag %TAG% already exists on origin.
  exit /b 1
)

echo.
echo Creating annotated tag %TAG%...
git tag -a "%TAG%" -m "Release %TAG%"
if errorlevel 1 (
  echo [ERROR] Failed to create tag.
  exit /b 1
)

echo Pushing tag %TAG%...
git push origin "%TAG%"
if errorlevel 1 (
  echo [ERROR] Failed to push tag.
  exit /b 1
)

echo.
echo [DONE] Release pushed successfully.
echo Tag: %TAG%
echo Check GitHub Actions and Releases page.
exit /b 0
