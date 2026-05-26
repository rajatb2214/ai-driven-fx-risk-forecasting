@echo off
setlocal
cd /d "%~dp0"

if exist "%LOCALAPPDATA%\OpenAI\Codex\bin\node.exe" (
  "%LOCALAPPDATA%\OpenAI\Codex\bin\node.exe" server.js
  goto :end
)

where node >nul 2>nul
if %errorlevel%==0 (
  node server.js
  goto :end
)

echo Node.js was not found.
echo Install Node.js LTS from https://nodejs.org/ and then run this file again.
pause

:end
endlocal
