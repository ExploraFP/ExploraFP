/* ===================== Editor tipo Canva (29/10/2026, Sandra) =====================
   «Que se parezca un poco más a Canva pero sin añadir tantas opciones». Lo que eligió:
   · Barra lateral IZQUIERDA con cajón: Fotos · Slides · Elementos · Diseño · Revisión · Claude · Caption. Ya no hay panel
     a la derecha (Sandra: «prefiero que el caption, el chat y la revisión estén en la barra izquierda»): #est-panel se
     mete en el cajón y cada pestaña enseña su trozo; lo seleccionado (#sel-pop) flota sobre la escena.
   · En la slide: un clic SELECCIONA (marco lima con tiradores en las esquinas), se ARRASTRA para moverlo y se estira
     de una esquina para el tamaño; doble clic = escribir encima (antes el clic ya escribía).
   · Lo movido y el tamaño se guardan en el `estilo` de ESA slide (CSS: translate + zoom por elemento), el mismo campo que
     usa el chat con Claude para los retoques; «↺ Recolocar» lo quita. Ctrl/⌘ + Z lo deshace como cualquier cambio. */
const LZ = {tab: (() => { try { return localStorage.getItem('lienzo.tab') || ''; } catch (e) { return ''; } })(), arr: null, editar: false, arrastrado: false};
// orden de Sandra (29/10/2026): Plantilla · Elementos · Slides · Fotos | Revisión · Chat IA · Caption
const LZ_TABS = [['plantilla', '🎨', 'Plantilla'], ['elementos', '✏️', 'Elementos'], ['slides', '▦', 'Slides'], ['fotos', '🖼️', 'Fotos'],
  ['revision', '✅', 'Revisión'], ['claude', '💬', 'Chat IA'], ['caption', '📝', 'Caption']];
if (LZ.tab === 'diseno') LZ.tab = 'plantilla';
const LZ_DEL_PANEL = ['revision', 'claude', 'caption'];   // estas pestañas enseñan un trozo de #est-panel
const LZ_CUERPO = ['contenido', 'lista', 'pasos', 'dato', 'momento'];
const LZ_NOMBRE = Object.assign({}, EST_TIPOS, {pasos: 'Pasos'});
// la línea a mano: ¿la lleva esta slide? (de serie en las portadas Titular sobre verde, Notas a mano y Papel claro; como en motor.js)
function lzLinea(c, s) {
  const pl = s.plantilla || c.plantilla;
  const serie = s.tipo === 'portada' && s.marco !== 'fondo' && s.marco !== 'collage' && ((pl === 'feed' && !s.marco) || s.marco === 'notas' || (pl === 'capas' && !s.imagen) || pl === 'ruta');
  return /_/.test(s.titulo || '') || (s.linea ?? serie);
}
// fotos de CUADERNO para la parte de arriba de la portada Collage: libretas y cuadernos sin cara (solo el cuaderno o unas manos)
function lzCuadernos() {
  const todas = typeof fotosCatalogo === 'function' ? fotosCatalogo().filter(f => !f.oculta) : FOTOS;
  return todas.filter(f => /libreta|cuaderno|apuntes/i.test(f.desc || '') && (/^(libreta|cuaderno|manos?\b|mano de|persona escribiendo)/i.test(f.desc || '') || f.personas === 'Sin personas'));
}
const lzCuadernoAzar = (menos) => { const l = lzCuadernos().filter(f => f.ruta !== menos); return l.length ? l[Math.floor(Math.random() * l.length)].ruta : ''; };
const lzRol = s => s.tipo === 'portada' ? 'portada' : s.tipo === 'cierre' ? 'cierre' : 'cuerpo';
// los diseños entre los que puede cambiar ESTA slide: [{k, nombre, pista, on, slide (para la miniatura)}]
function lzOpciones(s) {
  const rol = lzRol(s), sin = o => { const n = JSON.parse(JSON.stringify(s)); if (o) n.marco = o; else delete n.marco; return n; };
  if (rol === 'portada') return [['', 'La de la plantilla', 'El diseño de portada de la plantilla']].concat(s.imagen ? [['fondo', 'Foto entera', 'La foto a pantalla completa']] : [])
    .concat([['notas', 'Escrito a mano', 'Textura manuscrita de fondo y el titular en una esquina']])
    .concat(s.imagen ? [['collage', 'Collage', 'Libreta arriba, tu foto abajo y el titular gigante en lima']] : [])
    .map(([m, nombre, pista]) => ({k: 'marco:' + m, nombre: nombre, pista: pista, on: (s.marco || '') === m, slide: sin(m)}));
  if (rol === 'cierre') return [{k: 'cierre', nombre: 'Cierre', pista: LZ_TIPOS.cierre, on: true, slide: s}];
  return LZ_CUERPO.map(k => ({k: k, nombre: LZ_NOMBRE[k], pista: LZ_TIPOS[k], on: (s.tipo || 'contenido') === k, slide: lzComo(s, k)}));
}
/* la misma slide con otra forma: conserva lo que tiene y solo rellena lo que a la forma nueva le falta. Lo que no usa se
   queda guardado (si vuelves a la forma de antes, reaparece). La fuente del dato NO se inventa: la revisión la pedirá. */
