/* ===================== Guiones (22/10/2026, Sandra) =====================
   Sección de Contenidos con dos pestañas en la barra lima: «Guiones» (los nuestros) y «Competencia» (anuncios de otros centros).
   Decisiones de Sandra:
   · Para Reels/TikTok orgánicos Y para anuncios: cada guion lleva el tipo («Reel» / «Anuncio») y se filtra por él.
   · Se escriben en TEXTO CORRIDO (sin tabla de escenas): gancho · desarrollo · CTA · texto en pantalla (opcional).
   · Quién graba varía: campo «Graba: yo / otra persona». Etapas Borrador → Para grabar → Grabado → Publicado.
     Para pasárselo a quien graba: «Copiar guion» (texto plano; no hace falta que tenga claude.ai).
   · Competencia: de momento se añaden a mano (enlace, centro, gancho, por qué funciona). Claude no puede buscar anuncios
     desde la web. Cada guion puede apuntar al anuncio en el que se inspira, y desde un anuncio se crea un guion.
   Datos: colecciones `guiones` y `competencia` del mismo db. Claude: el mismo `sample` de Carruseles (EST.sample). */
var GU = {tab: 'guiones', lista: {}, comp: {}, abierto: null, filtro: 'todos', tipo: '', pidiendo: false, guarda: {}, listo: false};
const GU_ETAPAS = [['borrador', 'Borrador'], ['grabar', 'Para grabar'], ['grabado', 'Grabado'], ['publicado', 'Publicado']];
const GU_TIPOS = {reel: 'Reel', anuncio: 'Anuncio'};
const GU_PLATAFORMAS = ['Instagram', 'TikTok', 'Meta Ads', 'YouTube', 'Otra'];
const GU_CAMPOS = [['gancho', 'Gancho', 'Lo que se dice en los 3 primeros segundos. Para el scroll.'],
  ['desarrollo', 'Desarrollo', 'Lo que se cuenta, tal cual se dice a cámara.'],
  ['cta', 'CTA', 'Una sola acción al final.'],
  ['pantalla', 'Texto en pantalla', 'Opcional: rótulos que salen sobre el vídeo.']];
try { const t = localStorage.getItem('guiones.tab'); if (t === 'guiones' || t === 'competencia') GU.tab = t; } catch (e) {}

const guDb = () => (typeof EST_DB !== 'undefined' && EST_DB) || null;
const guCod = g => g && g.num ? 'G' + String(g.num).padStart(2, '0') : '';
const guEtapa = g => GU_ETAPAS.some(e => e[0] === g.etapa) ? g.etapa : 'borrador';
const guNombreEt = k => (GU_ETAPAS.find(e => e[0] === k) || GU_ETAPAS[0])[1];
const guPill = g => '<span class="gu-etapa g-' + guEtapa(g) + '">' + guNombreEt(guEtapa(g)) + '</span>';
const guTipo = g => '<span class="gu-tipo t-' + (g.tipo === 'anuncio' ? 'anuncio' : 'reel') + '">' + (g.tipo === 'anuncio' ? '📣 Anuncio' : '🎬 Reel') + '</span>';
// duración aproximada hablando a ritmo normal (unas 2,5 palabras por segundo)
function guSegundos(g) { const n = ['gancho', 'desarrollo', 'cta'].map(k => g[k] || '').join(' ').split(/\s+/).filter(Boolean).length; return Math.round(n / 2.5); }
const guDur = g => { const s = guSegundos(g); return s ? '≈ ' + s + ' s' : '—'; };

