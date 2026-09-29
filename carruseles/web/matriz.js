/* ===================== MATRIZ DE CONTENIDO =====================
   Sustituye la lista de Ideas por una matriz agrupada por tema, con el estado de cada idea
   (por hacer · en producción · hecha, con su carrusel enlazado) y aviso de ideas parecidas.
   Junta Hechos e Inventario en una sola vista. */

/* ---------- tema de cada idea ----------
   El banco trae «eje» solo en 86 ideas. Al resto se le deduce por palabras clave. */
const TEMA_REGLAS = [
  ['Oficial de verdad', /oficial|c[oó]digo de centro|estafa/],
  ['Convalidaciones', /convalid|homolog|acredit|exenci|te respetan|se repite|doble grado/],
  ['Dinero', /precio|pagar|pago|beca|coste|cuesta|€|euro|financ|gratis|barato|caro|ahorr/],
  ['Formación en empresa', /pr[aá]cticas|formaci[oó]n en empresa|fct\b|dual|empresa donde|la empresa (te|me)/],
  ['Acceso y requisitos', /acceso|requisit|prueba de|\beso\b|bachiller|sin t[ií]tulo|mayores de|edad|puedo entrar|nota de corte|plaza/],
  ['Calendario y trámites', /plazo|matr[ií]cula|septiembre|enero|calendario|fecha|solicit|inscrip|documentaci|tr[aá]mite|papeleo/],
  ['Salidas y mercado', /salida|trabaj|sueldo|empleo|contrat|mercado|curro|cobra|oposici|puesto|hospital|cl[ií]nica|farmacia|empresa|aut[oó]nomo|emprend/],
  ['Cómo es el online', /online|plataforma|examen|tutor|horario|estudiar|tiempo|a distancia|presencial|ritmo|conciliar|clases/],
  ['Elegir ciclo', /elegir|cu[aá]l|mapa|diferencia|\bvs\b| o (el|la) |me toca|qu[eé] ciclo|decidir|vocaci/],
  ['Titulación y después', /t[ií]tulo|universidad|carrera|despu[eé]s|grado superior|siguiente paso|seguir estudiando/],
  ['Contra el humo', /humo|mentira|mito|te venden|promesa/],
  ['Qué se aprende', /qu[eé] se (hace|aprende|da|ve|toca)|software|lenguaje|mates|matem|herramienta|asignatura|m[oó]dulo|no es '|es esto|por dentro|toca cada|portfolio|github|java|\bia\b|contabilidad|qu[eé] es la rama/],
  ['Para quién es', /pasados los|m[aá]s de \d+|mujeres|hombres|sin experiencia|miedo|con \d+ a[nñ]os|a mi edad|pacientes|sangre|certificado de delitos/]];
const TEMAS = TEMA_REGLAS.map(r => r[0]).concat(['Más dudas del ciclo']);
IDEAS.forEach(it => {
  if (it.eje) { it.tema = it.eje; return; }
  const t = (it.titular + ' ' + it.gancho + ' ' + it.dentro).toLowerCase();
  const r = TEMA_REGLAS.find(x => x[1].test(t));
  it.tema = r ? r[0] : 'Más dudas del ciclo';
});

/* ---------- parecidas ----------
   Palabras con contenido (sin las vacías), recortadas a su raíz, y cuántas comparten. */
const VACIAS = new Set(('a al ante bajo con contra de del desde durante en entre hacia hasta para por segun sin sobre tras ' +
  'el la los las un una unos unas lo le les se me te nos os mi tu su sus mis tus que qué quien cual como cuando donde ' +
  'y o u e ni pero si no ya muy mas más menos es son esta este esto eso esa ser estar hay tiene tienes tener puedo puede ' +
  'verdad real esto esta estas tiempo medio superior cuesta cuanto mira quien lo que dice pone papel ' +
  'puedes puedo pueden debes tienes saber sabes quieres hacer hace cada todo toda todos todas otro otra fp ciclo ciclos grado online tu tus te').split(/\s+/));
const raiz = w => w.length > 5 ? w.slice(0, 5) : w;
function huella(txt) {
  return new Set(norm(txt).replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !VACIAS.has(w)).map(raiz));
}
function parecido(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0; a.forEach(w => { if (b.has(w)) n++; });
  return n < 2 ? 0 : n / Math.min(a.size, b.size);   // hacen falta al menos dos palabras en común
}
IDEAS.forEach(it => { it._h = huella(it.titular + ' ' + it.gancho); });
const UMBRAL = 0.6;
const PAR_IDEAS = {};
IDEAS.forEach((a, i) => {
  for (let j = i + 1; j < IDEAS.length; j++) {
    const b = IDEAS[j], p = parecido(a._h, b._h);
    if (p >= UMBRAL && a._h.size > 1 && b._h.size > 1) {
      (PAR_IDEAS[a.id] = PAR_IDEAS[a.id] || []).push({id: b.id, p: p});
      (PAR_IDEAS[b.id] = PAR_IDEAS[b.id] || []).push({id: a.id, p: p});
    }
  }
});
/* todo lo ya hecho, venga de la herramienta, del inventario o de una idea marcada */
function todoHecho() {
  const out = [], vistas = new Set();
  Object.values(EST.lista).filter(c => c.estado === 'hecho').forEach(c => {
    out.push({clave: 'c:' + c.id, titulo: c.titulo || '', fecha: c.fecha || '', idea: c.idea || '', carrusel: c, url: ''});
    if (c.idea) vistas.add(c.idea);
  });
  inventario().forEach(x => {
    if (!x.propio && vistas.has(x.id)) return;
    out.push({clave: 'i:' + x.id, titulo: x.titular || '', fecha: x.fecha || '', idea: x.propio ? ((S.ops[x.id] || {}).idea || '') : x.id, url: x.url || '', propio: x.propio, id: x.id});
  });
  return out.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
}
/* lo hecho que se parece a una idea (sin contar su propio carrusel) */
function hechosParecidos(it) {
  return todoHecho().filter(h => h.idea !== it.id)
    .map(h => ({h: h, p: parecido(it._h, huella(h.titulo))})).filter(x => x.p >= UMBRAL).sort((a, b) => b.p - a.p).map(x => x.h);
}
function ideasParecidas(it) { return (PAR_IDEAS[it.id] || []).sort((a, b) => b.p - a.p).map(x => IMAP[x.id]).filter(Boolean); }

