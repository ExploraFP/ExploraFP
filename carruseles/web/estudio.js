/* ===================== ESTUDIO: producir carruseles en masa =====================
   Se añade al banco de carruseles. Flujo:
   1) En Ideas, «Producir» manda una idea (o todas las filtradas) a la mesa de producción.
   2) En Producir, «Generar» le pide a Claude las slides siguiendo las reglas de marca.
   3) Se revisa y edita en el editor, se descargan los PNG y se marca hecho.
   El diseño lo pinta el mismo motor que usa el generador de PNG del repositorio
   (MOTOR_JS, MOTOR_CSS y FOTOS los incrusta el constructor). */

const EST = {
  plantilla: 'feed', color: 'verde01',
  lista: {},            // id → carrusel
  abierto: null, sel: 0,
  sample: null, conectado: false, cola: false
};
try { const g = JSON.parse(localStorage.getItem('explora.estilo') || 'null'); if (g) { EST.plantilla = g.plantilla || EST.plantilla; EST.color = g.color || EST.color; } } catch (e) {}

const EST_PLANTILLAS = [
  {id: 'feed', nombre: 'Feed', pista: 'la de vuestro Instagram'},
  {id: 'capas', nombre: 'Capas', pista: 'caja sobre foto'},
  {id: 'cuaderno', nombre: 'Cuaderno', pista: 'libreta y checklist'},
  {id: 'poster', nombre: 'Póster', pista: 'titular gigante'}];
const EST_COLORES = [
  {id: 'verde01', nombre: 'Verde 01', hex: '#366B40'}, {id: 'verde02', nombre: 'Verde 02', hex: '#4CCD4B'},
  {id: 'blanco', nombre: 'Blanco', hex: '#FAFFFA'}, {id: 'noche', nombre: 'Noche', hex: '#1B3620'},
  {id: 'lima', nombre: 'Lima', hex: '#EDFEC3'}, {id: 'verde', nombre: 'Verde', hex: '#85E159'}];
const EST_TIPOS = {portada: 'Portada', contenido: 'Contenido', lista: 'Lista', dato: 'Dato', cierre: 'Cierre'};
const EST_ESTADO = {pendiente: 'Sin generar', generando: 'Generando…', borrador: 'Para revisar', hecho: 'Hecho', error: 'Error'};
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
    const c = EST.lista[f.dataset.c]; if (!c) return;
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
  const c = Object.assign({id: id, plantilla: EST.plantilla, color: EST.color, estado: 'pendiente', slides: [], copy: '',
    creado: new Date().toISOString()}, datos);
  guardarC(c); return c;
}
const carruselesDe = estado => Object.values(EST.lista).filter(c => estado === 'hecho' ? c.estado === 'hecho' : c.estado !== 'hecho')
  .sort((a, b) => (b.upd || '').localeCompare(a.upd || ''));
function yaEnProduccion(ideaId) { return Object.values(EST.lista).some(c => c.idea === ideaId && c.estado !== 'hecho'); }
function mandarAProducir(ids) {
  let n = 0;
  ids.forEach(id => {
    const it = IMAP[id]; if (!it || yaEnProduccion(id)) return;
    nuevoC({idea: id, titulo: it.titular}); n++;
  });
  return n;
}

