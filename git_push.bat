@echo off
cls
echo ==============================================
echo              GIT PUSH HELPER
echo ==============================================
echo.
echo Current branch: main
echo Remote: https://github.com/harshagroupin/harshamovie.git
echo.
echo Checking Git Status...
echo ----------------------------------------------
git status
echo ----------------------------------------------
echo.
set /p commit_msg="Enter commit message (Default: 'Update project files'): "
if "%commit_msg%"=="" (
    set commit_msg=Update project files
)
echo.
echo Staging changes (git add .)...
git add .
echo.
echo Committing changes with message: "%commit_msg%"...
git commit -m "%commit_msg%"
echo.
echo Pushing to GitHub (git push origin main)...
git push origin main
echo.
echo ==============================================
echo               GIT PUSH COMPLETE
echo ==============================================
echo.
pause