/* ---------- estado de cada idea ---------- */
function carruselDe(it) {
  const cs = Object.values(EST.lista).filter(c => c.idea === it.id);
  return cs.find(c => c.estado === 'hecho') || cs[0] || null;
}
function estadoIdea(it) {
  const c = carruselDe(it);
  if ((c && c.estado === 'hecho') || sit(it.id) === 'hecha' || propios().some(p => p.idea === it.id)) return 'hecha';
  if (c) return 'produccion';
  return 'porhacer';
}
const ESTADOS_IDEA = {porhacer: 'Por hacer', produccion: 'En producción', hecha: 'Hecha'};

/* ---------- filtros ---------- */
S.f.tema = S.f.tema || ''; S.f.estado = S.f.estado || '';
const SELEC = new Set();
S.agrupar = true; S.abiertos = S.abiertos || {};
function pasaMatriz(it, salvo) {
  const f = S.f, tokens = trozosBusqueda();
  if (tokens.length && !tokens.every(t => (it.buscar + ' ' + norm(it.tema)).indexOf(t) >= 0)) return false;
  if (salvo !== 'rama' && f.rama) {
    if (S.t.solo) { if (it.ramaColor !== f.rama) return false; }
    else if (!(it.ramaColor === f.rama || it.alcTipo === 'transversal')) return false;
  }
  if (salvo !== 'form' && f.form) {
    if (S.t.solo) { if (afinidad(it, f.form) !== 1) return false; }
    else if (!sirveAl(it, f.form)) return false;
  }
  if (salvo !== 'cif' && f.cif && cifraDe(it) !== f.cif) return false;
  if (salvo !== 'tema' && f.tema && it.tema !== f.tema) return false;
  if (salvo !== 'estado' && f.estado && estadoIdea(it) !== f.estado) return false;
  return true;
}
function cuentaMatriz(dim, valor, fn) { return IDEAS.filter(it => pasaMatriz(it, dim) && fn(it) === valor).length; }
function selMatriz(dim, etiqueta, todas, opciones, fn) {
  const sel = S.f[dim] || '';
  return '<label class="filtro"><span>' + esc(etiqueta) + '</span><select data-dim="' + dim + '">' +
    '<option value=""' + (sel ? '' : ' selected') + '>' + esc(todas) + '</option>' +
    opciones.map(o => { const n = cuentaMatriz(dim, o[0], fn);
      return '<option value="' + esc(o[0]) + '"' + (sel === o[0] ? ' selected' : '') + (n ? '' : ' disabled') + '>' + esc(o[1]) + ' (' + n + ')</option>'; }).join('') +
    '</select></label>';
}
function barraMatriz() {
  const RAMASF = ['Transversal', 'Sanidad', 'Tecnología', 'Comercio', 'Administración', 'Servicios Socioculturales'];
  const CICLOS = Array.from(new Set(IDEAS.filter(i => i.alcTipo === 'formacion' && (!S.f.rama || i.ramaColor === S.f.rama)).map(i => i.alcTxt)))
    .sort((a, b) => a.localeCompare(b, 'es'));
  const activos = ['rama', 'form', 'cif', 'tema', 'estado'].some(k => S.f[k]);
  return '<div class="barra mz-barra">' +
    selMatriz('estado', 'Estado', 'Todas', Object.keys(ESTADOS_IDEA).map(k => [k, ESTADOS_IDEA[k]]), estadoIdea) +
    selMatriz('tema', 'Tema', 'Todos los temas', TEMAS.map(t => [t, t]), it => it.tema) +
    selMatriz('rama', 'Alcance: rama', 'Todas', RAMASF.map(r => [r, r === 'Servicios Socioculturales' ? 'Sociocultural' : r]), it => it.ramaColor) +
    selMatriz('form', S.f.rama ? 'Alcance: ciclo de ' + (S.f.rama === 'Servicios Socioculturales' ? 'Sociocultural' : S.f.rama) : 'Alcance: ciclo', 'Todos', CICLOS.map(c => [c, c]), it => it.alcTxt) +
    selMatriz('cif', 'Cifras', 'Cualquiera', ['sin', 'listo', 'repasar', 'comprobar', 'nopublicar'].map(k => [k, CIF[k]]), cifraDe) +
    (activos ? '<button class="linkbtn quitar" id="mz-limpiar">Quitar filtros</button>' : '') +
    '</div>';
}

