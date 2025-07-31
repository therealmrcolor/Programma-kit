# Barcode Scanner per Painting List

## Funzionalità Implementata

È stata implementata la scansione di codici a barre tramite fotocamera per l'inserimento rapido nella **Painting List** del sistema Kit. La funzionalità è disponibile sia nel form di inserimento nuovo kit che nel modal di modifica kit esistenti.

## Componenti Aggiunti

### 1. **BarcodeScanner JavaScript Class** (`static/barcode_scanner.js`)
- Gestione completa dello scanner di codici a barre
- Supporto per camera anteriore e posteriore
- Interfaccia utente responsive e moderna
- Gestione errori completa
- Auto-stop dopo scansione riuscita

### 2. **Integrazione UI**
- Pulsante "📷 Scansiona" nelle sezioni Painting List
- Modal popup con preview video della camera
- Overlay con linea di scansione animata
- Controlli per avviare/fermare/cambiare camera

### 3. **Stili CSS Aggiornati** (`static/style_kit.css`)
- Stili responsive per il modal scanner
- Animazioni smooth per apertura/chiusura
- Design adattivo per tablet Android
- Feedback visivo durante la scansione

## Come Utilizzare

### Nel Form di Inserimento Kit:
1. Compilare i campi obbligatori (Settimana, Linea, Colore, ecc.)
2. Nella sezione "PAINTING LIST", cliccare il pulsante **"📷 Scansiona"**
3. Consentire l'accesso alla fotocamera quando richiesto
4. Puntare la camera verso il codice a barre
5. Il codice verrà automaticamente aggiunto alla lista

### Nel Modal di Modifica Kit:
1. Aprire il modal di modifica di un kit esistente
2. Nella sezione "PAINTING LIST", cliccare **"📷 Scansiona"**
3. Scansionare i codici a barre come descritto sopra

## Requisiti Tecnici

### Browser e Sistema Operativo
- **Android 10+** con **Chrome 70+**
- **HTTPS obbligatorio** per accesso camera (anche su intranet locale)
- Permessi camera abilitati nel browser

### Librerie Utilizzate
- **ZXing-js** per la decodifica dei codici a barre
- Caricamento via CDN: `https://unpkg.com/@zxing/library@latest/umd/index.min.js`

## Configurazione HTTPS per Intranet

Per utilizzare la camera su una rete intranet locale, è necessario configurare HTTPS. Sono già presenti i certificati SSL:
- `server.crt`
- `server.key`

### Utilizzo degli script di avvio:
```bash
# macOS
./start_https_macos.sh

# Windows
start_https_windows.bat
```

## Formati Codici a Barre Supportati

Lo scanner supporta automaticamente i seguenti formati:
- **Code 128**
- **Code 39**
- **EAN-13**
- **EAN-8**
- **UPC-A**
- **UPC-E**
- **QR Code**
- **Data Matrix**

## Gestione Errori

### Errori Comuni e Soluzioni:

1. **"Permesso fotocamera negato"**
   - Abilitare i permessi camera nelle impostazioni Chrome
   - Verificare che l'URL usi HTTPS

2. **"Nessuna fotocamera trovata"**
   - Verificare che il dispositivo abbia una camera funzionante
   - Riavviare Chrome se necessario

3. **"Scanner non disponibile"**
   - Verificare la connessione internet per il caricamento di ZXing
   - Controllare la console del browser per errori JavaScript

4. **Scansione lenta o non funzionante**
   - Assicurarsi di buona illuminazione
   - Tenere il codice a barre stabile davanti alla camera
   - Provare a cambiare camera (anteriore/posteriore)

## Test della Funzionalità

È disponibile una pagina di test: `test_barcode.html` per verificare:
- Caricamento corretto delle librerie
- Accesso ai permessi camera
- Funzionamento base dello scanner

## File Modificati

1. **`templates/sequence_display_kit.html`**
   - Aggiunta libreria ZXing
   - Pulsante scanner nella painting list del modal
   - Contenitore per l'interfaccia scanner

2. **`templates/kit_form.html`**
   - Aggiunta libreria ZXing
   - Pulsanti scanner in form principale e modal modifica
   - Contenitore per l'interfaccia scanner

3. **`static/sequence_display_kit.js`**
   - Integrazione scanner con painting list del modal
   - Callback per gestione codici scansionati
   - Messaggi di feedback temporanei

4. **`static/kit_form.js`**
   - Integrazione scanner per form principale e modal modifica
   - Setup event listeners per pulsanti scanner
   - Gestione messaggi di stato

5. **`static/style_kit.css`**
   - Stili completi per interfaccia scanner
   - Responsive design per tablet
   - Animazioni e feedback visivo

6. **`static/barcode_scanner.js`** (nuovo)
   - Classe principale BarcodeScanner
   - Gestione camera e decodifica
   - Interfaccia utente completa

## Note di Sicurezza

- La camera è accessibile solo quando l'utente clicca esplicitamente il pulsante scanner
- Lo stream video viene terminato automaticamente dopo la scansione
- Nessun dato video viene registrato o trasmesso
- Tutti i permessi vengono richiesti esplicitamente al browser

## Supporto e Troubleshooting

Per problemi o domande:
1. Verificare la console del browser per errori JavaScript
2. Testare con la pagina `test_barcode.html`
3. Verificare che HTTPS sia configurato correttamente
4. Controllare i permessi del browser per l'accesso alla camera