/* ---------- datos ---------- */
function guConectar() {
  const db = guDb(); if (!db) return setTimeout(guConectar, 1200);
  const leer = (col, dest) => db.collection(col).onSnapshot(snap => {
    const m = {};
    snap.docs.forEach(d => { const v = d.data(); if (v) m[d.id] = Object.assign({id: d.id}, v); });
    // una confirmación vieja del db no pisa lo que acabas de escribir (como en Carruseles)
    Object.keys(GU[dest]).forEach(id => { const loc = GU[dest][id]; if (m[id] && loc.upd && m[id].upd && m[id].upd < loc.upd) m[id] = loc; });
    GU[dest] = m; GU.listo = true;
    if (CNT.sec === 'guiones') guPintar(false);
    if (typeof cntPintarInicio === 'function') cntPintarInicio();
  }, () => { GU.listo = true; });
  leer('guiones', 'lista'); leer('competencia', 'comp');
}
function guGuardar(col, x) {
  x.upd = new Date().toISOString();
  (col === 'guiones' ? GU.lista : GU.comp)[x.id] = x;
  const limpio = JSON.parse(JSON.stringify(x)); delete limpio.id;
  const db = guDb(); if (db) db.doc(col + '/' + x.id).set(limpio).catch(e => toast('No he podido guardar (' + (e && e.code || 'error') + ')'));
}
function guBorrar(col, id) {
  delete (col === 'guiones' ? GU.lista : GU.comp)[id];
  const db = guDb(); if (db) db.doc(col + '/' + id).delete().catch(() => {});
}
function guNuevo(datos) {
  const num = Object.values(GU.lista).reduce((m, x) => Math.max(m, +x.num || 0), 0) + 1;
  const g = Object.assign({id: 'G' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), num: num, titulo: '', tipo: 'reel', etapa: 'borrador',
    graba: 'yo', gancho: '', desarrollo: '', cta: '', pantalla: '', chat: [], creado: new Date().toISOString()}, datos || {});
  guGuardar('guiones', g); return g;
}

