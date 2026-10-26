import { chromium } from "../node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
const S=process.env.SALIDA, D=process.env.COPIA+'carruseles/';
const ids=['Cmumthpao45k','Cmun394vgpn8','Cmun394vgw4v','Cmuphs6hld8w','Cmuphxbklxte','Cmupi2ccx4yq','Cmupiiq5vk3z','Cmupilrpwqaw','Cmv7xbhatig3','Cmvffc8p6dam','homologacion-en-tramite','oposiciones-con-fp','salir-de-la-hosteleria'];
const docs=ids.map(id=>{const j=JSON.parse(readFileSync(D+id+'.json','utf8'));return {id,data:j.data||j};});
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}}); const err=[]; p.on('pageerror',x=>err.push(x.message));
await p.addInitScript(([C])=>{ if(window.parent!==window) return; const cols={carruseles:JSON.parse(C)}; const snap=c=>({docs:(cols[c]||[]).map(d=>({id:d.id,data:()=>d.data}))}); const col=c=>({onSnapshot:f=>{setTimeout(()=>f(snap(c)),50);return()=>{}},orderBy:()=>col(c),where:()=>col(c),doc:()=>({set:async()=>{},update:async()=>{},delete:async()=>{}}),get:async()=>snap(c)});
 window.claude={use:async k=>k==='db'?{collection:col,doc:p=>col(p.split('/')[0]).doc(p.split('/')[1])}:null}; },[JSON.stringify(docs)]);
await p.goto('http://127.0.0.1:8765/banco-de-carruseles.html'); await p.waitForTimeout(1500);
await p.evaluate(()=>cntIr('carruseles')); await p.waitForTimeout(300);
// caso del fallo: se pinta Producción con el lienzo oculto (sin ancho) y luego se enseña
await p.evaluate(()=>{ $('#canvas').style.display='none'; S.v='producir'; render(); });
await p.waitForTimeout(300);
await p.evaluate(()=>{ $('#canvas').style.display=''; });
await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const fs=[...document.querySelectorAll('#canvas .est-mini iframe')]; return {n:fs.length, mal:fs.filter(f=>{const w=f.getBoundingClientRect().width, cw=f.parentElement.clientWidth; return Math.abs(w-cw)>2;}).length};});
console.log(JSON.stringify(r), 'errores', err.join('|')||'ninguno'); await p.screenshot({path:S+'minis.png'}); await b.close();
