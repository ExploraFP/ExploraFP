/* ===================== Estáticos para ADS (22/10/2026, Sandra) — Beta =====================
   · Normales: UNA pieza que sale en dos formatos, 1:1 y vertical (se descargan los dos PNG).
   · Dinámicos: solo vertical. La misma pieza con una animación corta (zoom del fondo, golpe o tachado) que acaba quieta,
     sin guion ni persona. Se descarga como vídeo .mp4 hecho en el navegador (H.264 si el navegador puede; si no, VP9).
   · Plantillas propias (plantillas/estaticos.css): Foto · Bloque · Titular. Las fotos salen de la Galería.
   · Claude escribe etiqueta, titular, subtítulo, botón y gancho a partir de un tema (`EST.sample`, con la voz de marca).
   Datos: colección `estaticos` del db. */
var ES = {filtro: 'todos', tab: 'normal', lista: {}, abierto: null, listo: false, guarda: {}, pidiendo: false, haciendo: false, fq: ''};
// «Tarjeta» (23/10/2026) es la de los dinámicos del equipo (tarjeta.js); las otras tres siguen como opción
const ES_PLANTILLAS = [['tarjeta', 'Tarjeta'], ['foto', 'Foto'], ['bloque', 'Bloque'], ['titular', 'Titular']];
const TJ_TEXTOS = [['etiqueta', 'Encima del titular', 'Formación Profesional'], ['titulo', 'Titular', 'Doble grado'], ['ciclos', 'Ciclos (uno por línea, en lima)', 'Laboratorio Clínico y Biomédico'],
  ['beneficio', 'Beneficio', 'Prácticas aseguradas en hospitales y laboratorios.'], ['cta', 'Botón', '¡Quiero info!'], ['pegatina', 'Pegatina', '100% ONLINE']];
const ES_ANIM = [['zoom', 'Zoom', 'el fondo se acerca y el texto entra'], ['golpe', 'Golpe', 'la frase del gancho gigante y luego la pieza'],
  ['tachado', 'Tachado', 'el gancho tachado y después la verdad']];
const ES_TEXTOS = [['etiqueta', 'Etiqueta', 'FP online'], ['titulo', 'Titular', 'Estudia *sin dejar* tu trabajo'], ['subtitulo', 'Subtítulo', 'Título oficial, a tu ritmo.'],
  ['cta', 'Botón', 'Infórmate gratis'], ['gancho', 'Gancho (dinámicos)', '¿Sin la ESO?']];
const ES_FPS = 25, ES_SEG = 6;
// Etapas (23/10/2026): Sandra sube los estáticos a Drive y los publica otra persona → el final es «Subido a Drive»
const ES_ETAPAS = [['borrador', 'Borrador'], ['listo', 'Listo'], ['subido', 'Subido a Drive']];
const esEtapa = e => ES_ETAPAS.some(x => x[0] === e.etapa) ? e.etapa : 'borrador';
const esPill = e => '<span class="gu-etapa g-' + {borrador: 'borrador', listo: 'grabar', subido: 'publicado'}[esEtapa(e)] + '">' + ES_ETAPAS.find(x => x[0] === esEtapa(e))[1] + '</span>';
try { const t = localStorage.getItem('estaticos.tab'); if (t === 'normal' || t === 'dinamico') ES.tab = t; } catch (e) {}

const esCod = e => e && e.num ? 'E' + String(e.num).padStart(2, '0') : '';
const esFotos = () => (typeof fotosCatalogo === 'function' ? fotosCatalogo().filter(f => !f.oculta) : FOTOS);
const esNombre = e => (e.titulo || 'estatico').replace(/\*/g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'estatico';

/* ---------- datos ---------- */
function esConectar() {
  const db = guDb(); if (!db) return setTimeout(esConectar, 1200);
  db.collection('estaticos').onSnapshot(snap => {
    const m = {};
    snap.docs.forEach(d => { const v = d.data(); if (v) m[d.id] = Object.assign({id: d.id}, v); });
    Object.keys(ES.lista).forEach(id => { const loc = ES.lista[id]; if (m[id] && loc.upd && m[id].upd && m[id].upd < loc.upd) m[id] = loc; });
    ES.lista = m; ES.listo = true;
    if (CNT.sec === 'estaticos') esPintar(false);
    if (typeof cntPintarInicio === 'function') cntPintarInicio();
  }, () => { ES.listo = true; });
}
function esGuardar(e) {
  e.upd = new Date().toISOString(); ES.lista[e.id] = e;
  const limpio = JSON.parse(JSON.stringify(e)); delete limpio.id;
  const db = guDb(); if (db) db.doc('estaticos/' + e.id).set(limpio).catch(x => toast('No he podido guardar (' + (x && x.code || 'error') + ')'));
}
function esNuevo(tipo) {
  const num = Object.values(ES.lista).reduce((m, x) => Math.max(m, +x.num || 0), 0) + 1;
  const f = esFotos()[0];
  // por defecto, la Tarjeta (la de los anuncios del equipo); las otras plantillas guardan sus textos por si se cambia
  const e = {id: 'E' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), num: num, tipo: tipo, plantilla: 'tarjeta', color: 'verde01', fondo: 'cuadricula',
    anim: 'zoom', foto: f ? f.ruta : '', etiqueta: 'Formación Profesional', titulo: 'Grado superior', ciclos: '', beneficio: 'Título oficial, 100% online y a tu ritmo.',
    subtitulo: 'Título oficial, a tu ritmo.', cta: '¡Quiero info!', pegatina: '100% ONLINE', gancho: '', creado: new Date().toISOString()};
  esGuardar(e); return e;
}

