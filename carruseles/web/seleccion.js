/* ===================== Mesa de trabajo: editar sobre la slide =====================
   Pedido de Sandra (oct-2026):
   · Pulsar un texto de la slide grande lo marca (borde lima) y el formulario de la derecha enseña SOLO ese texto
     (en una lista, solo ese punto). Se guarda mientras escribes.
   · Pulsar la flecha a mano: «Quitar flecha» (trazo: ninguno); vuelve con «Añadir: + Flecha».
   · Pulsar la foto la marca y el formulario enseña solo sus opciones (cambiar, quitar, cómo va).
   · Sin nada seleccionado, el panel tiene el chat con Claude y «Añadir: + campo» (sin «Tipo de slide»).
   · Plantilla y color: un solo sitio, el botón «Diseño» de la barra de arriba (sin desplegables repetidos).
   · Aprobar cierra el carrusel; en Listo y Terminado solo se ve (slides, caption con «Copiar caption», Descargar, publicar). Para editar: «Volver a revisión».
   · Sin «Otra versión» (Sandra: se cambia a mano o con el chat).
   · Al recargar, la web vuelve a la pestaña (y al carrusel) donde estaba. */
const SEL = {pop: null, diseno: false, original: null, tempo: 0};
const SEL_NOMBRES = {titulo: 'Titular', subtitulo: 'Subtítulo', antetitulo: 'Subtítulo', etiqueta: 'Etiqueta', numero: 'Número', texto: 'Texto',
  items: 'Punto', cifra: 'Cifra', fuente: 'Fuente', cta: 'Botón', cinta: 'Debajo del botón', nota: 'Nota'};
const SEL_CORTOS = ['titulo', 'etiqueta', 'numero', 'cifra', 'cta', 'cinta', 'fuente'];

/* ---------- recordar pestaña y carrusel abierto ---------- */
const SEL_PESTANAS = ['inicio', 'ideas', 'producir', 'fotos', 'datos'];
try { const v = localStorage.getItem('explora.pestana'); if (SEL_PESTANAS.indexOf(v) >= 0) S.v = v; } catch (e) {}
const _renderSel = render;
render = function () { _renderSel(); try { localStorage.setItem('explora.pestana', S.v); } catch (e) {} };
const _abrirEditorSel = abrirEditor, _cerrarEditorSel = cerrarEditor;
abrirEditor = function (id) { SEL.pop = null; SEL.diseno = false; _abrirEditorSel(id); try { localStorage.setItem('explora.abierto', id); } catch (e) {} };
cerrarEditor = function () { SEL.pop = null; SEL.diseno = false; _cerrarEditorSel(); try { localStorage.removeItem('explora.abierto'); } catch (e) {} };
(function volverAlAbierto() {
  let id = null; try { id = localStorage.getItem('explora.abierto'); } catch (e) {}
  if (!id) return;
  let n = 0; const t = setInterval(() => { if (++n > 40) return clearInterval(t); if (EST.lista[id] && EST.lista[id].slides && EST.lista[id].slides.length) { clearInterval(t); if (!EST.abierto) abrirEditor(id); } }, 250);
})();