/* ---------- vista ---------- */
function celdaEstado(it) {
  const e = estadoIdea(it), c = carruselDe(it);
  if (e === 'hecha') {
    if (c && c.slides && c.slides.length) return '<button class="mz-hecho" data-abrir="' + it.id + '" title="Ver el carrusel">' +
      '<span class="mz-mini">' + mini(c, 0) + '</span><span>Hecho<small>' + esc(c.fecha ? fCorta(c.fecha) : 'ver') + '</small></span></button>';
    const o = op(it.id);
    return o.url ? '<a class="mz-hecho" href="' + esc(o.url) + '" target="_blank" rel="noopener"><span class="mz-drive">Drive</span><span>Hecho<small>' + esc(fCorta(o.fecha) || 'abrir') + '</small></span></a>'
      : '<span class="chip e-hecho">Hecho</span>';
  }
  if (e === 'produccion') return c.slides && c.slides.length
    ? '<button class="mz-hecho mz-enprod" data-abrir="' + it.id + '"><span class="mz-mini">' + mini(c, 0) + '</span><span>Para revisar<small>en Producir</small></span></button>'
    : '<button class="mz-enprod-txt" data-ir="producir">' + (c.estado === 'generando' ? 'Generando…' : 'En Producir') + '</button>';
  return '';
}
function chipParecidas(it) {
  const hp = hechosParecidos(it), ip = ideasParecidas(it);
  if (!hp.length && !ip.length) return '';
  return '<button class="chip ' + (hp.length ? 'mz-ojo' : 'mz-par') + '" data-abrir="' + it.id + '" title="' +
    esc((hp.length ? 'Ya hecho y parecido: ' + hp.map(h => h.titulo).join(' · ') : 'Ideas parecidas: ' + ip.map(x => x.titular).join(' · '))) + '">' +
    (hp.length ? '⚠ Parecido a ' + hp.length + ' hecho' + (hp.length > 1 ? 's' : '') : '≈ ' + ip.length + ' parecida' + (ip.length > 1 ? 's' : '')) + '</button>';
}
function filaMatriz(it) {
  const e = estadoIdea(it), sel = SELEC.has(it.id), hp = hechosParecidos(it);
  const puede = e === 'porhacer';
  return '<tr class="mz-' + e + (sel ? ' mz-sel' : '') + (S.sel === it.id ? ' sel' : '') + '">' +
    '<td class="c-chk">' + (puede ? '<input type="checkbox" class="mz-chk" data-selec="' + it.id + '"' + (sel ? ' checked' : '') + ' aria-label="Seleccionar">' : '') + '</td>' +
    '<td class="c-alc">' + chipAlcance(it, true) + '</td>' +
    '<td class="c-idea"><button class="celda" data-abrir="' + it.id + '">' + marca(it.titular, TOKENS) + '</button>' +
      '<div class="mz-gancho">' + marca(it.gancho, TOKENS) + '</div>' +
      (hp.length && puede ? '<button class="mz-aviso-par" data-abrir="' + it.id + '">⚠ Ya hay uno parecido hecho</button>' : '') + '</td>' +
    '<td class="c-est">' + celdaEstado(it) + '</td></tr>';
}
// Los temas empiezan cerrados; se abren solos al buscar o filtrar por tema.
function temaAbierto(t) {
  if (t in S.abiertos) return S.abiertos[t];
  return !!(S.q && S.q.trim()) || !!S.f.tema;
}
let MZ_CLAVE = '';
function vMatriz() {
  // al cambiar la búsqueda o el tema, se olvida qué temas se habían abierto o cerrado a mano
  const clave = (S.q || '') + '|' + (S.f.tema || '');
  if (clave !== MZ_CLAVE) { MZ_CLAVE = clave; S.abiertos = {}; }
  TOKENS = trozosBusqueda();
  const filas = IDEAS.filter(it => pasaMatriz(it)).sort(ordenar);
  const n = {porhacer: 0, produccion: 0, hecha: 0}; IDEAS.forEach(it => n[estadoIdea(it)]++);
  let h = '<div class="mz-cab"><div><h2>Matriz de contenido</h2>' +
    '<p>' + IDEAS.length + ' ideas · <b>' + n.hecha + '</b> hechas · <b>' + n.produccion + '</b> en producción · <b>' + n.porhacer + '</b> por hacer</p></div>' +
    '<div class="mz-progreso"><i style="width:' + (100 * n.hecha / IDEAS.length).toFixed(1) + '%"></i><i class="p" style="width:' + (100 * n.produccion / IDEAS.length).toFixed(1) + '%"></i></div></div>';
  h += '<div class="mz-selbar' + (SELEC.size ? ' on' : '') + '" id="mz-selbar">' + barraSeleccion() + '</div>';
  h += '<div class="buscador"><input type="search" id="buscar" value="' + esc(S.q) + '" placeholder="Busca por palabra: plaza, convalidar, prácticas, sueldo…" aria-label="Buscar en la matriz"></div>';
  const nAct = ['rama', 'form', 'cif', 'tema', 'estado'].filter(k => S.f[k]).length;
  h += '<button class="btn mz-verfiltros" id="mz-verfiltros" aria-expanded="' + !!S.verFiltros + '">Filtros' + (nAct ? ' · ' + nAct + ' activos' : '') + '</button>';
  h += '<div class="mz-filtros' + (S.verFiltros ? ' on' : '') + '">' + barraMatriz() + '</div>';
  const foco = S.f.form || (S.f.rama && S.f.rama !== 'Transversal' ? S.f.rama : '');
  h += '<p class="cuenta">' + filas.length + (filas.length === 1 ? ' idea' : ' ideas') +
    (foco ? (S.t.solo ? ' solo de ' + esc(foco) + ' · <button class="linkbtn" data-solo="0">ver también las transversales que le sirven</button>'
                      : ' que sirven para ' + esc(foco) + ' · <button class="linkbtn" data-solo="1">ver solo las de ' + esc(foco) + '</button>') : '') +
    ' · <button class="linkbtn" id="mz-agrupar">' + (S.agrupar ? 'Ver en una sola lista' : 'Agrupar por tema') + '</button>' +
    (S.agrupar ? ' · <button class="linkbtn" id="mz-abrirtodos">' + (TEMAS.every(temaAbierto) ? 'Cerrar todos los temas' : 'Abrir todos') + '</button>' : '') + '</p>';
  if (!filas.length) return h + '<div class="vacio"><b>Nada con esos filtros</b>Prueba a quitar alguno, o cambia el estado a «Todas».</div>';
  const tabla = rows => '<div class="tablawrap"><table class="matriz mz-tabla"><thead><tr>' +
    '<th class="c-chk"></th><th class="c-alc">Alcance</th><th class="c-idea">Idea</th><th class="c-est">Carrusel</th></tr></thead><tbody>' +
    rows.map(filaMatriz).join('') + '</tbody></table></div>';
  if (!S.agrupar) return h + tabla(filas);
  const grupos = {}; filas.forEach(it => (grupos[it.tema] = grupos[it.tema] || []).push(it));
  return h + TEMAS.filter(t => grupos[t]).map(t => {
    // el progreso cuenta lo que entra en los filtros de alcance, sea cual sea su estado
    const rows = grupos[t], todas = IDEAS.filter(i => i.tema === t && pasaMatriz(i, 'estado')), hechas_ = todas.filter(i => estadoIdea(i) === 'hecha').length;
    const porHacer = rows.filter(i => estadoIdea(i) === 'porhacer').length, enProd = rows.filter(i => estadoIdea(i) === 'produccion').length;
    const abierto = temaAbierto(t), pct = todas.length ? 100 * hechas_ / todas.length : 0;
    const nSel = rows.filter(i => SELEC.has(i.id)).length;
    return '<section class="mz-grupo' + (abierto ? ' abierto' : '') + '"><header>' +
      '<button class="mz-plegar" data-tema-plegar="' + esc(t) + '" aria-expanded="' + abierto + '">' +
      '<span class="mz-flecha" aria-hidden="true">' + (abierto ? '▾' : '▸') + '</span>' +
      '<span class="mz-tema-txt"><h3>' + esc(t) + '</h3><small>' + rows.length + (rows.length === 1 ? ' idea' : ' ideas') +
        (porHacer ? ' · ' + porHacer + ' por hacer' : '') + (enProd ? ' · <b class="p">' + enProd + ' en producción</b>' : '') +
        (nSel ? ' · <b class="s">' + nSel + ' seleccionadas</b>' : '') + '</small></span>' +
      '<span class="mz-tema-prog"><span class="mz-mini-prog"><i style="width:' + pct.toFixed(0) + '%"></i></span>' +
        '<span class="mz-hechas">' + hechas_ + '/' + todas.length + ' hechas</span></span></button>' +
      (abierto && porHacer ? '<label class="mz-todas"><input type="checkbox" data-selec-tema="' + esc(t) + '"' +
        (rows.filter(i => estadoIdea(i) === 'porhacer').every(i => SELEC.has(i.id)) ? ' checked' : '') + '> Seleccionar las ' + porHacer + '</label>' : '') +
      '</header>' + (abierto ? tabla(rows) : '') + '</section>';
  }).join('');
}

