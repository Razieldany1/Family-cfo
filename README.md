# FAMILY CFO

Cruscotto finanziario familiare offline (PWA).

## Versioni
- `main`: v3.3, versione operativa.
- `feature/family-cfo-v3.4`: sviluppo e collaudo, **non ancora da distribuire**.

## Verifica v3.4
Richiede Node.js 22. Eseguire `npm run verify` per il controllo sintattico e i test con dati sintetici. GitHub Actions esegue lo stesso comando sui push e sulle pull request.

## Dati e compatibilità
I dati sono conservati in IndexedDB (`family-cfo`, store `state`, chiave `main`). Lo schema applicativo resta `version: 1`. Nessun dato finanziario personale deve essere incluso nei test, nei commit o nei log.

Prima di installare una versione di sviluppo, esportare un backup JSON dalla v3.3 e verificare che sia leggibile. Non cancellare i dati del browser. I backup JSON non sono cifrati.

## Riconciliazione
Il saldo contabile viene ricostruito fino alla data della verifica; i movimenti successivi non alterano la differenza storica. La verifica non crea né corregge movimenti.

## Previsioni
La classificazione degli accrediti può usare la categoria e la descrizione del movimento. Per il cedolino di dicembre pagato con un solo accredito, selezionare **Stipendio + tredicesima nello stesso accredito** nel modulo dettagliato. Le entrate non classificate non vengono considerate stipendio solo perché hanno importo elevato.

Il budget degli accantonamenti è la fonte per gli importi previsionali di emergenza, figli e fondo auto complessivo. Le quote auto sono distribuite proporzionalmente agli obiettivi dei singoli fondi. Nessuna previsione crea movimenti reali.

## Limiti noti
- La v3.4 necessita ancora di collaudo end-to-end su Android e verifica del ripristino da backup.
- Le date previsionali sono ipotesi: accrediti non classificati o registrati dopo la data prevista possono richiedere verifica manuale.
- Il periodo finanziario 27–26 dei report è distinto dai mesi di calendario usati per pianificare alcuni flussi.
- Le scadenze non sono addebiti automatici.
