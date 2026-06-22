@echo off
REM install.bat — one-liner installer for nats-horizon (Windows)
REM Usage: curl -fsSL https://raw.githubusercontent.com/amir-baghshahy/nats-horizon/main/install.bat -o install.bat && install.bat
REM Or directly set NATS_HORIZON_VERSION=vX.Y.Z

setlocal EnableDelayedExpansion

set REPO=amir-baghshahy/nats-horizon
set VERSION=%NATS_HORIZON_VERSION%
if "%VERSION%"=="" set VERSION=latest

set INSTALL_DIR=%USERPROFILE%\.local\bin
set BINARY_NAME=nats-horizon.exe

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

set ARCHIVE=nats-horizon-%VERSION%-%PLATFORM%.tar.gz
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
copy /Y "nats-horizon-%PLATFORM%\%BINARY_NAME%" "%INSTALL_DIR%\%BINARY_NAME%"

echo.
echo ========================================
echo ✅ Installed nats-horizon %VERSION% to %INSTALL_DIR%\%BINARY_NAME%
echo ========================================
echo.
echo Make sure %INSTALL_DIR% is in your PATH:
echo   setx PATH "%%PATH%%;%INSTALL_DIR%"
echo.
echo Quick start:
echo   nats-horizon.exe
echo.

endlocal
