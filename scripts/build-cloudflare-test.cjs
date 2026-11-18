'use strict';
// Build an allowlisted static bundle for an isolated Cloudflare Workers test deployment.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'dist-cloudflare-test');
const files=['index.html','style.css','app.js','sw.js','manifest.webmanifest','icon.svg','js/ledger.js','js/forecast.js','js/migration.js'];
fs.rmSync(out,{recursive:true,force:true});
for(const relative of files){
 const source=path.join(root,relative),dest=path.join(out,relative);
 if(!fs.existsSync(source))throw Error('File mancante: '+relative);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(source,dest);
}
console.log('Bundle Cloudflare test: '+files.length+' file pubblici (nessun backup o dato privato)');
