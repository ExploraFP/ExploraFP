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

/* ---------- objetivo de cada idea ----------
   La matriz se agrupa por lo que Sandra quiere conseguir con el carrusel, de menos a más push.
   Cada idea trae un objetivo sugerido (reglas de abajo); ella lo cambia en la ficha y se guarda en ops/<id>.objetivo.
   El carrusel lo hereda al producir y ahí se puede cambiar, junto con el CTA. */
const OBJETIVOS = {
  viral:       {emoji: '🔥', nombre: 'Viral',       push: 1, cta: 'Comenta, etiqueta a alguien o compártelo', pista: 'Tendencia, entretener, comunidad y cercanía'},
  autoridad:   {emoji: '🏆', nombre: 'Autoridad',   push: 2, cta: 'Guárdalo y síguenos para más',              pista: 'Demostrar que somos referentes del sector'},
  informativo: {emoji: '📋', nombre: 'Informativo', push: 3, cta: 'Escríbenos tu ciclo por DM y te decimos tu caso', pista: 'Requisitos, convalidaciones, plazos, precio'},
  leadmagnet:  {emoji: '🧲', nombre: 'Lead magnet', push: 4, cta: 'Comenta PALABRA y te mando [recurso]',     pista: 'Conseguir leads orgánicos con un recurso'},
};
/* El titular que se ve es el hook (web/hooks.json); el del banco se conserva en it.titular. */
const tituloIdea = it => (typeof HOOKS !== 'undefined' && HOOKS[it.id]) || it.titular;
const objEt = k => OBJETIVOS[k].emoji + ' ' + OBJETIVOS[k].nombre;   // nombre con su emoji, para la interfaz
const OBJ_ORDEN = ['viral', 'autoridad', 'informativo', 'leadmagnet'];
const OBJ_REGLAS = [
  ['leadmagnet', /\b(\d+|dos|tres|cuatro|cinco|seis|siete|ocho|diez)\s+(preguntas|pasos|errores|frases|se[nñ]ales|cosas|claves|documentos|requisitos|rutas|ciclos)\b|checklist|gu[ií]a|\bmapa\b|la tabla|documentaci[oó]n exacta|las cuentas|precio real|ruta completa|por d[oó]nde se empieza/i],
  ['viral', /martes cualquiera|sin postureo|ruta honesta|falso dilema|no es empezar de cero|lo que nadie|te lo cuento/i],
];
IDEAS.forEach(it => {
  const t = it.titular + ' ' + it.gancho;
  const r = OBJ_REGLAS.find(x => x[1].test(t));
  if (r) it.objAuto = r[0];
  else if (it.tipo === 'PERSONA' || it.tema === 'Para quién es') it.objAuto = 'viral';
  else if (['Dinero', 'Calendario y trámites', 'Acceso y requisitos', 'Convalidaciones', 'Titulación y después', 'Formación en empresa'].indexOf(it.tema) >= 0) it.objAuto = 'informativo';
  else if (['Oficial de verdad', 'Contra el humo', 'Salidas y mercado', 'Qué se aprende'].indexOf(it.tema) >= 0 || it.ganchoLabel === 'Creencia que rompe') it.objAuto = 'autoridad';
  else it.objAuto = 'informativo';
});
function objDe(it) { const o = S.ops[it.id]; return (o && OBJETIVOS[o.objetivo]) ? o.objetivo : it.objAuto; }
function cambiarObjetivo(id, obj) {
  S.ops[id] = Object.assign({}, S.ops[id], {objetivo: obj, upd: new Date().toISOString()});
  if (DB) DB.doc('ops/' + id).set(S.ops[id]).catch(() => {}); else { try { localStorage.setItem('explora.ops', JSON.stringify(S.ops)); } catch (e) {} }
}
/* genérico = transversal · rama = una rama entera · formación = un ciclo o un doble */
const ENFOQUES = {generico: 'Genéricas', rama: 'De una rama', formacion: 'De un ciclo'};
const enfoqueDe = it => it.alcTipo === 'transversal' ? 'generico' : it.alcTipo === 'rama' ? 'rama' : 'formacion';

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
IDEAS.forEach(it => { it._h = huella(it.titular + ' ' + it.gancho);
  if (typeof HOOKS !== 'undefined' && HOOKS[it.id]) it.buscar += ' ' + norm(HOOKS[it.id]); });
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
S.f.tema = S.f.tema || ''; S.f.estado = '';   // en la matriz no se filtra por estado (eso se ve en Producción)
 S.f.enf = S.f.enf || '';
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
  if (salvo !== 'enf' && f.enf && enfoqueDe(it) !== f.enf) return false;
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
/* ---------- sugerencias: 5 fichas según el calendario académico ----------
   Momentos del banco (CATALOGO.momentos, con sus meses) → ideas por hacer de ese momento, con más peso a las que más
   empujan (BOFU) y variadas: como mucho 2 del mismo objetivo y del mismo alcance. «Otras 5» pasa a las siguientes. */
