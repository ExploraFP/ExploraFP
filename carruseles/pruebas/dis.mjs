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
const st=async m=>console.log(m, JSON.stringify(await p.evaluate(()=>({sec:CNT.sec, menu:[...document.querySelectorAll('#cnt-lado .cnt-nav [data-cnt]')].filter(b=>getComputedStyle(b).display!=='none').map(b=>(b.getAttribute('aria-current')==='page'?'*':'')+b.textContent.trim()).join(' · '),
  barra: CNT.sec==='estaticos' ? [...document.querySelectorAll('#cnt-estaticos .gu-barra button')].map(b=>(b.getAttribute('aria-current')==='true'?'*':'')+b.textContent).join('/') : [...document.querySelectorAll('#vistas button')].filter(b=>getComputedStyle(b).display!=='none').map(b=>(b.getAttribute('aria-current')==='true'?'*':'')+b.textContent).join('/')}))));
const S2=process.env.SALIDA;
await st('carga');
await p.click('#cnt-lado .cnt-nav [data-cnt="diseno"]'); await p.waitForTimeout(700); await st('diseño'); await p.screenshot({path:S2+'dis-1.png'});
await p.click('#vistas [data-dis-es="normal"]'); await p.waitForTimeout(700); await st('estáticos'); await p.screenshot({path:S2+'dis-2.png'});
await p.click('#cnt-estaticos [data-es-tab="dinamico"]'); await p.waitForTimeout(500); await st('dinámicos');
await p.click('#cnt-estaticos [data-dis-ir]'); await p.waitForTimeout(700); await st('vuelta a carruseles');
await p.click('#vistas [data-dis-es="dinamico"]'); await p.waitForTimeout(600); await st('dinámicos desde carruseles');
await p.click('#cnt-lado .cnt-nav [data-cnt="matriz"]'); await p.waitForTimeout(600); await st('matriz');
await p.click('#cnt-lado .cnt-nav [data-cnt="diseno"]'); await p.waitForTimeout(700); await st('diseño recuerda');
await p.click('#cnt-lado .cnt-nav [data-cnt="imagenes"]'); await p.waitForTimeout(600); await st('galería');
await p.click('#cnt-lado [data-cnt="inicio"] >> nth=0'); await p.waitForTimeout(700); console.log('inicio:', await p.evaluate(()=>[...document.querySelectorAll('.cnt-tarjeta')].map(t=>t.innerText.replace(/\n/g,' ')).join(' | ')));
await p.reload(); await p.waitForTimeout(2000); await st('recarga');
await p.setViewportSize({width:390,height:844}); await p.click('#cnt-lado .cnt-nav [data-cnt="diseno"]'); await p.waitForTimeout(700); await p.screenshot({path:S2+'dis-3-movil.png'});
console.log('err', err.filter(x=>!/404|CERT/.test(x))); await b.close();