function barraSeleccion() {
  if (!SELEC.size) return '';
  return '<b>' + SELEC.size + (SELEC.size === 1 ? ' idea seleccionada' : ' ideas seleccionadas') + '</b>' +
    '<button class="btn pri" id="mz-producir">Producir (' + SELEC.size + ')</button>' +
    '<button class="linkbtn" id="mz-deseleccionar">Quitar selección</button>';
}
function pintarSeleccion() {
  const bar = document.getElementById('mz-selbar');
  if (bar) { bar.innerHTML = barraSeleccion(); bar.classList.toggle('on', SELEC.size > 0); }
  document.querySelectorAll('[data-selec]').forEach(ch => { ch.checked = SELEC.has(ch.dataset.selec); ch.closest('tr').classList.toggle('mz-sel', ch.checked); });
}

/* ---------- producir: elegir plantilla viéndola y avisar de lo ya hecho ---------- */
function abrirProducir(ids) {
  ids = ids.filter(id => IMAP[id] && estadoIdea(IMAP[id]) === 'porhacer');
  if (!ids.length) { toast('Esas ideas ya están en Producir o hechas'); return; }
  EST_PROD = {ids: ids};
  pintarProducir();
}
let EST_PROD = null;
function pintarProducir() {
  const ids = EST_PROD.ids, primera = IMAP[ids[0]];
  const conPar = ids.map(id => ({it: IMAP[id], hp: hechosParecidos(IMAP[id])})).filter(x => x.hp.length);
  let h = '<div class="onbcaja mz-prod" role="dialog" aria-modal="true" aria-label="Producir">' +
    '<header><k>Producir</k><h2>' + (ids.length === 1 ? esc(primera.titular) : ids.length + ' carruseles') + '</h2></header><div class="cuerpo">';
  if (conPar.length) {
    h += '<div class="mz-yahecho"><b>Antes de producir: ya tienes algo parecido hecho</b>' +
      '<p>Si te sirve, reutilízalo y quita la idea de este lote. Si no, Claude buscará otro enfoque.</p>' +
      conPar.map(x => '<div class="mz-parfila"><div class="mz-parinfo"><small>Tu idea</small><b>' + esc(x.it.titular) + '</b></div>' +
        '<span class="mz-flechita">≈</span>' +
        x.hp.slice(0, 2).map(hh => '<div class="mz-parhecho">' + (hh.carrusel ? '<span class="mz-mini">' + mini(hh.carrusel, 0) + '</span>' : '') +
          '<span><small>Ya hecho' + (hh.fecha ? ' · ' + esc(fCorta(hh.fecha)) : '') + '</small>' + esc(hh.titulo) + '</span></div>').join('') +
        '<button class="btn mini" data-usar-hecho="' + x.it.id + '" data-clave="' + esc(x.hp[0].clave) + '">Usar el hecho</button></div>').join('') + '</div>';
  }
  h += '<h4 class="mz-sub">Plantilla</h4><div class="mz-plantillas">' + EST_PLANTILLAS.map(p => {
      const v = previa('prod-' + p.id, p.id, EST.color, primera.titular, primera.tema);
      return '<button class="mz-plantilla" data-prod-pl="' + p.id + '" aria-pressed="' + (EST.plantilla === p.id) + '">' + mini(v, 0) +
        '<b>' + esc(p.nombre) + '</b><small>' + esc(p.pista) + '</small></button>'; }).join('') + '</div>';
  h += '<h4 class="mz-sub">Color</h4><div class="est-opciones">' + EST_COLORES.map(c => '<button class="est-op" data-prod-co="' + c.id + '" aria-pressed="' + (EST.color === c.id) + '">' +
      '<i style="background:' + c.hex + '"></i>' + esc(c.nombre) + '</button>').join('') + '</div>';
  h += '<p class="est-pista">Luego puedes cambiar plantilla y color de cada carrusel por separado.</p>';
  h += '</div><footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button>' +
    '<button class="btn pri" id="mz-prod-ok">' + (ids.length === 1 ? 'Producir' : 'Producir los ' + ids.length) + (EST.sample ? ' y generar' : '') + '</button></footer></div>';
  $('#onb').hidden = false; $('#onb').innerHTML = h; pintarMinis($('#onb'));
}
function confirmarProducir() {
  const ids = EST_PROD.ids; EST_PROD = null;
  const n = mandarAProducir(ids);
  ids.forEach(id => SELEC.delete(id));
  cerrarPanel(); S.sel = null; $('#velo').classList.remove('on'); $('#drawer').classList.remove('on');
  S.v = 'producir'; render();
  toast(n === 1 ? 'En Producir' : n + ' en Producir');
  if (EST.sample) generarTodas();
}