function lzComo(s, tipo) {
  const n = JSON.parse(JSON.stringify(s || {})); n.tipo = tipo;
  const frases = String(n.texto || '').split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  if (tipo !== 'dato' && !n.titulo) n.titulo = n.antetitulo || 'Nuevo *titular*';
  if ((tipo === 'lista' || tipo === 'pasos') && !(n.items || []).length) n.items = frases.length > 1 ? frases.slice(0, 4) : ['Primer punto', 'Segundo punto'];
  if (tipo === 'dato') { if (!n.cifra) n.cifra = '0 %'; if (!n.antetitulo) n.antetitulo = String(n.titulo || 'Qué es la cifra').replace(/[*_]/g, ''); }
  if (tipo === 'cierre' && !n.cta) n.cta = 'Escribe aquí';
  if (tipo === 'momento') { if (!n.hora) n.hora = '10:00'; if (!n.tarjetaTitulo) n.tarjetaTitulo = 'Escribe aquí'; }
  return n;
}
const LZ_TIPOS = {portada: 'La primera: el gancho', contenido: 'Titular y texto (o foto)', lista: '2 a 4 puntos', dato: 'Una cifra con su fuente', pasos: '1 → 2 → 3, en orden', cierre: 'La última: la llamada a la acción', momento: 'Una escena del día con la plataforma'};

