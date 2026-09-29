/* ===================== ESTUDIO: producir carruseles en masa =====================
   Se añade al banco de carruseles. Flujo:
   1) En Ideas, «Producir» manda una idea (o todas las filtradas) a la mesa de producción.
   2) En Producir, «Generar» le pide a Claude las slides siguiendo las reglas de marca.
   3) Se revisa y edita en el editor, se descargan los PNG y se marca hecho.
   El diseño lo pinta el mismo motor que usa el generador de PNG del repositorio
   (MOTOR_JS, MOTOR_CSS y FOTOS los incrusta el constructor). */

let PARECIDOS_PARA_PROMPT = null;
/* carruseles de muestra (no se guardan): enseñan cómo quedará una plantilla antes de generar */
const PREVIAS = {};
const EST = {
  plantilla: 'feed', color: 'verde01',
  lista: {},            // id → carrusel
  abierto: null, sel: 0,
  sample: null, conectado: false, cola: false
};
try { const g = JSON.parse(localStorage.getItem('explora.estilo') || 'null'); if (g) { EST.plantilla = g.plantilla || EST.plantilla; EST.color = g.color || EST.color; if (typeof g.conFoto === 'boolean') EST.conFoto = g.conFoto; } } catch (e) {}
if (EST.color === 'verde') EST.color = 'verde01';
if (typeof EST.conFoto !== 'boolean') EST.conFoto = true;

const EST_PLANTILLAS = [
  {id: 'feed', nombre: 'Feed', pista: 'la de vuestro Instagram'},
  {id: 'capas', nombre: 'Capas', pista: 'caja sobre foto'},
  {id: 'cuaderno', nombre: 'Cuaderno', pista: 'libreta y checklist'},
  {id: 'poster', nombre: 'Póster', pista: 'titular gigante'}];
const EST_COLORES = [
  {id: 'verde01', nombre: 'Verde 01', hex: '#366B40'}, {id: 'verde02', nombre: 'Verde 02', hex: '#4CCD4B'},
  {id: 'blanco', nombre: 'Blanco', hex: '#FAFFFA'}, {id: 'noche', nombre: 'Noche', hex: '#1B3620'},
  {id: 'lima', nombre: 'Lima', hex: '#EDFEC3'}, {id: 'verde', nombre: 'Verde', hex: '#85E159'}];
/* «Verde» (#85E159) sale de la web, no de la paleta de marca: sigue en el motor (no se borra nada) pero no se ofrece al elegir. */
const EST_COLORES_ELEGIBLES = EST_COLORES.filter(c => c.id !== 'verde');
const EST_TIPOS = {portada: 'Portada', contenido: 'Contenido', lista: 'Lista', dato: 'Dato', cierre: 'Cierre'};
const EST_ESTADO = {pendiente: 'Sin generar', generando: 'Generando…', borrador: 'Para revisar', hecho: 'Hecho', error: 'Error'};
/* Cabecera común de cada pestaña: título, una línea y las cifras que importan (stats: [[número, etiqueta, clase]]). */
function cabecera(titulo, desc, stats) {
  return '<div class="vhead vcab"><div class="vtxt"><h2>' + esc(titulo) + '</h2>' + (desc ? '<p>' + desc + '</p>' : '') + '</div>' +
    (stats && stats.length ? '<div class="vstats">' + stats.map(x => '<div class="vstat' + (x[2] ? ' ' + x[2] : '') + '"><b>' + x[0] + '</b><span>' + esc(x[1]) + '</span></div>').join('') + '</div>' : '') + '</div>';
}
const nombrePl = id => (EST_PLANTILLAS.find(p => p.id === id) || {}).nombre || id;
const nombreCo = id => (EST_COLORES.find(c => c.id === id) || {}).nombre || id;

/* ---------- motor de diseño (el mismo que el del repositorio) ---------- */
const recursosMotor = css => ({
  logo: c => 'logos/' + c.toLowerCase().replace(/\s+/g, '-') + '.webp',
  imagen: r => r,
  postit: () => 'trazos/postit.png',
  cabeza: pl => { const k = css(); return '<style>' + k.base + k[pl] + k.colores + k.mascaras + '</style>'; }
});
/* En pantalla, fuentes y trazos se cargan como archivos. Al exportar a PNG van incrustados:
   la librería que hace la foto no sigue fuentes ni máscaras enlazadas. */
