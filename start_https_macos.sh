#!/bin/bash

echo "==============================================="
echo "   Kit Manager - Avvio con supporto HTTPS"
echo "==============================================="
echo ""

# Controlla se Python3 è installato
if ! command -v python3 &> /dev/null; then
    echo "ERRORE: Python3 non trovato!"
    echo "Installa Python da: https://python.org"
    echo "Oppure usa Homebrew: brew install python"
    exit 1
fi

# Controlla se cryptography è installato
python3 -c "import cryptography" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installazione dipendenze..."
    pip3 install cryptography waitress flask
    if [ $? -ne 0 ]; then
        echo "ERRORE: Installazione fallita!"
        echo "Prova manualmente: pip3 install -r requirements_complete.txt"
        exit 1
    fi
fi

echo "Avvio Kit Manager con HTTPS..."
echo ""
echo "IMPORTANTE:"
echo "- Su Android: accetta l'avviso di sicurezza del browser"
echo "- Accedi da: https://IP_DEL_MAC:5125"
echo "- Per trovare l'IP: ifconfig | grep inet"
echo ""

python3 app_kit.py --https