/* ---------- HECHOS: todo lo publicado en un sitio ---------- */
function vTodoHecho() {
  const q = norm(S.q).trim();
  let lista = todoHecho();
  if (q) lista = lista.filter(x => norm(x.titulo).indexOf(q) >= 0);
  let h = '<div class="vhead"><h2>Hechos</h2><p>Todo lo publicado en un sitio: lo que haces con la herramienta y lo que enlazas de Drive. Cada uno queda unido a su idea de la matriz.</p></div>';
  h += '<div class="est-acciones"><button class="btn pri" id="nuevoCarrusel">+ Añadir uno ya publicado</button>' +
    (Object.values(EST.lista).some(c => c.estado === 'hecho') ? '<button class="btn" data-lote="hechos">Descargar los hechos con la herramienta</button>' : '') +
    '<input type="search" id="buscar" class="invbusca" value="' + esc(S.q) + '" placeholder="Buscar…" aria-label="Buscar en hechos">' +
    '<span class="est-progreso">' + esc(EST.progreso || '') + '</span></div>';
  if (!lista.length) return h + '<div class="vacio"><b>' + (q ? 'Nada con esa búsqueda' : 'Todavía no hay nada') + '</b>' +
    (q ? 'Prueba con otra palabra.' : 'Marca hecho un carrusel en Producir, o añade uno que ya tengas publicado.') + '</div>';
  return h + '<div class="est-rejilla">' + lista.map(x => {
    const c = x.carrusel, it = x.idea ? IMAP[x.idea] : null;
    return '<article class="est-tarjeta">' + (c ? mini(c, 0) : '<div class="est-mini"><span class="est-vacia">' + (x.url ? 'En Drive' : 'Añadido a mano') + '</span></div>') +
      '<div class="est-tcuerpo"><h4>' + esc(x.titulo || '(sin título)') + '</h4>' +
      '<div class="est-tmeta">' + (it ? chipAlcance(it) + '<span>' + esc(it.tema) + '</span>' : '<span class="chip temp">sin idea</span>') +
        (x.fecha ? '<span>' + esc(fCorta(x.fecha)) + '</span>' : '') + '</div>' +
      '<div class="est-tpie">' +
        (c ? '<button class="btn pri" data-est-abrir="' + c.id + '">Abrir</button><button class="btn" data-est-descargar="' + c.id + '">Descargar</button>' : '') +
        (x.url ? '<a class="btn' + (c ? '' : ' pri') + '" href="' + esc(x.url) + '" target="_blank" rel="noopener">Drive</a>' : '') +
        (x.propio ? '<button class="btn" data-editar="' + x.id + '">Editar</button>' : '') +
        (it ? '<button class="btn" data-abrir="' + it.id + '">Ver idea</button>'
            : '<button class="btn" data-enlazar="' + esc(x.clave) + '">Unir a una idea</button>') +
      '</div></div></article>';
  }).join('') + '</div>';
}

