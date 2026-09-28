@echo off
setlocal enabledelayedexpansion
title Evermarch Bangladesh - TaskFlow Manager

:: Navigate to project directory
cd /d "%~dp0"

echo ====================================================================
echo          EVERMARCH BANGLADESH PRINTER REPAIR TASKFLOW
echo ====================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js 18 or higher from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [SETUP] First-time run detected. Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install project dependencies.
        pause
        exit /b 1
    )
)

echo [STARTING] Starting TaskFlow Server...
echo [SERVER]   Local URL:    http://localhost:3000
echo.
echo Opening browser in 3 seconds...
echo Press Ctrl + C in this window anytime to stop the server.
echo ====================================================================
echo.

:: Automatically open browser after 3 seconds in background
start /b "" powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"

:: Start Next.js development server
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [NOTICE] Application process exited with code %ERRORLEVEL%.
    pause
)
