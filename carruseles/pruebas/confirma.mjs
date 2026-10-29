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
// Editor: los pasos solo se ven (no se pulsan), «Lista para publicar» pide confirmación y «↩ Volver a…» vuelve atrás (29/10/2026)
const S2 = process.env.SALIDA;
const id = await p.evaluate(() => { cntIr('carruseles'); const c = Object.values(EST.lista).find(c => etapaDe(c) === 'revision' && c.slides.length); abrirEditor(c.id); return c.id; });
await p.waitForTimeout(2500);
const barra = async m => console.log(m, await p.evaluate(() => [...document.querySelectorAll('#est-editor .est-ecab button, #est-editor .eb-pasos span')].map(b => (b.tagName === 'SPAN' ? '[' : '') + b.textContent.trim() + (b.tagName === 'SPAN' ? ']' : '')).filter(Boolean).join(' | ')));
await barra('borrador:');
await p.screenshot({path: S2 + 'confirma-0.png', clip: {x: 0, y: 100, width: 1440, height: 80}});
await p.click('#pr-ok'); await p.waitForTimeout(400);
console.log('ventana:', await p.evaluate(() => ($('#onb .cuerpo') || {}).innerText));
await p.screenshot({path: S2 + 'confirma-1.png'});
await p.click('#onbCerrar'); await p.waitForTimeout(200); console.log('tras cancelar etapa:', await p.evaluate(id => etapaDe(EST.lista[id]), id));
await p.click('#pr-ok'); await p.waitForTimeout(300); await p.click('#eb-ok-si'); await p.waitForTimeout(1500);
if (await p.evaluate(id => etapaDe(EST.lista[id]), id) !== 'listo') { await p.waitForTimeout(2000); await p.click('#pr-ok'); await p.waitForTimeout(300); await p.click('#eb-ok-si'); await p.waitForTimeout(1500); }
console.log('tras sí:', await p.evaluate(id => etapaDe(EST.lista[id]), id)); await barra('para publicar:');
await p.click('.eb-volver'); await p.waitForTimeout(800); console.log('tras volver:', await p.evaluate(id => etapaDe(EST.lista[id]), id));
console.log('err', err.filter(x => !/404|CERT/.test(x))); await b.close();