/* ---------- barra lateral y cajón ---------- */
function lzCajon(c) {
  const s = c.slides[EST.sel] || {};
  if (LZ.tab === 'fotos') {
    const sel = (id, vacio, lista, v) => '<select id="' + id + '" aria-label="' + vacio + '"><option value="">' + vacio + '</option>' + lista.map(x => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
    // portada Collage: arriba SIEMPRE un cuaderno (el que elijas), abajo una persona (Sandra, 31/10/2026)
    const arriba = s.tipo === 'portada' && s.marco === 'collage' ? '<h4>Arriba · un cuaderno</h4><div class="est-fotos lz-fotos">' +
      lzCuadernos().map(f => '<button data-lz-arriba="' + esc(f.ruta) + '" aria-pressed="' + ((s.imagen2 || 'fotos/foto-libreta-apuntes.jpg') === f.ruta) + '" title="' + esc(f.desc) + '"><img src="' + esc(f.ruta) + '" alt="" loading="lazy"></button>').join('') +
      '</div><h4>Abajo · una persona</h4>' : '';
    return '<h3>Fotos</h3>' + arriba + '<p class="lz-pista">Pulsa una para ponerla en la slide ' + (EST.sel + 1) + '.</p>' +
      '<input type="search" id="lz-fq" autocomplete="off" placeholder="Busca: portátil, estrés…" value="' + esc(EST.fq || '') + '">' +
      (typeof FOTO_RAMAS !== 'undefined' ? '<div class="lz-filtros">' + sel('lz-fr', 'Rama', FOTO_RAMAS, EST.fr) + sel('lz-fo', 'Orientación', FOTO_ORIENT, EST.fo) + '</div>' : '') +
      '<div class="est-fotos lz-fotos">' + gridFotosEditor(s) + '</div>';
  }
  if (LZ.tab === 'slides') {
    const tiene = k => c.slides.some(x => x.tipo === k);
    const ks = (tiene('portada') ? [] : ['portada']).concat(LZ_CUERPO, tiene('cierre') ? [] : ['cierre']);
    return '<h3>Slides</h3><p class="lz-pista">Se añade antes del cierre. Para cambiar la forma de una que ya existe, Plantilla.</p><div class="lz-tipos">' +
      ks.map(k => '<button type="button" data-est-nueva="' + k + '"><b>' + esc(LZ_NOMBRE[k]) + '</b><span>' + esc(LZ_TIPOS[k] || '') + '</span></button>').join('') + '</div>';
  }
  if (LZ.tab === 'elementos') {
    const deco = [].concat(s.decoracion || []), flecha = s.trazo === 'flecha' || (!s.trazo && (s.tipo === 'cierre' || (c.plantilla !== 'feed' && s.tipo !== 'portada')));
    const it = (k, ico, t, on, pista) => '<button type="button" data-lz-el="' + k + '" aria-pressed="' + !!on + '"><span class="lz-ico">' + ico + '</span><b>' + t + '</b><small>' + pista + '</small></button>';
    return '<h3>Elementos</h3><p class="lz-pista">En la slide ' + (EST.sel + 1) + '. Pulsa otra vez para quitarlo.</p><div class="lz-els">' +
      (s.tipo === 'portada' ? '' : it('flecha', '↗', 'Flecha a mano', flecha, 'Luego la mueves y la estiras')) +   // en portada no hay a qué apuntar (Sandra, 29/10)
      it('ovalo', '◯', 'Óvalo a mano', s.trazo === 'ovalo', 'Rodea la *palabra* resaltada') +
      it('postit', '🟨', 'Post-it «100% online»', deco.indexOf('postit') >= 0, 'Arriba a la derecha') +
      it('notas', '✍️', 'Escrito a mano de fondo', deco.indexOf('notas') >= 0, 'La textura de la marca') +
      (s.titulo ? it('linea', '〰', 'Línea a mano', lzLinea(c, s), 'Debajo de la última palabra del titular') : '') + '</div><div class="lz-anadir"></div>';
  }
  // Plantilla, como en Canva. Cada slide solo se cambia por diseños de SU papel (Sandra, 29/10/2026): la portada, por portadas;
  // el cierre (CTA), por cierres; el cuerpo, por formas de cuerpo. El color, de esa slide. La plantilla (Feed, Ruta…), de todo el carrusel.
  if (LZ.tab === 'plantilla') {
    const ops = lzOpciones(s), rol = lzRol(s);
    PREVIAS['lz-formas'] = Object.assign({}, c, {id: 'lz-formas', slides: ops.map(o => o.slide)});
    const titulo = rol === 'portada' ? 'Portada' : rol === 'cierre' ? 'Cierre (CTA)' : 'Cuerpo';
    const colorAhora = s.color || c.color;
    return '<h3>Plantilla</h3><h4>Diseño de esta slide · ' + titulo + '</h4><div class="lz-formas">' +
      ops.map((o, i) => '<button type="button" data-lz-forma="' + o.k + '" aria-pressed="' + o.on + '" title="' + esc(o.pista || '') + '">' +
        mini(PREVIAS['lz-formas'], i) + '<span>' + esc(o.nombre) + '</span></button>').join('') + '</div>' +
      (ops.length < 2 ? '<p class="lz-pista">Este estilo tiene un solo diseño de ' + (rol === 'cierre' ? 'cierre' : 'portada') + '.</p>' : '') +
      '<h4>Color de esta slide</h4><div class="sel-cos">' +
      EST_COLORES_ELEGIBLES.map(x => '<button type="button" data-lz-co="' + x.id + '" aria-pressed="' + (colorAhora === x.id) + '" title="' + esc(x.nombre) + '"><i style="background:' + x.hex + '"></i>' + esc(x.nombre) + '</button>').join('') + '</div>' +
      '<h4>Estilo de todo el carrusel</h4><div class="sel-pls">' +
      EST_PLANTILLAS.map(p => '<button type="button" data-sel-pl="' + p.id + '" aria-pressed="' + (c.plantilla === p.id) + '"><b>' + esc(p.nombre) + '</b><span>' + esc(p.pista) + '</span></button>').join('') + '</div>';
  }
  if (LZ.tab === 'revision') return '';   // la caja de la revisión ya lleva su título
  if (LZ.tab === 'claude') return '<h3>Chat IA</h3>';
  if (LZ.tab === 'caption') return '<h3>Caption</h3>';
  return '';
}
// los avisos de la barra: fallos de la revisión y «falta el enlace de Instagram»
function lzAvisos() {
  const ed = $('#est-editor'); if (!ed) return;
  const n = ed.querySelectorAll('#est-qc li.ck-mal, #est-qc li.qc-error').length, en = !!ed.querySelector('#est-panel .sv-enlace');
  const pon = (k, v, t) => { const b = ed.querySelector('.lz-rail [data-lz-tab="' + k + '"]'); if (!b) return; let i = b.querySelector('.lz-num'); if (!v) { if (i) i.remove(); return; }
    if (!i) { i = document.createElement('i'); i.className = 'lz-num'; b.appendChild(i); } i.textContent = v; i.title = t; };
  pon('revision', n || '', n + (n === 1 ? ' fallo' : ' fallos')); pon('caption', en ? '!' : '', 'Falta el enlace de Instagram');
}
const _pintarQCPanelLz = pintarQCPanel;
pintarQCPanel = function () { _pintarQCPanelLz(); lzAvisos(); };
const _pintarEditorLz = pintarEditor;
pintarEditor = function (todo) {
  _pintarEditorLz(todo);
  const c = EST.lista[EST.abierto], ed = $('#est-editor'); if (!c || !ed) return;
  const cuerpo = ed.querySelector('.est-ecuerpo'); if (!cuerpo) return;
  const solo = ed.classList.contains('solo-ver');
  cuerpo.classList.toggle('lz', !solo); cuerpo.classList.toggle('lz-abierto', !solo && !!LZ.tab);
  const panel = ed.querySelector('#est-panel');
  // si el editor no se ha rehecho (estás escribiendo en un campo), no se toca: moverlo quitaría el foco
  if (!solo && ed.querySelector('.lz-rail') && panel && panel.dataset.lz === (LZ.tab || '-')) { lzAvisos(); lzCaja(); return; }
  if (panel) cuerpo.appendChild(panel);
  ed.querySelectorAll('.lz-rail, .lz-cajon').forEach(x => x.remove());
  // el diseño ya está en la barra izquierda: fuera del panel de la derecha
  ed.querySelectorAll('#est-panel .sel-dis-panel').forEach(x => x.remove());
  if (solo) { if (panel) { panel.hidden = false; delete panel.dataset.lz; } return; }
  cuerpo.insertAdjacentHTML('afterbegin', '<nav class="lz-rail" aria-label="Herramientas">' + LZ_TABS.map(([k, ico, t], i) =>
    (LZ_TABS[i][0] === 'revision' ? '<hr>' : '') + '<button type="button" data-lz-tab="' + k + '" aria-pressed="' + (LZ.tab === k) + '"><span>' + ico + '</span>' + t + '</button>').join('') + '</nav>' +
    (LZ.tab ? '<aside class="lz-cajon" aria-label="' + esc((LZ_TABS.find(x => x[0] === LZ.tab) || [])[2] || '') + '"><button type="button" class="lz-cerrar" data-lz-tab="' + LZ.tab + '" aria-label="Cerrar">✕</button>' + lzCajon(c) + '</aside>' : ''));
  if (panel) {
    panel.dataset.lz = LZ.tab || '-';
    const cj = ed.querySelector('.lz-cajon');
    if (cj && LZ_DEL_PANEL.indexOf(LZ.tab) >= 0) { panel.hidden = false; cj.appendChild(panel); } else panel.hidden = true;
    // «Añadir: + Subtítulo / + Foto…» de esta slide, en Elementos
    const an = cj && cj.querySelector('.lz-anadir'), mas = panel.querySelector('.mesa-mas');
    if (an && mas) an.appendChild(mas);
  }
  lzFlota(); lzAvisos();
  lzCaja();
};
window.addEventListener('click', e => {
  const t = e.target; if (!t.closest || !EST.abierto) return;
  const tb = t.closest('[data-lz-tab]');
  if (tb) { e.stopImmediatePropagation(); LZ.tab = LZ.tab === tb.dataset.lzTab ? '' : tb.dataset.lzTab; try { localStorage.setItem('lienzo.tab', LZ.tab); } catch (x) {} pintarEditor(true); return; }
  const fm = t.closest('[data-lz-forma]');
  if (fm) {
    e.stopImmediatePropagation();
    const c = EST.lista[EST.abierto], s = c.slides[EST.sel], k = fm.dataset.lzForma; if (!s || fm.getAttribute('aria-pressed') === 'true') return;
    if (k.indexOf('marco:') === 0) { const m = k.slice(6); if (m) s.marco = m; else delete s.marco; if (m === 'collage' && !s.imagen2) { const r = lzCuadernoAzar(); if (r) s.imagen2 = r; } }
    else c.slides[EST.sel] = lzComo(s, k);
    SEL.pop = null; MESA.grupo = 'forma:' + EST.sel; guardarC(c); pintarEditor(true);
    toast('Slide ' + (EST.sel + 1) + ': ' + fm.innerText.trim() + ' · si no te gusta, Ctrl/⌘ + Z'); return;
  }
  const ar = t.closest('[data-lz-arriba]');
  if (ar) { e.stopImmediatePropagation(); const c = EST.lista[EST.abierto], s = c.slides[EST.sel]; if (!s) return; s.imagen2 = ar.dataset.lzArriba; MESA.grupo = 'arriba:' + EST.sel; guardarC(c); pintarEditor(true); return; }
  const co = t.closest('[data-lz-co]');
  if (co) {
    e.stopImmediatePropagation();
    const c = EST.lista[EST.abierto], s = c.slides[EST.sel]; if (!s) return;
    if (co.dataset.lzCo === c.color) delete s.color; else s.color = co.dataset.lzCo;
    MESA.grupo = 'color:' + EST.sel; guardarC(c); pintarEditor(true); return;
  }
  // Slides: solo formas de cuerpo (y portada o cierre si el carrusel no lo tiene); la nueva va antes del cierre
  const nv = t.closest('.lz-cajon [data-est-nueva]');
  if (nv) {
    e.stopImmediatePropagation();
    const c = EST.lista[EST.abierto], k = nv.dataset.estNueva;
    const n = lzComo({titulo: 'Nuevo *titular*'}, k); if (k === 'dato') delete n.titulo;
    let i = c.slides.length; if (k === 'portada') i = 0; else if (k !== 'cierre' && c.slides.length && c.slides[i - 1].tipo === 'cierre') i--;
    c.slides.splice(i, 0, n); EST.sel = i; SEL.pop = null; guardarC(c); pintarEditor(true); toast('Slide ' + (i + 1) + ' añadida'); return;
  }
  // «+ Añadir» de las miniaturas abre Slides (un solo sitio para añadir)
  if (t.closest('#est-mas') && !t.closest('#est-editor.solo-ver')) { e.stopImmediatePropagation(); EST.menuNueva = false; LZ.tab = 'slides'; try { localStorage.setItem('lienzo.tab', LZ.tab); } catch (x) {} pintarEditor(true); return; }
  const el = t.closest('[data-lz-el]');
  if (el) {
    e.stopImmediatePropagation();
    const c = EST.lista[EST.abierto], s = c.slides[EST.sel]; if (!s) return;
    const k = el.dataset.lzEl, on = el.getAttribute('aria-pressed') === 'true';
    if (k === 'flecha') { if (on) s.trazo = 'ninguno'; else s.trazo = 'flecha'; }
    else if (k === 'ovalo') { if (on) delete s.trazo; else s.trazo = 'ovalo'; }
    else if (k === 'linea') { if (on) { s.titulo = String(s.titulo || '').replace(/_/g, ''); s.linea = false; } else s.linea = true; }
    else { let d = [].concat(s.decoracion || []).filter(x => x !== 'ninguna'); d = on ? d.filter(x => x !== k) : d.concat(k); if (d.length) s.decoracion = d.length === 1 ? d[0] : d; else delete s.decoracion; }
    guardarC(c); pintarEditor(true); return;
  }
}, true);
document.addEventListener('input', e => {
  if (e.target.id !== 'lz-fq') return;
  EST.fq = e.target.value; const c = EST.lista[EST.abierto], g = document.querySelector('.lz-fotos');
  if (c && g) g.innerHTML = gridFotosEditor(c.slides[EST.sel] || {});
});
document.addEventListener('change', e => {
  const t = e.target; if (t.id !== 'lz-fr' && t.id !== 'lz-fo') return;
  EST[t.id === 'lz-fr' ? 'fr' : 'fo'] = t.value; const c = EST.lista[EST.abierto], g = document.querySelector('.lz-fotos');
  if (c && g) g.innerHTML = gridFotosEditor(c.slides[EST.sel] || {});
});

/* lo seleccionado (nombre del campo, Quitar, Cambiar foto…) flota arriba a la derecha de la escena, no en el cajón */
function lzFlota() {
  const ed = $('#est-editor'), pop = ed && ed.querySelector('#sel-pop'), esc2 = ed && ed.querySelector('.est-ecuerpo.lz .est-escena'); if (!pop || !esc2) return;
  pop.classList.add('lz-flota'); if (pop.parentElement !== esc2) esc2.appendChild(pop);
}
const _pintarPopLz = pintarPop;
pintarPop = function (foco) {
  document.querySelectorAll('#est-editor .lz-flota').forEach(x => x.remove());
  _pintarPopLz(foco); lzFlota();
};

/* ---------- el estilo de la slide: una regla por elemento (translate + zoom) ---------- */
const LZ_PIEZAS = ['titulo', 'subtitulo', 'texto', 'etiqueta', 'pastilla', 'r-pill', 'r-hora', 'cifra', 'ante', 'r-ante', 'nota', 'r-mano', 'portatil', 'foto-feed',
  'foto-diagonal', 'foto-fondo', 'r-foto', 'r-foto-caja', 'flecha', 'lista-feed', 'checklist', 'pildoras', 'tarjetas', 'r-lista', 'tn-pasos', 'tn-comp', 'tn-chat', 'tn-cita',
  'tn-mito', 'mo-tarjeta', 'cta-feed', 'cta-bloque', 'cta-boton', 'cta-fila', 'r-banda', 'num', 'num-feed', 'num-fantasma', 'postit', 'r-seccion', 'bloque-foto', 'bloque-notas',
  'papel', 'caja', 'logo-caja', 'logo-grande', 'r-logo', 'ed-lista', 'bq-lista', 'tuit', 'chat-hilo'];
function lzPieza(el) {
  for (let n = el; n && n.classList && !n.classList.contains('slide'); n = n.parentElement)
    if (LZ_PIEZAS.some(k => n.classList.contains(k))) return n;
  return el;
}
function lzSelector(el, d) {
  const k = LZ_PIEZAS.find(x => el.classList && el.classList.contains(x));
  if (k) { const s = el.tagName.toLowerCase() + '.' + k; if (d.querySelectorAll(s).length === 1) return s; }
  // si no hay clase única, el camino desde .contenido (o desde la slide)
  const pasos = []; let n = el;
  while (n && n.parentElement && !n.classList.contains('contenido') && !n.classList.contains('slide')) { pasos.unshift(':nth-child(' + ([...n.parentElement.children].indexOf(n) + 1) + ')'); n = n.parentElement; }
  return (n && n.classList.contains('contenido') ? '.contenido' : '.slide') + ' > ' + pasos.join(' > ');
}
function lzLeer(css) {
  const out = [];
  String(css || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, dec) => {
    const props = {}; dec.split(';').forEach(x => { const i = x.indexOf(':'); if (i > 0) props[x.slice(0, i).trim()] = x.slice(i + 1).trim(); });
    out.push({sel: sel.trim(), props: props});
  });
  return out;
}
const lzEscribir = reglas => reglas.filter(r => Object.keys(r.props).length).map(r => r.sel + ' { ' + Object.keys(r.props).map(k => k + ': ' + r.props[k]).join('; ') + ' }').join('\n');
function lzGuardar(sel, cambia) {
  const c = EST.lista[EST.abierto], s = c && c.slides[EST.sel]; if (!s) return;
  const reglas = lzLeer(s.estilo); let r = reglas.find(x => x.sel === sel);
  if (!r) { r = {sel: sel, props: {}}; reglas.push(r); }
  cambia(r.props);
  const css = lzEscribir(reglas);
  if (css) s.estilo = css; else delete s.estilo;
  MESA.grupo = 'lz:' + EST.sel + ':' + sel; guardarC(c); pintarEditor(true);
}