/* ---------- unir un hecho a su idea ---------- */
function abrirEnlazar(clave, q) {
  const x = todoHecho().find(h => h.clave === clave); if (!x) return;
  const hx = huella(x.titulo);
  const sug = IDEAS.map(it => ({it: it, p: parecido(hx, it._h) + (hx.size ? 0 : 0)}))
    .filter(o => o.p > 0).sort((a, b) => b.p - a.p).slice(0, 5).map(o => o.it);
  const toks = norm(q || '').split(/\s+/).filter(t => t.length > 1);
  const busca = toks.length ? IDEAS.filter(it => toks.every(t => it.buscar.indexOf(t) >= 0)).slice(0, 12) : [];
  const item = it => '<li><button class="mz-elegir" data-enlazar-a="' + it.id + '" data-clave="' + esc(clave) + '">' +
    '<b>' + esc(it.titular) + '</b><small>' + esc(it.tema) + ' · ' + esc(it.alcTxt) + ' · ' + esc(ESTADOS_IDEA[estadoIdea(it)]) + '</small></button></li>';
  $('#onb').hidden = false;
  $('#onb').innerHTML = '<div class="onbcaja" role="dialog" aria-modal="true" aria-label="Unir a una idea">' +
    '<header><k>Unir a una idea de la matriz</k><h2>' + esc(x.titulo) + '</h2></header><div class="cuerpo">' +
    '<input type="search" id="mz-busca-idea" class="invbusca" style="width:100%" placeholder="Busca la idea por palabra…" value="' + esc(q || '') + '">' +
    (busca.length ? '<h4 class="mz-sub">Resultados</h4><ul class="mz-elegir-lista">' + busca.map(item).join('') + '</ul>'
      : toks.length ? '<p class="est-pista">Nada con esa búsqueda.</p>' : '') +
    (sug.length ? '<h4 class="mz-sub">Las que más se le parecen</h4><ul class="mz-elegir-lista">' + sug.map(item).join('') + '</ul>' : '') +
    '</div><footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button></footer></div>';
  const i = $('#mz-busca-idea'); if (i) { i.dataset.clave = clave; i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function enlazar(clave, ideaId) {
  const x = todoHecho().find(h => h.clave === clave); if (!x) return;
  if (x.carrusel) { x.carrusel.idea = ideaId; guardarC(x.carrusel); }
  else if (x.propio) { S.ops[x.id] = Object.assign({}, S.ops[x.id], {idea: ideaId, upd: new Date().toISOString()});
    if (DB) DB.doc('ops/' + x.id).set(S.ops[x.id]).catch(() => {}); else { try { localStorage.setItem('explora.ops', JSON.stringify(S.ops)); } catch (e) {} } }
  cerrarPanel(); toast('Unido a «' + IMAP[ideaId].titular + '»'); render();
}

/* ---------- ficha: solo a qué formación va y las slides en fila ---------- */
function nivelIdea(it) {
  const niv = it.nivel ? ' · ' + (NIVEL[it.nivel] || it.nivel) : '';
  if (it.alcTipo === 'formacion') return 'Rama ' + it.ramaColor + ' / ' + it.alcTxt + niv;
  if (it.alcTipo === 'rama') return 'Rama ' + it.alcTxt + niv;
  if (it.alcTipo === 'transversal') return 'Transversal · para todas las ramas';
  return it.alcTxt + niv;
}
pintarFicha = function () {
  const it = IMAP[S.sel]; if (!it) return;
  const e = estadoIdea(it), c = carruselDe(it), o = op(it.id);
  $('#drawer').classList.add('mz-ancha');
  $('#dhead').innerHTML = '<div class="drow"><span class="mz-nivel">' + esc(nivelIdea(it)) + '</span>' +
    '<button class="dclose" id="cerrarFicha" aria-label="Cerrar">✕</button></div><h2>' + esc(it.titular) + '</h2>';
  let b = '';
  if (c && c.slides && c.slides.length)
    b += '<div class="mz-tira">' + c.slides.map((_, i) => '<div class="mz-tira-s"><span>' + (i + 1) + '</span>' + mini(c, i) + '</div>').join('') + '</div>';
  else if (c) b += '<p class="mz-sincarr">En Producir, todavía sin generar.</p>';
  else if (o.url) b += '<p class="mz-sincarr">Hecho fuera de la herramienta · <a href="' + esc(o.url) + '" target="_blank" rel="noopener">ver en Drive</a></p>';
  else {
    b += '<p class="mz-sincarr">Sin carrusel todavía.</p>';
    const hp = hechosParecidos(it);
    if (hp.length) b += '<div class="mz-yahecho"><b>Ya tienes uno parecido hecho</b>' +
      hp.slice(0, 2).map(hh => '<div class="mz-parhecho">' + (hh.carrusel ? '<span class="mz-mini">' + mini(hh.carrusel, 0) + '</span>' : '') +
        '<span>' + (hh.carrusel ? '<button class="linkbtn" data-est-abrir="' + hh.carrusel.id + '">' + esc(hh.titulo) + '</button>' : esc(hh.titulo)) + '</span></div>').join('') + '</div>';
  }
  $('#dbody').innerHTML = b;
  $('#dfoot').innerHTML = c ? (c.slides && c.slides.length ? '<button class="btn pri" data-est-abrir="' + c.id + '">Abrir carrusel</button>' : '<button class="btn pri" data-ir="producir">Ir a Producir</button>')
    : e === 'porhacer' ? '<button class="btn pri" data-producir="' + it.id + '">Producir</button>' : '';
  pintarMinis($('#dbody'));
};
/* al generar, Claude sabe qué hay parecido ya hecho para no repetirlo */
PARECIDOS_PARA_PROMPT = function (c) {
  const it = c.idea ? IMAP[c.idea] : null;
  const hp = it ? hechosParecidos(it) : todoHecho().filter(h => parecido(huella(c.tema || c.titulo || ''), huella(h.titulo)) >= UMBRAL);
  return hp.slice(0, 5).map(h => h.titulo);
};

/* ---------- enganches ---------- */
const _mandarMz = mandarAProducir;
mandarAProducir = function (ids) {
  const n = _mandarMz(ids);
  if (ids.length === 1) { const it = IMAP[ids[0]], hp = it ? hechosParecidos(it) : [];
    if (n && hp.length) setTimeout(() => toast('Ojo: se parece a «' + hp[0].titulo + '», ya hecho. Claude buscará otro ángulo'), 2700); }
  return n;
};
const _renderMz = render;
render = function () {
  if (S.v === 'inventario') S.v = 'hechos';
  if (S.v === 'ideas') { $('#canvas').innerHTML = vMatriz(); pintarMinis($('#canvas')); if (S.sel) pintarFicha(); marcarPestana(); return; }
  if (S.v === 'hechos') { $('#canvas').innerHTML = vTodoHecho(); pintarMinis($('#canvas')); marcarPestana(); return; }
  _renderMz(); marcarPestana();
};
function marcarPestana() { document.querySelectorAll('#vistas button').forEach(x => x.setAttribute('aria-current', String(x.dataset.v === S.v))); }
const _refrescarEstudioMz = refrescarEstudio;
refrescarEstudio = function () {
  if (S.v === 'hechos' || S.v === 'ideas') { if (!EST.abierto) render(); else pintarEditor(); return; }
  _refrescarEstudioMz();
};
document.addEventListener('click', e => {
  const t = e.target;
  const pl = t.closest('[data-tema-plegar]');
  if (pl) { const k = pl.dataset.temaPlegar; S.abiertos[k] = !temaAbierto(k); render(); return; }
  if (t.id === 'mz-abrirtodos') { const v = !TEMAS.every(temaAbierto); TEMAS.forEach(k => S.abiertos[k] = v); render(); return; }
  const en = t.closest('[data-enlazar]'); if (en) { e.stopImmediatePropagation(); abrirEnlazar(en.dataset.enlazar); return; }
  const ea = t.closest('[data-enlazar-a]'); if (ea) { e.stopImmediatePropagation(); enlazar(ea.dataset.clave, ea.dataset.enlazarA); return; }
  const pd = t.closest('[data-producir]');
  if (pd && !t.closest('#onb')) { e.stopImmediatePropagation(); abrirProducir([pd.dataset.producir]); return; }
  if (t.id === 'mz-producir') { abrirProducir([...SELEC]); return; }
  if (t.id === 'mz-deseleccionar') { SELEC.clear(); pintarSeleccion(); document.querySelectorAll('[data-selec-tema]').forEach(x => x.checked = false); return; }
  const ppl = t.closest('[data-prod-pl]'); if (ppl) { EST.plantilla = ppl.dataset.prodPl; guardarEstilo(); pintarProducir(); return; }
  const pco = t.closest('[data-prod-co]'); if (pco) { EST.color = pco.dataset.prodCo; guardarEstilo(); pintarProducir(); return; }
  if (t.id === 'mz-prod-ok') { e.stopImmediatePropagation(); confirmarProducir(); return; }
  const uh = t.closest('[data-usar-hecho]');
  if (uh) { const it = uh.dataset.usarHecho; enlazarSinCerrar(uh.dataset.clave, it); EST_PROD.ids = EST_PROD.ids.filter(x => x !== it); SELEC.delete(it);
    toast('Hecho: esa idea queda cubierta por el carrusel que ya tenías');
    if (!EST_PROD.ids.length) { EST_PROD = null; cerrarPanel(); render(); } else pintarProducir(); return; }
  if (t.id === 'mz-verfiltros') { S.verFiltros = !S.verFiltros; render(); return; }
  if (t.id === 'mz-agrupar') { S.agrupar = !S.agrupar; render(); return; }
  if (t.id === 'mz-limpiar') { e.stopImmediatePropagation(); S.f = {rama: '', form: '', cif: '', tema: '', estado: ''}; S.t.solo = false; S.q = ''; render(); return; }
}, true);
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && (t.dataset.dim === 'tema' || t.dataset.dim === 'estado')) { e.stopImmediatePropagation(); S.f[t.dataset.dim] = t.value; render(); }
}, true);

/* usar un hecho parecido para otra idea: se marca la idea como hecha y enlazada a ese carrusel */
function enlazarSinCerrar(clave, ideaId) {
  const x = todoHecho().find(h => h.clave === clave); if (!x) return;
  guardar(ideaId, {hecho: true, fecha: x.fecha || fISO(hoy()), url: x.url || '', notas: 'Cubierta por «' + x.titulo + '»'});
}
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.selec) { if (t.checked) SELEC.add(t.dataset.selec); else SELEC.delete(t.dataset.selec); pintarSeleccion(); return; }
  if (t.dataset && t.dataset.selecTema) {
    IDEAS.filter(it => it.tema === t.dataset.selecTema && pasaMatriz(it) && estadoIdea(it) === 'porhacer')
      .forEach(it => { if (t.checked) SELEC.add(it.id); else SELEC.delete(it.id); });
    pintarSeleccion(); }
});
let mzBusca;
document.addEventListener('input', e => {
  if (e.target.id !== 'mz-busca-idea') return;
  const v = e.target.value, clave = e.target.dataset.clave;
  clearTimeout(mzBusca); mzBusca = setTimeout(() => abrirEnlazar(clave, v), 200);
});
