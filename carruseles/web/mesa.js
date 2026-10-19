/* ===================== Mesa de trabajo (editor de un carrusel) =====================
   A · Seguridad: «Otra versión» pide confirmación y guarda la versión anterior (c.versiones, máx. 5) para volver;
       indicador «✓ Guardado» y Deshacer (botón y Ctrl/⌘+Z) con el historial de cambios de esta sesión.
   B · «Pídele un cambio a Claude»: Sandra lo escribe; puede tocar varias slides, la foto o el caption, y dice qué ha cambiado.
   C · Editar sin buscar: pulsar un texto de la slide grande lleva a su campo; solo se ven los campos con contenido
       (el resto en «+ Añadir»).
   D · (quitado: «Ver todo» repetía las miniaturas de abajo)
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
      // un paso por cambio. Solo se juntan los guardados seguidos (< 1,5 s) del MISMO texto mientras escribes
      // (16/10/2026, Sandra: «solo me deja deshacer una vez»: antes se juntaba cualquier cambio a menos de 1,5 s del anterior,
      // y dos ediciones rápidas en textos distintos, o un cambio del chat justo después de escribir, eran un solo paso)
      const grupo = MESA.grupo || null;
      const junta = grupo && grupo === MESA.ultGrupo && Date.now() - MESA.ultPush <= 1500 && h.length;
      if (!junta) { h.push(base); if (h.length > 60) h.shift(); }
      MESA.ultPush = Date.now(); MESA.ultGrupo = grupo;
    }
    MESA.base[c.id] = ahora;
  }
  MESA.grupo = null;
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
  // los guardados pendientes de lo que escribías no pueden volver a meter lo deshecho después
  clearTimeout(estTempo); if (typeof SEL_GUARDA !== 'undefined') clearTimeout(SEL_GUARDA);
  MESA.ultGrupo = null;
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
// el chat de la mesa: Sandra escribe lo que quiere y Claude puede tocar cualquier slide, la foto o el caption.
// Si no dice otra cosa, se entiende que habla de la slide que tiene abierta.
function promptSlide(c, i, peticion) {
  const base = promptCarrusel(c).split('FORMATO DE RESPUESTA')[0];
  const actual = {copy: c.copy || '', slides: c.slides};
  return base + '\nEL CARRUSEL YA ESTÁ ESCRITO. Así está ahora (JSON):\n' + JSON.stringify(actual) + '\n\n' +
    'Sandra está viendo la slide ' + (i + 1) + '. Si su petición no dice a qué slide se refiere, se refiere a esa.\n\n' +
    'LO QUE PIDE SANDRA: ' + peticion + '\n\n' +
    'Aplica EXACTAMENTE lo que pide, aunque toque varias slides, la foto ("imagen", solo rutas de FOTOS DISPONIBLES), el "marco" o el caption ("copy"). ' +
    'Toca SOLO lo que pide: no cambies la foto ni el marco si no habla de la foto; no reescribas otras slides. ' +
    'Para quitar la flecha a mano de una slide pon "trazo": "ninguno"; para volver a ponerla, quita "trazo". ' +
    'CAMBIOS DE DISEÑO (mover algo, separarlo, hacerlo más grande o más pequeño, alinearlo, cambiar márgenes o un color de un elemento): SÍ puedes hacerlos, con el campo "estilo" de ESA slide: CSS que solo afecta a esa slide. ' +
    'La slide mide 1080×1350 px. Usa los selectores de las clases del HTML de abajo, SIN prefijos (no pongas #id ni .l-plantilla delante: ya se aplica solo a esa slide; para la slide entera usa ".slide"). ' +
    'Muchos elementos van con position:absolute: para moverlos cambia top/left/right/bottom; para separar cosas, márgenes o top. Usa !important si una regla no se aplica. Nada de @import, url(), @media ni animaciones. ' +
    'Si la slide ya tiene "estilo", MANTÉN lo que había y añade o cambia solo lo que pide ahora. Nunca dejes nada fuera de la slide ni tapes el texto; colores solo de la paleta (#366B40, #4CCD4B, #D8FF6E, #FAFFFA, #000000, #FFE45E, #1B3620). ' +
    'Si pide que el cambio sea para todo el carrusel, pon ese "estilo" en cada slide donde tenga sentido. Para quitar los retoques de diseño de una slide, pon "estilo": "". ' +
    'HTML de la slide ' + (i + 1) + ' tal como se ve ahora (para saber las clases):\n' + htmlParaClaude(c, i) + '\n' +
    'Lo que no pide, déjalo idéntico. Respeta todas las reglas de arriba (titular en minúscula salvo la inicial, una palabra entre *asteriscos*, longitudes máximas, nada de «desliza», ninguna cifra que no esté en los DATOS VERIFICADOS; caption con saltos de línea y exactamente 5 hashtags al final). ' +
    'Responde SOLO con este JSON: {"slides": [todas las slides, en orden, ya cambiadas], "copy": "el caption, cambiado o igual", "resumen": "una frase corta de lo que has cambiado"}';
}
// el HTML de una slide sin la cabeza ni imágenes incrustadas: solo la estructura y las clases, para que Claude sepa qué tocar
function htmlParaClaude(c, i) {
  try {
    const s = c.slides[i]; const pl = s.plantilla || c.plantilla, co = s.color || c.color;
    let h = MOTOR.html(pl, co, Object.assign({}, s), i, c.slides.length, c.cinta);
    h = h.slice(h.indexOf('<section')).replace(/src="[^"]*"/g, 'src="…"').replace(/style="[^"]*"/g, '').replace(/\s+/g, ' ');
    return h.slice(0, 5000);
  } catch (e) { return '(no disponible)'; }
}
function limpiarSlide(s, antes) {
  const o = {};
  CAMPOS_SLIDE.forEach(k => { if (s[k] != null && s[k] !== '') o[k] = k === 'items' ? [].concat(s[k]).map(String).slice(0, 4) : String(s[k]); });
  // si Claude no menciona la foto o el marco, se quedan como estaban
  if (antes) ['imagen', 'marco', 'estilo'].forEach(k => { if (s[k] === undefined && antes[k]) o[k] = antes[k]; });
  if (!EST_TIPOS[o.tipo]) o.tipo = antes && antes.tipo || 'contenido';
  if (o.imagen && !FOTOS.some(f => f.ruta === o.imagen)) { if (antes && antes.imagen) o.imagen = antes.imagen; else delete o.imagen; }
  if (o.titulo && o.titulo === o.titulo.toUpperCase() && /[A-ZÁÉÍÓÚ]{4}/.test(o.titulo)) o.titulo = o.titulo.charAt(0) + o.titulo.slice(1).toLowerCase();
  return (o.titulo || o.texto || (o.items || []).length || o.cifra) ? o : null;
}
async function pedirCambioSlide(peticion) {
  const c = EST.lista[EST.abierto]; if (!c) return;
  peticion = String(peticion || '').trim(); if (!peticion) { toast('Escribe qué quieres cambiar'); return; }
  if (!EST.sample) { toast('Para usar Claude abre la web en claude.ai'); return; }
  if (MESA.pidiendo) return;
  const i = EST.sel; if (!c.slides[i]) return;
  MESA.pidiendo = true; MESA.respuesta = ''; MESA.respC = c.id; pintarCajaClaude();
  try {
    const r = await EST.sample.json(promptSlide(c, i, peticion), {modelTier: 'default'});
    // acepta {slides, copy}, una lista de slides o una sola slide
    let lista = Array.isArray(r) ? r : r && Array.isArray(r.slides) ? r.slides : null;
    const una = !lista && r && typeof r === 'object' ? (r.slide || (r.tipo || r.titulo ? r : null)) : null;
    const antes = JSON.stringify([c.slides, c.copy || '']);
    let nuevas;
    if (lista) nuevas = lista.map((s, k) => s && typeof s === 'object' ? limpiarSlide(s, c.slides[k]) : null).filter(Boolean);
    else if (una) { nuevas = c.slides.slice(); nuevas[i] = limpiarSlide(una, c.slides[i]) || c.slides[i]; }
    if (!nuevas || !nuevas.length) throw {message: 'sin slides'};
    // la foto y el marco solo cambian si se piden (16/10/2026: Sandra pidió cambiar una red flag y Claude le cambió la foto de la portada)
    if (!/\b(foto|fotos|imagen|imágenes|imagenes|fotograf|marco|portátil|portatil)/i.test(peticion)) {
      const viejas = c.slides;
      nuevas = nuevas.map(s => {
        const v = viejas.find(x => x.tipo === s.tipo && (x.titulo || '') === (s.titulo || '')) || viejas[nuevas.indexOf(s)];
        if (!v) return s;
        const o = Object.assign({}, s);
        ['imagen', 'marco'].forEach(k => { if (v[k]) o[k] = v[k]; else delete o[k]; });
        return o;
      });
    }
    const copy = r && typeof r.copy === 'string' && r.copy.trim() ? r.copy.trim() : c.copy;
    if (JSON.stringify([nuevas, copy || '']) === antes) {
      MESA.pidiendo = false; MESA.respuesta = 'Claude no ha cambiado nada. Prueba a decirlo de otra forma o a nombrar la slide (p. ej. «en la slide 3…»).';
      pintarCajaClaude(); return;
    }
    // salta a la primera slide que ha cambiado, para que se vea el cambio (16/10/2026: Claude cambió la slide 3 y Sandra
    // estaba mirando otra: «no veo que haya cambiado»)
    const firma = o => o ? JSON.stringify(Object.keys(o).sort().filter(k => o[k] != null && o[k] !== '').map(k => [k, o[k]])) : '';
    const cambiada = nuevas.findIndex((s, k) => firma(s) !== firma(c.slides[k]));
    c.slides = nuevas; if (copy != null) c.copy = copy;
    if (cambiada >= 0) EST.sel = cambiada;
    if (EST.sel >= c.slides.length) EST.sel = c.slides.length - 1;
    guardarC(c);
    MESA.pidiendo = false; MESA.respuesta = '✓ ' + (r && r.resumen ? String(r.resumen) : 'Hecho') + ' · Si no te gusta: Ctrl/⌘ + Z';
    pintarEditor(true);
  } catch (e) {
    MESA.pidiendo = false;
    MESA.respuesta = e && e.code === 'rate_limited' ? 'Demasiadas peticiones a la vez. Prueba en un minuto.' : e && e.code === 'not_granted' ? 'No se dio permiso para usar Claude.' : 'No ha salido bien. Prueba otra vez o dilo de otra forma.';
    pintarCajaClaude();
  }
}
function htmlCajaClaude() {
  return '<div class="mesa-claude" id="mesa-claude"><div class="mesa-claude-t">✨ Pídele a Claude el cambio que quieras</div>' +
    '<form id="mesa-claude-f" class="mesa-claude-f" autocomplete="off"><input type="text" id="mesa-claude-txt" autocomplete="off" autocorrect="off" spellcheck="true" name="peticion-claude-' + Date.now() + '" placeholder="Ej.: cambia el titular por una pregunta" maxlength="300"' + (MESA.pidiendo ? ' disabled' : '') + '>' +
    '<button type="submit" class="btn pri"' + (MESA.pidiendo ? ' disabled' : '') + '>' + (MESA.pidiendo ? 'Claude está escribiendo…' : 'Pedir') + '</button></form>' +
    (MESA.respuesta && !MESA.pidiendo && MESA.respC === EST.abierto ? '<p class="mesa-claude-r" role="status">' + esc(MESA.respuesta) + '</p>' : '') + '</div>';
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
      ((c.versiones || []).length ? '<button class="btn" id="mesa-anterior" title="Volver a la versión de antes de «Otra versión»">↺ Anterior</button>' : '');
    // sin «▦ Ver todo»: las miniaturas de abajo ya enseñan todas las slides
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
  // «+ campo» y pulsar en la slide grande: ahora los lleva seleccion.js (editor flotante sobre la slide)
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

/* ---------- Chat con Claude como el de la newsletter (19/10/2026, pedido de Sandra) ----------
   Conversación guardada en el carrusel (c.chat, últimos 30 mensajes): tus mensajes a la derecha en verde, los de Claude a
   la izquierda; caja de texto con botón redondo de enviar (Intro envía, Mayús+Intro = otra línea). Claude recibe también
   lo último que habéis hablado, para que entienda «no, más corto» o «vuelve a lo de antes». */
