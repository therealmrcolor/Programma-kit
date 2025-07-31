#!/bin/bash
# Script di avvio per Android - SENZA HTTPS

echo "🤖 Kit Manager - Modalità Android Semplificata"
echo "============================================="
echo ""

# Verifica Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 non trovato. Installa Python3 prima di continuare."
    exit 1
fi

# Trova l'IP locale
LOCAL_IP=$(python3 -c "
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(('8.8.8.8', 80))
    ip = s.getsockname()[0]
    s.close()
    print(ip)
except:
    print('IP-NON-TROVATO')
")

echo "🔍 IP locale rilevato: $LOCAL_IP"
echo ""
echo "📱 ISTRUZIONI PER ANDROID:"
echo "1. Assicurati che Android e PC siano sulla STESSA rete WiFi"
echo "2. Apri il browser su Android"
echo "3. Vai su: http://$LOCAL_IP:5125"
echo "4. La fotocamera funzionerà SENZA HTTPS!"
echo ""
echo "🚀 Avvio del server..."
echo ""

# Avvia il server
python3 app_kit.py --network
