import { chromium } from "../node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
const S=process.env.SALIDA, D=process.env.COPIA+'carruseles/';
const ids=['Cmumthpao45k','Cmun394vgpn8','Cmun394vgw4v','Cmuphs6hld8w','Cmuphxbklxte','Cmupi2ccx4yq','Cmupiiq5vk3z','Cmupilrpwqaw','Cmv7xbhatig3','Cmvffc8p6dam','homologacion-en-tramite','oposiciones-con-fp','salir-de-la-hosteleria'];
const docs=ids.map(id=>{const j=JSON.parse(readFileSync(D+id+'.json','utf8'));return {id,data:j.data||j};});
docs.push({id:'Cpend',data:{num:30,titulo:'Uno sin generar',estado:'pendiente',slides:[],plantilla:'feed',color:'verde01',portada:'sinfoto'}});
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}}); const err=[]; p.on('pageerror',x=>err.push(x.message));
await p.addInitScript(([C])=>{ if(window.parent!==window) return; const cols={carruseles:JSON.parse(C)}; const snap=c=>({docs:(cols[c]||[]).map(d=>({id:d.id,data:()=>d.data}))}); const col=c=>({onSnapshot:f=>{setTimeout(()=>f(snap(c)),50);return()=>{}},orderBy:()=>col(c),where:()=>col(c),doc:()=>({set:async()=>{},update:async()=>{},delete:async()=>{}}),get:async()=>snap(c)});
 window.claude={use:async k=>k==='db'?{collection:col,doc:p=>col(p.split('/')[0]).doc(p.split('/')[1])}:null}; },[JSON.stringify(docs)]);
await p.goto('http://127.0.0.1:8765/banco-de-carruseles.html'); await p.waitForTimeout(1500);
await p.evaluate(()=>cntIr('carruseles')); await p.waitForTimeout(300);
await p.evaluate(()=>{S.v='producir'; PR_FILTRO='todos'; render();}); await p.waitForTimeout(800);
console.log('filtros:', await p.evaluate(()=>[...document.querySelectorAll('.pr-filtros .mz-vista')].map(x=>x.textContent.trim()).join(' | ')));
console.log('secciones:', await p.evaluate(()=>[...document.querySelectorAll('.pr-sec h3')].map(x=>x.textContent.trim()).join(' | ')));
console.log('pills:', await p.evaluate(()=>[...new Set([...document.querySelectorAll('.pr-tarjeta .pr-etapa')].map(x=>x.textContent))].join(',')));
console.log('draggable:', await p.evaluate(()=>document.querySelectorAll('[draggable="true"]').length));
await p.screenshot({path:S+'tres-prod.png'});
// borrador -> abrir
await p.evaluate(()=>abrirEditor('Cmuphxbklxte')); await p.waitForTimeout(1500);
const bar=async t=>console.log(t, await p.evaluate(()=>[...document.querySelectorAll('.est-ecab button, .est-ecab a, .est-ecab .eb-pasos span')].map(b=>(b.className.includes('actual')?'['+b.textContent.trim()+']':b.textContent.trim())).filter(Boolean).join(' | ')), '| solo-ver:', await p.evaluate(()=>document.querySelector('#est-editor').classList.contains('solo-ver')));
await bar('BORRADOR:'); await p.screenshot({path:S+'tres-borr.png'});
await p.evaluate(()=>{const c=EST.lista.Cmuphxbklxte; c._qc=c._qc; }); 
await p.click('#pr-ok'); await p.waitForTimeout(400); await p.click('#eb-ok-si'); await p.waitForTimeout(1500); if (await p.evaluate(()=>etapaDe(EST.lista.Cmuphxbklxte))!=='listo') { await p.click('#pr-ok'); await p.waitForTimeout(400); await p.click('#eb-ok-si'); await p.waitForTimeout(1200); }
await bar('TRAS PASAR:'); console.log('etapa', await p.evaluate(()=>etapaDe(EST.lista.Cmuphxbklxte)), 'toast', await p.evaluate(()=>($('#toast')||{}).textContent));
await p.screenshot({path:S+'tres-listo.png'});
// editar en Para publicar
await p.evaluate(()=>{const c=EST.lista.Cmuphxbklxte; c.copy=(c.copy||'')+' x'; guardarC(c);});
await p.click('.eb-volver'); await p.waitForTimeout(600); await bar('VUELTA:');
await p.click('#pr-ok'); await p.waitForTimeout(400); await p.click('#eb-ok-si'); await p.waitForTimeout(1500); if (await p.evaluate(()=>etapaDe(EST.lista.Cmuphxbklxte))!=='listo') { await p.click('#pr-ok'); await p.waitForTimeout(400); await p.click('#eb-ok-si'); await p.waitForTimeout(1200); }
await p.evaluate(()=>{const c=EST.lista.Cmuphxbklxte; c.copy=(c.copy||'')+' y'; guardarC(c);});
await p.evaluate(()=>cerrarEditor()); await p.waitForTimeout(500);
console.log('chip editado:', await p.evaluate(()=>document.querySelectorAll('.pr-editado').length));
// publicado
await p.evaluate(()=>abrirEditor('Cmun394vgw4v')); await p.waitForTimeout(1500); await bar('PUBLICADO:'); await p.screenshot({path:S+'tres-pub.png'});
await p.click('.eb-volver'); await p.waitForTimeout(800); await bar('PUB->LISTO:');
await p.click('#est-editor [data-pr-publicar]'); await p.waitForTimeout(500); console.log('dialogo publicar:', await p.evaluate(()=>!!document.querySelector('.pr-publicar')));
console.log('errores', err.join('|')||'ninguno'); await b.close();
