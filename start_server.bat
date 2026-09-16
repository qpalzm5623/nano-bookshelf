@echo off
title Nano BookShelf - Local Server

echo ========================================================
echo   Nano BookShelf Local Test Server
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%~dp0public_html"

:: 1. Check system php
where php >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] System PHP found.
    set "PHP_CMD=php"
    goto START_SERVER
)

:: 2. Check XAMPP php
if exist "C:\xampp\php\php.exe" (
    echo [OK] XAMPP PHP found.
    set "PHP_CMD=C:\xampp\php\php.exe"
    goto START_SERVER
)

:: 3. Check portable php
if exist "%ROOT_DIR%php\php.exe" (
    echo [OK] Portable PHP found.
    set "PHP_CMD=%ROOT_DIR%php\php.exe"
    goto START_SERVER
)

:: 4. Download portable PHP via powershell
echo [Notice] PHP not found. Downloading official portable PHP (30MB)...
echo Please wait a moment...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $zip = Join-Path $env:TEMP 'php.zip'; $dest = (Resolve-Path '%ROOT_DIR%').Path + '\php'; (New-Object System.Net.WebClient).DownloadFile('https://windows.php.net/downloads/releases/archives/php-8.0.30-nts-Win32-vs16-x64.zip', $zip); Expand-Archive -Path $zip -DestinationPath $dest -Force; Remove-Item $zip -Force; Copy-Item ($dest + '\php.ini-development') ($dest + '\php.ini') -Force;"

if exist "%ROOT_DIR%php\php.exe" (
    echo [OK] PHP download complete.
    set "PHP_CMD=%ROOT_DIR%php\php.exe"
    goto START_SERVER
) else (
    echo.
    echo [Error] Failed to download PHP. Please install XAMPP or check internet connection.
    pause
    exit /b 1
)

:START_SERVER
echo.
echo ========================================================
echo   Server running at: http://localhost:8080
echo   Opening browser now...
echo   (Press Ctrl + C to stop server)
echo ========================================================
echo.

start "" "http://localhost:8080/master_preview.html"
"%PHP_CMD%" -S 0.0.0.0:8080
pause
