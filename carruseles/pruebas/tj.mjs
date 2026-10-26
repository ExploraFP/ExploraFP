import { chromium } from "../node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const S=process.env.SALIDA+'dgs/';
const fondo = process.argv[2] || 'vascular';
const b=await chromium.launch(); const err=[]; const p=await b.newPage({viewport:{width:1440,height:950}}); p.on('pageerror',x=>err.push(x.message));
await p.route(/html-to-image/, r=>r.fulfill({contentType:'application/javascript',body:readFileSync(process.env.H2I,'utf8')}));
await p.route(/mp4-muxer/, r=>r.fulfill({contentType:'application/javascript',body:readFileSync(process.env.MUX,'utf8')}));
await p.exposeFunction('__guarda', (name, b64)=>{ writeFileSync(S+fondo+'-'+name.replace(/^.*_/, ''), Buffer.from(b64,'base64')); return true; });
await p.addInitScript(()=>{ if(window.parent!==window) return; const cols={}; const subs={};
 const snap=c=>({docs:Object.entries(cols[c]||{}).map(([id,d])=>({id,data:()=>d}))}); const avisa=c=>(subs[c]||[]).forEach(f=>setTimeout(()=>f(snap(c)),30));
 const col=c=>({onSnapshot:f=>{(subs[c]=subs[c]||[]).push(f);setTimeout(()=>f(snap(c)),50);return()=>{}},orderBy:()=>col(c),where:()=>col(c),get:async()=>snap(c),
   doc:id=>({set:async d=>{(cols[c]=cols[c]||{})[id]=JSON.parse(JSON.stringify(d));avisa(c)},update:async d=>{},delete:async()=>{}})});
 const down={save:async({filename,data})=>{const buf=await (data instanceof Blob?data:new Blob([data])).arrayBuffer(); let s=''; const u=new Uint8Array(buf); for(let i=0;i<u.length;i+=32768) s+=String.fromCharCode.apply(null,u.subarray(i,i+32768)); await window.__guarda(filename, btoa(s)); return {status:'saved'};}};
 window.claude={use:async k=>k==='db'?{collection:col,doc:p=>col(p.split('/')[0]).doc(p.split('/')[1])}:k==='downloads'?down:null}; });
await p.goto('http://127.0.0.1:8765/banco-de-carruseles.html'); await p.waitForTimeout(1500);
await p.evaluate(()=>cntIr('estaticos')); await p.waitForTimeout(300); await p.click('[data-es-tab="dinamico"]'); await p.click('#es-nuevo'); await p.waitForTimeout(400);
await p.click('[data-reg-form^="e:"]'); await p.click('#reg-fpop [data-reg-form-v="Doble Laboratorio + Anatomía"]'); await p.waitForTimeout(400);
if (fondo !== 'vascular') { await p.click('[data-es-set="fondo"][data-v="'+fondo+'"]'); await p.waitForTimeout(300); }
await p.fill('[data-es-campo="titulo"]','DOBLE GRADO'); await p.fill('[data-es-campo="beneficio"]', fondo==='vascular'?'Prácticas aseguradas en hospitales y laboratorios.':'Aprende a leer cada muestra.'); await p.waitForTimeout(1500);
console.log(fondo, 'ciclos:', JSON.stringify(await p.evaluate(()=>ES.lista[ES.abierto].ciclos)), 'fondo:', await p.evaluate(()=>ES.lista[ES.abierto].fondo));
await p.screenshot({path:S+fondo+'-editor.png'});
const t0=Date.now(); await p.click('#es-bajar'); await p.waitForFunction(()=>!ES.haciendo,null,{timeout:400000}); console.log('vídeo', Date.now()-t0, 'ms', await p.evaluate(()=>$('#toast').textContent));
await p.evaluate(()=>{const e=ES.lista[ES.abierto]; e.tipo='normal';}); await p.click('#es-bajar'); await p.waitForFunction(()=>!ES.haciendo,null,{timeout:60000});
console.log('errores', err.join('|')||'ninguno'); await b.close();
