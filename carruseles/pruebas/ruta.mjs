import { chromium } from "../node_modules/playwright/index.mjs";
import { readFileSync, readdirSync } from "node:fs";
const C=process.env.COPIA, S=process.env.SALIDA;
const docs={}; for (const col of readdirSync(C)) { if(col.startsWith('_')) continue; docs[col]={}; for (const f of readdirSync(C+col)) { const j=JSON.parse(readFileSync(C+col+'/'+f,'utf8')); docs[col][f.replace(/\.json$/,'')]=j.data||j; } }
const b=await chromium.launch(); const err=[]; const p=await b.newPage({viewport:{width:1440,height:900}}); p.on('pageerror',x=>err.push(x.message)); p.on('console',m=>{if(m.type()==='error')err.push('c:'+m.text())});
await p.addInitScript(([Cs])=>{ if(window.parent!==window) return; const cols=JSON.parse(Cs); const subs={};
 const snap=c=>({docs:Object.entries(cols[c]||{}).map(([id,d])=>({id,data:()=>d}))}); const avisa=c=>(subs[c]||[]).forEach(f=>setTimeout(()=>f(snap(c)),30));
 const col=c=>({onSnapshot:f=>{(subs[c]=subs[c]||[]).push(f);setTimeout(()=>f(snap(c)),50);return()=>{}},orderBy:()=>col(c),where:()=>col(c),get:async()=>snap(c),
   doc:id=>({set:async d=>{(cols[c]=cols[c]||{})[id]=JSON.parse(JSON.stringify(d));avisa(c)},update:async d=>{Object.assign((cols[c]=cols[c]||{})[id]||{},d);avisa(c)},delete:async()=>{delete (cols[c]||{})[id];avisa(c)}})});
 window.claude={use:async k=>k==='db'?{collection:col,doc:p=>col(p.split('/')[0]).doc(p.split('/')[1])}:null};
 try{localStorage.setItem('contenidos.seccion','carruseles');localStorage.setItem('explora.pestana','ideas');}catch(e){} },[JSON.stringify(docs)]);
await p.goto('http://127.0.0.1:8765/banco-de-carruseles.html'); await p.waitForTimeout(2500);
const info=async m=>console.log(m, JSON.stringify(await p.evaluate(()=>({sec:CNT.sec,v:S.v,y:scrollY, sh:document.documentElement.scrollHeight, cls:document.body.className, onb:!!document.querySelector('#onb:not([hidden])')&&getComputedStyle(document.querySelector('#onb')).display, top:(()=>{const e=document.elementFromPoint(700,600);return e&&(e.id||e.className||e.tagName)})()}))));
// Plantilla Ruta en la web (26/10/2026): un carrusel con los 8 tipos, editor, miniaturas y que se puede pulsar cada texto
const yaml = await import('../node_modules/js-yaml/dist/js-yaml.mjs');
const c = yaml.load(readFileSync(new URL('../contenido/_pruebas/prueba-ruta.yml', import.meta.url), 'utf8'));
c.slides.forEach(s => { if (s.imagen) s.imagen = s.imagen.replace(/^img\//, 'fotos/').replace(/\.webp$/, '.jpg'); });
await p.evaluate(c => { cntIr('carruseles'); const x = Object.assign({id: 'Cruta', num: 99, titulo: 'Prueba Ruta', estado: 'borrador', creado: new Date().toISOString()}, c); guardarC(x); render(); abrirEditor('Cruta'); }, c);
await p.waitForTimeout(2500);
await p.screenshot({path: process.env.SALIDA + 'ruta-editor.png'});
console.log('miniaturas:', await p.evaluate(() => document.querySelectorAll('#est-editor iframe').length));
for (const n of [1, 4, 7]) { await p.evaluate(n => irSlide ? irSlide(n) : 0, n); await p.waitForTimeout(800); await p.screenshot({path: process.env.SALIDA + 'ruta-editor-' + n + '.png'}); }
console.log('qc:', await p.evaluate(() => (document.querySelector('#est-editor .est-qc, #est-editor .est-qc-ok, #est-editor [class*="qc"]') || {}).innerText || ''));
console.log('plantillas en Diseño:', await p.evaluate(() => EST_PLANTILLAS.map(x => x.nombre).join(', ')));
console.log('err', err.filter(x => !/404|CERT/.test(x))); await b.close();
