document.addEventListener('DOMContentLoaded', function() {
    const kitForm = document.getElementById('kitDataForm');
    const recentKitItemsList = document.getElementById('recentKitItemsList');
    const lineaSelect = document.getElementById('linea');
    const editLineaSelect = document.getElementById('editLinea');

    // Funzione per calcolare il numero della settimana dell'anno
    function getWeekNumber(date) {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startDate.getDay() + 1) / 7);
    }

    // Funzione per formattare il colore (aggiunge RAL se 4 cifre)
    function formatColor(color) {
        if (color && /^\d{4}$/.test(color.toString())) {
            return `RAL${color}`;
        }
        return color;
    }
    
    // Funzione per impostare la settimana corrente
    function setCurrentWeek() {
        const currentWeek = getWeekNumber(new Date());
        document.getElementById('numero_settimana').value = currentWeek;
    }

    // Rendi le funzioni globali
    window.formatColor = formatColor;
    window.setCurrentWeek = setCurrentWeek;

    // Pre-compila il numero settimana con la settimana corrente
    setCurrentWeek();

    async function loadLinee() { /* ... (invariato) ... */ 
        try {
            const response = await fetch('/api/get_linee');
            const linee = await response.json();
            lineaSelect.innerHTML = '<option value="">Seleziona Linea</option>'; 
            if (editLineaSelect) {
                 editLineaSelect.innerHTML = '<option value="">Seleziona Linea</option>';
            }

            linee.forEach(linea => {
                const option = document.createElement('option');
                option.value = linea.nome; 
                option.textContent = linea.nome;
                lineaSelect.appendChild(option.cloneNode(true));
                if (editLineaSelect) {
                    editLineaSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Errore caricamento linee:', error);
            lineaSelect.innerHTML = '<option value="">Errore linee</option>';
            if (editLineaSelect) editLineaSelect.innerHTML = '<option value="">Errore linee</option>';
        }
    }

    loadLinee();
    loadRecentKitItems(); 
    setupKitModal(); 
    setupPaintingList(); // Setup Painting List functionality
    
    // Setup Barcode Scanner dopo che tutto è caricato
    if (typeof setupBarcodeForPaintingList !== 'undefined') {
        setupBarcodeForPaintingList(''); // Prefisso vuoto per il form principale
        
        // Setup per il modal di edit (se esiste)
        setTimeout(() => {
            setupBarcodeForPaintingList('edit'); // Prefisso per il modal edit
        }, 100);
    }

    // Funzione per gestire la Painting List
    function setupPaintingList() {
        // Main form
        setupPaintingListForForm(
            'painting_list_scanner', 
            'painting_list', 
            'scannedCodesBody', 
            'paintingListCount', 
            'clearPaintingList'
        );

        // Edit modal
        setupPaintingListForForm(
            'editPaintingListScanner', 
            'editPaintingList', 
            'editScannedCodesBody', 
            'editPaintingListCount', 
            'editClearPaintingList'
        );
    }

    function setupPaintingListForForm(scannerId, hiddenInputId, tableBodyId, countId, clearBtnId) {
        const scannerInput = document.getElementById(scannerId);
        const hiddenInput = document.getElementById(hiddenInputId);
        const tableBody = document.getElementById(tableBodyId);
        const countElement = document.getElementById(countId);
        const clearBtn = document.getElementById(clearBtnId);
        
        if (!scannerInput) return; // Element might not be on the page

        scannerInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const code = scannerInput.value.trim();
                if (code) {
                    addCodeToPaintingList(code, hiddenInput, tableBody, countElement);
                    scannerInput.value = '';
                }
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (confirm('Sei sicuro di voler pulire tutta la lista?')) {
                    hiddenInput.value = '';
                    updateScannedCodesTable(hiddenInput, tableBody, countElement);
                }
            });
        }
    }

    function addCodeToPaintingList(code, hiddenInput, tableBody, countElement) {
        const currentCodes = hiddenInput.value ? hiddenInput.value.split('\n') : [];
        // Evita duplicati
        if (!currentCodes.includes(code)) {
            currentCodes.push(code);
            hiddenInput.value = currentCodes.join('\n');
            updateScannedCodesTable(hiddenInput, tableBody, countElement);
        }
    }
    
    function removeCodeFromPaintingList(index, hiddenInput, tableBody, countElement) {
        const lines = hiddenInput.value.split('\n');
        lines.splice(index, 1);
        hiddenInput.value = lines.join('\n');
        updateScannedCodesTable(hiddenInput, tableBody, countElement);
    }

    // Funzione per aggiornare la tabella dei codici scansionati
    function updateScannedCodesTable(hiddenInput, tableBody, countElement) {
        const lines = hiddenInput.value.trim() ? hiddenInput.value.split('\n').filter(line => line.trim()) : [];
        
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        // Aggiunge le righe per ogni codice
        lines.forEach((code, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${code.trim()}</td>
                <td>
                    <button type="button" class="remove-code-btn" onclick="removeCodeFromPaintingList(${index}, document.getElementById('${hiddenInput.id}'), document.getElementById('${tableBody.id}'), document.getElementById('${countElement.id}'))">
                        ×
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        if (countElement) {
            countElement.textContent = lines.length;
        }
    }

    // Rendi globali le funzioni per l'uso negli onclick
    window.removeCodeFromPaintingList = removeCodeFromPaintingList;

    kitForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Gestione automatica del prefisso RAL per codici di 4 cifre
        let coloreValue = document.getElementById('colore').value.trim();
        if (/^\d{4}$/.test(coloreValue)) {
            coloreValue = 'RAL' + coloreValue;
        }
        
        const formData = {
            numero_settimana: document.getElementById('numero_settimana').value,
            linea: document.getElementById('linea').value,
            colore: coloreValue,
            sequenza: document.getElementById('sequenza').value,
            numero_carrelli: document.getElementById('numero_carrelli').value, // NUOVO COLLI
            pronto: document.getElementById('pronto').value,
            note: document.getElementById('note').value,
            painting_list: document.getElementById('painting_list').value
        };

        try {
            const response = await fetch('/api/add_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();

            if (response.ok && result.success) {
                kitForm.reset();
                document.getElementById('linea').value = ""; 
                setCurrentWeek(); // Ripristina la settimana corrente
                // Reset painting list
                document.getElementById('painting_list').value = '';
                updateScannedCodesTable(
                    document.getElementById('painting_list'), 
                    document.getElementById('scannedCodesBody'), 
                    document.getElementById('paintingListCount')
                );
                loadRecentKitItems();
            } else {
                alert(`Errore: ${result.error || 'Impossibile aggiungere il kit.'}`);
            }
        } catch (error) {
            console.error('Errore invio form kit:', error);
            alert('Errore di comunicazione durante l\'aggiunta del kit.');
        }
    });

    async function loadRecentKitItems() {
        try {
            const response = await fetch(`/api/get_recent_items_all`); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const items = await response.json();

            const tableBody = document.getElementById('recentKitTableBody');
            if (!tableBody) {
                console.error('Elemento recentKitTableBody non trovato');
                return;
            }

            if (!items || items.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='9' class='text-center'>Nessun kit recente.</td></tr>";
                return;
            }
            
            const escapeForHtmlAttr = (jsonString) => jsonString.replace(/'/g, "'");

            tableBody.innerHTML = items.map(item => `
                <tr class="${item.completato ? 'completed-row' : ''}">
                    <td class="checkbox-cell">
                        <input type="checkbox" 
                               ${item.completato ? 'checked' : ''} 
                               onchange="toggleCompletato(${item.sequenza}, ${item.id}, this)"
                               class="completato-checkbox">
                    </td>
                    <td>${item.linea || 'N/D'}</td>
                    <td>${formatColor(item.colore)}</td>
                    <td>${item.numero_carrelli !== null ? item.numero_carrelli : 'N/D'}</td>
                    <td>${item.numero_settimana || 'N/D'}</td>
                    <td>SEQ ${item.sequenza}</td>
                    <td><span class="${item.pronto === 'Si' ? 'status-ready' : (item.pronto === 'Parziale' ? 'status-partial' : 'status-not-ready')}">${item.pronto}</span></td>
                    <td>${createPaintingListCell(item.painting_list)}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" onclick='editKitItem(${escapeForHtmlAttr(JSON.stringify(item))})'>✎</button>
                        <button class="delete-btn" onclick="deleteKitItem(${item.sequenza}, ${item.id})">×</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Errore caricamento kit recenti:', error);
            const tableBody = document.getElementById('recentKitTableBody');
            if (tableBody) {
                tableBody.innerHTML = "<tr><td colspan='9' class='text-center'>Errore caricamento kit recenti.</td></tr>";
            }
        }
    }

    // Funzione per gestire il toggle del checkbox completato
    window.toggleCompletato = async function(sequenceNum, itemId, checkbox) {
        try {
            const response = await fetch(`/api/toggle_completato/${sequenceNum}/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Aggiorna la classe CSS della riga
                const row = checkbox.closest('tr');
                if (result.new_completato) {
                    row.classList.add('completed-row');
                } else {
                    row.classList.remove('completed-row');
                }
            } else {
                // Ripristina lo stato del checkbox in caso di errore
                checkbox.checked = !checkbox.checked;
                alert(`Errore aggiornamento completato: ${result.error || 'Sconosciuto'}`);
            }
        } catch (error) {
            // Ripristina lo stato del checkbox in caso di errore
            checkbox.checked = !checkbox.checked;
            console.error('Errore toggle completato:', error);
            alert('Errore di comunicazione durante l\'aggiornamento.');
        }
    }
    
    window.loadRecentKitItems = loadRecentKitItems;
});

