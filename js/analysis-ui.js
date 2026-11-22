'use strict';
/* FAMILY CFO v3.5 - read-only reporting with explicit, user-confirmed edits.
 * Only category/description/date/amount edits and preferences touch IndexedDB.
 */
(function(root){
 let selectedMonth='',selectedYear='',activeType='expense',selectedCategory='',selectedMacro='',editing='';
 const A=()=>root.FamilyAnalysis;
 const byId=id=>document.getElementById(id);
 const makeCard=(title,content)=>'<section class="card analysis-card"><h2>'+title+'</h2>'+content+'</section>';
 function sortGroups(groups){return Object.values(groups).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'it'));}
 function money(ctx,n){return ctx.euro(n);}
 function selectOptions(ctx,type,value){
  const opts=[...new Set(['',value,...ctx.categories(type)])];
  return opts.map(name=>'<option value="'+ctx.esc(name)+'" '+(name===value?'selected':'')+'>'+(name?ctx.esc(name):'Senza categoria')+'</option>').join('');
 }
 function readDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 function normAnalysis(state){
  if(!state.analysis||typeof state.analysis!=='object')state.analysis={};
  const a=state.analysis;
  if(a.periodMode!=='calendar'&&a.periodMode!=='financial')a.periodMode='financial';
  if(!a.categoryGroups||typeof a.categoryGroups!=='object')a.categoryGroups={};
  if(!a.irregular||typeof a.irregular!=='object')a.irregular={};
  if(!a.accruals||typeof a.accruals!=='object')a.accruals={};
  if(!a.externalAssets||typeof a.externalAssets!=='object')a.externalAssets={investments:null,eurofer:null,debts:null,updated:''};
  if(a.monthlyEssential===undefined)a.monthlyEssential=null;
  return a;
 }
 function exportCsv(ctx,period,mode){
  const rows=A().rowsFor(ctx.state,period,mode).map(t=>[t.date,t.type,A().category(t),t.amount,t.from||'',t.to||'',t.note||'',A().macroFor(A().category(t),ctx.state.analysis.categoryGroups)]);
  const safe=x=>{let s=String(x??'');if(/^[\s]*[=+@-]/.test(s)&&!/^-\d+(?:\.\d+)?$/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  ctx.download('family-cfo-analisi-'+mode+'-'+period+'.csv','\ufeff'+[['data','tipo','categoria','importo','da','a','descrizione','macroarea'],...rows].map(r=>r.map(safe).join(';')).join('\r\n'),'text/csv;charset=utf-8');
 }
 function render(ctx){
  const a=normAnalysis(ctx.state),eng=A(),mode=a.periodMode,today=readDate();
  if(!selectedMonth)selectedMonth=eng.periodOf(today,mode);
  if(!/^\d{4}-\d{2}$/.test(selectedMonth))selectedMonth=eng.periodOf(today,mode);
  if(!selectedYear)selectedYear=selectedMonth.slice(0,4);
  const s=eng.summarize(ctx.state,selectedMonth,mode),compare=eng.compare(ctx.state,selectedMonth,mode),range=eng.periodRange(selectedMonth,mode);
  const entries=s.rows.filter(t=>activeType==='savings'?t.type==='transfer'&&['emergency','child_1','child_2'].includes(t.to)||activeType==='savings'&&t.type==='transfer'&&['emergency','child_1','child_2'].includes(t.from):t.type===activeType);
  const byCategory=sortGroups(s.byCategory).filter(g=>g.type===activeType);
  const macros=sortGroups(s.byMacro);
  const allExpenses=sortGroups(s.byCategory).filter(g=>g.type==='expense');
  const allGroups=[...new Set([...ctx.state.budget.map(x=>x[0]),...allExpenses.map(x=>x.name)])];
  const budgetOf=name=>Number(ctx.state.budget.find(x=>x[0]===name)?.[1]||0);
  const pct=n=>s.expense>0?(n/s.expense*100).toFixed(1)+'%':'—';
  const typeOptions=[['expense','Spese'],['income','Entrate'],['transfer','Trasferimenti'],['savings','Risparmio trasferito']];
  let html=makeCard('Analisi economica · v3.5',
   '<p class="muted">Periodo predefinito: 27 → 26. Sono contabilizzati solo i movimenti registrati; i trasferimenti non costituiscono consumi. I mesi senza storico non vengono ricostruiti.</p>'+
   '<div class="analysis-controls"><div><label for="anMonth">Mese da analizzare</label><input id="anMonth" type="month" value="'+ctx.esc(selectedMonth)+'"></div>'+
   '<div><label for="anMode">Calendario</label><select id="anMode"><option value="financial" '+(mode==='financial'?'selected':'')+'>Finanziario (27–26)</option><option value="calendar" '+(mode==='calendar'?'selected':'')+'>Solare (1–fine mese)</option></select></div></div>'+
   '<p class="muted">'+ctx.fmtDate(range.start)+' – '+ctx.fmtDate(range.end)+'</p>'+
   '<div class="analysis-kpis">'+
   [['Entrate registrate',s.income],['Spese effettive',s.expense],['Margine entrate − spese',s.margin],['Trasferimenti interni',s.transfer]].map(([name,value])=>'<div><small>'+ctx.esc(name)+'</small><strong>'+money(ctx,value)+'</strong></div>').join('')+'</div>'+
   '<p class="muted">Margine = flusso economico registrato, non rendimento né incremento certificato del patrimonio. Accantonamenti ai fondi esclusi dalle spese.</p>'+
   '<div class="actions"><button type="button" id="anExport">Esporta dettaglio mese CSV</button><button type="button" id="anNewMove">Nuovo movimento</button></div>');
  html+=makeCard('Dove sono finiti i soldi',
   '<div class="analysis-tabs">'+typeOptions.map(([key,label])=>'<button type="button" data-an-type="'+key+'" class="'+(activeType===key?'active':'')+'">'+label+'</button>').join('')+'</div>'+
   (activeType==='expense'?'<p class="muted">Macroaree: tocca una macroarea per filtrare, poi una categoria per visualizzare tutte le singole operazioni.</p>'+
   '<div class="analysis-macro">'+macros.map(g=>'<button type="button" data-an-macro="'+ctx.esc(g.name)+'" class="'+(selectedMacro===g.name?'active':'')+'"><span>'+ctx.esc(g.name)+'</span><strong>'+money(ctx,g.total)+'</strong></button>').join('')+'</div>'+
   (selectedMacro?'<button type="button" id="anClearMacro">Mostra tutte le macroaree</button>':''):'')+
   (activeType==='expense'||activeType==='income'
    ?'<div class="analysis-categories">'+byCategory.filter(g=>!selectedMacro||eng.macroFor(g.name,a.categoryGroups)===selectedMacro).map(g=>{
      const planned=activeType==='expense'?budgetOf(g.name):0;
      return '<button type="button" class="analysis-cat" data-an-cat="'+ctx.esc(g.name)+'"><span><strong>'+ctx.esc(g.name)+'</strong><small>'+g.count+' movimenti'+(activeType==='expense'?' · '+pct(g.total):'')+'</small></span><span class="analysis-right"><strong>'+money(ctx,g.total)+'</strong>'+(activeType==='expense'?'<small>Budget '+money(ctx,planned)+' · '+(g.total>planned?'Sforato '+money(ctx,g.total-planned):'Residuo '+money(ctx,planned-g.total))+'</small>':'')+'</span></button>';
      }).join('')+'</div>'
    :'<div class="analysis-categories">'+entries.map(t=>'<div class="analysis-cat"><span>'+ctx.esc(t.note||t.category||'Movimento')+'<small>'+ctx.fmtDate(t.date)+' · '+(t.type==='transfer'?ctx.esc(t.from)+' → '+ctx.esc(t.to):'')+'</small></span><strong>'+money(ctx,t.amount)+'</strong></div>').join('')+'</div><p class="muted">'+(activeType==='savings'?'Versamenti verso riserva e conti figli: '+money(ctx,s.saveIn)+'; rientri: '+money(ctx,s.saveOut)+'; netto: '+money(ctx,s.saved)+'. Sono trasferimenti patrimoniali, non spese.':'Volume dei trasferimenti: '+money(ctx,s.transfer)+'. Non incluso nelle entrate e nelle spese.')+'</p>')+
   (!entries.length?'<p class="muted">Nessun movimento per il filtro selezionato.</p>':''));
  if((activeType==='expense'||activeType==='income')&&selectedCategory){
    const group=byCategory.find(g=>g.name===selectedCategory);
    if(group){
      html+=makeCard('Dettaglio · '+ctx.esc(selectedCategory),
       '<div class="row"><strong>'+group.count+' movimenti</strong><strong>'+money(ctx,group.total)+'</strong></div>'+
       group.transactions.map(t=>'<div class="analysis-entry"><div class="row"><span><strong>'+ctx.esc(t.note||t.category||'Movimento')+'</strong><small>'+ctx.fmtDate(t.date)+' · '+ctx.esc(t.from||t.to||'')+'</small></span><strong>'+money(ctx,t.amount)+'</strong></div>'+
       '<div class="actions"><button type="button" data-an-edit="'+ctx.esc(t.id)+'">'+(editing===t.id?'Chiudi modifica':'Modifica')+'</button></div>'+
       (editing===t.id?'<form data-an-edit-form="'+ctx.esc(t.id)+'" class="analysis-edit"><div class="formgrid">'+
        '<div><label>Data</label><input name="date" type="date" required value="'+ctx.esc(t.date)+'"></div>'+
        '<div><label>Importo (€)</label><input name="amount" type="number" step="0.01" min="0.01" required value="'+Number(t.amount)+'"></div>'+
        '<div><label>Categoria</label><select name="category">'+selectOptions(ctx,t.type,t.category||'')+'</select></div>'+
        '<div><label>Descrizione</label><input name="note" maxlength="180" value="'+ctx.esc(t.note||'')+'"></div>'+
        (t.type==='expense'?'<div><label>Ripartizione economica (mesi)</label><input name="months" type="number" min="1" max="36" step="1" value="'+(a.accruals[t.id]?.months||1)+'"></div>'+
        '<div><label>Primo mese di competenza</label><input name="start" type="month" value="'+ctx.esc(a.accruals[t.id]?.start||eng.periodOf(t.date,mode))+'"></div>':'')+
        '</div><button class="primary" type="submit">Salva modifica</button><p class="muted">Una ripartizione modifica solo il report di competenza, non il pagamento né il saldo. Cambiare data o importo modifica il registro contabile.</p></form>':'')+'</div>').join('')+
       '<button type="button" id="anCloseCategory">Torna alle categorie</button>');
    }
  }
  const series=eng.series(ctx.state,selectedMonth,mode,12),max=Math.max(1,...series.map(x=>x.expense));
  const avgs=eng.averages(ctx.state,selectedMonth,mode);
  html+=makeCard('Confronto temporale e budget',
   '<div class="analysis-kpis"><div><small>Mese precedente</small><strong>'+(compare.comparable?money(ctx,compare.past.expense):'Dati insufficienti')+'</strong></div><div><small>Variazione della spesa</small><strong>'+(compare.comparable?money(ctx,compare.delta)+(compare.percentage===null?'':' ('+compare.percentage.toFixed(1)+'%)'):'—')+'</strong></div></div>'+
   '<div class="analysis-spark">'+series.map(x=>'<button type="button" data-an-month="'+ctx.esc(x.period)+'" title="'+ctx.esc(x.period)+' · '+money(ctx,x.expense)+'"><span style="height:'+Math.max(2,Math.round(x.expense/max*100))+'%"></span><small>'+ctx.esc(x.period.slice(5))+'</small></button>').join('')+'</div>'+
   '<p class="muted">Spesa registrata per mese finanziario o solare. L\'assenza di movimenti può indicare storico incompleto.</p>'+
   '<div class="analysis-averages">'+avgs.map(v=>'<div><strong>'+v.months+' mesi</strong><span>'+money(ctx,v.avgExpense)+'/mese</span><small>'+v.observed+'/'+v.months+' mesi con movimenti'+(v.complete?'':' · storico parziale')+'</small></div>').join('')+'</div>'+
   '<div class="report-scroll"><table class="report-table"><thead><tr><th>Categoria</th><th>Budget</th><th>Spesa</th><th>Residuo</th></tr></thead><tbody>'+
   allGroups.map(name=>{const val=s.byCategory['expense:'+name]?.total||0,limit=budgetOf(name);return '<tr><td>'+ctx.esc(name)+'</td><td>'+money(ctx,limit)+'</td><td>'+money(ctx,val)+'</td><td class="'+(val>limit?'bad':'good')+'">'+money(ctx,limit-val)+'</td></tr>';}).join('')+'</tbody></table></div>');
  const y=Number(selectedYear),years=eng.annual(ctx.state,y,mode),totals=years.reduce((r,x)=>({income:r.income+x.income,expense:r.expense+x.expense,margin:r.margin+x.margin}),{income:0,expense:0,margin:0});
  html+=makeCard('Bilancio annuale e categorie',
   '<div class="analysis-controls"><div><label for="anYear">Anno dei periodi</label><input id="anYear" type="number" min="2000" max="2100" step="1" value="'+ctx.esc(y)+'"></div></div>'+
   '<div class="analysis-kpis"><div><small>Entrate anno</small><strong>'+money(ctx,totals.income)+'</strong></div><div><small>Uscite anno</small><strong>'+money(ctx,totals.expense)+'</strong></div></div>'+
   '<div class="report-scroll"><table class="report-table"><thead><tr><th>Periodo</th><th>Entrate</th><th>Spese</th><th>Margine</th></tr></thead><tbody>'+
   years.map(x=>'<tr><td><button type="button" data-an-month="'+x.period+'">'+x.period+'</button></td><td>'+money(ctx,x.income)+'</td><td>'+money(ctx,x.expense)+'</td><td>'+money(ctx,x.margin)+'</td></tr>').join('')+
   '<tr><th>Totale registrato</th><th>'+money(ctx,totals.income)+'</th><th>'+money(ctx,totals.expense)+'</th><th>'+money(ctx,totals.margin)+'</th></tr></tbody></table></div>'+
   '<p class="muted">I totali annuali includono solo registrazioni disponibili, non proiezioni. Un anno parziale non rappresenta l\'intero costo annuale.</p>');
  // Full year category x period matrix: each cell opens its exact month and category.
  const byYear=years.map(x=>eng.summarize(ctx.state,x.period,mode));
  const matrixNames=[...new Set(byYear.flatMap(x=>sortGroups(x.byCategory).filter(g=>g.type==='expense').map(g=>g.name)))];
  matrixNames.sort((left,right)=>byYear.reduce((sum,x)=>sum+(x.byCategory['expense:'+right]?.total||0)-(x.byCategory['expense:'+left]?.total||0),0)||left.localeCompare(right,'it'));
  html+=makeCard('Spese per categoria × mese',
    '<p class="muted">Tocca un importo per vedere tutti i movimenti della categoria in quel mese. Scorri la tabella orizzontalmente su Android.</p>'+
    (matrixNames.length?'<div class="report-scroll"><table class="report-table analysis-matrix"><thead><tr><th>Categoria</th>'+
    years.map(x=>'<th>'+ctx.esc(x.period.slice(5))+'</th>').join('')+'<th>Totale</th></tr></thead><tbody>'+
    matrixNames.map(name=>{
     const values=byYear.map(x=>x.byCategory['expense:'+name]?.total||0),total=values.reduce((sum,value)=>sum+value,0);
     return '<tr><th>'+ctx.esc(name)+'</th>'+values.map((value,i)=>'<td>'+(value?'<button type="button" data-an-matrix-month="'+years[i].period+'" data-an-matrix-cat="'+ctx.esc(name)+'">'+money(ctx,value)+'</button>':'—')+'</td>').join('')+'<th>'+money(ctx,total)+'</th></tr>';
    }).join('')+'</tbody></table></div>':'<p class="muted">Nessuna spesa registrata per l’anno selezionato.</p>'));
  const recurring=eng.recurring(ctx.state,selectedMonth,mode);
  const uncategorized=s.rows.filter(t=>(t.type==='income'||t.type==='expense')&&eng.category(t)==='Senza categoria');
  html+=makeCard('Spese ricorrenti e categorie da correggere',
   '<h3>Possibili ricorrenze (ultimi 12 periodi)</h3>'+
   (recurring.length?recurring.slice(0,15).map(r=>'<div class="row"><span>'+ctx.esc(r.category)+' · '+ctx.esc(r.note)+'<small>'+r.months+' mesi osservati'+(r.stable?' · importo simile':' · importo variabile')+'</small></span><strong>'+money(ctx,r.average)+'/evento</strong></div>').join(''):'<p class="muted">Nessuna ricorrenza sufficientemente documentata (almeno tre mesi con la stessa descrizione).</p>')+
   '<h3>Movimenti senza categoria · '+uncategorized.length+'</h3>'+
   (uncategorized.length?uncategorized.map(t=>{const suggestion=eng.suggestion(ctx.state.transactions,t);return '<div class="row"><span>'+ctx.esc(t.note||'Movimento')+'<small>'+ctx.fmtDate(t.date)+' · '+money(ctx,t.amount)+'</small></span>'+(suggestion?'<button type="button" data-an-suggest="'+ctx.esc(t.id)+'" data-an-suggest-to="'+ctx.esc(suggestion.name)+'">Assegna '+ctx.esc(suggestion.name)+'</button>':'<small>Da classificare manualmente in Movimenti</small>')+'</div>';}).join(''):'<p class="muted">Nessun movimento senza categoria nel mese.</p>')+
   '<p class="muted">Le categorie vengono soltanto suggerite a partire da precedenti operazioni con descrizione identica; nessuna modifica silenziosa.</p>');
  const competence=eng.competence(ctx.state,selectedMonth,mode),irregularCats=Object.keys(a.irregular).filter(k=>a.irregular[k]);
  const irregularObserved=irregularCats.map(name=>({name,total:series.reduce((sum,x)=>sum+(eng.summarize(ctx.state,x.period,mode).byCategory['expense:'+name]?.total||0),0)}));
  html+=makeCard('Competenza economica e spese irregolari',
   '<div class="analysis-kpis"><div><small>Pagamenti del periodo</small><strong>'+money(ctx,s.expense)+'</strong></div><div><small>Costi attribuiti al periodo</small><strong>'+money(ctx,competence.total)+'</strong></div></div>'+
   '<p class="muted">Di norma pagamento e competenza coincidono. Puoi ripartire una spesa su più mesi tramite “Modifica” nel dettaglio della sua categoria. La ripartizione non altera conti o saldi.</p>'+
   irregularObserved.map(x=>'<div class="row"><span>'+ctx.esc(x.name)+'</span><strong>'+money(ctx,x.total)+' negli ultimi 12 periodi</strong></div>').join('')+
   (!irregularObserved.length?'<p class="muted">Nessuna categoria marcata come spesa irregolare. Configurala nelle impostazioni sotto.</p>':'')+
   '<p class="muted">La media su 12 mesi va interpretata con cautela quando lo storico non è completo.</p>');
  const balances=eng.accountTotals(ctx.state.accounts,ctx.state.transactions);
  const val=k=>{const x=a.externalAssets[k];return x===null||x===undefined||x===''?null:Number(x);};
  const external=['investments','eurofer','debts'].map(val),canTotal=external.every(x=>x!==null&&Number.isFinite(x)&&x>=0);
  const net=balances.total+(external[0]||0)+(external[1]||0)-(external[2]||0);
  const essentials=valEssential(a,ctx);
  const emergencyAccount=ctx.state.accounts.find(x=>x.id==='emergency');
  const emergency=emergencyAccount?ctx.bal('emergency'):0;
  html+=makeCard('Patrimonio, fondo emergenza e risparmio',
   '<div class="analysis-kpis"><div><small>Saldi famiglia</small><strong>'+money(ctx,balances.family)+'</strong></div><div><small>Saldi figli</small><strong>'+money(ctx,balances.children)+'</strong></div><div><small>Fondo emergenza</small><strong>'+money(ctx,emergency)+'</strong></div><div><small>Copertura essenziali</small><strong>'+(essentials>0?(emergency/essentials).toFixed(1)+' mesi':'Non calcolabile')+'</strong></div></div>'+
   '<div class="row"><span>Patrimonio monitorato, al netto dei debiti</span><strong>'+(canTotal?money(ctx,net):'Parziale · integra i dati manuali')+'</strong></div>'+
   '<p class="muted">Saldi dei conti già registrati + investimenti esterni + Eurofer − debiti. Non duplicare capitali già inclusi nei conti. Eurofer non è liquidità immediatamente disponibile; i valori manuali sono aggiornati alla data indicata.</p>'+
   '<div class="row"><span>Risparmio trasferito nel mese</span><strong>'+money(ctx,s.saved)+'</strong></div>'+
   '<p class="muted">Il trasferimento netto verso emergenza e figli è distinto dal margine entrate–spese. Non include variazioni di mercato, rendimenti né il TFR.</p>');
  const cats=[...new Set([...ctx.categories('expense'),...allExpenses.map(g=>g.name)])];
  html+=makeCard('Preferenze analisi e dati manuali',
   '<details><summary>Configura macroaree, spese irregolari e indicatori</summary><form id="anConfig">'+
   '<p class="muted">La classificazione qui non cambia le categorie originali dei movimenti. È solo un raggruppamento analitico.</p>'+
   '<div class="report-scroll"><table class="report-table"><thead><tr><th>Categoria</th><th>Macroarea</th><th>Irregolare</th></tr></thead><tbody>'+
   cats.map((name,i)=>'<tr><td>'+ctx.esc(name)+'</td><td><select name="macro'+i+'">'+eng.MACROS.map(m=>'<option value="'+ctx.esc(m)+'" '+(eng.macroFor(name,a.categoryGroups)===m?'selected':'')+'>'+ctx.esc(m)+'</option>').join('')+'</select></td><td><input aria-label="Irregolare: '+ctx.esc(name)+'" type="checkbox" name="irregular'+i+'" '+(a.irregular[name]?'checked':'')+'></td></tr>').join('')+'</tbody></table></div>'+
   '<div class="formgrid"><div><label>Spese essenziali mensili (€)</label><input name="essentials" type="number" min="0" step="0.01" value="'+(a.monthlyEssential??'')+'" placeholder="Non configurato"></div>'+
   '<div><label>Investimenti esterni (€)</label><input name="investments" type="number" min="0" step="0.01" value="'+(val('investments')??'')+'" placeholder="Non disponibili"></div>'+
   '<div><label>Valore Eurofer (€)</label><input name="eurofer" type="number" min="0" step="0.01" value="'+(val('eurofer')??'')+'" placeholder="Non disponibile"></div>'+
   '<div><label>Debiti residui (€)</label><input name="debts" type="number" min="0" step="0.01" value="'+(val('debts')??'')+'" placeholder="Non disponibili"></div>'+
   '<div><label>Data aggiornamento valori manuali</label><input name="updated" type="date" value="'+ctx.esc(a.externalAssets.updated||'')+'"></div></div>'+
   '<button type="submit" class="primary">Salva preferenze analisi</button></form></details>');
  ctx.layout(html);
  bind(ctx,cats);
 }
 function valEssential(a,ctx){
  if(a.monthlyEssential!==null&&a.monthlyEssential!==''&&Number.isFinite(Number(a.monthlyEssential))&&Number(a.monthlyEssential)>0)return Number(a.monthlyEssential);
  return 0;
 }
 function bind(ctx,cats){
  const eng=A(),a=ctx.state.analysis;
  byId('anMonth').onchange=e=>{if(!/^\d{4}-\d{2}$/.test(e.target.value))return;selectedMonth=e.target.value;selectedCategory='';editing='';render(ctx);};
  byId('anMode').onchange=async e=>{a.periodMode=e.target.value==='calendar'?'calendar':'financial';selectedMonth=eng.periodOf(readDate(),a.periodMode);selectedCategory='';selectedMacro='';editing='';await ctx.save();render(ctx);};
  byId('anYear').onchange=e=>{const n=Number(e.target.value);if(n>=2000&&n<=2100){selectedYear=String(n);render(ctx);}};
  byId('anExport').onclick=()=>exportCsv(ctx,selectedMonth,a.periodMode);
  byId('anNewMove').onclick=()=>ctx.setTab('movements');
  document.querySelectorAll('[data-an-matrix-month]').forEach(b=>b.onclick=()=>{selectedMonth=b.dataset.anMatrixMonth;selectedCategory=b.dataset.anMatrixCat;activeType='expense';selectedMacro='';editing='';render(ctx);});
  document.querySelectorAll('[data-an-month]').forEach(b=>b.onclick=()=>{selectedMonth=b.dataset.anMonth;selectedYear=selectedMonth.slice(0,4);selectedCategory='';editing='';render(ctx);});
  document.querySelectorAll('[data-an-type]').forEach(b=>b.onclick=()=>{activeType=b.dataset.anType;selectedCategory='';selectedMacro='';editing='';render(ctx);});
  document.querySelectorAll('[data-an-cat]').forEach(b=>b.onclick=()=>{selectedCategory=b.dataset.anCat;editing='';render(ctx);byId('anCloseCategory')?.scrollIntoView({block:'nearest'});});
  document.querySelectorAll('[data-an-macro]').forEach(b=>b.onclick=()=>{selectedMacro=b.dataset.anMacro===selectedMacro?'':b.dataset.anMacro;selectedCategory='';render(ctx);});
  if(byId('anClearMacro'))byId('anClearMacro').onclick=()=>{selectedMacro='';render(ctx);};
  if(byId('anCloseCategory'))byId('anCloseCategory').onclick=()=>{selectedCategory='';editing='';render(ctx);};
  document.querySelectorAll('[data-an-edit]').forEach(b=>b.onclick=()=>{editing=editing===b.dataset.anEdit?'':b.dataset.anEdit;render(ctx);});
  document.querySelectorAll('[data-an-edit-form]').forEach(form=>form.onsubmit=async e=>{
   e.preventDefault();const id=form.dataset.anEditForm,pos=ctx.state.transactions.findIndex(t=>t.id===id);if(pos<0)return alert('Movimento non trovato');
   const previous=ctx.state.transactions[pos],f=new FormData(form),modified={...previous,date:String(f.get('date')||''),amount:Number(f.get('amount')),category:String(f.get('category')||''),note:String(f.get('note')||'')};
   try{root.FamilyLedger.assertTransaction(modified)}catch(err){return alert(err.message);}
   if(!Number.isFinite(modified.amount)||modified.amount<=0)return alert('Importo non valido');
   if((modified.date!==previous.date||Math.round(modified.amount*100)!==Math.round(previous.amount*100))&&!confirm('Data/importo modificati: i saldi storici e la riconciliazione potrebbero cambiare. Continuare?'))return;
   if(!ctx.validateCashChange(modified,id))return;
   const oldAccrual=ctx.state.analysis.accruals[id];
   if(previous.type==='expense'){
    const n=Number(f.get('months')),start=String(f.get('start')||'');
    if(!Number.isInteger(n)||n<1||n>36||(n>1&&!/^\d{4}-\d{2}$/.test(start)))return alert('Ripartizione non valida');
    if(n===1)delete ctx.state.analysis.accruals[id];else ctx.state.analysis.accruals[id]={months:n,start};
   }
   ctx.state.transactions[pos]=modified;
   try{await ctx.save();editing='';selectedCategory=eng.category(modified);render(ctx);}
   catch(err){ctx.state.transactions[pos]=previous;if(oldAccrual===undefined)delete ctx.state.analysis.accruals[id];else ctx.state.analysis.accruals[id]=oldAccrual;alert('Salvataggio non riuscito: '+err.message);}
  });
  document.querySelectorAll('[data-an-suggest]').forEach(b=>b.onclick=async()=>{
   const t=ctx.state.transactions.find(t=>t.id===b.dataset.anSuggest),suggestion=t&&eng.suggestion(ctx.state.transactions,t);
   if(!suggestion||suggestion.name!==b.dataset.anSuggestTo)return alert('Suggerimento non più valido');
   if(!confirm('Assegnare la categoria '+suggestion.name+' a questo singolo movimento?'))return;
   const old=t.category;t.category=suggestion.name;try{await ctx.save();render(ctx);}catch(err){t.category=old;alert(err.message);}
  });
  byId('anConfig').onsubmit=async e=>{
   e.preventDefault();const f=new FormData(e.target),old=JSON.parse(JSON.stringify(ctx.state.analysis));
   const groups={},irregular={};cats.forEach((name,i)=>{const macro=f.get('macro'+i);if(eng.MACROS.includes(macro))groups[name]=macro;if(f.has('irregular'+i))irregular[name]=true;});
   const value=k=>{const raw=f.get(k);return raw===''?null:Number(raw);};
   const numeric=['essentials','investments','eurofer','debts'];if(numeric.some(k=>value(k)!==null&&(!Number.isFinite(value(k))||value(k)<0)))return alert('Gli indicatori manuali devono essere numeri non negativi.');
   a.categoryGroups=groups;a.irregular=irregular;a.monthlyEssential=value('essentials');
   a.externalAssets={investments:value('investments'),eurofer:value('eurofer'),debts:value('debts'),updated:String(f.get('updated')||'')};
   try{await ctx.save();render(ctx);}catch(err){ctx.state.analysis=old;alert('Preferenze non salvate: '+err.message);}
  };
 }
 const api={render};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.FamilyAnalysisUI=api;
})(typeof window!=='undefined'?window:null);
