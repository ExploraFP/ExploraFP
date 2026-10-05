/* ===================== Mesa de trabajo (editor de un carrusel) =====================
   A · Seguridad: «Otra versión» pide confirmación y guarda la versión anterior (c.versiones, máx. 5) para volver;
       indicador «✓ Guardado» y Deshacer (botón y Ctrl/⌘+Z) con el historial de cambios de esta sesión.
   B · Claude por slide: «Pídele un cambio a Claude» con atajos (más corto, más directo, otro ejemplo, con un dato).
   C · Editar sin buscar: pulsar un texto de la slide grande lleva a su campo; solo se ven los campos con contenido
       (el resto en «+ Añadir»).
   D · «Carrusel completo»: todas las slides en fila.
   E · Ordenar arrastrando las miniaturas.
   F · Control de calidad en una línea si está todo bien. */
const MESA = {hist: {}, base: {}, ultPush: 0, restaurando: false, mostrar: {}, selPrev: -1, vistaTodo: false, pidiendo: false};
const fotoEstado = c => JSON.stringify({slides: c.slides, copy: c.copy || '', plantilla: c.plantilla, color: c.color, cinta: c.cinta || ''});

/* ---------- A · guardado, deshacer y versiones ---------- */
const _guardarCMesa = guardarC;
guardarC = function (c) {
  if (c && c.id === EST.abierto && !MESA.restaurando) {
    const ahora = fotoEstado(c), base = MESA.base[c.id];
    if (base && base !== ahora) {
      const h = MESA.hist[c.id] = MESA.hist[c.id] || [];
      // los cambios seguidos (menos de 1,5 s) cuentan como uno solo
      if (!h.length || Date.now() - MESA.ultPush > 1500) { h.push(base); if (h.length > 40) h.shift(); }
      MESA.ultPush = Date.now();
    }
    MESA.base[c.id] = ahora;
  }
  _guardarCMesa(c);
  if (c && c.id === EST.abierto) marcarGuardado();
};
function marcarGuardado() {
  const el = document.getElementById('mesa-guardado'); if (!el) return;
  el.textContent = 'Guardando…'; el.className = 'mesa-guardado';
  clearTimeout(marcarGuardado._t); marcarGuardado._t = setTimeout(() => { el.textContent = '✓ Guardado'; el.className = 'mesa-guardado ok'; }, 500);
  const d = document.getElementById('mesa-deshacer'); if (d) d.disabled = !(MESA.hist[EST.abierto] || []).length;
}
function restaurar(c, estado) {
  const e = JSON.parse(estado);
  c.slides = e.slides; c.copy = e.copy; c.plantilla = e.plantilla; c.color = e.color; c.cinta = e.cinta;
  if (EST.sel >= c.slides.length) EST.sel = Math.max(0, c.slides.length - 1);
  MESA.restaurando = true; guardarC(c); MESA.restaurando = false;
  MESA.base[c.id] = fotoEstado(c);
  pintarEditor(true);
}
function deshacer() {
  const c = EST.lista[EST.abierto]; const h = MESA.hist[EST.abierto] || [];
  if (!c || !h.length) { toast('No hay nada que deshacer'); return; }
  restaurar(c, h.pop()); toast('↶ Deshecho');
}
const _abrirEditorMesa = abrirEditor;
abrirEditor = function (id) {
  const c = EST.lista[id]; if (c) { MESA.base[id] = fotoEstado(c); MESA.hist[id] = MESA.hist[id] || []; }
  MESA.vistaTodo = false; MESA.mostrar = {}; MESA.selPrev = -1;
  _abrirEditorMesa(id);
};
function confirmarOtraVersion() {
  const c = EST.lista[EST.abierto]; if (!c) return;
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja ft-aviso-borrar" role="alertdialog" aria-modal="true" aria-labelledby="mesa-ov-t"><div class="cuerpo">' +
    '<h2 id="mesa-ov-t">¿Pedir a Claude otra versión entera?</h2>' +
    '<p>Rehace todas las slides y el caption. La versión actual se guarda y podrás volver a ella con «↺ Versión anterior».</p>' +
    (EST.sample ? '' : '<p class="est-pista">Para usar Claude abre la web en claude.ai.</p>') + '</div>' +
    '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn pri" id="mesa-ov-ok"' + (EST.sample ? '' : ' disabled') + '>✨ Sí, otra versión</button></footer></div>';
}
async function otraVersion() {
  const c = EST.lista[EST.abierto]; if (!c || c.estado === 'generando') return;
  cerrarPanel();
  c.versiones = (c.versiones || []).concat([{fecha: new Date().toISOString(), estado: fotoEstado(c)}]).slice(-5);
  _guardarCMesa(c);
  toast('Pidiendo otra versión…');
  await generar(c.id);
  MESA.base[c.id] = fotoEstado(EST.lista[c.id] || c);
  if (EST.abierto === c.id) pintarEditor(true);
}
function versionAnterior() {
  const c = EST.lista[EST.abierto]; if (!c || !(c.versiones || []).length) return;
  const v = c.versiones.pop();
  c.versiones.push({fecha: new Date().toISOString(), estado: fotoEstado(c)}); // así se puede volver a la de ahora
  restaurar(c, v.estado);
  toast('↺ Has vuelto a la versión del ' + new Date(v.fecha).toLocaleString('es-ES', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}));
}

