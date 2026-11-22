'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const {allocationEvents}=require('../js/forecast');
test('browser loads accounting modules before app',()=>{assert.ok(html.indexOf('js/ledger.js')<html.indexOf('app.js'));assert.ok(html.indexOf('js/forecast.js')<html.indexOf('app.js'));assert.ok(html.includes('js/migration.js')&&html.indexOf('js/migration.js')<html.indexOf('app.js'));});
test('service worker caches new modules',()=>{assert.match(sw,/js\/ledger\.js/);assert.match(sw,/js\/forecast\.js/);assert.match(sw,/js\/migration\.js/);assert.match(sw,/family-cfo-v3-5/);assert.match(sw,/js\/analytics\.js/);assert.match(sw,/js\/analysis-ui\.js/);});
test('analytics scripts load before app and navigation is connected',()=>{assert.ok(html.indexOf('js/analytics.js')<html.indexOf('app.js'));assert.ok(html.indexOf('js/analysis-ui.js')<html.indexOf('app.js'));assert.match(html,/data-tab="analysisPage"/);assert.match(app,/function analysisPage\(\)/);});
test('UI uses accounting core for balances and dated reconciliation',()=>{assert.match(app,/function bal\(id\)\{return FamilyLedger\.balanceAt/);assert.match(app,/FamilyLedger\.balanceAt\(state\.accounts,state\.transactions,a\.id,r\.date\)/);});
test('UI uses forecast core and configured allocation totals',()=>{assert.match(app,/FamilyForecast\.incomeEvents/);assert.match(app,/FamilyForecast\.allocationEvents\(period,state\.accounts,state\.transactions,[^\n]*state\.allocations\)/);});
test('auto allocation total matches configured amount, not duplicated',()=>{
 const a=[{id:'free'},{id:'insurance',name:'Assicurazione',goal:{monthly:47}},{id:'tax',name:'Bollo',goal:{monthly:21}},{id:'maintenance',name:'Manutenzione',goal:{monthly:77}},{id:'car',name:'Auto',goal:{monthly:0}}];
 const events=allocationEvents('2026-12',a,[],28,[['Fondo auto complessivo',145]]);
 assert.equal(Math.round(events.reduce((s,e)=>s+e.amount,0)*100),14500);
});

test('legacy backup import applies all non-destructive migrations before persisting',()=>{
 assert.match(app,/state=prepared\.state;try\{ensureGoals\(\);ensureForecast\(\);ensureInsights\(\);ensureV24\(\);ensureV3\(\);dashboard\(\);await atomicRestore\(state,previous\)/);
});
test('backup validation rejects unknown account references and duplicate movement IDs',()=>{
 assert.match(app,/txIds\.has\(t\.id\)/);
 assert.match(app,/!ids\.has\(t\.from\)/);
 assert.match(app,/!ids\.has\(t\.to\)/);
});

test('legacy v3.3-style backup passes actual validation without altering movements',()=>{
 const vm=require('node:vm');
 const dateHelper=app.slice(app.indexOf('function isISODate(s){'),app.indexOf('function auditLedger(){'));
 const validator=app.slice(app.indexOf('function valid(o){'),app.indexOf('function download(',app.indexOf('function valid(o){')));
 const ctx=vm.createContext({});
 vm.runInContext(dateHelper+'\n'+validator,ctx);
 const fixture={version:1,accounts:[{id:'free',name:'Conto',opening:500},{id:'emergency',name:'Fondo',opening:2000}],transactions:[{id:'t1',date:'2026-10-27',type:'income',to:'free',amount:1600,category:'Stipendio'},{id:'t2',date:'2026-10-28',type:'transfer',from:'free',to:'emergency',amount:200,category:'Fondo'}],budget:[['Alimentari',300]],allocations:[['Fondo emergenza',200]],deadlines:[{id:'d1',date:'2026-12-15',amount:280,account:'emergency'}],incomeMonthly:1600};
 const before=JSON.stringify(fixture);
 assert.equal((ctx.fixture=fixture,vm.runInContext('valid(fixture)',ctx)),true);
 assert.equal(JSON.stringify(fixture),before);
 const invalid=structuredClone(fixture);invalid.transactions[1].id='t1';
 assert.equal((ctx.fixture=invalid,vm.runInContext('valid(fixture)',ctx)),false);
});

test('restore render failure preserves previous state and never writes',async()=>{
 const vm=require('node:vm');
 const source=app.slice(app.indexOf('async function restoreBackup(obj)'),app.indexOf('function valid(o)'));
 const previous={marker:'previous'},next={marker:'next'};
 let writes=0;
 const ctx=vm.createContext({state:previous,valid:()=>true,backupMapping:()=>({}),FamilyMigration:{prepare:()=>({state:next,report:{movements:0,total:0,accounts:[]}})},privacyHidden:true,confirm:()=>true,ensureGoals(){},ensureForecast(){},ensureInsights(){},ensureV24(){},ensureV3(){},dashboard(){if(ctx.state===next)throw Error('render failed')},atomicRestore:async()=>{writes++},alert(){},console});
 vm.runInContext(source,ctx);
 await assert.rejects(vm.runInContext('restoreBackup({})',ctx),/render failed/);
 assert.equal(ctx.state,previous);assert.equal(writes,0);
});
