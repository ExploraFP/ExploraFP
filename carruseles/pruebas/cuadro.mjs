// Matriz: Lista · Cuadro (26/10/2026)
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
await p.evaluate(()=>cntIr('matriz')); await p.waitForTimeout(700);
console.log('pestañas:', await p.evaluate(()=>[...document.querySelectorAll('.mz-vista')].map(b=>b.innerText).join(' | ')));
console.log('fila 1:', await p.evaluate(()=>document.querySelector('.mz-tabla tr').innerText.replace(/\s+/g,' ').slice(0,160)));
await p.screenshot({path:process.env.SALIDA+'mz-lista.png'});
await p.click('[data-mz-modo="cuadro"]'); await p.waitForTimeout(500); await p.screenshot({path:process.env.SALIDA+'mz-cuadro.png', fullPage:true});
console.log('cuadro filas:', await p.evaluate(()=>document.querySelectorAll('.mz-cuadro tbody tr').length), 'huecos:', await p.evaluate(()=>document.querySelectorAll('.mz-cuadro td.hueco').length));
await p.click('.mz-cuadro tbody tr:nth-child(4) td:nth-child(4) button'); await p.waitForTimeout(500);
console.log('tras casilla:', JSON.stringify(await p.evaluate(()=>({modo:S.mzModo, tema:S.f.tema, etapa:S.f.etapa, filas:document.querySelectorAll('.mz-tabla tr').length, chips:[...document.querySelectorAll('.mz-filtrochip')].map(x=>x.innerText)}))));
await p.click('.mz-filtrochip >> nth=0'); await p.waitForTimeout(300); console.log('tras quitar 1:', await p.evaluate(()=>[S.f.tema,S.f.etapa].join('/')));
await p.click('[data-mz-modo="cuadro"]'); await p.waitForTimeout(300);
await p.selectOption('#mz-eje-c', 'rama'); await p.waitForTimeout(400); console.log('ejes:', await p.evaluate(()=>S.mzFil+' x '+S.mzCol), 'cols:', await p.evaluate(()=>[...document.querySelectorAll('.mz-cuadro thead th')].map(x=>x.innerText).join('/')));
await p.screenshot({path:process.env.SALIDA+'mz-cuadro-rama.png', fullPage:true});
await p.click('[data-mz-modo="lista"]'); await p.click('.c-idea .celda >> nth=1'); await p.waitForTimeout(500);
console.log('ficha:', await p.evaluate(()=>$('#dhead').innerText.replace(/\n/g,' | ')), '| objetivo en ficha:', await p.evaluate(()=>!!document.querySelector('.fx-objs')));
await p.setViewportSize({width:390,height:844}); await p.keyboard.press('Escape'); await p.click('[data-mz-modo="cuadro"]'); await p.waitForTimeout(400); await p.screenshot({path:process.env.SALIDA+'mz-cuadro-movil.png'});
console.log('err', err.filter(x=>!/404|CERT/.test(x))); await b.close();