/* ---------- la pieza ---------- */
function esCuerpo(e, formato, animar) {
  if (e.plantilla === 'tarjeta') return tjCuerpo(e, formato);
  const fmt2 = t => esc(t || '').trim().replace(/\*(.+?)\*/g, '<em>$1</em>');
  const pl = ES_PLANTILLAS.some(p => p[0] === e.plantilla) ? e.plantilla : 'foto';
  const logo = 'logos/' + (pl === 'titular' ? LOGO_FONDO[e.color] || 'Verde 03' : 'Blanco').toLowerCase().replace(/\s+/g, '-') + '.webp';
  const dinamico = e.tipo === 'dinamico' && formato === 'vertical';
  const anim = dinamico ? e.anim || 'zoom' : '';
  const foto = e.foto ? '<img src="' + esc(e.foto) + '" alt="">' : '';
  const caja = '<div class="es-caja">' + (anim === 'tachado' && e.gancho ? '<span class="mito">' + esc(e.gancho.replace(/\*/g, '')) + '</span>' : '') +
    (e.etiqueta ? '<span class="es-pastilla">' + esc(e.etiqueta) + '</span>' : '') + '<h1 class="titulo">' + fmt2(e.titulo) + '</h1>' +
    (e.subtitulo ? '<p class="sub">' + fmt2(e.subtitulo) + '</p>' : '') + (pl === 'titular' && e.cta ? '<i class="es-flecha"></i>' : '') +
    (e.cta ? '<span class="boton">' + esc(e.cta) + ' <b>→</b></span>' : '') + '</div>';
  const fondo = pl === 'foto' ? '<div class="fondo">' + foto + '</div><div class="es-velo"></div>' : pl === 'bloque' ? '<div class="es-foto">' + foto + '</div>' : '<div class="rejilla"></div>';
  const capa = anim === 'golpe' && e.gancho ? '<div class="gancho-capa"><span>' + fmt2(e.gancho) + '</span></div>' : '';
  return '<section class="pieza p-' + pl + ' c-' + (e.color || 'verde01') + (anim ? ' anim a-' + anim : '') + '">' + fondo + '<img class="es-logo" src="' + logo + '" alt="Explora × Ucademy">' + caja + capa + '</section>';
}
// el titular encoge hasta que la caja no se corta (como la cifra del carrusel)
const ES_AJUSTE = '<script>document.fonts.ready.then(function(){var tt=document.querySelector(".tj-titulo");if(tt){var g=parseFloat(getComputedStyle(tt).fontSize),m=0;while(tt.scrollWidth>tt.clientWidth+2&&g>48&&m++<30){g-=4;tt.style.fontSize=g+"px"}}var c=document.querySelector(".es-caja"),t=document.querySelector(".titulo");' +
  'if(c&&t){var f=parseFloat(getComputedStyle(t).fontSize),n=0;while(c.scrollHeight>c.clientHeight+2&&f>56&&n++<40){f-=4;t.style.fontSize=f+"px"}}' +
  'document.body.setAttribute("data-listo","1")})<\/script>';
