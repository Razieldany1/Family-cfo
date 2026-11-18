'use strict';
(function(root){
 const schema=2;
 function prepare(source,mapping,validate){
  if(!source||![1,2].includes(source.schemaVersion??1)||!validate(source))throw Error('Backup non valido o schema non supportato');
  const copy=JSON.parse(JSON.stringify(source));
  const ids=new Set(copy.accounts.map(a=>a.id));
  const map=new Map(Object.entries(mapping||{}));
  for(const [old,id] of map){
   if(!ids.has(old)||!['child_1','child_2'].includes(id)|| (ids.has(id)&&old!==id))throw Error('Associazione conti non valida');
  }
  if(new Set(map.values()).size!==map.size)throw Error('Associazione duplicata');
  const rename=id=>map.get(id)??id;
  // Rewrite only exact references; preserve arbitrary descriptive text.
  for(const a of copy.accounts)a.id=rename(a.id);
  for(const t of copy.transactions){if(t.from)t.from=rename(t.from);if(t.to)t.to=rename(t.to)}
  for(const d of copy.deadlines)d.account=rename(d.account);
  for(const q of copy.quickFavorites||[]){if(q.from)q.from=rename(q.from);if(q.to)q.to=rename(q.to)}
  if(copy.v3?.reconciliation)copy.v3.reconciliation=Object.fromEntries(Object.entries(copy.v3.reconciliation).map(([id,v])=>[rename(id),v]));
  copy.schemaVersion=schema;
  if(!validate(copy))throw Error('Riferimenti contabili non validi dopo migrazione');
  const balance=(o,id)=>o.transactions.reduce((n,t)=>n+(t.to===id?Math.round(t.amount*100):0)-(t.from===id?Math.round(t.amount*100):0),Math.round(o.accounts.find(a=>a.id===id).opening*100));
  const rows=source.accounts.map(a=>({name:a.name,before:balance(source,a.id),after:balance(copy,rename(a.id))}));
  if(rows.some(r=>r.before!==r.after)||source.transactions.length!==copy.transactions.length)throw Error('Integrità contabile non verificata');
  return {state:copy,report:{accounts:rows,movements:copy.transactions.length,total:rows.reduce((s,r)=>s+r.after,0)}};
 }
 const api={prepare,schema};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.FamilyMigration=api;
})(typeof window!=='undefined'?window:null);
