document.addEventListener('DOMContentLoaded', function () {
    const addLineaForm = document.getElementById('addLineaForm');
    const nomeLineaInput = document.getElementById('nomeLinea');
    const lineeListDiv = document.getElementById('lineeList');

    async function loadLinee() {
        try {
            const response = await fetch('/api/get_linee');
            const linee = await response.json();
            lineeListDiv.innerHTML = ''; // Clear
            if (linee.length === 0) {
                lineeListDiv.innerHTML = '<p>Nessuna linea definita.</p>';
                return;
            }
            linee.forEach(linea => {
                const div = document.createElement('div');
                div.classList.add('linea-item');
                div.innerHTML = `
                    <span>${linea.nome}</span>
                    <button class="delete-btn" data-id="${linea.id}">Elimina</button>
                `;
                lineeListDiv.appendChild(div);
            });
        } catch (error) {
            console.error('Errore caricamento linee:', error);
            lineeListDiv.innerHTML = '<p>Errore caricamento linee.</p>';
        }
    }

    addLineaForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const nome = nomeLineaInput.value.trim();
        if (!nome) return;

        try {
            const response = await fetch('/api/add_linea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                nomeLineaInput.value = '';
                loadLinee();
            } else {
                alert(`Errore: ${result.error || 'Impossibile aggiungere la linea.'}`);
            }
        } catch (error) {
            console.error('Errore aggiunta linea:', error);
            alert('Errore di comunicazione.');
        }
    });

    lineeListDiv.addEventListener('click', async function (e) {
        if (e.target.classList.contains('delete-btn')) {
            const lineaId = e.target.dataset.id;
            if (confirm('Sei sicuro di voler eliminare questa linea?')) {
                try {
                    const response = await fetch(`/api/delete_linea/${lineaId}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        loadLinee();
                    } else {
                        alert(`Errore: ${result.error || 'Impossibile eliminare la linea.'}`);
                    }
                } catch (error) {
                    console.error('Errore eliminazione linea:', error);
                    alert('Errore di comunicazione.');
                }
            }
        }
    });

    loadLinee();
});