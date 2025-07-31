document.addEventListener('DOMContentLoaded', function() {
    const modalEditLineaSelect = document.getElementById('modalEditLinea');

    // Funzione per formattare il colore (aggiunge RAL se 4 cifre)
    function formatColor(color) {
        if (color && /^\d{4}$/.test(color.toString())) {
            return `RAL${color}`;
        }
        return color;
    }

    // Setup Painting List per modal
    setupPaintingListForModal();

    function setupPaintingListForModal() {
        setupPaintingListForForm(
            'modalEditPaintingListScanner', 
            'modalEditPaintingList', 
            'modalEditScannedCodesBody', 
            'modalEditPaintingListCount', 
            'modalEditClearPaintingList'
        );
    }

    function setupPaintingListForForm(scannerId, hiddenInputId, tableBodyId, countId, clearBtnId) {
        const scannerInput = document.getElementById(scannerId);
        const hiddenInput = document.getElementById(hiddenInputId);
        const tableBody = document.getElementById(tableBodyId);
        const countElement = document.getElementById(countId);
        const clearBtn = document.getElementById(clearBtnId);
        
        if (!scannerInput) return;

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

    function updateScannedCodesTable(hiddenInput, tableBody, countElement) {
        const lines = hiddenInput.value.trim() ? hiddenInput.value.split('\n').filter(line => line.trim()) : [];
        
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
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

    // Rendi globali le funzioni
    window.removeCodeFromPaintingList = removeCodeFromPaintingList;

    async function loadAvailableLineeForModal() { /* ... (invariato) ... */ 
        try {
            const response = await fetch('/api/get_linee');
            const linee = await response.json();
            modalEditLineaSelect.innerHTML = '<option value="">Seleziona Linea</option>';
            linee.forEach(linea => {
                const option = document.createElement('option');
                option.value = linea.nome;
                option.textContent = linea.nome;
                modalEditLineaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Errore caricamento linee per modal:', error);
        }
    }

    async function loadKitItems() {
        try {
            const response = await fetch(`/api/get_items/${currentSequenceNum}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const items = await response.json();

            const tableBody = document.getElementById('kitSequenceTableBody');
            if (!tableBody) {
                console.error('Elemento kitSequenceTableBody non trovato');
                return;
            }

            if (!items || items.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='9' class='text-center'>Nessun kit in questa sequenza.</td></tr>";
                return;
            }
            
            const escapeForHtmlAttr = (jsonString) => jsonString.replace(/'/g, "'");

            tableBody.innerHTML = items.map(item => `
                <tr class="${item.completato ? 'completed-row' : ''}">
                    <td class="checkbox-cell">
                        <input type="checkbox" 
                               ${item.completato ? 'checked' : ''} 
                               onchange="toggleCompletato(${currentSequenceNum}, ${item.id}, this)"
                               class="completato-checkbox">
                    </td>
                    <td>${item.linea || 'N/D'}</td>
                    <td>${formatColor(item.colore)}</td>
                    <td>${item.numero_carrelli !== null ? item.numero_carrelli : 'N/D'}</td>
                    <td>${item.numero_settimana || 'N/D'}</td>
                    <td><span class="${item.pronto === 'Si' ? 'status-ready' : (item.pronto === 'Parziale' ? 'status-partial' : 'status-not-ready')}">${item.pronto}</span></td>
                    <td>${createPaintingListCell(item.painting_list)}</td>
                    <td class="notes-cell">${item.note || ''}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" onclick='openEditKitModal(${escapeForHtmlAttr(JSON.stringify(item))})'>✎</button>
                        <button class="delete-btn" onclick="deleteKitItemFromDisplay(${item.sequenza}, ${item.id})">×</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Errore caricamento kit items per display:', error);
            const tableBody = document.getElementById('kitSequenceTableBody');
            if (tableBody) {
                tableBody.innerHTML = "<tr><td colspan='9' class='text-center'>Errore caricamento kit.</td></tr>";
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

    const modal = document.getElementById('editKitItemModal');
    const spanClose = modal.querySelector('.close');
    const editForm = document.getElementById('editKitItemForm');

    spanClose.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

    editForm.onsubmit = async function(e) {
        e.preventDefault();
        const itemId = document.getElementById('modalEditItemId').value;
        
        // Gestione automatica del prefisso RAL per codici di 4 cifre
        let modalEditColoreValue = document.getElementById('modalEditColore').value.trim();
        if (/^\d{4}$/.test(modalEditColoreValue)) {
            modalEditColoreValue = 'RAL' + modalEditColoreValue;
        }
        
        const formData = {
            numero_settimana: document.getElementById('modalEditNumeroSettimana').value,
            linea: document.getElementById('modalEditLinea').value,
            colore: modalEditColoreValue,
            numero_carrelli: document.getElementById('modalEditNumeroCarrelli').value, // NUOVO
            pronto: document.getElementById('modalEditPronto').value,
            note: document.getElementById('modalEditNote').value,
            painting_list: document.getElementById('modalEditPaintingList').value
        };

        try {
            const response = await fetch(`/api/update_item/${currentSequenceNum}/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok && result.success) {
                modal.style.display = 'none';
                loadKitItems();
            } else {
                alert(`Errore aggiornamento: ${result.error || 'Sconosciuto'}`);
            }
        } catch (error) {
            console.error('Errore update kit item:', error);
            alert('Errore di comunicazione durante l\'aggiornamento.');
        }
    };

    window.openEditKitModal = function(item) {
        document.getElementById('modalEditItemId').value = item.id;
        document.getElementById('modalEditNumeroSettimana').value = item.numero_settimana || '';
        document.getElementById('modalEditLinea').value = item.linea || '';
        document.getElementById('modalEditColore').value = item.colore || '';
        document.getElementById('modalEditNumeroCarrelli').value = item.numero_carrelli !== null ? item.numero_carrelli : ''; // NUOVO
        document.getElementById('modalEditPronto').value = item.pronto || 'No';
        document.getElementById('modalEditNote').value = item.note || '';
        
        // Popola la Painting List
        const modalEditPaintingList = document.getElementById('modalEditPaintingList');
        if (modalEditPaintingList) {
            modalEditPaintingList.value = item.painting_list || '';
            updateScannedCodesTable(
                modalEditPaintingList, 
                document.getElementById('modalEditScannedCodesBody'), 
                document.getElementById('modalEditPaintingListCount')
            );
        }
        
        modal.style.display = 'block';
    }

    window.deleteKitItemFromDisplay = async function(sequenceNum, itemId) { /* ... (invariato) ... */ 
        if (confirm('Sei sicuro di voler eliminare questo kit?')) {
            try {
                const response = await fetch(`/api/delete_item/${sequenceNum}/${itemId}`, { method: 'DELETE' });
                const result = await response.json();
                if (response.ok && result.success) {
                    loadKitItems();
                } else {
                    alert(`Errore eliminazione: ${result.error || 'Sconosciuto'}`);
                }
            } catch (error) {
                console.error('Errore delete kit item:', error);
                alert('Errore di comunicazione.');
            }
        }
    }
    
    window.clearKitSequenceByWeek = async function(sequenceNum) { /* ... (invariato) ... */ 
        const weekNumInput = document.getElementById('weekNumToClear');
        const weekNum = weekNumInput.value;
        if (!weekNum) {
            alert('Inserisci un numero di settimana.');
            return;
        }
        if (confirm(`Sei sicuro di voler eliminare tutti i kit della settimana ${weekNum} per questa sequenza?`)) {
            try {
                const response = await fetch(`/api/clear_sequence_by_week/${sequenceNum}/${weekNum}`, { method: 'DELETE' });
                const result = await response.json();
                if (response.ok && result.success) {
                    alert(`Eliminati ${result.deleted_count} kit per la settimana ${weekNum}.`);
                    loadKitItems();
                    weekNumInput.value = ''; 
                } else {
                    alert(`Errore svuotamento per settimana: ${result.error || 'Sconosciuto'}`);
                }
            } catch (error) {
                console.error('Errore clear kit sequence by week:', error);
                alert('Errore di comunicazione.');
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

    loadAvailableLineeForModal();
    loadKitItems();
});