/* ===================== Contenidos (16/10/2026, pedido de Sandra) =====================
   Una sola herramienta con barra lateral izquierda: Carruseles y Newsletter, y lo que venga (guiones…).
   · Carruseles es esta misma web (no se mueve nada: mismo db, fotos y tareas programadas).
   · Newsletter vive en un marco aparte (newsletter.html, se carga al abrirla): así su código y sus estilos no chocan con
     los de Carruseles. Usa la misma base de datos (colecciones calendario, config y ejemplos) a través de window.claude del padre.
   · Para añadir una sección: una entrada en CNT_SECCIONES (+ su panel si no es Carruseles). */
// Iconos de siempre (Sandra, 19/10/2026: los de colores «se ven antiguos»; vuelven estos con algo más de profundidad en el CSS)
const CNT_ICONOS = {
  inicio: '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M8 21L22 9l14 12v14a2 2 0 0 1-2 2H26V27h-8v10H10a2 2 0 0 1-2-2z" fill="#EDFEC3"/></svg>',
  carruseles: '<svg viewBox="0 0 44 44" aria-hidden="true"><rect x="5" y="9" width="21" height="27" rx="3" fill="#4CCD4B" transform="rotate(-14 15 22)"/><rect x="12" y="7" width="21" height="27" rx="3" fill="#EDFEC3" transform="rotate(-3 22 20)"/><rect x="19" y="8" width="21" height="27" rx="3" fill="#fff" transform="rotate(9 29 21)"/><rect x="22.5" y="14" width="11" height="3.2" rx="1.6" fill="#366B40" transform="rotate(9 29 21)"/></svg>',
  imagenes: '<svg viewBox="0 0 44 44" aria-hidden="true"><rect x="6" y="9" width="32" height="26" rx="4" fill="#EDFEC3"/><circle cx="16" cy="18" r="4" fill="#4CCD4B"/><path d="M8 33l10-10 7 7 5-5 8 8" fill="#366B40"/></svg>',
  newsletter: '<svg viewBox="0 0 44 44" aria-hidden="true"><rect x="6" y="11" width="32" height="23" rx="4" fill="#EDFEC3"/><path d="M8 14l14 10 14-10" fill="none" stroke="#366B40" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="35" cy="12" r="5" fill="#4CCD4B"/></svg>',
  guiones: '<svg viewBox="0 0 44 44" aria-hidden="true"><rect x="6" y="15" width="32" height="21" rx="3" fill="#EDFEC3"/><path d="M6 15l30-7 1.4 5.6L7.5 20.5z" fill="#4CCD4B"/><path d="M13 13.4l4.2 4.6M21 11.5l4.2 4.6M29 9.7l4.2 4.6" stroke="#366B40" stroke-width="2.2" stroke-linecap="round"/><path d="M13 25h18M13 30h11" stroke="#366B40" stroke-width="2.6" stroke-linecap="round"/></svg>',
  directorio: '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M6 13a3 3 0 0 1 3-3h9l4 4h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#EDFEC3"/><rect x="11" y="19" width="9" height="11" rx="1.5" fill="#4CCD4B"/><path d="M24 21h10M24 25h10M24 29h6" stroke="#366B40" stroke-width="2.4" stroke-linecap="round"/></svg>',
  // Ajustes: icono de línea, sin cuadro (Sandra: el de antes «se ve muy antiguo»)
  ajustes: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
};
// 22/10/2026 (Sandra: la barra «parece muy arcaica», «quizá un emoji a cada uno»): emoji en vez de dibujos. Los dibujos se guardan
// en CNT_ICONOS_DIBUJO por si se quiere volver.
const CNT_ICONOS_DIBUJO = Object.assign({}, CNT_ICONOS);
Object.assign(CNT_ICONOS, {inicio: '🏠', carruseles: '🎠', newsletter: '💌', guiones: '🎬', estaticos: '🧩', imagenes: '🖼️', directorio: '🗂️', ajustes: '⚙️'});
// Imágenes es la pestaña «fotos» de Carruseles sacada a sección propia (común para todas; 16/10/2026)
const CNT_SECCIONES = [
  {id: 'carruseles', nombre: 'Carruseles'},
  {id: 'newsletter', nombre: 'Newsletter'},
  {id: 'guiones', nombre: 'Guiones', beta: true},
  {id: 'estaticos', nombre: 'Estáticos', beta: true},   // 22/10/2026 (estaticos.js): normales 1:1 + vertical y dinámicos (vídeo vertical)   // 22/10/2026 (guiones.js); «Beta» hasta que Sandra lo dé por bueno
  {id: 'imagenes', nombre: 'Galería'},   // antes «Imágenes» (Sandra, 22/10/2026); el id sigue siendo 'imagenes'
  {id: 'directorio', nombre: 'Directorio', beta: true, cerrada: true}   // 22/10/2026: se ve pero aún no se abre (directorio de creatividades)
];
const CNT = {sec: 'inicio', nl: null, cal: null};
try { const g = localStorage.getItem('contenidos.seccion'); if (g === 'inicio' || CNT_SECCIONES.some(s => s.id === g)) CNT.sec = g; } catch (e) {}

