/* ===================== Tres etapas: Borrador → Para publicar → Publicado (Sandra, 22/10/2026) =====================
   Antes eran cuatro (Por generar · En revisión · Listo · Terminados) y «Listo» no dejaba editar.
   · Por dentro no cambia nada de los datos: «Por generar» y «En revisión» se ven juntas como Borrador
     (lo que está sin generar enseña su «Generar» / «Generando…»), Listo = Para publicar (c.listo) y Publicado = c.estado 'hecho'.
     Así los carruseles que ya existían quedan en su etapa nueva sin tocarlos.
   · Para publicar se puede seguir editando. Si cambias algo después de pasarlo, la tarjeta lo avisa («Editado después»).
   · En el editor, una barra de pasos arriba: pulsar un paso anterior vuelve atrás; pulsar el siguiente es avanzar.
   · Publicado sigue pidiendo el enlace de Instagram (Sandra, 19/10/2026). Sin arrastrar tarjetas. */
ETAPAS.generar = 'Borrador'; ETAPAS.revision = 'Borrador'; ETAPAS.listo = 'Para publicar'; ETAPAS.publicado = 'Publicado';
const PASOS = [['borrador', 'Borrador'], ['listo', 'Para publicar'], ['publicado', 'Publicado']];
const pasoDe = c => { const e = etapaDe(c); return e === 'generar' || e === 'revision' ? 'borrador' : e; };
function firmaOK(c) { return JSON.stringify([c.plantilla, c.color, c.slides, c.copy || '']); }
const editadoTrasOK = c => etapaDe(c) === 'listo' && c.okFirma && c.okFirma !== firmaOK(c);

// tarjeta: el aviso de «editado después de pasarlo a Para publicar»
const _tarjetaEt = tarjeta;
tarjeta = function (c) {
  const h = _tarjetaEt(c);
  return editadoTrasOK(c) ? h.replace(/(<span class="pr-etapa [^"]*">[^<]*<\/span>)/, '$1<span class="pr-editado" title="Has cambiado algo después de pasarlo a «Para publicar»">✏️ Editado después</span>') : h;
};

// Producción: tres bloques y tres filtros
if (PR_FILTRO === 'revision' || PR_FILTRO === 'generar') PR_FILTRO = 'borrador';
vProducir = function () {
  const lista = carruselesDe('pendientes');
  const col = {borrador: [], listo: [], publicado: []};
  lista.forEach(c => { const p = pasoDe(c); if (col[p]) col[p].push(c); });
  // Borrador: lo que se está generando o falta por generar, arriba; luego el último que abriste (19/10/2026)
  const vistos = prVistos(), sinGenerar = c => etapaDe(c) === 'generar' ? 0 : 1;
  col.borrador.sort((a, b) => sinGenerar(a) - sinGenerar(b) || (vistos[b.id] || 0) - (vistos[a.id] || 0) || String(b.upd || '').localeCompare(String(a.upd || '')));
  col.publicado = carruselesDe('hecho').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const faltan = lista.filter(c => c.estado === 'pendiente' || c.estado === 'error').length;
  let h = cabecera('Producción', '', []);
  h += '<div class="est-acciones">' +
    (faltan ? '<button class="btn pri" id="est-generar-todas"' + (EST.cola ? ' disabled' : '') + '>✨ Generar ' + (faltan === 1 ? 'el que falta' : 'los ' + faltan + ' que faltan') + '</button>' : '') +
    '<span class="est-progreso">' + esc(EST.progreso || '') + '</span>' +
    (faltan && !EST.sample && EST.conectado ? '<span class="est-pista">Para generar, abre la web en claude.ai.</span>' : '') + '</div>';
  if (!lista.length && !col.publicado.length) return h + '<div class="vacio"><b>No hay nada en producción</b>Elige una idea en la Matriz y pulsa «Producir».</div>';
  const todas = PASOS.map(p => p[0]), nombre = k => PASOS.find(p => p[0] === k)[1];
  if (PR_FILTRO !== 'todos' && !todas.includes(PR_FILTRO)) PR_FILTRO = 'todos';
  const secciones = PR_FILTRO === 'todos' ? todas : [PR_FILTRO];
  h += '<div class="mz-vistas pr-filtros" role="tablist" aria-label="Filtrar por etapa">' +
    [['todos', 'Todos', todas.reduce((n, k) => n + col[k].length, 0)]].concat(todas.map(k => [k, nombre(k), col[k].length]))
      .map(([k, t, n]) => '<button class="mz-vista" data-pr-filtro="' + k + '" aria-pressed="' + (PR_FILTRO === k) + '">' + t + ' <span>' + n + '</span></button>').join('') + '</div>';
  const tope = () => PR_FILTRO === 'todos' ? PR_CORTE : PR_LIMITE;
  const marcable = (c, k) => k !== 'publicado' && c.estado !== 'generando';
  [...PR_SEL].forEach(id => { const c = EST.lista[id]; if (!c || etapaDe(c) === 'publicado' || c.estado === 'generando') PR_SEL.delete(id); });
  h += '<div class="mz-selbar pr-selbar' + (PR_SEL.size ? ' on' : '') + '"><b>' + PR_SEL.size + (PR_SEL.size === 1 ? ' seleccionado' : ' seleccionados') + '</b>' +
    '<button class="btn pri" id="pr-sel-borrar">🗑 Borrar ' + (PR_SEL.size === 1 ? 'el seleccionado' : 'los ' + PR_SEL.size) + '</button>' +
    '<button class="linkbtn" id="pr-sel-quitar">Quitar la selección</button></div>';
  const casilla = c => '<label class="pr-chk" title="Seleccionar"><input type="checkbox" data-pr-sel="' + esc(c.id) + '"' + (PR_SEL.has(c.id) ? ' checked' : '') + ' aria-label="Seleccionar ' + esc(String(c.titulo || 'carrusel').replace(/\*/g, '')) + '"></label>';
  h += secciones.map(k => {
    const marcables = col[k].filter(c => marcable(c, k)), todos = marcables.length && marcables.every(c => PR_SEL.has(c.id));
    return '<section class="pr-sec pr-' + k + '" data-pr-etapa="' + k + '"><header><h3>' + nombre(k) + ' <b>' + col[k].length + '</b></h3>' +
      (marcables.length ? '<label class="pr-chksec"><input type="checkbox" data-pr-sel-sec="' + k + '"' + (todos ? ' checked' : '') + '> Seleccionar todos</label>' : '') + '</header>' +
      (col[k].length ? '<div class="est-rejilla">' + col[k].slice(0, tope()).map(c => { let t = tarjeta(c);
        if (marcable(c, k)) t = t.replace(/^<article class="/, '<article class="' + (PR_SEL.has(c.id) ? 'pr-marcada ' : '')).replace(/(<article [^>]*>)/, '$1' + casilla(c));
        return t; }).join('') + '</div>' : '<p class="pr-vacio">Ninguno.</p>') +
      (col[k].length > tope() ? '<button class="btn pr-mas" data-pr-mas="1">Ver ' + Math.min(PR_PAGINA, col[k].length - tope()) + ' más</button>' : '') +
      '</section>'; }).join('');
  return h;
};
// «Seleccionar todos» de Borrador marca también los que faltan por generar
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.prSelSec; if (k !== 'borrador') return;
  e.stopImmediatePropagation();
  carruselesDe('pendientes').filter(c => pasoDe(c) === 'borrador' && c.estado !== 'generando').forEach(c => { if (e.target.checked) PR_SEL.add(c.id); else PR_SEL.delete(c.id); });
  render();
}, true);

