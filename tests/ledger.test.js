'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {balanceAt,reconcileAt,financialKey,financialRange,assertTransaction} = require('../js/ledger');
const accounts=[{id:'free',opening:500},{id:'emergency',opening:2000},{id:'leo',opening:2800},{id:'bianca',opening:1300}];
const tx=[
 {id:'1',date:'2026-10-27',type:'income',to:'free',amount:1600},
 {id:'2',date:'2026-10-28',type:'income',to:'free',amount:407.6},
 {id:'3',date:'2026-10-29',type:'transfer',from:'free',to:'emergency',amount:200},
 {id:'4',date:'2026-10-30',type:'transfer',from:'free',to:'leo',amount:100},
 {id:'5',date:'2026-10-31',type:'expense',from:'free',amount:300}
];
test('saldo e patrimonio: i trasferimenti non generano patrimonio',()=>{
 assert.equal(balanceAt(accounts,tx,'free'),1907.6);
 assert.equal(balanceAt(accounts,tx,'emergency'),2200);
 assert.equal(balanceAt(accounts,tx,'leo'),2900);
 assert.equal(balanceAt(accounts,tx,'bianca'),1300);
 assert.equal(accounts.reduce((s,a)=>s+balanceAt(accounts,tx,a.id),0),8307.6);
});
test('riconciliazione storica non cambia dopo movimenti successivi',()=>{
 const before=reconcileAt(accounts,tx,'free','2026-10-28',2507.6);
 const after=reconcileAt(accounts,[...tx,{id:'6',date:'2026-11-02',type:'expense',from:'free',amount:100}],'free','2026-10-28',2507.6);
 assert.deepEqual(before,after); assert.equal(before.difference,0);
});
test('periodo finanziario 27-26',()=>{
 assert.equal(financialKey('2026-10-26'),'2026-10');
 assert.equal(financialKey('2026-10-27'),'2026-11');
 assert.equal(financialKey('2026-11-26'),'2026-11');
 assert.equal(financialKey('2026-11-27'),'2026-12');
 assert.deepEqual(financialRange('2026-11'),{start:'2026-10-27',end:'2026-11-26'});
});
test('rifiuta movimenti invalidi',()=>{
 assert.throws(()=>assertTransaction({date:'2026-02-30',type:'income',to:'free',amount:100}));
 assert.throws(()=>assertTransaction({date:'2026-10-27',type:'transfer',from:'free',to:'free',amount:100}));
 assert.throws(()=>assertTransaction({date:'2026-10-27',type:'expense',from:'free',amount:-1}));
});