function cntMontar() {
  const lado = document.createElement('aside'); lado.id = 'cnt-lado'; lado.setAttribute('aria-label', 'Secciones');
  lado.innerHTML = '<button type="button" class="cnt-marca" data-cnt="inicio" title="Ir al inicio de Contenidos"><b>Contenidos</b><img src="logos/blanco.webp" alt="Explora × Ucademy"></button>' +
    '<nav class="cnt-nav">' +
      // en el móvil la marca no se ve: el Inicio va como primer botón de la barra de abajo
      '<button type="button" class="cnt-solo-movil" data-cnt="inicio" title="Inicio"><span class="cnt-ico">' + CNT_ICONOS.inicio + '</span><span class="cnt-txt">Inicio</span></button>' +
      CNT_SECCIONES.map(s => '<button type="button" ' + (s.cerrada ? 'data-cnt-cerrada="' + s.id + '" aria-disabled="true" class="cnt-cerrada" title="' + s.nombre + ': próximamente"' : 'data-cnt="' + s.id + '" title="' + s.nombre + '"') + '>' +
      '<span class="cnt-ico">' + (CNT_ICONOS[s.id] || '') + '</span><span class="cnt-txt">' + s.nombre + (s.beta ? ' <i class="cnt-beta">Beta</i>' : '') + '</span></button>').join('') + '</nav>';
  document.body.insertBefore(lado, document.body.firstChild);
  // Ajustes abajo del todo en la barra lateral (Sandra, 19/10/2026: el claro/oscuro ya no va en la cabecera)
  const aj = document.createElement('button'); aj.type = 'button'; aj.id = 'cnt-ajustes'; aj.title = 'Ajustes'; aj.setAttribute('aria-haspopup', 'true'); aj.setAttribute('aria-expanded', 'false');
  aj.innerHTML = '<span class="cnt-ico">' + CNT_ICONOS.ajustes + '</span><span class="cnt-txt">Ajustes</span>';
  lado.appendChild(aj);
  const ini = document.createElement('section'); ini.id = 'cnt-inicio'; ini.hidden = true; ini.setAttribute('aria-label', 'Inicio');
  document.body.appendChild(ini);
  const nl = document.createElement('section'); nl.id = 'cnt-newsletter'; nl.hidden = true; nl.setAttribute('aria-label', 'Newsletter');
  document.body.appendChild(nl);
  const es = document.createElement('section'); es.id = 'cnt-estaticos'; es.hidden = true; es.setAttribute('aria-label', 'Estáticos');
  document.body.appendChild(es);
  const gu = document.createElement('section'); gu.id = 'cnt-guiones'; gu.hidden = true; gu.setAttribute('aria-label', 'Guiones');
  document.body.appendChild(gu);
  document.body.classList.add('cnt');
  cntIr(CNT.sec, true);
}
function cntIr(id, inicio) {
  CNT.sec = id; try { localStorage.setItem('contenidos.seccion', id); } catch (e) {}
  document.querySelectorAll('#cnt-lado .cnt-nav [data-cnt]').forEach(b => b.setAttribute('aria-current', b.dataset.cnt === id ? 'page' : 'false'));
  document.body.classList.toggle('cnt-en-nl', id === 'newsletter');
  document.body.classList.toggle('cnt-en-inicio', id === 'inicio');
  document.body.classList.toggle('cnt-en-img', id === 'imagenes');
  const p = document.getElementById('cnt-newsletter'); if (p) p.hidden = id !== 'newsletter';
  const h = document.getElementById('cnt-inicio'); if (h) h.hidden = id !== 'inicio';
  document.body.classList.toggle('cnt-en-gu', id === 'guiones');
  const gu = document.getElementById('cnt-guiones'); if (gu) gu.hidden = id !== 'guiones';
  document.body.classList.toggle('cnt-en-es', id === 'estaticos');
  const es = document.getElementById('cnt-estaticos'); if (es) es.hidden = id !== 'estaticos';
  if (id === 'estaticos') setTimeout(() => { if (typeof esPintar === 'function') esPintar(true); }, 0);
  if (id === 'guiones') setTimeout(() => { if (typeof guPintar === 'function') guPintar(true); }, 0);
  const nombre = document.querySelector('.mk-txt b'); if (nombre) nombre.textContent = id === 'imagenes' ? 'Galería' : 'Carruseles';
  if (id === 'newsletter') cntCargarNewsletter();
  if (id === 'inicio') cntPintarInicio();
  // Imágenes = la vista «fotos»; Carruseles = cualquier otra
  if (typeof S !== 'undefined') {
    if (id === 'imagenes' && S.v !== 'fotos') { S.v = 'fotos'; CNT.sincro = true; render(); CNT.sincro = false; }
    if (id === 'carruseles' && S.v === 'fotos') { S.v = 'producir'; CNT.sincro = true; render(); CNT.sincro = false; }
  }
  if (!inicio) { document.body.classList.remove('menu-abierto'); window.scrollTo(0, 0); }
}
// si desde Carruseles se salta a una foto (p. ej. un aviso de Inicio), la barra lateral pasa a Imágenes, y al revés
const _renderCnt = render;
render = function () {
  // Carruseles ya no tiene pestaña Inicio (Sandra, 19/10/2026): lo que llevaba ahí se abre en Producción
  if (typeof S !== 'undefined' && S.v === 'inicio') S.v = 'producir';
  _renderCnt.apply(this, arguments);
  if (CNT.sincro || typeof S === 'undefined') return;
  if (S.v === 'fotos' && CNT.sec !== 'imagenes') cntIr('imagenes', true);
  else if (S.v !== 'fotos' && CNT.sec === 'imagenes') cntIr('carruseles', true);
};