S.sugOff = S.sugOff || 0;
/* una frase por mes (del calendario académico) para el subtítulo de las sugerencias */
const MES_FRASE = {1: 'Enero: el segundo arranque del año', 2: 'Febrero: segundo arranque y convalidaciones', 3: 'Marzo: toca convalidar y acreditar',
  4: 'Abril: convalidaciones y becas', 5: 'Mayo: becas, trámites y admisión', 6: 'Junio: admisión, notas y decidir en verano',
  7: 'Julio: admisión y decidir en verano', 8: 'Agosto: decidir antes de septiembre', 9: 'Septiembre: el pico más alto de matriculación',
  10: 'Octubre: todavía se puede entrar', 11: 'Noviembre: comparar y pagar', 12: 'Diciembre: comparar antes del segundo arranque'};
function candidatasMes() {
  const acts = momentosActivos().map(m => m.k);
  const peso = it => (it.funnel === 'BOFU' ? 3 : it.funnel === 'MOFU' ? 2 : 1) + (it.momentos.indexOf(acts[0]) >= 0 ? 1 : 0);
  return IDEAS.filter(it => estadoIdea(it) === 'porhacer' && deTemporada(it))
    .sort((a, b) => peso(b) - peso(a) || a.id.localeCompare(b.id));
}
function tandasDeCinco() {
  // reparte las candidatas en tandas de 5 sin repetir, cada tanda variada en objetivo y alcance
  let pool = candidatasMes().slice(); const tandas = [];
  while (pool.length) {
    const out = [], nObj = {}, nAlc = {};
    pool.forEach(it => { if (out.length >= 5) return; const o = objDe(it), a = it.alcTxt;
      if ((nObj[o] || 0) >= 2 || (nAlc[a] || 0) >= 2) return; out.push(it); nObj[o] = (nObj[o] || 0) + 1; nAlc[a] = (nAlc[a] || 0) + 1; });
    pool.forEach(it => { if (out.length < 5 && out.indexOf(it) < 0) out.push(it); });
    tandas.push(out); pool = pool.filter(it => out.indexOf(it) < 0);
  }
  return tandas;
}
function elegirCinco() { const t = tandasDeCinco(); return t.length ? t[((S.sugOff % t.length) + t.length) % t.length] : []; }
function sugerencias() {
  const cinco = elegirCinco(); if (!cinco.length) return '';
  const acts = momentosActivos(), nT = tandasDeCinco().length, pos = ((S.sugOff % nT) + nT) % nT + 1;
  return '<section class="mz-sug"><header><div><h3>Sugerencias de contenido</h3>' +
    '<p>' + esc(MES_FRASE[mesActual()]) + '</p></div>' +
    (nT > 1 ? '<div class="mz-sugnav"><button id="mz-sug-ant" aria-label="Anteriores">‹</button><span>' + pos + '/' + nT + '</span><button id="mz-sug-sig" aria-label="Siguientes">›</button></div>' : '') + '</header>' +
    '<div class="mz-sugfichas">' + cinco.map(it => {
      const m = acts.find(x => it.momentos.indexOf(x.k) >= 0);
      return '<article class="mz-sugficha"><button class="mz-sugabrir" data-abrir="' + it.id + '">' +
        '<span class="mz-sugobj">' + esc(objEt(objDe(it))) + '</span>' +
        '<b>' + esc(tituloIdea(it)) + '</b>' +
        '<span class="mz-sugpie">' + chipAlcance(it) + (m ? '<small>' + esc(m.n) + '</small>' : '') + '</span></button>' +
        '<button class="btn mini pri" data-producir="' + it.id + '">Producir</button></article>'; }).join('') + '</div></section>';
}

/* Buscador: una caja y dos desplegables. «Formación» junta lo que antes eran Enfoque, Rama y Ciclo. */
function valorFormacion() { return S.f.enf === 'generico' ? 'gen' : S.f.form ? 'c:' + S.f.form : S.f.rama ? 'r:' + S.f.rama : ''; }
/* Orden fijo pedido por Sandra: primero las ramas; luego los ciclos de Sanidad, Tecnología, Comercio, Administración,
   Educación Infantil y, al final, los dobles. Cada opción es LA MISMA etiqueta (chip) que sale en filas y fichas
   (mismas clases r-<rama> t-<tipo> del banco), para que el color y la forma sean siempre coherentes. */
