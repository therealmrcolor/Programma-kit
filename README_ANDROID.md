# Kit Manager - Sistema di Gestione Kit Verniciati

Sistema web per la gestione di kit verniciati con supporto barcode scanner per Android.

## 🚀 Avvio Rapido

### Windows
1. **Doppio click** su `start_https_windows.bat`
2. Segui le istruzioni a schermo
3. Accedi da Android tramite: `https://IP_DEL_PC:5125`

### macOS  
1. **Doppio click** su `start_https_macos.sh` (o esegui nel terminale)
2. Segui le istruzioni a schermo  
3. Accedi da Android tramite: `https://IP_DEL_MAC:5125`

## 📱 Uso della Fotocamera su Android

**IMPORTANTE**: Per usare il barcode scanner su Android è necessario HTTPS.

### Configurazione Android:
1. Avvia l'app con `--https` 
2. Su Android, quando appare l'avviso di sicurezza:
   - Tocca **"Avanzate"**
   - Tocca **"Procedi comunque"** o **"Continua su questo sito"**
3. Ora la fotocamera dovrebbe funzionare!

### Se hai problemi con la fotocamera:
1. Usa il pulsante **"🔧 Testa Permessi"** (appare su Android)
2. Verifica che l'URL inizi con `https://`
3. Nelle impostazioni del browser: Permessi → Fotocamera → Consenti

## 💻 Installazione Manuale

### Requisiti
- Python 3.8 o superiore
- Moduli Python: flask, waitress, cryptography

### Installazione
```bash
# Installa dipendenze
pip install -r requirements_complete.txt

# Oppure manualmente:
pip install flask waitress cryptography
```

### Avvio
```bash
# Con supporto HTTPS (per fotocamera Android)
python app_kit.py --https

# Solo localhost (senza HTTPS)  
python app_kit.py --localhost

# HTTP normale (fotocamera non funziona su Android)
python app_kit.py
```

## 🔧 Modalità di Avvio

| Comando | Descrizione | Fotocamera Android |
|---------|-------------|-------------------|
| `--https` | Server HTTPS con certificato auto-firmato | ✅ Funziona |
| `--localhost` | Server solo su localhost | ❌ Solo su localhost |
| (normale) | Server HTTP su rete | ❌ Non funziona |

## 🌐 Accesso da Dispositivi

### Trova l'IP del PC:
- **Windows**: `ipconfig` (cerca "Indirizzo IPv4")
- **macOS**: `ifconfig | grep inet` oppure System Preferences → Network

### Accedi dall'app:
- **HTTPS**: `https://IP_DEL_PC:5125`
- **HTTP**: `http://IP_DEL_PC:5125`

## 📋 Funzionalità

### ✅ Implementate:
- ✅ Inserimento e gestione kit verniciati
- ✅ Visualizzazione sequenze 1-7
- ✅ Gestione linee di produzione
- ✅ Checkbox per marking completamento
- ✅ **Barcode scanner con fotocamera** (Painting List)
- ✅ Terminologia aggiornata (NUMERO COLLI)
- ✅ Supporto cross-platform (Windows/macOS)
- ✅ HTTPS automatico per Android

### 🎯 Barcode Scanner:
- Legge tutti i formati comuni (Code 128, EAN, UPC, ecc.)
- Integrato nel modulo "Painting List"
- Tasto test permessi per Android
- Istruzioni automatiche per configurazione

## 🛠️ Risoluzione Problemi

### La fotocamera non funziona su Android:
1. Verifica di usare `https://` nell'URL
2. Accetta l'avviso di sicurezza del browser
3. Usa il pulsante "🔧 Testa Permessi"
4. Controlla Impostazioni browser → Permessi → Fotocamera

### Errore certificato HTTPS:
- È normale con certificati auto-firmati
- Accetta l'avviso e procedi comunque
- Su Android: "Avanzate" → "Procedi comunque"

### OpenSSL non trovato:
- Viene installato automaticamente `cryptography`
- In alternativa usa `--localhost`

### Non riesci ad accedere dall'esterno:
1. Controlla il firewall del PC
2. Verifica l'IP con `ipconfig`/`ifconfig`  
3. Assicurati che PC e Android siano sulla stessa rete WiFi

## 📁 Struttura Progetto

```
Programma kit/
├── app_kit.py                 # Applicazione principale
├── start_https_windows.bat    # Avvio rapido Windows
├── start_https_macos.sh       # Avvio rapido macOS
├── requirements_complete.txt  # Dipendenze complete
├── static/
│   ├── barcode_scanner.js     # Modulo scanner
│   ├── kit_form.js           # Form inserimento
│   ├── sequence_display_kit.js # Visualizzazione
│   └── style_kit.css         # Stili
├── templates/
│   ├── kit_form.html         # Form inserimento
│   └── sequence_display_kit.html # Pagine sequenze
└── database_kit/
    └── kit_sequences.db      # Database SQLite
```
