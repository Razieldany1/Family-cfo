'use strict';
// Pure accounting helpers. No browser globals or persistence side effects.
const cents = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new TypeError('Importo non valido');
  return Math.round(n * 100);
};
function assertTransaction(t) {
  if (!t || typeof t !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date || '')) throw new Error('Data movimento non valida');
  const d = new Date(t.date + 'T12:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== t.date) throw new Error('Data movimento inesistente');
  if (!['income', 'expense', 'transfer'].includes(t.type) || cents(t.amount) <= 0) throw new Error('Tipo o importo non valido');
  if (t.type === 'income' && (!t.to || t.from)) throw new Error('Entrata non coerente');
  if (t.type === 'expense' && (!t.from || t.to)) throw new Error('Spesa non coerente');
  if (t.type === 'transfer' && (!t.from || !t.to || t.from === t.to)) throw new Error('Trasferimento non coerente');
  return true;
}
function balanceAt(accounts, transactions, id, date = '9999-12-31') {
  const account = accounts.find(a => a.id === id);
  if (!account) throw new Error('Conto sconosciuto: ' + id);
  let total = cents(account.opening || 0);
  for (const t of transactions) {
    assertTransaction(t);
    if (t.date > date) continue;
    if (t.to === id) total += cents(t.amount);
    if (t.from === id) total -= cents(t.amount);
  }
  return total / 100;
}
function reconcileAt(accounts, transactions, id, date, observed) {
  const expected = balanceAt(accounts, transactions, id, date);
  return { date, expected, observed: cents(observed) / 100, difference: (cents(observed) - cents(expected)) / 100 };
}
function financialKey(date) {
  const [y, m, d] = date.split('-').map(Number);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(y) || m < 1 || m > 12 || d < 1 || d > 31) throw new Error('Data non valida');
  const x = new Date(Date.UTC(y, m - 1 + (d >= 27 ? 1 : 0), 1));
  return x.toISOString().slice(0, 7);
}
function financialRange(key) {
  if (!/^\d{4}-\d{2}$/.test(key)) throw new Error('Periodo non valido');
  const [y, m] = key.split('-').map(Number);
  const iso = d => d.toISOString().slice(0, 10);
  return {start: iso(new Date(Date.UTC(y, m - 2, 27))), end: iso(new Date(Date.UTC(y, m - 1, 26)))};
}
const api={cents,assertTransaction,balanceAt,reconcileAt,financialKey,financialRange};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined')window.FamilyLedger=api;
