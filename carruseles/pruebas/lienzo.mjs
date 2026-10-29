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
// Editor tipo Canva (29/10/2026): barra izquierda (Fotos · Slides · Elementos · Diseño), clic selecciona con tiradores,
// arrastrar mueve, esquina cambia el tamaño, doble clic escribe, «↺ Recolocar» lo deja como estaba.
const id = await p.evaluate(() => { cntIr('carruseles'); const c = Object.values(EST.lista).find(c => c.slides.length > 2 && c.plantilla === 'feed' && pasoDe(c) === 'borrador') || Object.values(EST.lista).find(c => c.slides.length > 2 && pasoDe(c) === 'borrador'); abrirEditor(c.id); return c.id; });
await p.waitForTimeout(2500);
console.log('rail:', await p.evaluate(() => [...document.querySelectorAll('.lz-rail button')].map(b => b.innerText.replace(/\s+/g, ' ').trim()).join(' | ')), '· diseño en panel derecho:', await p.evaluate(() => !!document.querySelector('#est-panel .sel-dis-panel')));
for (const t of ['plantilla', 'elementos', 'slides', 'fotos', 'revision', 'claude', 'caption']) { await p.click(`.lz-rail [data-lz-tab="${t}"]`); await p.waitForTimeout(500); console.log(t, '→', await p.evaluate(() => (document.querySelector('.lz-cajon') || {}).innerText.split('\n').slice(0, 3).join(' / '))); await p.screenshot({path: S + 'lienzo-' + t + '.png'}); }
// Elementos: post-it
await p.click('.lz-rail [data-lz-tab="elementos"]'); await p.waitForTimeout(400);
await p.click('[data-lz-el="postit"]'); await p.waitForTimeout(1200);
console.log('post-it en la slide:', await p.evaluate(id => JSON.stringify(EST.lista[id].slides[EST.sel].decoracion), id));
await p.click('[data-lz-el="postit"]'); await p.waitForTimeout(1200);
console.log('post-it quitado:', await p.evaluate(id => JSON.stringify(EST.lista[id].slides[EST.sel].decoracion || null), id));
// seleccionar el título
const pos = await p.evaluate(() => { const fr = document.querySelector('#est-editor .est-grande iframe'), d = fr.contentDocument, t = d.querySelector('.titulo, h1, h2'); const r = fr.getBoundingClientRect(), k = r.width / 1080, q = t.getBoundingClientRect(); return {x: r.left + (q.left + q.width / 2) * k, y: r.top + (q.top + q.height / 2) * k}; });
await p.mouse.click(pos.x, pos.y); await p.waitForTimeout(600);
console.log('tras clic → escribiendo?', await p.evaluate(() => !!SEL.inline), '· marco:', await p.evaluate(() => !!document.querySelector('.lz-caja')));
await p.screenshot({path: S + 'lienzo-sel.png'});
// arrastrar
await p.mouse.move(pos.x, pos.y); await p.mouse.down(); await p.mouse.move(pos.x + 40, pos.y + 60, {steps: 8}); await p.mouse.up(); await p.waitForTimeout(1500);
console.log('estilo tras mover:', await p.evaluate(id => EST.lista[id].slides[EST.sel].estilo, id), '· escribiendo?', await p.evaluate(() => !!SEL.inline));
// esquina
const h = await p.evaluate(() => { const r = document.querySelector('.lz-caja [data-lz-h="se"]').getBoundingClientRect(); return {x: r.left + 6, y: r.top + 6}; });
await p.mouse.move(h.x, h.y); await p.mouse.down(); await p.mouse.move(h.x + 60, h.y + 20, {steps: 8}); await p.mouse.up(); await p.waitForTimeout(1500);
console.log('estilo tras estirar:', await p.evaluate(id => EST.lista[id].slides[EST.sel].estilo, id));
await p.screenshot({path: S + 'lienzo-movido.png'});
// doble clic escribe
const pos2 = await p.evaluate(() => { const r = document.querySelector('.lz-caja').getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
await p.mouse.dblclick(pos2.x, pos2.y); await p.waitForTimeout(600);
console.log('doble clic → escribiendo?', await p.evaluate(() => !!SEL.inline));
await p.keyboard.press('Escape'); await p.waitForTimeout(500);
await p.mouse.click(pos2.x, pos2.y); await p.waitForTimeout(600);
await p.click('[data-lz-reset]'); await p.waitForTimeout(1500);
console.log('tras recolocar:', JSON.stringify(await p.evaluate(id => EST.lista[id].slides[EST.sel].estilo || null, id)));
await p.click('.lz-rail [data-lz-tab="plantilla"]'); await p.waitForTimeout(1200);
await p.screenshot({path: S + 'lienzo-plantilla.png'});
const ops = async () => p.evaluate(() => [...document.querySelectorAll('[data-lz-forma]')].map(b => b.innerText.trim() + (b.getAttribute('aria-pressed') === 'true' ? '✓' : '')).join(' · '));
console.log('portada puede ser:', await ops());
await p.evaluate(id => { EST.sel = EST.lista[id].slides.length - 1; pintarEditor(true); }, id); await p.waitForTimeout(800); console.log('cierre puede ser:', await ops());
await p.evaluate(() => { EST.sel = 1; pintarEditor(true); }); await p.waitForTimeout(1000); console.log('cuerpo puede ser:', await ops());
await p.click('[data-lz-forma="lista"]'); await p.waitForTimeout(1500);
console.log('forma → lista:', await p.evaluate(id => { const s = EST.lista[id].slides[EST.sel]; return s.tipo + ' · ' + JSON.stringify(s.items); }, id));
await p.screenshot({path: S + 'lienzo-forma.png'});
await p.keyboard.press('Control+z'); await p.waitForTimeout(1500);
console.log('deshecho:', await p.evaluate(id => EST.lista[id].slides[EST.sel].tipo, id));
const otro = await p.evaluate(id => EST_COLORES_ELEGIBLES.find(x => x.id !== EST.lista[id].color).id, id);
await p.click('[data-lz-co="' + otro + '"]'); await p.waitForTimeout(1200);
console.log('color solo en esta slide:', await p.evaluate(id => EST.lista[id].slides.map(s => s.color || '-').join(',') + ' · carrusel ' + EST.lista[id].color, id));
await p.click('.lz-rail [data-lz-tab="slides"]'); await p.waitForTimeout(500);
console.log('slides ofrece:', await p.evaluate(() => [...document.querySelectorAll('.lz-cajon [data-est-nueva] b')].map(b => b.textContent).join(' · ')));
const n0 = await p.evaluate(id => EST.lista[id].slides.length, id);
await p.click('.lz-cajon [data-est-nueva="pasos"]'); await p.waitForTimeout(1200);
console.log('pasos añadida en', await p.evaluate(id => (EST.sel + 1) + ' de ' + EST.lista[id].slides.length + ' · última: ' + EST.lista[id].slides.at(-1).tipo, id), '(antes', n0, ')');
await p.click('#est-mas'); await p.waitForTimeout(500); console.log('+ Añadir abre:', await p.evaluate(() => LZ.tab + ' · menú viejo: ' + !!document.querySelector('.est-mas-menu')));
console.log('rail:', await p.evaluate(() => [...document.querySelectorAll('.lz-rail > *')].map(b => b.tagName === 'HR' ? '|' : b.innerText.replace(/\s+/g, ' ').trim()).join(' ')));
console.log('panel derecho:', await p.evaluate(() => { const pn = document.querySelector('#est-panel'); return pn.hidden ? 'oculto' : pn.closest('.lz-cajon') ? 'en el cajón' : 'FUERA'; }), '· aviso revisión:', await p.evaluate(() => (document.querySelector('[data-lz-tab="revision"] .lz-num') || {}).textContent || 'ninguno'));
console.log('err', err.filter(x => !/404|CERT/.test(x))); await b.close();
