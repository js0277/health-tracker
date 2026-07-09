@echo off
echo === 启动轻食记服务 ===
set PORT=3456
start "轻食记API" /B C:\Users\zz\.workbuddy\binaries\node\versions\22.22.2\node.exe E:\health-tracker\server\app.js
timeout /t 3 /nobreak >nul
echo === 启动公网隧道 ===
C:\Users\zz\.workbuddy\binaries\cloudflared\cloudflared.exe tunnel --url http://localhost:3456
