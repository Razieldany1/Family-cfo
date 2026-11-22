'use strict';
/* v3.5 - pure analysis engine: all amounts calculated in integer cents.
 * No automatic reclassification, no mutation of ledger or forecast records.
 */
(function(root){
 const MACROS=['Casa','Alimentari','Auto','Figli','Salute','Lavoro','Famiglia e tempo libero','Servizi','Altre spese'];
 const EXPENSE_HINTS=[
  [/alimentar|supermercat|spesa casa|cibo/i,'Alimentari'],
  [/carburant|diesel|benzina|auto|bollo|assicuraz|meccanic|pneumatic/i,'Auto'],
  [/pannolin|scuol|asilo|figli|giocattol|bambin|baby/i,'Figli'],
  [/farmac|salute|medic|dentist/i,'Salute'],
  [/pranz|lavoro|mensa|ufficio/i,'Lavoro'],
  [/energi|elettric|luce|acqua|affitto|manutenzione casa|condomin|climatizz/i,'Casa'],
  [/internet|telefono|abbonament|telefonia|streaming/i,'Servizi'],
  [/regal|abbigli|vestit|scarpe|svago|ristorant|vacanz|uscit/i,'Famiglia e tempo libero']
 ];
 const cents=x=>Math.round(Number(x||0)*100);
 const money=x=>cents(x)/100;
 const isoMonth=(year,month)=>new Date(Date.UTC(year,month-1,1)).toISOString().slice(0,7);
 function shift(period,offset){if(!/^\d{4}-\d{2}$/.test(String(period)))throw Error('Mese non valido');const [y,m]=period.split('-').map(Number);if(m<1||m>12)throw Error('Mese non valido');return isoMonth(y,m+offset);}
 function periodOf(date,mode='financial'){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return '';const [y,m,d]=date.split('-').map(Number);if(!m||m>12||d<1||d>31)return '';return mode==='calendar'?date.slice(0,7):isoMonth(y,m+(d>=27?1:0));}
 function periodRange(period,mode='financial'){const [y,m]=period.split('-').map(Number);if(mode==='calendar'){return {start:period+'-01',end:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)};}return {start:shift(period,-1)+'-27',end:period+'-26'};}
 function category(t){return String(t.category||'').trim()||'Senza categoria';}
 function normalizedNote(t){return String(t.note||'').toLocaleLowerCase('it').trim().replace(/\s+/g,' ').replace(/[^\p{L}\p{N} ]/gu,'');}
 function macroFor(name,custom){if(custom&&MACROS.includes(custom[name]))return custom[name];for(const [pattern,macro] of EXPENSE_HINTS)if(pattern.test(name))return macro;return 'Altre spese';}
 function rowsFor(state,period,mode,type){
  return (state.transactions||[]).filter(t=>periodOf(t.date,mode)===period&&(!type||t.type===type)).slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
 }
 function summarize(state,period,mode='financial'){
  const rows=rowsFor(state,period,mode),result={period,mode,rows,byCategory:{},byMacro:{},income:0,expense:0,transfer:0,saved:0,saveIn:0,saveOut:0,unclassified:0,counts:{income:0,expense:0,transfer:0}};
  const savings=new Set(['emergency','child_1','child_2']); // goal funds are not spending
  let income=0,expense=0,transfer=0,saveIn=0,saveOut=0;
  for(const t of rows){
   const value=cents(t.amount);if(!Number.isFinite(value)||value<=0)continue;
   if(!result.counts.hasOwnProperty(t.type))continue;
   result.counts[t.type]++;
   if(t.type==='income')income+=value;
   if(t.type==='expense')expense+=value;
   if(t.type==='transfer'){
    transfer+=value;
    if(t.from==='free'&&savings.has(t.to))saveIn+=value;
    if(t.to==='free'&&savings.has(t.from))saveOut+=value;
   }
   if(t.type==='income'||t.type==='expense'){
    const k=category(t),key=t.type+':'+k,group=result.byCategory[key]||(result.byCategory[key]={name:k,type:t.type,total:0,count:0,transactions:[]});
    group.total+=value;group.count++;group.transactions.push(t);
    if(k==='Senza categoria')result.unclassified++;
    if(t.type==='expense'){
      const macro=macroFor(k,state.analysis?.categoryGroups);
      const rec=result.byMacro[macro]||(result.byMacro[macro]={name:macro,total:0,count:0});
      rec.total+=value;rec.count++;
    }
   }
  }
  result.income=income/100;result.expense=expense/100;result.transfer=transfer/100;result.saveIn=saveIn/100;result.saveOut=saveOut/100;result.saved=(saveIn-saveOut)/100;result.margin=(income-expense)/100;
  for(const g of Object.values(result.byCategory))g.total/=100;
  for(const g of Object.values(result.byMacro))g.total/=100;
  return result;
 }
 function series(state,period,mode='financial',length=12){return Array.from({length},(_,i)=>{const key=shift(period,i-(length-1)),s=summarize(state,key,mode);return {period:key,income:s.income,expense:s.expense,margin:s.margin,saved:s.saved,hasMovements:s.rows.length>0};});}
 function annual(state,year,mode='financial'){return Array.from({length:12},(_,i)=>{const period=String(year)+'-'+String(i+1).padStart(2,'0'),s=summarize(state,period,mode);return {period,income:s.income,expense:s.expense,margin:s.margin,saved:s.saved,counts:s.counts,hasMovements:s.rows.length>0};});}
 function compare(state,period,mode='financial'){const now=summarize(state,period,mode),past=summarize(state,shift(period,-1),mode);const delta=now.expense-past.expense;return {now,past,delta,percentage:past.expense>0?delta/past.expense*100:null,comparable:past.rows.length>0};}
 function averages(state,period,mode='financial'){
  const data=series(state,period,mode,12);
  return [3,6,12].map(months=>{const items=data.slice(-months),observed=items.filter(x=>x.hasMovements).length;return {months,observed,avgExpense:Math.round(items.reduce((s,x)=>s+cents(x.expense),0)/months)/100,totalExpense:items.reduce((s,x)=>s+x.expense,0),complete:observed===months};});
 }
 function recurring(state,period,mode='financial'){
  const start=shift(period,-11),byKey=new Map();
  for(const t of state.transactions||[]){
   const p=periodOf(t.date,mode);if(t.type!=='expense'||p<start||p>period)continue;
   const note=normalizedNote(t);if(note.length<4)continue;
   const key=category(t).toLowerCase()+'|'+note,arr=byKey.get(key)||[];arr.push(t);byKey.set(key,arr);
  }
  return [...byKey.values()].filter(arr=>new Set(arr.map(t=>periodOf(t.date,mode))).size>=3).map(arr=>{
   const avg=arr.reduce((n,t)=>n+cents(t.amount),0)/arr.length/100;
   const stable=arr.every(t=>Math.abs(Number(t.amount)-avg)<=Math.max(2,avg*.35));
   return {category:category(arr[0]),note:arr[0].note,instances:arr.length,months:new Set(arr.map(t=>periodOf(t.date,mode))).size,average:money(avg),stable};
  }).sort((a,b)=>b.months-a.months||b.average-a.average);
 }
 function suggestion(transactions,t){
  const note=normalizedNote(t);if(note.length<4)return null;
  const matches=(transactions||[]).filter(x=>x.type===t.type&&x.id!==t.id&&normalizedNote(x)===note&&category(x)!=='Senza categoria');
  if(matches.length<2)return null;
  const map=new Map();for(const x of matches)map.set(category(x),(map.get(category(x))||0)+1);
  const [name,count]=[...map].sort((a,b)=>b[1]-a[1])[0];
  return count>=2&&count/matches.length>=.75?{name,matched:count,total:matches.length}:null;
 }
 function competence(state,period,mode='financial'){
  const out={};let total=0;const splits=state.analysis?.accruals||{};
  for(const t of state.transactions||[]){if(t.type!=='expense')continue;const a=splits[t.id],value=cents(t.amount);
   let allocated=0;
   if(a&&/^\d{4}-\d{2}$/.test(a.start)&&Number.isInteger(a.months)&&a.months>=2&&a.months<=36){
    for(let i=0;i<a.months;i++){if(shift(a.start,i)!==period)continue;allocated=Math.floor(value/a.months)+(i<value%a.months?1:0);break;}
   }else if(periodOf(t.date,mode)===period)allocated=value;
   if(allocated){const k=category(t);out[k]=(out[k]||0)+allocated;total+=allocated;}
  }
  return {total:total/100,byCategory:Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v/100]))};
 }
 function accountTotals(accounts,transactions){
  const totals=new Map((accounts||[]).map(a=>[a.id,cents(a.opening)]));
  for(const t of transactions||[]){const v=cents(t.amount);if(t.from&&totals.has(t.from))totals.set(t.from,totals.get(t.from)-v);if(t.to&&totals.has(t.to))totals.set(t.to,totals.get(t.to)+v);}
  let family=0,children=0;for(const [id,value] of totals){if(id==='child_1'||id==='child_2')children+=value;else family+=value;}
  return {family:family/100,children:children/100,total:(family+children)/100};
 }
 const api={MACROS,shift,periodOf,periodRange,category,macroFor,normalizedNote,rowsFor,summarize,series,annual,compare,averages,recurring,suggestion,competence,accountTotals};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.FamilyAnalysis=api;
})(typeof window!=='undefined'?window:null);
