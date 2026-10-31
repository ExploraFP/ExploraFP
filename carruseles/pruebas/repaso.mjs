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
// Repaso uno a uno con Sandra (29/10/2026): cada diseño DISTINTO de un papel, numerado y con un nombre que dice lo que se ve.
// REPASO=portadas|cierres node pruebas/repaso.mjs → $SALIDA/repaso-<papel>.png
const FOTO = 'fotos/foto-chica-biblioteca-portatil.jpg';
const T = '¿Te mareas con la *sangre*? Hay sitio para ti', SUB = 'El rincón de la sanidad que nadie te cuenta';
const P = {tipo: 'portada', etiqueta: 'Sanidad', titulo: T, subtitulo: SUB};
const CI = {tipo: 'cierre', etiqueta: 'Tu turno', titulo: '¿Conoces a alguien que se *mareó*?', texto: 'Etiquétale y recalculamos su ruta.', cta: 'Pide información', cinta: 'Guárdalo para luego'};
const REPASOS = {
  portadas: [
    ['Titular sobre verde', 'feed', P],
    ['Caja oscura sobre foto', 'capas', Object.assign({imagen: FOTO}, P)],
    ['Foto inclinada', 'poster', Object.assign({imagen: FOTO}, P)],
    ['Foto entera', 'feed', Object.assign({imagen: FOTO, marco: 'fondo'}, P)],
    ['Notas a mano de fondo', 'feed', Object.assign({marco: 'notas'}, P)],
    ['Papel claro', 'ruta', P],
    ['Collage', 'feed', Object.assign({imagen: 'fotos/foto-chico-saluda-portatil.jpg', marco: 'collage'}, P, {titulo: 'La FP no es el *plan B*'})]],
  capas: [
    ['Actual: caja girada, foto recta', 'capas', Object.assign({imagen: FOTO}, P, {estilo: ''})],
    ['A · las dos giradas', 'capas', Object.assign({imagen: FOTO}, P, {estilo: '.papel-portada.foto-papel { transform: rotate(4deg) }'})],
    ['B · las dos rectas', 'capas', Object.assign({imagen: FOTO}, P, {estilo: '.papel-portada.foto-papel { transform: none } .caja-portada { transform: none }'})],
    ['C · caja recta, foto girada', 'capas', Object.assign({imagen: FOTO}, P, {estilo: '.caja-portada { transform: none } .papel-portada.foto-papel { transform: rotate(4deg) }'})],
    ['D · giradas al revés', 'capas', Object.assign({imagen: FOTO}, P, {estilo: '.caja-portada { transform: rotate(1.8deg); transform-origin: right bottom } .papel-portada.foto-papel { transform: rotate(-4deg) }'})],
    ['E · foto grande a sangre arriba', 'capas', Object.assign({imagen: FOTO}, P, {estilo: '.papel-portada.foto-papel { top: 0; right: 0; width: 820px; height: 720px; transform: none; box-shadow: none }'})],
    ['F · foto girada con celo', 'capas', Object.assign({imagen: FOTO}, P, {estilo: '.papel-portada.foto-papel { transform: rotate(4deg); overflow: visible } .papel-portada.foto-papel::after { content: ""; position: absolute; top: -26px; left: 50%; width: 190px; height: 54px; margin-left: -95px; background: rgba(245,240,220,.78); transform: rotate(-6deg); box-shadow: 0 2px 6px rgba(0,0,0,.15) }'})]],
  guardados: [
    ['Portada', 'guardados', {tipo: 'portada', etiqueta: 'Tecnología', titulo: '5 grados superiores con 100% de *empleabilidad*'}],
    ['Cuerpo 01', 'guardados', {tipo: 'contenido', numero: '01', titulo: 'Ciberseguridad', texto: 'Las empresas buscan perfiles que protejan sus datos. Y faltan.'}],
    ['Cuerpo 02', 'guardados', {tipo: 'contenido', numero: '02', titulo: 'Desarrollo web', texto: 'Webs y apps: la demanda no para de crecer.'}],
    ['Lista', 'guardados', {tipo: 'lista', titulo: 'Qué necesitas', items: ['Bachillerato o prueba de acceso', 'Ganas de trastear', 'Un portátil']}],
    ['Dato', 'guardados', {tipo: 'dato', antetitulo: 'Empleo a los 6 meses', cifra: '100%', texto: 'De los titulados en el último curso.'}],
    ['Cierre', 'guardados', {tipo: 'cierre', titulo: 'Guárdalo para cuando lo necesites', texto: 'Y pásaselo a quien lo esté pensando.'}]],
  linea: [
    ['1 + línea', 'feed', Object.assign({linea: true}, P)],
    ['5 + línea', 'feed', Object.assign({linea: true, marco: 'notas'}, P)],
    ['6 + línea', 'ruta', Object.assign({linea: true}, P)],
    ['1 + línea (otro titular)', 'feed', Object.assign({linea: true}, P, {titulo: 'Esta es la *parte mala* de estudiar online.'})],
    ['5 + línea (otro titular)', 'feed', Object.assign({linea: true, marco: 'notas'}, P, {titulo: 'Esta es la *parte mala* de estudiar online.'})],
    ['6 + línea (otro titular)', 'ruta', Object.assign({linea: true}, P, {titulo: 'Esta es la *parte mala* de estudiar online.'})]],
  sobre: [
    ['1 + persona recortada', 'feed', Object.assign({imagen: 'fotos/foto-chico-saluda-portatil.jpg', persona: true}, P)],
    ['1 + persona + post-it', 'feed', Object.assign({imagen: 'fotos/foto-chica-cascos-portatil.jpg', persona: true, decoracion: 'postit'}, P)],
    ['5 + persona recortada', 'feed', Object.assign({imagen: 'fotos/foto-chica-escritorio-sonrie.jpg', persona: true, marco: 'notas'}, P)],
    ['6 + persona recortada', 'ruta', Object.assign({imagen: 'fotos/foto-chica-biblioteca-portatil.jpg', persona: true}, P)],
    ['6 + persona (otra foto)', 'ruta', Object.assign({imagen: 'fotos/foto-chica-agobiada-examen.jpg', persona: true}, P)]],
  propuestas: [
    ['1 ahora', 'feed', P],
    ['1 + redondel + post-it', 'feed', Object.assign({trazo: 'ovalo', decoracion: 'postit'}, P)],
    ['1 + subrayado a boli + post-it', 'feed', Object.assign({trazo: 'subrayado', decoracion: 'postit'}, P)],
    ['3 ahora', 'poster', Object.assign({imagen: FOTO}, P)],
    ['3 + subrayado a boli', 'poster', Object.assign({imagen: FOTO, trazo: 'subrayado'}, P)],
    ['3 + subrayado + post-it en la foto', 'poster', Object.assign({imagen: FOTO, trazo: 'subrayado', decoracion: 'postit'}, P)]],
  cierres: [
    ['Botón con flecha', 'feed', CI],
    ['Banda abajo', 'ruta', CI],
    ['Foto entera (nuevo)', 'feed', Object.assign({imagen: FOTO, marco: 'foto'}, CI)],
    ['Notas a mano (nuevo)', 'feed', Object.assign({marco: 'notas'}, CI)],
    ['Papel claro (nuevo)', 'feed', Object.assign({marco: 'papel'}, CI)],
    ['Post-it (nuevo)', 'feed', Object.assign({marco: 'postit'}, CI)],
    ['Collage (nuevo)', 'feed', Object.assign({imagen: 'fotos/foto-chica-riendo-exterior.jpg', marco: 'collage'}, CI)]]};
