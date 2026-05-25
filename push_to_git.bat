@echo off
echo ====================================================
echo  Team Availability Tracker - Git Push Utility
echo ====================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git and try again.
    pause
    exit /b
)

:: Initialize git repository if it doesn't exist
if not exist .git (
    echo [INFO] Initializing new Git repository...
    git init
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to initialize Git repository.
        pause
        exit /b
    )
) else (
    echo [INFO] Git repository already initialized.
)

:: Set remote origin
echo [INFO] Setting remote origin to https://github.com/mr-yasar/team-tracker-virtualintern.git...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/mr-yasar/team-tracker-virtualintern.git
if %errorlevel% neq 0 (
    echo [ERROR] Failed to set remote origin.
    pause
    exit /b
)

:: Stage files
echo [INFO] Staging all files...
git add .
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stage files.
    pause
    exit /b
)

:: Commit files
echo [INFO] Committing files...
git commit -m "Initial commit: Team Availability Tracker dashboard with Flask & SQLite"
if %errorlevel% neq 0 (
    echo [INFO] No changes to commit or commit failed.
)

:: Rename branch to main
echo [INFO] Setting branch to main...
git branch -M main

:: Push to GitHub
echo.
echo ====================================================
echo  Pushing to GitHub (main branch)...
echo  (If prompted, please complete authentication)
echo ====================================================
echo.
git push -u origin main

if %errorlevel% eq 0 (
    echo.
    echo [SUCCESS] Code pushed successfully to GitHub!
) else (
    echo.
    echo [WARNING] Git push returned an error code. Check your internet connection, credentials, and repository permissions.
)

echo.
pause
