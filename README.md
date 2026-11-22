# FAMILY CFO

PWA per il controllo contabile e finanziario familiare, con archiviazione locale in **IndexedDB**.

## Versioni e rilascio
- **main**: v3.4.2, versione di produzione, verificata su Android.
- **feature/family-cfo-v3.5**: sviluppo e collaudo della **release unica v3.5.0**, senza versioni intermedie.
- **PR #2**: bozza, da mantenere senza merge fino alla verifica completa e all'autorizzazione.

## Motore contabile
I dati locali sono salvati nel database `family-cfo`, store `state`, chiave `main`.
Si conserva lo schema principale `version: 1, schemaVersion: 2`, compatibile con i backup v3.4.2. Le funzioni introdotte sono **additive**, in `state.analysis`; nessuna migrazione riscrive automaticamente movimenti o saldi.

I saldi derivano da importi iniziali e movimenti di entrata, uscita e trasferimento. I trasferimenti interni, compresi gli accantonamenti ai fondi, **non sono spese**, e non aumentano il patrimonio totale. Il pagamento dal fondo al destinatario finale viene registrato invece come spesa.

## Analisi v3.5.0
- Mese finanziario **27 del mese precedente – 26 del mese indicato** come predefinito; alternativa mese solare 1–fine mese.
- Macroaree configurabili, categorie, tipologie di spesa primaria/durevole/discrezionale, dettaglio cliccabile per ogni singolo movimento.
- Preventivo/consuntivo delle categorie, andamento sui 12 periodi e matrice **categoria × mese** annuale con drill-down.
- Medie 3, 6 e 12 mesi, con avviso di storico incompleto; ricorrenze rilevate soltanto su 3 mesi distinti.
- Suggerimenti di categoria da precedenti con la stessa nota, **solo su conferma**.
- Spese di competenza ripartite su 2–36 mesi separatamente dalla contabilità per cassa, categorie irregolari configurabili.
- Totali e flussi di risparmio, patrimonio monitorato (famiglia/figli), eventuali valori esterni Eurofer/investimenti/debiti inseriti manualmente.
- CSV filtrato sul periodo e sulle voci registrate; editor esplicito per categoria, descrizione, data, importo.

Gli investimenti esterni e il valore Eurofer non vengono mai letti automaticamente. Sono informazioni manuali e potenzialmente non aggiornate. Se già inclusi in un conto della PWA, non devono essere reinseriti per evitare doppi conteggi. Eurofer **non** è liquidità disponibile. Le scadenze non sono addebiti automatici.

## Test
Richiede Node.js 22: `npm run verify` (controllo sintattico di tutti gli script e test automatici con dati sintetici). GitHub Actions usa lo stesso comando su push e PR.

Il collaudo va completato su un'origine web **separata** da GitHub Pages, senza alterare IndexedDB della produzione. Non caricare backup familiari su repository GitHub, issue, Actions o server: importarli esclusivamente nel browser locale dell'ambiente di prova. Conservare un backup separato della v3.4.2.

## Privacy e limitazioni
I file JSON e CSV esportati non sono cifrati. La modalità privacy della PWA maschera le cifre nel testo a schermo ma non è una cifratura né protegge i backup. Non inserire saldi, nomi o identificativi familiari reali nei commit e nei test. La cronologia Git antecedente resta oggetto di verifica privacy separata.

Le analisi rappresentano soltanto i movimenti registrati; uno storico incompleto limita l'attendibilità di medie, ricorrenze e bilanci annuali. Non si generano automaticamente movimenti, rendimenti né dati previdenziali. Le stime non sono liquidità disponibile.
