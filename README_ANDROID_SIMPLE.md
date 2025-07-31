# Chrome Android - Abilitare Fotocamera su HTTP

## Metodo 1: Chrome Flags (Raccomandato)

1. **Apri Chrome su Android**
2. **Vai su**: `chrome://flags/`
3. **Cerca**: "Insecure origins treated as secure"
4. **Abilita** il flag
5. **Aggiungi**: `http://[IP-DEL-PC]:5125` 
   - Esempio: `http://192.168.1.100:5125`
6. **Riavvia Chrome**
7. **Accedi al sito** - la fotocamera funzionerà!

## Metodo 2: Modalità Developer Android

1. **Attiva Modalità Developer** su Android:
   - Impostazioni → Info telefono → Tocca "Numero build" 7 volte
2. **Vai in**: Impostazioni → Opzioni sviluppatore
3. **Abilita**: "Consenti origini non sicure"
4. **Riavvia** il browser

## Metodo 3: Firefox Android (Alternativa)

Firefox Android è più permissivo con HTTP su rete locale:
1. **Installa Firefox** dal Play Store
2. **Accedi** direttamente a `http://[IP-PC]:5125`
3. **Dovrebbe funzionare** senza configurazioni aggiuntive

## Script Automatico

Usa i nostri script per trovare automaticamente l'IP:

### macOS/Linux:
```bash
./start_android.sh
```

### Windows:
```batch
start_android.bat
```

## Verifica IP del PC

Se non sai l'IP del tuo PC:

### macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows:
```cmd
ipconfig | findstr "IPv4"
```

## Risoluzione Problemi

- ✅ **PC e Android sulla stessa WiFi**
- ✅ **Firewall PC non blocca porta 5125**
- ✅ **IP corretto** (192.168.x.x o 10.x.x.x)
- ✅ **Browser aggiornato** su Android