const R = process.env.REPASO || 'portadas', L = REPASOS[R];
await p.evaluate(([L, W]) => {
  const k = W / 1080;
  let h = '<style>body{margin:0;background:#fff;font:16px system-ui;color:#1B3620}.g{display:grid;grid-template-columns:repeat(3,' + W + 'px);gap:26px 20px;padding:22px}' +
    '.n{font-size:17px;margin:0 0 8px}.n b{display:inline-block;background:#1B3620;color:#D8FF6E;border-radius:999px;width:28px;height:28px;text-align:center;line-height:28px;margin-right:8px}' +
    '.c{width:' + W + 'px;height:' + Math.round(1350 * k) + 'px;overflow:hidden;position:relative;border:1px solid #ddd;border-radius:6px}.c iframe{width:1080px;height:1350px;border:0;transform:scale(' + k + ');transform-origin:0 0;position:absolute}</style><div class="g">';
  window.__d = L.map(([n, pl, s], i) => MOTOR.html(pl, 'verde02', Object.assign({}, s), s.tipo === 'cierre' ? 6 : 0, 7, '').replace('<head>', '<head>' + EST_BASE));
  h += L.map(([n], i) => '<div><p class="n"><b>' + (i + 1) + '</b>' + n + '</p><div class="c"><iframe data-n="' + i + '"></iframe></div></div>').join('') + '</div>';
  document.body.innerHTML = h; document.body.className = '';
  document.querySelectorAll('iframe[data-n]').forEach(f => f.srcdoc = window.__d[+f.dataset.n]);
}, [L, +(process.env.ANCHO || 300)]);
await p.waitForTimeout(4000);
const t = await p.evaluate(() => ({w: document.querySelector('.g').scrollWidth, h: document.querySelector('.g').scrollHeight}));
await p.setViewportSize({width: t.w, height: t.h}); await p.waitForTimeout(800);
await p.screenshot({path: S + 'repaso-' + R + '.png', fullPage: true});
console.log('err', err.filter(x => !/404|CERT/.test(x))); await b.close();
