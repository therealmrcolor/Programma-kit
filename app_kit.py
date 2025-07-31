from flask import Flask, render_template, request, jsonify, redirect, url_for
import sqlite3
from datetime import datetime
from waitress import serve
import os

DATABASE_PATH = os.path.join('database_kit', 'kit_sequences.db')
STATIC_FOLDER = 'static'
TEMPLATE_FOLDER = 'templates'

app = Flask(__name__, static_folder=STATIC_FOLDER, template_folder=TEMPLATE_FOLDER)

# Middleware per forzare HTTPS quando necessario per la fotocamera
@app.before_request
def force_https():
    # Solo su produzione, non in locale
    if not request.is_secure and request.host != 'localhost' and '127.0.0.1' not in request.host:
        # Controlla se la richiesta è per le funzionalità della fotocamera
        if 'barcode' in request.path.lower() or 'camera' in request.path.lower():
            return redirect(request.url.replace('http://', 'https://'), code=301)

def adapt_datetime(ts):
    return ts.isoformat()

def item_row_to_dict(item_row):
    # Schema flessibile che gestisce diverse strutture di colonne
    try:
        # Se la riga ha 11 colonne (formato attuale con tutte le colonne incluso completato)
        if len(item_row) == 11:
            return {
                'id': item_row[0],
                'numero_settimana': item_row[1],
                'linea': item_row[2],
                'colore': item_row[3],
                'sequenza': item_row[4],
                'numero_carrelli': item_row[5],
                'pronto': item_row[6],
                'note': item_row[7],
                'timestamp': item_row[8],
                'painting_list': item_row[9],
                'completato': item_row[10] if item_row[10] is not None else 0
            }
        # Se la riga ha 10 colonne (formato precedente senza completato)
        elif len(item_row) == 10:
            return {
                'id': item_row[0],
                'numero_settimana': item_row[1],
                'linea': item_row[2],
                'colore': item_row[3],
                'sequenza': item_row[4],
                'numero_carrelli': item_row[5],
                'pronto': item_row[6],
                'note': item_row[7],
                'timestamp': item_row[8],
                'painting_list': item_row[9],
                'completato': 0  # Default per compatibilità
            }
        # Se la riga ha 9 colonne, potrebbe mancare numero_carrelli
        elif len(item_row) == 9:
            return {
                'id': item_row[0],
                'numero_settimana': item_row[1],
                'linea': item_row[2],
                'colore': item_row[3],
                'sequenza': item_row[4],
                'pronto': item_row[5],
                'note': item_row[6],
                'timestamp': item_row[7],
                'painting_list': item_row[8],
                'numero_carrelli': None,  # Default per compatibilità
                'completato': 0  # Default per compatibilità
            }
        # Formato legacy con 8 colonne
        elif len(item_row) == 8:
            return {
                'id': item_row[0],
                'numero_settimana': item_row[1],
                'linea': item_row[2],
                'colore': item_row[3],
                'sequenza': item_row[4],
                'pronto': item_row[5],
                'note': item_row[6],
                'timestamp': item_row[7],
                'painting_list': '',  # Default vuoto
                'numero_carrelli': None,  # Default per compatibilità
                'completato': 0  # Default per compatibilità
            }
        else:
            print(f"Formato riga non riconosciuto: {len(item_row)} colonne - {item_row}")
            return None
    except Exception as e:
        print(f"Errore parsing riga: {e} - {item_row}")
        return None

