// Modulo per la gestione del lettore di codici a barre
class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.currentConfig = null;
    }

    // Inizializza il lettore per un form specifico
    setupBarcodeScanner(config) {
        const {
            startButtonId,
            stopButtonId,
            containerElementId,
            scannerElementId,
            statusElementId,
            inputElementId,
            onBarcodeDetected
        } = config;

        this.currentConfig = config;

        const startButton = document.getElementById(startButtonId);
        const stopButton = document.getElementById(stopButtonId);
        const statusElement = document.getElementById(statusElementId);

        if (!startButton || !stopButton || !statusElement) {
            console.error('Elementi del barcode scanner non trovati');
            return;
        }

        // Aggiungi pulsante di test permessi se siamo su Android
        if (this.isAndroid()) {
            this.addPermissionTestButton(startButton, statusElement);
        }

        startButton.addEventListener('click', () => {
            this.startScanning(config);
        });

        stopButton.addEventListener('click', () => {
            this.stopScanning(config);
        });
    }

    // Aggiunge un pulsante per testare i permessi
    addPermissionTestButton(startButton, statusElement) {
        // Crea pulsante di test solo se non esiste già
        const existingTestButton = document.getElementById('testCameraPermission');
        if (existingTestButton) return;

        const testButton = document.createElement('button');
        testButton.type = 'button';
        testButton.id = 'testCameraPermission';
        testButton.className = 'scanner-btn test-permission-btn';
        testButton.textContent = '🔧 Testa Permessi';
        testButton.style.marginLeft = '10px';
        testButton.style.backgroundColor = '#FFA500';

        testButton.addEventListener('click', async () => {
            this.updateStatus(statusElement, 'Test permessi fotocamera...', 'scanning');
            
            const supportCheck = this.checkCameraSupport();
            if (!supportCheck.supported) {
                this.updateStatus(statusElement, supportCheck.error, 'error');
                return;
            }

            try {
                const result = await this.requestCameraPermission();
                if (result.success) {
                    this.updateStatus(statusElement, '✅ Permessi OK! Ora puoi avviare il scanner', 'success');
                } else {
                    throw result.error;
                }
            } catch (error) {
                this.updateStatus(statusElement, '❌ Errore permessi: ' + error.message, 'error');
                setTimeout(() => {
                    this.showAndroidInstructions(statusElement);
                }, 2000);
            }
        });

        // Inserisci il pulsante dopo il pulsante di avvio
        startButton.parentNode.insertBefore(testButton, startButton.nextSibling);
    }

    // Controlla se il browser supporta la fotocamera
    checkCameraSupport() {
        // Verifica HTTPS (richiesto per la fotocamera, eccetto localhost)
        const isLocalhost = location.hostname === 'localhost' || 
                          location.hostname === '127.0.0.1' || 
                          location.hostname.startsWith('192.168.') ||
                          location.hostname.startsWith('10.') ||
                          location.hostname.includes('local');
                          
        if (location.protocol !== 'https:' && !isLocalhost) {
            return {
                supported: false,
                error: 'La fotocamera richiede HTTPS o localhost. Accedi tramite https:// o localhost'
            };
        }

        // Verifica supporto MediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return {
                supported: false,
                error: 'Il tuo browser non supporta l\'accesso alla fotocamera'
            };
        }

        return { supported: true };
    }

    // Richiede esplicitamente i permessi della fotocamera
    async requestCameraPermission() {
        try {
            // Primo tentativo con fotocamera posteriore
            let stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Se funziona, ferma lo stream temporaneo
            stream.getTracks().forEach(track => track.stop());
            return { success: true };
            
        } catch (error) {
            console.log('Tentativo fotocamera posteriore fallito, provo quella frontale:', error);
            
            try {
                // Secondo tentativo con fotocamera frontale
                let stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                });
                
                stream.getTracks().forEach(track => track.stop());
                return { success: true };
                
            } catch (secondError) {
                console.log('Tentativo fotocamera frontale fallito:', secondError);
                
                try {
                    // Terzo tentativo con impostazioni basilari
                    let stream = await navigator.mediaDevices.getUserMedia({
                        video: true
                    });
                    
                    stream.getTracks().forEach(track => track.stop());
                    return { success: true };
                    
                } catch (finalError) {
                    return { success: false, error: finalError };
                }
            }
        }
    }

    // Avvia la scansione
    async startScanning(config) {
        const {
            startButtonId,
            stopButtonId,
            containerElementId,
            scannerElementId,
            statusElementId,
            onBarcodeDetected
        } = config;

        const startButton = document.getElementById(startButtonId);
        const stopButton = document.getElementById(stopButtonId);
        const container = document.getElementById(containerElementId);
        const statusElement = document.getElementById(statusElementId);

        if (this.isScanning) {
            this.updateStatus(statusElement, 'Scanner già attivo', 'error');
            return;
        }

        // Controlla supporto browser
        const supportCheck = this.checkCameraSupport();
        if (!supportCheck.supported) {
            this.updateStatus(statusElement, supportCheck.error, 'error');
            return;
        }

        this.updateStatus(statusElement, 'Richiesta permesso fotocamera...', 'scanning');

        try {
            // Richiedi esplicitamente i permessi
            const permissionResult = await this.requestCameraPermission();
            if (!permissionResult.success) {
                throw permissionResult.error;
            }

            this.updateStatus(statusElement, 'Inizializzazione scanner...', 'scanning');

            // Ora inizializza effettivamente la fotocamera per Quagga
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });

            // Mostra il container e aggiorna i controlli
            container.classList.add('active');
            startButton.style.display = 'none';
            stopButton.style.display = 'inline-block';
            this.updateStatus(statusElement, 'Inizializzazione scanner...', 'scanning');

            // Configurazione di Quagga
            const quaggaConfig = {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.getElementById(scannerElementId),
                    constraints: {
                        width: 400,
                        height: 300,
                        facingMode: "environment"
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: 2,
                frequency: 10,
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "codabar_reader",
                        "upc_reader",
                        "upc_e_reader",
                        "i2of5_reader"
                    ]
                },
                locate: true
            };

            // Inizializza Quagga
            Quagga.init(quaggaConfig, (err) => {
                if (err) {
                    console.error('Errore inizializzazione Quagga:', err);
                    this.updateStatus(statusElement, 'Errore inizializzazione scanner: ' + err.message, 'error');
                    this.stopScanning(config);
                    return;
                }

                this.isScanning = true;
                Quagga.start();
                this.updateStatus(statusElement, 'Scanner attivo - punta la fotocamera verso il codice a barre', 'scanning');
            });

            // Gestisci la lettura dei codici a barre
            Quagga.onDetected((result) => {
                const code = result.codeResult.code;
                console.log('Codice rilevato:', code);
                
                // Chiamata al callback per aggiungere il codice
                if (onBarcodeDetected && typeof onBarcodeDetected === 'function') {
                    onBarcodeDetected(code);
                }

                this.updateStatus(statusElement, `Codice rilevato: ${code}`, 'scanning');
                
                // Opzionale: ferma automaticamente dopo la lettura
                // this.stopScanning(config);
            });

        } catch (error) {
            console.error('Errore accesso fotocamera:', error);
            let errorMessage = 'Errore accesso fotocamera';
            let troubleshootingMessage = '';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permesso fotocamera negato';
                troubleshootingMessage = 'Per Android: Vai nelle Impostazioni del browser → Permessi sito → Fotocamera → Consenti';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Nessuna fotocamera trovata';
                troubleshootingMessage = 'Verifica che il dispositivo abbia una fotocamera funzionante';
            } else if (error.name === 'NotSupportedError' || error.name === 'NotReadableError') {
                errorMessage = 'Fotocamera non disponibile';
                troubleshootingMessage = 'La fotocamera potrebbe essere utilizzata da un\'altra app. Chiudi altre app che usano la fotocamera e riprova';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Configurazione fotocamera non supportata';
                troubleshootingMessage = 'Prova a ricaricare la pagina';
            } else if (error.message && error.message.includes('https')) {
                errorMessage = 'HTTPS richiesto per la fotocamera';
                troubleshootingMessage = 'Accedi al sito tramite https:// invece di http://';
            }
            
            this.updateStatus(statusElement, `${errorMessage}. ${troubleshootingMessage}`, 'error');
            
            // Su Android, mostra istruzioni aggiuntive
            if (this.isAndroid()) {
                setTimeout(() => {
                    this.showAndroidInstructions(statusElement);
                }, 3000);
            }
        }
    }

    // Ferma la scansione
    stopScanning(config) {
        const {
            startButtonId,
            stopButtonId,
            containerElementId,
            statusElementId
        } = config;

        const startButton = document.getElementById(startButtonId);
        const stopButton = document.getElementById(stopButtonId);
        const container = document.getElementById(containerElementId);
        const statusElement = document.getElementById(statusElementId);

        if (this.isScanning) {
            Quagga.stop();
            this.isScanning = false;
        }

        // Nasconde il container e aggiorna i controlli
        container.classList.remove('active');
        startButton.style.display = 'inline-block';
        stopButton.style.display = 'none';
        this.updateStatus(statusElement, 'Scanner fermato', '');
    }

    // Rileva se siamo su Android
    isAndroid() {
        return /Android/i.test(navigator.userAgent);
    }

    // Mostra istruzioni specifiche per Android
    showAndroidInstructions(statusElement) {
        const instructions = [
            "📱 ISTRUZIONI PER ANDROID:",
            "1. Tocca l'icona 🔒 o ⚙️ nella barra degli indirizzi",
            "2. Cerca 'Permessi sito' o 'Fotocamera'", 
            "3. Seleziona 'Consenti' per la fotocamera",
            "4. Ricarica la pagina e riprova",
            "",
            "Se non funziona ancora:",
            "• Verifica di essere su HTTPS (non HTTP)",
            "• Chiudi altre app che usano la fotocamera",
            "• Prova con un browser diverso (Chrome/Firefox)"
        ];
        
        this.updateStatus(statusElement, instructions.join('\n'), 'error');
    }

    // Aggiorna lo stato del scanner
    updateStatus(statusElement, message, statusClass = '') {
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'scanner-status' + (statusClass ? ' ' + statusClass : '');
            
            // Se il messaggio contiene newline, usa <pre> per preservare la formattazione
            if (message.includes('\n')) {
                statusElement.style.whiteSpace = 'pre-line';
                statusElement.style.textAlign = 'left';
                statusElement.style.fontSize = '12px';
            } else {
                statusElement.style.whiteSpace = 'normal';
                statusElement.style.textAlign = 'center';
                statusElement.style.fontSize = '14px';
            }
        }
    }

    // Pulisce tutte le risorse
    cleanup() {
        if (this.isScanning) {
            Quagga.stop();
            this.isScanning = false;
        }
    }
}

