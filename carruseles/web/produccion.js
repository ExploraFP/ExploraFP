/* ===================== Producción e Inventario, más claros =====================
   Cuatro estados con nombre fijo en toda la web: Por generar → En revisión → Listo → Publicado.
   · Producción es un tablero de 3 columnas; cada tarjeta tiene UN botón principal según su columna y un menú ⋯.
   · «Dar el OK» pasa de En revisión a Listo (c.listo = true); «Marcar como publicado» pide fecha y enlace de Instagram
     (c.estado = 'hecho', c.fecha, c.ig) y lo manda a Inventario.
   · Editor: pestañas «Slide» / «Texto del post», selector de fotos con buscador y filtros, avisos que llevan a su slide.
   · Inventario: por meses, con buscador y filtros de objetivo y formación; un botón (Abrir) y el resto en ⋯. */
const ETAPAS = {generar: 'Por generar', revision: 'En revisión', listo: 'Listo', publicado: 'Publicado'};
function etapaDe(c) {
  if (c.estado === 'hecho') return 'publicado';
  if (!c.slides || !c.slides.length || c.estado === 'pendiente' || c.estado === 'error' || c.estado === 'generando') return 'generar';
  return c.listo ? 'listo' : 'revision';
}
const pillEtapa = c => { const e = etapaDe(c); return '<span class="pr-etapa e-' + e + '">' + ETAPAS[e] + '</span>'; };
const objChip = c => c.objetivo && OBJETIVOS[c.objetivo] ? '<span class="mz-objtag">' + esc(objEt(c.objetivo)) + '</span>' : '';

function menuPuntos(items) {
  return '<details class="pr-menu"><summary aria-label="Más opciones" title="Más opciones">⋯</summary><div class="pr-menu-lista">' +
    items.filter(Boolean).join('') + '</div></details>';
}
const itemMenu = (attr, txt, peligro) => '<button type="button" class="' + (peligro ? 'peligro' : '') + '" ' + attr + '>' + txt + '</button>';

// tarjeta del tablero (también la usa Inicio)
tarjeta = function (c) {
  const e = etapaDe(c);
  const vista = c.slides.length ? c : previa('p-' + c.id, c.plantilla, c.color, c.titulo || c.tema, c.idea && IMAP[c.idea] ? IMAP[c.idea].alcTxt : '', c.portada === 'foto');
  const nota = c.estado === 'generando' ? '✨ Claude lo está escribiendo…' : c.estado === 'error' ? '⚠ ' + (c.error || 'No se pudo generar') : c.estado === 'pendiente' ? 'Así quedará la portada' : '';
  let pri = '';
  if (e === 'generar') pri = c.estado === 'generando' ? '<button class="btn pri" disabled>Generando…</button>'
    : '<button class="btn pri" data-est-generar="' + c.id + '">' + (c.estado === 'error' ? 'Reintentar' : 'Generar') + '</button>';
  else if (e === 'revision') pri = '<button class="btn pri" data-est-abrir="' + c.id + '">Revisar</button>';
  else if (e === 'listo') pri = '<button class="btn pri" data-est-descargar="' + c.id + '">⬇ Descargar</button><button class="btn" data-pr-publicar="' + c.id + '">Marcar como publicado</button>';
  const menu = c.estado === 'generando' ? '' : menuPuntos([
    e !== 'generar' ? itemMenu('data-est-abrir="' + c.id + '"', e === 'listo' ? 'Abrir' : 'Abrir el editor') : '',
    e === 'listo' ? itemMenu('data-pr-revision="' + c.id + '"', 'Volver a revisión') : '',
    e === 'revision' ? itemMenu('data-pr-ok="' + c.id + '"', 'Dar el OK sin abrirlo') : '',
    c.copy ? itemMenu('data-est-copiar="' + c.id + '"', 'Copiar texto del post') : '',
    itemMenu('data-pr-devolver="' + c.id + '"', 'Devolver a la Matriz', true)]);
  return '<article class="est-tarjeta pr-tarjeta e-' + e + (c.slides.length ? '' : ' est-previa') + '">' + mini(vista, 0) +
    '<div class="est-tcuerpo"><h4>' + esc(c.titulo || c.tema || '(sin título)') + '</h4>' +
    '<div class="est-tmeta">' + objChip(c) + '<span>' + esc(nombrePl(c.plantilla)) + ' · ' + esc(nombreCo(c.color)) + (c.slides.length ? ' · ' + c.slides.length + ' slides' : '') + '</span></div>' +
    (nota ? '<p class="est-pista"' + (c.estado === 'error' ? ' style="color:var(--danger)"' : '') + '>' + esc(nota) + '</p>' : '') +
    (e === 'revision' ? '<div class="est-tmeta" data-qc-chip="' + c.id + '">' + chipQC(c) + '</div>' : '') +
    '<div class="est-tpie pr-pie">' + pri + menu + '</div></div></article>';
};
// el chip de calidad ya no dice «Listo» (Listo es una etapa que da Sandra): dice «Sin avisos»
const _chipQCpr = chipQC;
chipQC = function (c) { return _chipQCpr(c).replace('✓ Listo', '✓ Sin avisos'); };