function esDoc(e, formato, opc) {
  opc = opc || {};
  const k = opc.exportar ? (CSS_EXP || MOTOR_CSS) : MOTOR_CSS;
  return '<!doctype html><html class="f-' + formato + (opc.quieto ? ' quieto' : '') + '"><head><meta charset="utf-8">' + EST_BASE +
    '<style>' + k.base + k.colores + k.mascaras + k.estaticos + '</style></head><body>' + esCuerpo(e, formato) + ES_AJUSTE + '</body></html>';
}
function esMini(e, formato, opc) {
  return '<div class="es-mini es-' + formato + '"><iframe tabindex="-1" title="Vista ' + (formato === 'vertical' ? 'vertical' : '1:1') + '" data-es="' + esc(e.id) + '" data-fmt="' + formato + '"' +
    (opc && opc.quieto ? ' data-quieto="1"' : '') + '></iframe></div>';
}
function esPintarMinis(raiz) {
  (raiz || document).querySelectorAll('.es-mini iframe').forEach(f => {
    const e = ES.lista[f.dataset.es]; if (!e) return;
    const doc = esDoc(e, f.dataset.fmt, {quieto: !!f.dataset.quieto});
    if (f._doc !== doc) { f.srcdoc = doc; f._doc = doc; }
    esEscalar(f.parentElement); if (ES_RO) ES_RO.observe(f.parentElement);
  });
}
function esEscalar(caja) { const f = caja && caja.querySelector('iframe'), w = caja && caja.clientWidth; if (f && w) f.style.transform = 'scale(' + (w / 1080) + ')'; }
const ES_RO = typeof ResizeObserver === 'function' ? new ResizeObserver(es => es.forEach(x => esEscalar(x.target))) : null;