/* ---------- Claude escribe el carrusel ---------- */
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
  L.push('- Entre 5 y 7 slides. La primera es "portada" y la última "cierre". En medio, "contenido", "lista" o "dato".');
  L.push('- Titulares en minúscula salvo la inicial y los nombres propios o siglas (FP, ESO, Ministerio). Nunca todo en mayúsculas.');
  L.push('- En cada titular, rodea con asteriscos UNA palabra o expresión corta para resaltarla, así: Estudiar *después* de currar.');
  L.push('- Titular: máximo 8 palabras. Subtítulo: máximo 14. Texto: máximo 28. Items de lista: de 2 a 4, máximo 7 palabras cada uno.');
  L.push('- Etiqueta (opcional, arriba de la slide): 1 a 3 palabras.');
  L.push('- Nada de emojis dentro de las slides. Nada de «desliza». Una idea por slide, que se entienda en dos segundos.');
  L.push('- NO inventes cifras, porcentajes, sueldos ni plazos. Solo puedes usar una slide "dato" con uno de los DATOS VERIFICADOS de abajo, copiando la cifra y la fuente tal cual. Si no hay datos, no hagas slide "dato".');
  L.push('- Cierre: un titular corto y un "cta" que sea una coordenada, nunca una venta: ' + CTAS.map(x => x.replace(/\s*\S+$/, '')).join(' · ') + '. "cinta": "Enlace en el perfil".');
  L.push('');
  if (FOTOS.length) {
    L.push('FOTOS DISPONIBLES (usa la ruta exacta; opcional):');
    FOTOS.forEach(f => L.push('- ' + f.ruta + ' → ' + f.desc));
    L.push('En la portada, si una foto encaja con el tema, pon "imagen" con su ruta' +
      (c.plantilla === 'feed' ? ' y "marco": "fondo" (foto a pantalla completa).' : '.'));
    L.push('');
  }
  if (it) {
    L.push('LA IDEA');
    L.push('- Titular de partida: ' + it.titular);
    L.push('- ' + it.ganchoLabel + ': ' + it.gancho);
    L.push('- Qué se explica dentro: ' + it.dentro);
    if (it.buyer) L.push('- A quién le habla: ' + it.buyer + (it.situacion ? ' (' + it.situacion + ')' : ''));
    if (it.google) L.push('- Lo que buscaría en Google: ' + it.google);
    L.push('- Momento del embudo: ' + FN_PISTA[it.funnel]);
  } else {
    L.push('EL TEMA');
    L.push('- ' + (c.tema || c.titulo));
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
    if (!c.titulo || (c.idea && IMAP[c.idea] && c.titulo === IMAP[c.idea].titular)) c.titulo = (limpio.slides[0].titulo || c.titulo || '').replace(/\*/g, '');
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

/* ---------- vistas ---------- */
function botonesEstilo() {
  return '<div class="est-estilo">' +
    '<div class="est-caja"><h3>Plantilla para los nuevos</h3><div class="est-opciones">' +
      EST_PLANTILLAS.map(p => '<button class="est-op" data-est-pl="' + p.id + '" aria-pressed="' + (EST.plantilla === p.id) + '">' +
        esc(p.nombre) + ' <small>' + esc(p.pista) + '</small></button>').join('') + '</div></div>' +
    '<div class="est-caja"><h3>Color para los nuevos</h3><div class="est-opciones">' +
      EST_COLORES.map(c => '<button class="est-op" data-est-co="' + c.id + '" aria-pressed="' + (EST.color === c.id) + '">' +
        '<i style="background:' + c.hex + '"></i>' + esc(c.nombre) + '</button>').join('') + '</div></div>' +
  '</div>';
}
function tarjeta(c) {
  return '<article class="est-tarjeta">' + mini(c, 0, {vacio: c.estado === 'generando' ? 'Claude está escribiendo…' : 'Sin generar todavía'}) +
    '<div class="est-tcuerpo"><h4>' + esc(c.titulo || c.tema || '(sin título)') + '</h4>' +
    '<div class="est-tmeta"><span class="chip e-' + c.estado + '">' + esc(EST_ESTADO[c.estado] || c.estado) + '</span>' +
      '<span>' + esc(nombrePl(c.plantilla)) + ' · ' + esc(nombreCo(c.color)) + (c.slides.length ? ' · ' + c.slides.length + ' slides' : '') + '</span>' +
      (c.idea ? '<span class="mono">' + esc(c.idea) + '</span>' : '') + '</div>' +
    (c.error ? '<p class="est-pista" style="color:var(--danger)">' + esc(c.error) + '</p>' : '') +
    '<div class="est-tpie">' +
      (c.estado === 'generando' ? '<button class="btn" disabled>Generando…</button>'
        : c.slides.length ? '<button class="btn pri" data-est-abrir="' + c.id + '">Revisar</button>'
        : '<button class="btn pri" data-est-generar="' + c.id + '">Generar</button>') +
      (c.slides.length && c.estado !== 'generando' ? '<button class="btn" data-est-generar="' + c.id + '" title="Pedir a Claude otra versión">Rehacer</button>' : '') +
      (c.estado !== 'generando' ? '<button class="btn" data-est-quitar="' + c.id + '" title="Quitar de la lista">✕</button>' : '') +
    '</div></div></article>';
}
function vProducir() {
  const lista = carruselesDe('pendientes');
  const sinGenerar = lista.filter(c => c.estado === 'pendiente' || c.estado === 'error').length;
  let h = '<div class="vhead"><h2>Producir carruseles</h2>' +
    '<p>Elige ideas en la pestaña Ideas con «Producir» (o escribe temas aquí), genera y revisa. Todo se guarda solo.</p></div>';
  h += '<div class="est-pasos"><span class="est-paso"><b>1</b>Elige ideas o escribe temas</span>' +
    '<span class="est-paso"><b>2</b>Genera con Claude</span><span class="est-paso"><b>3</b>Revisa, descarga y marca hecho</span></div>';
  h += botonesEstilo();
  h += '<div class="est-libre"><textarea id="est-temas" rows="2" placeholder="¿Un tema que no está en Ideas? Escríbelo aquí. Uno por línea para hacer varios."></textarea>' +
    '<button class="btn" id="est-anadir-temas">Añadir temas</button> <button class="btn" data-ir="ideas">Elegir de Ideas</button></div>';
  h += '<div class="est-acciones">' +
    (sinGenerar ? '<button class="btn pri" id="est-generar-todas"' + (EST.cola ? ' disabled' : '') + '>Generar ' + (sinGenerar === 1 ? 'el pendiente' : 'los ' + sinGenerar + ' pendientes') + '</button>' : '') +
    (EST.progreso ? '<span class="est-progreso">' + esc(EST.progreso) + '</span>' : '') +
    (!EST.sample && EST.conectado ? '<span class="est-pista">Generar con Claude solo funciona abriendo la herramienta en claude.ai.</span>' : '') +
    '</div>';
  if (!lista.length) return h + '<div class="vacio"><b>La mesa está vacía</b>Ve a Ideas y pulsa «Producir» en las que quieras, o escribe un tema arriba.</div>';
  return h + '<div class="est-rejilla">' + lista.map(tarjeta).join('') + '</div>';
}
function vHechos() {
  const lista = carruselesDe('hecho');
  let h = '<div class="vhead"><h2>Carruseles hechos</h2><p>Los que has dado por buenos. Ábrelos para volver a descargar las slides o copiar el texto del post.</p></div>';
  if (!lista.length) return h + '<div class="vacio"><b>Todavía no hay ninguno</b>Cuando revises un carrusel y pulses «Marcar hecho», aparece aquí.</div>';
  return h + '<div class="est-rejilla">' + lista.map(c => '<article class="est-tarjeta">' + mini(c, 0) +
    '<div class="est-tcuerpo"><h4>' + esc(c.titulo || '(sin título)') + '</h4>' +
    '<div class="est-tmeta"><span>' + esc(nombrePl(c.plantilla)) + ' · ' + esc(nombreCo(c.color)) + ' · ' + c.slides.length + ' slides</span>' +
      (c.fecha ? '<span>' + esc(fCorta(c.fecha)) + '</span>' : '') + '</div>' +
    '<div class="est-tpie"><button class="btn pri" data-est-abrir="' + c.id + '">Abrir</button>' +
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
  if (b) b.textContent = n ? 'Producir · ' + n : 'Producir';
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
      '<select id="est-e-co" aria-label="Color">' + EST_COLORES.map(x => '<option value="' + x.id + '"' + (c.color === x.id ? ' selected' : '') + '>' + esc(x.nombre) + '</option>').join('') + '</select>' +
      '<button class="btn" id="est-descargar">Descargar slides</button>' +
      '<button class="btn ' + (c.estado === 'hecho' ? 'hecho on' : 'pri') + '" id="est-hecho">' + (c.estado === 'hecho' ? '✓ Hecho' : 'Marcar hecho') + '</button>' +
    '</div><div class="est-ecuerpo"><div class="est-escena">' +
      '<div class="est-grande">' + mini(c, EST.sel) + '</div>' +
      '<div class="est-tira">' + c.slides.map((x, i) => mini(c, i, {boton: 'data-est-sel="' + i + '" aria-current="' + (i === EST.sel) + '" aria-label="Slide ' + (i + 1) + '"'})).join('') + '</div>' +
    '</div><div class="est-panel" id="est-panel"></div></div>';
  }
  const tipo = s.tipo || 'contenido';
  let p = '<h3>Slide ' + (EST.sel + 1) + ' de ' + c.slides.length + '</h3>' +
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
  if (tipo === 'dato' && !s.fuente) p += '<div class="est-avisos">Una cifra sin fuente no se publica. Cópiala de la pestaña Datos.</div>';
  p += '<h3>Añadir slide</h3><div class="est-fila">' + Object.keys(EST_TIPOS).map(k => '<button class="btn mini" data-est-nueva="' + k + '">+ ' + EST_TIPOS[k] + '</button>').join('') + '</div>';
  p += '<h3>Texto del post</h3><div class="est-campos"><textarea data-est-copy rows="6">' + esc(c.copy || '') + '</textarea>' +
    '<button class="btn mini" data-est-copiar="' + c.id + '">Copiar texto del post</button></div>';
  if (!campoActivo) $('#est-panel').innerHTML = p;
  pintarMinis(ed);
}
let estTempo, estVista;
function editarCampo(k, v) {
  const c = EST.lista[EST.abierto]; if (!c) return;
  const s = c.slides[EST.sel]; if (!s) return;
  if (k === 'items') s.items = v.split('\n').map(x => x.trim()).filter(Boolean);
  else if (v === '') delete s[k]; else s[k] = v;
  c.upd = new Date().toISOString();
  clearTimeout(estVista); estVista = setTimeout(() => pintarMinis($('#est-editor')), 250);
  clearTimeout(estTempo); estTempo = setTimeout(() => guardarC(c), 600);
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
    const url = await EST_H2I.toPng(nodo, {width: 1080, height: 1350, pixelRatio: 1, cacheBust: false, fontEmbedCSS: fuentes});
    return await (await fetch(url)).blob();
  } finally { f.remove(); }
}
async function descargar(c) {
  const down = DOWN || (typeof claude !== 'undefined' && claude.use ? await claude.use('downloads') : null);
  if (!down) { toast('La descarga no está disponible en esta vista'); return; }
  const base = (c.titulo || 'carrusel').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'carrusel';
  for (let i = 0; i < c.slides.length; i++) {
    toast('Preparando la slide ' + (i + 1) + ' de ' + c.slides.length + '…');
    try {
      const blob = await pngDe(c, i);
      await down.save({filename: base + '-' + String(i + 1).padStart(2, '0') + '.png', data: blob});
    } catch (e) {
      if (e && e.code === 'declined') { toast('Descarga cancelada'); return; }
      toast('No he podido descargar la slide ' + (i + 1) + (e && e.code ? ' (' + e.code + ')' : '')); return;
    }
  }
  if (c.copy) { try { await down.save({filename: base + '-texto.txt', data: c.copy}); } catch (e) {} }
  toast('Slides descargadas');
}

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
    ? '<button class="btn pri" data-ir="producir">Ver en Producir</button>'
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
  if (pr) { e.stopImmediatePropagation(); const n = mandarAProducir([pr.dataset.producir]);
    toast(n ? 'En la mesa de Producir' : 'Ya estaba en Producir'); render(); return; }
  if (t.id === 'est-producir-filtradas') { const n = mandarAProducir(filtradas().map(i => i.id));
    toast(n ? n + ' ideas en la mesa de Producir' : 'Ya estaban todas en Producir'); render(); return; }
  const pl = t.closest('[data-est-pl]'); if (pl) { EST.plantilla = pl.dataset.estPl; guardarEstilo(); refrescarEstudio(); return; }
  const co = t.closest('[data-est-co]'); if (co) { EST.color = co.dataset.estCo; guardarEstilo(); refrescarEstudio(); return; }
  if (t.id === 'est-anadir-temas') {
    const temas = $('#est-temas').value.split('\n').map(x => x.trim()).filter(Boolean);
    if (!temas.length) { toast('Escribe al menos un tema'); return; }
    temas.forEach(x => nuevoC({tema: x, titulo: x})); $('#est-temas').value = '';
    toast(temas.length === 1 ? 'Tema añadido' : temas.length + ' temas añadidos'); refrescarEstudio(); return; }
  if (t.id === 'est-generar-todas') { generarTodas(); return; }
  const ge = t.closest('[data-est-generar]'); if (ge) { generar(ge.dataset.estGenerar); return; }
  const qu = t.closest('[data-est-quitar]');
  if (qu) { if (qu.dataset.seguro) { borrarC(qu.dataset.estQuitar); refrescarEstudio(); toast('Quitado'); }
    else { qu.dataset.seguro = '1'; qu.textContent = '¿Quitar?'; setTimeout(() => { if (qu.isConnected) { delete qu.dataset.seguro; qu.textContent = '✕'; } }, 3000); }
    return; }
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
  if (t.id === 'est-hecho') {
    if (c.estado === 'hecho') { c.estado = 'borrador'; guardarC(c); toast('Vuelve a Producir'); pintarEditor(true); return; }
    c.estado = 'hecho'; c.fecha = fISO(hoy()); guardarC(c);
    if (c.idea && IMAP[c.idea]) guardar(c.idea, {hecho: true, fecha: c.fecha});
    toast('Hecho. Lo tienes en «Hechos»'); pintarEditor(true); return; }
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
function guardarEstilo() { try { localStorage.setItem('explora.estilo', JSON.stringify({plantilla: EST.plantilla, color: EST.color})); } catch (e) {} }

conectarEstudio();
