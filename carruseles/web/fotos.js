/* ===================== Fotos: banco de imágenes de Sandra =====================
   Las 12 fotos de serie (contenido/img) + las que sube Sandra (capacidad `assets`).
   Cada foto subida es un doc en db `fotos/<assetId>` con su ficha: desc, rama, personas, tono,
   orientación y etiquetas. Claude la cataloga al subirla (sample con imagen); Sandra la corrige o la borra.
   Las de serie no se borran nunca: se ocultan (doc `fotos/base-<clave>` con oculta: true).
   FOTOS (el array que usan Producción, el editor y el prompt) se rehace aquí en sitio. */
const FOTOS_BASE = FOTOS.slice();
const FOTO_RAMAS = ['General', 'Sanidad', 'Tecnología', 'Comercio', 'Administración', 'Educación'];
const FOTO_PERSONAS = ['Una persona', 'Varias personas', 'Sin personas'];
const FOTO_TONOS = ['Positivo', 'Problema', 'Neutro'];
const FOTO_TONO_EMO = {Positivo: '🙂', Problema: '😣', Neutro: '😐'};
const FOTO_PER_EMO = {'Una persona': '👤', 'Varias personas': '👥', 'Sin personas': '📦'};
// ficha de las fotos de serie
const FOTO_CAT_BASE = {
  'foto-globo-diploma': ['Sin personas', 'Neutro', ['título', 'homologación', 'extranjero']],
  'foto-grupo-estudiantes': ['Varias personas', 'Positivo', ['comunidad', 'éxito', 'exterior']],
  'foto-chica-cascos-portatil': ['Una persona', 'Positivo', ['online', 'casa', 'portátil']],
  'foto-chico-saluda-portatil': ['Una persona', 'Positivo', ['videollamada', 'tutor', 'biblioteca']],
  'foto-chica-biblioteca-portatil': ['Una persona', 'Positivo', ['biblioteca', 'portátil', 'motivación']],
  'foto-web-alumnos': ['Varias personas', 'Positivo', ['pantalla', 'equipo', 'aprender']],
  'foto-libreta-apuntes': ['Sin personas', 'Neutro', ['apuntes', 'organizarse', 'estudiar']],
  'foto-chica-riendo-exterior': ['Una persona', 'Positivo', ['alivio', 'libertad', 'exterior']],
  'foto-chica-gafas-portatil-parque': ['Una persona', 'Positivo', ['flexibilidad', 'parque', 'portátil']],
  'foto-chica-escritorio-sonrie': ['Una persona', 'Positivo', ['testimonio', 'cercanía', 'escritorio']],
  'foto-chica-agobiada-examen': ['Una persona', 'Problema', ['estrés', 'exámenes', 'bloqueo']],
};
const FT = {docs: {}, assets: null, subiendo: 0, f: {rama: '', personas: '', tono: '', q: ''}, verOcultas: false, borrar: '', editar: ''};
const claveBase = ruta => ruta.replace(/^fotos\//, '').replace(/\.[^.]+$/, '');
function fotosCatalogo() {
  const base = FOTOS_BASE.map(f => { const k = claveBase(f.ruta), c = FOTO_CAT_BASE[k] || ['Una persona', 'Neutro', []], d = FT.docs['base-' + k] || {};
    return Object.assign({id: 'base-' + k, base: true, ruta: f.ruta, desc: f.desc, rama: 'General', personas: c[0], tono: c[1], etiquetas: c[2], orientacion: 'Horizontal'}, d, {ruta: f.ruta}); });
  const subidas = Object.keys(FT.docs).filter(k => k.slice(0, 5) !== 'base-' && FT.docs[k].asset).map(k => Object.assign({id: k}, FT.docs[k], {ruta: '/_blob/' + FT.docs[k].asset}))
    .sort((a, b) => String(b.subida || '').localeCompare(String(a.subida || '')));
  return subidas.concat(base);
}
// FOTOS = lo que Claude y el editor pueden usar (sin las ocultas); desc con la ficha para que Claude elija bien
function rehacerFotos() {
  const lista = fotosCatalogo().filter(f => !f.oculta && f.estado !== 'subiendo');
  FOTOS.length = 0;
  lista.forEach(f => FOTOS.push({ruta: f.ruta, desc: f.desc + (f.base ? '' : ' [' + [f.rama, f.personas, f.tono].concat(f.etiquetas || []).filter(Boolean).join(', ') + ']')}));
}
(function cargarFotos() {
  let n = 0; const t = setInterval(async () => {
    if (++n > 40) return clearInterval(t);
    if (!DB) return; clearInterval(t);
    DB.collection('fotos').onSnapshot(snap => { const d = {}; snap.docs.forEach(x => { d[x.id] = x.data(); }); FT.docs = d; rehacerFotos(); if (S.v === 'fotos') render(); }, () => {});
    try { FT.assets = await claude.use('assets'); } catch (e) { FT.assets = null; }
    if (S.v === 'fotos') render();
  }, 300);
})();

const esFoto = f => ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', ''].indexOf(f.type) >= 0 || /\.(jpe?g|png|webp|heic)$/i.test(f.name || '');
// reduce a 1800 px en JPEG (ahorra espacio y la descarga del carrusel va más rápida)
async function reducirFoto(file, max) {
  const url = URL.createObjectURL(file);
  try {
    const i = new Image(); i.src = url; await i.decode();
    const k = Math.min(1, max / Math.max(i.naturalWidth, i.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(i.naturalWidth * k); c.height = Math.round(i.naturalHeight * k);
    c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
    return {blob, w: c.width, h: c.height};
  } finally { URL.revokeObjectURL(url); }
}
const orientacionDe = (w, h) => w > h * 1.1 ? 'Horizontal' : h > w * 1.1 ? 'Vertical' : 'Cuadrada';
const nombreBonito = n => (n || 'foto').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

async function subirFotos(files) {
  if (!FT.assets) { toast('Para subir fotos abre la web en claude.ai con permiso de edición'); return; }
  const lista = [].slice.call(files || []).filter(esFoto);
  if (!lista.length) { toast('Solo fotos: JPG, PNG o WebP'); return; }
  FT.subiendo += lista.length; render();
  let ok = 0;
  for (const file of lista) {
    try {
      const r = await reducirFoto(file, 1800);
      let up;
      try { up = await FT.assets.upload(r.blob, {type: 'image/jpeg'}); }
      catch (e) { if (e && e.code === 'store_unavailable') { await new Promise(res => setTimeout(res, 1500)); up = await FT.assets.upload(r.blob, {type: 'image/jpeg'}); } else throw e; }
      const doc = {asset: up.id, desc: nombreBonito(file.name), rama: 'General', personas: '', tono: 'Neutro', etiquetas: [], orientacion: orientacionDe(r.w, r.h),
        w: r.w, h: r.h, subida: new Date().toISOString(), estado: 'catalogando'};
      FT.docs[up.id] = doc; await DB.doc('fotos/' + up.id).set(doc); ok++; rehacerFotos(); render();
      catalogarFoto(up.id, r.blob);
    } catch (e) {
      const c = e && e.code;
      toast(c === 'too_large' ? 'Una foto pesa demasiado' : c === 'quota_or_state' ? 'El banco de fotos está lleno: borra alguna' : c === 'rate_limited' ? 'Vas muy rápido, espera un momento' : 'No he podido subir «' + file.name + '»');
    } finally { FT.subiendo--; }
  }
  render(); if (ok) toast(ok === 1 ? 'Foto subida: Claude la está catalogando' : ok + ' fotos subidas: Claude las está catalogando');
}

// Claude mira la foto y rellena la ficha
async function catalogarFoto(id, blob) {
  const fin = datos => DB.doc('fotos/' + id).update(Object.assign({estado: 'lista'}, datos)).catch(() => {});
  const sample = EST.sample;
  let lim = null; try { lim = sample && await sample.limits(); } catch (e) {}
  if (!sample || !lim || !lim.images) { await fin({}); return; }
  try {
    if (!blob) { const r = await fetch('/_blob/' + FT.docs[id].asset); blob = await r.blob(); }
    const peq = await reducirFoto(new File([blob], 'f.jpg', {type: 'image/jpeg'}), 1024);
    const r = await sample.json('Eres el catalogador del banco de fotos de Explora FP (centro de Formación Profesional online). ' +
      'Mira la foto adjunta y devuelve SOLO un JSON: {"desc": descripción en español de 8-16 palabras de lo que se ve y para qué tema de un carrusel de FP serviría, entre paréntesis 2-4 temas, ' +
      '"rama": una de ' + JSON.stringify(FOTO_RAMAS) + ' (General si no es de un sector concreto), "personas": una de ' + JSON.stringify(FOTO_PERSONAS) +
      ', "tono": una de ' + JSON.stringify(FOTO_TONOS) + ' (Problema = estrés, agobio, duda), "etiquetas": 3-5 palabras sueltas en minúscula}. ' +
      'Ejemplo de desc: "chica con bata tomando la tensión a un paciente (TCAE, prácticas, sanidad)".', {images: peq.blob, modelTier: 'quick'});
    const ok = (v, l, d) => l.indexOf(v) >= 0 ? v : d;
    await fin({desc: String(r.desc || FT.docs[id].desc).slice(0, 160), rama: ok(r.rama, FOTO_RAMAS, 'General'), personas: ok(r.personas, FOTO_PERSONAS, ''),
      tono: ok(r.tono, FOTO_TONOS, 'Neutro'), etiquetas: [].concat(r.etiquetas || []).map(x => String(x).toLowerCase().slice(0, 24)).slice(0, 5)});
  } catch (e) { await fin({}); }
}

async function borrarFoto(id) {
  const f = fotosCatalogo().find(x => x.id === id); if (!f) return;
  FT.borrar = '';
  if (f.base) { await DB.doc('fotos/' + id).set(Object.assign({}, FT.docs[id], {oculta: true})); toast('Foto oculta: ya no saldrá en los carruseles nuevos'); return; }
  try {
    if (FT.assets) await FT.assets.delete(f.asset);
    await DB.doc('fotos/' + id).delete(); delete FT.docs[id]; rehacerFotos(); render(); toast('Foto borrada');
  } catch (e) { toast('No he podido borrarla. Prueba otra vez'); }
}

function pasaFoto(f) {
  if (f.oculta && !FT.verOcultas) return false;
  if (FT.verOcultas && !f.oculta) return false;
  if (FT.f.rama && f.rama !== FT.f.rama) return false;
  if (FT.f.personas && f.personas !== FT.f.personas) return false;
  if (FT.f.tono && f.tono !== FT.f.tono) return false;
  if (FT.f.q) { const q = norm(FT.f.q); if (norm([f.desc, f.rama, f.personas, f.tono].concat(f.etiquetas || []).join(' ')).indexOf(q) < 0) return false; }
  return true;
}
function chipsFiltro(k, lista, emo) {
  return '<div class="ft-filtro"><button class="ft-chip" data-ft-f="' + k + ':" aria-pressed="' + !FT.f[k] + '">Todas</button>' +
    lista.map(v => '<button class="ft-chip" data-ft-f="' + k + ':' + esc(v) + '" aria-pressed="' + (FT.f[k] === v) + '">' + (emo && emo[v] ? emo[v] + ' ' : '') + esc(v) + '</button>').join('') + '</div>';
}
function tarjetaFoto(f) {
  const cat = f.estado === 'catalogando';
  const pie = FT.borrar === f.id
    ? '<div class="ft-confirma"><span>' + (f.base ? '¿Ocultarla? Es de serie, no se borra.' : '¿Borrarla para siempre? Los carruseles que ya la usen se quedarán sin foto.') + '</span>' +
      '<button class="btn" data-ft-no="1">No</button><button class="btn ft-si" data-ft-si="' + esc(f.id) + '">' + (f.base ? 'Ocultar' : 'Borrar') + '</button></div>'
    : '<div class="ft-acc">' + (f.oculta ? '<button class="btn" data-ft-mostrar="' + esc(f.id) + '">Volver a usar</button>' :
      '<button class="btn" data-ft-editar="' + esc(f.id) + '">✏️ Editar ficha</button><button class="btn ft-borra" data-ft-borrar="' + esc(f.id) + '" aria-label="' + (f.base ? 'Ocultar' : 'Borrar') + ' foto">🗑</button>') + '</div>';
  return '<figure class="ft-card' + (f.oculta ? ' oculta' : '') + '"><div class="ft-img"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '" loading="lazy">' +
    (f.base ? '<span class="ft-serie">De serie</span>' : '') + (cat ? '<span class="ft-cat">✨ Catalogando…</span>' : '') + '</div>' +
    '<figcaption><p class="ft-desc">' + esc(f.desc) + '</p><div class="ft-tags">' +
    (f.rama ? '<span class="ft-tag">' + esc(f.rama) + '</span>' : '') +
    (f.personas ? '<span class="ft-tag">' + FOTO_PER_EMO[f.personas] + ' ' + esc(f.personas) + '</span>' : '') +
    (f.tono ? '<span class="ft-tag">' + FOTO_TONO_EMO[f.tono] + ' ' + esc(f.tono) + '</span>' : '') +
    (f.orientacion ? '<span class="ft-tag">' + esc(f.orientacion) + '</span>' : '') +
    (f.etiquetas || []).map(x => '<span class="ft-tag ft-et">#' + esc(x) + '</span>').join('') + '</div>' + pie + '</figcaption></figure>';
}
function vFotos() {
  const todas = fotosCatalogo(), vis = todas.filter(pasaFoto), ocultas = todas.filter(f => f.oculta).length;
  const subidas = todas.filter(f => !f.base).length;
  let h = cabecera('Banco de fotos', '', [[todas.length - ocultas, 'en uso', 'ok'], [subidas, 'subidas por ti']]);
  if (FT.assets) h += '<label class="ft-subir" id="ft-zona"><input type="file" id="ft-input" accept="image/jpeg,image/png,image/webp,image/heic,.heic" multiple hidden>' +
    '<b>📷 Sube fotos</b><span>' + (FT.subiendo ? 'Subiendo ' + FT.subiendo + '…' : 'Arrástralas aquí o haz clic. Claude las cataloga solo; tú corriges o borras.') + '</span></label>';
  else h += '<p class="ft-aviso">Para subir fotos abre la web en claude.ai con permiso de edición.</p>';
  h += '<div class="ft-filtros"><div class="mz-buscabarra ft-busca"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
    '<input type="search" id="ft-q" placeholder="Busca: portátil, estrés, sanidad…" value="' + esc(FT.f.q) + '" aria-label="Buscar fotos"></div>' +
    chipsFiltro('rama', FOTO_RAMAS) + chipsFiltro('personas', FOTO_PERSONAS, FOTO_PER_EMO) + chipsFiltro('tono', FOTO_TONOS, FOTO_TONO_EMO) +
    (ocultas ? '<label class="mz-todas ft-ocultas"><input type="checkbox" id="ft-verocultas"' + (FT.verOcultas ? ' checked' : '') + '> Ver ocultas (' + ocultas + ')</label>' : '') + '</div>';
  h += vis.length ? '<div class="ft-grid">' + vis.map(tarjetaFoto).join('') + '</div>' : '<div class="vacio"><b>Ninguna foto con esos filtros</b>Quita algún filtro o sube fotos nuevas.</div>';
  return h;
}
function abrirFichaFoto(id) {
  const f = fotosCatalogo().find(x => x.id === id); if (!f) return;
  const sel = (idc, lista, v) => '<select id="' + idc + '">' + lista.map(x => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
  $('#onb').hidden = false; FT.editar = id;
  $('#onb').innerHTML = '<div class="onbcaja mz-rapida" role="dialog" aria-modal="true" aria-label="Ficha de la foto"><header><k>Ficha de la foto</k><h2>✏️ Corrige lo que haga falta</h2></header><div class="cuerpo">' +
    '<img class="ft-fichaimg" src="' + esc(f.ruta) + '" alt="">' +
    '<label class="mz-cta">Qué se ve y para qué sirve<textarea id="ft-e-desc" rows="3">' + esc(f.desc) + '</textarea></label>' +
    '<div class="ft-e-fila"><label class="mz-cta">Rama' + sel('ft-e-rama', FOTO_RAMAS, f.rama) + '</label><label class="mz-cta">Personas' + sel('ft-e-per', FOTO_PERSONAS, f.personas) + '</label>' +
    '<label class="mz-cta">Tono' + sel('ft-e-tono', FOTO_TONOS, f.tono) + '</label></div>' +
    '<label class="mz-cta">Etiquetas (separadas por comas)<input type="text" id="ft-e-et" value="' + esc((f.etiquetas || []).join(', ')) + '"></label>' +
    '</div><footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn pri" id="ft-e-ok">Guardar</button></footer></div>';
}
async function guardarFichaFoto() {
  const id = FT.editar, d = {desc: ($('#ft-e-desc').value || '').trim().slice(0, 160), rama: $('#ft-e-rama').value, personas: $('#ft-e-per').value, tono: $('#ft-e-tono').value,
    etiquetas: ($('#ft-e-et').value || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).slice(0, 6)};
  cerrarPanel();
  try { await DB.doc('fotos/' + id).set(Object.assign({}, FT.docs[id], d)); toast('Ficha guardada'); } catch (e) { toast('No he podido guardarla'); }
}

const _renderFt = render;
render = function () {
  if (S.v === 'fotos') { $('#canvas').innerHTML = vFotos(); marcarPestana(); return; }
  _renderFt();
};
const _refrescarEstudioFt = refrescarEstudio;
refrescarEstudio = function () { if (S.v === 'fotos') { if (!EST.abierto) render(); return; } _refrescarEstudioFt(); };
document.addEventListener('click', e => {
  const t = e.target;
  const ff = t.closest('[data-ft-f]'); if (ff) { const [k, v] = ff.dataset.ftF.split(':'); FT.f[k] = v; render(); return; }
  const bo = t.closest('[data-ft-borrar]'); if (bo) { FT.borrar = bo.dataset.ftBorrar; render(); return; }
  if (t.closest('[data-ft-no]')) { FT.borrar = ''; render(); return; }
  const si = t.closest('[data-ft-si]'); if (si) { borrarFoto(si.dataset.ftSi); return; }
  const mo = t.closest('[data-ft-mostrar]'); if (mo) { const id = mo.dataset.ftMostrar; DB.doc('fotos/' + id).set(Object.assign({}, FT.docs[id], {oculta: false})); return; }
  const ed = t.closest('[data-ft-editar]'); if (ed) { abrirFichaFoto(ed.dataset.ftEditar); return; }
  if (t.id === 'ft-e-ok') { guardarFichaFoto(); return; }
});
document.addEventListener('change', e => {
  if (e.target.id === 'ft-input') { subirFotos(e.target.files); e.target.value = ''; }
  if (e.target.id === 'ft-verocultas') { FT.verOcultas = e.target.checked; render(); }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'ft-q') return;
  FT.f.q = e.target.value; const pos = e.target.selectionStart; render();
  const i = $('#ft-q'); if (i) { i.focus(); i.setSelectionRange(pos, pos); }
});
document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('#ft-zona'); if (z) { e.preventDefault(); z.classList.add('encima'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('#ft-zona'); if (z) z.classList.remove('encima'); });
document.addEventListener('drop', e => { const z = e.target.closest && e.target.closest('#ft-zona'); if (z) { e.preventDefault(); z.classList.remove('encima'); subirFotos(e.dataTransfer.files); } });
