FAMILY CFO 3.0.0 — Rilascio integrato (2026-11-01)

Base: versione 2.5.0. I dati sono locali in IndexedDB, archivio family-cfo/state/main; il formato backup JSON rimane version:1 per compatibilità.

Novità:
- verifica contabile non distruttiva con saldi di riferimento immessi dall’utente, possibili duplicati e controlli di struttura
- report preventivo/consuntivo annuale con indicazione dei mesi con dati
- simulazione teorica mensile 3/6/12 mesi in due scenari, distinta dalla previsione bancaria giornaliera
- calendario eventi previsionali raggruppati per mese finanziario 27-26
- patrimonio dei figli con saldo e trasferimenti netti, senza performance inventate
- previsione giornaliera configurabile da 90 a 180 o 365 giorni
- backup: validazione strutturale rafforzata e ripristino in memoria in caso di errore di scrittura
- motore budget: mostra i margini negativi invece di mascherarli come zero
- cache service worker e riferimenti risorse aggiornati per evitare versioni stale

LIMITI: non è stata importata alcuna copia privata del backup del nucleo. Simulazioni non tengono conto di date certe di tredicesima/quattordicesima: sono escluse prudenzialmente. I controlli automatici non equivalgono a una riconciliazione bancaria.

ISTRUZIONI: Esportare prima backup JSON della v2.5.0. Pubblicare tutti i file nella radice del repository mantenendo la stessa origine GitHub Pages. NON cancellare dati app, non disinstallare. Confrontare saldi, testare ripristino su origine separata e aggiornamento PWA.