/* ---------- pintar ---------- */
function guPintar(todo) {
  const sec = document.getElementById('cnt-guiones'); if (!sec || CNT.sec !== 'guiones') return;
  // mientras se escribe en el guion abierto no se repinta (si no, se perdería el cursor)
  const act = document.activeElement;
  if (!todo && GU.abierto && act && sec.contains(act) && /^(TEXTAREA|INPUT)$/.test(act.tagName)) { guPintarMeta(); return; }
  const y = sec.scrollTop;
  sec.innerHTML = '<nav class="gu-barra" aria-label="Pestañas de Guiones">' +
    [['guiones', 'Guiones'], ['competencia', 'Competencia']].map(([k, t]) => '<button type="button" data-gu-tab="' + k + '" aria-current="' + (GU.tab === k && !GU.abierto) + '">' + t + '</button>').join('') + '<span class="gu-beta"><i class="cnt-beta">Beta</i> En pruebas: puede cambiar</span></nav>' +
    '<div class="gu-cuerpo">' + (GU.abierto && GU.lista[GU.abierto] ? guEditor(GU.lista[GU.abierto]) : GU.tab === 'competencia' ? guVCompetencia() : guVGuiones()) + '</div>';
  sec.scrollTop = todo ? 0 : y;
}
function guVGuiones() {
  const todos = Object.values(GU.lista);
  const deTipo = todos.filter(g => !GU.tipo || (g.tipo || 'reel') === GU.tipo);
  const lista = deTipo.filter(g => GU.filtro === 'todos' || guEtapa(g) === GU.filtro)
    .sort((a, b) => GU_ETAPAS.findIndex(e => e[0] === guEtapa(a)) - GU_ETAPAS.findIndex(e => e[0] === guEtapa(b)) || String(b.upd || '').localeCompare(String(a.upd || '')));
  let h = '<div class="gu-acciones"><button class="btn pri" id="gu-nuevo">+ Nuevo guion</button>' +
    '<label class="ft-sel' + (GU.tipo ? ' activo' : '') + '"><select id="gu-tipo-f" aria-label="Tipo"><option value="">Reels y anuncios</option>' +
    Object.keys(GU_TIPOS).map(k => '<option value="' + k + '"' + (GU.tipo === k ? ' selected' : '') + '>' + (k === 'reel' ? 'Solo reels' : 'Solo anuncios') + '</option>').join('') + '</select></label></div>';
  h += '<div class="mz-vistas gu-filtros" role="tablist" aria-label="Filtrar por etapa">' +
    [['todos', 'Todos', deTipo.length]].concat(GU_ETAPAS.map(([k, t]) => [k, t, deTipo.filter(g => guEtapa(g) === k).length]))
      .map(([k, t, n]) => '<button class="mz-vista" data-gu-filtro="' + k + '" aria-pressed="' + (GU.filtro === k) + '">' + t + ' <span>' + n + '</span></button>').join('') + '</div>';
  if (!GU.listo && guDb()) return h + '<p class="cnt-cargando">Cargando…</p>';
  if (!todos.length) return h + '<div class="vacio"><b>Todavía no hay guiones</b>Crea uno con «+ Nuevo guion» o desde un anuncio de la pestaña Competencia.</div>';
  if (!lista.length) return h + '<p class="pr-vacio">Ninguno.</p>';
  return h + '<div class="gu-tabla" role="table"><div class="gu-fila gu-th" role="row"><span>Código</span><span>Guion</span><span>Tipo</span><span>Graba</span><span>Duración</span><span>Etapa</span></div>' +
    lista.map(g => '<button type="button" class="gu-fila" role="row" data-gu-abrir="' + esc(g.id) + '"><span class="pr-cod">' + guCod(g) + '</span>' +
      '<span class="gu-tit"><b>' + esc(g.titulo || '(sin título)') + '</b><small>' + esc((g.gancho || 'Sin gancho todavía').slice(0, 110)) + '</small></span>' +
      '<span>' + guTipo(g) + '</span><span>' + (g.graba === 'otra' ? 'Otra persona' : 'Yo') + '</span><span>' + guDur(g) + '</span><span>' + guPill(g) + '</span></button>').join('') + '</div>';
}
function guVCompetencia() {
  const lista = Object.values(GU.comp).sort((a, b) => String(b.creado || '').localeCompare(String(a.creado || '')));
  let h = '<div class="gu-acciones"><button class="btn pri" id="gu-anuncio">+ Añadir anuncio</button>' +
    '<span class="est-pista">Pega el enlace del anuncio y apunta por qué funciona. Desde cada uno puedes escribir un guion.</span></div>';
  if (!lista.length) return h + '<div class="vacio"><b>Todavía no hay anuncios</b>Añade los que veas de otros centros con «+ Añadir anuncio».</div>';
  const usos = id => Object.values(GU.lista).filter(g => g.inspira === id).length;
  return h + '<div class="gu-anuncios">' + lista.map(a => '<article class="gu-anuncio">' +
    '<header><b>' + esc(a.centro || 'Sin centro') + '</b><span class="gu-plat">' + esc(a.plataforma || '') + '</span></header>' +
    (a.gancho ? '<p class="gu-a-gancho">«' + esc(a.gancho) + '»</p>' : '') +
    (a.tema ? '<p class="gu-a-tema">' + esc(a.tema) + '</p>' : '') +
    (a.porque ? '<p class="gu-a-porque">💡 ' + esc(a.porque) + '</p>' : '') +
    '<footer>' + (a.enlace ? '<a class="linkbtn" href="' + esc(a.enlace) + '" target="_blank" rel="noopener">Ver anuncio ↗</a>' : '') +
      (usos(a.id) ? '<span class="gu-usos">' + usos(a.id) + (usos(a.id) === 1 ? ' guion' : ' guiones') + '</span>' : '') +
      '<span class="gu-esp"></span><button type="button" class="linkbtn" data-gu-editar-a="' + esc(a.id) + '">Editar</button>' +
      '<button type="button" class="btn mini pri" data-gu-desde="' + esc(a.id) + '">Escribir un guion</button></footer></article>').join('') + '</div>';
}
function guEditor(g) {
  const ahora = GU_ETAPAS.findIndex(e => e[0] === guEtapa(g));
  const pasos = '<ol class="eb-pasos" aria-label="Etapa del guion">' + GU_ETAPAS.map(([k, t], i) =>
    '<li><button type="button" data-gu-paso="' + k + '" class="' + (i < ahora ? 'hecho' : i === ahora ? 'actual' : '') + '"' + (i === ahora ? ' aria-current="step"' : '') + '>' + (i < ahora ? '✓ ' : '') + t + '</button></li>').join('') + '</ol>';
  const sig = GU_ETAPAS[ahora + 1];
  const comp = Object.values(GU.comp);
  return '<div class="gu-ecab"><button type="button" class="eb-icono" id="gu-volver" aria-label="Volver a Guiones" title="Volver a Guiones">←</button>' +
    '<div class="gu-etit"><input id="gu-titulo" value="' + esc(g.titulo || '') + '" placeholder="Título del guion" aria-label="Título"><div class="eb-meta"><span class="eb-cod">' + guCod(g) + '</span><span id="gu-guardado"></span></div></div>' +
    pasos + '<div class="gu-eder"><button type="button" class="eb-sec" id="gu-copiar">Copiar guion</button>' +
    (sig ? '<button type="button" class="eb-pri" data-gu-paso="' + sig[0] + '">' + (sig[0] === 'grabar' ? 'Listo para grabar ✓' : sig[0] === 'grabado' ? 'Ya está grabado' : 'Ya está publicado') + '</button>' : '') + '</div></div>' +
    '<div class="gu-ecuerpo"><div class="gu-texto">' +
      regFicha('g', g) + '<div class="gu-ficha">' +
        '<label>Tipo<select data-gu-meta="tipo">' + Object.keys(GU_TIPOS).map(k => '<option value="' + k + '"' + ((g.tipo || 'reel') === k ? ' selected' : '') + '>' + GU_TIPOS[k] + '</option>').join('') + '</select></label>' +
        '<label>Graba<select data-gu-meta="graba"><option value="yo"' + (g.graba !== 'otra' ? ' selected' : '') + '>Yo</option><option value="otra"' + (g.graba === 'otra' ? ' selected' : '') + '>Otra persona</option></select></label>' +
        '<label>Inspirado en<select data-gu-meta="inspira"><option value="">Ninguno</option>' + comp.map(a => '<option value="' + esc(a.id) + '"' + (g.inspira === a.id ? ' selected' : '') + '>' + esc((a.centro || 'Anuncio') + (a.gancho ? ' · ' + a.gancho.slice(0, 40) : '')) + '</option>').join('') + '</select></label>' +
        '<span class="gu-dur" id="gu-dur" title="Calculado por el número de palabras">' + guDur(g) + '</span>' +
      '</div>' +
      GU_CAMPOS.map(([k, t, p]) => '<label class="gu-campo gu-c-' + k + '"><span>' + t + '</span><textarea data-gu-campo="' + k + '" rows="' + (k === 'desarrollo' ? 9 : k === 'gancho' ? 2 : 3) + '" placeholder="' + esc(p) + '">' + esc(g[k] || '') + '</textarea></label>').join('') +
      (guEtapa(g) === 'publicado' || g.enlace ? '<label class="gu-campo"><span>Enlace del vídeo publicado</span><input data-gu-meta="enlace" type="url" value="' + esc(g.enlace || '') + '" placeholder="https://…"></label>' : '') +
      '<button type="button" class="linkbtn peligro" id="gu-borrar">Borrar este guion</button>' +
    '</div><aside class="gu-chat" aria-label="Chat con Claude"><h3>Claude</h3><div class="gu-chat-hilo" id="gu-hilo">' + guHilo(g) + '</div>' +
      (EST.sample ? '' : '<p class="est-pista">Para usar Claude abre la web en claude.ai.</p>') +
      '<div class="gu-chat-caja"><textarea id="gu-pide" rows="3" placeholder="' + (g.gancho || g.desarrollo ? 'Pídele un cambio: «gancho más corto», «hazlo para anuncio de 20 s»…' : 'Cuéntale de qué va el vídeo y lo escribe entero') + '"' + (GU.pidiendo ? ' disabled' : '') + '></textarea>' +
      '<button type="button" class="btn pri" id="gu-enviar"' + (GU.pidiendo || !EST.sample ? ' disabled' : '') + '>' + (GU.pidiendo ? 'Escribiendo…' : '↑') + '</button></div></aside></div>';
}
function guHilo(g) {
  const ch = g.chat || [];
  if (!ch.length) return '<p class="gu-chat-vacio">' + (g.gancho || g.desarrollo ? 'Pídele lo que quieras cambiar del guion.' : 'Escribe de qué va el vídeo (o pulsa enviar con el título puesto) y Claude escribe el guion entero.') + '</p>';
  return ch.slice(-12).map(m => '<p class="gu-msg ' + (m.de === 'yo' ? 'yo' : 'cl') + '">' + esc(m.txt) + '</p>').join('');
}
function guPintarMeta() {
  const g = GU.lista[GU.abierto]; if (!g) return;
  const d = document.getElementById('gu-dur'); if (d) d.textContent = guDur(g);
}