vProducir = function () {
  const lista = carruselesDe('pendientes');
  const col = {generar: [], revision: [], listo: []};
  lista.forEach(c => col[etapaDe(c)] && col[etapaDe(c)].push(c));
  const faltan = col.generar.filter(c => c.estado === 'pendiente' || c.estado === 'error').length;
  let h = cabecera('Producción', '', []);
  h += '<div class="est-acciones">' +
    (faltan ? '<button class="btn pri" id="est-generar-todas"' + (EST.cola ? ' disabled' : '') + '>✨ Generar ' + (faltan === 1 ? 'el que falta' : 'los ' + faltan + ' que faltan') + '</button>' : '') +
    '<span class="est-progreso">' + esc(EST.progreso || '') + '</span>' +
    (faltan && !EST.sample && EST.conectado ? '<span class="est-pista">Para generar, abre la web en claude.ai.</span>' : '') + '</div>';
  if (!lista.length) return h + '<div class="vacio"><b>No hay nada en producción</b>Elige una idea en Inicio o en la Matriz y pulsa «Producir».</div>';
  const vacio = {generar: 'Nada pendiente de generar.', revision: 'Nada que revisar.', listo: 'Cuando des el OK a un carrusel, aparece aquí para descargarlo y publicarlo.'};
  const pista = {generar: 'Claude escribe las slides', revision: 'Revisa y da el OK', listo: 'Descarga y publica'};
  h += '<div class="pr-tablero">' + ['generar', 'revision', 'listo'].map((k, i) =>
    '<section class="pr-col pr-' + k + '"><header><span class="pr-num">' + (i + 1) + '</span><div><h3>' + ETAPAS[k] + (k === 'listo' ? ' para publicar' : '') +
      ' <b>' + col[k].length + '</b></h3><p>' + pista[k] + '</p></div></header>' +
      (col[k].length ? col[k].map(tarjeta).join('') : '<p class="pr-vacio">' + vacio[k] + '</p>') + '</section>').join('') + '</div>';
  return h;
};