function setupKitModal() { /* ... (invariato) ... */ 
    const modal = document.getElementById('editModal'); 
    if (!modal) {
        console.warn("Modal 'editModal' non trovato in kit_form.html. Setup saltato.");
        return;
    }
    const span = modal.querySelector('.close'); 
    const editKitForm = document.getElementById('editKitForm');

    if (!span || !editKitForm) {
        console.error("Elementi interni del modal non trovati.");
        return;
    }

    span.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

    editKitForm.onsubmit = async function(e) {
        e.preventDefault();
        await updateKitItem(); 
    }
}
window.setupKitModal = setupKitModal;

window.editKitItem = function(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemSequence').value = item.sequenza;
    document.getElementById('editNumeroSettimana').value = item.numero_settimana || '';
    document.getElementById('editLinea').value = item.linea || ''; 
    document.getElementById('editColore').value = item.colore || '';
    document.getElementById('editNumeroCarrelli').value = item.numero_carrelli !== null ? item.numero_carrelli : ''; // NUOVO COLLI
    document.getElementById('editPronto').value = item.pronto || 'No';
    document.getElementById('editNote').value = item.note || '';
    
    // Popola la Painting List
    const editPaintingList = document.getElementById('editPaintingList');
    if (editPaintingList) {
        editPaintingList.value = item.painting_list || '';
        updateScannedCodesTable(
            editPaintingList, 
            document.getElementById('editScannedCodesBody'), 
            document.getElementById('editPaintingListCount')
        );
    }
    
    document.getElementById('editModal').style.display = 'block';
}

