/* ===================== Inicio: lo que importa hoy, en una pantalla =====================
   Pestaña «Inicio» (la primera); se abre al entrar y al pulsar el logo. En móvil las pestañas van en un menú lateral (☰).
   Bloques: Sugerencias de contenido (se mudan aquí desde la Matriz) · En producción ahora · Lo nuevo · Avisos (solo si hay).
   Sin cifras de ritmo ni de objetivos por semana: Sandra aún no tiene estrategia de redes. */
function bloqueInicio(titulo, extra, cuerpo, clase) {
  return '<section class="in-bloque' + (clase ? ' ' + clase : '') + '"><header><h3>' + titulo + '</h3>' + (extra || '') + '</header>' + cuerpo + '</section>';
}
function fichaIdeaInicio(it) {
  return '<article class="mz-sugficha"><button class="mz-sugabrir" data-abrir="' + it.id + '"><b>' + esc(tituloIdea(it)) + '</b>' +
    '<span class="mz-sugpie"><span class="mz-objtag">' + esc(objEt(objDe(it))) + '</span><span class="mz-sugform">' + chipAlcance(it) + '</span></span></button>' +
    '<button class="btn mini pri" data-producir="' + it.id + '">Producir</button></article>';
}
function vInicio() {
  let h = cabecera('Inicio', '', []);
  // 1. sugerencias del mes
  h += sugerencias() || '';
  // 2. en producción ahora
  const pend = carruselesDe('pendientes');
  const listos = typeof listosLote === 'function' ? listosLote().length : 0;
  h += bloqueInicio('En producción ahora',
    pend.length ? '<button class="in-ver" data-ir="producir">Ver todo en Producción (' + pend.length + ') →</button>' : '',
    pend.length ? '<div class="in-acc">' + (listos ? botonLote() : '') + '</div><div class="est-rejilla in-prod">' + pend.slice(0, 4).map(tarjeta).join('') + '</div>'
      : '<p class="in-vacio">No hay nada en producción. Elige una sugerencia de arriba o busca en la <button class="in-link" data-ir="ideas">Matriz</button>.</p>');
  // 3. lo nuevo: ideas del mes que prepara Claude + las que has anotado tú y aún no has producido
  const mk = mesClave();
  // sin repetir las que ya están en las sugerencias de arriba
  const enSug = new Set(elegirCinco().map(it => it.id));
  const nuevas = IDEAS.filter(it => yaVisible(it) && !enSug.has(it.id) && estadoIdea(it) === 'porhacer' && ((it.origen === 'claude' && it.mes === mk) || it.propia));
  if (nuevas.length) h += bloqueInicio('Lo nuevo', '<span class="in-sub">🆕 ideas del mes y las que has anotado tú</span>',
    '<div class="mz-sugfichas in-nuevas">' + nuevas.slice(0, 10).map(fichaIdeaInicio).join('') + '</div>');
  // 4. avisos: solo si hay algo que mirar
  const av = [];
  pend.filter(c => c.slides && c.slides.length && typeof qcErrores === 'function' && qcErrores(c)).forEach(c =>
    av.push('<li>⚠️ «' + esc(c.titulo || c.tema || 'Sin título') + '» tiene errores de calidad. <button class="in-link" data-est-abrir="' + c.id + '">Revisar</button></li>'));
  if (typeof usoFotos === 'function') {
    const u = usoFotos();
    fotosCatalogo().filter(f => !f.oculta && (u[f.ruta] || []).length >= 3).forEach(f =>
      av.push('<li>🔁 La foto «' + esc(tituloFoto(f)) + '» ya sale en ' + u[f.ruta].length + ' carruseles. <button class="in-link" data-ft-ir="' + esc(f.id) + '">Ver foto</button></li>'));
    const cat = fotosCatalogo().filter(f => f.estado === 'catalogando').length;
    if (cat) av.push('<li>✨ ' + cat + (cat === 1 ? ' foto está' : ' fotos están') + ' a medio catalogar. <button class="in-link" data-ir="fotos">Ver imágenes</button></li>');
  }
  if (av.length) h += bloqueInicio('Avisos', '', '<ul class="in-avisos">' + av.join('') + '</ul>', 'in-aviso');
  return h;
}
const _renderIn = render;
render = function () {
  if (S.v === 'inicio') { if (FT.visor) cerrarVisor(); $('#canvas').innerHTML = vInicio(); pintarMinis($('#canvas')); marcarPestana(); return; }
  _renderIn();
};
const _refrescarEstudioIn = refrescarEstudio;
refrescarEstudio = function () { if (S.v === 'inicio') { if (!EST.abierto) render(); return; } _refrescarEstudioIn(); };
// el logo lleva a Inicio
irHome = function () {
  if (FT.visor) cerrarVisor();
  if (!$('#onb').hidden) cerrarPanel();
  if (EST.abierto) cerrarEditor();
  if (S.sel) cerrar();
  S.v = 'inicio'; S.q = ''; render(); window.scrollTo({top: 0, behavior: 'smooth'});
};
document.addEventListener('click', e => {
  const f = e.target.closest && e.target.closest('[data-ft-ir]');
  if (f) { S.v = 'fotos'; render(); abrirVisor(f.dataset.ftIr); }
});
// se entra por Inicio
S.v = 'inicio';

/* móvil: menú lateral con las pestañas */
function menuMovil(abrir) {
  document.body.classList.toggle('menu-abierto', abrir);
  const b = document.getElementById('menu-movil'); if (!b) return;
  b.setAttribute('aria-expanded', String(abrir)); b.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  b.innerHTML = abrir ? '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
}
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest && t.closest('#menu-movil')) { menuMovil(!document.body.classList.contains('menu-abierto')); return; }
  if (document.body.classList.contains('menu-abierto') && (t.closest('#vistas button') || t.id === 'menu-velo')) menuMovil(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-abierto')) menuMovil(false); });
(function () { const v = document.createElement('div'); v.id = 'menu-velo'; document.body.appendChild(v); })();