/* ---------- pasar de etapa ---------- */
function darOK(c, forzar) {
  if (!qcMedido(c)) { toast('Espera un segundo: estoy revisando las slides'); pedirQC(c); return false; }
  if (qcErrores(c) && !forzar && EST.forzar !== c.id) { EST.forzar = c.id; toast('Hay ' + qcErrores(c) + ' cosas por corregir. Pulsa otra vez si aun así está bien'); if (EST.abierto) pintarEditor(true); return false; }
  EST.forzar = null; c.listo = true; guardarC(c); toast('✓ Listo para publicar'); return true;
}
function abrirPublicar(id) {
  const c = EST.lista[id]; if (!c) return;
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja pr-publicar" role="dialog" aria-modal="true" aria-label="Marcar como publicado"><header><k>Marcar como publicado</k><h2>' + esc(c.titulo || 'Carrusel') + '</h2></header><div class="cuerpo">' +
    '<label class="mz-cta">Fecha de publicación<input type="date" id="pr-fecha" value="' + esc(c.fecha || fISO(hoy())) + '"></label>' +
    '<label class="mz-cta">Enlace del post en Instagram <small>(opcional)</small><input type="url" id="pr-ig" placeholder="https://www.instagram.com/p/…" value="' + esc(c.ig || '') + '"></label>' +
    '<p class="est-pista">Pasará a Inventario. Siempre puedes volver a abrirlo desde allí.</p></div>' +
    '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn pri" data-pr-publicar-ok="' + esc(id) + '">✓ Publicado</button></footer></div>';
  setTimeout(() => { const i = $('#pr-fecha'); if (i) i.focus(); }, 30);
}
function publicar(id) {
  const c = EST.lista[id]; if (!c) return;
  const f = ($('#pr-fecha').value || fISO(hoy())), ig = ($('#pr-ig').value || '').trim();
  if (ig && !/^https?:\/\//.test(ig)) { toast('El enlace tiene que empezar por https://'); return; }
  c.estado = 'hecho'; c.listo = true; c.fecha = f; if (ig) c.ig = ig; else delete c.ig;
  guardarC(c); if (c.idea && IMAP[c.idea]) guardar(c.idea, {hecho: true, fecha: f});
  cerrarPanel(); if (EST.abierto) cerrarEditor(); else render();
  toast('✓ Publicado. Lo tienes en Inventario');
}
function abrirDevolver(id) {
  const c = EST.lista[id]; if (!c) return;
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja ft-aviso-borrar" role="alertdialog" aria-modal="true" aria-labelledby="pr-dv-t"><div class="cuerpo">' +
    '<h2 id="pr-dv-t">¿Devolver «' + esc(c.titulo || c.tema || 'este carrusel') + '» a la Matriz?</h2>' +
    '<p>' + (c.slides.length ? 'Se borra este borrador con sus slides. La idea vuelve a estar «por hacer» en la Matriz.' : 'Sale de Producción y la idea vuelve a estar «por hacer».') + '</p></div>' +
    '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn ft-si" data-pr-devolver-ok="' + esc(id) + '">Devolver</button></footer></div>';
}

/* ---------- editor: cabecera con la etapa, pestañas y fotos con buscador ---------- */
EST.pestana = 'slide'; EST.fq = ''; EST.fr = ''; EST.fo = '';
function gridFotosEditor(s) {
  const q = norm(EST.fq);
  const lista = (typeof fotosCatalogo === 'function' ? fotosCatalogo().filter(f => !f.oculta) : FOTOS.map(f => ({ruta: f.ruta, desc: f.desc})))
    .filter(f => (!EST.fr || f.rama === EST.fr) && (!EST.fo || f.orientacion === EST.fo) &&
      (!q || norm([f.desc, f.rama, f.personas, f.tono].concat(f.etiquetas || []).join(' ')).indexOf(q) >= 0));
  return '<button data-est-foto="" aria-pressed="' + !s.imagen + '">Sin foto</button>' +
    lista.map(f => '<button data-est-foto="' + esc(f.ruta) + '" aria-pressed="' + (s.imagen === f.ruta) + '" title="' + esc(f.desc) + '"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '" loading="lazy"></button>').join('') +
    (lista.length ? '' : '<p class="est-pista" style="grid-column:1/-1">Ninguna foto con ese filtro.</p>');
}
const _pintarEditorPr = pintarEditor;
pintarEditor = function (todo) {
  _pintarEditorPr(todo);
  const c = EST.lista[EST.abierto]; if (!c) return;
  const ed = $('#est-editor'), e = etapaDe(c);
  // cabecera: etapa + el botón que toca
  const cab = ed.querySelector('.est-ecab');
  if (cab && !cab.querySelector('.pr-etapa')) {
    const h2 = cab.querySelector('h2'); if (h2) h2.insertAdjacentHTML('afterend', pillEtapa(c));
    const hb = cab.querySelector('#est-hecho');
    if (hb) hb.outerHTML = e === 'revision' ? '<button class="btn pri" id="pr-ok">✓ Dar el OK</button>'
      : e === 'listo' ? '<button class="btn pri" data-pr-publicar="' + c.id + '">Marcar como publicado</button>'
      : e === 'publicado' ? '<span class="pr-pub">✓ Publicado' + (c.fecha ? ' el ' + esc(fCorta(c.fecha)) : '') + '</span>' : '';
    const dl = cab.querySelector('#est-descargar'); if (dl) dl.textContent = '⬇ Descargar';
  }
  const panel = $('#est-panel'); if (!panel || panel.querySelector('.pr-tabs')) return;
  // pestañas: todo lo de la slide / el texto del post
  const hs = [...panel.querySelectorAll('h3')], hPost = hs.find(x => /Texto del post/.test(x.textContent));
  const qc = panel.querySelector('#est-qc');
  if (hPost && qc) {
    const slide = document.createElement('div'); slide.className = 'pr-tab pr-tab-slide';
    const post = document.createElement('div'); post.className = 'pr-tab pr-tab-post';
    let n = qc.nextSibling; while (n && n !== hPost) { const sig = n.nextSibling; slide.appendChild(n); n = sig; }
    n = hPost; while (n) { const sig = n.nextSibling; post.appendChild(n); n = sig; }
    hPost.remove();
    const tabs = document.createElement('div'); tabs.className = 'pr-tabs'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button role="tab" data-pr-tab="slide" aria-selected="' + (EST.pestana === 'slide') + '">✏️ Slide ' + (EST.sel + 1) + ' de ' + c.slides.length + '</button>' +
      '<button role="tab" data-pr-tab="post" aria-selected="' + (EST.pestana === 'post') + '">📝 Texto del post' + (c.copy ? '' : ' <i>vacío</i>') + '</button>';
    qc.after(tabs); tabs.after(slide); slide.after(post);
    panel.dataset.tab = EST.pestana;
  }
  // fotos con buscador y filtros
  const fg = panel.querySelector('.est-fotos');
  if (fg) {
    const s = c.slides[EST.sel] || {};
    const sel = (id, vacio, lista, v) => '<select id="' + id + '" aria-label="' + vacio + '"><option value="">' + vacio + '</option>' + lista.map(x => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
    fg.insertAdjacentHTML('beforebegin', '<div class="pr-fbusca"><input type="search" id="pr-fq" placeholder="Busca foto: portátil, estrés…" value="' + esc(EST.fq) + '" aria-label="Buscar foto">' +
      (typeof FOTO_RAMAS !== 'undefined' ? sel('pr-fr', 'Rama', FOTO_RAMAS, EST.fr) + sel('pr-fo', 'Orientación', FOTO_ORIENT, EST.fo) : '') + '</div>');
    fg.innerHTML = gridFotosEditor(s);
  }
};
// los avisos de calidad llevan a su slide (toda la línea, no solo el botón)
document.addEventListener('click', e => {
  const li = e.target.closest && e.target.closest('#est-qc li');
  if (li && !e.target.closest('button')) { const b = li.querySelector('[data-est-sel]'); if (b) b.click(); }
}, true);

/* ---------- Inventario ---------- */
const INV = {obj: '', form: ''};
const MES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
vTodoHecho = function () {
  const q = norm(S.q).trim(), todos = todoHecho();
  const objDeX = x => (x.carrusel && x.carrusel.objetivo) || (x.idea && IMAP[x.idea] ? objDe(IMAP[x.idea]) : '');
  const formDeX = x => x.idea && IMAP[x.idea] ? IMAP[x.idea].alcTxt : '';
  let lista = todos.filter(x => (!q || norm(x.titulo).indexOf(q) >= 0) && (!INV.obj || objDeX(x) === INV.obj) && (!INV.form || formDeX(x) === INV.form));
  let h = cabecera('Inventario', '', [[todos.length, 'publicados', 'ok']]);
  const forms = [...new Set(todos.map(formDeX).filter(Boolean))].sort();
  h += '<div class="est-acciones inv-barra"><button class="btn pri" id="nuevoCarrusel">+ Añadir uno ya publicado</button>' +
    '<div class="mz-buscabarra inv-busca"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><input type="search" id="buscar" class="invbusca" value="' + esc(S.q) + '" placeholder="Busca un carrusel publicado…" aria-label="Buscar en el inventario"></div>' +
    '<label class="ft-sel' + (INV.obj ? ' activo' : '') + '"><select data-inv="obj" aria-label="Objetivo"><option value="">Objetivo</option>' + OBJ_ORDEN.map(k => '<option value="' + k + '"' + (INV.obj === k ? ' selected' : '') + '>' + esc(objEt(k)) + '</option>').join('') + '</select></label>' +
    (forms.length ? '<label class="ft-sel' + (INV.form ? ' activo' : '') + '"><select data-inv="form" aria-label="Formación"><option value="">Formación</option>' + forms.map(f => '<option' + (INV.form === f ? ' selected' : '') + '>' + esc(f) + '</option>').join('') + '</select></label>' : '') +
    '<span class="est-progreso">' + esc(EST.progreso || '') + '</span></div>';
  if (!lista.length) return h + '<div class="vacio"><b>' + (todos.length ? 'Nada con esos filtros' : 'Todavía no hay nada') + '</b>' +
    (todos.length ? 'Quita algún filtro o prueba con otra palabra.' : 'Cuando marques un carrusel como publicado en Producción, aparece aquí.') + '</div>';
  // agrupado por mes de publicación
  const grupos = {};
  lista.forEach(x => { const k = (x.fecha || '').slice(0, 7) || 'sin'; (grupos[k] = grupos[k] || []).push(x); });
  return h + Object.keys(grupos).sort().reverse().map(k => {
    const t = k === 'sin' ? 'Sin fecha' : MES_LARGO[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4);
    return '<section class="inv-mes"><h3>' + t + ' <span>' + grupos[k].length + '</span></h3><div class="est-rejilla">' + grupos[k].map(x => {
      const c = x.carrusel, it = x.idea ? IMAP[x.idea] : null, ob = objDeX(x);
      const menu = menuPuntos([
        c ? itemMenu('data-est-descargar="' + c.id + '"', '⬇ Descargar slides') : '',
        c && c.copy ? itemMenu('data-est-copiar="' + c.id + '"', 'Copiar texto del post') : '',
        c && c.ig ? '<a href="' + esc(c.ig) + '" target="_blank" rel="noopener">Ver en Instagram ↗</a>' : '',
        x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">Abrir en Drive ↗</a>' : '',
        it ? itemMenu('data-abrir="' + it.id + '"', 'Ver ficha de la idea') : itemMenu('data-enlazar="' + esc(x.clave) + '"', 'Unir a una idea'),
        c ? itemMenu('data-pr-publicar="' + c.id + '"', 'Cambiar fecha o enlace') : '',
        x.propio ? itemMenu('data-editar="' + x.id + '"', 'Editar') : '']);
      const pri = c ? '<button class="btn pri" data-est-abrir="' + c.id + '">Abrir</button>'
        : x.url ? '<a class="btn pri" href="' + esc(x.url) + '" target="_blank" rel="noopener">Abrir en Drive</a>' : (x.propio ? '<button class="btn pri" data-editar="' + x.id + '">Editar</button>' : '');
      return '<article class="est-tarjeta pr-tarjeta">' + (c ? mini(c, 0) : '<div class="est-mini"><span class="est-vacia">' + (x.url ? 'En Drive' : 'Añadido a mano') + '</span></div>') +
        '<div class="est-tcuerpo"><h4>' + esc(x.titulo || '(sin título)') + '</h4>' +
        '<div class="est-tmeta">' + (it ? chipAlcance(it) : '') + (ob && OBJETIVOS[ob] ? '<span class="mz-objtag">' + esc(objEt(ob)) + '</span>' : '') + '</div>' +
        '<p class="inv-fecha">' + (x.fecha ? 'Publicado el ' + esc(new Date(x.fecha + 'T00:00:00').toLocaleDateString('es-ES')) : 'Sin fecha') + (c && c.ig ? ' · <a href="' + esc(c.ig) + '" target="_blank" rel="noopener">Instagram ↗</a>' : '') + '</p>' +
        '<div class="est-tpie pr-pie">' + pri + menu + '</div></div></article>';
    }).join('') + '</div></section>';
  }).join('');
};

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target; if (!t.closest) return;
  // cerrar los menús ⋯ al pulsar fuera o al elegir
  document.querySelectorAll('details.pr-menu[open]').forEach(d => { if (!d.contains(t) || t.closest('.pr-menu-lista')) d.open = false; });
  const pb = t.closest('[data-pr-publicar]'); if (pb) { e.stopImmediatePropagation(); abrirPublicar(pb.dataset.prPublicar); return; }
  const po = t.closest('[data-pr-publicar-ok]'); if (po) { publicar(po.dataset.prPublicarOk); return; }
  const dv = t.closest('[data-pr-devolver]'); if (dv) { abrirDevolver(dv.dataset.prDevolver); return; }
  const dvo = t.closest('[data-pr-devolver-ok]'); if (dvo) { borrarC(dvo.dataset.prDevolverOk); cerrarPanel(); render(); toast('Devuelto a la Matriz'); return; }
  const ok = t.closest('[data-pr-ok]'); if (ok) { const c = EST.lista[ok.dataset.prOk]; if (c && darOK(c)) render(); return; }
  const rv = t.closest('[data-pr-revision]'); if (rv) { const c = EST.lista[rv.dataset.prRevision]; if (c) { c.listo = false; guardarC(c); render(); toast('Vuelve a revisión'); } return; }
  if (t.id === 'pr-ok') { const c = EST.lista[EST.abierto]; if (c && darOK(c)) pintarEditor(true); return; }
  const tab = t.closest('[data-pr-tab]'); if (tab) { EST.pestana = tab.dataset.prTab; const p = $('#est-panel'); if (p) p.dataset.tab = EST.pestana;
    document.querySelectorAll('[data-pr-tab]').forEach(b => b.setAttribute('aria-selected', String(b === tab))); return; }
  if (t.closest('#est-qc [data-est-sel]') || t.closest('#est-qc li')) { EST.pestana = 'slide';
    setTimeout(() => { const p = $('#est-panel'); if (p) p.dataset.tab = 'slide'; document.querySelectorAll('[data-pr-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.prTab === 'slide'))); }, 0); }
}, true);
document.addEventListener('input', e => {
  if (e.target.id !== 'pr-fq') return;
  EST.fq = e.target.value; const c = EST.lista[EST.abierto], g = document.querySelector('#est-panel .est-fotos');
  if (c && g) g.innerHTML = gridFotosEditor(c.slides[EST.sel] || {});
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'pr-fr' || t.id === 'pr-fo') { EST[t.id === 'pr-fr' ? 'fr' : 'fo'] = t.value; const c = EST.lista[EST.abierto], g = document.querySelector('#est-panel .est-fotos'); if (c && g) g.innerHTML = gridFotosEditor(c.slides[EST.sel] || {}); return; }
  if (t.dataset && t.dataset.inv) { INV[t.dataset.inv] = t.value; render(); }
});
