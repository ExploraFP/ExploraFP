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
// 16/11/2026: en la herramienta real la base de datos repinta el editor a menudo; si cae entre apretar y soltar, el clic se
// perdía y «la plantilla de cuerpo no se cambia». Aquí se repinta a propósito entre mouse.down y mouse.up.
const id = await p.evaluate(() => { cntIr('carruseles'); const c = Object.values(EST.lista).find(c => c.slides.length > 3 && pasoDe(c) === 'borrador'); abrirEditor(c.id); return c.id; });
await p.waitForTimeout(1500);
await p.evaluate(() => { EST.sel = 1; LZ.tab = 'plantilla'; pintarEditor(true); }); await p.waitForTimeout(800);
const antes = await p.evaluate(id => EST.lista[id].slides[1].tipo, id);
const destino = antes === 'lista' ? 'pasos' : 'lista';
const bt = await p.evaluate(k => { const r = document.querySelector('[data-lz-forma="' + k + '"]').getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; }, destino);
await p.mouse.move(bt.x, bt.y); await p.mouse.down();
await p.evaluate(() => pintarEditor());   // el eco de la base de datos
await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(1200);
console.log('forma con repintado entre apretar y soltar:', antes, '->', await p.evaluate(id => EST.lista[id].slides[1].tipo, id), '(esperado ' + destino + ')');
// pestaña: un solo cambio (no se abre y se cierra)
const tb = await p.evaluate(() => { const r = document.querySelector('.lz-rail [data-lz-tab="elementos"]').getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; }); await p.mouse.click(tb.x, tb.y); await p.waitForTimeout(500);
console.log('pestaña abierta:', await p.evaluate(() => LZ.tab));
console.log('err', err.filter(x => !/404|CERT/.test(x))); await b.close();