def init_db():
    db_dir = os.path.dirname(DATABASE_PATH)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    sqlite3.register_adapter(datetime, adapt_datetime)
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    
    for i in range(1, 8):
        # Crea la tabella se non esiste
        c.execute(f'''
        CREATE TABLE IF NOT EXISTS sequence_{i} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_settimana INTEGER NOT NULL,
            linea TEXT,
            colore TEXT NOT NULL,
            sequenza TEXT NOT NULL,
            numero_carrelli INTEGER, -- NUMERO COLLI
            pronto TEXT NOT NULL,
            note TEXT,
            painting_list TEXT,
            timestamp DATETIME NOT NULL 
        )
        ''')
        
        # Controlla se le colonne mancanti esistono, altrimenti le aggiunge
        c.execute(f"PRAGMA table_info(sequence_{i})")
        columns = [column[1] for column in c.fetchall()]
        
        if 'numero_carrelli' not in columns:
            c.execute(f'ALTER TABLE sequence_{i} ADD COLUMN numero_carrelli INTEGER')
            print(f"Aggiunta colonna numero_carrelli (NUMERO COLLI) a sequence_{i}")
            
        if 'painting_list' not in columns:
            c.execute(f'ALTER TABLE sequence_{i} ADD COLUMN painting_list TEXT')
            print(f"Aggiunta colonna painting_list a sequence_{i}")
        
        if 'completato' not in columns:
            c.execute(f'ALTER TABLE sequence_{i} ADD COLUMN completato INTEGER DEFAULT 0')
            print(f"Aggiunta colonna completato a sequence_{i}")
    
    # Crea la tabella delle linee disponibili

    c.execute('''
    CREATE TABLE IF NOT EXISTS linee_disponibili (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def home():
    return redirect(url_for('kit_form_page'))

@app.route('/kit-inserimento')
def kit_form_page():
    return render_template('kit_form.html')

@app.route('/manage-linee')
def manage_linee_page():
    return render_template('manage_linee.html')

@app.route('/kit-sequence/<int:seq_num>')
def kit_sequence_display_page(seq_num):
    if 1 <= seq_num <= 7:
        return render_template('sequence_display_kit.html', seq_num=seq_num)
    return "Sequenza Kit non trovata", 404

@app.route('/network-test')
def network_test_page():
    return render_template('network_test.html')

# --- API per Linee (invariate) ---
@app.route('/api/get_linee', methods=['GET'])
def get_linee():
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    c.execute("SELECT id, nome FROM linee_disponibili ORDER BY nome ASC")
    linee = [{"id": row[0], "nome": row[1]} for row in c.fetchall()]
    conn.close()
    return jsonify(linee)

@app.route('/api/add_linea', methods=['POST'])
def add_linea():
    data = request.json
    nome_linea = data.get('nome')
    if not nome_linea:
        return jsonify({"success": False, "error": "Nome linea mancante"}), 400
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO linee_disponibili (nome) VALUES (?)", (nome_linea,))
        conn.commit()
        return jsonify({"success": True, "id": c.lastrowid, "nome": nome_linea})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "error": "Nome linea già esistente"}), 409
    except sqlite3.Error as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/delete_linea/<int:linea_id>', methods=['DELETE'])
def delete_linea(linea_id):
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    try:
        c.execute("DELETE FROM linee_disponibili WHERE id = ?", (linea_id,))
        conn.commit()
        if c.rowcount == 0: return jsonify({"success": False, "error": "Linea non trovata"}), 404
        return jsonify({"success": True})
    except sqlite3.Error as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conn: conn.close()

# --- API per Item (Kit) ---
@app.route('/api/add_item', methods=['POST'])
def add_item():
    data = request.json
    
    numero_settimana_str = data.get('numero_settimana')
    linea = data.get('linea')
    colore = data.get('colore')
    sequenza_target_str = data.get('sequenza')
    numero_carrelli_str = data.get('numero_carrelli') # NUMERO COLLI
    pronto = data.get('pronto')
    note = data.get('note', '')
    painting_list = data.get('painting_list', '') # NUOVO

    if numero_settimana_str is None: return jsonify({"success": False, "error": "Numero settimana mancante"}), 400
    try: numero_settimana = int(numero_settimana_str)
    except (ValueError, TypeError): return jsonify({"success": False, "error": "Numero settimana deve essere un intero"}), 400
    
    numero_carrelli = None # Default a None se non fornito o non valido
    if numero_carrelli_str is not None and numero_carrelli_str != '': # Permetti campo vuoto, che diventerà NULL
        try:
            numero_carrelli = int(numero_carrelli_str)
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "Numero colli deve essere un intero"}), 400
            
    if not colore: return jsonify({"success": False, "error": "Colore mancante"}), 400
    if not pronto: return jsonify({"success": False, "error": "Stato 'Pronto' mancante"}), 400
    if not sequenza_target_str: return jsonify({"success": False, "error": "Sequenza di destinazione mancante"}), 400
    try:
        sequenza_target_num = int(sequenza_target_str)
        if not (1 <= sequenza_target_num <= 7): raise ValueError()
    except ValueError: return jsonify({"success": False, "error": "Sequenza di destinazione non valida (1-7)"}), 400
    
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    
    columns_ordered = [
        'numero_settimana', 'linea', 'colore', 'sequenza', 
        'numero_carrelli', # NUMERO COLLI
        'pronto', 'note', 'painting_list', 'timestamp', 'completato' # NUOVO
    ]
    values_ordered = [
        numero_settimana, linea, colore, sequenza_target_str, 
        numero_carrelli, # NUMERO COLLI
        pronto, note, painting_list, datetime.now(), 0 # NUOVO - completato inizialmente a False
    ]

    columns_sql_str = ', '.join(columns_ordered)
    placeholders_sql_str = ', '.join(['?' for _ in values_ordered])
    
    try:
        c.execute(f'''INSERT INTO sequence_{sequenza_target_num} 
                    ({columns_sql_str})
                    VALUES ({placeholders_sql_str})''',
                    values_ordered)
        conn.commit()
        item_id = c.lastrowid
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Errore DB: {str(e)}"}), 500
    finally:
        if conn: conn.close()
    
    return jsonify({"success": True, "id": item_id})

@app.route('/api/get_items/<int:sequence_num>')
def get_kit_items_for_sequence(sequence_num):
    if not (1 <= sequence_num <= 7):
        return jsonify({"success": False, "error": "Numero sequenza non valido"}), 400
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    c.execute(f'SELECT * FROM sequence_{sequence_num} ORDER BY timestamp DESC')
    items_rows = c.fetchall()
    conn.close()
    result = []
    for item_row in items_rows:
        item_dict = item_row_to_dict(item_row)
        if item_dict is not None:
            result.append(item_dict)
    return jsonify(result)

@app.route('/api/get_recent_items_all')
def get_recent_kit_items_all():
    all_items_list = []
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    for i in range(1, 8):
        try:
            # Verifica che la tabella abbia tutte le colonne necessarie
            c.execute(f"PRAGMA table_info(sequence_{i})")
            columns = [column[1] for column in c.fetchall()]
            expected_columns = ['id', 'numero_settimana', 'linea', 'colore', 'sequenza', 'numero_carrelli', 'pronto', 'note', 'painting_list', 'timestamp', 'completato']
            
            # Se mancano colonne, salta questa sequenza e registra l'errore
            missing_columns = [col for col in expected_columns if col not in columns]
            if missing_columns:
                print(f"Colonne mancanti in sequence_{i}: {missing_columns}")
                continue
                
            c.execute(f'SELECT * FROM sequence_{i}')
            items_from_sequence = c.fetchall()
            for item_row in items_from_sequence:
                try:
                    item_dict = item_row_to_dict(item_row)
                    if item_dict is not None:  # Solo se il parsing è riuscito
                        all_items_list.append(item_dict)
                except Exception as e:
                    print(f"Errore parsing item in sequence_{i}: {e}")
                    continue
        except sqlite3.Error as e:
            print(f"Errore fetch da sequence_{i} per kit: {e}")
    conn.close()
    all_items_list.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(all_items_list[:5])

@app.route('/api/update_item/<int:sequence_num>/<int:item_id>', methods=['PUT'])
def update_kit_item(sequence_num, item_id):
    if not (1 <= sequence_num <= 7):
        return jsonify({"success": False, "error": "Numero sequenza non valido"}), 400
    
    data = request.json
    numero_settimana_str = data.get('numero_settimana')
    linea = data.get('linea', '')
    colore = data.get('colore')
    numero_carrelli_str = data.get('numero_carrelli') # NUMERO COLLI
    pronto = data.get('pronto')
    note = data.get('note', '')
    painting_list = data.get('painting_list', '') # NUOVO

    if numero_settimana_str is None: return jsonify({"success": False, "error": "Numero settimana mancante"}), 400
    try: numero_settimana = int(numero_settimana_str)
    except (ValueError, TypeError): return jsonify({"success": False, "error": "Numero settimana non valido"}), 400

    numero_carrelli = None
    if numero_carrelli_str is not None and numero_carrelli_str != '':
        try:
            numero_carrelli = int(numero_carrelli_str)
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "Numero colli deve essere un intero"}), 400

    if not colore: return jsonify({"success": False, "error": "Colore mancante"}), 400
    if not pronto: return jsonify({"success": False, "error": "Stato 'Pronto' mancante"}), 400

    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    
    columns_to_update = ['numero_settimana', 'linea', 'colore', 
                         'numero_carrelli', # NUMERO COLLI
                         'pronto', 'note', 'painting_list'] # NUOVO
    update_values = [numero_settimana, linea, colore, 
                     numero_carrelli, # NUMERO COLLI
                     pronto, note, painting_list] # NUOVO
    
    set_clause = ', '.join([f'{col} = ?' for col in columns_to_update])
    update_values.append(item_id)
    
    try:
        c.execute(f'''UPDATE sequence_{sequence_num} 
                    SET {set_clause}
                    WHERE id = ?''', update_values)
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Errore DB: {str(e)}"}), 500
    finally:
        if conn: conn.close()
    return jsonify({"success": True})

# delete_kit_item e clear_kit_sequence_by_week rimangono invariati

@app.route('/api/delete_item/<int:sequence_num>/<int:item_id>', methods=['DELETE'])
def delete_kit_item(sequence_num, item_id):
    if not (1 <= sequence_num <= 7):
        return jsonify({"success": False, "error": "Numero sequenza non valido"}), 400
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    try:
        c.execute(f'DELETE FROM sequence_{sequence_num} WHERE id = ?', (item_id,))
        conn.commit()
        if c.rowcount == 0: return jsonify({"success": False, "error": "Item non trovato"}), 404
        return jsonify({"success": True})
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Errore DB: {str(e)}"}), 500
    finally:
        if conn: conn.close()


@app.route('/api/toggle_completato/<int:sequence_num>/<int:item_id>', methods=['PUT'])
def toggle_completato(sequence_num, item_id):
    if not (1 <= sequence_num <= 7):
        return jsonify({"success": False, "error": "Numero sequenza non valido"}), 400
    
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    
    try:
        # Prima ottieni lo stato attuale
        c.execute(f'SELECT completato FROM sequence_{sequence_num} WHERE id = ?', (item_id,))
        result = c.fetchone()
        if not result:
            return jsonify({"success": False, "error": "Item non trovato"}), 404
        
        current_completato = result[0] if result[0] is not None else 0
        new_completato = 1 if current_completato == 0 else 0
        
        # Aggiorna con il nuovo valore
        c.execute(f'UPDATE sequence_{sequence_num} SET completato = ? WHERE id = ?', 
                 (new_completato, item_id))
        conn.commit()
        
        return jsonify({"success": True, "new_completato": new_completato})
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Errore DB: {str(e)}"}), 500
    finally:
        if conn: conn.close()


@app.route('/api/clear_sequence_by_week/<int:sequence_num>/<int:week_num>', methods=['DELETE'])
def clear_kit_sequence_by_week(sequence_num, week_num):
    if not (1 <= sequence_num <= 7):
        return jsonify({"success": False, "error": "Numero sequenza non valido"}), 400
    conn = sqlite3.connect(DATABASE_PATH)
    c = conn.cursor()
    try:
        c.execute(f'DELETE FROM sequence_{sequence_num} WHERE numero_settimana = ?', (week_num,))
        conn.commit()
        return jsonify({"success": True, "deleted_count": c.rowcount})
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conn: conn.close()


if __name__ == '__main__':
    init_db()
    
    # Controlla se vogliamo HTTPS per la fotocamera
    import ssl
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--https', action='store_true', help='Avvia con HTTPS per supporto fotocamera')
    parser.add_argument('--localhost', action='store_true', help='Avvia solo su localhost (fotocamera funziona senza HTTPS)')
    parser.add_argument('--network', action='store_true', help='Avvia su rete locale (Android camera su IP locale)')
    args, unknown = parser.parse_known_args()
    
    if args.https:
        # Crea certificato auto-firmato se non esiste
        import subprocess
        import os
        
        cert_file = 'server.crt'
        key_file = 'server.key'
        
        if not os.path.exists(cert_file) or not os.path.exists(key_file):
            print("Creazione certificato auto-firmato per HTTPS...")
            
            # Metodo 1: Prova con OpenSSL (se disponibile)
            openssl_success = False
            try:
                subprocess.run([
                    'openssl', 'req', '-x509', '-newkey', 'rsa:2048', 
                    '-keyout', key_file, '-out', cert_file, '-days', '365', '-nodes',
                    '-subj', '/CN=localhost'
                ], check=True, capture_output=True)
                print("✅ Certificato creato con OpenSSL")
                openssl_success = True
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("OpenSSL non disponibile, provo con Python...")
            
            # Metodo 2: Usa cryptography se OpenSSL non funziona
            if not openssl_success:
                try:
                    from cryptography import x509
                    from cryptography.x509.oid import NameOID
                    from cryptography.hazmat.primitives import hashes
                    from cryptography.hazmat.primitives.asymmetric import rsa
                    from cryptography.hazmat.primitives import serialization
                    from datetime import datetime, timedelta
                    import ipaddress
                    
                    # Genera chiave privata
                    private_key = rsa.generate_private_key(
                        public_exponent=65537,
                        key_size=2048,
                    )
                    
                    # Crea certificato
                    subject = issuer = x509.Name([
                        x509.NameAttribute(NameOID.COUNTRY_NAME, "IT"),
                        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Local"),
                        x509.NameAttribute(NameOID.LOCALITY_NAME, "Local"),
                        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Kit Manager"),
                        x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
                    ])
                    
                    cert = x509.CertificateBuilder().subject_name(
                        subject
                    ).issuer_name(
                        issuer
                    ).public_key(
                        private_key.public_key()
                    ).serial_number(
                        x509.random_serial_number()
                    ).not_valid_before(
                        datetime.utcnow()
                    ).not_valid_after(
                        datetime.utcnow() + timedelta(days=365)
                    ).add_extension(
                        x509.SubjectAlternativeName([
                            x509.DNSName("localhost"),
                            x509.DNSName("127.0.0.1"),
                            x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                            x509.IPAddress(ipaddress.IPv4Address("0.0.0.0")),
                        ]),
                        critical=False,
                    ).sign(private_key, hashes.SHA256())
                    
                    # Salva chiave privata
                    with open(key_file, "wb") as f:
                        f.write(private_key.private_bytes(
                            encoding=serialization.Encoding.PEM,
                            format=serialization.PrivateFormat.PKCS8,
                            encryption_algorithm=serialization.NoEncryption()
                        ))
                    
                    # Salva certificato
                    with open(cert_file, "wb") as f:
                        f.write(cert.public_bytes(serialization.Encoding.PEM))
                    
                    print("✅ Certificato creato con Python/cryptography")
                    
                except ImportError:
                    # Metodo 3: Fallback - crea certificato di base con SSL standard
                    print("cryptography non disponibile, uso metodo semplificato...")
                    try:
                        # Usa il modulo ssl standard per creare un contesto auto-firmato
                        import ssl
                        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
                        context.check_hostname = False
                        context.verify_mode = ssl.CERT_NONE
                        
                        print("✅ Uso contesto SSL semplificato (senza certificato)")
                        print("🔒 Avvio Kit Manager server HTTPS su https://0.0.0.0:5125")
                        print("⚠️  Su Android: accetta l'avviso di sicurezza nel browser")
                        print("📱 Se non funziona, usa: python3 app_kit.py --localhost")
                        
                        # Avvia direttamente con contesto semplificato
                        serve(app, host='0.0.0.0', port=5125)
                        exit(0)
                        
                    except Exception as ssl_error:
                        print(f"❌ Errore SSL: {ssl_error}")
                        print("💡 SOLUZIONE: Installa cryptography con:")
                        print("   pip install cryptography")
                        print("   oppure usa: python3 app_kit.py --localhost")
                        exit(1)
                        
                except Exception as e:
                    print(f"❌ Errore creazione certificato: {e}")
                    print("💡 SOLUZIONE: Usa python3 app_kit.py --localhost")
                    exit(1)
        
        context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
        context.load_cert_chain(cert_file, key_file)
        
        print("🔒 Avvio Kit Manager server HTTPS su https://0.0.0.0:5125")
        print("⚠️  IMPORTANTE: Accetta il certificato auto-firmato nel browser")
        print("📱 Su Android: tocca 'Avanzate' → 'Procedi comunque' quando appare l'avviso di sicurezza")
        
        serve(app, host='0.0.0.0', port=5125, url_scheme='https', 
              ssl_context=context)
    elif args.network:
        import socket
        
        # Ottieni l'IP locale
        def get_local_ip():
            try:
                # Connessione temporanea per ottenere l'IP locale
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                local_ip = s.getsockname()[0]
                s.close()
                return local_ip
            except:
                return "IP-NON-TROVATO"
        
        local_ip = get_local_ip()
        print("📱 Modalità NETWORK - Kit Manager per Android")
        print(f"🌐 Server HTTP su: http://0.0.0.0:5125")
        print(f"📱 ACCEDI DA ANDROID con: http://{local_ip}:5125")
        print("✅ La fotocamera funziona su IP di rete locale senza HTTPS")
        print(f"💡 Assicurati che Android e PC siano sulla stessa rete WiFi")
        serve(app, host='0.0.0.0', port=5125)
    elif args.localhost:
        print("🏠 Avvio Kit Manager server su localhost:5125")
        print("📱 Accedi da: http://localhost:5125 o http://127.0.0.1:5125")
        print("✅ La fotocamera funziona su localhost senza HTTPS")
        serve(app, host='127.0.0.1', port=5125)
    else:
        print("🌐 Avvio Kit Manager server HTTP su http://0.0.0.0:5125")
        print("📱 Per usare la fotocamera su Android:")
        print("   - Su rete locale: python3 app_kit.py --network")
        print("   - Su localhost: python3 app_kit.py --localhost")
        print("   - Con HTTPS: python3 app_kit.py --https")
        serve(app, host='0.0.0.0', port=5125)