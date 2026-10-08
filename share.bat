@echo off
title MAN Portal - Cloudflare Live Share
echo ===================================================
echo   Starting Local Server and Cloudflare Tunnel...
echo ===================================================
echo.
echo Starting local server on http://localhost:3000...
start "MAN Portal - Local Server" cmd /k "node serve.js"

echo Waiting for server to initialize...
timeout /t 2 /nobreak >nul

echo Starting Cloudflare Tunnel...
echo Look for the https://*.trycloudflare.com link below!
echo.
cloudflared tunnel --url http://localhost:3000