/* ---------- pintar ---------- */
function esPintar(todo) {
  const sec = document.getElementById('cnt-estaticos'); if (!sec || CNT.sec !== 'estaticos') return;
  const act = document.activeElement;
  if (!todo && ES.abierto && act && sec.contains(act) && /^(TEXTAREA|INPUT)$/.test(act.tagName)) return;
  const y = sec.scrollTop;
  sec.innerHTML = '<nav class="gu-barra" aria-label="Pestañas de Estáticos">' +
    [['normal', 'Normales'], ['dinamico', 'Dinámicos']].map(([k, t]) => '<button type="button" data-es-tab="' + k + '" aria-current="' + (ES.tab === k && !ES.abierto) + '">' + t + '</button>').join('') +
    '</nav>' +
    '<div class="gu-cuerpo">' + (ES.abierto && ES.lista[ES.abierto] ? esEditor(ES.lista[ES.abierto]) : esVLista()) + '</div>';
  sec.scrollTop = todo ? 0 : y;
  esPintarMinis(sec);
}
function esVLista() {
  const deTipo = Object.values(ES.lista).filter(e => (e.tipo || 'normal') === ES.tab);
  const lista = deTipo.filter(e => ES.filtro === 'todos' || esEtapa(e) === ES.filtro)
    .sort((a, b) => ES_ETAPAS.findIndex(x => x[0] === esEtapa(a)) - ES_ETAPAS.findIndex(x => x[0] === esEtapa(b)) || String(b.upd || '').localeCompare(String(a.upd || '')));
  const din = ES.tab === 'dinamico';
  let h = '<div class="gu-acciones"><button class="btn pri" id="es-nuevo">+ Nuevo ' + (din ? 'dinámico' : 'estático') + '</button>' +
    '<span class="est-pista">' + (din ? 'Vídeo vertical de 6–8 s: el fondo se mueve y la pieza entra. Sin guion ni persona.' : 'Una pieza, dos formatos: 1:1 y vertical.') + '</span></div>';
  h += '<div class="mz-vistas gu-filtros" role="tablist" aria-label="Filtrar por etapa">' +
    [['todos', 'Todos', deTipo.length]].concat(ES_ETAPAS.map(([k, t]) => [k, t, deTipo.filter(e => esEtapa(e) === k).length]))
      .map(([k, t, n]) => '<button class="mz-vista" data-es-filtro="' + k + '" aria-pressed="' + (ES.filtro === k) + '">' + t + ' <span>' + n + '</span></button>').join('') + '</div>';
  if (!ES.listo && guDb()) return h + '<p class="cnt-cargando">Cargando…</p>';
  if (!deTipo.length) return h + '<div class="vacio"><b>Todavía no hay ' + (din ? 'dinámicos' : 'estáticos') + '</b>Crea el primero con «+ Nuevo».</div>';
  if (!lista.length) return h + '<p class="pr-vacio">Ninguno.</p>';
  return h + '<div class="es-rejilla' + (din ? ' din' : '') + '">' + lista.map(e => '<button type="button" class="es-tarjeta" data-es-abrir="' + esc(e.id) + '">' +
    esMini(e, din ? 'vertical' : 'cuadrado', {quieto: true}) + '<span class="es-tt"><span class="pr-cod">' + esCod(e) + '</span><b>' + esc(String(e.titulo || '(sin titular)').replace(/\*/g, '')) + '</b></span><span class="es-tt es-tmeta">' + regChips(e) + esPill(e) + '</span></button>').join('') + '</div>';
}
function esEditor(e) {
  const din = e.tipo === 'dinamico', tj = e.plantilla === 'tarjeta';
  const chips = (lista, campo) => '<div class="es-chips">' + lista.map(([k, t, p]) => '<button type="button" data-es-set="' + campo + '" data-v="' + k + '" aria-pressed="' + (e[campo] === k) + '"' + (p ? ' title="' + esc(p) + '"' : '') + '>' + t + '</button>').join('') + '</div>';
  const colores = '<div class="es-chips es-colores">' + EST_COLORES_ELEGIBLES.map(c => '<button type="button" data-es-set="color" data-v="' + c.id + '" aria-pressed="' + (e.color === c.id) + '" title="' + esc(c.nombre) + '"><i style="background:' + c.hex + '"></i>' + esc(c.nombre) + '</button>').join('') + '</div>';
  const fotoAct = e.foto && esFotos().find(f => f.ruta === e.foto);
  return '<div class="gu-ecab"><button type="button" class="eb-icono" id="es-volver" aria-label="Volver" title="Volver">←</button>' +
    '<div class="gu-etit"><b class="es-etit">' + esc(String(e.titulo || '(sin titular)').replace(/\*/g, '')) + '</b><div class="eb-meta"><span class="eb-cod">' + esCod(e) + '</span><span>' + (din ? 'Dinámico · vertical' : 'Estático · 1:1 y vertical') + '</span><span id="es-guardado"></span></div></div>' +
    esPasos(e) + '<div class="gu-eder">' + (din ? '<button type="button" class="eb-sec" id="es-otra">↻ Ver otra vez</button>' : '') +
    '<button type="button" class="' + (esEtapa(e) === 'borrador' ? 'eb-sec' : 'eb-pri') + '" id="es-bajar"' + (ES.haciendo ? ' disabled' : '') + '>' + (ES.haciendo ? esc(ES.haciendo) : din ? 'Descargar vídeo' : 'Descargar los 2 PNG') + '</button>' +
    (esEtapa(e) === 'borrador' ? '<button type="button" class="eb-pri" data-es-paso="listo">Listo ✓</button>' : esEtapa(e) === 'listo' ? '<button type="button" class="eb-sec" data-es-paso="subido">Ya está en Drive</button>' : '') + '</div></div>' +
    '<div class="es-ecuerpo"><div class="es-vistas' + (din ? ' din' : '') + '">' +
      (din ? '<figure>' + esMini(e, 'vertical') + '<figcaption>Vertical · ' + (e.plantilla === 'tarjeta' ? TJ_SEG : ES_SEG) + ' s</figcaption></figure>'
        : '<figure>' + esMini(e, 'cuadrado') + '<figcaption>1:1</figcaption></figure><figure>' + esMini(e, 'vertical') + '<figcaption>Vertical</figcaption></figure>') +
    '</div><aside class="es-panel">' +
      regFicha('e', e) + (esEtapa(e) === 'subido' ? '<label class="es-campo"><span>Enlace de Drive (opcional)</span><input data-es-campo="drive" value="' + esc(e.drive || '') + '" placeholder="https://drive.google.com/…"></label>' : '') +
      '<h3>Diseño</h3>' + chips(ES_PLANTILLAS, 'plantilla') + (tj ? '<h3>Fondo</h3>' + chips(TJ_FONDOS.map(f => [f[0], f[1], f[2]]), 'fondo') : colores) +
      (din && !tj ? '<h3>Animación</h3>' + chips(ES_ANIM, 'anim') + '<p class="es-pista">' + esc((ES_ANIM.find(a => a[0] === e.anim) || ES_ANIM[0])[2]) + (e.anim !== 'zoom' && !e.gancho ? '. Escribe el gancho abajo.' : '') + '</p>' : '') +
      (e.plantilla !== 'titular' && !tj ? '<h3>Foto</h3><div class="pr-fotoact">' + (e.foto ? '<img src="' + esc(e.foto) + '" alt="">' : '<span class="pr-sinfoto">Sin foto</span>') +
        '<div><p>' + esc(fotoAct ? fotoAct.desc || 'Foto' : e.foto ? 'Foto' : 'Elige una de la Galería') + '</p><button type="button" class="btn mini" id="es-fotos">' + (e.foto ? 'Cambiar foto' : 'Poner foto') + '</button></div></div>' : '') +
      '<h3>Textos</h3>' + (tj ? TJ_TEXTOS : ES_TEXTOS.filter(t => t[0] !== 'gancho' || din)).map(([k, t, p]) => '<label class="es-campo"><span>' + t + '</span>' +
        (k === 'ciclos' ? '<textarea data-es-campo="ciclos" rows="3" placeholder="' + esc(p) + '">' + esc(e[k] || '') + '</textarea>' : '<input data-es-campo="' + k + '" value="' + esc(e[k] || '') + '" placeholder="' + esc(p) + '">') + '</label>').join('') +
      '<p class="es-pista">*palabra* la resalta.</p>' +
      '<h3>Claude</h3><div class="gu-chat-caja"><textarea id="es-pide" rows="2" placeholder="Tema del anuncio: «FP sin la ESO», «homologación»… y lo escribe"' + (ES.pidiendo ? ' disabled' : '') + '></textarea>' +
        '<button type="button" class="btn pri" id="es-enviar"' + (ES.pidiendo || !EST.sample ? ' disabled' : '') + '>' + (ES.pidiendo ? '…' : '↑') + '</button></div>' +
      (e.respuesta ? '<p class="es-pista">' + esc(e.respuesta) + '</p>' : '') + (EST.sample ? '' : '<p class="es-pista">Para usar Claude abre la web en claude.ai.</p>') +
      '<button type="button" class="linkbtn peligro" id="es-borrar">Borrar</button>' +
    '</aside></div>';
}