/* ---------- Inicio de Contenidos: una tarjeta por sección con lo que tiene pendiente ---------- */
function cntEstado(id) {
  try {
    if (id === 'carruseles') {
      const cs = Object.values(EST.lista || {}).filter(c => c.estado !== 'hecho');
      const rev = cs.filter(c => !c.listo && c.slides && c.slides.length).length, listos = cs.filter(c => c.listo).length;
      return [rev + ' en borrador', listos + ' para publicar'];
    }
    if (id === 'newsletter') {
      if (!CNT.cal) return ['Cargando…'];
      const hoy = new Date(), dia = (hoy.getDay() + 6) % 7, lun = new Date(hoy); lun.setDate(hoy.getDate() - dia); lun.setHours(0, 0, 0, 0);
      const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
      const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const semana = CNT.cal.filter(c => c.fecha >= iso(lun) && c.fecha <= iso(dom));
      const pend = semana.filter(c => c.estado !== 'enviado').length;
      return [semana.length + (semana.length === 1 ? ' correo esta semana' : ' correos esta semana'), pend + (pend === 1 ? ' sin enviar' : ' sin enviar')];
    }
    if (id === 'guiones') {
      if (typeof GU === 'undefined') return [];
      const gs = Object.values(GU.lista), n = k => gs.filter(g => (g.etapa || 'borrador') === k).length;
      return [n('borrador') + ' en borrador', n('grabar') + ' para grabar'];
    }
    if (id === 'estaticos') {
      if (typeof ES === 'undefined') return [];
      const xs = Object.values(ES.lista), n = k => xs.filter(x => (x.tipo || 'normal') === k).length;
      return [n('normal') + (n('normal') === 1 ? ' estático' : ' estáticos'), n('dinamico') + (n('dinamico') === 1 ? ' dinámico' : ' dinámicos')];
    }
    if (id === 'imagenes') {
      const fs = (typeof fotosCatalogo === 'function' ? fotosCatalogo() : FOTOS).filter(f => !f.oculta);
      const sin = fs.filter(f => f.estado === 'sin-catalogar' || f.estado === 'catalogando').length;
      return [fs.length + ' imágenes', sin ? sin + ' sin catalogar (Claude las cataloga en breve)' : 'todas catalogadas'];
    }
  } catch (e) {}
  return [];
}
function cntPintarInicio() {
  const h = document.getElementById('cnt-inicio'); if (!h || CNT.sec !== 'inicio') return;
  const hoy = new Date().toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'});
  h.innerHTML = '<div class="cnt-banda"><b>Inicio</b></div><div class="cnt-ini">' +
    '<p class="cnt-fecha">' + esc(hoy.charAt(0).toUpperCase() + hoy.slice(1)) + '</p><h1>Contenidos</h1>' +
    '<div class="cnt-tarjetas">' + CNT_SECCIONES.filter(s => !s.cerrada).map(s => '<button type="button" class="cnt-tarjeta" data-cnt="' + s.id + '">' +
      '<span class="cnt-ico">' + (CNT_ICONOS[s.id] || '') + '</span><b>' + s.nombre + (s.beta ? ' <i class="cnt-beta">Beta</i>' : '') + '</b>' +
      cntEstado(s.id).map(x => '<span>' + esc(x) + '</span>').join('') + '<i>Abrir →</i></button>').join('') + '</div></div>';
}
// los correos de la newsletter, para el resumen del Inicio (misma base de datos)
(function cntLeerCalendario() {
  const db = (typeof EST_DB !== 'undefined' && EST_DB) || (typeof DB !== 'undefined' && DB);
  if (!db) return setTimeout(cntLeerCalendario, 1500);
  try { db.collection('calendario').onSnapshot(snap => { CNT.cal = snap.docs.map(d => d.data()); cntPintarInicio(); }); } catch (e) {}
})();
setInterval(cntPintarInicio, 15000);

