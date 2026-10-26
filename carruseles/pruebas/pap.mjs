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
const S2=process.env.SALIDA;
const n=async m=>console.log(m, JSON.stringify(await p.evaluate(()=>({car:Object.keys(EST.lista).length, gu:Object.keys(GU.lista).length, pap:Object.keys(PAP.docs)}))));
await p.evaluate(()=>cntIr('carruseles')); await p.waitForTimeout(600); await n('inicio');
console.log('menu beta:', await p.evaluate(()=>document.querySelectorAll('#cnt-lado .cnt-beta').length));
// borrar un carrusel desde la papelera de la tarjeta
await p.evaluate(()=>{ const id=Object.values(EST.lista).find(c=>c.estado!=='hecho').id; window._idc=id; });
const idc = await p.evaluate(()=>window._idc);
await p.evaluate(id=>borrarC(id), idc); await p.waitForTimeout(400); await n('tras borrar carrusel');
await p.evaluate(()=>cntIr('guiones')); await p.waitForTimeout(500);
await p.evaluate(()=>guBorrar('guiones','Gprueba02')); await p.waitForTimeout(400); await n('tras borrar guion');
await p.click('#cnt-ajustes'); await p.waitForTimeout(300); console.log('ajustes:', await p.evaluate(()=>$('#cnt-ajustes-menu').innerText.replace(/\n/g,' | ')));
await p.click('#pap-abrir'); await p.waitForTimeout(400); await p.screenshot({path:S2+'pap.png'});
console.log('lista:', await p.evaluate(()=>$('#pap-lista').innerText.replace(/\n/g,' | ')));
await p.click('[data-pap-rec^="carruseles__"]'); await p.waitForTimeout(600); await n('tras recuperar carrusel');
console.log('carrusel vuelve con slides:', await p.evaluate(id=>(EST.lista[id]||{}).slides?.length, idc));
await p.click('[data-pap-ya^="guiones__"]'); await p.click('[data-pap-ya^="guiones__"]'); await p.waitForTimeout(400); await n('tras borrar ya');
await p.click('#onbCerrar'); await p.waitForTimeout(200);
// estático por la ventana
await p.evaluate(()=>{ES.tab='normal'; cntIr('estaticos');}); await p.waitForTimeout(400); await p.click('#es-nuevo'); await p.waitForTimeout(400);
await p.click('#es-borrar'); await p.waitForTimeout(200); console.log('aviso:', await p.evaluate(()=>$('#onb .cuerpo').innerText.replace(/\n/g,' ')));
await p.click('#es-borrar-ok'); await p.waitForTimeout(400); await n('tras borrar estático');
console.log('err', err.filter(x=>!/404|CERT/.test(x))); await b.close();
