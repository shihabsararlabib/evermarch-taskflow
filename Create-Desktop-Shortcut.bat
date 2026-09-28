@echo off
cd /d "%~dp0"
echo Creating Evermarch TaskFlow shortcut on your Desktop...
cscript //nologo "%~dp0create-shortcut.vbs"
echo.
pause
