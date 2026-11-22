# FAMILY CFO v3.4 — Collaudo Android isolato

## Stato
La versione v3.4 resta nel branch `feature/family-cfo-v3.4`. Non pubblicare su GitHub Pages del repository operativo e non fare merge su `main` prima del collaudo.

## Requisito di isolamento
La PWA salva i dati in IndexedDB `family-cfo`, store `state`, chiave `main`. IndexedDB è separato per **origine** (schema + hostname + porta), non per percorso. Pubblicare v3.4 in una sottocartella o in un secondo repository sotto lo stesso `https://Razieldany1.github.io` **non** isola i dati.

Per il collaudo usare un hostname distinto (per esempio un sottodominio di prova su un hosting statico HTTPS) oppure un profilo browser totalmente separato e verificato. Preferire hostname distinto. Non configurare redirect dalla PWA stabile verso il test.

## Checklist prima di pubblicare
- [ ] GitHub Actions verde sul commit di prova
- [ ] Backup v3.3 conservato **fuori dal browser** e verificato leggibile
- [ ] Origine HTTPS distinta dalla v3.3
- [ ] Cache service worker limitata al dominio di prova
- [ ] Nessun dato reale nel repository, nei log o nei test
- [ ] Nessun merge su `main`

## Prova con dati sintetici
1. Aprire la v3.4 sul dominio di prova in Chrome Android.
2. Verificare che sia un archivio vuoto/di prova, non i saldi reali della v3.3.
3. Inserire due conti sintetici (500 € e 2.000 €), un accredito stipendio (1.600 €), un trasferimento (200 €) e una scadenza futura.
4. Esportare il JSON e verificare che contenga solo i dati di prova.
5. Ricaricare, importare il backup di prova, controllare saldi e movimenti senza duplicazioni.
6. Verificare il periodo 27–26 e la riconciliazione storica con movimenti successivi.
7. Attivare modalità aereo, riaprire la PWA e verificare dashboard, fondi e movimenti.
8. Tornare online e controllare che la v3.3 stabile conservi i saldi originali.

## Criteri di blocco
Non procedere al merge se: importazione fallita, saldi cambiati, movimenti duplicati, app offline non funzionante, o dati della v3.3 visibili nel dominio di prova.

**Nota:** il successo dei test Node.js non equivale al collaudo end-to-end Android. Non importare il backup personale nel dominio di prova finché non sono superate tutte le prove sintetiche.