/* La newsletter se carga la primera vez que se abre. srcdoc (no src) para que su window.claude sea el de esta página. */
async function cntCargarNewsletter() {
  if (CNT.nl) return;
  const p = document.getElementById('cnt-newsletter'); if (!p) return;
  CNT.nl = document.createElement('iframe'); CNT.nl.title = 'Newsletter';
  p.innerHTML = '<p class="cnt-cargando">Cargando la newsletter…</p>';
  try {
    const r = await fetch('newsletter.html'); if (!r.ok) throw new Error('http ' + r.status);
    const base = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
    CNT.nl.srcdoc = (await r.text()).replace('<head>', '<head><base href="' + base + '">');
    p.innerHTML = ''; p.appendChild(CNT.nl);
    CNT.nl.addEventListener('load', cntTemaNl);
  } catch (e) {
    CNT.nl = null;
    p.innerHTML = '<p class="cnt-cargando">No he podido abrir la newsletter (' + esc(e && e.message || 'error') + '). Recarga la página.</p>';
  }
}
// el tema claro/oscuro de Contenidos manda también en la newsletter
function cntTemaNl() {
  try { const d = CNT.nl && CNT.nl.contentDocument; if (!d) return; const t = document.documentElement.getAttribute('data-theme');
    if (t) d.documentElement.setAttribute('data-theme', t); else d.documentElement.removeAttribute('data-theme'); } catch (e) {}
}
new MutationObserver(cntTemaNl).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
document.addEventListener('click', e => {
  const tm = e.target.closest && e.target.closest('[data-cnt-tema]');
  if (tm) { cntPonerTema(tm.dataset.cntTema); cntAjustes(true); return; }
  if (e.target.closest && e.target.closest('#cnt-ajustes')) { cntAjustes(); return; }
  if (!(e.target.closest && e.target.closest('#cnt-ajustes-menu'))) cntAjustes(false);
  // con el menú arriba el editor se abre dentro de la página: al cambiar de sección o de pestaña, se cierra
  if (e.target.closest && e.target.closest('[data-cnt], #vistas button') && typeof EST !== 'undefined' && EST.abierto) cerrarEditor();
  const b = e.target.closest && e.target.closest('[data-cnt]'); if (!b) return;
  e.preventDefault(); cntIr(b.dataset.cnt);
});
/* Ajustes: de momento solo la apariencia. Se recuerda en este navegador (contenidos.tema: light / dark / vacío = como el sistema). */
function cntPonerTema(t) {
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  try { localStorage.setItem('contenidos.tema', t || ''); } catch (e) {}
}
function cntAjustes(abrir) {
  let m = document.getElementById('cnt-ajustes-menu'); const btn = document.getElementById('cnt-ajustes');
  if (abrir === undefined) abrir = !m;
  if (m) m.remove();
  if (btn) btn.setAttribute('aria-expanded', String(!!abrir));
  if (!abrir) return;
  const cur = document.documentElement.getAttribute('data-theme') || '';
  m = document.createElement('div'); m.id = 'cnt-ajustes-menu'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Ajustes');
  m.innerHTML = '<b>Apariencia</b><div class="cnt-aj-ops" role="radiogroup">' +
    [['light', '☀️', 'Claro'], ['dark', '🌙', 'Oscuro'], ['', '💻', 'Como el sistema']].map(([k, ic, t]) =>
      '<button type="button" role="radio" data-cnt-tema="' + k + '" aria-checked="' + (cur === k) + '"><span>' + ic + '</span>' + t + '</button>').join('') + '</div>';
  document.body.appendChild(m);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('cnt-ajustes-menu')) cntAjustes(false); });
try { const t = localStorage.getItem('contenidos.tema'); if (t) cntPonerTema(t); } catch (e) {}
cntMontar();

// La slide grande del editor se escalaba con el ancho que tenía ANTES de que acabara de colocarse la página: en el móvil
// salía más grande que su caja y se cortaba por la derecha (repaso del 16/10/2026). Se vuelve a escalar en el siguiente fotograma.
const _pintarEditorCnt = pintarEditor;
pintarEditor = function () {
  const r = _pintarEditorCnt.apply(this, arguments);
  requestAnimationFrame(() => { const ed = document.getElementById('est-editor'); if (ed && !ed.hidden) pintarMinis(ed); });
  return r;
};

// secciones que aún no se abren (Directorio): avisan y no cambian de sección
document.addEventListener('click', e => {
  const c = e.target.closest && e.target.closest('[data-cnt-cerrada]'); if (!c) return;
  e.preventDefault(); e.stopImmediatePropagation();
  toast('El directorio de creatividades llega pronto');
}, true);
