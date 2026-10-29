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
// Catálogo de diseños (29/10/2026, Sandra: «quiero ver dónde falta diseñar más plantillas»): cada estilo × cada diseño, en una hoja.
// node pruebas/catalogo.mjs → $SALIDA/catalogo.png
const FOTO = 'fotos/foto-chica-biblioteca-portatil.jpg';
const T = '¿Te mareas con la *sangre*? Hay sitio para ti';
const COLS = [
  ['Portada', 'La del estilo', {tipo: 'portada', etiqueta: 'Sanidad', titulo: T, subtitulo: 'El rincón de la sanidad que nadie te cuenta', imagen: FOTO}],
  ['Portada', 'Sin foto', {tipo: 'portada', etiqueta: 'Sanidad', titulo: T, subtitulo: 'El rincón de la sanidad que nadie te cuenta'}],
  ['Portada', 'Foto entera', {tipo: 'portada', etiqueta: 'Sanidad', titulo: T, subtitulo: 'El rincón de la sanidad que nadie te cuenta', imagen: FOTO, marco: 'fondo'}],
  ['Portada', 'Escrito a mano', {tipo: 'portada', etiqueta: 'Sanidad', titulo: T, subtitulo: 'El rincón de la sanidad que nadie te cuenta', marco: 'notas'}],
  ['Cuerpo', 'Contenido', {tipo: 'contenido', etiqueta: 'Laboratorio', numero: '01', titulo: 'Analizas *muestras*, no pacientes', texto: 'Trabajas con tubos, microscopios y datos. La sangre la ves en un tubo, no en una herida.'}],
  ['Cuerpo', 'Contenido + foto', {tipo: 'contenido', etiqueta: 'Laboratorio', titulo: 'Analizas *muestras*, no pacientes', texto: 'Trabajas con tubos y datos.', imagen: FOTO}],
  ['Cuerpo', 'Lista', {tipo: 'lista', titulo: 'Tres salidas *sin* sangre', items: ['Laboratorio clínico', 'Documentación sanitaria', 'Imagen para el diagnóstico']}],
  ['Cuerpo', 'Pasos', {tipo: 'pasos', titulo: 'Cómo *empezar*', items: ['Elige el ciclo', 'Matricúlate online', 'Estudia a tu ritmo']}],
  ['Cuerpo', 'Dato', {tipo: 'dato', antetitulo: 'Técnicos de laboratorio que faltan en España', cifra: '8.000', texto: 'La demanda sube cada año.', fuente: 'SEQC 2025'}],
  ['Cuerpo', 'Momento', {tipo: 'momento', hora: '10:00', titulo: 'Tu primera *práctica*', texto: 'Desde casa, con tu tutor.', tarjeta: 'clase', tarjetaTitulo: 'Análisis clínicos', tarjetaTexto: 'Hoy a las 18:00', boton: 'Entrar'}],
  ['Oculto', 'Mito', {tipo: 'mito', etiqueta: 'Mito', mito: 'En sanidad siempre hay sangre', titulo: 'Hay puestos sin *pacientes*', texto: 'Laboratorio, documentación, imagen.'}],
  ['Oculto', 'Pregunta', {tipo: 'pregunta', etiqueta: 'Duda', pregunta: '¿Y si me mareo?', respuesta: 'Hay ciclos donde no ves ni una gota.'}],
  ['Oculto', 'Comparación', {tipo: 'comparacion', titulo: 'Con o sin *pacientes*', colA: 'Con', itemsA: ['Enfermería', 'Emergencias'], colB: 'Sin', itemsB: ['Laboratorio', 'Documentación']}],
  ['Oculto', 'Cita', {tipo: 'cita', etiqueta: 'Alumna', cita: 'Pensé que no era para mí. Ahora trabajo en un laboratorio.', autor: 'Laura, 27 años'}],
  ['Cierre', 'Cierre', {tipo: 'cierre', etiqueta: 'Tu turno', titulo: '¿Conoces a alguien que se *mareó*?', texto: 'Etiquétale y recalculamos su ruta.', cta: 'Pide información', cinta: 'Guárdalo para luego'}],
];
const ESTILOS = [['feed', 'Feed'], ['capas', 'Capas'], ['cuaderno', 'Cuaderno'], ['poster', 'Póster'], ['ruta', 'Ruta'], ['chat', 'Chat (oculto)'], ['tuit', 'Tuit (oculto)'], ['editorial', 'Editorial (oculto)'], ['bloques', 'Bloques (oculto)']];
// CAT=portadas | cierres → solo esas columnas, solo los estilos que se ofrecen y más grandes
const CAT = process.env.CAT || '';
if (CAT) { const g = CAT === 'portadas' ? 'Portada' : 'Cierre'; COLS.splice(0, COLS.length, ...COLS.filter(c => c[0] === g)); ESTILOS.splice(5); }
const W = CAT ? 230 : 150;
await p.evaluate(([COLS, ESTILOS, W]) => {
  const k = W / 1080;
  let h = '<style>body{margin:0;background:#fff;font:13px system-ui}table{border-collapse:collapse;margin:16px}th,td{padding:4px;vertical-align:top}th{font-size:12px;text-align:center}' +
    'th.g{font-size:13px;background:#eef6e9;border:1px solid #cfe3c6}th.o{background:#f3f3f3}td.e{font-weight:700;font-size:14px;white-space:nowrap;padding-right:10px;vertical-align:middle}' +
    '.c{width:' + W + 'px;height:' + Math.round(1350 * k) + 'px;overflow:hidden;position:relative;border:1px solid #ddd;border-radius:4px}.c iframe{width:1080px;height:1350px;border:0;transform:scale(' + k + ');transform-origin:0 0;position:absolute}' +
    '.x{display:flex;align-items:center;justify-content:center;height:100%;color:#c00;font-size:11px;text-align:center;padding:6px}</style><table><tr><th></th>';
  const grupos = []; COLS.forEach(c => { const g = grupos[grupos.length - 1]; if (g && g[0] === c[0]) g[1]++; else grupos.push([c[0], 1]); });
  h += grupos.map(g => '<th colspan="' + g[1] + '" class="g' + (g[0] === 'Oculto' ? ' o' : '') + '">' + (g[0] === 'Oculto' ? 'Cuerpo (existen, no se ofrecen)' : g[0]) + '</th>').join('') + '</tr><tr><th></th>' + COLS.map(c => '<th>' + c[1] + '</th>').join('') + '</tr>';
  window.__docs = [];
  ESTILOS.forEach(([id, nombre]) => {
    h += '<tr><td class="e">' + nombre + '</td>';
    COLS.forEach((c, i) => {
      const fake = {id: 'cat', plantilla: id, color: 'verde02', slides: [Object.assign({}, c[2])], cinta: ''};
      let d; try { d = MOTOR.html(id, 'verde02', Object.assign({}, c[2]), c[2].tipo === 'portada' ? 0 : c[2].tipo === 'cierre' ? 6 : 2, 7, ''); d = d.replace('<head>', '<head>' + EST_BASE); } catch (e) { d = null; window.__err = (window.__err || []).concat(id + '/' + c[1] + ': ' + e.message); }
      window.__docs.push(d);
      h += '<td><div class="c">' + (d ? '<iframe data-n="' + (window.__docs.length - 1) + '"></iframe>' : '<div class="x">no existe</div>') + '</div></td>';
    });
    h += '</tr>';
  });
  // una sola columna (cierres): mejor en una fila, un estilo al lado del otro
  if (COLS.length === 1) {
    h = h.slice(0, h.indexOf('<table>')) + '<table><tr>' + ESTILOS.map(e => '<th style="font-size:15px">' + e[1] + '</th>').join('') + '</tr><tr>' +
      window.__docs.map((d, n) => '<td><div class="c">' + (d ? '<iframe data-n="' + n + '"></iframe>' : '<div class="x">no existe</div>') + '</div></td>').join('') + '</tr>';
  }
  document.body.innerHTML = h + '</table>';
  document.body.className = '';
  document.querySelectorAll('iframe[data-n]').forEach(f => { f.srcdoc = window.__docs[+f.dataset.n]; });
}, [COLS, ESTILOS, W]);
await p.waitForTimeout(6000);
const tam = await p.evaluate(() => ({w: document.querySelector('table').scrollWidth + 32, h: document.querySelector('table').scrollHeight + 32}));
await p.setViewportSize({width: tam.w, height: tam.h}); await p.waitForTimeout(1500);
await p.screenshot({path: S + 'catalogo' + (CAT ? '-' + CAT : '') + '.png', fullPage: true});
console.log('fallos motor:', await p.evaluate(() => window.__err || []));
console.log('err', err.filter(x => !/404|CERT/.test(x))); await b.close();