function esPasos(e) {
  const ahora = ES_ETAPAS.findIndex(x => x[0] === esEtapa(e));
  return '<ol class="eb-pasos" aria-label="Etapa">' + ES_ETAPAS.map(([k, t], i) => '<li><button type="button" data-es-paso="' + k + '" class="' + (i < ahora ? 'hecho' : i === ahora ? 'actual' : '') + '"' +
    (i === ahora ? ' aria-current="step"' : '') + '>' + (i < ahora ? '✓ ' : '') + t + '</button></li>').join('') + '</ol>';
}

/* ---------- Claude ---------- */
function esPrompt(e, tema) {
  const L = ['Escribes anuncios estáticos de Meta (Instagram/Facebook) para Explora (FP online oficial de Ucademy). Responde SOLO con JSON válido.', ''];
  if (typeof VOZ !== 'undefined' && VOZ) { L.push(VOZ.trim()); L.push(''); }
  L.push('PALABRAS PROHIBIDAS: «profesor» (es guía), «lección/unidad» (expedición), «aula» (terreno), «matricúlate» (trazar mi ruta), «FCT» (formación en empresa).');
  L.push('REGLAS: se lee en 2 segundos mientras se hace scroll. Minúsculas salvo la inicial y siglas (FP, ESO). Nada de emojis. NO inventes cifras, precios, plazos ni porcentajes.');
  L.push('- "etiqueta": 1-3 palabras (p. ej. «FP online», «Grado superior»).');
  L.push('- "titulo": máximo 7 palabras; rodea con asteriscos UNA palabra o expresión corta para resaltarla.');
  L.push('- "subtitulo": máximo 12 palabras, lo que hace creíble el titular (título oficial, a tu ritmo, con guía…).');
  L.push('- "cta": 2-4 palabras, una sola acción («Infórmate gratis», «Traza tu ruta», «Pide información»).');
  L.push('- "beneficio": una línea (máx. 10 palabras) con lo que hace creíble el anuncio (prácticas, título oficial, a tu ritmo…).');
  L.push('- "gancho": 2-5 palabras para el arranque del vídeo: una pregunta o la frase falsa que luego se desmiente («¿Sin la ESO?», «Online no vale»).');
  L.push(''); L.push('ANUNCIO ACTUAL: ' + JSON.stringify({etiqueta: e.etiqueta, titulo: e.titulo, subtitulo: e.subtitulo, cta: e.cta, gancho: e.gancho}));
  L.push('PETICIÓN DE SANDRA: ' + tema);
  L.push('Devuelve {"respuesta": "una frase de lo que has hecho", "etiqueta": "...", "titulo": "...", "subtitulo": "...", "beneficio": "...", "cta": "...", "gancho": "..."}.');
  return L.join('\n');
}
async function esPedir() {
  const e = ES.lista[ES.abierto], t = document.getElementById('es-pide'); if (!e || !t || ES.pidiendo) return;
  const tema = t.value.trim(); if (!tema) { toast('Escribe el tema o el cambio que quieres'); t.focus(); return; }
  if (!EST.sample) { toast('Para usar Claude abre la web en claude.ai'); return; }
  ES.pidiendo = true; esPintar(true);
  try {
    const r = await EST.sample.json(esPrompt(e, tema), {modelTier: 'default'});
    ['etiqueta', 'titulo', 'subtitulo', 'beneficio', 'cta', 'gancho'].forEach(k => { if (r && typeof r[k] === 'string') e[k] = r[k].trim(); });
    e.respuesta = String(r && r.respuesta || 'Hecho.');
  } catch (x) { e.respuesta = 'No ha salido bien (' + (x && (x.code || x.message) || 'error') + '). Prueba otra vez.'; }
  ES.pidiendo = false; esGuardar(e); esPintar(true);
}