const MOTOR = crearMotor(recursosMotor(() => MOTOR_CSS));
let CSS_EXP = null;
const MOTOR_EXP = crearMotor(recursosMotor(() => CSS_EXP || MOTOR_CSS));
async function prepararExportacion() {
  if (CSS_EXP) return;
  const aData = async r => { const b = await (await fetch(new URL(r, EST_BASE_URL).href)).blob();
    return await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); }); };
  const rutas = new Set();
  Object.values(MOTOR_CSS).forEach(css => css.replace(/url\("((?:fuentes|trazos)\/[^"]+)"\)/g, (m, r) => rutas.add(r)));
  const datos = {};
  for (const r of rutas) datos[r] = await aData(r);
  CSS_EXP = {};
  Object.keys(MOTOR_CSS).forEach(k => { CSS_EXP[k] = MOTOR_CSS[k].replace(/url\("((?:fuentes|trazos)\/[^"]+)"\)/g, (m, r) => 'url("' + datos[r] + '")'); });
}
/* ajustes que el generador hace tras pintar: la cifra gigante encoge hasta caber */
const EST_AJUSTE = '<script>document.fonts.ready.then(function(){var c=document.querySelector(".cifra");' +
  'if(c){var a=function(){var r=document.createRange();r.selectNodeContents(c);return r.getBoundingClientRect().width};' +
  'var t=parseFloat(getComputedStyle(c).fontSize);while(a()>c.clientWidth&&t>80){t-=6;c.style.fontSize=t+"px"}}' +
  'var sb=0,fs=document.querySelector(".foto-sangre");' +
  'if(fs){var bf=document.querySelector(".bloque-foto").getBoundingClientRect();sb=Math.max(bf.bottom-1310,200-bf.top,0)}' +
  'else{var bl=[].slice.call(document.querySelectorAll(".contenido > :not(.papel):not(.flecha):not(img):not(i):not(.velo), .caja, .bloque"));' +
  'bl=bl.filter(function(b){return b.offsetParent!==null});' +
  'if(bl.length){var fo=Math.max.apply(0,bl.map(function(b){return b.getBoundingClientRect().bottom})),ar=Math.min.apply(0,bl.map(function(b){return b.getBoundingClientRect().top}));' +
  'sb=Math.max(fo-1320,30-ar,0)}' +
  '[].forEach.call(document.querySelectorAll(".contenido *"),function(e){if(e.scrollWidth>e.clientWidth+4&&getComputedStyle(e).overflow!=="visible")sb=Math.max(sb,1)})}' +
  'document.body.setAttribute("data-sobra",Math.round(sb));' +
  'document.body.setAttribute("data-listo","1")})<\/script>';
const EST_BASE_URL = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
const EST_BASE = '<base href="' + EST_BASE_URL + '">';
function docSlide(c, i, exportar) {
  const s = Object.assign({}, c.slides[i]);
  let h;
  try { h = (exportar ? MOTOR_EXP : MOTOR).html(s.plantilla || c.plantilla, s.color || c.color, s, i, c.slides.length, c.cinta || ''); }
  catch (e) { return '<body style="font:28px sans-serif;padding:60px;color:#C0231E">No se puede pintar esta slide: ' + esc(e.message) + '</body>'; }
  return h.replace('<head>', '<head>' + EST_BASE).replace('</body>', EST_AJUSTE + '</body>');
}
function mini(c, i, extra) {
  const tieneSlide = c && c.slides && c.slides[i];
  return (extra && extra.boton ? '<button type="button" class="est-mini" ' + extra.boton + '>' : '<div class="est-mini">') +
    (tieneSlide ? '<iframe loading="lazy" data-c="' + esc(c.id) + '" data-i="' + i + '" title="Slide ' + (i + 1) + '" tabindex="-1"></iframe>'
                : '<span class="est-vacia">' + esc(extra && extra.vacio || 'Sin generar todavía') + '</span>') +
    (extra && extra.boton ? '</button>' : '</div>');
}
/* rellena los iframes pendientes y los escala al ancho de su caja */
function pintarMinis(raiz) {
  (raiz || document).querySelectorAll('.est-mini iframe').forEach(f => {
    const c = EST.lista[f.dataset.c] || PREVIAS[f.dataset.c]; if (!c) return;
    const doc = docSlide(c, +f.dataset.i);
    if (f._doc !== doc) { f.srcdoc = doc; f._doc = doc; }
    const w = f.parentElement.clientWidth; if (w) f.style.transform = 'scale(' + (w / 1080) + ')';
  });
}
window.addEventListener('resize', () => pintarMinis());

/* ---------- datos: base compartida (db) o este navegador ---------- */
let EST_DB = null;
async function conectarEstudio() {
  try { if (typeof claude !== 'undefined' && claude.use) EST_DB = await claude.use('db'); } catch (e) { EST_DB = null; }
  try { if (typeof claude !== 'undefined' && claude.use) EST.sample = await claude.use('sample'); } catch (e) { EST.sample = null; }
  if (!EST_DB) {
    try { EST.lista = JSON.parse(localStorage.getItem('explora.carruseles') || '{}'); } catch (e) {}
    EST.conectado = true; refrescarEstudio(); return;
  }
  EST_DB.collection('carruseles').onSnapshot(snap => {
    const m = {};
    snap.docs.forEach(d => { const v = d.data(); if (v) m[d.id] = Object.assign({id: d.id}, v); });
    // lo que se está generando en esta vista manda sobre lo que llega
    Object.keys(EST.lista).forEach(id => { if (EST.lista[id].estado === 'generando' && m[id]) m[id].estado = 'generando'; });
    EST.lista = m; EST.conectado = true; refrescarEstudio();
  }, () => { EST.conectado = true; refrescarEstudio(); });
  refrescarEstudio();
}
function guardarC(c) {
  c.upd = new Date().toISOString();
  EST.lista[c.id] = c;
  const limpio = JSON.parse(JSON.stringify(c)); delete limpio.id;
  if (EST_DB) EST_DB.doc('carruseles/' + c.id).set(limpio).catch(e => toast('No he podido guardar (' + (e && e.code || 'error') + ')'));
  else { try { localStorage.setItem('explora.carruseles', JSON.stringify(EST.lista)); } catch (e) {} }
}
function borrarC(id) {
  delete EST.lista[id];
  if (EST_DB) EST_DB.doc('carruseles/' + id).delete().catch(() => {});
  else { try { localStorage.setItem('explora.carruseles', JSON.stringify(EST.lista)); } catch (e) {} }
}
function nuevoC(datos) {
  const id = 'C' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const c = Object.assign({id: id, plantilla: EST.plantilla, color: EST.color, portada: EST.conFoto ? 'foto' : 'sinfoto', estado: 'pendiente', slides: [], copy: '',
    creado: new Date().toISOString()}, datos);
  guardarC(c); return c;
}
const carruselesDe = estado => Object.values(EST.lista).filter(c => estado === 'hecho' ? c.estado === 'hecho' : c.estado !== 'hecho')
  .sort((a, b) => (b.upd || '').localeCompare(a.upd || ''));
function yaEnProduccion(ideaId) { return Object.values(EST.lista).some(c => c.idea === ideaId && c.estado !== 'hecho'); }
function mandarAProducir(ids, extra) {
  let n = 0;
  ids.forEach(id => {
    const it = IMAP[id]; if (!it || yaEnProduccion(id)) return;
    nuevoC(Object.assign({idea: id, titulo: tituloIdea(it)}, extra ? extra(id) : {})); n++;
  });
  return n;
}

/* ---------- Claude escribe el carrusel ---------- */
/* Cómo cambia el carrusel según su objetivo (los objetivos están en matriz.js). */
const OBJ_PROMPT = {
  viral: 'Que se comparta: una situación que el lector reconozca como suya, humor o complicidad, cero venta. El copy acaba con una pregunta abierta de verdad.',
  autoridad: 'Que se note que sabemos más que nadie: precisión, desmontar el mito con hechos (usa un dato verificado si lo hay), cero venta. Que merezca guardarse.',
  informativo: 'Práctico y claro: requisitos, pasos o plazos en orden, una cosa por slide. Que quien lo lea sepa qué hacer después y quiera preguntarnos su caso.',
  leadmagnet: 'Da valor de verdad pero deja claro que el recurso completo se lo lleva quien comente la palabra. Las slides generan la necesidad del recurso; el cierre lo presenta.',
};
function promptCarrusel(c) {
  const it = c.idea ? IMAP[c.idea] : null;
  const datos = it ? datosDe(it).concat(datosSugDe(it)).filter(d => d && !/^BAJA/.test(d.confianza)) : [];
  const L = [];
  L.push('Escribe un carrusel de Instagram para Explora (FP online oficial de Ucademy). Responde SOLO con JSON válido, sin texto antes ni después.');
  L.push('');
  L.push('TONO DE MARCA');
  L.push('- Sin filtros: frases cortas, verdades concretas, cero relleno, de tú a tú, como a un colega. Si suena a folleto, reescríbelo.');
  L.push('- A fuego: verbos de acción en presente que empujan al siguiente paso. Nombra la barrera y desactívala.');
  L.push('- Prohibido: «profesor» (es guía), «lección/unidad» (expedición), «aula» (terreno), «matricúlate» (trazar mi ruta), «FCT» (formación en empresa).');
  L.push('- Glosario que puedes usar con moderación: pisar barro, abrir brecha, cazar el botín, prueba y falla, machete en mano.');
  L.push('');
  L.push('REGLAS DE LAS SLIDES');
  L.push('- El titular de la portada es el HOOK: lo que para el scroll. Informativo o autoridad: claro y concreto, promete una respuesta. Viral o lead magnet: persuasivo, curiosidad o identificación.');
  L.push('- Entre 5 y 7 slides. La primera es "portada" y la última "cierre". En medio, "contenido", "lista" o "dato".');
  L.push('- Titulares en minúscula salvo la inicial y los nombres propios o siglas (FP, ESO, Ministerio). Nunca todo en mayúsculas.');
  L.push('- En cada titular, rodea con asteriscos UNA palabra o expresión corta para resaltarla, así: Estudiar *después* de currar.');
  L.push('- Titular: máximo 8 palabras. Subtítulo: máximo 14. Texto: máximo 28. Items de lista: de 2 a 4, máximo 7 palabras cada uno.');
  L.push('- Etiqueta (opcional, arriba de la slide): 1 a 3 palabras.');
  L.push('- Nada de emojis dentro de las slides. Nada de «desliza». Una idea por slide, que se entienda en dos segundos.');
  L.push('- NO inventes cifras, porcentajes, sueldos ni plazos. Solo puedes usar una slide "dato" con uno de los DATOS VERIFICADOS de abajo, copiando la cifra y la fuente tal cual. Si no hay datos, no hagas slide "dato".');
  const O = c.objetivo && typeof OBJETIVOS !== 'undefined' ? OBJETIVOS[c.objetivo] : null;
  if (O && c.cta) {
    L.push('- Cierre: un titular corto y un "cta" con ESTA acción, dicha con el tono de marca y adaptada al tema: «' + c.cta + '».' +
      (/PALABRA|\[recurso\]/.test(c.cta) ? ' Sustituye PALABRA por una palabra clave corta en mayúsculas que encaje (p. ej. REQUISITOS) y [recurso] por el recurso concreto que se llevaría (p. ej. «el checklist de tu ciclo»).' : ''));
    L.push('- El texto del post ("copy") termina repitiendo esa misma acción.');
  } else {
    L.push('- Cierre: un titular corto y un "cta" que sea una coordenada, nunca una venta: ' + CTAS.map(x => x.replace(/\s*\S+$/, '')).join(' · ') + '. "cinta": "Enlace en el perfil".');
  }
  if (O) {
    L.push('');
    L.push('OBJETIVO DEL CARRUSEL: ' + O.nombre.toUpperCase() + ' (push ' + O.push + ' de 4)');
    L.push('- ' + OBJ_PROMPT[c.objetivo]);
  }
  L.push('');
  if (c.portada === 'sinfoto') {
    L.push('PORTADA SIN FOTO: no pongas "imagen" en la portada.');
    L.push('');
  } else if (FOTOS.length) {
    L.push('FOTOS DISPONIBLES (usa la ruta exacta):');
    FOTOS.forEach(f => L.push('- ' + f.ruta + ' → ' + f.desc));
    L.push((c.portada === 'foto' ? 'La portada lleva SIEMPRE foto: pon "imagen" con la ruta de la que mejor encaje con el tema' : 'En la portada, si una foto encaja con el tema, pon "imagen" con su ruta') +
      (c.plantilla === 'feed' || c.plantilla === 'cuaderno' ? ' y "marco": "fondo" (foto a pantalla completa).' : '.'));
    L.push('');
  }
  if (it) {
    L.push('LA IDEA');
    L.push('- Hook de la portada (úsalo tal cual o mejóralo sin cambiar el enfoque): ' + tituloIdea(it));
    if (tituloIdea(it) !== it.titular) L.push('- Titular original de la idea: ' + it.titular);
    L.push('- ' + it.ganchoLabel + ': ' + it.gancho);
    L.push('- Qué se explica dentro: ' + it.dentro);
    if (it.buyer) L.push('- A quién le habla: ' + it.buyer + (it.situacion ? ' (' + it.situacion + ')' : ''));
    if (it.google) L.push('- Lo que buscaría en Google: ' + it.google);
    L.push('- Momento del embudo: ' + FN_PISTA[it.funnel]);
  } else {
    L.push('EL TEMA');
    L.push('- ' + (c.tema || c.titulo));
  }
  const parecidos = typeof PARECIDOS_PARA_PROMPT === 'function' ? PARECIDOS_PARA_PROMPT(c) : [];
  if (parecidos.length) {
    L.push('');
    L.push('YA PUBLICADOS Y PARECIDOS (no repitas su ángulo ni sus titulares; busca otro enfoque):');
    parecidos.forEach(p => L.push('- ' + p));
  }
  L.push('');
  if (datos.length) {
    L.push('DATOS VERIFICADOS (los únicos números que puedes usar):');
    datos.forEach(d => L.push('- ' + d.frase + ' | cifra exacta: ' + d.norma + ' | fuente: ' + d.fuente + ', ' + d.consultado + ' | cuidado: ' + d.aviso));
  } else {
    L.push('DATOS VERIFICADOS: ninguno. No uses cifras.');
  }
  L.push('');
  L.push('FORMATO DE RESPUESTA (JSON):');
  L.push('{"copy": "texto del post de Instagram: 3-5 líneas cortas con el mismo tono, emojis de energía permitidos, y 3-5 hashtags al final",');
  L.push(' "slides": [');
  L.push('  {"tipo":"portada","etiqueta":"FP Online","titulo":"...","subtitulo":"...","imagen":"fotos/...","marco":"fondo"},');
  L.push('  {"tipo":"contenido","numero":"01","titulo":"...","texto":"..."},');
  L.push('  {"tipo":"lista","titulo":"...","items":["...","..."]},');
  L.push('  {"tipo":"dato","antetitulo":"...","cifra":"...","texto":"...","fuente":"..."},');
  L.push('  {"tipo":"cierre","titulo":"...","texto":"...","cta":"...","cinta":"Enlace en el perfil"}');
  L.push(' ]}');
  return L.join('\n');
}
const CAMPOS_SLIDE = ['tipo', 'etiqueta', 'antetitulo', 'titulo', 'subtitulo', 'numero', 'texto', 'items', 'cifra', 'fuente', 'cta', 'cinta', 'imagen', 'marco', 'nota'];
function limpiarRespuesta(r) {
  const rutas = FOTOS.map(f => f.ruta);
  let slides = (r && Array.isArray(r.slides) ? r.slides : []).filter(s => s && EST_TIPOS[s.tipo]).slice(0, 10).map(s => {
    const o = {};
    CAMPOS_SLIDE.forEach(k => { if (s[k] != null && s[k] !== '') o[k] = k === 'items' ? [].concat(s[k]).map(String).slice(0, 4) : String(s[k]); });
    if (o.imagen && rutas.indexOf(o.imagen) < 0) { delete o.imagen; delete o.marco; }
    if (o.marco && ['fondo', 'portatil', 'notas'].indexOf(o.marco) < 0) delete o.marco;
    if (o.titulo && o.titulo === o.titulo.toUpperCase() && /[A-ZÁÉÍÓÚ]{4}/.test(o.titulo)) o.titulo = o.titulo.charAt(0) + o.titulo.slice(1).toLowerCase();
    return o;
  });
  if (slides.length && slides[0].tipo !== 'portada') slides[0].tipo = 'portada';
  if (slides.length > 1 && slides[slides.length - 1].tipo !== 'cierre') slides[slides.length - 1].tipo = 'cierre';
  return {slides: slides, copy: String(r && r.copy || '').trim()};
}
async function generar(id) {
  const c = EST.lista[id]; if (!c) return;
  if (!EST.sample) { toast('Generar con Claude no está disponible en esta vista'); return; }
  c.estado = 'generando'; c.error = ''; refrescarEstudio();
  try {
    const r = await EST.sample.json(promptCarrusel(c), {modelTier: 'default'});
    const limpio = limpiarRespuesta(r);
    if (limpio.slides.length < 3) throw {code: 'vacio', message: 'Claude no ha devuelto slides válidas'};
    Object.assign(c, limpio, {estado: 'borrador', error: ''});
    if (!c.titulo || (c.idea && IMAP[c.idea] && (c.titulo === IMAP[c.idea].titular || c.titulo === tituloIdea(IMAP[c.idea])))) c.titulo = (limpio.slides[0].titulo || c.titulo || '').replace(/\*/g, '');
    guardarC(c);
  } catch (e) {
    c.estado = 'error';
    c.error = e && e.code === 'not_granted' ? 'No se dio permiso para usar Claude.'
      : e && e.code === 'rate_limited' ? 'Demasiadas peticiones a la vez. Prueba en un minuto.'
      : 'No ha salido bien (' + (e && (e.code || e.message) || 'error') + '). Vuelve a generar.';
    guardarC(c);
  }
  refrescarEstudio();
}
async function generarTodas() {
  if (EST.cola) return;
  const ids = carruselesDe('pendientes').filter(c => c.estado === 'pendiente' || c.estado === 'error').map(c => c.id);
  if (!ids.length) { toast('No hay carruseles sin generar'); return; }
  EST.cola = true; refrescarEstudio();
  for (let i = 0; i < ids.length; i++) {
    EST.progreso = 'Generando ' + (i + 1) + ' de ' + ids.length + '…'; refrescarEstudio();
    await generar(ids[i]);
    if (EST.lista[ids[i]] && EST.lista[ids[i]].error && /permiso/.test(EST.lista[ids[i]].error)) break;
  }
  EST.cola = false; EST.progreso = ''; refrescarEstudio();
  toast('Listos para revisar');
}

/* ---------- control de calidad ----------
   error = no se puede publicar así · aviso = revisa, puede estar bien */
const QC_PROHIBIDAS = [
  [/\bprofesor(a|es|as)?\b/i, '«profesor»: di «guía»'],
  [/\blecci[oó]n(es)?\b/i, '«lección»: di «expedición»'],
  [/\bunidad(es)? did[aá]ctica/i, '«unidad didáctica»: di «expedición»'],
  [/\baulas?\b/i, '«aula»: di «terreno»'],
  [/matric[uú]late|matric[uú]lese/i, '«matricúlate»: di «trazar mi ruta»'],
  [/\bFCT\b/, '«FCT»: di «formación en empresa»'],
  [/\bdesliza\b|swipe/i, 'nada de «desliza» en las slides']];
const QC_CAMPOS = ['etiqueta', 'antetitulo', 'titulo', 'subtitulo', 'texto', 'cta', 'cinta', 'nota'];
function firmaQC(c) { return JSON.stringify([c.plantilla, c.color, c.cinta, c.slides]); }
function avisosTexto(c) {
  const out = [], add = (i, nivel, msg) => out.push({slide: i, nivel: nivel, msg: msg});
  c.slides.forEach((s, i) => {
    const textos = QC_CAMPOS.map(k => s[k]).concat(s.items || []).filter(Boolean).map(String);
    const todo = textos.join(' · ');
    QC_PROHIBIDAS.forEach(p => { if (p[0].test(todo)) add(i, 'error', 'Palabra prohibida: ' + p[1]); });
    if (/\p{Extended_Pictographic}/u.test(todo)) add(i, 'aviso', 'Hay un emoji dentro de la slide (solo van en el texto del post)');
    const tit = String(s.titulo || '').replace(/\*/g, '');
    if (/[A-ZÁÉÍÓÚÑ]{2}[^a-záéíóúñ]*[A-ZÁÉÍÓÚÑ]{3}/.test(tit) && tit === tit.toUpperCase() && tit.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '').length > 5)
      add(i, 'error', 'Titular en mayúsculas: va en minúscula salvo la inicial');
    const palabras = tit.split(/\s+/).filter(Boolean).length;
    if (palabras > 10) add(i, 'aviso', 'Titular largo (' + palabras + ' palabras): mejor 8 o menos');
    if (s.tipo !== 'dato' && s.titulo && !/\*[^*]+\*/.test(s.titulo)) add(i, 'aviso', 'El titular no tiene ninguna palabra resaltada (*así*)');
    if (s.tipo === 'dato') {
      if (!s.cifra) add(i, 'error', 'Slide de dato sin cifra');
      if (!s.fuente) add(i, 'error', 'Cifra sin fuente: cópiala de la pestaña Datos');
    } else if (/\d+([.,]\d+)?\s?(%|€|euros|horas|h\b|meses|años)/i.test(todo)) {
      add(i, 'aviso', 'Hay una cifra: comprueba que sale de la pestaña Datos');
    }
  });
  if (c.slides.length && c.slides[0].tipo !== 'portada') add(0, 'aviso', 'La primera slide no es una portada');
  if (c.slides.length > 1 && c.slides[c.slides.length - 1].tipo !== 'cierre') add(c.slides.length - 1, 'aviso', 'La última slide no es un cierre');
  if (c.slides.length > 10) add(-1, 'aviso', c.slides.length + ' slides: el ideal está entre 4 y 8');
  if (!String(c.copy || '').trim()) add(-1, 'aviso', 'Falta el texto del post');
  return out;
}
/* cabe o no cabe: se mide pintando cada slide fuera de pantalla */
EST.medidas = {};
async function medir(c) {
  const firma = firmaQC(c), m = EST.medidas[c.id];
  if (m && m.firma === firma) return m;
  const sobras = [];
  for (let i = 0; i < c.slides.length; i++) {
    const f = document.createElement('iframe'); f.className = 'est-exportar'; document.body.appendChild(f);
    try {
      await new Promise(ok => { f.onload = ok; f.srcdoc = docSlide(c, i); });
      const d = f.contentDocument;
      for (let t = 0; t < 80 && !d.body.getAttribute('data-listo'); t++) await new Promise(r => setTimeout(r, 50));
      sobras.push(+(d.body.getAttribute('data-sobra') || 0));
    } catch (e) { sobras.push(0); } finally { f.remove(); }
  }
  return EST.medidas[c.id] = {firma: firma, sobras: sobras};
}
function avisos(c) {
  const out = avisosTexto(c), m = EST.medidas[c.id];
  if (m && m.firma === firmaQC(c)) m.sobras.forEach((px, i) => { if (px > 0) out.unshift({slide: i, nivel: 'error', msg: 'El texto no cabe en la slide: recórtalo'}); });
  return out;
}
const qcMedido = c => { const m = EST.medidas[c.id]; return !!(m && m.firma === firmaQC(c)); };
const qcErrores = c => avisos(c).filter(a => a.nivel === 'error').length;
/* cola: mide de uno en uno para no saturar el navegador */
EST.qcCola = []; EST.qcActivo = false;
function pedirQC(c) { if (!c || !c.slides.length || qcMedido(c) || EST.qcCola.indexOf(c.id) >= 0) return; EST.qcCola.push(c.id); correrQC(); }
async function correrQC() {
  if (EST.qcActivo) return; EST.qcActivo = true;
  while (EST.qcCola.length) {
    const c = EST.lista[EST.qcCola.shift()];
    if (c && c.slides.length) { await medir(c); refrescarQCVisible(c.id); }
  }
  EST.qcActivo = false;
}
function chipQC(c) {
  if (!c.slides.length) return '';
  if (!qcMedido(c)) { pedirQC(c); return '<span class="chip e-pendiente">Revisando…</span>'; }
  const a = avisos(c), e = a.filter(x => x.nivel === 'error').length, w = a.length - e;
  return e ? '<span class="chip e-error" title="' + esc(a.filter(x => x.nivel === 'error').map(x => x.msg).join(' · ')) + '">⚠ ' + e + ' a corregir</span>'
    : w ? '<span class="chip e-generando" title="' + esc(a.map(x => x.msg).join(' · ')) + '">' + w + (w === 1 ? ' aviso' : ' avisos') + '</span>'
    : '<span class="chip e-hecho">✓ Listo</span>';
}
function refrescarQCVisible(id) {
  document.querySelectorAll('[data-qc-chip="' + id + '"]').forEach(el => { const c = EST.lista[id]; if (c) el.innerHTML = chipQC(c); });
  if (EST.abierto === id) pintarQCPanel();
  const h = document.getElementById('est-lote-hueco'); if (h) h.innerHTML = botonLote();
}
function pintarQCPanel() {
  const c = EST.lista[EST.abierto], caja = document.getElementById('est-qc'); if (!c || !caja) return;
  caja.innerHTML = htmlQC(c);
  document.querySelectorAll('#est-editor [data-est-sel]').forEach(b => {
    const i = +b.dataset.estSel, a = avisos(c).filter(x => x.slide === i);
    b.dataset.qc = a.some(x => x.nivel === 'error') ? 'error' : a.length ? 'aviso' : '';
  });
  const h = document.getElementById('est-hecho');
  if (h && c.estado !== 'hecho') { const e = qcErrores(c); h.textContent = e && EST.forzar === c.id ? 'Marcar hecho igualmente' : 'Marcar hecho'; }
}
function htmlQC(c) {
  if (!qcMedido(c)) { pedirQC(c); return '<h3>Control de calidad</h3><p class="est-pista">Revisando las slides…</p>'; }
  const a = avisos(c);
  if (!a.length) return '<h3>Control de calidad</h3><div class="est-qc-ok">✓ Todo en orden: cabe, sin palabras prohibidas, sin cifras sin fuente.</div>';
  return '<h3>Control de calidad</h3><ul class="est-qc">' + a.map(x =>
    '<li class="qc-' + x.nivel + '"><b>' + (x.nivel === 'error' ? 'Corregir' : 'Revisar') + '</b>' +
    (x.slide >= 0 ? '<button class="btn mini" data-est-sel="' + x.slide + '">Slide ' + (x.slide + 1) + '</button>' : '') +
    '<span>' + esc(x.msg) + '</span></li>').join('') + '</ul>';
}

/* ---------- vistas ---------- */
function botonesEstilo() {
  return '<div class="est-estilo">' +
    '<div class="est-caja"><h3>Plantilla para los nuevos</h3><div class="est-opciones">' +
      EST_PLANTILLAS.map(p => '<button class="est-op" data-est-pl="' + p.id + '" aria-pressed="' + (EST.plantilla === p.id) + '">' +
        esc(p.nombre) + ' <small>' + esc(p.pista) + '</small></button>').join('') + '</div></div>' +
    '<div class="est-caja"><h3>Color para los nuevos</h3><div class="est-opciones">' +
      EST_COLORES_ELEGIBLES.map(c => '<button class="est-op" data-est-co="' + c.id + '" aria-pressed="' + (EST.color === c.id) + '">' +
        '<i style="background:' + c.hex + '"></i>' + esc(c.nombre) + '</button>').join('') + '</div></div>' +
  '</div>';
}
/* muestra de cómo quedará: la portada con el titular real en la plantilla y el color elegidos */
function resaltarTitular(t) {
  t = String(t || '').replace(/[*«»"]/g, '').trim();
  if (/\*/.test(t)) return t;
  const ps = t.split(/\s+/), vacias = /^(el|la|los|las|un|una|de|del|y|o|a|en|con|para|por|que|qué|no|tu|te|lo|se|es|su)$/i;
  let k = -1, largo = 0;
  ps.forEach((p, i) => { const l = p.replace(/[^\wáéíóúñ]/gi, '').length; if (!vacias.test(p) && l > largo) { largo = l; k = i; } });
  if (k >= 0) ps[k] = '*' + ps[k].replace(/([.,:;?!]+)$/, '') + '*' + (ps[k].match(/[.,:;?!]+$/) || [''])[0];
  return ps.join(' ');
}
const FOTO_PREVIA = (FOTOS.find(f => /cascos/.test(f.ruta)) || FOTOS[0] || {}).ruta;
function previa(id, plantilla, color, titulo, etiqueta, conFoto) {
  const s = {tipo: 'portada', etiqueta: etiqueta || '', titulo: resaltarTitular(titulo)};
  if (conFoto && FOTO_PREVIA) { s.imagen = FOTO_PREVIA; if (plantilla === 'feed' || plantilla === 'cuaderno') s.marco = 'fondo'; }
  const c = {id: id, plantilla: plantilla, color: color, cinta: '', slides: [s]};
  PREVIAS[id] = c; return c;
}
function tarjeta(c) {
  const vista = c.slides.length ? c : previa('p-' + c.id, c.plantilla, c.color, c.titulo || c.tema, c.idea && IMAP[c.idea] ? IMAP[c.idea].alcTxt : '', c.portada === 'foto');
  const estado = c.estado === 'generando' ? 'Claude lo está escribiendo…' : c.estado === 'pendiente' ? 'Así quedará la portada' :
    c.estado === 'error' ? c.error : '';
  return '<article class="est-tarjeta' + (c.slides.length ? '' : ' est-previa') + '">' + mini(vista, 0) +
    '<div class="est-tcuerpo"><h4>' + esc(c.titulo || c.tema || '(sin título)') + '</h4>' +
    '<div class="est-tmeta">' + (c.objetivo && typeof OBJETIVOS !== 'undefined' && OBJETIVOS[c.objetivo] ? '<span class="mz-objchip o-' + c.objetivo + '">' + esc(objEt(c.objetivo)) + '</span>' : '') + '<span>' + esc(nombrePl(c.plantilla)) + ' · ' + esc(nombreCo(c.color)) + (c.slides.length ? ' · ' + c.slides.length + ' slides' : '') + '</span></div>' +
    (estado ? '<p class="est-pista"' + (c.estado === 'error' ? ' style="color:var(--danger)"' : '') + '>' + esc(estado) + '</p>' : '') +
    (c.slides.length && c.estado !== 'generando' ? '<div class="est-tmeta" data-qc-chip="' + c.id + '">' + chipQC(c) + '</div>' : '') +
    '<div class="est-tpie">' +
      (c.estado === 'generando' ? '<button class="btn" disabled>Generando…</button>'
        : c.slides.length ? '<button class="btn pri" data-est-abrir="' + c.id + '">Revisar</button>'
        : '<button class="btn pri" data-est-generar="' + c.id + '">Generar</button>') +
      (c.estado !== 'generando' ? '<button class="btn" data-est-quitar="' + c.id + '" title="Quitar de Producción">✕</button>' : '') +
    '</div></div></article>';
}
function vProducir() {
  const lista = carruselesDe('pendientes');
  const sinGenerar = lista.filter(c => c.estado === 'pendiente' || c.estado === 'error').length;
  const revisar = lista.filter(c => c.estado === 'borrador').length;
  let h = cabecera('Producción', '',
    [[lista.length, 'en la mesa'], [sinGenerar, 'sin generar'], [revisar, 'para revisar', revisar ? 'lima' : '']]);
  h += '<div class="est-acciones">' +
    (sinGenerar ? '<button class="btn pri" id="est-generar-todas"' + (EST.cola ? ' disabled' : '') + '>Generar ' + (sinGenerar === 1 ? 'el que falta' : 'los ' + sinGenerar + ' que faltan') + '</button>' : '') +
    '<span id="est-lote-hueco">' + botonLote() + '</span>' +
    '<span class="est-progreso">' + esc(EST.progreso || '') + '</span>' +
    '' +
    (!EST.sample && EST.conectado ? '<span class="est-pista">Generar con Claude solo funciona abriendo la herramienta en claude.ai.</span>' : '') +
    '</div>';
  if (EST.verTemas) h += '<div class="est-libre"><textarea id="est-temas" rows="2" placeholder="Escribe el tema. Uno por línea para hacer varios."></textarea>' +
    '<button class="btn" id="est-anadir-temas">Añadir</button></div>';
  if (!lista.length) return h + '<div class="vacio"><b>No hay nada en producción</b>En la matriz, marca las ideas que quieras y pulsa «Producir».</div>';
  return h + '<div class="est-rejilla">' + lista.map(tarjeta).join('') + '</div>';
}
function vHechos() {
  const lista = carruselesDe('hecho');
  let h = '<div class="vhead"><h2>Carruseles hechos</h2><p>Los que has dado por buenos. Ábrelos para volver a descargar las slides o copiar el texto del post.</p></div>';
  if (lista.length) h += '<div class="est-acciones"><button class="btn pri" data-lote="hechos">Descargar todos (' + lista.length + ')</button>' +
    (EST.progreso ? '<span class="est-progreso">' + esc(EST.progreso) + '</span>' : '') + '</div>';
  if (!lista.length) return h + '<div class="vacio"><b>Todavía no hay ninguno</b>Cuando revises un carrusel y pulses «Marcar hecho», aparece aquí.</div>';
  return h + '<div class="est-rejilla">' + lista.map(c => '<article class="est-tarjeta">' + mini(c, 0) +
    '<div class="est-tcuerpo"><h4>' + esc(c.titulo || '(sin título)') + '</h4>' +
    '<div class="est-tmeta">' + (c.objetivo && typeof OBJETIVOS !== 'undefined' && OBJETIVOS[c.objetivo] ? '<span class="mz-objchip o-' + c.objetivo + '">' + esc(objEt(c.objetivo)) + '</span>' : '') + '<span>' + esc(nombrePl(c.plantilla)) + ' · ' + esc(nombreCo(c.color)) + ' · ' + c.slides.length + ' slides</span>' +
      (c.fecha ? '<span>' + esc(fCorta(c.fecha)) + '</span>' : '') + '</div>' +
    '<div class="est-tpie"><button class="btn pri" data-est-abrir="' + c.id + '">Abrir</button>' +
      '<button class="btn" data-est-descargar="' + c.id + '">Descargar</button>' +
      '<button class="btn" data-est-copiar="' + c.id + '">Copiar texto</button></div></div></article>').join('') + '</div>';
}
function refrescarEstudio() {
  if (S.v === 'producir' || S.v === 'hechos') {
    const y = window.scrollY, foco = document.activeElement && document.activeElement.id, val = foco === 'est-temas' ? document.activeElement.value : null;
    $('#canvas').innerHTML = S.v === 'producir' ? vProducir() : vHechos();
    if (foco === 'est-temas') { const t = $('#est-temas'); t.value = val; t.focus(); }
    window.scrollTo(0, y); pintarMinis($('#canvas'));
  }
  const n = carruselesDe('pendientes').length, b = document.querySelector('#vistas [data-v="producir"]');
  if (b) b.textContent = 'Producción';
  if (EST.abierto) pintarEditor();
}

/* ---------- editor ---------- */
function abrirEditor(id) { EST.abierto = id; EST.sel = 0; $('#est-editor').hidden = false; document.body.style.overflow = 'hidden'; pintarEditor(true); }
function cerrarEditor() { EST.abierto = null; $('#est-editor').hidden = true; document.body.style.overflow = ''; refrescarEstudio(); }
function campoE(k, etiqueta, valor, largo, pista) {
  return '<label>' + esc(etiqueta) + (largo
    ? '<textarea data-est-campo="' + k + '" rows="3">' + esc(valor || '') + '</textarea>'
    : '<input data-est-campo="' + k + '" value="' + esc(valor || '') + '">') + '</label>' + (pista ? '<p class="est-pista">' + esc(pista) + '</p>' : '');
}
const CAMPOS_TIPO = {
  portada: [['etiqueta', 'Etiqueta'], ['titulo', 'Titular', 1], ['subtitulo', 'Subtítulo', 1]],
  contenido: [['etiqueta', 'Etiqueta'], ['numero', 'Número'], ['titulo', 'Titular', 1], ['antetitulo', 'Subtítulo'], ['texto', 'Texto', 1]],
  lista: [['etiqueta', 'Etiqueta'], ['titulo', 'Titular', 1], ['antetitulo', 'Subtítulo'], ['items', 'Puntos (uno por línea)', 1]],
  dato: [['antetitulo', 'Qué es la cifra', 1], ['cifra', 'Cifra'], ['texto', 'Texto', 1], ['fuente', 'Fuente (obligatoria)']],
  cierre: [['etiqueta', 'Etiqueta'], ['titulo', 'Titular', 1], ['texto', 'Texto', 1], ['cta', 'Botón'], ['cinta', 'Debajo del botón']]};
function pintarEditor(todo) {
  const c = EST.lista[EST.abierto]; if (!c) { cerrarEditor(); return; }
  if (EST.sel >= c.slides.length) EST.sel = Math.max(0, c.slides.length - 1);
  const s = c.slides[EST.sel] || {};
  const ed = $('#est-editor');
  const activo = document.activeElement, campoActivo = activo && activo.dataset && activo.dataset.estCampo;
  if (todo || !campoActivo) {
    ed.innerHTML = '<div class="est-ecab">' +
      '<button class="btn" id="est-cerrar">← Volver</button><h2>' + esc(c.titulo || '(sin título)') + '</h2>' +
      '<select id="est-e-pl" aria-label="Plantilla">' + EST_PLANTILLAS.map(p => '<option value="' + p.id + '"' + (c.plantilla === p.id ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('') + '</select>' +
      '<select id="est-e-co" aria-label="Color">' + EST_COLORES.filter(x => x.id !== 'verde' || c.color === 'verde').map(x => '<option value="' + x.id + '"' + (c.color === x.id ? ' selected' : '') + '>' + esc(x.nombre) + '</option>').join('') + '</select>' +
      '<button class="btn" id="est-rehacer" title="Pedir a Claude otra versión">Otra versión</button>' +
      '<button class="btn" id="est-descargar">Descargar slides</button>' +
      '<button class="btn ' + (c.estado === 'hecho' ? 'hecho on' : 'pri') + '" id="est-hecho">' + (c.estado === 'hecho' ? '✓ Hecho' : 'Marcar hecho') + '</button>' +
    '</div><div class="est-ecuerpo"><div class="est-escena">' +
      '<div class="est-grande">' + mini(c, EST.sel) + '</div>' +
      '<div class="est-tira">' + c.slides.map((x, i) => mini(c, i, {boton: 'data-est-sel="' + i + '" aria-current="' + (i === EST.sel) + '" aria-label="Slide ' + (i + 1) + '"'})).join('') + '</div>' +
    '</div><div class="est-panel" id="est-panel"></div></div>';
  }
  const tipo = s.tipo || 'contenido';
  let p = '<div id="est-qc">' + htmlQC(c) + '</div><h3>Slide ' + (EST.sel + 1) + ' de ' + c.slides.length + '</h3>' +
    '<div class="est-fila"><button class="btn mini" data-est-mover="-1"' + (EST.sel === 0 ? ' disabled' : '') + '>↑ Antes</button>' +
    '<button class="btn mini" data-est-mover="1"' + (EST.sel >= c.slides.length - 1 ? ' disabled' : '') + '>↓ Después</button>' +
    '<button class="btn mini" id="est-duplicar">Duplicar</button><button class="btn mini" id="est-borrar-slide"' + (c.slides.length < 2 ? ' disabled' : '') + '>Quitar</button></div>' +
    '<div class="est-campos"><label>Tipo de slide<select data-est-campo="tipo">' +
      Object.keys(EST_TIPOS).map(k => '<option value="' + k + '"' + (tipo === k ? ' selected' : '') + '>' + EST_TIPOS[k] + '</option>').join('') + '</select></label>' +
    CAMPOS_TIPO[tipo].map(f => campoE(f[0], f[1], f[0] === 'items' ? (s.items || []).join('\n') : s[f[0]], f[2])).join('') +
    '<p class="est-pista">Rodea con *asteriscos* la palabra que quieras resaltar en verde lima.</p></div>';
  if (tipo === 'portada' || tipo === 'contenido') {
    p += '<h3>Foto</h3><div class="est-fotos"><button data-est-foto="" aria-pressed="' + !s.imagen + '">Sin foto</button>' +
      FOTOS.map(f => '<button data-est-foto="' + esc(f.ruta) + '" aria-pressed="' + (s.imagen === f.ruta) + '" title="' + esc(f.desc) + '"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '" loading="lazy"></button>').join('') + '</div>';
    if (tipo === 'portada') p += '<div class="est-campos"><label>Cómo va la portada<select data-est-campo="marco">' +
      [['', 'Según la plantilla'], ['fondo', 'Foto a pantalla completa'], ['notas', 'Notas a mano de fondo']].map(o =>
        '<option value="' + o[0] + '"' + ((s.marco || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label></div>';
  }
  p += '<h3>Añadir slide</h3><div class="est-fila">' + Object.keys(EST_TIPOS).map(k => '<button class="btn mini" data-est-nueva="' + k + '">+ ' + EST_TIPOS[k] + '</button>').join('') + '</div>';
  p += '<h3>Texto del post</h3><div class="est-campos"><textarea data-est-copy rows="6">' + esc(c.copy || '') + '</textarea>' +
    '<button class="btn mini" data-est-copiar="' + c.id + '">Copiar texto del post</button></div>';
  if (!campoActivo) $('#est-panel').innerHTML = p;
  pintarMinis(ed); pintarQCPanel();
}
let estTempo, estVista, estQC;
function editarCampo(k, v) {
  const c = EST.lista[EST.abierto]; if (!c) return;
  const s = c.slides[EST.sel]; if (!s) return;
  if (k === 'items') s.items = v.split('\n').map(x => x.trim()).filter(Boolean);
  else if (v === '') delete s[k]; else s[k] = v;
  c.upd = new Date().toISOString();
  clearTimeout(estVista); estVista = setTimeout(() => pintarMinis($('#est-editor')), 250);
  clearTimeout(estTempo); estTempo = setTimeout(() => guardarC(c), 600);
  clearTimeout(estQC); estQC = setTimeout(() => { pintarQCPanel(); pedirQC(c); }, 900);
}

/* ---------- exportar PNG ---------- */
let EST_H2I = null;
function cargarScript(src, global) {
  return new Promise((ok, mal) => { if (window[global]) return ok(window[global]);
    const s = document.createElement('script'); s.src = src; s.onload = () => ok(window[global]); s.onerror = mal; document.head.appendChild(s); });
}
async function pngDe(c, i) {
  EST_H2I = EST_H2I || await cargarScript('https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js', 'htmlToImage');
  await prepararExportacion();
  const f = document.createElement('iframe'); f.className = 'est-exportar'; document.body.appendChild(f);
  try {
    await new Promise(ok => { f.onload = ok; f.srcdoc = docSlide(c, i, true); });
    const d = f.contentDocument;
    for (let t = 0; t < 100 && !d.body.getAttribute('data-listo'); t++) await new Promise(r => setTimeout(r, 50));
    await Promise.all([].map.call(d.images, im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    const nodo = d.querySelector('.slide');
    await d.fonts.ready;
    const fuentes = (CSS_EXP.base.match(/@font-face\s*\{[^}]*\}/g) || []).join('\n');
    // toBlob directo: sin pasar por fetch() de una URL data:, que algunas políticas de seguridad bloquean
    const blob = await EST_H2I.toBlob(nodo, {width: 1080, height: 1350, pixelRatio: 1, cacheBust: false, fontEmbedCSS: fuentes});
    if (!blob || !blob.size) throw {code: 'png', message: 'la slide ' + (i + 1) + ' salió vacía'};
    return blob;
  } finally { f.remove(); }
}
/* La plataforma no deja descargar .zip desde una herramienta publicada (solo imágenes, PDF,
   texto y Office). Por eso el lote sale como PNG seguidos, con nombres que se ordenan solos:
   «01-titulo-01.png», «01-titulo-02.png», «01-titulo-texto.txt», «02-otro-01.png»… */
const nombreBase = c => (c.titulo || 'carrusel').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'carrusel';
async function descargarLote(lista) {
  if (EST.descargando) return;
  const down = DOWN || (typeof claude !== 'undefined' && claude.use ? await claude.use('downloads') : null);
  if (!down) { toast('La descarga no está disponible en esta vista'); return; }
  const total = lista.reduce((n, c) => n + c.slides.length + (c.copy ? 1 : 0), 0);
  let hecho = 0; EST.descargando = true;
  try {
    for (let k = 0; k < lista.length; k++) {
      const c = lista[k], base = (lista.length > 1 ? String(k + 1).padStart(2, '0') + '-' : '') + nombreBase(c);
      for (let i = 0; i < c.slides.length; i++) {
        EST.progreso = 'Descargando ' + (++hecho) + ' de ' + total + '…'; toast(EST.progreso); actualizarProgreso();
        let png;
        try { png = await pngDe(c, i); } catch (e) { throw {code: 'png', message: 'no pude crear la imagen de la slide ' + (i + 1) + (e && e.message ? ': ' + e.message : '')}; }
        await guardarArchivo(down, base + '-' + String(i + 1).padStart(2, '0') + '.png', png);
      }
      if (c.copy) { EST.progreso = 'Descargando ' + (++hecho) + ' de ' + total + '…'; actualizarProgreso();
        await guardarArchivo(down, base + '-texto.txt', c.copy); }
    }
    toast(lista.length > 1 ? lista.length + ' carruseles descargados' : 'Carrusel descargado');
  } catch (e) {
    console.error('descarga', e);
    toast(e && e.code === 'declined' ? 'Descarga cancelada'
      : e && e.code === 'png' ? 'Fallo al crear el PNG: ' + e.message
      : 'No he podido terminar la descarga' + (e && e.code ? ' (' + e.code + (e.message ? ': ' + e.message : '') + ')' : e && e.message ? ' (' + e.message + ')' : ''));
  } finally { EST.descargando = false; EST.progreso = ''; actualizarProgreso(); }
}
/* La plataforma solo deja una confirmación abierta y limita las seguidas: si dice rate_limited, espera y reintenta. */
async function guardarArchivo(down, filename, data) {
  for (let intento = 0; ; intento++) {
    try { return await down.save({filename: filename, data: data}); }
    catch (e) {
      if (e && e.code === 'rate_limited' && intento < 8) { await new Promise(r => setTimeout(r, 1200 * (intento + 1))); continue; }
      throw e;
    }
  }
}
function actualizarProgreso() { document.querySelectorAll('.est-progreso').forEach(el => { el.textContent = EST.progreso || ''; }); }
const descargar = c => descargarLote([c]);
/* listos = generados, sin errores de calidad y ya medidos */
const botonLote = () => { const n = listosLote().length;
  return n ? '<button class="btn" data-lote="listos">Descargar ' + (n === 1 ? 'el listo' : 'los ' + n + ' listos') + '</button>' : ''; };
const listosLote = () => carruselesDe('pendientes').filter(c => c.estado === 'borrador' && c.slides.length && qcMedido(c) && !qcErrores(c));

/* ---------- enganches con el banco ---------- */
const _vIdeas = vIdeas;
vIdeas = function () {
  const n = filtradas().length;
  return _vIdeas().replace('<div class="barra"', '<div class="est-acciones" style="margin-top:12px">' +
    '<button class="btn pri" id="est-producir-filtradas">Producir ' + (n === IDEAS.length ? 'todas (' + n + ')' : 'las ' + n + ' que ves') + '</button>' +
    '<span class="est-pista">Filtra primero por rama o ciclo para hacer un lote.</span></div><div class="barra"');
};
const _fila = fila;
fila = function (it) {
  const enMesa = yaEnProduccion(it.id);
  return _fila(it).replace('<button class="btn mini" data-prompt="' + it.id + '">Prompt</button>',
    enMesa ? '<button class="btn mini" data-ir="producir">En la mesa</button>'
           : '<button class="btn mini pri" data-producir="' + it.id + '">Producir</button>');
};
const _pintarFicha = pintarFicha;
pintarFicha = function () {
  _pintarFicha();
  const it = IMAP[S.sel]; if (!it) return;
  $('#dfoot').insertAdjacentHTML('afterbegin', yaEnProduccion(it.id)
    ? '<button class="btn pri" data-ir="producir">Ver en Producción</button>'
    : '<button class="btn pri" data-producir="' + it.id + '">Producir con Claude</button>');
  const pr = $('#dfoot [data-prompt]'); if (pr) { pr.classList.remove('pri'); pr.textContent = 'Copiar prompt'; }
};
const _renderEst = render;
render = function () {
  if (S.v === 'producir' || S.v === 'hechos') { refrescarEstudio(); return; }
  _renderEst();
};

document.addEventListener('click', e => {
  const t = e.target;
  const pr = t.closest('[data-producir]');
  if (pr) { e.stopImmediatePropagation();
    if (typeof abrirProducir === 'function') { abrirProducir([pr.dataset.producir]); return; }
    const n = mandarAProducir([pr.dataset.producir]); toast(n ? 'En Producción' : 'Ya estaba en Producción'); render(); return; }
  if (t.id === 'est-producir-filtradas') { const n = mandarAProducir(filtradas().map(i => i.id));
    toast(n ? n + ' ideas en Producción' : 'Ya estaban todas en Producción'); render(); return; }
  const pl = t.closest('[data-est-pl]'); if (pl) { EST.plantilla = pl.dataset.estPl; guardarEstilo(); refrescarEstudio(); return; }
  const co = t.closest('[data-est-co]'); if (co) { EST.color = co.dataset.estCo; guardarEstilo(); refrescarEstudio(); return; }
  if (t.id === 'est-anadir-temas') {
    const temas = $('#est-temas').value.split('\n').map(x => x.trim()).filter(Boolean);
    if (!temas.length) { toast('Escribe al menos un tema'); return; }
    temas.forEach(x => nuevoC({tema: x, titulo: x})); $('#est-temas').value = '';
    toast(temas.length === 1 ? 'Tema añadido' : temas.length + ' temas añadidos'); refrescarEstudio(); return; }
  if (t.id === 'est-generar-todas') { generarTodas(); return; }
  if (t.id === 'est-ver-temas') { EST.verTemas = !EST.verTemas; refrescarEstudio(); const x = $('#est-temas'); if (x) x.focus(); return; }
  const ge = t.closest('[data-est-generar]'); if (ge) { generar(ge.dataset.estGenerar); return; }
  const qu = t.closest('[data-est-quitar]');
  if (qu) { if (qu.dataset.seguro) { borrarC(qu.dataset.estQuitar); refrescarEstudio(); toast('Quitado'); }
    else { qu.dataset.seguro = '1'; qu.textContent = '¿Quitar?'; setTimeout(() => { if (qu.isConnected) { delete qu.dataset.seguro; qu.textContent = '✕'; } }, 3000); }
    return; }
  const lo = t.closest('[data-lote]');
  if (lo) { const l = lo.dataset.lote === 'hechos' ? carruselesDe('hecho') : listosLote();
    if (!l.length) { toast('No hay nada que descargar'); return; } descargarLote(l); return; }
  const dc = t.closest('[data-est-descargar]'); if (dc) { const c = EST.lista[dc.dataset.estDescargar]; if (c) descargar(c); return; }
  const ab = t.closest('[data-est-abrir]'); if (ab) { abrirEditor(ab.dataset.estAbrir); return; }
  const cp = t.closest('[data-est-copiar]'); if (cp) { const c = EST.lista[cp.dataset.estCopiar]; copiar(c && c.copy || '', 'Texto del post copiado'); return; }
  if (!EST.abierto) return;
  const c = EST.lista[EST.abierto];
  if (t.id === 'est-cerrar') { cerrarEditor(); return; }
  const sl = t.closest('[data-est-sel]'); if (sl) { EST.sel = +sl.dataset.estSel; pintarEditor(true); return; }
  const mv = t.closest('[data-est-mover]');
  if (mv) { const d = +mv.dataset.estMover, j = EST.sel + d; if (j < 0 || j >= c.slides.length) return;
    const x = c.slides.splice(EST.sel, 1)[0]; c.slides.splice(j, 0, x); EST.sel = j; guardarC(c); pintarEditor(true); return; }
  if (t.id === 'est-duplicar') { c.slides.splice(EST.sel + 1, 0, JSON.parse(JSON.stringify(c.slides[EST.sel]))); EST.sel++; guardarC(c); pintarEditor(true); return; }
  if (t.id === 'est-borrar-slide') { c.slides.splice(EST.sel, 1); guardarC(c); pintarEditor(true); return; }
  const nv = t.closest('[data-est-nueva]');
  if (nv) { const tipo = nv.dataset.estNueva; c.slides.splice(EST.sel + 1, 0, tipo === 'lista' ? {tipo: tipo, titulo: 'Nuevo *titular*', items: ['Primer punto', 'Segundo punto']}
    : {tipo: tipo, titulo: tipo === 'dato' ? undefined : 'Nuevo *titular*', cifra: tipo === 'dato' ? '0' : undefined});
    c.slides[EST.sel + 1] = JSON.parse(JSON.stringify(c.slides[EST.sel + 1])); EST.sel++; guardarC(c); pintarEditor(true); return; }
  const fo = t.closest('[data-est-foto]');
  if (fo) { const s = c.slides[EST.sel]; if (fo.dataset.estFoto) s.imagen = fo.dataset.estFoto; else { delete s.imagen; if (s.marco === 'fondo') delete s.marco; }
    guardarC(c); pintarEditor(true); return; }
  if (t.id === 'est-descargar') { descargar(c); return; }
  if (t.id === 'est-rehacer') { if (c.estado === 'generando') return; toast('Pidiendo otra versión…'); generar(c.id).then(() => pintarEditor(true)); return; }
  if (t.id === 'est-hecho') {
    if (c.estado === 'hecho') { c.estado = 'borrador'; guardarC(c); toast('Vuelve a Producción'); pintarEditor(true); return; }
    if (!qcMedido(c)) { toast('Espera un segundo: estoy revisando las slides'); pedirQC(c); return; }
    if (qcErrores(c) && EST.forzar !== c.id) { EST.forzar = c.id; pintarQCPanel();
      toast('Hay ' + qcErrores(c) + ' cosas por corregir. Pulsa otra vez si aun así está bien'); return; }
    EST.forzar = null;
    c.estado = 'hecho'; c.fecha = fISO(hoy()); guardarC(c);
    if (c.idea && IMAP[c.idea]) guardar(c.idea, {hecho: true, fecha: c.fecha});
    toast('Hecho. Lo tienes en «Inventario»'); pintarEditor(true); return; }
}, true);
document.addEventListener('input', e => {
  const t = e.target; if (!EST.abierto) return;
  if (t.dataset.estCampo && t.tagName !== 'SELECT') editarCampo(t.dataset.estCampo, t.value);
  if (t.hasAttribute('data-est-copy')) { const c = EST.lista[EST.abierto]; c.copy = t.value; clearTimeout(estTempo); estTempo = setTimeout(() => guardarC(c), 600); }
});
document.addEventListener('change', e => {
  const t = e.target; if (!EST.abierto) return;
  const c = EST.lista[EST.abierto];
  if (t.id === 'est-e-pl') { c.plantilla = t.value; guardarC(c); pintarEditor(true); return; }
  if (t.id === 'est-e-co') { c.color = t.value; guardarC(c); pintarEditor(true); return; }
  if (t.tagName === 'SELECT' && t.dataset.estCampo) { editarCampo(t.dataset.estCampo, t.value); guardarC(c); pintarEditor(true); }
});
document.addEventListener('focusout', e => { if (EST.abierto && e.target.dataset && e.target.dataset.estCampo) setTimeout(() => { if (!document.activeElement || !document.activeElement.dataset || !document.activeElement.dataset.estCampo) pintarEditor(true); }, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && EST.abierto) { e.stopImmediatePropagation(); cerrarEditor(); } }, true);
function guardarEstilo() { try { localStorage.setItem('explora.estilo', JSON.stringify({plantilla: EST.plantilla, color: EST.color, conFoto: EST.conFoto})); } catch (e) {} }

conectarEstudio();
