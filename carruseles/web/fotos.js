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
const FOTO_ORIENT = ['Vertical', 'Horizontal', 'Cuadrada'];
const FOTO_TONO_EMO = {Positivo: '🙂', Problema: '😣', Neutro: '😐'};
const FOTO_OR_EMO = {Vertical: '▯', Horizontal: '▭', Cuadrada: '□'};
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
const FT = {docs: {}, assets: null, subiendo: 0, f: {rama: '', personas: '', tono: '', orientacion: '', q: ''}, verOcultas: false, borrar: '', editar: ''};
const claveBase = ruta => ruta.replace(/^fotos\//, '').replace(/\.[^.]+$/, '');
function fotosCatalogo() {
  const base = FOTOS_BASE.map(f => { const k = claveBase(f.ruta), c = FOTO_CAT_BASE[k] || ['Una persona', 'Neutro', []], d = FT.docs['base-' + k] || {};
    return Object.assign({id: 'base-' + k, base: true, ruta: f.ruta, desc: f.desc, rama: 'General', personas: c[0], tono: c[1], etiquetas: c[2], orientacion: f.w ? orientacionDe(f.w, f.h) : 'Horizontal'}, d, {ruta: f.ruta}); });
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
  if (f.base) { await DB.doc('fotos/' + id).set(Object.assign({}, FT.docs[id], {oculta: true})); toast('Foto borrada. Puedes recuperarla en «Ver borradas»'); return; }
  try {
    if (FT.assets) await FT.assets.delete(f.asset);
    await DB.doc('fotos/' + id).delete(); delete FT.docs[id]; rehacerFotos(); render(); toast('Foto borrada');
  } catch (e) { toast('No he podido borrarla. Prueba otra vez'); }
}

// descarga la foto tal cual está guardada (JPEG), con un nombre sacado de su descripción
async function bajarFoto(id, btn) {
  const f = fotosCatalogo().find(x => x.id === id); if (!f) return;
  const nombre = 'explora-' + (norm(f.desc).replace(/\(.*$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'foto') + '.jpg';
  if (btn) btn.disabled = true;
  try {
    const blob = await (await fetch(f.ruta)).blob();
    const down = DOWN || (typeof claude !== 'undefined' && claude.use ? await claude.use('downloads') : null);
    if (down) { await guardarArchivo(down, nombre, blob); toast('Foto descargada'); }
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  } catch (e) { if (!(e && e.code === 'declined')) toast('No he podido descargarla. Prueba otra vez'); }
  finally { if (btn) btn.disabled = false; }
}
/* visor: la foto en grande, × para cerrar, flechas para pasar (dentro de lo filtrado), ← → Esc y deslizar en móvil */
function colsGaleria() { const w = Math.min(window.innerWidth, 1680) - 48; return window.innerWidth <= 720 ? 2 : Math.max(2, Math.min(5, Math.floor(w / 270))); }
let FT_COLS = 0;
window.addEventListener('resize', () => { if (S.v !== 'fotos') return; const n = colsGaleria(); if (n !== FT_COLS) { FT_COLS = n; render(); } });
function fotosVisibles() { return fotosCatalogo().filter(pasaFoto); }
function abrirVisor(id) { FT.visor = id; pintarVisor(); }
function cerrarVisor() { FT.visor = ''; const v = document.getElementById('ft-visor'); if (v) v.remove(); document.body.style.overflow = ''; }
function pasarVisor(d) {
  const l = fotosVisibles(); if (!l.length) return cerrarVisor();
  const i = l.findIndex(f => f.id === FT.visor);
  FT.visor = l[((i < 0 ? 0 : i) + d + l.length) % l.length].id; pintarVisor();
}
function pintarVisor() {
  const l = fotosVisibles(), i = l.findIndex(f => f.id === FT.visor); if (i < 0) return cerrarVisor();
  const f = l[i];
  let v = document.getElementById('ft-visor');
  if (!v) { v = document.createElement('div'); v.id = 'ft-visor'; v.className = 'ft-visor'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); document.body.appendChild(v); }
  document.body.style.overflow = 'hidden';
  v.setAttribute('aria-label', f.desc);
  v.innerHTML = '<button class="ft-v-x" data-ft-vx="1" aria-label="Cerrar">×</button>' +
    (l.length > 1 ? '<button class="ft-v-flecha ant" data-ft-vpasa="-1" aria-label="Anterior">‹</button><button class="ft-v-flecha sig" data-ft-vpasa="1" aria-label="Siguiente">›</button>' : '') +
    '<div class="ft-v-caja"><div class="ft-v-fig"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '"></div>' +
    '<aside class="ft-v-panel"><span class="ft-v-n">' + (i + 1) + ' / ' + l.length + '</span>' + metaFoto(f) +
    '<div class="ft-v-acc">' + (FT.borrar === f.id ? confirmaBorrar(f) : '<button class="btn ft-v-bajar" data-ft-bajar="' + esc(f.id) + '">⬇ Descargar</button>' +
      (f.oculta ? '<button class="btn" data-ft-mostrar="' + esc(f.id) + '">Recuperar</button>' :
      '<button class="btn" data-ft-editar="' + esc(f.id) + '">✏️ Editar ficha</button><button class="btn ft-borra" data-ft-borrar="' + esc(f.id) + '">🗑 Borrar</button>')) + '</div></aside></div>';
  const sig = l[(i + 1) % l.length]; if (sig) { const im = new Image(); im.src = sig.ruta; }
}
document.addEventListener('keydown', e => {
  if (FT.visor) {
    if (e.key === 'Escape') { cerrarVisor(); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { pasarVisor(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { pasarVisor(-1); e.preventDefault(); }
    return;
  }
  const t = e.target; if ((e.key === 'Enter' || e.key === ' ') && t.dataset && t.dataset.ftVer) { abrirVisor(t.dataset.ftVer); e.preventDefault(); }
});
let FT_TOQUE = null;
document.addEventListener('touchstart', e => { if (FT.visor && e.touches.length === 1) FT_TOQUE = e.touches[0].clientX; }, {passive: true});
document.addEventListener('touchend', e => {
  if (!FT.visor || FT_TOQUE == null) return; const dx = e.changedTouches[0].clientX - FT_TOQUE; FT_TOQUE = null;
  if (Math.abs(dx) > 50) pasarVisor(dx < 0 ? 1 : -1);
}, {passive: true});
function pasaFoto(f) {
  if (f.oculta && !FT.verOcultas) return false;
  if (FT.verOcultas && !f.oculta) return false;
  if (FT.f.rama && f.rama !== FT.f.rama) return false;
  if (FT.f.personas && f.personas !== FT.f.personas) return false;
  if (FT.f.tono && f.tono !== FT.f.tono) return false;
  if (FT.f.orientacion && f.orientacion !== FT.f.orientacion) return false;
  if (FT.f.q) { const q = norm(FT.f.q); if (norm([f.desc, f.rama, f.personas, f.tono].concat(f.etiquetas || []).join(' ')).indexOf(q) < 0) return false; }
  return true;
}
// filtros = tres desplegables en la misma línea que el buscador (pedido de Sandra: nada de filas de chips)
function desplegableFiltro(k, todas, lista, emo) {
  return '<label class="ft-sel' + (FT.f[k] ? ' activo' : '') + '"><span class="sr">' + esc(todas) + '</span><select data-ft-sel="' + k + '">' +
    '<option value="">' + esc(todas) + '</option>' +
    lista.map(v => '<option value="' + esc(v) + '"' + (FT.f[k] === v ? ' selected' : '') + '>' + (emo && emo[v] ? emo[v] + ' ' : '') + esc(v) + '</option>').join('') + '</select></label>';
}
// ficha completa (desc, rama, personas, tono, orientación, etiquetas): solo en el visor, a la derecha de la foto
function metaFoto(f) {
  const fila = (k, v) => v ? '<div class="ft-m-fila"><dt>' + k + '</dt><dd>' + v + '</dd></div>' : '';
  return '<p class="ft-m-desc">' + esc(f.desc) + '</p><dl class="ft-m">' +
    fila('Rama', esc(f.rama)) + fila('Personas', f.personas ? FOTO_PER_EMO[f.personas] + ' ' + esc(f.personas) : '') +
    fila('Tono', f.tono ? FOTO_TONO_EMO[f.tono] + ' ' + esc(f.tono) : '') + fila('Orientación', f.orientacion ? FOTO_OR_EMO[f.orientacion] + ' ' + esc(f.orientacion) : '') +
    fila('Etiquetas', (f.etiquetas || []).map(x => '<span class="ft-tag ft-et">#' + esc(x) + '</span>').join(' ')) + '</dl>';
}
function confirmaBorrar(f) {
  return '<div class="ft-confirma"><span>¿Borrarla? Los carruseles que ya la usen se quedarán sin ella.</span>' +
    '<button class="btn" data-ft-no="1">No</button><button class="btn ft-si" data-ft-si="' + esc(f.id) + '">Borrar</button></div>';
}
// tarjeta de la galería: solo la foto y Descargar (grande) · ✏️ · 🗑 (pedido de Sandra: nada de etiquetas aquí)
function tarjetaFoto(f) {
  const cat = f.estado === 'catalogando';
  const pie = FT.borrar === f.id ? confirmaBorrar(f)
    : '<div class="ft-acc">' + (f.oculta ? '<button class="btn" data-ft-mostrar="' + esc(f.id) + '">Recuperar</button>' :
      '<button class="btn ft-bajar" data-ft-bajar="' + esc(f.id) + '">⬇ Descargar</button><button class="btn ft-ico" data-ft-editar="' + esc(f.id) + '" aria-label="Editar ficha" title="Editar ficha">✏️</button><button class="btn ft-borra ft-ico" data-ft-borrar="' + esc(f.id) + '" aria-label="Borrar" title="Borrar">🗑</button>') + '</div>';
  return '<figure class="ft-card' + (f.oculta ? ' oculta' : '') + '"><div class="ft-img" data-ft-ver="' + esc(f.id) + '" role="button" tabindex="0" aria-label="Ver grande: ' + esc(f.desc) + '"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '" loading="lazy">' +
    (cat ? '<span class="ft-cat">✨ Catalogando…</span>' : '') + '</div><figcaption>' + pie + '</figcaption></figure>';
}
function vFotos() {
  const todas = fotosCatalogo(), vis = todas.filter(pasaFoto), ocultas = todas.filter(f => f.oculta).length;
  let h = cabecera('Banco de imágenes', '', [[todas.length - ocultas, 'imágenes', 'ok']]);
  if (FT.assets) h += '<label class="ft-subir" id="ft-zona"><input type="file" id="ft-input" accept="image/jpeg,image/png,image/webp,image/heic,.heic" multiple hidden>' +
    '<b>📷 Sube fotos</b><span>' + (FT.subiendo ? 'Subiendo ' + FT.subiendo + '…' : 'Arrástralas aquí o haz clic. Claude las cataloga solo; tú corriges o borras.') + '</span></label>';
  else h += '<p class="ft-aviso">Para subir fotos abre la web en claude.ai con permiso de edición.</p>';
  h += '<div class="ft-filtros"><div class="ft-linea"><div class="mz-buscabarra ft-busca"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
    '<input type="search" id="ft-q" placeholder="Busca: portátil, estrés, sanidad…" value="' + esc(FT.f.q) + '" aria-label="Buscar fotos"></div>' +
    '<div class="ft-sels">' + desplegableFiltro('rama', 'Todas las ramas', FOTO_RAMAS) + desplegableFiltro('personas', 'Con o sin personas', FOTO_PERSONAS, FOTO_PER_EMO) +
    desplegableFiltro('tono', 'Cualquier tono', FOTO_TONOS, FOTO_TONO_EMO) +
    desplegableFiltro('orientacion', 'Vertical u horizontal', FOTO_ORIENT, FOTO_OR_EMO) +
    (FT.f.rama || FT.f.personas || FT.f.tono || FT.f.orientacion || FT.f.q ? '<button class="ft-limpiar" id="ft-limpiar" aria-label="Quitar filtros" title="Quitar filtros">×</button>' : '') + '</div></div>' +
    (ocultas ? '<label class="mz-todas ft-ocultas"><input type="checkbox" id="ft-verocultas"' + (FT.verOcultas ? ' checked' : '') + '> Ver borradas (' + ocultas + ')</label>' : '') + '</div>';
  // galería tipo Pinterest: columnas repartidas en orden de lectura (1ª foto col 1, 2ª col 2…), así «siguiente» en el visor va de izquierda a derecha
  const nc = colsGaleria(), cols = Array.from({length: nc}, () => []);
  vis.forEach((f, i) => cols[i % nc].push(tarjetaFoto(f)));
  h += vis.length ? '<div class="ft-grid" style="--cols:' + nc + '">' + cols.map(c => '<div class="ft-col">' + c.join('') + '</div>').join('') + '</div>' : '<div class="vacio"><b>Ninguna foto con esos filtros</b>Quita algún filtro o sube fotos nuevas.</div>';
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
  if (S.v !== 'fotos' && FT.visor) cerrarVisor();
  if (S.v === 'fotos') { if (FT.visor) pintarVisor(); $('#canvas').innerHTML = vFotos(); marcarPestana(); return; }
  _renderFt();
};
const _refrescarEstudioFt = refrescarEstudio;
refrescarEstudio = function () { if (S.v === 'fotos') { if (!EST.abierto) render(); return; } _refrescarEstudioFt(); };
document.addEventListener('click', e => {
  const t = e.target;
  const ver = t.closest('[data-ft-ver]'); if (ver) { abrirVisor(ver.dataset.ftVer); return; }
  if (t.closest('[data-ft-vx]') || t.id === 'ft-visor' || t.classList.contains('ft-v-fig')) { cerrarVisor(); return; }
  const vp = t.closest('[data-ft-vpasa]'); if (vp) { pasarVisor(+vp.dataset.ftVpasa); return; }
  if (t.id === 'ft-limpiar') { FT.f = {rama: '', personas: '', tono: '', orientacion: '', q: ''}; render(); return; }
  const dl = t.closest('[data-ft-bajar]'); if (dl) { bajarFoto(dl.dataset.ftBajar, dl); return; }
  const bo = t.closest('[data-ft-borrar]'); if (bo) { FT.borrar = bo.dataset.ftBorrar; render(); return; }
  if (t.closest('[data-ft-no]')) { FT.borrar = ''; render(); return; }
  const si = t.closest('[data-ft-si]'); if (si) { const id = si.dataset.ftSi; if (FT.visor === id) { FT.borrar = ''; if (fotosVisibles().length > 1) pasarVisor(1); else cerrarVisor(); } borrarFoto(id); return; }
  const mo = t.closest('[data-ft-mostrar]'); if (mo) { const id = mo.dataset.ftMostrar; DB.doc('fotos/' + id).set(Object.assign({}, FT.docs[id], {oculta: false})); return; }
  const ed = t.closest('[data-ft-editar]'); if (ed) { abrirFichaFoto(ed.dataset.ftEditar); return; }
  if (t.id === 'ft-e-ok') { guardarFichaFoto(); return; }
});
document.addEventListener('change', e => {
  if (e.target.id === 'ft-input') { subirFotos(e.target.files); e.target.value = ''; }
  if (e.target.dataset && e.target.dataset.ftSel) { FT.f[e.target.dataset.ftSel] = e.target.value; render(); return; }
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