/* ---------- pintar ---------- */
const _pintarEditorSel = pintarEditor;
pintarEditor = function (todo) {
  _pintarEditorSel(todo);
  const c = EST.lista[EST.abierto]; if (!c) return;
  const ed = $('#est-editor');
  // Diseño: un botón en la barra en lugar de los dos desplegables
  const cab = ed.querySelector('.est-ecab');
  if (cab && !cab.querySelector('#sel-diseno')) {
    const pl = cab.querySelector('#est-e-pl'), co = cab.querySelector('#est-e-co');
    const hex = (EST_COLORES.find(x => x.id === c.color) || {}).hex || '#366B40';
    const btn = '<div class="sel-diseno"><button type="button" class="btn" id="sel-diseno" aria-expanded="' + SEL.diseno + '"><i style="background:' + hex + '"></i>' +
      esc(nombrePl(c.plantilla)) + ' · ' + esc(nombreCo(c.color)) + ' <span aria-hidden="true">▾</span></button>' + (SEL.diseno ? htmlDiseno(c) : '') + '</div>';
    if (pl) { pl.insertAdjacentHTML('beforebegin', btn); pl.remove(); } else { const h2 = cab.querySelector('h2'); h2 && h2.insertAdjacentHTML('afterend', btn); }
    if (co) co.remove();
  }
  // sin «Otra versión» ni «↺ Anterior»: para cambiar está la mano y el chat (pedido de Sandra)
  if (cab) cab.querySelectorAll('#mesa-otra, #est-rehacer, #mesa-anterior').forEach(b => b.remove());
  // barra de arriba con jerarquía: ← y título (con estado y «guardado» debajo) · diseño · acciones secundarias discretas · UNA acción principal
  if (cab && !cab.dataset.eb) {
    cab.dataset.eb = '1';
    const q = sel => cab.querySelector(sel);
    const volver = q('#est-cerrar'), h2 = q('h2'), etapa = q('.pr-etapa'), guardado = q('#mesa-guardado'), diseno = q('.sel-diseno'),
      deshacer = q('#mesa-deshacer'), descargar = q('#est-descargar'), menu = q('.pr-menu-cab'),
      principal = q('#pr-ok') || q('[data-pr-publicar].btn') || q('.pr-pub');
    if (volver) { volver.innerHTML = '<span aria-hidden="true">←</span>'; volver.className = 'eb-icono'; volver.setAttribute('aria-label', 'Volver a Producción'); volver.title = 'Volver a Producción'; }
    if (deshacer) { deshacer.innerHTML = '<span aria-hidden="true">↶</span>'; deshacer.className = 'eb-icono'; deshacer.setAttribute('aria-label', 'Deshacer'); deshacer.title = 'Deshacer (Ctrl/⌘ + Z)'; }
    // descargar solo cuando está aprobado: en revisión no aparece; en «Listo» es la acción principal y «Marcar como publicado» va al lado
    const et = etapaDe(c);
    if (descargar) { descargar.textContent = 'Descargar'; descargar.className = et === 'listo' ? 'eb-pri' : 'eb-sec'; if (et === 'revision' || et === 'generar') descargar.remove(); }
    if (principal && principal.tagName === 'BUTTON') principal.className = et === 'listo' ? 'eb-sec' : 'eb-pri';
    const izq = document.createElement('div'); izq.className = 'eb-izq';
    const tit = document.createElement('div'); tit.className = 'eb-tit';
    const meta = document.createElement('div'); meta.className = 'eb-meta';
    [etapa, q('.eb-links'), guardado].forEach(x => x && meta.appendChild(x));
    if (h2) tit.appendChild(h2); tit.appendChild(meta);
    [volver, tit].forEach(x => x && izq.appendChild(x));
    const der = document.createElement('div'); der.className = 'eb-der';
    (et === 'listo' ? [deshacer, principal, descargar] : [deshacer, descargar, menu, principal]).forEach(x => x && x.isConnected !== false && der.appendChild(x));
    cab.innerHTML = ''; cab.appendChild(izq); if (diseno) cab.appendChild(diseno); cab.appendChild(der);
  }
  // Listo y Terminado: solo se ven (pedido de Sandra). Para cambiar algo, «Volver a revisión».
  const soloVer = ['listo', 'publicado'].indexOf(etapaDe(c)) >= 0;
  ed.classList.toggle('solo-ver', soloVer);
  if (soloVer) {
    SEL.pop = null; SEL.diseno = false;
    ed.querySelectorAll('.sel-diseno, #mesa-deshacer, #mesa-guardado, .est-tira-acc, .est-tira-mas').forEach(x => x.remove());
    ed.querySelectorAll('.est-tira [data-est-sel]').forEach(b => { b.draggable = false; b.title = ''; });
    const panel = ed.querySelector('#est-panel');
    if (panel && !panel.querySelector('.sv-aviso')) {
      panel.innerHTML = '<div class="sv-aviso">' + (etapaDe(c) === 'listo' ? 'Aprobado: ya no se edita. Para cambiar algo, «Volver a revisión».' : 'Publicado: ya no se edita.') + '</div>' +
        '<h3 class="sv-h">Caption</h3><div class="sv-caption">' + esc(c.copy || 'Sin caption') + '</div>' +
        (c.copy ? '<button type="button" class="btn" data-est-copiar="' + c.id + '">Copiar caption</button>' : '');
    }
    return;
  }
  // panel: sin formulario. Chat arriba, tipo de slide y «Añadir»
  const tab = ed.querySelector('.pr-tab-slide');
  if (tab && !tab.dataset.sel) {
    tab.dataset.sel = '1';
    const campos = tab.querySelector('.est-campos');
    if (campos) {
      // ni formulario ni «Tipo de slide» (Sandra no lo cambia: el tipo lo da Claude o «+ Añadir» al crear la slide)
      campos.querySelectorAll('label').forEach(l => { if (l.querySelector('[data-est-campo]')) l.hidden = true; });
      const pista = campos.querySelector('.est-pista'); if (pista) pista.remove();
      const s = c.slides[EST.sel] || {};
      const mas = campos.querySelector('.mesa-mas');
      const extras = ((s.tipo === 'portada' || s.tipo === 'contenido') && !s.imagen ? '<button type="button" data-pr-fotos>+ Foto</button>' : '') +
        (s.trazo === 'ninguno' ? '<button type="button" id="sel-contrazo">+ Flecha</button>' : '');
      if (extras) {
        const b = extras;
        if (mas) mas.insertAdjacentHTML('beforeend', b); else campos.insertAdjacentHTML('beforeend', '<div class="mesa-mas"><span>Añadir:</span>' + b + '</div>');
      }
      campos.insertAdjacentHTML('afterbegin', '<p class="sel-pista">Pulsa un texto o la foto de la slide para cambiarlo.</p>');
    }
    // la foto y «cómo va la portada» se cambian pulsando la foto: fuera del panel
    tab.querySelectorAll('h3').forEach(h => { if (/^Foto$/.test(h.textContent.trim())) { let n = h.nextElementSibling; while (n && n.tagName !== 'H3') { const sig = n.nextElementSibling; n.remove(); n = sig; } h.remove(); } });
    tab.querySelectorAll('[data-est-campo="marco"]').forEach(f => { const w = f.closest('.est-campos'); if (w && w !== campos) w.remove(); });
  }
  // la slide grande: marcar lo que se puede pulsar y reabrir el editor flotante si estaba abierto
  const fr = ed.querySelector('.est-grande iframe');
  if (fr && !fr.dataset.sel) { fr.dataset.sel = '1'; fr.addEventListener('load', () => marcarActivo()); }
  if (SEL.pop && SEL.pop.slide !== EST.sel) SEL.pop = null;
  if (SEL.pop && !ed.querySelector('#sel-pop')) pintarPop();
  if (fr) marcarActivo();
};
function htmlDiseno(c) {
  return '<div class="sel-diseno-pop" role="dialog" aria-label="Diseño del carrusel"><h4>Plantilla</h4><div class="sel-pls">' +
    EST_PLANTILLAS.map(p => '<button type="button" data-sel-pl="' + p.id + '" aria-pressed="' + (c.plantilla === p.id) + '"><b>' + esc(p.nombre) + '</b><span>' + esc(p.pista) + '</span></button>').join('') +
    '</div><h4>Color</h4><div class="sel-cos">' +
    EST_COLORES_ELEGIBLES.map(x => '<button type="button" data-sel-co="' + x.id + '" aria-pressed="' + (c.color === x.id) + '" title="' + esc(x.nombre) + '"><i style="background:' + x.hex + '"></i>' + esc(x.nombre) + '</button>').join('') +
    '</div><p>Se aplica a todas las slides.</p></div>';
}
// qué se puede pulsar en la slide (el iframe no recibe el ratón: lo calculamos desde fuera)
function marcarSlide(fr) {
  let d; try { d = fr.contentDocument; } catch (e) { return; } if (!d || !d.head || d.getElementById('sel-css')) return;
  const st = d.createElement('style'); st.id = 'sel-css';
  st.textContent = '.sel-sobre{outline:5px dashed #85E159!important;outline-offset:8px;border-radius:4px}.sel-activo{outline:5px solid #85E159!important;outline-offset:8px;border-radius:4px}';
  d.head.appendChild(st);
}
// campo cuyo texto coincide con el del elemento (o el elemento es un trozo de ese campo)
function campoDeElemento(s, n) {
  const q = x => norm(String(x || '').replace(/\*/g, '')).replace(/\s+/g, ' ').trim();
  const t = q(n.textContent); if (!t) return null;
  const casa = v => v && (v === t || v.indexOf(t) >= 0 || (t.indexOf(v) >= 0 && t.length <= v.length + 12));
  for (const k of ['titulo', 'subtitulo', 'antetitulo', 'texto', 'etiqueta', 'numero', 'cifra', 'fuente', 'cta', 'cinta', 'nota']) if (casa(q(s[k]))) return {campo: k, idx: -1};
  const i = (s.items || []).findIndex(v => casa(q(v))); if (i >= 0) return {campo: 'items', idx: i};
  return null;
}
// la foto de la slide (no los logos, que también son <img>)
const esFotoSlide = n => n && n.tagName === 'IMG' && /fotos\//.test(n.getAttribute('src') || '');
const fotoDe = d => [...d.images].find(i => esFotoSlide(i) && i.getBoundingClientRect().width > 0) || null;
function objetivoEn(fr, x, y) {
  const c = EST.lista[EST.abierto]; if (!c) return null; const s = c.slides[EST.sel] || {};
  let d; try { d = fr.contentDocument; } catch (e) { return null; } if (!d) return null;
  const r = fr.getBoundingClientRect(), k = r.width / 1080 || 1;
  const el = d.elementFromPoint((x - r.left) / k, (y - r.top) / k); if (!el) return null;
  if (el.closest && el.closest('.flecha')) return {tipo: 'trazo', el: el.closest('.flecha')};
  for (let n = el; n && n !== d.body; n = n.parentElement) { const m = campoDeElemento(s, n); if (m) return {tipo: 'texto', campo: m.campo, idx: m.idx, el: n}; }
  if (s.imagen) for (let n = el; n && n !== d.body; n = n.parentElement) {
    const cl = String(n.className || '');
    if (esFotoSlide(n) || (/foto|portatil|pantalla/.test(cl) && !/logo/.test(cl))) return {tipo: 'foto', el: esFotoSlide(n) ? n : (fotoDe(d) || n)};
  }
  const sl = d.querySelector('.slide');
  if (s.imagen && sl && /foto-sangre|con-foto/.test(String(sl.className))) return {tipo: 'foto', el: fotoDe(d) || sl};
  return null;
}
let SEL_SOBRE = null;
document.addEventListener('mousemove', e => {
  const g = e.target.closest && !document.querySelector('#est-editor.solo-ver') && e.target.closest('.est-grande'); const fr = g && g.querySelector('iframe');
  const o = fr ? objetivoEn(fr, e.clientX, e.clientY) : null, el = o && o.el;
  if (SEL_SOBRE && SEL_SOBRE !== el) SEL_SOBRE.classList.remove('sel-sobre');
  if (el) el.classList.add('sel-sobre'); SEL_SOBRE = el;
  if (g) g.style.cursor = o ? (o.tipo === 'texto' ? 'text' : 'pointer') : 'default';
});