/* ---------- marco con tiradores sobre lo seleccionado ---------- */
function lzDoc() { const fr = document.querySelector('#est-editor .est-grande iframe'); let d = null; try { d = fr && fr.contentDocument; } catch (e) {} return {fr: fr, d: d}; }
function lzCaja() {
  const g = document.querySelector('#est-editor .est-grande'); if (!g) return;
  let caja = g.querySelector('.lz-caja');
  const {fr, d} = lzDoc(), el = d && d.querySelector('.sel-activo');
  if (!el || SEL.inline || document.querySelector('#est-editor.solo-ver')) { if (caja) caja.remove(); return; }
  const p = lzPieza(el);
  const rf = fr.getBoundingClientRect(), rg = g.getBoundingClientRect(), k = rf.width / 1080 || 1, r = p.getBoundingClientRect();
  // el mismo marco se reutiliza: si se cambiara entre los dos clics, el navegador no da el doble clic
  if (!caja) { caja = document.createElement('div'); caja.className = 'lz-caja'; g.appendChild(caja); }
  const barra = '<i data-lz-h="nw"></i><i data-lz-h="ne"></i><i data-lz-h="sw"></i><i data-lz-h="se"></i>' +
    '<div class="lz-barra">' + (SEL.pop && SEL.pop.tipo === 'texto' ? '<button type="button" data-lz-editar>✏️ Escribir</button>' : '') +
    '<button type="button" data-lz-reset title="Vuelve a su sitio y a su tamaño">↺ Recolocar</button></div>';
  if (caja.dataset.html !== barra) { caja.innerHTML = barra; caja.dataset.html = barra; }
  caja.style.left = (rf.left - rg.left + r.left * k) + 'px'; caja.style.top = (rf.top - rg.top + r.top * k) + 'px';
  caja.style.width = (r.width * k) + 'px'; caja.style.height = (r.height * k) + 'px';
}
// tras seleccionar o repintar, el marco sigue a lo seleccionado
const _marcarActivoLz = marcarActivo;
marcarActivo = function () { _marcarActivoLz(); lzCaja(); };
window.addEventListener('resize', () => lzCaja());

