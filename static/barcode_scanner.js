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

        startButton.addEventListener('click', () => {
            this.startScanning(config);
        });

        stopButton.addEventListener('click', () => {
            this.stopScanning(config);
        });
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

        try {
            // Richiedi permessi per la fotocamera
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Usa la fotocamera posteriore se disponibile
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
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permesso fotocamera negato. Abilita la fotocamera nelle impostazioni del browser.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Nessuna fotocamera trovata su questo dispositivo.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Fotocamera non supportata su questo browser.';
            }
            
            this.updateStatus(statusElement, errorMessage, 'error');
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

    // Aggiorna lo stato del scanner
    updateStatus(statusElement, message, statusClass = '') {
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'scanner-status' + (statusClass ? ' ' + statusClass : '');
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