/* ---------- lo seleccionado, en el formulario ---------- */
function abrirPop(o) {
  SEL.pop = {tipo: o.tipo, campo: o.campo, idx: o.idx == null ? -1 : o.idx, slide: EST.sel};
  EST.pestana = 'slide'; const pn = $('#est-panel'); if (pn) pn.dataset.tab = 'slide';
  document.querySelectorAll('[data-pr-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.prTab === 'slide')));
  pintarPop(true); marcarActivo();
}
function valorPop() {
  const c = EST.lista[EST.abierto], s = c.slides[SEL.pop.slide] || {}, p = SEL.pop;
  return p.campo === 'items' ? (s.items || [])[p.idx] || '' : s[p.campo] || '';
}
function pintarPop(foco) {
  const tab = document.querySelector('#est-editor .pr-tab-slide'); if (!tab) return;
  const old = tab.querySelector('#sel-pop'); if (old) old.remove();
  tab.classList.toggle('sel-con', !!SEL.pop);
  if (!SEL.pop) return;
  const c = EST.lista[EST.abierto], s = c.slides[EST.sel] || {}, p = SEL.pop;
  let h;
  if (p.tipo === 'texto') {
    const corto = SEL_CORTOS.indexOf(p.campo) >= 0;
    h = '<div class="sel-pop" id="sel-pop"><div class="sel-pop-t"><span>' + esc(SEL_NOMBRES[p.campo] || p.campo) + (p.campo === 'items' ? ' ' + (p.idx + 1) : '') + '</span>' +
      '<button type="button" class="sel-x" id="sel-cancelar" aria-label="Quitar la selección" title="Quitar la selección">✕</button></div>' +
      '<textarea id="sel-txt" rows="' + (corto ? 2 : 5) + '">' + esc(valorPop()) + '</textarea>' +
      '<div class="sel-pop-pie"><span>' + (/titulo|items/.test(p.campo) ? '*palabra* = resaltada en lima' : '') + '</span>' +
      ((p.campo !== 'titulo' && p.campo !== 'items') || (p.campo === 'items' && (s.items || []).length > 1) ? '<button type="button" class="btn mini" id="sel-borrar">' + (p.campo === 'items' ? 'Quitar este punto' : 'Quitar de la slide') + '</button>' : '') +
      (p.campo === 'items' && (s.items || []).length < 4 ? '<button type="button" class="btn mini" id="sel-otro">+ Otro punto</button>' : '') + '</div></div>';
  } else if (p.tipo === 'trazo') {
    h = '<div class="sel-pop" id="sel-pop"><div class="sel-pop-t"><span>Flecha</span><button type="button" class="sel-x" id="sel-cancelar" aria-label="Quitar la selección" title="Quitar la selección">✕</button></div>' +
      '<div class="sel-pop-fila"><button type="button" class="btn mini" id="sel-sintrazo">Quitar flecha</button></div></div>';
  } else {
    const ops = [];
    if (s.tipo === 'portada') ops.push(['', 'Según la plantilla'], ['fondo', 'A pantalla completa']);
    if (s.tipo === 'contenido') ops.push(['', 'Según la plantilla'], ['portatil', 'Dentro de un portátil']);
    const f = (typeof fotosCatalogo === 'function' ? fotosCatalogo() : FOTOS).find(x => x.ruta === s.imagen);
    h = '<div class="sel-pop" id="sel-pop"><div class="sel-pop-t"><span>Foto</span><button type="button" class="sel-x" id="sel-cancelar" aria-label="Quitar la selección" title="Quitar la selección">✕</button></div>' +
      '<div class="pr-fotoact">' + (s.imagen ? '<img src="' + esc(s.imagen) + '" alt="">' : '') + '<div><p>' + esc(f && f.desc || '') + '</p>' +
      '<button type="button" class="btn mini pri" data-pr-fotos>Cambiar foto</button> <button type="button" class="btn mini" id="sel-quitafoto">Quitar foto</button></div></div>' +
      (ops.length ? '<div class="sel-pop-t sel-sub"><span>Cómo va</span></div><div class="sel-pop-fila sel-marcos">' + ops.map(x => '<button type="button" class="btn mini" data-sel-marco="' + x[0] + '" aria-pressed="' + ((s.marco || '') === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' : '') + '</div>';
  }
  const ancla = tab.querySelector('#mesa-claude');
  if (ancla) ancla.insertAdjacentHTML('beforebegin', h); else tab.insertAdjacentHTML('afterbegin', h);
  const t = $('#sel-txt'); if (t && foco) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
  const caja = $('#sel-pop'); if (caja && foco && caja.scrollIntoView) caja.scrollIntoView({block: 'nearest'});
}
// borde lima en lo seleccionado dentro de la slide grande
function marcarActivo() {
  const fr = document.querySelector('#est-editor .est-grande iframe'); let d; try { d = fr && fr.contentDocument; } catch (e) { return; } if (!d || !d.body) return;
  marcarSlide(fr);
  d.querySelectorAll('.sel-activo').forEach(x => x.classList.remove('sel-activo'));
  if (!SEL.pop) return;
  const s = (EST.lista[EST.abierto] || {slides: []}).slides[EST.sel] || {};
  let el = null;
  if (SEL.pop.tipo === 'texto') {
    const cands = [...d.body.querySelectorAll('*')].filter(n => { const m = campoDeElemento(s, n); return m && m.campo === SEL.pop.campo && m.idx === SEL.pop.idx; });
    el = cands.find(n => !cands.some(o => o !== n && n.contains(o) && norm(o.textContent).trim() === norm(n.textContent).trim())) || cands[0] || null;
    // el contenedor más grande que sigue siendo solo ese campo
    while (el && el.parentElement && el.parentElement !== d.body) { const m = campoDeElemento(s, el.parentElement); if (m && m.campo === SEL.pop.campo && m.idx === SEL.pop.idx) el = el.parentElement; else break; }
  } else if (SEL.pop.tipo === 'trazo') el = d.querySelector('.flecha');
  else el = fotoDe(d);
  if (el) el.classList.add('sel-activo');
}
let SEL_GUARDA = 0;
function aplicarTexto(v) {
  const c = EST.lista[EST.abierto], p = SEL.pop; if (!c || !p) return; const s = c.slides[p.slide]; if (!s) return;
  if (p.campo === 'items') { s.items = (s.items || []).slice(); s.items[p.idx] = v; }
  else if (v) s[p.campo] = v; else delete s[p.campo];
  const ed = $('#est-editor'); if (ed) pintarMinis(ed);
  clearTimeout(SEL_GUARDA); SEL_GUARDA = setTimeout(() => guardarC(c), 700);
}
function cerrarPop() { SEL.pop = null; pintarPop(); marcarActivo(); }
function colocarPop() { marcarActivo(); }

/* ---------- eventos ---------- */
window.addEventListener('click', e => {
  const t = e.target; if (!EST.abierto || !t.closest) return;
  // diseño
  if (t.closest('#sel-diseno')) { e.stopImmediatePropagation(); SEL.diseno = !SEL.diseno; pintarEditor(true); return; }
  const pl = t.closest('[data-sel-pl]'), co = t.closest('[data-sel-co]');
  if (pl || co) {
    e.stopImmediatePropagation(); const c = EST.lista[EST.abierto];
    if (pl) { c.plantilla = pl.dataset.selPl; c.slides.forEach(s => delete s.plantilla); }
    if (co) { c.color = co.dataset.selCo; c.slides.forEach(s => delete s.color); }
    guardarC(c); pintarEditor(true); return;
  }
  if (SEL.diseno && !t.closest('.sel-diseno-pop')) { SEL.diseno = false; pintarEditor(true); }
  // editor flotante
  if (t.closest('#sel-cancelar')) { e.stopImmediatePropagation(); cerrarPop(); return; }
  if (t.closest('#sel-borrar')) {
    e.stopImmediatePropagation(); const c = EST.lista[EST.abierto], p = SEL.pop, s = c.slides[p.slide];
    if (p.campo === 'items') s.items.splice(p.idx, 1); else delete s[p.campo];
    SEL.pop = null; guardarC(c); pintarEditor(true); return;
  }
  if (t.closest('#sel-otro')) {
    e.stopImmediatePropagation(); const c = EST.lista[EST.abierto], s = c.slides[SEL.pop.slide];
    s.items = (s.items || []).concat(['Nuevo punto']); guardarC(c); pintarEditor(true); abrirPop({tipo: 'texto', campo: 'items', idx: s.items.length - 1}); return;
  }
  if (t.closest('#sel-quitafoto')) { e.stopImmediatePropagation(); const c = EST.lista[EST.abierto], s = c.slides[EST.sel]; delete s.imagen; if (s.marco === 'fondo' || s.marco === 'portatil') delete s.marco; SEL.pop = null; guardarC(c); pintarEditor(true); return; }
  if (t.closest('#sel-sintrazo')) { e.stopImmediatePropagation(); const c = EST.lista[EST.abierto]; c.slides[EST.sel].trazo = 'ninguno'; SEL.pop = null; guardarC(c); pintarEditor(true); return; }
  if (t.closest('#sel-contrazo')) { e.stopImmediatePropagation(); const c = EST.lista[EST.abierto]; delete c.slides[EST.sel].trazo; guardarC(c); pintarEditor(true); return; }
  const mc = t.closest('[data-sel-marco]');
  if (mc) { e.stopImmediatePropagation(); const c = EST.lista[EST.abierto], s = c.slides[EST.sel]; if (mc.dataset.selMarco) s.marco = mc.dataset.selMarco; else delete s.marco; guardarC(c); pintarEditor(true); return; }
  if (t.closest('#sel-pop')) return;
  // «Añadir: + campo» abre el editor flotante para ese campo
  const mas = t.closest('[data-mesa-mas]');
  if (mas) {
    e.stopImmediatePropagation(); const k = mas.dataset.mesaMas, c = EST.lista[EST.abierto], s = c.slides[EST.sel];
    if (k === 'items') { s.items = (s.items || []).concat(['Nuevo punto']); abrirPop({tipo: 'texto', campo: 'items', idx: s.items.length - 1}); }
    else { s[k] = s[k] || 'Escribe aquí'; abrirPop({tipo: 'texto', campo: k}); const tx = $('#sel-txt'); if (tx) tx.select(); }
    guardarC(c); const ed = $('#est-editor'); if (ed) pintarMinis(ed);
    return;
  }
  // pulsar en la slide grande (no en Listo / Terminado: solo se ven)
  if (t.closest('#est-editor.solo-ver .est-grande')) { e.stopImmediatePropagation(); return; }
  const g = t.closest('.est-grande');
  if (g) {
    e.stopImmediatePropagation();
    const fr = g.querySelector('iframe'), o = fr && objetivoEn(fr, e.clientX, e.clientY);
    if (o) abrirPop(o); else cerrarPop();
    return;
  }
}, true);
document.addEventListener('input', e => {
  if (e.target.id !== 'sel-txt') return;
  const v = e.target.value; clearTimeout(SEL.tempo); SEL.tempo = setTimeout(() => aplicarTexto(v), 150);
});
// en captura de window: Esc aquí cierra el editor flotante o el diseño, no el carrusel entero
window.addEventListener('keydown', e => {
  if (e.target.id === 'sel-txt') {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); aplicarTexto(e.target.value); cerrarPop(); }
    else if (e.key === 'Enter' && !e.shiftKey && (SEL_CORTOS.indexOf(SEL.pop && SEL.pop.campo) >= 0 || SEL.pop.campo === 'items')) { e.preventDefault(); aplicarTexto(e.target.value); cerrarPop(); }
    return;
  }
  if (e.key === 'Escape' && (SEL.diseno || SEL.pop)) { e.stopImmediatePropagation(); if (SEL.pop) cerrarPop(); else { SEL.diseno = false; pintarEditor(true); } }
}, true);
window.addEventListener('resize', () => { if (SEL.pop) colocarPop(); });

// Ctrl/⌘+Z no deshace nada en un carrusel que solo se ve
const _deshacerSel = deshacer;
deshacer = function () { if (document.querySelector('#est-editor.solo-ver')) return; return _deshacerSel(); };
