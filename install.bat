@echo off
REM install.bat — one-liner installer for nats-monitoring (Windows)
REM Usage: curl -fsSL https://raw.githubusercontent.com/amir-baghshahy/nats-monitor/main/install.bat -o install.bat && install.bat
REM Or directly set NATS_MONITORING_VERSION=vX.Y.Z

setlocal EnableDelayedExpansion

set REPO=amir-baghshahy/nats-monitor
set VERSION=%NATS_MONITORING_VERSION%
if "%VERSION%"=="" set VERSION=latest

set INSTALL_DIR=%USERPROFILE%\.local\bin
set BINARY_NAME=nats-monitoring.exe

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo Detecting platform...
for /f "tokens=2 delims==" %%i in ('wmic os get osarchitecture /value ^| findstr "Architecture"') do set ARCH=%%i
echo Architecture: !ARCH!

set PLATFORM=windows-amd64
if /i "!ARCH!"=="ARM64" set PLATFORM=windows-arm64

echo Resolving version...
if "%VERSION%"=="latest" (
    for /f "delims=" %%i in ('curl -fsSL "https://api.github.com/repos/%REPO%/releases/latest" ^| findstr "tag_name"') do (
        set VERSION=%%i
        set VERSION=!VERSION:"tag_name": =!
        set VERSION=!VERSION:"=!
    )
)
echo Version: %VERSION%

set ARCHIVE=nats-monitoring-%VERSION%-%PLATFORM%.tar.gz
set URL=https://github.com/%REPO%/releases/download/%VERSION%/%ARCHIVE%

echo Downloading %ARCHIVE%...
curl -fsSL "%URL%" -o "%TEMP%\%ARCHIVE%" || (
    echo Download failed. Check if release %VERSION% exists for %PLATFORM%.
    pause
    exit /b 1
)

echo Extracting...
cd /d "%TEMP%"
tar -xzf "%ARCHIVE%"

echo Installing to %INSTALL_DIR%\%BINARY_NAME%...
copy /Y "nats-monitoring-%PLATFORM%\%BINARY_NAME%" "%INSTALL_DIR%\%BINARY_NAME%"

echo.
echo ========================================
echo ✅ Installed nats-monitoring %VERSION% to %INSTALL_DIR%\%BINARY_NAME%
echo ========================================
echo.
echo Make sure %INSTALL_DIR% is in your PATH:
echo   setx PATH "%%PATH%%;%INSTALL_DIR%"
echo.
echo Quick start:
echo   nats-monitoring.exe
echo.

endlocal