// un clic selecciona; doble clic escribe (como en Canva)
const _abrirPopLz = abrirPop;
abrirPop = function (o) {
  if (o && o.tipo === 'texto' && !LZ.editar) { terminarInline(false); _abrirPopIn(o); lzCaja(); return; }
  _abrirPopLz(o); lzCaja();
};
function lzEscribirAqui() {
  if (!SEL.pop || SEL.pop.tipo !== 'texto') return;
  LZ.editar = true; try { abrirPop({tipo: 'texto', campo: SEL.pop.campo, idx: SEL.pop.idx}); } finally { LZ.editar = false; }
  const g = document.querySelector('#est-editor .est-grande .lz-caja'); if (g) g.remove();
}
window.addEventListener('dblclick', e => {
  const g = e.target.closest && e.target.closest('#est-editor:not(.solo-ver) .est-grande'); if (!g) return;
  const fr = g.querySelector('iframe'), o = fr && objetivoEn(fr, e.clientX, e.clientY);
  if (!o || o.tipo !== 'texto') return;
  e.stopImmediatePropagation(); SEL.clic = {x: e.clientX, y: e.clientY};
  LZ.editar = true; try { abrirPop(o); } finally { LZ.editar = false; }
  const cj = g.querySelector('.lz-caja'); if (cj) cj.remove();
}, true);

