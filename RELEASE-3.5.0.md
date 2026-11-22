# FAMILY CFO — v3.5.0 (candidato, non pubblicato)

Unica release funzionale successiva alla v3.4.2. Mantiene il mese finanziario 27–26 predefinito; il mese solare è una vista alternativa, mai una modifica della data registrata.

## Nuove funzioni
- Analisi delle entrate e delle spese per mese, macroarea, categoria e singolo movimento.
- Matrice annuale categoria × mese con accesso al dettaglio.
- Preventivo/consuntivo, tipologie primaria/durevole/discrezionale, confronti con periodo precedente e medie mobili con indicatore della copertura effettiva.
- Ricorrenze con evidenza documentale, categorie suggerite ma mai riassegnate senza consenso.
- Ripartizione contabile per competenza facoltativa delle spese, distinta dall'esborso di cassa.
- Monitoraggio dei trasferimenti netti verso emergenza e figli, separato dai consumi.
- Patrimonio parziale e copertura del fondo emergenza; Eurofer/investimenti/debiti esterni solo su input manuale, con avviso per doppio conteggio.
- CSV del periodo e possibilità di correggere i movimenti con verifica.

## Integrità dati e compatibilità
- Nessuna ristrutturazione del registro transazioni, dei saldi iniziali, di backup o riconciliazione della v3.4.2.
- Preferenze v3.5 conservate nell'oggetto additivo state.analysis e nei backup JSON.
- Niente dati personali nei test o commit.
- Il backup v3.4.2 deve essere esportato e custodito prima di test e futura pubblicazione.

## Criteri di pubblicazione
1. GitHub Actions su HEAD verde, senza regressioni.
2. Prove UI e saldi in Android su origine di test separata.
3. Confronto con backup reale soltanto locale nel browser: saldi, numero movimenti, date, categorie, importi, scadenze, figli, previsioni.
4. Verifica che cambio mese solare/finanziario, edit e competenza non modifichino saldi indebitamente.
5. Backup v3.5 esportato, ripristinato su test e riavvio verificato.
6. Solo dopo autorizzazione: merge PR #2 in main, verifica GitHub Pages e PWA Android.

**Stato:** in collaudo; main non modificato. Non è una release distribuita.