/* ---------- Claude ---------- */
function guPrompt(g, peticion) {
  const a = g.inspira && GU.comp[g.inspira];
  const L = ['Eres quien escribe los guiones de vídeo corto de Explora (FP online oficial de Ucademy). Responde SOLO con JSON válido.', ''];
  if (typeof VOZ !== 'undefined' && VOZ) { L.push(VOZ.trim()); L.push(''); }
  L.push('PALABRAS PROHIBIDAS: «profesor» (es guía), «lección/unidad» (expedición), «aula» (terreno), «matricúlate» (trazar mi ruta), «FCT» (formación en empresa).');
  L.push('');
  L.push('REGLAS DEL GUION');
  L.push('- Texto corrido, tal cual se dice a cámara, de tú, frases cortas. Sin tabla de escenas ni acotaciones técnicas.');
  L.push(g.tipo === 'anuncio' ? '- Es un ANUNCIO pagado: 15-30 segundos (40-75 palabras en total). Gancho que nombra el problema del lead en la primera frase; desarrollo con UNA idea; CTA clara a una sola acción.'
    : '- Es un REEL/TikTok orgánico: 30-60 segundos (75-150 palabras en total). Gancho que para el scroll (curiosidad, identificación o una verdad incómoda); desarrollo con ritmo; CTA a una sola acción (comentar, guardar, seguir o escribir por DM).');
  L.push('- "gancho": lo de los 3 primeros segundos, máximo 15 palabras.');
  L.push('- "pantalla": 2 a 4 rótulos cortos (máximo 6 palabras cada uno), uno por línea. Puede ir vacío.');
  L.push('- NO inventes cifras, sueldos, plazos ni porcentajes. Si hace falta un dato y no lo tienes, escribe [DATO] para que Sandra lo ponga.');
  if (a) { L.push(''); L.push('SE INSPIRA EN ESTE ANUNCIO DE LA COMPETENCIA (' + (a.centro || '') + ', ' + (a.plataforma || '') + '). Coge la estructura, no copies frases:');
    L.push('Gancho: ' + (a.gancho || '—')); if (a.tema) L.push('Tema: ' + a.tema); if (a.porque) L.push('Por qué funciona: ' + a.porque); }
  L.push(''); L.push('GUION ACTUAL:');
  L.push(JSON.stringify({titulo: g.titulo || '', gancho: g.gancho || '', desarrollo: g.desarrollo || '', cta: g.cta || '', pantalla: g.pantalla || ''}));
  L.push(''); L.push('PETICIÓN DE SANDRA: ' + (peticion || 'Escribe el guion completo a partir del título.'));
  L.push(''); L.push('Devuelve: {"respuesta": "una o dos frases diciendo qué has hecho", "guion": {"titulo": "...", "gancho": "...", "desarrollo": "...", "cta": "...", "pantalla": "..."}}. Devuelve el guion COMPLETO; lo que no cambies, cópialo igual.');
  return L.join('\n');
}
async function guPedir() {
  const g = GU.lista[GU.abierto], t = document.getElementById('gu-pide'); if (!g || !t || GU.pidiendo) return;
  const peticion = t.value.trim();
  if (!peticion && !g.titulo) { toast('Pon un título o cuéntale de qué va el vídeo'); t.focus(); return; }
  if (!EST.sample) { toast('Para usar Claude abre la web en claude.ai'); return; }
  g.chat = (g.chat || []).concat([{de: 'yo', txt: peticion || 'Escribe el guion de «' + g.titulo + '»'}]);
  GU.pidiendo = true; guGuardar('guiones', g); guPintar(true);
  try {
    const r = await EST.sample.json(guPrompt(g, peticion), {modelTier: 'default'});
    const n = r && r.guion; if (!n || typeof n !== 'object') throw {message: 'respuesta vacía'};
    ['titulo', 'gancho', 'desarrollo', 'cta', 'pantalla'].forEach(k => { if (typeof n[k] === 'string') g[k] = n[k].trim(); });
    g.chat.push({de: 'claude', txt: String(r.respuesta || 'Hecho.')});
  } catch (e) {
    g.chat.push({de: 'claude', txt: e && e.code === 'rate_limited' ? 'Demasiadas peticiones a la vez. Prueba en un minuto.' : 'No ha salido bien (' + (e && (e.code || e.message) || 'error') + '). Prueba otra vez.'});
  }
  g.chat = g.chat.slice(-30);
  GU.pidiendo = false; guGuardar('guiones', g); guPintar(true);
}