const FORM_RAMAS = [['Sanidad', 'sanidad'], ['Tecnología', 'tech'], ['Comercio', 'comercio'], ['Administración', 'admin']];
const FORM_CICLOS = [
  ['sanidad', ['TCAE', 'Anatomía Patológica y Citodiagnóstico', 'Dietética', 'Laboratorio Clínico y Biomédico']],
  ['tech', ['SMR', 'ASIR', 'DAM', 'DAW']],
  ['comercio', ['Comercio Internacional', 'Marketing y Publicidad', 'Transporte y Logística']],
  ['admin', ['Gestión Administrativa', 'Administración y Finanzas', 'Asistencia a la Dirección']],
  ['socio', ['Educación Infantil']],
  ['', ['Doble Laboratorio + Anatomía', 'Doble DAM + DAW', 'Doble Comercio Int. + Transporte', 'Doble Admin. y Finanzas + Asistencia']]];
function barraBusqueda() {
  const v = valorFormacion();
  const hay = {}; IDEAS.forEach(i => { if (i.alcTipo === 'formacion') hay[i.alcTxt] = ramaKey(i); });
  let actual = '<span class="mz-ftodas">Todas las formaciones</span>';
  const chip = (txt, cls) => '<span class="chip ' + cls + '">' + esc(txt) + '</span>';
  const o = (val, html) => { if (v === val) actual = html;
    return '<button type="button" class="mz-fopt' + (v === val ? ' on' : '') + '" data-forma-v="' + esc(val) + '">' + html + '</button>'; };
  const lista = o('', '<span class="mz-ftodas">Todas las formaciones</span>') + o('gen', chip('Transversal', 'r-trans t-transversal')) + '<hr>' +
    FORM_RAMAS.map(r => o('r:' + r[0], chip(r[0], 'r-' + r[1] + ' t-rama'))).join('') + '<hr>' +
    FORM_CICLOS.map(g => g[1].filter(c => hay[c]).map(c => o('c:' + c, chip(c, 'r-' + hay[c] + ' t-formacion'))).join('')).join('');
  return '<section class="mz-buscazona"><div class="mz-busca"><div class="mz-buscabarra">' +
    '<svg class="mz-lupa" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
    '<input type="search" id="buscar" value="' + esc(S.q) + '" placeholder="Busca una idea: convalidar, TCAE, sueldo…" aria-label="Buscar en la matriz">' +
    '<span class="mz-sep"></span><div class="mz-fsel"><button type="button" class="mz-fbtn" id="mz-fbtn" aria-haspopup="listbox" aria-expanded="' + !!S.formaAbierta + '">' + actual + '<span class="mz-fflecha" aria-hidden="true">▾</span></button>' +
    (S.formaAbierta ? '<div class="mz-flista" role="listbox">' + lista + '</div>' : '') + '</div></div>' +
    (['rama', 'form', 'cif', 'tema', 'estado', 'enf'].some(k => S.f[k]) || S.q ? '<button class="linkbtn" id="mz-limpiar">Quitar filtros</button>' : '') +
    '</div></section>';
}
function barraMatriz() {
  const RAMASF = ['Transversal', 'Sanidad', 'Tecnología', 'Comercio', 'Administración', 'Servicios Socioculturales'];
  const CICLOS = Array.from(new Set(IDEAS.filter(i => i.alcTipo === 'formacion' && (!S.f.rama || i.ramaColor === S.f.rama)).map(i => i.alcTxt)))
    .sort((a, b) => a.localeCompare(b, 'es'));
  const activos = ['rama', 'form', 'cif', 'tema', 'estado', 'enf'].some(k => S.f[k]);
  return '<div class="barra mz-barra">' +
    selMatriz('estado', 'Estado', 'Todas', Object.keys(ESTADOS_IDEA).map(k => [k, ESTADOS_IDEA[k]]), estadoIdea) +
    selMatriz('enf', 'Enfoque', 'Todas', Object.keys(ENFOQUES).map(k => [k, ENFOQUES[k]]), enfoqueDe) +
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
    ? '<button class="mz-hecho mz-enprod" data-abrir="' + it.id + '"><span class="mz-mini">' + mini(c, 0) + '</span><span>Para revisar<small>en Producción</small></span></button>'
    : '<button class="mz-enprod-txt" data-ir="producir">' + (c.estado === 'generando' ? 'Generando…' : 'En Producción') + '</button>';
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
    '<td class="c-idea"><button class="celda" data-abrir="' + it.id + '">' + marca(tituloIdea(it), TOKENS) + '</button>' +
      '<div class="mz-gancho">' + marca(it.gancho, TOKENS) + '</div>' +
      (hp.length && puede ? '<button class="mz-aviso-par" data-abrir="' + it.id + '">⚠ Ya hay uno parecido hecho</button>' : '') + '</td>' +
    '<td class="c-est">' + celdaEstado(it) + '</td></tr>';
}
// Los temas empiezan cerrados; se abren solos al buscar o filtrar por tema.
function temaAbierto(t) {
  if (t in S.abiertos) return S.abiertos[t];
  return !!(S.q && S.q.trim()) || !!S.f.tema || !!S.f.enf || !!S.f.form || !!S.f.rama;
}
let MZ_CLAVE = '';
function vMatriz() {
  // al cambiar la búsqueda o el tema, se olvida qué temas se habían abierto o cerrado a mano
  const clave = (S.q || '') + '|' + (S.f.tema || '') + '|' + (S.f.enf || '') + '|' + (S.f.form || '') + '|' + (S.f.rama || '');
  if (clave !== MZ_CLAVE) { MZ_CLAVE = clave; S.abiertos = {}; }
  TOKENS = trozosBusqueda();
  const filas = IDEAS.filter(it => pasaMatriz(it)).sort(ordenar);
  const n = {porhacer: 0, produccion: 0, hecha: 0}; IDEAS.forEach(it => n[estadoIdea(it)]++);
  let h = cabecera('Matriz de contenido', '',
    [[n.hecha + '<small>/' + IDEAS.length + '</small>', 'hechas', 'ok'], [n.produccion, 'en producción', n.produccion ? 'lima' : ''], [n.porhacer, 'por hacer']]);
  h += '<div class="mz-selbar' + (SELEC.size ? ' on' : '') + '" id="mz-selbar">' + barraSeleccion() + '</div>';
  h += sugerencias();
  h += barraBusqueda();
  const filtrando = filas.length !== IDEAS.length;
  if (filtrando) h += '<p class="cuenta"><b>' + filas.length + '</b>' + (filas.length === 1 ? ' idea' : ' ideas') + '</p>';
  if (!filas.length) return h + '<div class="vacio"><b>Nada con esos filtros</b>Prueba a quitar alguno, o cambia el estado a «Todas».</div>';
  const tabla = rows => '<div class="tablawrap"><table class="matriz mz-tabla"><tbody>' +
    rows.map(filaMatriz).join('') + '</tbody></table></div>';
  if (!S.agrupar) return h + tabla(filas);
  const grupos = {}; filas.forEach(it => { const k = objDe(it); (grupos[k] = grupos[k] || []).push(it); });
  return h + OBJ_ORDEN.filter(t => grupos[t]).map(t => {
    const O = OBJETIVOS[t];
    // el progreso cuenta lo que entra en los filtros de alcance, sea cual sea su estado
    const rows = grupos[t], todas = IDEAS.filter(i => objDe(i) === t && pasaMatriz(i, 'estado')), hechas_ = todas.filter(i => estadoIdea(i) === 'hecha').length;
    const porHacer = rows.filter(i => estadoIdea(i) === 'porhacer').length, enProd = rows.filter(i => estadoIdea(i) === 'produccion').length;
    const abierto = temaAbierto(t), pct = todas.length ? 100 * hechas_ / todas.length : 0;
    const nSel = rows.filter(i => SELEC.has(i.id)).length;
    return '<section class="mz-grupo' + (abierto ? ' abierto' : '') + '"><header>' +
      '<button class="mz-plegar" data-tema-plegar="' + esc(t) + '" aria-expanded="' + abierto + '">' +
      '<span class="mz-flecha" aria-hidden="true">' + (abierto ? '▾' : '▸') + '</span>' +
      '<span class="mz-tema-txt"><h3>' + esc(objEt(t)) + '</h3>' + (() => { const x = [O.pista + ' · CTA: «' + O.cta + '»'];
        if (rows.length !== todas.length) x.push(rows.length + (rows.length === 1 ? ' coincide' : ' coinciden'));
        if (enProd) x.push('<b class="p">' + enProd + ' en producción</b>');
        if (nSel) x.push('<b class="s">' + nSel + (nSel === 1 ? ' seleccionada' : ' seleccionadas') + '</b>');
        return x.length ? '<small>' + x.join(' · ') + '</small>' : ''; })() + '</span>' +
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
  if (!ids.length) { toast('Esas ideas ya están en Producción o hechas'); return; }
  const objs = Array.from(new Set(ids.map(id => objDe(IMAP[id]))));
  const obj = objs.length === 1 ? objs[0] : '';   // '' = cada una con el suyo
  EST_PROD = {ids: ids, obj: obj, cta: obj ? OBJETIVOS[obj].cta : ''};
  pintarProducir();
}
let EST_PROD = null;
function pintarProducir() {
  const ids = EST_PROD.ids, primera = IMAP[ids[0]];
  const conPar = ids.map(id => ({it: IMAP[id], hp: hechosParecidos(IMAP[id])})).filter(x => x.hp.length);
  let h = '<div class="onbcaja mz-prod" role="dialog" aria-modal="true" aria-label="Producir">' +
    '<header><k>Producir</k><h2>' + (ids.length === 1 ? esc(tituloIdea(primera)) : ids.length + ' carruseles') + '</h2></header><div class="cuerpo">';
  if (conPar.length) {
    h += '<div class="mz-yahecho"><b>Antes de producir: ya tienes algo parecido hecho</b>' +
      '<p>Si te sirve, reutilízalo y quita la idea de este lote. Si no, Claude buscará otro enfoque.</p>' +
      conPar.map(x => '<div class="mz-parfila"><div class="mz-parinfo"><small>Tu idea</small><b>' + esc(tituloIdea(x.it)) + '</b></div>' +
        '<span class="mz-flechita">≈</span>' +
        x.hp.slice(0, 2).map(hh => '<div class="mz-parhecho">' + (hh.carrusel ? '<span class="mz-mini">' + mini(hh.carrusel, 0) + '</span>' : '') +
          '<span><small>Ya hecho' + (hh.fecha ? ' · ' + esc(fCorta(hh.fecha)) : '') + '</small>' + esc(hh.titulo) + '</span></div>').join('') +
        '<button class="btn mini" data-usar-hecho="' + x.it.id + '" data-clave="' + esc(x.hp[0].clave) + '">Usar el hecho</button></div>').join('') + '</div>';
  }
  const mixto = new Set(ids.map(id => objDe(IMAP[id]))).size > 1;
  h += '<h4 class="mz-sub">Objetivo</h4><div class="est-opciones mz-objs">' +
    (mixto ? '<button class="est-op" data-prod-obj="" aria-pressed="' + !EST_PROD.obj + '">Cada una el suyo</button>' : '') +
    OBJ_ORDEN.map(k => '<button class="est-op" data-prod-obj="' + k + '" aria-pressed="' + (EST_PROD.obj === k) + '">' + esc(objEt(k)) + '</button>').join('') + '</div>';
  h += EST_PROD.obj ? '<label class="mz-cta">CTA del cierre<input type="text" id="mz-prod-cta" value="' + esc(EST_PROD.cta) + '"></label>'
    : '<p class="est-pista">Cada carrusel usa el objetivo y el CTA de su idea.</p>';
  // todas las plantillas juntas, cada una con portada con foto y sin foto
  const opciones = [];
  EST_PLANTILLAS.forEach(p => [true, false].forEach(f => opciones.push({p: p, f: f})));
  h += '<h4 class="mz-sub">Plantilla</h4><div class="mz-plantillas">' + opciones.map(o => {
      const v = previa('prod-' + o.p.id + (o.f ? '-f' : ''), o.p.id, EST.color, tituloIdea(primera), primera.alcTxt, o.f);
      return '<button class="mz-plantilla" data-prod-pl="' + o.p.id + '" data-prod-f="' + o.f + '" aria-pressed="' + (EST.plantilla === o.p.id && EST.conFoto === o.f) + '">' + mini(v, 0) +
        '<b>' + esc(o.p.nombre) + '</b><small>' + (o.f ? 'con foto' : esc(o.p.pista)) + '</small></button>'; }).join('') + '</div>';
  h += '<h4 class="mz-sub">Color</h4><div class="est-opciones">' + EST_COLORES_ELEGIBLES.map(c => '<button class="est-op" data-prod-co="' + c.id + '" aria-pressed="' + (EST.color === c.id) + '">' +
      '<i style="background:' + c.hex + '"></i>' + esc(c.nombre) + '</button>').join('') + '</div>';
  h += '<p class="est-pista">Luego puedes cambiar plantilla y color de cada carrusel por separado.</p>';
  h += '</div><footer><span class="puntos"></span><button class="btn" id="onbCerrar">Cancelar</button>' +
    '<button class="btn pri" id="mz-prod-ok">' + (ids.length === 1 ? 'Producir' : 'Producir los ' + ids.length) + (EST.sample ? ' y generar' : '') + '</button></footer></div>';
  $('#onb').hidden = false; $('#onb').innerHTML = h; pintarMinis($('#onb'));
}
function confirmarProducir() {
  const ids = EST_PROD.ids, EST_PROD_OBJ = EST_PROD.obj; EST_PROD = null;
  const i = $('#mz-prod-cta'); const cta = i ? i.value.trim() : '';
  const n = mandarAProducir(ids, id => { const o = EST_PROD_OBJ || objDe(IMAP[id]);
    return {objetivo: o, cta: EST_PROD_OBJ ? (cta || OBJETIVOS[o].cta) : OBJETIVOS[o].cta}; });
  ids.forEach(id => SELEC.delete(id));
  cerrarPanel(); S.sel = null; $('#velo').classList.remove('on'); $('#drawer').classList.remove('on');
  S.v = 'producir'; render();
  toast(n === 1 ? 'En Producción' : n + ' en Producción');
  if (EST.sample) generarTodas();
}

/* ---------- HECHOS: todo lo publicado en un sitio ---------- */
function vTodoHecho() {
  const q = norm(S.q).trim();
  let lista = todoHecho();
  if (q) lista = lista.filter(x => norm(x.titulo).indexOf(q) >= 0);
  const todos = todoHecho();
  let h = cabecera('Inventario', '',
    [[todos.length, 'publicados', 'ok'], [todos.filter(x => !x.idea).length, 'sin idea']]);
  h += '<div class="est-acciones"><button class="btn pri" id="nuevoCarrusel">+ Añadir uno ya publicado</button>' +
    (Object.values(EST.lista).some(c => c.estado === 'hecho') ? '<button class="btn" data-lote="hechos">Descargar todos los PNG</button>' : '') +
    '<input type="search" id="buscar" class="invbusca" value="' + esc(S.q) + '" placeholder="Buscar…" aria-label="Buscar en hechos">' +
    '<span class="est-progreso">' + esc(EST.progreso || '') + '</span></div>';
  if (!lista.length) return h + '<div class="vacio"><b>' + (q ? 'Nada con esa búsqueda' : 'Todavía no hay nada') + '</b>' +
    (q ? 'Prueba con otra palabra.' : 'Marca hecho un carrusel en Producción, o añade uno que ya tengas publicado.') + '</div>';
  return h + '<div class="est-rejilla">' + lista.map(x => {
    const c = x.carrusel, it = x.idea ? IMAP[x.idea] : null;
    return '<article class="est-tarjeta">' + (c ? mini(c, 0) : '<div class="est-mini"><span class="est-vacia">' + (x.url ? 'En Drive' : 'Añadido a mano') + '</span></div>') +
      '<div class="est-tcuerpo"><h4>' + esc(x.titulo || '(sin título)') + '</h4>' +
      '<div class="est-tmeta">' + (it ? chipAlcance(it) + '<span>' + esc(objEt(objDe(it))) + '</span>' : '<span class="chip temp">sin idea</span>') +
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
    '<b>' + esc(tituloIdea(it)) + '</b><small>' + esc(objEt(objDe(it))) + ' · ' + esc(it.alcTxt) + ' · ' + esc(ESTADOS_IDEA[estadoIdea(it)]) + '</small></button></li>';
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
  cerrarPanel(); toast('Unido a «' + tituloIdea(IMAP[ideaId]) + '»'); render();
}

/* ---------- ficha: solo a qué formación va y las slides en fila ---------- */
pintarFicha = function () {
  const it = IMAP[S.sel]; if (!it) return;
  const e = estadoIdea(it), c = carruselDe(it), o = op(it.id), obj = objDe(it);
  $('#drawer').classList.add('mz-ancha');
  const niv = it.nivel ? (NIVEL[it.nivel] || it.nivel) : '';
  const extra = it.alcTipo === 'formacion' ? 'Rama ' + it.ramaColor + (niv ? ' · ' + niv : '') : it.alcTipo === 'transversal' ? 'Para todas las ramas' : niv;
  const cta = (c && c.cta) || OBJETIVOS[obj].cta;
  // cabecera: estado, hook y formación
  $('#dhead').innerHTML = '<div class="fx-top"><span class="fx-estado fx-' + e + '">' + esc(ESTADOS_IDEA[e]) + '</span>' +
      (deTemporada(it) ? '<span class="fx-mes">📅 ' + esc(MESES[mesActual()]) + '</span>' : '') +
      '<button class="dclose" id="cerrarFicha" aria-label="Cerrar">✕</button></div>' +
    '<h2 class="fx-tit">' + esc(tituloIdea(it)) + '</h2>' +
    '<div class="fx-form">' + chipAlcance(it) + (extra ? '<span>' + esc(extra) + '</span>' : '') + '</div>';
  // cuerpo: de qué va, objetivo + CTA, y el carrusel (o cómo quedaría la portada)
  let b = '<section class="fx-sec"><h4>De qué va</h4><p class="fx-dentro">' + esc(it.dentro || it.gancho) + '</p></section>';
  b += '<div class="fx-par">' +
    '<section class="fx-caja"><h4>Objetivo</h4><div class="fx-objs" role="group" aria-label="Objetivo">' + OBJ_ORDEN.map(k =>
      '<button data-obj-idea="' + k + '" aria-pressed="' + (obj === k) + '">' + esc(objEt(k)) + '</button>').join('') + '</div></section>' +
    '<section class="fx-caja fx-cta"><h4>CTA final</h4><p>' + esc(cta) + '</p></section></div>';
  if (c && c.slides && c.slides.length)
    b += '<section class="fx-sec"><h4>El carrusel</h4><div class="mz-tira">' + c.slides.map((_, i) => '<div class="mz-tira-s"><span>' + (i + 1) + '</span>' + mini(c, i) + '</div>').join('') + '</div></section>';
  else if (c) b += '<div class="mz-sincarr">En Producción, todavía sin generar.</div>';
  else if (o.url) b += '<div class="mz-sincarr">Hecho fuera de la herramienta.</div>';
  else {
    const hp = hechosParecidos(it);
    if (hp.length) b += '<div class="mz-yahecho"><b>Ya tienes uno parecido hecho</b>' +
      hp.slice(0, 2).map(hh => '<div class="mz-parhecho">' + (hh.carrusel ? '<span class="mz-mini">' + mini(hh.carrusel, 0) + '</span>' : '') +
        '<span>' + (hh.carrusel ? '<button class="linkbtn" data-est-abrir="' + hh.carrusel.id + '">' + esc(hh.titulo) + '</button>' : esc(hh.titulo)) + '</span></div>').join('') + '</div>';
    const v = previa('fx-' + it.id, EST.plantilla, EST.color, tituloIdea(it), it.alcTxt, EST.conFoto);
    b += '<section class="fx-sec"><h4>Así quedaría la portada</h4><div class="fx-previa">' + mini(v, 0) +
      '<p>Con tu última plantilla (' + esc(nombrePl(EST.plantilla)) + ' · ' + esc(nombreCo(EST.color)) + '). La cambias al producir.</p></div></section>';
  }
  $('#dbody').innerHTML = b;
  if (!c && o.url) { $('#dfoot').innerHTML = '<a class="btn pri" href="' + esc(o.url) + '" target="_blank" rel="noopener">Ver en Drive</a>'; pintarMinis($('#dbody')); return; }
  $('#dfoot').innerHTML = c ? (c.slides && c.slides.length ? '<button class="btn pri" data-est-abrir="' + c.id + '">Abrir carrusel</button>' : '<button class="btn pri" data-ir="producir">Ir a Producción</button>')
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
mandarAProducir = function (ids, extra) {
  const n = _mandarMz(ids, extra);
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
  if (t.closest('#mz-fbtn')) { S.formaAbierta = !S.formaAbierta; render(); return; }
  const fv = t.closest('[data-forma-v]');
  if (fv) { const v = fv.dataset.formaV; S.formaAbierta = false; S.f.enf = ''; S.f.rama = ''; S.f.form = ''; S.t.solo = true;
    if (v === 'gen') S.f.enf = 'generico'; else if (v.slice(0, 2) === 'r:') S.f.rama = v.slice(2); else if (v.slice(0, 2) === 'c:') S.f.form = v.slice(2);
    render(); return; }
  if (S.formaAbierta && !t.closest('.mz-flista')) { S.formaAbierta = false; render(); }
  if (t.id === 'mz-sug-sig') { S.sugOff++; render(); return; }
  if (t.id === 'mz-sug-ant') { S.sugOff--; render(); return; }
  if (t.id === 'mz-abrirtodos') { const v = !OBJ_ORDEN.every(temaAbierto); OBJ_ORDEN.forEach(k => S.abiertos[k] = v); render(); return; }
  const en = t.closest('[data-enlazar]'); if (en) { e.stopImmediatePropagation(); abrirEnlazar(en.dataset.enlazar); return; }
  const ea = t.closest('[data-enlazar-a]'); if (ea) { e.stopImmediatePropagation(); enlazar(ea.dataset.clave, ea.dataset.enlazarA); return; }
  const pd = t.closest('[data-producir]');
  if (pd && !t.closest('#onb')) { e.stopImmediatePropagation(); abrirProducir([pd.dataset.producir]); return; }
  if (t.id === 'mz-producir') { abrirProducir([...SELEC]); return; }
  if (t.id === 'mz-deseleccionar') { SELEC.clear(); pintarSeleccion(); document.querySelectorAll('[data-selec-tema]').forEach(x => x.checked = false); return; }
  if (EST_PROD && $('#mz-prod-cta')) EST_PROD.cta = $('#mz-prod-cta').value;   // no perder lo escrito al repintar
  const pob = t.closest('[data-prod-obj]');
  if (pob) { EST_PROD.obj = pob.dataset.prodObj; EST_PROD.cta = EST_PROD.obj ? OBJETIVOS[EST_PROD.obj].cta : ''; pintarProducir(); return; }
  const oid = t.closest('[data-obj-idea]');
  if (oid && S.sel) { cambiarObjetivo(S.sel, oid.dataset.objIdea); pintarFicha(); render(); toast('Movida a ' + objEt(oid.dataset.objIdea)); return; }
  const ppl = t.closest('[data-prod-pl]'); if (ppl) { EST.plantilla = ppl.dataset.prodPl; EST.conFoto = ppl.dataset.prodF === 'true'; guardarEstilo(); pintarProducir(); return; }
  const pco = t.closest('[data-prod-co]'); if (pco) { EST.color = pco.dataset.prodCo; guardarEstilo(); pintarProducir(); return; }
  if (t.id === 'mz-prod-ok') { e.stopImmediatePropagation(); confirmarProducir(); return; }
  const uh = t.closest('[data-usar-hecho]');
  if (uh) { const it = uh.dataset.usarHecho; enlazarSinCerrar(uh.dataset.clave, it); EST_PROD.ids = EST_PROD.ids.filter(x => x !== it); SELEC.delete(it);
    toast('Hecho: esa idea queda cubierta por el carrusel que ya tenías');
    if (!EST_PROD.ids.length) { EST_PROD = null; cerrarPanel(); render(); } else pintarProducir(); return; }
  if (t.id === 'mz-verfiltros') { S.verFiltros = !S.verFiltros; render(); return; }
  if (t.id === 'mz-agrupar') { S.agrupar = !S.agrupar; render(); return; }
  if (t.id === 'mz-limpiar') { e.stopImmediatePropagation(); S.f = {rama: '', form: '', cif: '', tema: '', estado: '', enf: ''}; S.t.solo = false; S.q = ''; render(); return; }
}, true);
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && (t.dataset.dim === 'tema' || t.dataset.dim === 'estado' || t.dataset.dim === 'enf')) { e.stopImmediatePropagation(); S.f[t.dataset.dim] = t.value; render(); }
  if (t.dataset && 'forma' in t.dataset) { e.stopImmediatePropagation();
    const v = t.value; S.f.enf = ''; S.f.rama = ''; S.f.form = ''; S.t.solo = true;
    if (v === 'gen') S.f.enf = 'generico'; else if (v.slice(0, 2) === 'r:') S.f.rama = v.slice(2); else if (v.slice(0, 2) === 'c:') S.f.form = v.slice(2);
    render(); }
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
    IDEAS.filter(it => objDe(it) === t.dataset.selecTema && pasaMatriz(it) && estadoIdea(it) === 'porhacer')
      .forEach(it => { if (t.checked) SELEC.add(it.id); else SELEC.delete(it.id); });
    pintarSeleccion(); }
});
let mzBusca;
document.addEventListener('input', e => {
  if (e.target.id !== 'mz-busca-idea') return;
  const v = e.target.value, clave = e.target.dataset.clave;
  clearTimeout(mzBusca); mzBusca = setTimeout(() => abrirEnlazar(clave, v), 200);
});
