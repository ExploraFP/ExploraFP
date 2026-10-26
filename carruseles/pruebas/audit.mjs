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
const auditar = async (nombre) => {
  const r = await p.evaluate(() => {
    const malos = [], reales = [];
    const mira = (doc, pref) => doc.querySelectorAll('*').forEach(e => {
      const c = doc.defaultView.getComputedStyle(e);
      const ob = c.overscrollBehaviorY;
      const caja = c.overflowY !== 'visible' || c.overflowX !== 'visible';
      if (ob === 'auto') return;
      const rect = e.getBoundingClientRect(); if (!rect.width || !rect.height) return;
      const puede = (c.overflowY === 'auto' || c.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 1;
      const id = pref + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ').slice(0, 2).join('.') : '');
      if (puede || e === doc.documentElement || e === doc.body) reales.push(id + '(' + ob + ')'); else malos.push(id + ' [' + c.overflowX + '/' + c.overflowY + ' ob ' + ob + ']');
    });
    mira(document, '');
    document.querySelectorAll('iframe').forEach(f => { try { if (f.contentDocument && f.getBoundingClientRect().width) mira(f.contentDocument, 'IFRAME>'); } catch (e) {} });
    return {malos: [...new Set(malos)].slice(0, 15), nMalos: malos.length, reales: [...new Set(reales)].slice(0, 10)};
  });
  console.log('== ' + nombre, 'trampas:', r.nMalos, r.malos.join(' | '), '|| reales:', r.reales.join(' '));
};
const ir = async s => { await p.evaluate(x => cntIr(x), s); await p.waitForTimeout(900); };
await ir('matriz'); await auditar('matriz');
await p.click('#vistas [data-v="datos"]'); await p.waitForTimeout(600); await auditar('datos');
await p.click('#vistas [data-v="ideas"]'); await p.waitForTimeout(600); await p.click('.c-idea .celda >> nth=0'); await p.waitForTimeout(600); await auditar('ficha idea'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await ir('carruseles'); await auditar('produccion');
await p.click('.est-tarjeta .mini, .est-tarjeta h4 >> nth=0').catch(e=>console.log('no tarjeta')); await p.waitForTimeout(1200); await auditar('editor carrusel');
await ir('guiones'); await auditar('guiones');
await ir('estaticos'); await auditar('estaticos');
await ir('directorio'); await auditar('directorio');
await ir('imagenes'); await auditar('galeria');
await ir('newsletter'); await p.waitForTimeout(3000); await auditar('newsletter');
const nl = p.frames().find(f=>f!==p.mainFrame()&&f.url()==='about:srcdoc'); if (nl) { const bt = await nl.$$('button'); for (const x of bt) { if ((await x.innerText()).trim().startsWith('Pendientes')) { await x.click(); break; } } await p.waitForTimeout(800); await auditar('newsletter pendientes'); await p.screenshot({path:process.env.SALIDA+'nl-pend.png'}); }
await p.click('#cnt-lado [data-cnt="inicio"] >> nth=0'); await p.waitForTimeout(600); await auditar('inicio');
await b.close();