/* ---------- B · Claude cambia solo esta slide ---------- */
const MESA_ATAJOS = [
  ['Más corto', 'Hazla más corta: menos palabras, la misma idea.'],
  ['Más directo', 'Más directa y con más fuerza: frases cortas, sin relleno, de tú a tú.'],
  ['Otro ejemplo', 'Cambia el ejemplo o el enfoque por otro distinto, igual de concreto.'],
  ['Con un dato', 'Apóyala en uno de los DATOS VERIFICADOS, copiando la cifra y la fuente tal cual (pon la fuente en "fuente"). Si ninguno encaja, no inventes nada: déjala igual.']];
function promptSlide(c, i, peticion) {
  const base = promptCarrusel(c).split('FORMATO DE RESPUESTA')[0];
  const resumen = c.slides.map((s, k) => (k + 1) + '. [' + s.tipo + '] ' + [s.titulo, s.subtitulo, s.texto, (s.items || []).join(' / ')].filter(Boolean).join(' · ').replace(/\*/g, '')).join('\n');
  return base + '\nEL CARRUSEL YA ESTÁ ESCRITO. Estas son sus slides en orden:\n' + resumen + '\n\n' +
    'CAMBIA SOLO LA SLIDE ' + (i + 1) + ', que ahora es:\n' + JSON.stringify(c.slides[i]) + '\n\n' +
    'LO QUE PIDE SANDRA: ' + peticion + '\n\n' +
    'Responde SOLO con el JSON de esa slide (un objeto, no una lista), con los mismos campos posibles (tipo, etiqueta, antetitulo, titulo, subtitulo, numero, texto, items, cifra, fuente, cta, cinta). ' +
    'Mantén el "tipo" salvo que la petición pida otra cosa. No toques "imagen" ni "marco". Respeta todas las reglas de arriba (titular en minúscula salvo la inicial, una palabra entre *asteriscos*, longitudes máximas, nada de «desliza», ninguna cifra que no esté en los DATOS VERIFICADOS).';
}
async function pedirCambioSlide(peticion) {
  const c = EST.lista[EST.abierto]; if (!c) return;
  peticion = String(peticion || '').trim(); if (!peticion) { toast('Escribe qué quieres cambiar'); return; }
  if (!EST.sample) { toast('Para usar Claude abre la web en claude.ai'); return; }
  if (MESA.pidiendo) return;
  const i = EST.sel, antes = c.slides[i]; if (!antes) return;
  MESA.pidiendo = true; pintarCajaClaude();
  try {
    const r = await EST.sample.json(promptSlide(c, i, peticion), {modelTier: 'default'});
    const s = Array.isArray(r) ? r[0] : (r && r.slide) || r;
    if (!s || typeof s !== 'object') throw {message: 'respuesta vacía'};
    const o = {};
    CAMPOS_SLIDE.forEach(k => { if (k === 'imagen' || k === 'marco') return; if (s[k] != null && s[k] !== '') o[k] = k === 'items' ? [].concat(s[k]).map(String).slice(0, 4) : String(s[k]); });
    if (!EST_TIPOS[o.tipo]) o.tipo = antes.tipo;
    if (antes.imagen) o.imagen = antes.imagen; if (antes.marco) o.marco = antes.marco;
    if (o.titulo && o.titulo === o.titulo.toUpperCase() && /[A-ZÁÉÍÓÚ]{4}/.test(o.titulo)) o.titulo = o.titulo.charAt(0) + o.titulo.slice(1).toLowerCase();
    if (!o.titulo && !o.texto && !(o.items || []).length && !o.cifra) throw {message: 'sin texto'};
    c.slides[i] = o; guardarC(c);
    MESA.pidiendo = false; $('#mesa-claude-txt') && ($('#mesa-claude-txt').value = '');
    pintarEditor(true); toast('✨ Slide ' + (i + 1) + ' cambiada. Si no te gusta: ↶ Deshacer');
  } catch (e) {
    MESA.pidiendo = false; pintarCajaClaude();
    toast(e && e.code === 'rate_limited' ? 'Demasiadas peticiones a la vez. Prueba en un minuto.' : e && e.code === 'not_granted' ? 'No se dio permiso para usar Claude.' : 'No ha salido bien. Prueba otra vez o reformula la petición.');
  }
}
function htmlCajaClaude() {
  return '<div class="mesa-claude" id="mesa-claude"><div class="mesa-claude-t">✨ Pídele un cambio a Claude <span>solo en esta slide</span></div>' +
    '<div class="mesa-atajos">' + MESA_ATAJOS.map((a, k) => '<button type="button" data-mesa-atajo="' + k + '"' + (MESA.pidiendo ? ' disabled' : '') + '>' + a[0] + '</button>').join('') + '</div>' +
    '<form id="mesa-claude-f" class="mesa-claude-f"><input type="text" id="mesa-claude-txt" placeholder="O escríbelo: «cambia el titular por una pregunta»…" maxlength="240"' + (MESA.pidiendo ? ' disabled' : '') + '>' +
    '<button type="submit" class="btn pri"' + (MESA.pidiendo ? ' disabled' : '') + '>' + (MESA.pidiendo ? 'Claude está escribiendo…' : 'Pedir') + '</button></form></div>';
}
function pintarCajaClaude() { const b = document.getElementById('mesa-claude'); if (b) b.outerHTML = htmlCajaClaude(); }

