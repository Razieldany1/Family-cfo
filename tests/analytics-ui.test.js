'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const UI=require('../js/analysis-ui.js');
const state=()=>({
 accounts:[{id:'free',opening:1000},{id:'emergency',opening:200},{id:'child_1',opening:100}],
 transactions:[
  {id:'i',date:'2026-10-27',type:'income',amount:1600,to:'free',from:'',category:'Stipendio'},
  {id:'e',date:'2026-11-10',type:'expense',amount:75,from:'free',to:'',category:'Alimentari',note:'Spesa familiare'},
  {id:'t',date:'2026-11-11',type:'transfer',amount:50,from:'free',to:'emergency',category:'Accantonamento'}
 ],
 budget:[['Alimentari',300]],
 analysis:{periodMode:'financial',categoryGroups:{},irregular:{},accruals:{},monthlyEssential:1000,externalAssets:{investments:98765.43,eurofer:43210.5,debts:0,updated:'2026-11-22'}}
});
function harness(privateMode){
 let html='',count=0;
 const original=global.document;
 const fake={
   getElementById(id){return html.includes('id="'+id+'"')?{id,onclick:null,onchange:null,onsubmit:null,scrollIntoView(){}}:null;},
   querySelectorAll(selector){return [];},
 };
 global.document=fake;
 const st=state();
 const ctx={state:st,privacyHidden:privateMode,layout(x){html=x;count++;},save:async()=>{},esc:x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),euro:n=>Number(n||0).toFixed(2)+' €',fmtDate:s=>s,categories:t=>t==='expense'?['Alimentari']:['Stipendio'],download(){},bal:id=>250,validateCashChange:()=>true,setTab(){},expenseType:()=> 'primaria'};
 try{UI.render(ctx);return {html,count,st};}finally{if(original===undefined)delete global.document;else global.document=original;}
}
test('v3.5 renders monthly categories with annual category matrix',()=>{
 const {html}=harness(false);
 assert.match(html,/Analisi economica/);
 assert.match(html,/Spese per categoria × mese/);
 assert.match(html,/data-an-matrix-month/);
 assert.match(html,/Alimentari/);
 assert.match(html,/Spese ricorrenti/);
 assert.match(html,/Competenza economica/);
 assert.match(html,/Risparmio trasferito/);
});
test('hidden privacy mode prevents editable manual valuation fields',()=>{
 const {html}=harness(true);
 assert.match(html,/Modalità privacy attiva/);
 assert.doesNotMatch(html,/name="eurofer"/);
 assert.doesNotMatch(html,/name="investments"/);
 assert.doesNotMatch(html,/name="debts"/);
});
test('normal display allows explicit config without mutating transactions',()=>{
 const st=state(),before=JSON.stringify(st.transactions),{html}=harness(false);
 assert.match(html,/id="anConfig"/);
 assert.match(html,/name="eurofer"/);
 assert.equal(JSON.stringify(st.transactions),before);
});
