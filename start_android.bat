@echo off
rem Script di avvio per Android - SENZA HTTPS

echo 🤖 Kit Manager - Modalità Android Semplificata
echo =============================================
echo.

rem Verifica Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non trovato. Installa Python prima di continuare.
    pause
    exit /b 1
)

rem Trova l'IP locale
for /f "tokens=*" %%i in ('python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()"') do set LOCAL_IP=%%i

echo 🔍 IP locale rilevato: %LOCAL_IP%
echo.
echo 📱 ISTRUZIONI PER ANDROID:
echo 1. Assicurati che Android e PC siano sulla STESSA rete WiFi
echo 2. Apri il browser su Android
echo 3. Vai su: http://%LOCAL_IP%:5125
echo 4. La fotocamera funzionerà SENZA HTTPS!
echo.
echo 🚀 Avvio del server...
echo.

rem Avvia il server
python app_kit.py --network
pause