// Istanza globale del scanner
window.barcodeScanner = new BarcodeScanner();

// Funzione di utilità per integrare con i form esistenti
window.setupBarcodeForPaintingList = function(formPrefix = '') {
    const config = {
        startButtonId: formPrefix + 'startBarcodeScanner',
        stopButtonId: formPrefix + 'stopBarcodeScanner',
        containerElementId: formPrefix + 'barcodeScannerContainer',
        scannerElementId: formPrefix + 'scanner',
        statusElementId: formPrefix + 'scannerStatus',
        inputElementId: formPrefix + 'painting_list_scanner',
        onBarcodeDetected: function(code) {
            // Trova l'input field e aggiungi il codice
            const inputField = document.getElementById(formPrefix + (formPrefix ? 'PaintingListScanner' : 'painting_list_scanner'));
            if (inputField) {
                inputField.value = code;
                
                // Simula l'evento Enter per aggiungere il codice alla lista
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    keyCode: 13,
                    which: 13
                });
                inputField.dispatchEvent(enterEvent);
            }
        }
    };

    window.barcodeScanner.setupBarcodeScanner(config);
};

// Cleanup quando la pagina viene chiusa o ricaricata
window.addEventListener('beforeunload', () => {
    if (window.barcodeScanner) {
        window.barcodeScanner.cleanup();
    }
});
