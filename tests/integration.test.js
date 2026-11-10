'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const {allocationEvents}=require('../js/forecast');
test('browser loads accounting modules before app',()=>{assert.ok(html.indexOf('js/ledger.js')<html.indexOf('app.js'));assert.ok(html.indexOf('js/forecast.js')<html.indexOf('app.js'));});
test('service worker caches new modules',()=>{assert.match(sw,/js\/ledger\.js/);assert.match(sw,/js\/forecast\.js/);assert.match(sw,/family-cfo-v3-4/);});
test('UI uses accounting core for balances and dated reconciliation',()=>{assert.match(app,/function bal\(id\)\{return FamilyLedger\.balanceAt/);assert.match(app,/FamilyLedger\.balanceAt\(state\.accounts,state\.transactions,a\.id,r\.date\)/);});
test('UI uses forecast core and configured allocation totals',()=>{assert.match(app,/FamilyForecast\.incomeEvents/);assert.match(app,/FamilyForecast\.allocationEvents\(period,state\.accounts,state\.transactions,[^\n]*state\.allocations\)/);});
test('auto allocation total matches configured amount, not duplicated',()=>{
 const a=[{id:'free'},{id:'insurance',name:'Assicurazione',goal:{monthly:47}},{id:'tax',name:'Bollo',goal:{monthly:21}},{id:'maintenance',name:'Manutenzione',goal:{monthly:77}},{id:'car',name:'Auto',goal:{monthly:0}}];
 const events=allocationEvents('2026-12',a,[],28,[['Fondo auto complessivo',145]]);
 assert.equal(Math.round(events.reduce((s,e)=>s+e.amount,0)*100),14500);
});