/* ---------- descargar: PNG (normales) y vídeo (dinámicos) ---------- */
async function esMarco(e, formato, opc) {
  await prepararExportacion();
  const f = document.createElement('iframe'); f.className = 'est-exportar es-exportar-' + formato; document.body.appendChild(f);
  await new Promise(ok => { f.onload = ok; f.srcdoc = esDoc(e, formato, Object.assign({exportar: true}, opc)); });
  const d = f.contentDocument;
  for (let t = 0; t < 100 && !d.body.getAttribute('data-listo'); t++) await new Promise(r => setTimeout(r, 50));
  await Promise.all([].map.call(d.images, im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  await d.fonts.ready;
  return f;
}
const esFuentes = () => ((CSS_EXP || MOTOR_CSS).base.match(/@font-face\s*\{[^}]*\}/g) || []).join('\n');
async function esPng(e, formato) {
  EST_H2I = EST_H2I || await cargarScript('https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js', 'htmlToImage');
  const f = await esMarco(e, formato, {quieto: true});
  try { return await EST_H2I.toBlob(f.contentDocument.querySelector('.pieza'), {width: 1080, height: formato === 'vertical' ? 1920 : 1080, pixelRatio: 1, cacheBust: false, fontEmbedCSS: esFuentes()}); }
  finally { f.remove(); }
}
async function esVideo(e, avance) {
  if (typeof VideoEncoder === 'undefined') throw {message: 'este navegador no puede crear vídeo (prueba con Chrome o Safari actualizados)'};
  EST_H2I = EST_H2I || await cargarScript('https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js', 'htmlToImage');
  const M = await cargarScript('https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.js', 'Mp4Muxer');
  const W = 1080, H = 1920, base = {width: W, height: H, bitrate: 8e6, framerate: ES_FPS};
  let codec = null, muxCodec = null;
  for (const [c, m] of [['avc1.640028', 'avc'], ['avc1.4d0028', 'avc'], ['avc1.42003e', 'avc'], ['vp09.00.40.08', 'vp9']]) {
    try { if ((await VideoEncoder.isConfigSupported(Object.assign({codec: c}, base))).supported) { codec = c; muxCodec = m; break; } } catch (x) {}
  }
  if (!codec) throw {message: 'este navegador no puede codificar vídeo'};
  const mux = new M.Muxer({target: new M.ArrayBufferTarget(), video: {codec: muxCodec, width: W, height: H}, fastStart: 'in-memory'});
  let fallo = null;
  const enc = new VideoEncoder({output: (ch, meta) => mux.addVideoChunk(ch, meta), error: x => { fallo = x; }});
  enc.configure(Object.assign({codec: codec}, base, muxCodec === 'avc' ? {avc: {format: 'avc'}} : {}));
  const f = await esMarco(e, 'vertical');
  try {
    const d = f.contentDocument, nodo = d.querySelector('.pieza');
    // La librería que hace la foto copia la pieza y su animación vuelve a empezar en la copia. Para congelar cada fotograma:
    // animación en pausa y retraso NEGATIVO (= tiempo ya pasado), escritos en una hoja de estilo que se reescribe en cada fotograma.
    const segs = v => String(v).split(',').map(x => parseFloat(x) * (/ms/.test(x) ? .001 : 1));
    const quietas = [];
    [].forEach.call(d.querySelectorAll('*'), (el, k) => {
      const a = d.defaultView.getComputedStyle(el), b = d.defaultView.getComputedStyle(el, '::after');
      if (a.animationName !== 'none') { el.setAttribute('data-k', k); quietas.push({sel: '[data-k="' + k + '"]', ret: segs(a.animationDelay)}); }
      if (b.animationName && b.animationName !== 'none') { el.setAttribute('data-k', k); quietas.push({sel: '[data-k="' + k + '"]::after', ret: segs(b.animationDelay)}); }
    });
    const hoja = d.createElement('style'); d.head.appendChild(hoja);
    const total = ES_FPS * (e.plantilla === 'tarjeta' ? TJ_SEG : ES_SEG), lienzo = document.createElement('canvas'); lienzo.width = W; lienzo.height = H;
    const ctx = lienzo.getContext('2d'), fuentes = esFuentes();
    for (let i = 0; i < total; i++) {
      if (fallo) throw fallo;
      const ms = i * 1000 / ES_FPS;
      hoja.textContent = quietas.map(q => q.sel + '{animation-play-state:paused!important;animation-delay:' + q.ret.map(r => (r - ms / 1000).toFixed(3) + 's').join(',') + '!important}').join('\n');
      await new Promise(r => requestAnimationFrame(r));
      const img = await EST_H2I.toCanvas(nodo, {width: W, height: H, pixelRatio: 1, cacheBust: false, fontEmbedCSS: fuentes});
      ctx.drawImage(img, 0, 0, W, H);
      const vf = new VideoFrame(lienzo, {timestamp: Math.round(ms * 1000), duration: Math.round(1e6 / ES_FPS)});
      enc.encode(vf, {keyFrame: i % (ES_FPS * 2) === 0}); vf.close();
      while (enc.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 10));
      if (avance) avance(i + 1, total);
    }
    await enc.flush(); if (fallo) throw fallo;
    mux.finalize();
    return {blob: new Blob([mux.target.buffer], {type: 'video/mp4'}), codec: muxCodec};
  } finally { f.remove(); try { enc.close(); } catch (x) {} }
}
async function esDescargar(e) {
  if (ES.haciendo) return;
  const down = DOWN || (typeof claude !== 'undefined' && claude.use ? await claude.use('downloads') : null);
  if (!down) { toast('La descarga no está disponible en esta vista'); return; }
  const base = regNombre(e, esCod(e));   // nombre estándar: E03_dam_titulo (23/10/2026)
  const paso = t => { ES.haciendo = t; const b = document.getElementById('es-bajar'); if (b) { b.textContent = t; b.disabled = true; } };
  try {
    if (e.tipo === 'dinamico') {
      paso('Preparando el vídeo…');
      const r = await esVideo(e, (i, n) => paso('Creando vídeo ' + Math.round(i * 100 / n) + ' %'));
      paso('Descargando…');
      await guardarArchivo(down, base + '_vertical.mp4', r.blob);
      toast(r.codec === 'avc' ? '✓ Vídeo descargado (.mp4)' : '✓ Vídeo descargado. Tu navegador lo ha hecho en VP9: si Meta no lo acepta, descárgalo desde Chrome');
    } else {
      paso('Creando 1:1…'); const a = await esPng(e, 'cuadrado');
      paso('Creando vertical…'); const b = await esPng(e, 'vertical');
      await guardarArchivo(down, base + '_1x1.png', a);
      await new Promise(r => setTimeout(r, 1200));
      await guardarArchivo(down, base + '_vertical.png', b);
      toast('✓ Descargados los 2 formatos');
    }
  } catch (x) {
    toast(x && x.code === 'declined' ? 'Descarga cancelada' : 'No he podido descargarlo' + (x && x.message ? ': ' + x.message : ''));
  } finally { ES.haciendo = false; esPintar(false); }
}

