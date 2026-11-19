const test=require('node:test');
const assert=require('node:assert/strict');
const {prepare}=require('../js/migration.js');
const fixture=()=>({version:1,accounts:[{id:'free',name:'Conto',opening:100},{id:'old_a',name:'Test A',opening:20}],transactions:[{id:'t1',from:'free',to:'old_a',amount:12}],deadlines:[{account:'old_a'}],quickFavorites:[{to:'old_a'}],v3:{reconciliation:{old_a:{amount:32,date:'2026-01-01'}}}});
const valid=o=>o.accounts.length===new Set(o.accounts.map(a=>a.id)).size&&o.transactions.every(t=>o.accounts.some(a=>a.id===t.from)&&o.accounts.some(a=>a.id===t.to));
test('migration retains original and reconciled balances',()=>{const old=fixture(),before=JSON.stringify(old);const r=prepare(old,{old_a:'child_1'},valid);assert.equal(JSON.stringify(old),before);assert.equal(r.state.schemaVersion,2);assert.equal(r.state.transactions[0].to,'child_1');assert.equal(r.state.deadlines[0].account,'child_1');assert.equal(r.state.quickFavorites[0].to,'child_1');assert.equal(r.state.v3.reconciliation.child_1.amount,32);assert.equal(r.report.total,12000);assert.deepEqual(prepare(r.state,{},valid).state,r.state)});
test('rejects unknown schema',()=>assert.throws(()=>prepare({...fixture(),schemaVersion:99},{},valid)));
test('rejects invalid mapping',()=>assert.throws(()=>prepare(fixture(),{missing:'child_1'},valid)));
