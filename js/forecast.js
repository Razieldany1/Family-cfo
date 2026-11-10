'use strict';
(function(root){
 const money=n=>Math.round((Number(n)||0)*100);
 const type=t=>{if(t.incomeKind)return t.incomeKind;const s=String([t.category,t.note].join(' ')).toLowerCase();if(/tredicesima|13ª|13esima/.test(s))return 'bonus13';if(/assegno\s*unico|\bauu\b/.test(s))return 'allowance';if(/stipendio|retribuzione|cedolino|\brfi\b|ferrovie/.test(s))return 'salary';return '';};
 function incomeEvents(period,transactions,o){
  const tx=transactions.filter(t=>t.type==='income'&&t.to==='free'&&t.date?.startsWith(period)),result=[];
  const received=k=>tx.filter(t=>type(t)===k).reduce((s,t)=>s+money(t.amount),0);
  const combined=received('salary_bonus13');
  const salary=Math.max(0,money(o.salary)-received('salary'));
  const bonus=period==='2026-12'&&o.decemberBonusEnabled?Math.max(0,money(o.decemberBonus)-received('bonus13')):0;
  const salaryLeft=Math.max(0,salary-combined);
  const bonusLeft=Math.max(0,bonus-Math.max(0,combined-salary));
  if(o.salaryEnabled&&salaryLeft+bonusLeft)result.push({id:'salary-'+period,date:period+'-'+String(period==='2026-12'&&o.decemberBonusEnabled?(o.decemberPayDay||15):(o.salaryDay||27)).padStart(2,'0'),kind:'income',label:'Retribuzione residua stimata',to:'free',amount:(salaryLeft+bonusLeft)/100});
  const auu=Math.max(0,money(o.allowance)-received('allowance'));
  if(o.allowanceEnabled&&auu)result.push({id:'allowance-'+period,date:o.allowanceDate,kind:'income',label:'Assegno Unico residuo stimato',to:'free',amount:auu/100});
  return result;
 }
 function allocationEvents(period,accounts,transactions,day){
  return accounts.filter(a=>a.id!=='free').map(a=>{const planned=money(a.goal?.monthly),paid=transactions.filter(t=>t.type==='transfer'&&t.from==='free'&&t.to===a.id&&t.date?.startsWith(period)).reduce((s,t)=>s+money(t.amount),0);return {id:'allocation-'+period+'-'+a.id,date:period+'-'+String(day||28).padStart(2,'0'),kind:'transfer',label:'Accantonamento '+a.name,from:'free',to:a.id,amount:Math.max(0,planned-paid)/100}}).filter(e=>e.amount>0);
 }
 const api={incomeEvents,allocationEvents};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.FamilyForecast=api;
})(typeof window!=='undefined'?window:null);
