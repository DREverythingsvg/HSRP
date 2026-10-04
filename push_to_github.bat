@echo off
title Pusha HSRP till GitHub
cd /d "%~dp0"
echo ========================================================
echo   Pushar HSRP till GitHub...
echo   Repo: https://github.com/DREverythingsvg/HSRP.git
echo ========================================================
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   Allt ar uppladdat till GitHub!
    echo   Render borjar nu automatiskt driftsatta sidan!
    echo ========================================================
) else (
    echo.
    echo Nagot gick fel vid inloggningen. Testa igen.
)
echo.
pause
