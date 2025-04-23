@echo off
echo Clearing Windows icon cache...
taskkill /f /im explorer.exe
del /a /q "%localappdata%\IconCache.db"
start explorer.exe
echo Icon cache cleared. Please restart your computer for changes to take effect.
pause 