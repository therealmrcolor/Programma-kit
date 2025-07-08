document.addEventListener('DOMContentLoaded', function() {
    const modalEditLineaSelect = document.getElementById('modalEditLinea');

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
                tableBody.innerHTML = "<tr><td colspan='7' class='text-center'>Nessun kit in questa sequenza.</td></tr>";
                return;
            }
            
            const escapeForHtmlAttr = (jsonString) => jsonString.replace(/'/g, "'");

            tableBody.innerHTML = items.map(item => `
                <tr>
                    <td>${item.linea || 'N/D'}</td>
                    <td>${item.colore}</td>
                    <td>${item.numero_carrelli !== null ? item.numero_carrelli : 'N/D'}</td>
                    <td>${item.numero_settimana || 'N/D'}</td>
                    <td><span class="${item.pronto === 'Si' ? 'status-ready' : 'status-not-ready'}">${item.pronto}</span></td>
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
                tableBody.innerHTML = "<tr><td colspan='7' class='text-center'>Errore caricamento kit.</td></tr>";
            }
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
        
        const formData = {
            numero_settimana: document.getElementById('modalEditNumeroSettimana').value,
            linea: document.getElementById('modalEditLinea').value,
            colore: document.getElementById('modalEditColore').value,
            numero_carrelli: document.getElementById('modalEditNumeroCarrelli').value, // NUOVO
            pronto: document.getElementById('modalEditPronto').value,
            note: document.getElementById('modalEditNote').value
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

    loadAvailableLineeForModal();
    loadKitItems();
});