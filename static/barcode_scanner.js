class BarcodeScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.isScanning = false;
        this.codeReader = null;
        this.onBarcodeDetected = null;
        this.scannerContainer = null;
        
        // Inizializza ZXing quando disponibile
        this.initZXing();
    }
    
    async initZXing() {
        // Aspetta che ZXing sia caricato
        if (typeof ZXing === 'undefined') {
            setTimeout(() => this.initZXing(), 100);
            return;
        }
        
        try {
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            console.log('ZXing inizializzato correttamente');
        } catch (error) {
            console.error('Errore inizializzazione ZXing:', error);
        }
    }
    
    createScannerUI(targetElementId, onBarcodeDetected) {
        this.onBarcodeDetected = onBarcodeDetected;
        const targetElement = document.getElementById(targetElementId);
        
        if (!targetElement) {
            console.error('Elemento target non trovato:', targetElementId);
            return;
        }
        
        // Crea l'interfaccia dello scanner
        this.scannerContainer = document.createElement('div');
        this.scannerContainer.className = 'barcode-scanner-container';
        this.scannerContainer.innerHTML = `
            <div class="scanner-header">
                <h4>Scanner Codice a Barre</h4>
                <button type="button" class="close-scanner-btn" onclick="barcodeScanner.hideScannerUI()">×</button>
            </div>
            <div class="scanner-video-container">
                <video id="barcode-video" autoplay muted playsinline></video>
                <div class="scanner-overlay">
                    <div class="scanner-line"></div>
                </div>
            </div>
            <div class="scanner-controls">
                <button type="button" id="start-scanner-btn" class="btn btn-primary">Avvia Scanner</button>
                <button type="button" id="stop-scanner-btn" class="btn btn-secondary" style="display: none;">Ferma Scanner</button>
                <button type="button" id="switch-camera-btn" class="btn btn-secondary" style="display: none;">Cambia Camera</button>
            </div>
            <div id="scanner-result" class="scanner-result"></div>
        `;
        
        targetElement.appendChild(this.scannerContainer);
        
        // Riferimenti agli elementi
        this.video = document.getElementById('barcode-video');
        this.startBtn = document.getElementById('start-scanner-btn');
        this.stopBtn = document.getElementById('stop-scanner-btn');
        this.switchBtn = document.getElementById('switch-camera-btn');
        this.result = document.getElementById('scanner-result');
        
        // Event listeners
        this.startBtn.addEventListener('click', () => this.startScanning());
        this.stopBtn.addEventListener('click', () => this.stopScanning());
        this.switchBtn.addEventListener('click', () => this.switchCamera());
        
        return this.scannerContainer;
    }
    
    showScannerUI(targetElementId, onBarcodeDetected) {
        if (!this.scannerContainer) {
            this.createScannerUI(targetElementId, onBarcodeDetected);
        } else {
            this.onBarcodeDetected = onBarcodeDetected;
            this.scannerContainer.style.display = 'block';
        }
    }
    
    hideScannerUI() {
        if (this.scannerContainer) {
            this.stopScanning();
            this.scannerContainer.style.display = 'none';
        }
    }
    
    async startScanning(useBackCamera = true) {
        if (!this.codeReader) {
            this.result.innerHTML = '<span style="color: red;">Scanner non inizializzato</span>';
            return;
        }
        
        try {
            // Configurazione della fotocamera
            const constraints = {
                video: {
                    facingMode: useBackCamera ? 'environment' : 'user',
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 }
                }
            };
            
            // Richiedi accesso alla fotocamera
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            this.isScanning = true;
            this.startBtn.style.display = 'none';
            this.stopBtn.style.display = 'inline-block';
            this.switchBtn.style.display = 'inline-block';
            this.result.innerHTML = '<span style="color: blue;">Scanner attivo... Punta la camera sul codice a barre</span>';
            
            // Inizia la scansione continua
            this.scanContinuously();
            
        } catch (error) {
            console.error('Errore accesso fotocamera:', error);
            let errorMessage = 'Errore: Impossibile accedere alla fotocamera';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Errore: Permesso fotocamera negato. Abilita l\'accesso alla fotocamera nelle impostazioni del browser.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Errore: Nessuna fotocamera trovata su questo dispositivo.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Errore: La fotocamera non è supportata da questo browser.';
            }
            
            this.result.innerHTML = `<span style="color: red;">${errorMessage}</span>`;
        }
    }
    
    async switchCamera() {
        if (this.isScanning) {
            this.stopScanning();
            // Aspetta un momento prima di riavviare con l'altra camera
            setTimeout(() => {
                const wasUsingBack = this.stream && this.stream.getVideoTracks()[0].getSettings().facingMode === 'environment';
                this.startScanning(!wasUsingBack);
            }, 500);
        }
    }
    
    async scanContinuously() {
        if (!this.isScanning || !this.codeReader) return;
        
        try {
            const result = await this.codeReader.decodeOnceFromVideoDevice(undefined, this.video);
            
            if (result && result.text) {
                const barcodeValue = result.text.trim();
                console.log('Codice a barre rilevato:', barcodeValue);
                
                this.result.innerHTML = `<span style="color: green;">✅ Codice trovato: ${barcodeValue}</span>`;
                
                // Callback per gestire il codice rilevato
                if (this.onBarcodeDetected) {
                    this.onBarcodeDetected(barcodeValue);
                }
                
                // Ferma la scansione automaticamente dopo aver trovato un codice
                setTimeout(() => {
                    this.stopScanning();
                }, 1500);
                
                return;
            }
        } catch (error) {
            // Errore normale durante la scansione, continua
            if (error.name !== 'NotFoundException') {
                console.warn('Errore durante la scansione:', error);
            }
        }
        
        // Continua a scansionare se non ha trovato nulla
        if (this.isScanning) {
            requestAnimationFrame(() => this.scanContinuously());
        }
    }
    
    stopScanning() {
        this.isScanning = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        if (this.startBtn && this.stopBtn && this.switchBtn) {
            this.startBtn.style.display = 'inline-block';
            this.stopBtn.style.display = 'none';
            this.switchBtn.style.display = 'none';
        }
        
        if (this.result) {
            this.result.innerHTML = '';
        }
    }
    
    cleanup() {
        this.stopScanning();
        if (this.scannerContainer && this.scannerContainer.parentNode) {
            this.scannerContainer.parentNode.removeChild(this.scannerContainer);
        }
        this.scannerContainer = null;
        this.video = null;
        this.startBtn = null;
        this.stopBtn = null;
        this.switchBtn = null;
        this.result = null;
    }
}

// Istanza globale del scanner
let barcodeScanner = null;

// Inizializza il scanner quando il documento è pronto
document.addEventListener('DOMContentLoaded', function() {
    barcodeScanner = new BarcodeScanner();
});

// Funzione helper per integrare lo scanner con i form esistenti
function showBarcodeScanner(targetElementId, onBarcodeDetected) {
    if (!barcodeScanner) {
        console.error('BarcodeScanner non inizializzato');
        return;
    }
    
    barcodeScanner.showScannerUI(targetElementId, onBarcodeDetected);
}

// Funzione per nascondere lo scanner
function hideBarcodeScanner() {
    if (barcodeScanner) {
        barcodeScanner.hideScannerUI();
    }
}