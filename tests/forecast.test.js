'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {incomeEvents,allocationEvents}=require('../js/forecast');
const base={salaryEnabled:true,salary:1600,salaryDay:27,decemberBonusEnabled:true,decemberBonus:1350,decemberPayDay:15,allowanceEnabled:true,allowance:407.6,allowanceDate:'2026-12-17'};
const tx=(category,amount,note='',incomeKind)=>({date:'2026-12-15',type:'income',to:'free',category,note,amount,...(incomeKind?{incomeKind}:{})});
test('rimborso non cancella stipendio e tredicesima',()=>assert.equal(incomeEvents('2026-12',[tx('Rimborso',1200)],base).find(e=>e.id.startsWith('salary')).amount,2950));
test('stipendio parziale lascia la tredicesima',()=>assert.equal(incomeEvents('2026-12',[tx('Stipendio',1600)],base).find(e=>e.id.startsWith('salary')).amount,1350));
test('AUU riconosciuto non duplicato',()=>assert.equal(incomeEvents('2026-12',[tx('Assegno Unico',407.6)],base).filter(e=>e.id.startsWith('allowance')).length,0));
test('entrata INPS generica richiede classificazione',()=>assert.equal(incomeEvents('2026-12',[tx('Entrata',407.6,'INPS')],base).find(e=>e.id.startsWith('allowance')).amount,407.6));
test('accredito combinato classificato non duplicato',()=>assert.equal(incomeEvents('2026-12',[tx('Cedolino',2950,'','salary_bonus13')],base).filter(e=>e.id.startsWith('salary')).length,0));
test('accantonamenti residui non mutano dati',()=>{
 const a=[{id:'free',name:'Conto'},{id:'emergency',name:'Emergenza',goal:{monthly:200}}],t=[{date:'2026-12-01',type:'transfer',from:'free',to:'emergency',amount:80}];
 const snapshot=JSON.stringify({a,t}),e=allocationEvents('2026-12',a,t,28);
 assert.equal(e[0].amount,120);assert.equal(JSON.stringify({a,t}),snapshot);
});