/* ---------- F · control de calidad en una línea ---------- */
htmlQC = function (c) {
  if (!qcMedido(c)) { pedirQC(c); return '<div class="mesa-qc">Revisando las slides…</div>'; }
  const a = avisos(c);
  if (!a.length) return '<div class="mesa-qc ok">✓ Todo en orden: cabe, sin palabras prohibidas, sin cifras sin fuente</div>';
  const e = a.filter(x => x.nivel === 'error').length;
  return '<details class="mesa-qc mal"' + (e ? ' open' : '') + '><summary>' + (e ? '⚠ ' + e + (e === 1 ? ' cosa por corregir' : ' cosas por corregir') : a.length + (a.length === 1 ? ' aviso' : ' avisos') + ' para revisar') + '</summary>' +
    '<ul class="est-qc">' + a.map(x => '<li class="qc-' + x.nivel + '"><b>' + (x.nivel === 'error' ? 'Corregir' : 'Revisar') + '</b>' +
      (x.slide >= 0 ? '<button class="btn mini" data-est-sel="' + x.slide + '">Slide ' + (x.slide + 1) + '</button>' : '') + '<span>' + esc(x.msg) + '</span></li>').join('') + '</ul></details>';
};

/* ---------- pintar: cabecera, carrusel completo, campos, caja de Claude, arrastrar ---------- */
const MESA_NOMBRES = {etiqueta: 'Etiqueta', antetitulo: 'Subtítulo', subtitulo: 'Subtítulo', numero: 'Número', texto: 'Texto', items: 'Puntos', cifra: 'Cifra', fuente: 'Fuente', cta: 'Botón', cinta: 'Debajo del botón'};
const _pintarEditorMesa = pintarEditor;
pintarEditor = function (todo) {
  const c = EST.lista[EST.abierto];
  if (c && EST.sel !== MESA.selPrev) { MESA.mostrar = {}; MESA.selPrev = EST.sel; }
  _pintarEditorMesa(todo);
  if (!c) return;
  const ed = $('#est-editor');
  // cabecera
  const cab = ed.querySelector('.est-ecab');
  if (cab && !cab.querySelector('#mesa-guardado')) {
    const re = cab.querySelector('#est-rehacer');
    if (re) { re.id = 'mesa-otra'; re.textContent = '✨ Otra versión'; re.title = 'Pedir a Claude otra versión entera (la actual se guarda)'; }
    const extra = '<span id="mesa-guardado" class="mesa-guardado ok">✓ Guardado</span>' +
      '<button class="btn" id="mesa-deshacer" title="Deshacer (Ctrl/⌘+Z)"' + ((MESA.hist[c.id] || []).length ? '' : ' disabled') + '>↶ Deshacer</button>' +
      ((c.versiones || []).length ? '<button class="btn" id="mesa-anterior" title="Volver a la versión de antes de «Otra versión»">↺ Anterior</button>' : '') +
      '<button class="btn' + (MESA.vistaTodo ? ' on' : '') + '" id="mesa-todo" aria-pressed="' + MESA.vistaTodo + '" title="Ver todas las slides en fila">▦ Ver todo</button>';
    const sel = cab.querySelector('#est-e-co') || cab.querySelector('#est-e-pl');
    if (sel) sel.insertAdjacentHTML('afterend', '<span class="mesa-hueco"></span>' + extra);
  }
  // D · carrusel completo
  const esc_ = ed.querySelector('.est-escena');
  if (esc_ && MESA.vistaTodo && !esc_.querySelector('.mesa-todo')) {
    esc_.innerHTML = '<div class="mesa-todo">' + c.slides.map((x, i) => '<figure>' + mini(c, i, {boton: 'data-mesa-ir="' + i + '" aria-label="Editar la slide ' + (i + 1) + '"'}) + '<figcaption>' + (i + 1) + '</figcaption></figure>').join('') + '</div>' +
      '<p class="est-pista mesa-todo-pista">Así se verán en Instagram, una detrás de otra. Pulsa una para editarla.</p>';
    pintarMinis(esc_);
  }
  // E · miniaturas que se pueden arrastrar
  ed.querySelectorAll('.est-tira [data-est-sel]').forEach(b => { b.draggable = true; b.title = 'Arrastra para cambiar el orden'; });
  // C · solo los campos con contenido; el resto en «+ Añadir»
  const panel = $('#est-panel'); if (!panel) return;
  const tab = panel.querySelector('.pr-tab-slide') || panel;
  const campos = tab.querySelector('.est-campos');
  if (campos && !campos.querySelector('.mesa-mas')) {
    const faltan = [];
    campos.querySelectorAll('label').forEach(l => {
      const f = l.querySelector('[data-est-campo]'); if (!f) return;
      const k = f.dataset.estCampo; if (k === 'tipo' || k === 'titulo') return;
      if (!String(f.value || '').trim() && !MESA.mostrar[k]) { l.hidden = true; faltan.push([k, (l.childNodes[0] && l.childNodes[0].textContent || MESA_NOMBRES[k] || k).trim()]); }
    });
    if (faltan.length) campos.insertAdjacentHTML('beforeend', '<div class="mesa-mas"><span>Añadir:</span>' + faltan.map(x => '<button type="button" data-mesa-mas="' + x[0] + '">+ ' + esc(x[1]) + '</button>').join('') + '</div>');
  }
  // B · caja de Claude arriba de la slide
  if (!tab.querySelector('#mesa-claude')) {
    const fila = tab.querySelector('.est-fila');
    (fila || campos) && (fila || campos).insertAdjacentHTML('beforebegin', htmlCajaClaude());
  }
  // la foto, justo después de los textos (ya no hay campos vacíos en medio)
  const hFoto = [...tab.querySelectorAll('h3')].find(h => /^Foto$/.test(h.textContent.trim()));
  if (hFoto && campos && hFoto.previousElementSibling !== campos && !hFoto.dataset.movida) {
    const bloque = [hFoto]; let n = hFoto.nextElementSibling;
    while (n && n.tagName !== 'H3') { bloque.push(n); n = n.nextElementSibling; }
    let ancla = campos.nextElementSibling && campos.nextElementSibling.classList.contains('est-pista') ? campos.nextElementSibling : campos;
    if (ancla === hFoto.previousElementSibling) { hFoto.dataset.movida = '1'; return; }
    bloque.forEach(el => { ancla.after(el); ancla = el; }); hFoto.dataset.movida = '1';
  }
};