/* ---------- elegir foto de la Galería ---------- */
function esAbrirFotos() {
  const e = ES.lista[ES.abierto]; if (!e) return;
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja pr-fotomodal" role="dialog" aria-modal="true" aria-label="Elegir foto"><header><k>Galería</k><h2>Elige la foto</h2></header><div class="cuerpo">' +
    '<div class="pr-fbusca"><input type="search" id="es-fq" autocomplete="off" placeholder="Busca foto: portátil, sanidad…" value="' + esc(ES.fq) + '" aria-label="Buscar foto"></div>' +
    '<div class="est-fotos" id="es-fgrid">' + esGridFotos(e) + '</div></div><footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cerrar</button></footer></div>';
  setTimeout(() => { const i = $('#es-fq'); if (i) i.focus(); }, 30);
}
function esGridFotos(e) {
  const q = norm(ES.fq);
  const l = esFotos().filter(f => !q || norm([f.desc, f.rama, f.personas, f.tono].concat(f.etiquetas || []).join(' ')).indexOf(q) >= 0);
  return l.map(f => '<button data-es-foto="' + esc(f.ruta) + '" aria-pressed="' + (e.foto === f.ruta) + '" title="' + esc(f.desc || '') + '"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc || '') + '" loading="lazy"></button>').join('') ||
    '<p class="est-pista" style="grid-column:1/-1">Ninguna foto con esa búsqueda.</p>';
}

/* ---------- eventos ---------- */
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const tab = t.closest('[data-es-tab]'); if (tab) { ES.tab = tab.dataset.esTab; ES.abierto = null; try { localStorage.setItem('estaticos.tab', ES.tab); } catch (x) {} esPintar(true); return; }
  const fl = t.closest('[data-es-filtro]'); if (fl) { ES.filtro = fl.dataset.esFiltro; esPintar(false); return; }
  const ps = t.closest('[data-es-paso]'); if (ps) { const e = ES.lista[ES.abierto]; if (!e || esEtapa(e) === ps.dataset.esPaso) return;
    e.etapa = ps.dataset.esPaso; esGuardar(e); esPintar(false);
    toast(e.etapa === 'subido' ? '✓ Subido a Drive: ya está en el Directorio' : 'Ahora está en «' + ES_ETAPAS.find(x => x[0] === e.etapa)[1] + '»'); return; }
  if (t.closest('#es-nuevo')) { const e = esNuevo(ES.tab); ES.abierto = e.id; esPintar(true); return; }
  const ab = t.closest('[data-es-abrir]'); if (ab) { ES.abierto = ab.dataset.esAbrir; esPintar(true); return; }
  if (t.closest('#es-volver')) { ES.abierto = null; esPintar(true); return; }
  const st = t.closest('[data-es-set]'); if (st) { const e = ES.lista[ES.abierto]; if (!e) return; e[st.dataset.esSet] = st.dataset.v; esGuardar(e); esPintar(false); return; }
  if (t.closest('#es-fotos')) { esAbrirFotos(); return; }
  const fo = t.closest('[data-es-foto]'); if (fo) { const e = ES.lista[ES.abierto]; if (e) { e.foto = fo.dataset.esFoto; esGuardar(e); } cerrarPanel(); esPintar(false); return; }
  if (t.closest('#es-otra')) { document.querySelectorAll('#cnt-estaticos .es-vistas iframe').forEach(f => { f._doc = null; }); esPintarMinis(document.getElementById('cnt-estaticos')); return; }
  if (t.closest('#es-enviar')) { esPedir(); return; }
  if (t.closest('#es-bajar')) { const e = ES.lista[ES.abierto]; if (e) esDescargar(e); return; }
  if (t.closest('#es-borrar')) { const e = ES.lista[ES.abierto]; if (!e) return;
    $('#onb').hidden = false;
    $('#onb').innerHTML = '<div class="onbcaja ft-aviso-borrar" role="alertdialog" aria-modal="true" aria-labelledby="es-b-t"><div class="cuerpo"><h2 id="es-b-t">¿Borrar ' + esc(esCod(e)) + '?</h2><p>No se puede recuperar.</p></div>' +
      '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn ft-si" id="es-borrar-ok">Sí, borrar</button></footer></div>'; return; }
  if (t.closest('#es-borrar-ok')) { const id = ES.abierto; delete ES.lista[id]; const db = guDb(); if (db) db.doc('estaticos/' + id).delete().catch(() => {});
    ES.abierto = null; cerrarPanel(); esPintar(true); toast('Borrado'); return; }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'es-fq') { ES.fq = t.value; const g = $('#es-fgrid'), e = ES.lista[ES.abierto]; if (g && e) g.innerHTML = esGridFotos(e); return; }
  const k = t.dataset && t.dataset.esCampo, e = ES.lista[ES.abierto]; if (!k || !e) return;
  e[k] = t.value;
  const gd = document.getElementById('es-guardado'); if (gd) gd.textContent = 'Guardando…';
  clearTimeout(ES.guarda[e.id]);
  ES.guarda[e.id] = setTimeout(() => { esGuardar(e); esPintarMinis(document.getElementById('cnt-estaticos'));
    const x = document.getElementById('es-guardado'); if (x) x.textContent = '✓ Guardado';
    const tt = document.querySelector('.es-etit'); if (tt) tt.textContent = String(e.titulo || '(sin titular)').replace(/\*/g, ''); }, 500);
});
document.addEventListener('keydown', ev => { if (ev.target && ev.target.id === 'es-pide' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); esPedir(); } });
esConectar();

// al elegir la formación de una Tarjeta: rellena los ciclos (si están vacíos) y propone el fondo de su rama
function tjAlElegirForm(e) {
  if (!e || e.plantilla !== 'tarjeta') return;
  if (!e.ciclos) e.ciclos = tjCiclosDe(e.formacion);
  if (!e.fondoElegido) e.fondo = tjFondoDe(e.formacion);
}
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-es-set="fondo"]'); if (b) { const e = ES.lista[ES.abierto]; if (e) e.fondoElegido = true; } }, true);