async function updateKitItem() {
    const itemId = document.getElementById('editItemId').value;
    const sequence = document.getElementById('editItemSequence').value;

    // Gestione automatica del prefisso RAL per codici di 4 cifre nel form di modifica
    let editColoreValue = document.getElementById('editColore').value.trim();
    if (/^\d{4}$/.test(editColoreValue)) {
        editColoreValue = 'RAL' + editColoreValue;
    }

    const formData = {
        numero_settimana: document.getElementById('editNumeroSettimana').value,
        linea: document.getElementById('editLinea').value,
        colore: editColoreValue,
        numero_carrelli: document.getElementById('editNumeroCarrelli').value, // NUOVO COLLI
        pronto: document.getElementById('editPronto').value,
        note: document.getElementById('editNote').value,
        painting_list: document.getElementById('editPaintingList').value
    };

    try {
        const response = await fetch(`/api/update_item/${sequence}/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (response.ok && result.success) {
            document.getElementById('editModal').style.display = 'none';
            if (typeof loadRecentKitItems === 'function') loadRecentKitItems();
        } else {
            alert(`Errore: ${result.error || 'Impossibile aggiornare.'}`);
        }
    } catch (error) {
        console.error('Errore update kit:', error);
        alert('Errore di comunicazione durante l\'aggiornamento.');
    }
}
window.updateKitItem = updateKitItem;

window.deleteKitItem = async function(sequence, id) { /* ... (invariato) ... */ 
    if (confirm('Sei sicuro di voler eliminare questo elemento kit?')) {
        try {
            const response = await fetch(`/api/delete_item/${sequence}/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (response.ok && result.success) {
                if (typeof loadRecentKitItems === 'function') loadRecentKitItems();
            } else {
                alert(`Errore: ${result.error || 'Impossibile eliminare.'}`);
            }
        } catch (error) {
            console.error('Errore delete kit:', error);
            alert('Errore di comunicazione durante l\'eliminazione.');
        }
    }
}

// Funzione per creare la cella della painting list con dropdown
function createPaintingListCell(paintingList) {
    if (!paintingList || !paintingList.trim()) {
        return 'Nessuna';
    }
    
    const codes = paintingList.split('\n').filter(c => c.trim());
    const count = codes.length;
    const dropdownId = 'dropdown_' + Math.random().toString(36).substr(2, 9);
    
    return `
        <div class="painting-dropdown">
            <button class="painting-btn" onclick="togglePaintingDropdown('${dropdownId}')">${count} codici</button>
            <div id="${dropdownId}" class="painting-dropdown-content">
                <div class="painting-dropdown-header">Codici Painting List (${count})</div>
                ${codes.map(code => `<div class="painting-code-item">${code.trim()}</div>`).join('')}
            </div>
        </div>
    `;
}

// Funzione per gestire il toggle del dropdown
function togglePaintingDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    // Chiudi tutti gli altri dropdown aperti
    document.querySelectorAll('.painting-dropdown-content.show').forEach(el => {
        if (el.id !== dropdownId) {
            el.classList.remove('show');
        }
    });
    
    // Toggle del dropdown corrente
    dropdown.classList.toggle('show');
}

// Chiudi dropdown quando si clicca altrove
document.addEventListener('click', function(event) {
    if (!event.target.matches('.painting-btn')) {
        document.querySelectorAll('.painting-dropdown-content.show').forEach(el => {
            el.classList.remove('show');
        });
    }
});

// Rendi le funzioni globali
window.createPaintingListCell = createPaintingListCell;
window.togglePaintingDropdown = togglePaintingDropdown;