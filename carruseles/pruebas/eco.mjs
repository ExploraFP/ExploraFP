import { chromium } from "../node_modules/playwright/index.mjs";
// 20/11/2026 (Sandra: «no se puede editar nada»): la herramienta dentro de un marco de otro origen (como claude.ai) y la base de
// datos mandando avisos sin cambios cada poco (ECO=ms, por defecto 700). Un clic debe seleccionar y el doble clic escribir y guardar.
import { readFileSync, readdirSync } from "node:fs";
import http from "node:http";
const C=process.env.COPIA, S=process.env.SALIDA, ID=process.env.ID||'Cmuphs6hld8w';
const docs={}; for (const col of readdirSync(C)) { if(col.startsWith('_')) continue; docs[col]={}; for (const f of readdirSync(C+col)) { const j=JSON.parse(readFileSync(C+col+'/'+f,'utf8')); docs[col][f.replace(/\.json$/,'')]=j.data||j; } }
// página de fuera (otro origen) que mete la herramienta en un iframe con sandbox, como claude.ai
http.createServer((q,r)=>{r.end('<html><body style="margin:0"><iframe id="ap" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads" src="http://127.0.0.1:8765/banco-de-carruseles.html" style="width:100vw;height:100vh;border:0"></iframe></body></html>')}).listen(8766);
const W=+(process.env.W||1440), H=+(process.env.H||900); const b=await chromium.launch(); const err=[]; const p=await b.newPage({viewport:{width:W,height:H}, deviceScaleFactor:+(process.env.DPR||1)}); p.on('pageerror',x=>err.push(x.message)); p.on('console',m=>{if(m.type()==='error')err.push('c:'+m.text())});
await p.addInitScript(([Cs])=>{ if(location.port!=='8765'||window.parent.parent!==window.parent) return; const cols=JSON.parse(Cs); const subs={};
 window.__escrituras=0; window.__subs=subs; window.__snap=c=>snap(c);
 const snap=c=>({docs:Object.entries(cols[c]||{}).map(([id,d])=>({id,data:()=>(function f(o){if(o&&typeof o==="object"){Object.values(o).forEach(f);Object.freeze(o)}return o})(JSON.parse(JSON.stringify(d)))}))});
 // como la base de datos real: cada escritura vuelve como aviso, con retraso, y repinta
 const avisa=c=>(subs[c]||[]).forEach(f=>setTimeout(()=>f(snap(c)),250+Math.random()*400));
 const col=c=>({onSnapshot:f=>{(subs[c]=subs[c]||[]).push(f);setTimeout(()=>f(snap(c)),50);return()=>{}},orderBy:()=>col(c),where:()=>col(c),get:async()=>snap(c),
   doc:id=>({set:async d=>{window.__escrituras++;(cols[c]=cols[c]||{})[id]=JSON.parse(JSON.stringify(d));avisa(c)},update:async d=>{window.__escrituras++;Object.assign((cols[c]=cols[c]||{})[id]||{},JSON.parse(JSON.stringify(d)));avisa(c)},delete:async()=>{delete (cols[c]||{})[id];avisa(c)}})});
 window.claude={use:async k=>k==='db'?{collection:col,doc:p=>col(p.split('/')[0]).doc(p.split('/')[1])}:null};
 try{localStorage.setItem('contenidos.seccion','carruseles');}catch(e){} },[JSON.stringify(docs)]);
await p.goto('http://localhost:8766/'); await p.waitForTimeout(3500);
const f = p.frames().find(x=>x.url().includes('8765'));
const ev = (fn, a) => f.evaluate(fn, a);
await ev(id => { cntIr('carruseles'); abrirEditor(id); }, ID); await p.waitForTimeout(2000);
console.log('editor:', await ev(() => document.querySelector('#est-editor').className), '· slide', await ev(() => EST.sel));
const off = await p.evaluate(() => { const r = document.getElementById('ap').getBoundingClientRect(); return {x: r.left, y: r.top}; });
const punto = async sel => { const q = await ev(sel => { const fr = document.querySelector('#est-editor .est-grande iframe'), d = fr.contentDocument, t = d.querySelector(sel); if (!t) return null; const a = fr.getBoundingClientRect(), r = t.getBoundingClientRect(), k = a.width / 1080; return {x: a.left + (r.left + r.width / 2) * k, y: a.top + (r.top + Math.min(r.height / 2, 40)) * k}; }, sel); return q && {x: q.x + off.x, y: q.y + off.y}; };
if (process.env.REP) await ev(ms => { setInterval(() => { if (!SEL.inline) pintarEditor(); }, ms); }, +process.env.REP);
if (process.env.REPT) await ev(ms => { setInterval(() => { if (!SEL.inline) pintarEditor(true); }, ms); }, +process.env.REPT);
await p.waitForTimeout(500);
await ev(ms => { setInterval(() => (window.__subs.carruseles||[]).forEach(f => f(window.__snap('carruseles'))), ms); }, +(process.env.ECO || 700));
await p.waitForTimeout(500);
const tt = await punto('.titulo'); console.log('titulo en', tt);
await p.mouse.click(tt.x, tt.y); await p.waitForTimeout(700);
await p.waitForTimeout(900); console.log('1 clic → seleccionado:', await ev(() => SEL.pop && SEL.pop.campo), '· marco', await ev(() => !!document.querySelector('.lz-caja')));
await p.mouse.dblclick(tt.x, tt.y); await p.waitForTimeout(700);
console.log('doble clic → escribiendo:', await ev(() => !!SEL.inline));
await p.keyboard.press('End'); await p.keyboard.type(' PRUEBA'); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(2500);
console.log('guardado:', await ev(id => EST.lista[id].slides[EST.sel].titulo, ID), '· escrituras', await ev(() => window.__escrituras));
await p.screenshot({path: S + 'real.png'});
console.log('err', err.filter(x => !/404|CERT|favicon/.test(x))); await b.close(); process.exit(0);
