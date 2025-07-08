document.addEventListener('DOMContentLoaded', function() {
    const kitForm = document.getElementById('kitDataForm');
    const recentKitItemsList = document.getElementById('recentKitItemsList');
    const lineaSelect = document.getElementById('linea');
    const editLineaSelect = document.getElementById('editLinea');

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

    kitForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            numero_settimana: document.getElementById('numero_settimana').value,
            linea: document.getElementById('linea').value,
            colore: document.getElementById('colore').value,
            sequenza: document.getElementById('sequenza').value,
            numero_carrelli: document.getElementById('numero_carrelli').value, // NUOVO
            pronto: document.getElementById('pronto').value,
            note: document.getElementById('note').value
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
                tableBody.innerHTML = "<tr><td colspan='7' class='text-center'>Nessun kit recente.</td></tr>";
                return;
            }
            
            const escapeForHtmlAttr = (jsonString) => jsonString.replace(/'/g, "'");

            tableBody.innerHTML = items.map(item => `
                <tr>
                    <td>${item.linea || 'N/D'}</td>
                    <td>${item.colore}</td>
                    <td>${item.numero_carrelli !== null ? item.numero_carrelli : 'N/D'}</td>
                    <td>${item.numero_settimana || 'N/D'}</td>
                    <td>SEQ ${item.sequenza}</td>
                    <td><span class="${item.pronto === 'Si' ? 'status-ready' : 'status-not-ready'}">${item.pronto}</span></td>
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
                tableBody.innerHTML = "<tr><td colspan='7' class='text-center'>Errore caricamento kit recenti.</td></tr>";
            }
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
    document.getElementById('editNumeroCarrelli').value = item.numero_carrelli !== null ? item.numero_carrelli : ''; // NUOVO
    document.getElementById('editPronto').value = item.pronto || 'No';
    document.getElementById('editNote').value = item.note || '';
    document.getElementById('editModal').style.display = 'block';
}

async function updateKitItem() {
    const itemId = document.getElementById('editItemId').value;
    const sequence = document.getElementById('editItemSequence').value;

    const formData = {
        numero_settimana: document.getElementById('editNumeroSettimana').value,
        linea: document.getElementById('editLinea').value,
        colore: document.getElementById('editColore').value,
        numero_carrelli: document.getElementById('editNumeroCarrelli').value, // NUOVO
        pronto: document.getElementById('editPronto').value,
        note: document.getElementById('editNote').value
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