#!/bin/bash

# Script per fermare l'applicazione Kit Manager Docker

echo "🛑 Fermando Kit Manager..."

# Ferma e rimuovi i container
docker-compose down

# Opzionalmente rimuovi l'immagine (decommentare se necessario)
# docker-compose down --rmi all

echo "✅ Kit Manager fermato con successo!"
echo ""
echo "📋 Per riavviare:"
echo "   ./start-docker.sh"
echo ""