/* C · pulsar un texto de la slide grande → su campo */
function campoDesdeTexto(s, txt) {
  const n = x => norm(String(x || '').replace(/\*/g, '')).replace(/\s+/g, ' ').trim();
  const t = n(txt); if (!t) return '';
  let mejor = '', largo = 0;
  ['titulo', 'subtitulo', 'antetitulo', 'texto', 'etiqueta', 'numero', 'cifra', 'fuente', 'cta', 'cinta'].forEach(k => {
    const v = n(s[k]); if (!v) return;
    if ((v.indexOf(t) >= 0 || t.indexOf(v) >= 0) && Math.min(v.length, t.length) > largo) { mejor = k; largo = Math.min(v.length, t.length); }
  });
  if (!mejor && (s.items || []).some(x => { const v = n(x); return v && (v.indexOf(t) >= 0 || t.indexOf(v) >= 0); })) mejor = 'items';
  return mejor;
}
function irACampo(k) {
  EST.pestana = 'slide'; const p = $('#est-panel'); if (p) p.dataset.tab = 'slide';
  document.querySelectorAll('[data-pr-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.prTab === 'slide')));
  let f = document.querySelector('#est-panel [data-est-campo="' + k + '"]'); if (!f) return false;
  const l = f.closest('label'); if (l && l.hidden) { MESA.mostrar[k] = true; l.hidden = false; }
  f.scrollIntoView({block: 'center', behavior: 'smooth'}); f.focus({preventScroll: true});
  if (f.setSelectionRange && f.value) f.setSelectionRange(f.value.length, f.value.length);
  f.classList.add('mesa-brilla'); setTimeout(() => f.classList.remove('mesa-brilla'), 1200);
  return true;
}

/* ---------- eventos ---------- */
// en la fase de captura de window para adelantarse al editor (que también escucha «Otra versión»)
window.addEventListener('click', e => {
  const t = e.target; if (!EST.abierto || !t.closest) return;
  if (t.closest('#mesa-otra')) { e.stopImmediatePropagation(); confirmarOtraVersion(); return; }
  if (t.id === 'mesa-ov-ok') { e.stopImmediatePropagation(); otraVersion(); return; }
  if (t.closest('#mesa-deshacer')) { e.stopImmediatePropagation(); deshacer(); return; }
  if (t.closest('#mesa-anterior')) { e.stopImmediatePropagation(); versionAnterior(); return; }
  if (t.closest('#mesa-todo')) { e.stopImmediatePropagation(); MESA.vistaTodo = !MESA.vistaTodo; pintarEditor(true); return; }
  const ir = t.closest('[data-mesa-ir]'); if (ir) { e.stopImmediatePropagation(); EST.sel = +ir.dataset.mesaIr; MESA.vistaTodo = false; pintarEditor(true); return; }
  const at = t.closest('[data-mesa-atajo]'); if (at) { e.stopImmediatePropagation(); pedirCambioSlide(MESA_ATAJOS[+at.dataset.mesaAtajo][1]); return; }
  const mas = t.closest('[data-mesa-mas]'); if (mas) { e.stopImmediatePropagation(); const k = mas.dataset.mesaMas; MESA.mostrar[k] = true; mas.remove(); irACampo(k); return; }
  // pulsar en la slide grande
  const grande = t.closest('.est-grande');
  if (grande && !MESA.vistaTodo) {
    const fr = grande.querySelector('iframe'), c = EST.lista[EST.abierto]; if (!fr || !c) return;
    try {
      const r = fr.getBoundingClientRect(), k = r.width / 1080 || 1;
      const doc = fr.contentDocument, el = doc && doc.elementFromPoint((e.clientX - r.left) / k, (e.clientY - r.top) / k);
      let x = el, campo = '';
      while (x && x !== doc.body && !campo) { campo = campoDesdeTexto(c.slides[EST.sel] || {}, x.textContent); x = x.parentElement; }
      if (campo) irACampo(campo); else toast('Pulsa sobre un texto para editarlo');
    } catch (err) {}
  }
}, true);
document.addEventListener('submit', e => { if (e.target.id === 'mesa-claude-f') { e.preventDefault(); pedirCambioSlide($('#mesa-claude-txt').value); } });
document.addEventListener('keydown', e => {
  if (!EST.abierto) return;
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); deshacer(); }
});
// E · arrastrar miniaturas
let MESA_ARR = -1;
document.addEventListener('dragstart', e => { const b = e.target.closest && e.target.closest('.est-tira [data-est-sel]'); if (!b) return; MESA_ARR = +b.dataset.estSel; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(MESA_ARR)); } catch (x) {} b.classList.add('mesa-arrastrando'); });
document.addEventListener('dragover', e => { const b = e.target.closest && e.target.closest('.est-tira [data-est-sel]'); if (!b || MESA_ARR < 0) return; e.preventDefault();
  document.querySelectorAll('.est-tira .mesa-destino').forEach(x => x.classList.remove('mesa-destino')); b.classList.add('mesa-destino'); });
document.addEventListener('dragend', () => { MESA_ARR = -1; document.querySelectorAll('.mesa-arrastrando,.mesa-destino').forEach(x => x.classList.remove('mesa-arrastrando', 'mesa-destino')); });
document.addEventListener('drop', e => {
  const b = e.target.closest && e.target.closest('.est-tira [data-est-sel]'); if (!b || MESA_ARR < 0) return; e.preventDefault();
  const c = EST.lista[EST.abierto], de = MESA_ARR, a = +b.dataset.estSel; MESA_ARR = -1; if (!c || de === a) return;
  const x = c.slides.splice(de, 1)[0]; c.slides.splice(a, 0, x); EST.sel = a; guardarC(c); pintarEditor(true); toast('Slide movida a la posición ' + (a + 1));
});