const CHAT_MAX = 30;
htmlCajaClaude = function () {
  const c = EST.lista[EST.abierto] || {}, log = (c.chat || []).slice(-CHAT_MAX);
  const msgs = log.map(m => '<div class="mchat-msg ' + (m.role === 'user' ? 'tu' : 'cl') + '">' + esc(m.text) + '</div>').join('') +
    (MESA.pidiendo && MESA.respC === EST.abierto ? '<div class="mchat-msg cl pensando">Claude está escribiendo…</div>' : '');
  return '<div class="mesa-claude mchat" id="mesa-claude"><div class="mchat-h">Claude</div>' +
    '<div class="mchat-log" id="mchat-log">' + (msgs || '<p class="mchat-vacio">Pídele lo que quieras cambiar. Mejor si dices el número de la slide: «en la slide 2, cambia el titular por una pregunta».</p>') + '</div>' +
    '<form id="mesa-claude-f" class="mchat-f" autocomplete="off"><textarea id="mesa-claude-txt" rows="2" maxlength="600" spellcheck="true" placeholder="Pídele a Claude un cambio…"' + (MESA.pidiendo ? ' disabled' : '') + '></textarea>' +
    '<button type="submit" class="mchat-env" aria-label="Enviar"' + (MESA.pidiendo ? ' disabled' : '') + '><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form></div>';
};
const _pintarCajaChat = pintarCajaClaude;
pintarCajaClaude = function () { _pintarCajaChat(); const l = document.getElementById('mchat-log'); if (l) l.scrollTop = l.scrollHeight; };
const _promptSlideChat = promptSlide;
promptSlide = function (c, i, peticion) {
  const p = _promptSlideChat(c, i, peticion), prev = (c.chat || []).slice(0, -1).slice(-8);
  if (!prev.length) return p;
  const hist = 'LO ÚLTIMO QUE HABÉIS HABLADO (para entender a qué se refiere; no lo repitas):\n' +
    prev.map(m => (m.role === 'user' ? 'Sandra: ' : 'Tú: ') + m.text).join('\n') + '\n\n';
  return p.replace('LO QUE PIDE SANDRA:', hist + 'LO QUE PIDE SANDRA:');
};
const _pedirChat = pedirCambioSlide;
pedirCambioSlide = async function (peticion) {
  const c = EST.lista[EST.abierto], t = String(peticion || '').trim();
  if (!c || !t || MESA.pidiendo || !EST.sample) return _pedirChat(peticion);
  c.chat = (c.chat || []).concat([{role: 'user', text: t}]).slice(-CHAT_MAX);
  await _pedirChat(peticion);
  const cc = EST.lista[c.id] || c;
  if (cc !== c) cc.chat = c.chat;
  cc.chat = (cc.chat || []).concat([{role: 'bot', text: String(MESA.respuesta || '').replace(/\s*·\s*Si no te gusta: (?:↶ Deshacer|Ctrl/⌘ + Z)\s*$/, '')}]).slice(-CHAT_MAX);
  guardarC(cc);
  if (EST.abierto === cc.id) { pintarCajaClaude(); const x = document.getElementById('mesa-claude-txt'); if (x) x.focus(); }
};
// Intro envía; Mayús+Intro, otra línea
document.addEventListener('keydown', e => {
  if (e.target && e.target.id === 'mesa-claude-txt' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault(); const f = document.getElementById('mesa-claude-f'); if (f) f.requestSubmit();
  }
});
