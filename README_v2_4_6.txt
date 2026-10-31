FAMILY CFO v2.4.6 — Indicatori di risparmio corretti

- Risparmio programmato: solo emergenza + Leonardo + Bianca; denominatore stipendio ordinario + assegno unico.
- Risparmio effettivo: trasferimenti netti registrati verso i tre fondi nel mese finanziario 27–26.
- I trasferimenti fra i tre fondi non generano nuovo risparmio.
- Gli accantonamenti per spese future sono distinti.
- Il margine entrate-spese è mostrato separatamente, non chiamato risparmio.
- Nessuna migrazione o modifica dei dati IndexedDB, saldi, movimenti, previsioni o scadenze.

INSTALLAZIONE: esportare backup JSON, sostituire i file su GitHub Pages, verificare versione 2.4.6 nella scheda Dati.
TEST: 1) trasferimento free→emergency di 20€ aumenta risparmio effettivo di 20€; 2) emergency→free di 5€ lo riduce a 15€; 3) emergency→leo non cambia il totale; 4) free→insurance non lo modifica; 5) verifica patrimonio invariato a parità di movimenti.
