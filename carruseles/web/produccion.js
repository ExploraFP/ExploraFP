/* ===================== Producción e Inventario, más claros =====================
   Cuatro estados con nombre fijo en toda la web: Por generar → En revisión → Listo → Publicado.
   · Producción es un tablero de 3 columnas; cada tarjeta tiene UN botón principal según su columna y un menú ⋯.
   · «Aprobar» pasa de En revisión a Listo (c.listo = true); «Marcar como publicado» pide fecha y enlace de Instagram
     (c.estado = 'hecho', c.fecha, c.ig) y lo manda a Inventario.
   · Editor: pestañas «Slide» / «Caption», selector de fotos con buscador y filtros, avisos que llevan a su slide.
   · Inventario: por meses, con buscador y filtros de objetivo y formación; un botón (Abrir) y el resto en ⋯. */
const ETAPAS = {generar: 'Por generar', revision: 'En revisión', listo: 'Listo', publicado: 'Terminado'};
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
  // Proceso de Sandra: fuera solo se ve la info básica (formación, objetivo, estado, avisos) y se puede borrar.
  // Todo lo demás (OK, descargar, publicar, caption…) se hace dentro, pinchando la tarjeta. Generar sigue fuera: sin slides no hay nada que abrir.
  const menu = '';
  const ideaC = c.idea && IMAP[c.idea];   // formación o rama de su idea, visible sin abrir el carrusel
  const abre = e !== 'generar' ? 'data-est-abrir="' + c.id + '"' : '';
  const borrar = e !== 'publicado' && c.estado !== 'generando' ? '<button type="button" class="pr-borrar" data-pr-devolver="' + c.id + '" aria-label="Borrar de Producción" title="Borrar de Producción">🗑</button>' : '';
  return '<article class="est-tarjeta pr-tarjeta e-' + e + (c.slides.length ? '' : ' est-previa') + (abre ? ' pr-abrible' : '') + '">' + borrar +
    mini(vista, 0, abre ? {boton: abre + ' aria-label="Abrir ' + esc(c.titulo || 'carrusel') + '"'} : null) +
    '<div class="est-tcuerpo"><h4>' + (abre ? '<button type="button" class="pr-titulo" ' + abre + '>' + esc(c.titulo || c.tema || '(sin título)') + '</button>' : esc(c.titulo || c.tema || '(sin título)')) + '</h4>' +
    '<div class="est-tmeta">' + (ideaC ? chipAlcance(ideaC) : '') + objChip(c) + pillEtapa(c) + '</div>' +
    (e === 'publicado' ? '<p class="inv-fecha">' + (c.fecha ? 'Publicado el ' + esc(new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-ES')) : 'Sin fecha') + '</p>' : '') +
    (nota ? '<p class="est-pista"' + (c.estado === 'error' ? ' style="color:var(--danger)"' : '') + '>' + esc(nota) + '</p>' : '') +
    // sin avisos de revisión en la tarjeta: se ven al abrir el carrusel (pedido de Sandra)

    (pri || menu ? '<div class="est-tpie pr-pie">' + pri + menu + '</div>' : '') + '</div></article>';
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
  if (!lista.length && !carruselesDe('hecho').length) return h + '<div class="vacio"><b>No hay nada en producción</b>Elige una idea en Inicio o en la Matriz y pulsa «Producir».</div>';
  const vacio = {generar: 'Ninguno.', revision: 'Ninguno.', listo: 'Ninguno.', publicado: 'Ninguno.'};
  // Sandra prefiere las tarjetas grandes de antes: dos bloques (En revisión · Listo para publicar), uno debajo de otro,
  // cada uno con su rejilla de tarjetas grandes. «Por generar» solo sale mientras haya algo sin generar.
  col.publicado = carruselesDe('hecho').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const secciones = (col.generar.length ? ['generar'] : []).concat(['revision', 'listo', 'publicado']);
  h += secciones.map(k =>
    '<section class="pr-sec pr-' + k + '"><header><h3>' + (k === 'publicado' ? 'Terminados' : ETAPAS[k]) + (k === 'listo' ? ' para publicar' : '') + ' <b>' + col[k].length + '</b></h3></header>' +
      (col[k].length ? '<div class="est-rejilla">' + col[k].map(tarjeta).join('') + '</div>' : '<p class="pr-vacio">' + vacio[k] + '</p>') + '</section>').join('');
  return h;
};

/* ---------- pasar de etapa ---------- */
function darOK(c, forzar) {
  if (!qcMedido(c)) { toast('Espera un segundo: estoy revisando las slides'); pedirQC(c); return false; }
  if (qcErrores(c) && !forzar && EST.forzar !== c.id) { EST.forzar = c.id; toast('Hay ' + qcErrores(c) + ' cosas por corregir. Pulsa otra vez si aun así está bien'); if (EST.abierto) pintarEditor(true); return false; }
  EST.forzar = null; c.listo = true; guardarC(c); return true;
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
  guardarC(c); asegurarIdea(c); if (c.idea && IMAP[c.idea]) guardar(c.idea, {hecho: true, fecha: f});
  cerrarPanel(); if (EST.abierto) cerrarEditor(); else render();
  toast('✓ Publicado. Lo tienes en «Terminados»');
}
// si el carrusel no tiene idea en la Matriz, se crea una con sus datos y se enlaza (así todo lo hecho está en la Matriz)
function asegurarIdea(c) {
  if (!c || (c.idea && IMAP[c.idea])) return;
  const s0 = (c.slides || [])[0] || {};
  const d = {id: 'N' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase(),
    titular: String(c.titulo || c.tema || 'Carrusel').replace(/\*/g, ''), dentro: String(s0.subtitulo || '').replace(/\*/g, ''), gancho: '', ganchoLabel: 'Idea',
    objetivo: OBJETIVOS[c.objetivo] ? c.objetivo : 'informativo', subtipo: '', formacion: '', funnel: 'TOFU', creada: new Date().toISOString(), desdeCarrusel: c.id};
  if (typeof anadirIdea === 'function') anadirIdea(d, true);
  if (DB) DB.doc('ideas/' + d.id).set(d).catch(() => {});
  c.idea = d.id; guardarC(c);
}
// al cargar: los terminados que no tengan idea (añadidos antes de este cambio) se enlazan una vez
setTimeout(function revisarIdeas() {
  if (!DB) return setTimeout(revisarIdeas, 1500);
  Object.values(EST.lista).filter(c => c.estado === 'hecho' && !(c.idea && IMAP[c.idea])).forEach(asegurarIdea);
}, 4000);
function abrirDevolver(id) {
  const c = EST.lista[id]; if (!c) return;
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja ft-aviso-borrar" role="alertdialog" aria-modal="true" aria-labelledby="pr-dv-t"><div class="cuerpo">' +
    '<h2 id="pr-dv-t">¿Borrar «' + esc(String(c.titulo || c.tema || 'este carrusel').replace(/\*/g, '')) + '» de Producción?</h2>' +
    '<p>' + (c.slides.length ? 'Se borran sus slides y no se pueden recuperar. ' : '') + (c.idea && IMAP[c.idea] ? 'La idea no se borra: vuelve a estar «por hacer» en la Matriz.' : '') + '</p></div>' +
    '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn ft-si" data-pr-devolver-ok="' + esc(id) + '">Sí, borrar</button></footer></div>';
}

/* ---------- editor: cabecera con la etapa, pestañas y fotos con buscador ---------- */
EST.pestana = 'slide'; EST.fq = ''; EST.fr = ''; EST.fo = '';
function gridFotosEditor(s) {
  const q = norm(EST.fq);
  const lista = (typeof fotosCatalogo === 'function' ? fotosCatalogo().filter(f => !f.oculta) : FOTOS.map(f => ({ruta: f.ruta, desc: f.desc})))
    .filter(f => (!EST.fr || f.rama === EST.fr) && (!EST.fo || f.orientacion === EST.fo) &&
      (!q || norm([f.desc, f.rama, f.personas, f.tono].concat(f.etiquetas || []).join(' ')).indexOf(q) >= 0));
  return lista.map(f => '<button data-est-foto="' + esc(f.ruta) + '" aria-pressed="' + (s.imagen === f.ruta) + '" title="' + esc(f.desc) + '"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '" loading="lazy"></button>').join('') +
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
    if (hb) hb.outerHTML = e === 'revision' ? '<button class="btn pri" id="pr-ok">Aprobar</button>'
      : e === 'listo' ? '<button class="btn pri" data-pr-publicar="' + c.id + '">Marcar como publicado</button>'
      : e === 'publicado' ? '<span class="pr-pub">✓ Publicado' + (c.fecha ? ' el ' + esc(fCorta(c.fecha)) : '') + '</span>' : '';
    const dl = cab.querySelector('#est-descargar'); if (dl) dl.textContent = '⬇ Descargar';
    // lo que antes estaba en el ⋯ de la tarjeta vive ahora dentro
    // sin menú ⋯ (pedido de Sandra): lo poco que hace falta va como enlace pequeño junto al estado
    const links = [e === 'listo' ? '<button type="button" data-pr-revision="' + c.id + '">Volver a revisión</button>' : '',
      e === 'publicado' ? '<button type="button" data-pr-publicar="' + c.id + '">Cambiar fecha o enlace</button>' : '',
      e === 'publicado' && c.ig ? '<a href="' + esc(c.ig) + '" target="_blank" rel="noopener">Ver en Instagram ↗</a>' : ''].filter(Boolean);
    const pill = cab.querySelector('.pr-etapa'); if (links.length && pill) pill.insertAdjacentHTML('afterend', '<span class="eb-links">' + links.join('') + '</span>');
  }
  const panel = $('#est-panel'); if (!panel || panel.querySelector('.pr-tabs')) return;
  // pestañas: todo lo de la slide / el texto del post
  const hs = [...panel.querySelectorAll('h3')], hPost = hs.find(x => /Caption/.test(x.textContent));
  const qc = panel.querySelector('#est-qc');
  if (hPost && qc) {
    const slide = document.createElement('div'); slide.className = 'pr-tab pr-tab-slide';
    const post = document.createElement('div'); post.className = 'pr-tab pr-tab-post';
    let n = qc.nextSibling; while (n && n !== hPost) { const sig = n.nextSibling; slide.appendChild(n); n = sig; }
    n = hPost; while (n) { const sig = n.nextSibling; post.appendChild(n); n = sig; }
    hPost.remove();
    const tabs = document.createElement('div'); tabs.className = 'pr-tabs'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button role="tab" data-pr-tab="slide" aria-selected="' + (EST.pestana === 'slide') + '">✏️ Slide ' + (EST.sel + 1) + ' de ' + c.slides.length + '</button>' +
      '<button role="tab" data-pr-tab="post" aria-selected="' + (EST.pestana === 'post') + '">📝 Caption' + (c.copy ? '' : ' <i>vacío</i>') + '</button>';
    qc.after(tabs); tabs.after(slide); slide.after(post);
    panel.dataset.tab = EST.pestana;
  }
  // foto: la actual y «Cambiar foto»; el buscador con toda la galería se abre en una ventana (pedido de Sandra)
  const fg = panel.querySelector('.est-fotos');
  if (fg) {
    const s = c.slides[EST.sel] || {}, f = s.imagen && (typeof fotosCatalogo === 'function' ? fotosCatalogo() : FOTOS).find(x => x.ruta === s.imagen);
    fg.outerHTML = '<div class="pr-fotoact">' + (s.imagen ? '<img src="' + esc(s.imagen) + '" alt="">' : '<span class="pr-sinfoto">Sin foto</span>') +
      '<div><p>' + esc(s.imagen ? (f && f.desc || 'Foto') : 'Esta slide no lleva foto') + '</p>' +
      '<button type="button" class="btn mini" data-pr-fotos>' + (s.imagen ? 'Cambiar foto' : 'Poner foto') + '</button>' +
      (s.imagen ? ' <button type="button" class="btn mini" data-est-foto="">Quitar</button>' : '') + '</div></div>';
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
        c && c.copy ? itemMenu('data-est-copiar="' + c.id + '"', 'Copiar caption') : '',
        c && c.ig ? '<a href="' + esc(c.ig) + '" target="_blank" rel="noopener">Ver en Instagram ↗</a>' : '',
        x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">Abrir en Drive ↗</a>' : '',
        it ? itemMenu('data-abrir="' + it.id + '"', 'Ver ficha de la idea') : itemMenu('data-enlazar="' + esc(x.clave) + '"', 'Unir a una idea'),
        c ? itemMenu('data-pr-publicar="' + c.id + '"', 'Cambiar fecha o enlace') : '',
        x.propio ? itemMenu('data-editar="' + x.id + '"', 'Editar') : '']);
      const pri = c ? '<button class="btn" data-est-abrir="' + c.id + '">Abrir</button>'
        : x.url ? '<a class="btn pri" href="' + esc(x.url) + '" target="_blank" rel="noopener">Abrir en Drive</a>' : (x.propio ? '<button class="btn pri" data-editar="' + x.id + '">Editar</button>' : '');
      return '<article class="est-tarjeta pr-tarjeta">' + (c ? mini(c, 0) : '<div class="est-mini"><span class="est-vacia">' + (x.url ? 'En Drive' : 'Añadido a mano') + '</span></div>') +
        '<div class="est-tcuerpo"><h4>' + esc(x.titulo || '(sin título)') + '</h4>' +
        '<div class="est-tmeta">' + (it ? chipAlcance(it) : '') + (ob && OBJETIVOS[ob] ? '<span class="mz-objtag">' + esc(objEt(ob)) + '</span>' : '') + '</div>' +
        (c && c.origen ? '<p class="pr-copia">♻️ Reutilizado de uno publicado' + (c.origenFecha ? ' el ' + esc(new Date(c.origenFecha + 'T00:00:00').toLocaleDateString('es-ES')) : '') + '</p>' : '') +
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
  const dp = t.closest('[data-pr-despublicar]'); if (dp) { const c = EST.lista[dp.dataset.prDespublicar]; if (c) { c.estado = 'borrador'; c.listo = true; guardarC(c); render(); if (EST.abierto) pintarEditor(true); toast('Vuelve a «Listo para publicar»'); } return; }
  const pb = t.closest('[data-pr-publicar]'); if (pb) { e.stopImmediatePropagation(); abrirPublicar(pb.dataset.prPublicar); return; }
  const po = t.closest('[data-pr-publicar-ok]'); if (po) { publicar(po.dataset.prPublicarOk); return; }
  const dv = t.closest('[data-pr-devolver]'); if (dv) { abrirDevolver(dv.dataset.prDevolver); return; }
  const dvo = t.closest('[data-pr-devolver-ok]'); if (dvo) { borrarC(dvo.dataset.prDevolverOk); cerrarPanel(); render(); toast('Borrado de Producción'); return; }
  const ok = t.closest('[data-pr-ok]'); if (ok) { const c = EST.lista[ok.dataset.prOk]; if (c && darOK(c)) render(); return; }
  const rv = t.closest('[data-pr-revision]'); if (rv) { const c = EST.lista[rv.dataset.prRevision]; if (c) { c.listo = false; guardarC(c); render(); if (EST.abierto) pintarEditor(true); toast('Vuelve a revisión'); } return; }
  // al aprobar se cierra: un carrusel aprobado ya no se edita, solo se ve en «Listo para publicar»
  if (t.id === 'pr-ok') { const c = EST.lista[EST.abierto]; if (c && darOK(c)) { cerrarEditor(); S.v = 'producir'; render(); toast('✓ Aprobado. Está en «Listo para publicar»'); } return; }
  const tab = t.closest('[data-pr-tab]'); if (tab) { EST.pestana = tab.dataset.prTab; const p = $('#est-panel'); if (p) p.dataset.tab = EST.pestana;
    document.querySelectorAll('[data-pr-tab]').forEach(b => b.setAttribute('aria-selected', String(b === tab))); return; }
  if (t.closest('#est-qc [data-est-sel]') || t.closest('#est-qc li')) { EST.pestana = 'slide';
    setTimeout(() => { const p = $('#est-panel'); if (p) p.dataset.tab = 'slide'; document.querySelectorAll('[data-pr-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.prTab === 'slide'))); }, 0); }
}, true);
function abrirFotos() {
  const c = EST.lista[EST.abierto]; if (!c) return; const s = c.slides[EST.sel] || {};
  const sel = (id, vacio, lista, v) => '<select id="' + id + '" aria-label="' + vacio + '"><option value="">' + vacio + '</option>' + lista.map(x => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja pr-fotomodal" role="dialog" aria-modal="true" aria-label="Elegir foto"><header><k>Slide ' + (EST.sel + 1) + '</k><h2>Elige la foto</h2></header><div class="cuerpo">' +
    '<div class="pr-fbusca"><input type="search" id="pr-fq" autocomplete="off" placeholder="Busca foto: portátil, estrés…" value="' + esc(EST.fq) + '" aria-label="Buscar foto">' +
    (typeof FOTO_RAMAS !== 'undefined' ? sel('pr-fr', 'Rama', FOTO_RAMAS, EST.fr) + sel('pr-fo', 'Orientación', FOTO_ORIENT, EST.fo) : '') + '</div>' +
    '<div class="est-fotos">' + gridFotosEditor(s) + '</div></div><footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cerrar</button></footer></div>';
  setTimeout(() => { const i = $('#pr-fq'); if (i) i.focus(); }, 30);
}
const gridFotosVisible = () => document.querySelector('.pr-fotomodal .est-fotos');
document.addEventListener('click', e => {
  const t = e.target; if (!t.closest) return;
  if (t.closest('[data-pr-fotos]')) { abrirFotos(); return; }
  if (t.closest('.pr-fotomodal [data-est-foto]')) { setTimeout(cerrarPanel, 0); return; }
  const vi = t.closest('[data-pr-veridea]'); if (vi) { const id = vi.dataset.prVeridea; cerrarEditor(); S.v = 'ideas'; render(); if (typeof abrir === 'function') abrir(id); }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'pr-fq') return;
  EST.fq = e.target.value; const c = EST.lista[EST.abierto], g = gridFotosVisible();
  if (c && g) g.innerHTML = gridFotosEditor(c.slides[EST.sel] || {});
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'pr-fr' || t.id === 'pr-fo') { EST[t.id === 'pr-fr' ? 'fr' : 'fo'] = t.value; const c = EST.lista[EST.abierto], g = gridFotosVisible(); if (c && g) g.innerHTML = gridFotosEditor(c.slides[EST.sel] || {}); return; }
  if (t.dataset && t.dataset.inv) { INV[t.dataset.inv] = t.value; render(); }
});

const _renderSinInv = render;
render = function () { if (S.v === 'hechos' || S.v === 'inventario') S.v = 'producir'; _renderSinInv(); };