// editor: barra de pasos en el centro de la barra de arriba (sustituye a la pastilla de etapa: no se repite)
function htmlPasos(c) {
  const ahora = PASOS.findIndex(p => p[0] === pasoDe(c));
  return '<ol class="eb-pasos" aria-label="Etapa del carrusel">' + PASOS.map(([k, t], i) =>
    '<li><button type="button" data-pr-paso="' + k + '" class="' + (i < ahora ? 'hecho' : i === ahora ? 'actual' : '') + '"' + (i === ahora ? ' aria-current="step"' : '') +
    ' title="' + (i === ahora ? 'Está aquí' : i < ahora ? 'Volver a ' + t : t) + '">' + (i < ahora ? '✓ ' : '') + t + '</button></li>').join('') + '</ol>';
}
const _pintarEditorEt = pintarEditor;
pintarEditor = function (todo) {
  _pintarEditorEt(todo);
  const c = EST.lista[EST.abierto]; if (!c) return;
  const ed = $('#est-editor'), cab = ed && ed.querySelector('.est-ecab');
  if (cab && !cab.querySelector('.eb-pasos') && etapaDe(c) !== 'generar') {
    const centro = cab.querySelector('.eb-centro');
    if (centro) centro.insertAdjacentHTML('afterbegin', htmlPasos(c));
    cab.querySelectorAll('.eb-meta .pr-etapa').forEach(x => x.remove());
  }
  // Para publicar, ya descargado y sin enlace: el recordatorio de pegar el enlace sigue arriba del panel (19/10/2026)
  const panel = ed && ed.querySelector('#est-panel');
  if (panel && etapaDe(c) === 'listo' && c.descargado && !c.ig && !panel.querySelector('.sv-enlace'))
    panel.insertAdjacentHTML('afterbegin', '<div class="sv-enlace"><b>¿Ya lo has subido?</b><span>Pega el enlace de Instagram y queda como publicado.</span>' +
      '<div class="sv-enlace-fila"><input type="url" id="sv-ig" placeholder="https://www.instagram.com/p/…"><button type="button" class="eb-pri" id="sv-ig-ok">Publicado</button></div></div>');
};
function irAPaso(c, a) {
  const de = pasoDe(c); if (a === de) return;
  if (a === 'publicado') { abrirPublicar(c.id); return; }
  const antes = fotoEtapa(c);
  if (a === 'listo') {
    if (de === 'publicado') { c.estado = 'borrador'; c.listo = true; c.okFirma = firmaOK(c); guardarC(c); }
    else if (!darOK(c)) return;
    toast(de === 'publicado' ? 'Vuelve a «Para publicar»' : '✓ Para publicar. Ya puedes descargarlo');
  } else {
    if (de === 'publicado') c.estado = 'borrador';
    c.listo = false; guardarC(c); toast('Vuelve a «Borrador»');
  }
  apuntarEtapa(c, antes);
  if (EST.abierto) pintarEditor(true); else render();
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-pr-paso]'); if (!b) return;
  e.stopImmediatePropagation();
  const c = EST.lista[EST.abierto]; if (c) irAPaso(c, b.dataset.prPaso);
}, true);
// sin arrastrar tarjetas entre etapas (se cambia de etapa dentro del carrusel)
document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('[data-pr-mover]')) e.preventDefault(); }, true);