/* ---------- etapas, copiar, anuncios ---------- */
function guIrA(g, k) {
  if (guEtapa(g) === k) return;
  if (k !== 'borrador' && !(g.gancho || g.desarrollo)) { toast('El guion está vacío: escríbelo antes de pasarlo'); return; }
  g.etapa = k; if (k === 'publicado' && !g.fecha) g.fecha = new Date().toISOString().slice(0, 10);
  guGuardar('guiones', g); guPintar(true);
  toast(k === 'grabar' ? '✓ Para grabar' + (g.graba === 'otra' ? '. Pulsa «Copiar guion» para pasárselo' : '') : 'Ahora está en «' + guNombreEt(k) + '»');
}
function guTextoPlano(g) {
  return [guCod(g) + ' · ' + (g.titulo || 'Guion') + ' (' + GU_TIPOS[g.tipo || 'reel'] + ', ' + guDur(g) + ')', '',
    'GANCHO', g.gancho || '—', '', 'DESARROLLO', g.desarrollo || '—', '', 'CTA', g.cta || '—']
    .concat(g.pantalla ? ['', 'TEXTO EN PANTALLA', g.pantalla] : []).join('\n');
}
function guAbrirAnuncio(id) {
  const a = (id && GU.comp[id]) || {};
  const campo = (k, t, tipo, ph) => '<label class="mz-cta">' + t + (tipo === 'area' ? '<textarea id="gu-a-' + k + '" rows="3" placeholder="' + ph + '">' + esc(a[k] || '') + '</textarea>'
    : '<input id="gu-a-' + k + '" type="' + (tipo || 'text') + '" placeholder="' + ph + '" value="' + esc(a[k] || '') + '">') + '</label>';
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja gu-modal" role="dialog" aria-modal="true" aria-label="Anuncio de la competencia"><header><k>Competencia</k><h2>' + (id ? 'Editar anuncio' : 'Añadir anuncio') + '</h2></header><div class="cuerpo">' +
    campo('centro', 'Centro', 'text', 'p. ej. Ilerna, Medac…') +
    '<label class="mz-cta">Dónde<select id="gu-a-plataforma">' + GU_PLATAFORMAS.map(p => '<option' + ((a.plataforma || 'Instagram') === p ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></label>' +
    campo('enlace', 'Enlace', 'url', 'https://…') + campo('gancho', 'Gancho (lo primero que dicen)', 'text', '') +
    campo('tema', 'Tema', 'text', 'p. ej. homologación, sueldo, edad…') + campo('porque', 'Por qué funciona', 'area', 'Lo que te llama la atención') + '</div>' +
    '<footer>' + (id ? '<button class="linkbtn peligro" data-gu-borrar-a="' + esc(id) + '">Borrar</button>' : '') + '<span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn pri" data-gu-anuncio-ok="' + esc(id || '') + '">Guardar</button></footer></div>';
  setTimeout(() => { const i = $('#gu-a-centro'); if (i) i.focus(); }, 30);
}
function guGuardarAnuncio(id) {
  const v = k => ($('#gu-a-' + k).value || '').trim();
  if (!v('centro') && !v('enlace') && !v('gancho')) { toast('Pon al menos el centro, el enlace o el gancho'); return; }
  const a = Object.assign(id && GU.comp[id] ? GU.comp[id] : {id: 'A' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), creado: new Date().toISOString()},
    {centro: v('centro'), plataforma: v('plataforma'), enlace: v('enlace'), gancho: v('gancho'), tema: v('tema'), porque: v('porque')});
  guGuardar('competencia', a); cerrarPanel(); guPintar(false); toast(id ? 'Anuncio guardado' : 'Anuncio añadido');
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target; if (!t.closest) return;
  const tab = t.closest('[data-gu-tab]'); if (tab) { GU.tab = tab.dataset.guTab; GU.abierto = null; try { localStorage.setItem('guiones.tab', GU.tab); } catch (x) {} guPintar(true); return; }
  const f = t.closest('[data-gu-filtro]'); if (f) { GU.filtro = f.dataset.guFiltro; guPintar(false); return; }
  if (t.closest('#gu-nuevo')) { const g = guNuevo({tipo: GU.tipo || 'reel'}); GU.abierto = g.id; guPintar(true); setTimeout(() => { const i = $('#gu-titulo'); if (i) i.focus(); }, 30); return; }
  const ab = t.closest('[data-gu-abrir]'); if (ab) { GU.abierto = ab.dataset.guAbrir; guPintar(true); return; }
  if (t.closest('#gu-volver')) { GU.abierto = null; guPintar(true); return; }
  const ps = t.closest('[data-gu-paso]'); if (ps) { const g = GU.lista[GU.abierto]; if (g) guIrA(g, ps.dataset.guPaso); return; }
  if (t.closest('#gu-enviar')) { guPedir(); return; }
  if (t.closest('#gu-copiar')) { const g = GU.lista[GU.abierto]; if (!g) return;
    navigator.clipboard.writeText(guTextoPlano(g)).then(() => toast('Guion copiado'), () => toast('No he podido copiarlo')); return; }
  if (t.closest('#gu-borrar')) { const g = GU.lista[GU.abierto]; if (!g) return;
    $('#onb').hidden = false;
    $('#onb').innerHTML = '<div class="onbcaja ft-aviso-borrar" role="alertdialog" aria-modal="true" aria-labelledby="gu-b-t"><div class="cuerpo"><h2 id="gu-b-t">¿Borrar «' + esc(g.titulo || guCod(g)) + '»?</h2><p>No se puede recuperar.</p></div>' +
      '<footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button><button class="btn ft-si" id="gu-borrar-ok">Sí, borrar</button></footer></div>'; return; }
  if (t.closest('#gu-borrar-ok')) { guBorrar('guiones', GU.abierto); GU.abierto = null; cerrarPanel(); guPintar(true); toast('Guion borrado'); return; }
  if (t.closest('#gu-anuncio')) { guAbrirAnuncio(null); return; }
  const ea = t.closest('[data-gu-editar-a]'); if (ea) { guAbrirAnuncio(ea.dataset.guEditarA); return; }
  const ao = t.closest('[data-gu-anuncio-ok]'); if (ao) { guGuardarAnuncio(ao.dataset.guAnuncioOk); return; }
  const ba = t.closest('[data-gu-borrar-a]'); if (ba) { guBorrar('competencia', ba.dataset.guBorrarA); cerrarPanel(); guPintar(false); toast('Anuncio borrado'); return; }
  const de = t.closest('[data-gu-desde]'); if (de) { const a = GU.comp[de.dataset.guDesde]; if (!a) return;
    const g = guNuevo({inspira: a.id, titulo: a.tema ? a.tema.charAt(0).toUpperCase() + a.tema.slice(1) : '', tipo: /Ads/.test(a.plataforma || '') ? 'anuncio' : 'reel'});
    GU.tab = 'guiones'; GU.abierto = g.id; guPintar(true); toast('Guion creado. Pídele a Claude que lo escriba'); return; }
});
document.addEventListener('input', e => {
  const t = e.target, g = GU.lista[GU.abierto]; if (!g || !t.closest || !t.closest('#cnt-guiones')) return;
  const k = t.dataset.guCampo || (t.id === 'gu-titulo' ? 'titulo' : t.dataset.guMeta === 'enlace' ? 'enlace' : '');
  if (!k) return;
  g[k] = t.value; guPintarMeta();
  const gd = document.getElementById('gu-guardado'); if (gd) gd.textContent = 'Guardando…';
  clearTimeout(GU.guarda[g.id]);
  GU.guarda[g.id] = setTimeout(() => { guGuardar('guiones', g); const x = document.getElementById('gu-guardado'); if (x) x.textContent = '✓ Guardado'; }, 600);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'gu-tipo-f') { GU.tipo = t.value; guPintar(false); return; }
  const m = t.dataset && t.dataset.guMeta, g = GU.lista[GU.abierto];
  if (m && m !== 'enlace' && g) { g[m] = t.value; guGuardar('guiones', g); guPintar(false); }
});
document.addEventListener('keydown', e => {
  if (e.target && e.target.id === 'gu-pide' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guPedir(); }
});
guConectar();
