import { chromium } from "../node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
const S=process.env.SALIDA, D=process.env.COPIA+'carruseles/';
const ids=['Cmumthpao45k','Cmun394vgpn8','Cmun394vgw4v','Cmuphs6hld8w','Cmupiiq5vk3z','homologacion-en-tramite'];
const docs={carruseles:Object.fromEntries(ids.map(id=>{const j=JSON.parse(readFileSync(D+id+'.json','utf8'));return [id,j.data||j];}))};
const b=await chromium.launch(); const err=[]; const p=await b.newPage({viewport:{width:1440,height:950}}); p.on('pageerror',x=>err.push(x.message));
await p.addInitScript(([C])=>{ if(window.parent!==window) return; const cols=JSON.parse(C); const subs={};
 const snap=c=>({docs:Object.entries(cols[c]||{}).map(([id,d])=>({id,data:()=>d}))}); const avisa=c=>(subs[c]||[]).forEach(f=>setTimeout(()=>f(snap(c)),30));
 const col=c=>({onSnapshot:f=>{(subs[c]=subs[c]||[]).push(f);setTimeout(()=>f(snap(c)),50);return()=>{}},orderBy:()=>col(c),where:()=>col(c),get:async()=>snap(c),
   doc:id=>({set:async d=>{(cols[c]=cols[c]||{})[id]=JSON.parse(JSON.stringify(d));avisa(c)},update:async d=>{Object.assign((cols[c]=cols[c]||{})[id]||{},d);avisa(c)},delete:async()=>{delete (cols[c]||{})[id];avisa(c)}})});
 window.claude={use:async k=>k==='db'?{collection:col,doc:p=>col(p.split('/')[0]).doc(p.split('/')[1])}:null}; },[JSON.stringify(docs)]);
await p.goto('http://127.0.0.1:8765/banco-de-carruseles.html'); await p.waitForTimeout(1500);
// estático: crear, poner formación, idea, pasar a subido
await p.evaluate(()=>cntIr('estaticos')); await p.waitForTimeout(300); await p.click('#es-nuevo'); await p.waitForTimeout(400);
await p.click('[data-reg-form^="e:"]'); await p.waitForTimeout(200); await p.click('#reg-fpop [data-reg-form-v="DAM"]'); await p.waitForTimeout(300);
await p.click('[data-reg-idea^="e:"]'); await p.fill('#reg-iq','homolog'); await p.waitForTimeout(200); await p.click('#reg-ilista [data-reg-idea-v] >> nth=0'); await p.waitForTimeout(300);
await p.screenshot({path:S+'reg-estatico.png'});
await p.click('.gu-eder [data-es-paso="listo"]'); await p.waitForTimeout(200); await p.click('.gu-eder [data-es-paso="subido"]'); await p.waitForTimeout(300);
console.log('etapa:', await p.evaluate(()=>Object.values(ES.lista)[0].etapa), '| nombre archivo:', await p.evaluate(()=>{const e=Object.values(ES.lista)[0]; return regNombre(e, esCod(e));}));
// carrusel: ficha en el editor
await p.evaluate(()=>cntIr('carruseles')); await p.waitForTimeout(300); await p.evaluate(()=>{S.v='producir';render();abrirEditor('Cmun394vgpn8')}); await p.waitForTimeout(1500);
console.log('ficha carrusel:', await p.evaluate(()=>{const f=document.querySelector('#est-panel .reg-ficha'); return f? f.innerText.replace(/\s+/g,' '):'NO';}), '| nombre:', await p.evaluate(()=>nombreBase(EST.lista['Cmun394vgpn8'])));
await p.screenshot({path:S+'reg-carrusel.png'});
// guion
await p.evaluate(()=>cerrarEditor()); await p.click('#cnt-lado [data-cnt="guiones"]'); await p.waitForTimeout(300); await p.click('#gu-nuevo'); await p.waitForTimeout(300);
console.log('ficha guion:', await p.evaluate(()=>!!document.querySelector('#cnt-guiones .reg-ficha')));
// directorio
await p.click('#cnt-lado [data-cnt="directorio"]'); await p.waitForTimeout(1200);
console.log('directorio:', await p.evaluate(()=>[...document.querySelectorAll('.reg-tarjeta')].map(t=>t.innerText.replace(/\s+/g,' ').slice(0,80)).join(' || ')));
await p.screenshot({path:S+'reg-dir.png'});
await p.click('.reg-ffiltro'); await p.click('#reg-fpop [data-reg-form-v="Tecnología"]'); await p.waitForTimeout(300);
console.log('filtro Tecnología:', await p.evaluate(()=>document.querySelectorAll('.reg-tarjeta').length));
await p.click('.reg-ffiltro'); await p.click('#reg-fpop [data-reg-form-v=""]'); await p.waitForTimeout(300);
await p.click('#reg-nueva'); await p.fill('#reg-x-titulo','Banner Canva DAW'); await p.click('[data-reg-ext-ok]'); await p.waitForTimeout(500);
console.log('externa abierta para completar:', await p.evaluate(()=>!!document.querySelector('.reg-extmodal .reg-ficha'))); await p.click('#onbCerrar'); await p.waitForTimeout(300);
await p.screenshot({path:S+'reg-barra.png',clip:{x:100,y:70,width:1220,height:70}}); await p.click('.reg-tarjeta >> nth=0'); await p.waitForTimeout(800);
console.log('ficha:', await p.evaluate(()=>document.querySelector('.reg-verficha .reg-vdatos').innerText.replace(/\s+/g,' ')));
console.log('errores', err.join(' | ')||'ninguno'); await b.close();
