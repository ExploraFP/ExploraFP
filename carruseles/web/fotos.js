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
// Tipo: fotos de stock o capturas de nuestra plataforma (estas van dentro del portátil de las plantillas: «marco: portatil»)
const FOTO_TIPOS = ['Stock', 'Plataforma'];
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
  'plataforma-calendario': ['Sin personas', 'Positivo', ['plataforma', 'calendario', 'clases']],
  'plataforma-chat-tutor': ['Sin personas', 'Positivo', ['plataforma', 'tutor', 'dudas']],
  'plataforma-practicar': ['Sin personas', 'Positivo', ['plataforma', 'progreso', 'práctica']],
  'plataforma-test': ['Sin personas', 'Positivo', ['plataforma', 'test', 'exámenes']],
  'plataforma-mis-cursos': ['Sin personas', 'Positivo', ['plataforma', 'cursos', 'progreso']],
};
const FT = {docs: {}, assets: null, subiendo: 0, f: {tipo: '', rama: '', personas: '', tono: '', orientacion: '', q: ''}, verOcultas: false, borrar: '', editar: ''};
const claveBase = ruta => ruta.replace(/^fotos\//, '').replace(/\.[^.]+$/, '');
function fotosCatalogo() {
  const base = FOTOS_BASE.map(f => { const k = claveBase(f.ruta), c = FOTO_CAT_BASE[k] || ['Una persona', 'Neutro', []], d = FT.docs['base-' + k] || {};
    return Object.assign({id: 'base-' + k, base: true, ruta: f.ruta, desc: f.desc, rama: 'General', personas: c[0], tono: c[1], etiquetas: c[2], orientacion: f.w ? orientacionDe(f.w, f.h) : 'Horizontal', w: f.w, h: f.h, tipo: f.tipo || 'Stock'}, d, {ruta: f.ruta}); });
  const subidas = Object.keys(FT.docs).filter(k => k.slice(0, 5) !== 'base-' && FT.docs[k].asset).map(k => Object.assign({id: k}, FT.docs[k], {ruta: '/_blob/' + FT.docs[k].asset, tipo: FT.docs[k].tipo || 'Stock'}))
    .sort((a, b) => String(b.subida || '').localeCompare(String(a.subida || '')));
  return subidas.concat(base);
}
// FOTOS = lo que Claude y el editor pueden usar (sin las ocultas); desc con la ficha para que Claude elija bien
function rehacerFotos() {
  const lista = fotosCatalogo().filter(f => !f.oculta && f.estado !== 'subiendo');
  FOTOS.length = 0;
  lista.forEach(f => FOTOS.push({ruta: f.ruta, desc: f.desc + (f.base ? '' : ' [' + [f.rama, f.personas, f.tono].concat(f.etiquetas || []).filter(Boolean).join(', ') + ']') +
    (f.tipo === 'Plataforma' ? ' [CAPTURA DE NUESTRA PLATAFORMA: úsala solo en una slide de contenido, con "marco": "portatil"; nunca en la portada ni a pantalla completa]' : '')}));
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
// nombre de archivo → título legible; quita la fecha que añaden los bancos de stock («… 2026 09 15 20 16 07 utc»)
const nombreBonito = n => (n || 'foto').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s*\d{4}\s\d{2}\s\d{2}(\s\d{2}){0,3}(\sutc)?\s*$/i, '')
  .replace(/\s+/g, ' ').trim() || 'foto';

/* ---------- fotos repetidas: «huella» de cómo se ve (dHash 8×8) ----------
   Se compara cómo se ve la foto, no el archivo: al subirla se reduce a JPEG 1800 px, así que nunca es idéntica byte a byte.
   Distancia ≤ 10 de 64 = la misma foto (también con otro tamaño o un recorte mínimo). Se queda la primera que hubiera. */
async function huellaDe(src) {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  try {
    const i = new Image(); i.crossOrigin = 'anonymous'; i.src = url; await i.decode();
    const c = document.createElement('canvas'); c.width = 9; c.height = 8; const x = c.getContext('2d'); x.drawImage(i, 0, 0, 9, 8);
    const d = x.getImageData(0, 0, 9, 8).data, g = []; for (let k = 0; k < 72; k++) g.push(d[k * 4] * .299 + d[k * 4 + 1] * .587 + d[k * 4 + 2] * .114);
    let bits = ''; for (let y = 0; y < 8; y++) for (let k = 0; k < 8; k++) bits += g[y * 9 + k] > g[y * 9 + k + 1] ? '1' : '0';
    return BigInt('0b' + bits).toString(16).padStart(16, '0');
  } catch (e) { return ''; } finally { if (typeof src !== 'string') URL.revokeObjectURL(url); }
}
const distHuella = (a, b) => { let n = BigInt('0x' + a) ^ BigInt('0x' + b), c = 0; while (n) { c += Number(n & 1n); n >>= 1n; } return c; };
FT.huellasSerie = null;
async function huellasConocidas() {
  if (!FT.huellasSerie) {
    FT.huellasSerie = [];
    for (const f of (typeof FOTOS_BASE !== 'undefined' ? FOTOS_BASE : [])) {
      const h = await huellaDe(f.ruta); if (h) FT.huellasSerie.push({id: 'base-' + claveBase(f.ruta), h: h, desc: f.desc});
    }
  }
  const lista = FT.huellasSerie.filter(x => !(FT.docs[x.id] && FT.docs[x.id].oculta));
  for (const id of Object.keys(FT.docs)) {
    const d = FT.docs[id]; if (!d || !d.asset || d.oculta) continue;
    if (!d.huella) { d.huella = await huellaDe('/_blob/' + d.asset); if (d.huella && DB) DB.doc('fotos/' + id).update({huella: d.huella}).catch(() => {}); }
    if (d.huella) lista.push({id: id, h: d.huella, desc: d.desc});
  }
  return lista;
}
async function yaEstaba(blob) {
  const h = await huellaDe(blob); if (!h) return {h: ''};
  const conocidas = await huellasConocidas();
  const igual = conocidas.find(x => distHuella(x.h, h) <= 10);
  return {h: h, igual: igual};
}

async function subirFotos(files) {
  if (!FT.assets) { toast('Para subir fotos abre la web en claude.ai con permiso de edición'); return; }
  const lista = [].slice.call(files || []).filter(esFoto);
  if (!lista.length) { toast('Solo fotos: JPG, PNG o WebP'); return; }
  FT.subiendo += lista.length; render();
  let ok = 0; const repetidas = [];
  for (const file of lista) {
    try {
      const r = await reducirFoto(file, 1800);
      // si ya está en el banco, no se guarda (se queda la que había)
      const rep = await yaEstaba(r.blob);
      if (rep.igual) { repetidas.push('«' + nombreBonito(file.name) + '»'); continue; }
      let up;
      try { up = await FT.assets.upload(r.blob, {type: 'image/jpeg'}); }
      catch (e) { if (e && e.code === 'store_unavailable') { await new Promise(res => setTimeout(res, 1500)); up = await FT.assets.upload(r.blob, {type: 'image/jpeg'}); } else throw e; }
      const doc = {asset: up.id, archivo: String(file.name || '').slice(0, 160), desc: nombreBonito(file.name), rama: 'General', personas: '', tono: 'Neutro', etiquetas: [], orientacion: orientacionDe(r.w, r.h),
        w: r.w, h: r.h, subida: new Date().toISOString(), estado: 'catalogando', huella: rep.h};
      FT.docs[up.id] = doc; await DB.doc('fotos/' + up.id).set(doc); ok++; rehacerFotos(); render();
      catalogarFoto(up.id, r.blob);
    } catch (e) {
      console.warn('subirFotos', e);
      const c = e && e.code;
      toast(c === 'too_large' ? 'Una foto pesa demasiado' : c === 'quota_or_state' ? 'El banco de fotos está lleno: borra alguna' : c === 'rate_limited' ? 'Vas muy rápido, espera un momento' : 'No he podido subir «' + file.name + '»');
    } finally { FT.subiendo--; }
  }
  render();
  const msg = [ok ? (ok === 1 ? 'Foto subida: Claude la está catalogando' : ok + ' fotos subidas: Claude las está catalogando') : '',
    repetidas.length ? (repetidas.length === 1 ? repetidas[0] + ' ya estaba en el banco: no la guardo' : repetidas.length + ' fotos ya estaban en el banco: no las guardo') : ''].filter(Boolean).join(' · ');
  if (msg) toast(msg);
}

// Claude mira la foto y rellena la ficha
// Claude rellena la ficha. Si esta vista puede mandar imágenes, mira la foto; si no, cataloga a partir del nombre del archivo
// (los de stock suelen describir la foto en inglés). Si no puede, la deja «sin catalogar» y en el visor sale el botón para reintentarlo.
async function catalogarFoto(id, blob) {
  const doc = FT.docs[id] || {};
  const fin = datos => DB.doc('fotos/' + id).update(datos).catch(() => {});
  const sample = EST.sample;
  if (!sample) { await fin({estado: 'sin-catalogar'}); return false; }
  const lim = await sample.limits().catch(() => null);
  const conImagen = !!(lim && lim.images);
  const pide = 'Eres el catalogador del banco de fotos de Explora FP (centro de Formación Profesional online). ' +
    (conImagen ? 'Mira la foto adjunta' : 'Solo tienes el nombre del archivo de una foto de stock: «' + (doc.archivo || doc.desc || '') + '». Deduce qué se ve a partir de él') +
    ' y devuelve SOLO un JSON: {"desc": descripción en español de 8-16 palabras de lo que se ve y para qué tema de un carrusel de FP serviría, entre paréntesis 2-4 temas, ' +
    '"rama": una de ' + JSON.stringify(FOTO_RAMAS) + ' (General si no es de un sector concreto), "personas": una de ' + JSON.stringify(FOTO_PERSONAS) +
    ', "tono": una de ' + JSON.stringify(FOTO_TONOS) + ' (Problema = estrés, agobio, duda), "etiquetas": 3-5 palabras sueltas en minúscula, en español}. ' +
    'Ejemplo de desc: "chica con bata tomando la tensión a un paciente (TCAE, prácticas, sanidad)".';
  try {
    let opts = {modelTier: 'quick'};
    if (conImagen) {
      if (!blob) { const r = await fetch('/_blob/' + doc.asset); blob = await r.blob(); }
      opts.images = (await reducirFoto(new File([blob], 'f.jpg', {type: 'image/jpeg'}), 1024)).blob;
    }
    const valida = x => x && typeof x === 'object' && String(x.desc || '').trim().length > 8 && FOTO_PERSONAS.indexOf(x.personas) >= 0;
    let r = await sample.json(pide, opts);
    if (r && r.ficha) r = r.ficha;
    if (!valida(r)) { r = await sample.json(pide + ' Responde SOLO ese JSON, con todos los campos y en español.', opts); if (r && r.ficha) r = r.ficha; }
    if (!valida(r)) throw {message: 'ficha incompleta'};
    const ok = (v, l, d) => l.indexOf(v) >= 0 ? v : d;
    await fin({estado: 'lista', desc: String(r.desc || doc.desc).slice(0, 160), rama: ok(r.rama, FOTO_RAMAS, 'General'), personas: ok(r.personas, FOTO_PERSONAS, ''),
      tono: ok(r.tono, FOTO_TONOS, 'Neutro'), etiquetas: [].concat(r.etiquetas || []).map(x => String(x).toLowerCase().slice(0, 24)).slice(0, 5)});
    return true;
  } catch (e) { await fin({estado: 'sin-catalogar'}); return false; }
}
async function recatalogar(id, btn) {
  if (!EST.sample) { toast('Catalogar con Claude solo funciona abriendo la web en claude.ai'); return; }
  if (btn) { btn.disabled = true; btn.textContent = '✨ Catalogando…'; }
  await DB.doc('fotos/' + id).update({estado: 'catalogando'}).catch(() => {});
  toast(await catalogarFoto(id) ? 'Ficha rellenada' : 'Claude no ha podido catalogarla. Rellénala con «Editar ficha»');
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
// fotos parecidas: misma rama, personas, tono, orientación, etiquetas y palabras de la descripción en común
const palabrasFoto = f => new Set(norm(tituloFoto(f) + ' ' + (f.etiquetas || []).join(' ')).split(/[^a-z0-9ñ]+/).filter(w => w.length > 3));
function parecidas(f, n) {
  const pf = palabrasFoto(f), et = new Set(f.etiquetas || []);
  return fotosCatalogo().filter(x => x.id !== f.id && !x.oculta).map(x => {
    let p = (x.rama === f.rama && f.rama !== 'General' ? 3 : 0) + (x.personas === f.personas ? 2 : 0) + (x.tono === f.tono ? 2 : 0) + (x.orientacion === f.orientacion ? 1 : 0);
    (x.etiquetas || []).forEach(e => { if (et.has(e)) p += 3; });
    palabrasFoto(x).forEach(w => { if (pf.has(w)) p += 2; });
    return [p, x];
  }).filter(a => a[0] >= 4).sort((a, b) => b[0] - a[0]).slice(0, n).map(a => a[1]);
}
// abrir una parecida: si los filtros la esconden, se quitan para poder seguir pasando
function abrirParecida(id) {
  if (!fotosVisibles().some(x => x.id === id)) { FT.f = {tipo: '', rama: '', personas: '', tono: '', orientacion: '', q: ''}; FT.visor = id; render(); }
  else abrirVisor(id);
}
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
    '<div class="ft-v-caja"><div class="ft-v-fig"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '">' +
      (() => { const ps = parecidas(f, 6); return ps.length ? '<div class="ft-v-par"><span>Parecidas</span><div>' +
        ps.map(x => '<button data-ft-par="' + esc(x.id) + '" title="' + esc(tituloFoto(x)) + '" aria-label="Ver ' + esc(tituloFoto(x)) + '"><img src="' + esc(x.ruta) + '" alt="" loading="lazy"></button>').join('') + '</div></div>' : ''; })() +
    '</div>' +
    '<aside class="ft-v-panel"><span class="ft-v-n">' + (i + 1) + ' / ' + l.length + '</span>' + metaFoto(f) +
    '<div class="ft-v-acc">' + (!f.base && (f.estado === 'sin-catalogar' || !(f.etiquetas || []).length) ? '<button class="btn" data-ft-recat="' + esc(f.id) + '">✨ Catalogar con Claude</button>' : '') +
      ('<button class="btn ft-v-bajar" data-ft-bajar="' + esc(f.id) + '">⬇ Descargar</button>' +
      (f.oculta ? '<button class="btn" data-ft-mostrar="' + esc(f.id) + '">Recuperar</button>' :
      '<button class="btn" data-ft-editar="' + esc(f.id) + '">✏️ Editar ficha</button><button class="btn ft-borra" data-ft-borrar="' + esc(f.id) + '">🗑 Borrar</button>')) + '</div></aside></div>';
  const sig = l[(i + 1) % l.length]; if (sig) { const im = new Image(); im.src = sig.ruta; }
}
document.addEventListener('keydown', e => {
  if (FT.visor) {
    if (!$('#onb').hidden) return;
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
  if (FT.f.tipo && f.tipo !== FT.f.tipo) return false;
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
// en qué carruseles sale cada foto (portada o slides), para la línea de debajo y la ficha
function usoFotos() {
  const u = {};
  Object.values(EST.lista || {}).forEach(c => {
    const rutas = new Set((c.slides || []).map(x => x && x.imagen).filter(Boolean));
    rutas.forEach(r => { (u[r] = u[r] || []).push(c); });
  });
  return u;
}
const usosDe = f => (usoFotos()[f.ruta] || []);
const fechaLarga = iso => { try { return new Date(iso).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}); } catch (e) { return ''; } };
// ficha completa (desc, rama, personas, tono, orientación, etiquetas): solo en el visor, a la derecha de la foto
function metaFoto(f) {
  const fila = (k, v) => v ? '<div class="ft-m-fila"><dt>' + k + '</dt><dd>' + v + '</dd></div>' : '';
  return '<p class="ft-m-desc">' + esc(f.desc) + '</p><dl class="ft-m">' +
    fila('Tipo', f.tipo === 'Plataforma' ? 'Captura de la plataforma (va dentro del portátil)' : 'Stock') + fila('Rama', esc(f.rama)) + fila('Personas', f.personas ? FOTO_PER_EMO[f.personas] + ' ' + esc(f.personas) : '') +
    fila('Tono', f.tono ? FOTO_TONO_EMO[f.tono] + ' ' + esc(f.tono) : '') + fila('Orientación', f.orientacion ? esc(f.orientacion) : '') +
    fila('Etiquetas', (f.etiquetas || []).map(x => '<span class="ft-tag ft-et">#' + esc(x) + '</span>').join(' ')) +
    fila('Subida', f.subida ? esc(fechaLarga(f.subida)) : 'Ya estaba en el banco') +
    fila('Tamaño', f.w ? f.w + ' × ' + f.h + ' px' : '') +
    fila('Usada en', (() => { const us = usosDe(f); return us.length ? us.length + (us.length === 1 ? ' carrusel' : ' carruseles') + '<ul class="ft-m-usos">' +
      us.map(c => '<li>' + esc(c.titulo || c.id) + (c.fecha ? ' · ' + esc(fCorta(c.fecha)) : '') + '</li>').join('') + '</ul>' : 'Todavía en ninguno'; })()) + '</dl>';
}
// aviso antes de borrar: ventana con la foto, el mensaje y un botón para confirmar (pedido de Sandra)
function avisoBorrar(id) {
  const f = fotosCatalogo().find(x => x.id === id); if (!f) return;
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja ft-aviso-borrar" role="alertdialog" aria-modal="true" aria-labelledby="ft-ab-t"><div class="cuerpo">' +
    '<img src="' + esc(f.ruta) + '" alt="">' +
    '<h2 id="ft-ab-t">¿Seguro que quieres borrar esta imagen?</h2>' +
    '<p>' + (f.base ? 'Dejará de salir en la galería y en los carruseles nuevos. Podrás recuperarla desde «Ver borradas».' : 'Se borrará para siempre. Los carruseles que ya la usen se quedarán sin ella.') + '</p></div>' +
    '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn ft-si" data-ft-si="' + esc(f.id) + '">Sí, borrar</button></footer></div>';
  setTimeout(() => { const b = document.querySelector('.ft-aviso-borrar #onbCerrar'); if (b) b.focus(); }, 30);
}
// tarjeta de la galería al estilo Envato: solo la foto; al pasar el ratón, arriba el título (cortado) y a la derecha,
// pegados a la esquina inferior, tres botones redondos: ⬇ descargar (abajo), ✏️ editar, 🗑 borrar (arriba)
const tituloFoto = f => String(f.desc || '').replace(/\s*\(.*$/, '') || 'Imagen';
function tarjetaFoto(f) {
  const cat = f.estado === 'catalogando', t = tituloFoto(f);
  const capa = f.oculta ? '<div class="ft-botones"><button class="ft-red ft-red-txt" data-ft-mostrar="' + esc(f.id) + '">Recuperar</button></div>'
    : '<div class="ft-botones"><button class="ft-red" data-ft-borrar="' + esc(f.id) + '" aria-label="Borrar" title="Borrar">🗑</button>' +
      '<button class="ft-red" data-ft-editar="' + esc(f.id) + '" aria-label="Editar ficha" title="Editar ficha">✏️</button>' +
      '<button class="ft-red" data-ft-bajar="' + esc(f.id) + '" aria-label="Descargar" title="Descargar">⬇</button></div>';
  return '<figure class="ft-card' + (f.oculta ? ' oculta' : '') + '' + '">' +
    '<div class="ft-img" data-ft-ver="' + esc(f.id) + '" role="button" tabindex="0" aria-label="Ver grande: ' + esc(t) + '"><img src="' + esc(f.ruta) + '" alt="' + esc(f.desc) + '" loading="lazy"></div>' +
    '<div class="ft-tit" title="' + esc(t) + '">' + esc(t) + '</div>' + (() => { const n = usosDe(f).length;
      return '<div class="ft-usos' + (n ? '' : ' cero') + '">' + (n ? 'En ' + n + (n === 1 ? ' carrusel' : ' carruseles') : 'Sin usar todavía') + '</div>'; })() + (cat ? '<span class="ft-cat">✨ Catalogando…</span>' : f.estado === 'sin-catalogar' ? '<span class="ft-cat ft-sincat">Sin catalogar</span>' : '') + capa + '</figure>';
}
function vFotos() {
  const todas = fotosCatalogo(), vis = todas.filter(pasaFoto), ocultas = todas.filter(f => f.oculta).length;
  let h = cabecera('Banco de imágenes', '', [[todas.length - ocultas, 'imágenes', 'ok']]);
  if (FT.assets) h += '<label class="ft-subir" id="ft-zona"><input type="file" id="ft-input" accept="image/jpeg,image/png,image/webp,image/heic,.heic" multiple hidden>' +
    '<b>📷 Sube fotos</b><span>' + (FT.subiendo ? 'Subiendo ' + FT.subiendo + '…' : 'Arrástralas aquí o haz clic. Claude las cataloga solo; tú corriges o borras.') + '</span></label>';
  else h += '<p class="ft-aviso">Para subir fotos abre la web en claude.ai con permiso de edición.</p>';
  h += '<div class="ft-filtros"><div class="ft-linea"><div class="mz-buscabarra ft-busca"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
    '<input type="search" id="ft-q" placeholder="Busca: portátil, estrés, sanidad…" value="' + esc(FT.f.q) + '" aria-label="Buscar fotos"></div>' +
    '<div class="ft-sels">' + desplegableFiltro('tipo', 'Tipo', FOTO_TIPOS) + desplegableFiltro('rama', 'Rama', FOTO_RAMAS) + desplegableFiltro('personas', 'Personas', FOTO_PERSONAS, FOTO_PER_EMO) +
    desplegableFiltro('tono', 'Tono', FOTO_TONOS, FOTO_TONO_EMO) +
    desplegableFiltro('orientacion', 'Orientación', FOTO_ORIENT) +
    (FT.f.tipo || FT.f.rama || FT.f.personas || FT.f.tono || FT.f.orientacion || FT.f.q ? '<button class="ft-limpiar" id="ft-limpiar" aria-label="Quitar filtros" title="Quitar filtros">×</button>' : '') + '</div></div>' +
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
    '<div class="ft-e-fila"><label class="mz-cta">Tipo' + sel('ft-e-tipo', FOTO_TIPOS, f.tipo || 'Stock') + '</label><label class="mz-cta">Rama' + sel('ft-e-rama', FOTO_RAMAS, f.rama) + '</label><label class="mz-cta">Personas' + sel('ft-e-per', FOTO_PERSONAS, f.personas) + '</label>' +
    '<label class="mz-cta">Tono' + sel('ft-e-tono', FOTO_TONOS, f.tono) + '</label></div>' +
    '<label class="mz-cta">Etiquetas (separadas por comas)<input type="text" id="ft-e-et" value="' + esc((f.etiquetas || []).join(', ')) + '"></label>' +
    '</div><footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn pri" id="ft-e-ok">Guardar</button></footer></div>';
}
async function guardarFichaFoto() {
  const id = FT.editar, d = {desc: ($('#ft-e-desc').value || '').trim().slice(0, 160), tipo: $('#ft-e-tipo').value, rama: $('#ft-e-rama').value, personas: $('#ft-e-per').value, tono: $('#ft-e-tono').value,
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
  const rc = t.closest('[data-ft-recat]'); if (rc) { recatalogar(rc.dataset.ftRecat, rc); return; }
  const pa = t.closest('[data-ft-par]'); if (pa) { abrirParecida(pa.dataset.ftPar); return; }
  const vp = t.closest('[data-ft-vpasa]'); if (vp) { pasarVisor(+vp.dataset.ftVpasa); return; }
  if (t.id === 'ft-limpiar') { FT.f = {tipo: '', rama: '', personas: '', tono: '', orientacion: '', q: ''}; render(); return; }
  const dl = t.closest('[data-ft-bajar]'); if (dl) { bajarFoto(dl.dataset.ftBajar, dl); return; }
  const bo = t.closest('[data-ft-borrar]'); if (bo) { avisoBorrar(bo.dataset.ftBorrar); return; }
  const si = t.closest('[data-ft-si]'); if (si) { const id = si.dataset.ftSi; cerrarPanel(); if (FT.visor === id) { if (fotosVisibles().length > 1) pasarVisor(1); else cerrarVisor(); } borrarFoto(id); return; }
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

/* el logo lleva al inicio: la Matriz arriba del todo, sin ficha, visor ni editor abiertos */
function irHome() {
  if (FT.visor) cerrarVisor();
  if (!$('#onb').hidden) cerrarPanel();
  if (EST.abierto) cerrarEditor();
  if (S.sel) cerrar();
  S.v = 'ideas'; S.q = ''; render(); window.scrollTo({top: 0, behavior: 'smooth'});
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#ir-home')) irHome(); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'ir-home') { e.preventDefault(); irHome(); } });

// la lista que ve Claude, ya con el tipo marcado, desde el primer momento (luego se rehace con el db)
rehacerFotos();
