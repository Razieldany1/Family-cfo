'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const forecast=require('../js/forecast.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
test('fresh initialization contains no prefilled balances or personal budget',()=>{
 const line=source.split('\n').find(l=>l.startsWith('const initial='));
 const initial=vm.runInNewContext(line+'\ninitial');
 assert.ok(initial.accounts.every(a=>a.opening===0));
 assert.equal(initial.incomeMonthly,0);
 assert.ok(initial.budget.concat(initial.allocations).every(x=>x[1]===0));
 assert.equal(initial.deadlines.length,0);
 assert.equal(initial.transactions.length,0);
});
test('forecast preserves saved account label allocations',()=>{
 const accounts=[{id:'free',name:'Conto'},{id:'child_1',name:'Risparmi Test A',goal:{monthly:0}},{id:'child_2',name:'Risparmi Test B',goal:{monthly:0}}];
 const events=forecast.allocationEvents('2026-11',accounts,[],28,[['Risparmi Test A',71],['Risparmi Test B',83]]);
 assert.deepEqual(events.map(e=>e.amount),[71,83]);
});
test('forecast supports neutral account labels',()=>{
 const accounts=[{id:'child_1',name:'Risparmi figlio 1'},{id:'child_2',name:'Risparmi figlio 2'}];
 assert.deepEqual(forecast.allocationEvents('2026-11',accounts,[],28,[['Risparmi figlio 1',51],['Risparmi figlio 2',62]]).map(e=>e.amount),[51,62]);
});
test('planned savings preserves saved account labels',()=>{
 const line=source.split('\n').find(l=>l.startsWith('function savingsBreakdown()'));
 const state={accounts:[{id:'child_1',name:'Risparmi Test A'},{id:'child_2',name:'Risparmi Test B'}],allocations:[['Risparmi Test A',71],['Risparmi Test B',83]],incomeMonthly:1000};
 const result=vm.runInNewContext(line+'\nsavingsBreakdown()', {state,sum:a=>a.reduce((s,x)=>s+x,0)});
 assert.equal(result.savings,154);
});
