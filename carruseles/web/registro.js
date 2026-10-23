/* ===================== Registro común + Directorio (23/10/2026, Sandra) =====================
   Decisiones de Sandra:
   · Producción y Directorio van separados: se crea en cada taller (Carruseles, Estáticos, Guiones) y el Directorio es solo
     la biblioteca de lo PUBLICADO, para que quede registrado. Sin resultados ni campañas (eso lo lleva quien monta los ads).
   · Todos los talleres rellenan los MISMOS campos: formación (misma lista y misma etiqueta que la Matriz) e idea de la Matriz.
   · Una sola fecha: la de CREACIÓN, que se pone sola (Sandra, 23/10/2026: «la fecha de creación le sirve al de ads y a mí para
     buscar»; ella sube los anuncios a Drive y los publica otra persona).
   · Lo terminado de cada taller: carruseles publicados, estáticos «Subidos a Drive» y guiones publicados.
   · Entra todo lo que se publique a partir de ahora; lo que se haga fuera de la herramienta (excepción) se añade a mano
     con «+ Añadir pieza hecha fuera» (colección `externas`).
   · Nombre de archivo estándar al descargar: CÓDIGO_formación_título (+ _1x1 / _vertical / -01…). */

/* ---------- formación: la misma etiqueta que en la Matriz ---------- */
const REG_DOBLES = {'Doble Laboratorio + Anatomía': 'sanidad', 'Doble DAM + DAW': 'tech', 'Doble Comercio Int. + Transporte': 'comercio', 'Doble Admin. y Finanzas + Asistencia': 'admin'};
const REG_RAMA_DE = {};
FORM_CICLOS.forEach(([k, cs]) => cs.forEach(c => { REG_RAMA_DE[c] = k || REG_DOBLES[c] || 'trans'; }));
const REG_RAMAS = {}; FORM_RAMAS.forEach(([n, k]) => { REG_RAMAS[n] = k; });
const REG_NOMBRE_RAMA = {}; FORM_RAMAS.forEach(([n, k]) => { REG_NOMBRE_RAMA[k] = n; }); REG_NOMBRE_RAMA.socio = 'Servicios Socioculturales';
const REG_FORMACIONES = ['Transversal'].concat(FORM_RAMAS.map(r => r[0]), [].concat.apply([], FORM_CICLOS.map(g => g[1])));
function chipForm(txt) {
  if (!txt) return '<span class="reg-sinform">Sin formación</span>';
  const cls = txt === 'Transversal' ? 'r-trans t-transversal' : REG_RAMAS[txt] ? 'r-' + REG_RAMAS[txt] + ' t-rama' : 'r-' + (REG_RAMA_DE[txt] || 'trans') + ' t-formacion';
  const ver = txt === 'Transversal' ? 'Globales' : txt;   // «Globales» en pantalla (Sandra, 23/10/2026)
  return FORM_EMOJI[txt] ? '<span class="chip con-emoji ' + cls + '"><i class="chip-emo">' + FORM_EMOJI[txt] + '</i> ' + esc(ver) + '</span>' : '<span class="chip ' + cls + '">' + esc(ver) + '</span>';
}
// formación de una pieza: la suya o, si no tiene, la de su idea (como hasta ahora en los carruseles)
function regForm(x) {
  if (x.formacion) return x.formacion;
  const it = x.idea && IMAP[x.idea];
  return it && REG_FORMACIONES.indexOf(it.alcTxt) >= 0 ? it.alcTxt : '';
}
function regChips(x) {
  if (x.formacion) return chipForm(x.formacion);
  const it = x.idea && IMAP[x.idea];
  return it ? chipAlcance(it) : chipForm('');
}
// para filtrar: todos los nombres (ciclos y ramas) que cubre la pieza
function regCubre(x) {
  const out = new Set(), add = t => { if (!t) return; out.add(t); if (REG_RAMA_DE[t]) out.add(REG_NOMBRE_RAMA[REG_RAMA_DE[t]]); };
  if (x.formacion) add(x.formacion);
  else { const it = x.idea && IMAP[x.idea]; if (it) { (ALC_MULTI[it.alcTxt] || [it.alcTxt]).forEach(add); if (it.alcTxt === 'Sanidad y Tecnología') { add('Sanidad'); add('Tecnología'); } if (it.ramaColor) add(it.ramaColor); } }
  return out;
}
const regDia = f => f ? new Date(String(f).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-ES') : '';
const regSlug = t => String(t || '').replace(/\*/g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// nombre de archivo estándar: C07_dam_titulo-corto
function regNombre(x, cod) {
  const it = x.idea && IMAP[x.idea];
  const f = regSlug(regForm(x) || (it ? it.alcTxt : '')).slice(0, 22);
  return [cod, f, regSlug(x.titulo || x.tema || 'pieza').slice(0, 36) || 'pieza'].filter(Boolean).join('_');
}

/* ---------- ficha común (formación + idea) en los editores de los tres talleres ---------- */
// t = 'c' carrusel · 'e' estático · 'g' guion · 'x' externa
function regObj(t, id) { return t === 'c' ? EST.lista[id] : t === 'e' ? ES.lista[id] : t === 'g' ? GU.lista[id] : t === 'x' ? REG.ext[id] : null; }
function regGuardar(t, x) { if (t === 'c') guardarC(x); else if (t === 'e') esGuardar(x); else if (t === 'g') guGuardar('guiones', x); else if (t === 'x') regGuardarExt(x); }
function regRepintar(t) { if (t === 'c' && EST.abierto) pintarEditor(true); else if (t === 'e') esPintar(false); else if (t === 'g') guPintar(false); else if (t === 'x') regPintar(); }
function regFicha(t, x, soloVer) {
  const it = x.idea && IMAP[x.idea];
  if (soloVer) return '<div class="reg-ficha"><span class="reg-l">Formación</span>' + regChips(x) + (it ? '<span class="reg-l">Idea</span><span class="reg-idea">' + esc(tituloIdea(it)) + '</span>' : '') + '</div>';
  return '<div class="reg-ficha"><span class="reg-l">Formación</span><button type="button" class="reg-form" data-reg-form="' + t + ':' + esc(x.id) + '" title="Cambiar la formación">' + regChips(x) + ' <i aria-hidden="true">▾</i></button>' +
    '<span class="reg-l">Idea</span><button type="button" class="reg-ideabtn" data-reg-idea="' + t + ':' + esc(x.id) + '">' + (it ? esc(tituloIdea(it)) : '+ Enlazar idea de la Matriz') + '</button></div>';
}
function regAbrirForm(btn) {
  regCerrarForm();
  const [t, id] = btn.dataset.regForm.split(':'), x = regObj(t, id); if (!x) return;
  const pop = document.createElement('div'); pop.className = 'reg-fpop'; pop.id = 'reg-fpop'; pop.setAttribute('role', 'listbox');
  const op = f => '<button type="button" data-reg-form-v="' + esc(f) + '" aria-selected="' + (regForm(x) === f) + '">' + chipForm(f) + '</button>';
  pop.innerHTML = op('Transversal') + '<hr>' + FORM_RAMAS.map(r => op(r[0])).join('') + '<hr>' + FORM_CICLOS.map(g => g[1].map(op).join('')).join('') +
    (x.formacion ? '<hr><button type="button" data-reg-form-v="">' + (x.idea ? 'La de su idea' : 'Sin formación') + '</button>' : '');
  pop.dataset.para = t + ':' + id;
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect(), h = Math.min(420, innerHeight - 24);
  pop.style.maxHeight = h + 'px';
  pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + 'px';
  pop.style.top = (r.bottom + 6 + h > innerHeight ? Math.max(8, r.top - 6 - Math.min(h, pop.offsetHeight)) : r.bottom + 6) + 'px';
}
function regCerrarForm() { const p = document.getElementById('reg-fpop'); if (p) p.remove(); }
function regAbrirIdea(para) {
  REG.ideaPara = para; REG.iq = '';
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja reg-ideamodal" role="dialog" aria-modal="true" aria-label="Enlazar idea"><header><k>Matriz</k><h2>¿De qué idea sale?</h2></header><div class="cuerpo">' +
    '<input type="search" id="reg-iq" autocomplete="off" placeholder="Busca la idea: homologación, sin la ESO…" aria-label="Buscar idea">' +
    '<div class="reg-ilista" id="reg-ilista">' + regListaIdeas() + '</div></div>' +
    '<footer><span class="puntos"></span><button class="btn" data-reg-idea-v="">Sin idea</button><button class="btn" id="onbCerrar">Cerrar</button></footer></div>';
  setTimeout(() => { const i = $('#reg-iq'); if (i) i.focus(); }, 30);
}
function regListaIdeas() {
  const q = norm(REG.iq || '');
  const l = IDEAS.filter(it => (typeof yaVisible !== 'function' || yaVisible(it)) && (!q || norm(tituloIdea(it) + ' ' + (it.titular || '') + ' ' + it.alcTxt).indexOf(q) >= 0)).slice(0, 40);
  return l.map(it => '<button type="button" data-reg-idea-v="' + esc(it.id) + '"><b>' + esc(tituloIdea(it)) + '</b><span>' + chipAlcance(it) + '</span></button>').join('') ||
    '<p class="est-pista">Ninguna idea con esa búsqueda.</p>';
}

/* ---------- Directorio: la biblioteca de lo publicado ---------- */
var REG = {ext: {}, listo: false, q: '', formato: '', form: '', guarda: {}, ideaPara: null, iq: ''};
const REG_FORMATOS = [['Carrusel', '🎠'], ['Estático', '🧩'], ['Dinámico', '🎞️'], ['Vídeo', '🎬'], ['Otro', '📎']];
const regEmo = f => (REG_FORMATOS.find(x => x[0] === f) || REG_FORMATOS[4])[1];
function regConectar() {
  const db = guDb(); if (!db) return setTimeout(regConectar, 1200);
  db.collection('externas').onSnapshot(snap => {
    const m = {}; snap.docs.forEach(d => { const v = d.data(); if (v) m[d.id] = Object.assign({id: d.id}, v); });
    REG.ext = m; REG.listo = true; if (CNT.sec === 'directorio') regPintar();
  }, () => { REG.listo = true; });
}
function regGuardarExt(x) {
  x.upd = new Date().toISOString(); REG.ext[x.id] = x;
  const limpio = JSON.parse(JSON.stringify(x)); delete limpio.id;
  const db = guDb(); if (db) db.doc('externas/' + x.id).set(limpio).catch(e => toast('No he podido guardar (' + (e && e.code || 'error') + ')'));
}
function regPiezas() {
  const out = [];
  Object.values(EST.lista || {}).filter(c => c.estado === 'hecho').forEach(c => out.push({t: 'c', id: c.id, x: c, cod: codigoC(c), formato: 'Carrusel', titulo: c.titulo || c.tema,
    creado: c.creado || c.fecha, enlace: c.ig ? [['Instagram', c.ig]] : [], fotos: [...new Set((c.slides || []).map(s => s.imagen).filter(Boolean))]}));
  Object.values(typeof ES !== 'undefined' ? ES.lista : {}).filter(e => e.etapa === 'subido').forEach(e => out.push({t: 'e', id: e.id, x: e, cod: esCod(e), formato: e.tipo === 'dinamico' ? 'Dinámico' : 'Estático',
    titulo: String(e.titulo || '').replace(/\*/g, ''), creado: e.creado, enlace: e.drive ? [['Drive', e.drive]] : [], fotos: e.foto ? [e.foto] : []}));
  // guion terminado = publicado, o grabado con su vídeo ya en Drive (los de ads los publica otra persona)
  Object.values(typeof GU !== 'undefined' ? GU.lista : {}).filter(g => g.etapa === 'publicado' || (g.etapa === 'grabado' && g.video)).forEach(g => out.push({t: 'g', id: g.id, x: g, cod: guCod(g),
    formato: 'Vídeo', titulo: g.titulo, creado: g.creado, enlace: [g.video ? ['Vídeo en Drive', g.video] : null, g.enlace ? ['Publicado', g.enlace] : null].filter(Boolean), fotos: []}));
  Object.values(REG.ext).forEach(x => out.push({t: 'x', id: x.id, x: x, cod: x.num ? 'X' + String(x.num).padStart(2, '0') : '', formato: x.formato || 'Otro', titulo: x.titulo,
    creado: x.creado, enlace: x.enlace ? [['Archivo', x.enlace]] : [], fotos: [], fuera: true}));
  return out.sort((a, b) => String(b.creado || '').localeCompare(String(a.creado || '')));
}
function regMini(p) {
  if (p.t === 'c') return mini(p.x, 0);
  if (p.t === 'e') return esMini(p.x, p.x.tipo === 'dinamico' ? 'vertical' : 'cuadrado', {quieto: true});
  if (p.t === 'g') return '<div class="reg-sinmini reg-guion"><span>🎬</span><b>«' + esc((p.x.gancho || p.x.titulo || '').slice(0, 90)) + '»</b>' + (p.x.video ? '<i class="reg-convideo">▶ Vídeo en Drive</i>' : '') + '</div>';
  return '<div class="reg-sinmini"><span>' + regEmo(p.formato) + '</span><b>Hecha fuera</b></div>';
}
function regPintar() {
  const sec = document.getElementById('cnt-directorio'); if (!sec || CNT.sec !== 'directorio') return;
  const act = document.activeElement; const y = sec.scrollTop;
  const todas = regPiezas(), q = norm(REG.q).trim();
  const lista = todas.filter(p => (!REG.formato || p.formato === REG.formato) && (!REG.form || regCubre(p.x).has(REG.form)) &&
    (!q || norm([p.titulo, p.cod, regForm(p.x), p.formato].join(' ')).indexOf(q) >= 0));
  let h = '<div class="gu-cuerpo"><div class="reg-barra">' +
    '<div class="mz-buscabarra inv-busca"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
    '<input type="search" id="reg-q" class="invbusca" value="' + esc(REG.q) + '" placeholder="Busca en el directorio…" aria-label="Buscar en el directorio"></div>' +
    '<label class="ft-sel' + (REG.formato ? ' activo' : '') + '"><select id="reg-formato" aria-label="Formato"><option value="">Todos los formatos</option>' +
      REG_FORMATOS.map(([f, e]) => '<option value="' + f + '"' + (REG.formato === f ? ' selected' : '') + '>' + e + ' ' + f + '</option>').join('') + '</select></label>' +
    '<button type="button" class="reg-form reg-ffiltro" data-reg-filtro="1">' + (REG.form ? chipForm(REG.form) : '<span class="mz-ftodas">Todas las formaciones</span>') + ' <i aria-hidden="true">▾</i></button>' +
    '<span class="reg-esp"></span><button class="btn" id="reg-nueva">+ Añadir pieza hecha fuera</button></div>';
  if (!todas.length) h += '<div class="vacio"><b>Todavía no hay nada publicado</b>Aquí aparece lo terminado: carruseles y guiones publicados, estáticos subidos a Drive y lo que añadas hecho fuera.</div>';
  else if (!lista.length) h += '<div class="vacio"><b>Nada con esos filtros</b>Quita algún filtro o prueba con otra palabra.</div>';
  else {
    const grupos = {}; lista.forEach(p => { const k = (p.creado || '').slice(0, 7) || 'sin'; (grupos[k] = grupos[k] || []).push(p); });
    h += Object.keys(grupos).sort().reverse().map(k => '<section class="inv-mes"><h3>' + (k === 'sin' ? 'Sin fecha' : MES_LARGO[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4)) + ' <span>' + grupos[k].length + '</span></h3>' +
      '<div class="reg-rejilla">' + grupos[k].map(p => '<button type="button" class="reg-tarjeta" data-reg-ver="' + p.t + ':' + esc(p.id) + '">' + regMini(p) +
        '<span class="reg-tcuerpo"><span class="reg-tmeta">' + (p.cod ? '<span class="pr-cod">' + esc(p.cod) + '</span>' : '') + '<span class="reg-fmt">' + regEmo(p.formato) + ' ' + p.formato + '</span></span>' +
        '<b>' + esc(String(p.titulo || '(sin título)').replace(/\*/g, '')) + '</b><span class="reg-tmeta">' + regChips(p.x) + '</span>' +
        '<span class="inv-fecha">' + (p.creado ? 'Creado el ' + esc(regDia(p.creado)) : 'Sin fecha') + '</span></span></button>').join('') + '</div></section>').join('');
  }
  sec.innerHTML = h + '</div>';
  sec.scrollTop = y;
  pintarMinis(sec); if (typeof esPintarMinis === 'function') esPintarMinis(sec);
  if (act && act.id === 'reg-q') { const i = $('#reg-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}
function regVer(t, id) {
  const p = regPiezas().find(x => x.t === t && x.id === id); if (!p) return;
  const it = p.x.idea && IMAP[p.x.idea];
  const datos = it ? datosDe(it).filter(Boolean) : [];
  const fila = (l, v) => v ? '<div class="reg-fila"><span>' + l + '</span><div>' + v + '</div></div>' : '';
  const fotos = p.fotos.map(f => '<img src="' + esc(f) + '" alt="">').join('');
  const taller = {c: 'Carruseles', e: 'Estáticos', g: 'Guiones'}[t];
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja reg-verficha" role="dialog" aria-modal="true" aria-label="Ficha"><header><k>' + esc((p.cod ? p.cod + ' · ' : '') + p.formato) + '</k><h2>' + esc(String(p.titulo || '(sin título)').replace(/\*/g, '')) + '</h2></header>' +
    '<div class="cuerpo"><div class="reg-vmini">' + regMini(p) + '</div><div class="reg-vdatos">' +
    fila('Formación', regChips(p.x)) +
    fila('Creado', p.creado ? esc(regDia(p.creado)) : 'Sin fecha') +
    fila('Idea', it ? '<button type="button" class="linkbtn" data-reg-irdea="' + esc(it.id) + '">' + esc(tituloIdea(it)) + '</button>' : '') +
    fila('Datos', datos.map(d => '<span class="reg-dato" title="' + esc(d.frase || '') + '">' + esc(d.id) + ' · ' + esc(d.tema || '') + '</span>').join('')) +
    fila('Fotos', fotos ? '<div class="reg-vfotos">' + fotos + '</div>' : '') +
    fila('Enlaces', p.enlace.map(([l, u]) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(l) + ' ↗</a>').join(' · ')) +
    fila('Nota', p.x.nota ? esc(p.x.nota) : '') +
    '</div></div><footer>' + (t === 'x' ? '<button class="linkbtn peligro" data-reg-borrar="' + esc(id) + '">Borrar</button>' : '') + '<span class="puntos"></span><button class="btn" id="onbCerrar">Cerrar</button>' +
    (taller ? '<button class="btn pri" data-reg-taller="' + t + ':' + esc(id) + '">Abrir en ' + taller + '</button>' : '<button class="btn pri" data-reg-editar="' + esc(id) + '">Editar</button>') + '</footer></div>';
  pintarMinis($('#onb')); if (typeof esPintarMinis === 'function') esPintarMinis($('#onb'));
}
function regAbrirExt(id) {
  const x = (id && REG.ext[id]) || {formato: 'Estático', creado: fISO(hoy())};
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja gu-modal reg-extmodal" role="dialog" aria-modal="true" aria-label="Pieza hecha fuera"><header><k>Directorio</k><h2>' + (id ? 'Editar pieza hecha fuera' : 'Añadir pieza hecha fuera') + '</h2></header><div class="cuerpo">' +
    '<label class="mz-cta">Título<input id="reg-x-titulo" value="' + esc(x.titulo || '') + '" placeholder="Lo que dice la pieza"></label>' +
    '<label class="mz-cta">Formato<select id="reg-x-formato">' + REG_FORMATOS.map(([f, e]) => '<option value="' + f + '"' + (x.formato === f ? ' selected' : '') + '>' + e + ' ' + f + '</option>').join('') + '</select></label>' +
    '<label class="mz-cta">Fecha de creación<input type="date" id="reg-x-fecha" value="' + esc(String(x.creado || '').slice(0, 10)) + '"></label>' +
    '<label class="mz-cta">Enlace (Drive, Instagram…)<input type="url" id="reg-x-enlace" value="' + esc(x.enlace || '') + '" placeholder="https://…"></label>' +
    '<label class="mz-cta">Nota (opcional)<input id="reg-x-nota" value="' + esc(x.nota || '') + '" placeholder="p. ej. la hizo Sergio en Canva"></label>' +
    (id ? regFicha('x', x) : '<p class="est-pista">La formación y la idea se ponen después de guardar, en su ficha.</p>') + '</div>' +
    '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn pri" data-reg-ext-ok="' + esc(id || '') + '">Guardar</button></footer></div>';
  setTimeout(() => { const i = $('#reg-x-titulo'); if (i) i.focus(); }, 30);
}
function regGuardarModalExt(id) {
  const v = k => ($('#reg-x-' + k).value || '').trim();
  if (!v('titulo')) { toast('Ponle un título'); $('#reg-x-titulo').focus(); return; }
  const num = Object.values(REG.ext).reduce((m, x) => Math.max(m, +x.num || 0), 0) + 1;
  const x = Object.assign(id && REG.ext[id] ? REG.ext[id] : {id: 'X' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), num: num},
    {titulo: v('titulo'), formato: v('formato'), creado: v('fecha') || fISO(hoy()), enlace: v('enlace'), nota: v('nota')});
  regGuardarExt(x); cerrarPanel(); regPintar(); toast(id ? 'Guardado' : 'Añadida al directorio');
  if (!id) setTimeout(() => regAbrirExt(x.id), 60);   // y se abre para ponerle formación e idea
}

/* ---------- eventos ---------- */
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const fb = t.closest('[data-reg-form]'); if (fb) { ev.stopPropagation(); if (document.getElementById('reg-fpop') && document.getElementById('reg-fpop').dataset.para === fb.dataset.regForm) regCerrarForm(); else regAbrirForm(fb); return; }
  const ff = t.closest('[data-reg-filtro]');
  if (ff) { ev.stopPropagation(); regCerrarForm(); const pop = document.createElement('div'); pop.className = 'reg-fpop'; pop.id = 'reg-fpop'; pop.dataset.para = 'filtro';
    const op = f => '<button type="button" data-reg-form-v="' + esc(f) + '" aria-selected="' + (REG.form === f) + '">' + (f ? chipForm(f) : '<span class="mz-ftodas">Todas las formaciones</span>') + '</button>';
    pop.innerHTML = op('') + '<hr>' + op('Transversal') + '<hr>' + FORM_RAMAS.map(r => op(r[0])).join('') + '<hr>' + FORM_CICLOS.map(g => g[1].map(op).join('')).join('');
    document.body.appendChild(pop); const r = ff.getBoundingClientRect(); pop.style.maxHeight = Math.min(420, innerHeight - r.bottom - 16) + 'px'; pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + 'px'; pop.style.top = (r.bottom + 6) + 'px'; return; }
  const fv = t.closest('[data-reg-form-v]');
  if (fv && fv.closest('#reg-fpop')) {
    const para = fv.closest('#reg-fpop').dataset.para; regCerrarForm();
    if (para === 'filtro') { REG.form = fv.dataset.regFormV; regPintar(); return; }
    const [k, id] = para.split(':'), x = regObj(k, id); if (!x) return;
    x.formacion = fv.dataset.regFormV; regGuardar(k, x);
    if (k === 'x' && document.querySelector('.reg-extmodal')) { const f = document.querySelector('.reg-extmodal .reg-ficha'); if (f) f.outerHTML = regFicha('x', x); } else regRepintar(k);
    return;
  }
  if (!t.closest('#reg-fpop')) regCerrarForm();
  const ib = t.closest('[data-reg-idea]'); if (ib) { regAbrirIdea(ib.dataset.regIdea); return; }
  const iv = t.closest('[data-reg-idea-v]');
  if (iv && REG.ideaPara) {
    const [k, id] = REG.ideaPara.split(':'), x = regObj(k, id); REG.ideaPara = null; cerrarPanel(); if (!x) return;
    x.idea = iv.dataset.regIdeaV || '';
    if (!x.idea) delete x.idea;
    regGuardar(k, x); if (k === 'x') regAbrirExt(id); else regRepintar(k);
    toast(x.idea ? 'Idea enlazada' : 'Sin idea'); return;
  }
  if (t.closest('#reg-nueva')) { regAbrirExt(null); return; }
  const eo = t.closest('[data-reg-ext-ok]'); if (eo) { regGuardarModalExt(eo.dataset.regExtOk); return; }
  const ed = t.closest('[data-reg-editar]'); if (ed) { regAbrirExt(ed.dataset.regEditar); return; }
  const bo = t.closest('[data-reg-borrar]'); if (bo) { const id = bo.dataset.regBorrar; delete REG.ext[id]; const db = guDb(); if (db) db.doc('externas/' + id).delete().catch(() => {}); cerrarPanel(); regPintar(); toast('Borrada del directorio'); return; }
  const vr = t.closest('[data-reg-ver]'); if (vr) { const [k, id] = vr.dataset.regVer.split(':'); regVer(k, id); return; }
  const tl = t.closest('[data-reg-taller]');
  if (tl) { const [k, id] = tl.dataset.regTaller.split(':'); cerrarPanel();
    if (k === 'c') { cntIr('carruseles'); S.v = 'producir'; render(); abrirEditor(id); }
    else if (k === 'e') { const e = ES.lista[id]; ES.tab = e && e.tipo === 'dinamico' ? 'dinamico' : 'normal'; ES.abierto = id; cntIr('estaticos'); }
    else if (k === 'g') { GU.tab = 'guiones'; GU.abierto = id; cntIr('guiones'); }
    return; }
  const ir = t.closest('[data-reg-irdea]'); if (ir) { const id = ir.dataset.regIrdea; cerrarPanel(); cntIr('carruseles'); S.v = 'ideas'; render(); if (typeof abrir === 'function') abrir(id); return; }
}, true);
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'reg-iq') { REG.iq = t.value; const l = $('#reg-ilista'); if (l) l.innerHTML = regListaIdeas(); return; }
  if (t.id === 'reg-q') { REG.q = t.value; regPintar(); }
});
document.addEventListener('change', ev => { if (ev.target.id === 'reg-formato') { REG.formato = ev.target.value; regPintar(); } });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') regCerrarForm(); });
// se cierra si se mueve la página, no al deslizar DENTRO de la lista (Sandra, 23/10/2026: «no me deja deslizar»)
addEventListener('scroll', ev => { const p = document.getElementById('reg-fpop'); if (p && !(ev.target === p || (ev.target.nodeType === 1 && p.contains(ev.target)))) regCerrarForm(); }, true);

// la ficha común en el editor de carruseles (debajo de «Diseño»; en Publicado, solo para ver)
const _pintarEditorReg = pintarEditor;
pintarEditor = function (todo) {
  _pintarEditorReg(todo);
  const c = EST.lista[EST.abierto]; if (!c) return;
  const panel = document.querySelector('#est-editor #est-panel'); if (!panel || panel.querySelector('.reg-ficha')) return;
  const html = regFicha('c', c, etapaDe(c) === 'publicado');
  const dis = panel.querySelector('.sel-dis-panel');
  if (dis) dis.insertAdjacentHTML('afterend', html); else panel.insertAdjacentHTML('afterbegin', html);
};
regConectar();
