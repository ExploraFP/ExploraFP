import { chromium } from "../node_modules/playwright/index.mjs";
import { readFileSync, readdirSync } from "node:fs";
const C=process.env.COPIA, S=process.env.SALIDA;
const docs={}; for (const col of readdirSync(C)) { if(col.startsWith('_')) continue; docs[col]={}; for (const f of readdirSync(C+col)) { const j=JSON.parse(readFileSync(C+col+'/'+f,'utf8')); docs[col][f.replace(/\.json$/,'')]=j.data||j; } }
const b=await chromium.launch(); const err=[]; const p=await b.newPage({viewport:{width:1440,height:900}}); p.on('pageerror',x=>err.push(x.message)); p.on('console',m=>{if(m.type()==='error')err.push('c:'+m.text())});
await p.addInitScript(([Cs])=>{ if(window.parent!==window) return; const cols=JSON.parse(Cs); const subs={};
 const snap=c=>({docs:Object.entries(cols[c]||{}).map(([id,d])=>({id,data:()=>(function f(o){if(o&&typeof o==="object"){Object.values(o).forEach(f);Object.freeze(o)}return o})(JSON.parse(JSON.stringify(d)))}))}); const avisa=c=>(subs[c]||[]).forEach(f=>setTimeout(()=>f(snap(c)),30));
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
// 19/11/2026: doble clic para escribir con el editor repintándose entre los dos clics («no me deja editar»)
await p.evaluate(() => { LZ.tab = ''; pintarEditor(true); }); await p.waitForTimeout(800);
const tt = await p.evaluate(() => { const fr = document.querySelector('#est-editor .est-grande iframe'), d = fr.contentDocument, t = d.querySelector('.titulo');
  const a = fr.getBoundingClientRect(), r = t.getBoundingClientRect(), k = a.width / 1080; return {x: a.left + (r.left + r.width / 2) * k, y: a.top + (r.top + r.height / 2) * k}; });
await p.waitForTimeout(600);
await p.mouse.click(tt.x, tt.y); await p.evaluate(() => pintarEditor()); await p.waitForTimeout(60);
await p.mouse.click(tt.x, tt.y); await p.waitForTimeout(600);
console.log('escribir con doble clic y repintado:', await p.evaluate(() => !!SEL.inline), '(esperado true)');
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
// y con un doble clic normal
await p.mouse.dblclick(tt.x, tt.y); await p.waitForTimeout(600);
console.log('escribir con doble clic normal:', await p.evaluate(() => !!SEL.inline), '(esperado true)');
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
// un clic solo selecciona
await p.mouse.click(tt.x, tt.y); await p.waitForTimeout(600);
console.log('un clic solo selecciona:', await p.evaluate(() => !SEL.inline && !!document.querySelector('.lz-caja')), '(esperado true)');
// 20/11/2026: quitar una slide con la papelera de la miniatura y «Sí, quitar», con repintado entre apretar y soltar
const nAntes = await p.evaluate(id => EST.lista[id].slides.length, id);
await p.evaluate(() => { $('#onb').hidden = false; });
const qb = await p.evaluate(() => { const b = document.querySelector('[data-est-quita="1"]'); b.style.visibility = 'visible'; b.style.opacity = 1; const r = b.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
await p.evaluate(() => { $('#onb').hidden = true; });
await p.mouse.click(qb.x, qb.y); await p.waitForTimeout(500);
const si = await p.evaluate(() => { const b = document.querySelector('[data-sel-quita-ok]'); if (!b) return null; const r = b.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
console.log('ventana de quitar:', !!si);
if (si) { await p.mouse.move(si.x, si.y); await p.mouse.down(); await p.evaluate(() => pintarEditor()); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(1200); }
console.log('quitar slide:', nAntes, '->', await p.evaluate(id => EST.lista[id].slides.length, id), '(esperado ' + (nAntes - 1) + ') · ventana cerrada:', await p.evaluate(() => $('#onb').hidden));
console.log('err', err.filter(x => !/404|CERT/.test(x))); await b.close();
