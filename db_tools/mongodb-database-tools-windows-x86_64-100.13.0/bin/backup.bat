@echo off
REM === MongoDB Atlas Backup Script ===
REM Change the password and path as needed

set MONGO_URI="mongodb+srv://aftabbaloch69:6xxNvdr5BSSztWeA@cluster0.yo9vvhv.mongodb.net/"
set BACKUP_PATH=%~dp0backups

REM === Generate ISO-style YYYY-MM-DD date safely ===
for /f "tokens=1-3 delims=/-. " %%a in ("%date%") do (
    if "%%a" gtr "2000" (
        set yyyy=%%a
        set mm=%%b
        set dd=%%c
    ) else (
        set dd=%%a
        set mm=%%b
        set yyyy=%%c
    )
)

REM Pad single-digit days/months with a leading zero if missing
if 1%mm% LSS 110 set mm=0%mm%
if 1%dd% LSS 110 set dd=0%dd%

set FILE_NAME=allDatabasesBackup_%yyyy%-%mm%-%dd%.gz

echo Backing up MongoDB Atlas database...
if not exist "%BACKUP_PATH%" mkdir "%BACKUP_PATH%"

mongodump ^
  --uri=%MONGO_URI% ^
  --archive="%BACKUP_PATH%\%FILE_NAME%" ^
  --gzip ^
  --numParallelCollections=8

if %errorlevel% neq 0 (
    echo ❌ Backup failed!
) else (
    echo ✅ Backup completed successfully!
    echo 📁 File saved to: %BACKUP_PATH%\%FILE_NAME%
)
pause
