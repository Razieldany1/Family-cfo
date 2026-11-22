'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../js/analytics.js');
const account=(id,opening=0)=>({id,opening});
const tx=(id,date,type,amount,category,from='',to='',note='')=>({id,date,type,amount,category,from,to,note});
const sample=()=>({
 accounts:[account('free',500),account('emergency',2000),account('child_1',2800),account('child_2',1500)],
 budget:[['Alimentari',300],['Carburante',150]],transactions:[
  tx('i1','2026-10-27','income',1600,'Stipendio','','free'),
  tx('e1','2026-10-27','expense',90,'Alimentari','free','','Supermercato'),
  tx('e2','2026-11-05','expense',45,'Alimentari','free','','Supermercato'),
  tx('e3','2026-11-05','expense',20,'Carburante','free','','Diesel'),
  tx('t1','2026-11-02','transfer',200,'Accantonamento','free','emergency'),
  tx('t2','2026-11-03','transfer',100,'PAC figli','free','child_1'),
  tx('t3','2026-11-08','transfer',20,'Rientro','child_1','free'),
  tx('e4','2026-11-27','expense',35,'Alimentari','free','','Supermercato')
 ],analysis:{categoryGroups:{},accruals:{},irregular:{}}
});
test('financial period boundary is inclusive 27 previous month to 26 current',()=>{
 assert.equal(A.periodOf('2026-10-26'),'2026-10');
 assert.equal(A.periodOf('2026-10-27'),'2026-11');
 assert.equal(A.periodOf('2026-11-26'),'2026-11');
 assert.equal(A.periodOf('2026-11-27'),'2026-12');
 assert.deepEqual(A.periodRange('2026-11'),{start:'2026-10-27',end:'2026-11-26'});
 assert.equal(A.periodOf('2026-10-27','calendar'),'2026-10');
 assert.deepEqual(A.periodRange('2026-11','calendar'),{start:'2026-11-01',end:'2026-11-30'});
});
test('financial summary excludes transfers from household consumption',()=>{
 const s=A.summarize(sample(),'2026-11');
 assert.equal(s.income,1600);assert.equal(s.expense,155);assert.equal(s.margin,1445);
 assert.equal(s.transfer,320);assert.equal(s.saved,280);assert.equal(s.saveIn,300);assert.equal(s.saveOut,20);
 assert.equal(s.counts.transfer,3);assert.equal(s.counts.expense,3);
});
test('category drilldown retains the source transactions and counts without changing ledger',()=>{
 const state=sample(),before=JSON.stringify(state),s=A.summarize(state,'2026-11');
 assert.equal(s.byCategory['expense:Alimentari'].total,135);
 assert.deepEqual(s.byCategory['expense:Alimentari'].transactions.map(t=>t.id),['e2','e1']);
 assert.equal(s.byCategory['expense:Carburante'].total,20);
 assert.equal(JSON.stringify(state),before);
});
test('macro and group classification can override defaults without editing old transactions',()=>{
 const state=sample();state.analysis.categoryGroups.Alimentari='Famiglia e tempo libero';
 const s=A.summarize(state,'2026-11');
 assert.equal(s.byMacro['Famiglia e tempo libero'].total,135);
 assert.equal(s.byMacro.Auto.total,20);
 assert.equal(state.transactions[1].category,'Alimentari');
});
test('calendar and financial months change only reporting, not transaction dates',()=>{
 const state=sample(),before=JSON.stringify(state);
 assert.equal(A.summarize(state,'2026-11','calendar').expense,100);
 assert.equal(A.summarize(state,'2026-11','financial').expense,155);
 assert.equal(JSON.stringify(state),before);
});
test('annual reports include only recorded data across 12 periods',()=>{
 const rows=A.annual(sample(),2026);
 assert.equal(rows.length,12);assert.equal(rows[10].period,'2026-11');assert.equal(rows[10].expense,155);
 assert.equal(rows[11].expense,35);
});
test('previous month with no records is not asserted comparable',()=>{
 const c=A.compare(sample(),'2026-11');assert.equal(c.comparable,false);
 assert.equal(c.delta,155);assert.equal(c.percentage,null);
});
test('rolling averages flag incomplete history',()=>{
 const r=A.averages(sample(),'2026-11');assert.equal(r.length,3);
 assert.equal(r[0].months,3);assert.equal(r[0].observed,1);assert.equal(r[0].complete,false);
 assert.equal(r[0].avgExpense,51.67);
});
test('recurrent expenses require same description in three different periods',()=>{
 const s=sample();
 for(const [i,date] of ['2026-07-28','2026-08-28','2026-09-28'].entries())
  s.transactions.push(tx('r'+i,date,'expense',80,'Internet','free','','Abbonamento fisso'));
 const list=A.recurring(s,'2026-11');assert.equal(list.length,1);assert.equal(list[0].months,3);
 assert.equal(list[0].average,80);
});
test('suggestion requires two agreeing historical classifications',()=>{
 const t=[tx('a','2026-10-01','expense',25,'Alimentari','free','','Pane casa'),tx('b','2026-10-02','expense',40,'Alimentari','free','','Pane casa')];
 const target=tx('c','2026-11-01','expense',15,'','free','','Pane casa');
 assert.equal(A.suggestion(t,target).name,'Alimentari');
 assert.equal(A.suggestion(t,tx('x','2026-11-01','expense',5,'','free','','Nota mai vista')),null);
});
test('sparse notes are never used for automatic categorization',()=>{
 const t=[tx('a','2026-10-01','expense',5,'Alimentari','free','','xx'),tx('b','2026-10-02','expense',5,'Alimentari','free','','xx')];
 assert.equal(A.suggestion(t,tx('c','2026-11-01','expense',5,'','free','','xx')),null);
});
test('accrual splits expense reports but does not change cash expenses or original data',()=>{
 const s=sample();s.analysis.accruals.e1={months:2,start:'2026-11'};
 const before=JSON.stringify(s.transactions);
 assert.equal(A.summarize(s,'2026-11').expense,155);
 assert.equal(A.competence(s,'2026-11').total,110);
 assert.equal(A.competence(s,'2026-12').byCategory.Alimentari,80);
 assert.equal(JSON.stringify(s.transactions),before);
});
test('uneven cents are allocated deterministically without rounding loss',()=>{
 const s={transactions:[tx('z','2026-09-10','expense',100,'Luce','free')],analysis:{accruals:{z:{months:3,start:'2026-09'}}}};
 assert.equal(A.competence(s,'2026-09').total,33.34);
 assert.equal(A.competence(s,'2026-10').total,33.33);
 assert.equal(A.competence(s,'2026-11').total,33.33);
});
test('asset calculations include both adults and children once, without turning savings into spending',()=>{
 const s=sample(),before=JSON.stringify(s);
 const b=A.accountTotals(s.accounts,s.transactions);
 assert.equal(b.family,3830);
 assert.equal(b.children,4380);
 assert.equal(b.total,8210);
 assert.equal(JSON.stringify(s),before);
});
test('date order and IDs do not change under filtering',()=>{
 const state=sample(),r=A.rowsFor(state,'2026-11','financial','expense');
 assert.deepEqual(r.map(t=>t.id),['e3','e2','e1']);
 assert.equal(state.transactions[1].id,'e1');
});