/* arrastrar para mover · esquina para el tamaño */
window.addEventListener('pointerdown', e => {
  if (e.button !== 0 || SEL.inline) return;
  const g = e.target.closest && e.target.closest('#est-editor:not(.solo-ver) .est-grande'); if (!g) return;
  if (e.target.closest('.lz-barra, .sel-paso')) return;
  const {fr, d} = lzDoc(); if (!fr || !d) return;
  let el = null;
  if (e.target.closest('.lz-caja')) el = d.querySelector('.sel-activo');
  else { const o = objetivoEn(fr, e.clientX, e.clientY); if (!o) return; abrirPop(o); el = d.querySelector('.sel-activo') || o.el; }
  if (!el) return;
  const p = lzPieza(el), h = e.target.dataset && e.target.dataset.lzH;
  const cs = d.defaultView.getComputedStyle(p), tr = (cs.translate && cs.translate !== 'none' ? cs.translate : '0px 0px').split(' ');
  const k = fr.getBoundingClientRect().width / 1080 || 1;
  LZ.arr = {p: p, d: d, sel: lzSelector(p, d), h: h, x0: e.clientX, y0: e.clientY, k: k, tx: parseFloat(tr[0]) || 0, ty: parseFloat(tr[1]) || 0,
    z: parseFloat(cs.zoom) || 1, w: p.getBoundingClientRect().width, movido: false};
}, true);
window.addEventListener('pointermove', e => {
  const A = LZ.arr; if (!A) return;
  const dx = (e.clientX - A.x0) / A.k, dy = (e.clientY - A.y0) / A.k;
  if (!A.movido && Math.abs(dx) + Math.abs(dy) < 4 / A.k) return;
  A.movido = true; e.preventDefault();
  if (A.h) {
    // estirar desde una esquina: el ancho nuevo manda (lo de la izquierda crece hacia la izquierda)
    const sx = /w$/.test(A.h) ? -1 : 1, sy = /^n/.test(A.h) ? -1 : 1;
    const d = Math.abs(dx) > Math.abs(dy) ? dx * sx : dy * sy * (A.w / Math.max(1, A.p.getBoundingClientRect().height));
    A.nz = Math.max(.3, Math.min(3, A.z * (A.w + d) / A.w));
    A.p.style.zoom = A.nz;
  } else {
    // el translate va en las unidades del elemento: con zoom, se divide
    A.nx = Math.round(A.tx + dx / A.z); A.ny = Math.round(A.ty + dy / A.z);
    A.p.style.translate = A.nx + 'px ' + A.ny + 'px';
  }
  lzCaja();
});
window.addEventListener('pointerup', () => {
  const A = LZ.arr; LZ.arr = null; if (!A || !A.movido) return;
  LZ.arrastrado = true; setTimeout(() => { LZ.arrastrado = false; }, 0);
  lzGuardar(A.sel, pr => { if (A.h) pr.zoom = String(Math.round(A.nz * 100) / 100); else pr.translate = A.nx + 'px ' + A.ny + 'px'; });
});
// tras arrastrar no cuenta como clic (si no, volvería a seleccionar o a escribir)
window.addEventListener('click', e => {
  if (LZ.arrastrado && e.target.closest && e.target.closest('.est-grande')) { e.stopImmediatePropagation(); LZ.arrastrado = false; return; }
  const t = e.target;
  if (t.closest && t.closest('[data-lz-editar]')) { e.stopImmediatePropagation(); lzEscribirAqui(); return; }
  if (t.closest && t.closest('[data-lz-reset]')) {
    e.stopImmediatePropagation();
    const {d} = lzDoc(), el = d && d.querySelector('.sel-activo'); if (!el) return;
    lzGuardar(lzSelector(lzPieza(el), d), pr => { delete pr.translate; delete pr.zoom; });
    toast('Vuelve a su sitio'); return;
  }
  if (t.closest && t.closest('.lz-caja')) { e.stopImmediatePropagation(); }
}, true);

/* ---------- etiquetas junto al nombre: objetivo y etapa del embudo (las de la Matriz) ---------- */
const _pintarEditorTg = pintarEditor;
pintarEditor = function (todo) {
  _pintarEditorTg(todo);
  const c = EST.lista[EST.abierto], meta = document.querySelector('#est-editor .eb-meta'); if (!c || !meta || meta.querySelector('.eb-tags')) return;
  const it = c.idea && IMAP[c.idea], et = it && it.funnel ? mzEtapaTag(it.funnel) : '';
  const html = objChip(c) + et; if (!html) return;
  const tras = meta.querySelector('.eb-form') || meta.querySelector('.eb-cod');
  const tag = '<span class="eb-tags">' + html + '</span>';
  if (tras) tras.insertAdjacentHTML('afterend', tag); else meta.insertAdjacentHTML('afterbegin', tag);
};
