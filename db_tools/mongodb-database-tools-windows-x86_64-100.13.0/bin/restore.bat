@echo off
REM === MongoDB Atlas Restore Script (Auto-select Latest Backup) ===

setlocal
set MONGO_URI="mongodb+srv://aftabbaloch69:6xxNvdr5BSSztWeA@cluster0.yo9vvhv.mongodb.net/"
set BACKUP_PATH=%~dp0backups

REM === Find the most recent .gz file ===
for /f "delims=" %%a in ('dir /b /od "%BACKUP_PATH%\*.gz"') do set LASTFILE=%%a
set BACKUP_FILE=%BACKUP_PATH%\%LASTFILE%

echo.
echo Restoring MongoDB Atlas database...
echo Using latest backup file: %BACKUP_FILE%
echo.

if not exist "%BACKUP_FILE%" (
    echo ❌ No backup file found in %BACKUP_PATH%
    pause
    exit /b
)

mongorestore --uri=%MONGO_URI% --archive="%BACKUP_FILE%" --gzip

if %errorlevel% neq 0 (
    echo ❌ Restore failed!
) else (
    echo ✅ Restore completed successfully!
)

endlocal
pause
