# Kit Manager - Applicazione Docker

## 📋 Requisiti

- Docker
- Docker Compose

## 🚀 Avvio Rapido

### Opzione 1: Script automatico
```bash
./start-docker.sh
```

### Opzione 2: Comandi manuali
```bash
# Costruisci e avvia
docker-compose up -d

# Visualizza logs
docker-compose logs -f
```

## 🌐 Accesso all'applicazione

L'applicazione sarà disponibile su:
- **URL**: http://localhost:5125
- **Pagine principali**:
  - Home/Inserimento: http://localhost:5125/
  - Gestione Linee: http://localhost:5125/manage-linee
  - Sequenze: http://localhost:5125/kit-sequence/[1-7]

## 🛠️ Comandi Utili

### Gestione Container
```bash
# Visualizza stato
docker-compose ps

# Visualizza logs
docker-compose logs -f

# Riavvia
docker-compose restart

# Ferma
docker-compose down
# oppure
./stop-docker.sh
```

### Gestione Dati
```bash
# Backup database
docker-compose exec kit-manager cp /app_kit/database_kit/kit_sequences.db /app_kit/backup_$(date +%Y%m%d_%H%M%S).db

# Accesso al container
docker-compose exec kit-manager /bin/bash
```

### Sviluppo
```bash
# Ricostruisci immagine
docker-compose build

# Ricostruisci senza cache
docker-compose build --no-cache

# Rimuovi tutto e ricostruisci
docker-compose down --rmi all
docker-compose up -d --build
```

## 🗂️ Struttura File

```
/Users/baldi/H-Farm/tesi/Programma kit/
├── app_kit.py              # Applicazione Flask principale
├── Dockerfile_kit          # Dockerfile per container
├── docker-compose.yml      # Orchestrazione Docker
├── requirements_kit.txt    # Dipendenze Python
├── start-docker.sh         # Script avvio automatico
├── stop-docker.sh          # Script stop automatico
├── database_kit/           # Database SQLite (persistente)
├── static/                 # File CSS, JS
└── templates/              # Template HTML
```

## 🔒 Sicurezza

- L'applicazione gira sulla porta 5125
- Database SQLite montato come volume per persistenza
- Container isolato dall'host

## 🐛 Troubleshooting

### Porta occupata
```bash
# Cambia porta nel docker-compose.yml
ports:
  - "5126:5125"  # Usa porta 5126 invece di 5125
```

### Database non persistente
```bash
# Verifica mount del volume
docker-compose exec kit-manager ls -la /app_kit/database_kit/
```

### Logs errori
```bash
# Visualizza logs dettagliati
docker-compose logs kit-manager

# Logs in tempo reale
docker-compose logs -f kit-manager
```

## 📊 Monitoraggio

L'applicazione include un health check che verifica:
- Risposta HTTP su porta 5125
- Controllo ogni 30 secondi
- 3 tentativi di retry
