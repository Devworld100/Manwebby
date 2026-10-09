@echo off
setlocal
title Push to GitHub - Devworld100/Manwebby
echo ========================================================
echo   Pushing MAN Portal to GitHub: Devworld100/Manwebby
echo ========================================================
echo.

:: Detect git executable
set "GIT_CMD="
where git >nul 2>&1 && set "GIT_CMD=git"
if not defined GIT_CMD if exist "C:\Program Files\Git\cmd\git.exe" set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
if not defined GIT_CMD if exist "C:\Program Files\Git\bin\git.exe" set "GIT_CMD=C:\Program Files\Git\bin\git.exe"
if not defined GIT_CMD if exist "%USERPROFILE%\.git-bin\cmd\git.exe" set "GIT_CMD=%USERPROFILE%\.git-bin\cmd\git.exe"

if not defined GIT_CMD (
    echo [ERROR] Git was not found in PATH or standard installation paths.
    echo Please ensure Git is installed.
    goto end
)

echo [1/3] Checking Git status...
"%GIT_CMD%" status --short
echo.

echo [2/3] Staging changes...
"%GIT_CMD%" add .
"%GIT_CMD%" diff-index --quiet HEAD || "%GIT_CMD%" commit -m "Update site and portal"
echo.

echo [3/3] Pushing to origin main...
"%GIT_CMD%" push origin main
echo.
echo ========================================================
echo   Done! Repository is up to date on GitHub.
echo ========================================================

:end
echo.
pause
