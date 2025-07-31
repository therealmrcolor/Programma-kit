@echo off
echo ===============================================
echo    Kit Manager - Avvio con supporto HTTPS
echo ===============================================
echo.

REM Controlla se Python è installato
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRORE: Python non trovato!
    echo Installa Python da: https://python.org
    pause
    exit /b 1
)

REM Controlla se cryptography è installato
python -c "import cryptography" >nul 2>&1
if errorlevel 1 (
    echo Installazione dipendenze...
    pip install cryptography waitress flask
    if errorlevel 1 (
        echo ERRORE: Installazione fallita!
        echo Prova manualmente: pip install -r requirements_complete.txt
        pause
        exit /b 1
    )
)

echo Avvio Kit Manager con HTTPS...
echo.
echo IMPORTANTE: 
echo - Su Android: accetta l'avviso di sicurezza del browser
echo - Accedi da: https://IP_DEL_PC:5125
echo - Per trovare l'IP: ipconfig (cerca "Indirizzo IPv4")
echo.

python app_kit.py --https

pause
