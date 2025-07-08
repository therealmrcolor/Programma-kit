#!/bin/bash

# Script per avviare l'applicazione Kit Manager con Docker

echo "🚀 Avvio Kit Manager con Docker..."

# Ferma eventuali container esistenti
echo "🛑 Fermando eventuali container esistenti..."
docker-compose down

# Costruisci l'immagine se necessario
echo "🔨 Costruendo l'immagine Docker..."
docker-compose build

# Avvia l'applicazione
echo "▶️ Avviando l'applicazione..."
docker-compose up -d

# Verifica che il container sia avviato
echo "✅ Verificando lo stato del container..."
docker-compose ps

echo ""
echo "🎉 Kit Manager è ora disponibile su:"
echo "   📱 http://localhost:5125"
echo ""
echo "📋 Comandi utili:"
echo "   🔍 Visualizza logs: docker-compose logs -f"
echo "   🛑 Ferma app: docker-compose down"
echo "   🔄 Riavvia: docker-compose restart"
echo "   📊 Stato: docker-compose ps"
echo ""
