/* ===================== Plantilla «Tarjeta» de Estáticos (23/10/2026) =====================
   Copia de los dinámicos que ya hace el equipo (ejemplos de Sandra: 23.10_DGS_2 y _3): un FONDO TEMÁTICO ANIMADO del mundo de
   la formación (red vascular, microscopio…) con rótulos de aparato en las esquinas, y encima una TARJETA blanca casi fija
   («● OFICIAL», «Formación Profesional», titular, ciclos en lima, beneficio y botón) con la pegatina «100% ONLINE».
   En dinámico dura 8 s: la tarjeta entra y sale con un fundido para que el vídeo haga bucle. En estático (1:1 y vertical) es la
   misma pieza con el fondo quieto. Los fondos se dibujan con SVG generado (sin fotos), siempre igual para el mismo texto. */
const TJ_FONDOS = [['vascular', 'Red vascular', 'Sanidad'], ['microscopio', 'Microscopio', 'Sanidad'], ['cuadricula', 'Cuadrícula', 'Todas']];
const TJ_SEG = 8;
// ciclos de cada doble grado, para rellenarlos solos al elegir la formación
const TJ_DOBLES = {
  'Doble Laboratorio + Anatomía': 'Laboratorio Clínico y Biomédico\n+ Anatomía Patológica\ny Citodiagnóstico',
  'Doble DAM + DAW': 'Desarrollo de Aplicaciones Multiplataforma\n+ Desarrollo de Aplicaciones Web',
  'Doble Comercio Int. + Transporte': 'Comercio Internacional\n+ Transporte y Logística',
  'Doble Admin. y Finanzas + Asistencia': 'Administración y Finanzas\n+ Asistencia a la Dirección'};
const TJ_NOMBRE_LARGO = {DAM: 'Desarrollo de Aplicaciones Multiplataforma', DAW: 'Desarrollo de Aplicaciones Web', SMR: 'Sistemas Microinformáticos y Redes',
  ASIR: 'Administración de Sistemas Informáticos en Red', TCAE: 'Técnico en Cuidados Auxiliares de Enfermería'};
function tjCiclosDe(form) {
  if (!form || form === 'Transversal' || REG_RAMAS[form]) return '';
  return TJ_DOBLES[form] || TJ_NOMBRE_LARGO[form] || form;
}
const tjFondoDe = form => { const r = REG_RAMA_DE[form] || REG_RAMAS[form]; return r === 'sanidad' ? 'vascular' : 'cuadricula'; };

// generador de números siempre igual para la misma semilla
function tjAzar(semilla) { let s = 0; String(semilla).split('').forEach(c => { s = (s * 31 + c.charCodeAt(0)) % 2147483647; }); s = s || 7;
  return () => (s = s * 16807 % 2147483647) / 2147483647; }

/* RED VASCULAR: ramas rosas que crecen desde arriba y desde abajo sobre un fondo granate muy oscuro, con puntos lima que laten.
   Cada nivel de ramas es UN path (ligero para hacer el vídeo) y aparece un poco después que el anterior: así «crece». */
function tjVascular(W, H, semilla) {
  const az = tjAzar(semilla), niveles = [];
  const rama = (x, y, ang, largo, grosor, n) => {
    const x2 = x + Math.cos(ang) * largo, y2 = y + Math.sin(ang) * largo;
    (niveles[n] = niveles[n] || []).push('M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'L' + x2.toFixed(0) + ' ' + y2.toFixed(0));
    if (n < 6) [-1, 1].forEach(lado => rama(x2, y2, ang + lado * (.32 + az() * .38), largo * (.68 + az() * .12), grosor * .7, n + 1));
  };
  const raices = Math.round(W / 300);
  for (let i = 0; i < raices; i++) {
    rama(W * (i + .5) / raices + (az() - .5) * 120, -30, Math.PI / 2 + (az() - .5) * .6, H * .13, 16, 0);
    rama(W * (i + .5) / raices + (az() - .5) * 120, H + 30, -Math.PI / 2 + (az() - .5) * .6, H * .13, 16, 0);
  }
  const puntos = []; for (let i = 0; i < 26; i++) puntos.push('<circle class="tj-pulso" cx="' + Math.round(az() * W) + '" cy="' + Math.round(az() * H) + '" r="' + (4 + az() * 4).toFixed(1) + '" style="animation-delay:' + (az() * 1.2).toFixed(2) + 's"/>');
  const ancho = [16, 12, 9, 6.5, 4.5, 3.2, 2.2];
  return '<svg class="tj-svg tj-vascular" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice"><rect width="' + W + '" height="' + H + '" fill="#1a0614"/>' +
    '<g class="tj-latido">' + niveles.map((d, n) => '<g class="tj-nivel" style="animation-delay:' + (n * .14).toFixed(2) + 's">' +
      '<path d="' + d.join('') + '" stroke="#f08ad0" stroke-opacity=".22" stroke-width="' + (ancho[n] * 2.6).toFixed(1) + '" fill="none" stroke-linecap="round"/>' +
      '<path d="' + d.join('') + '" stroke="#f3a3dc" stroke-width="' + ancho[n] + '" fill="none" stroke-linecap="round"/></g>').join('') + '</g>' +
    '<g fill="#d8ff6e">' + puntos.join('') + '</g></svg>';
}
/* MICROSCOPIO: el campo del ocular (círculo con borde lima) lleno de células que se mueven despacio; empieza desenfocado y enfoca */
function tjMicroscopio(W, H, semilla) {
  const az = tjAzar(semilla), cx = W / 2, cy = H / 2, r = Math.min(W, H) * .62;
  const capa = k => { const out = []; for (let i = 0; i < 26; i++) {
    const x = cx + (az() - .5) * r * 2.1, y = cy + (az() - .5) * r * 2.1, rx = 26 + az() * 18, ry = rx * (.7 + az() * .3), rot = Math.round(az() * 180);
    out.push('<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ') rotate(' + rot + ')"><ellipse rx="' + rx.toFixed(0) + '" ry="' + ry.toFixed(0) + '" fill="#7cc6dc" fill-opacity=".55" stroke="#3f9cc0" stroke-width="2"/>' +
      '<ellipse cx="' + (az() * 8 - 4).toFixed(0) + '" rx="' + (rx * .34).toFixed(0) + '" ry="' + (ry * .38).toFixed(0) + '" fill="#2f4f96"/></g>'); }
    return '<g class="tj-celulas tj-c' + k + '">' + out.join('') + '</g>'; };
  return '<svg class="tj-svg tj-micro" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="tjluz"><stop offset="0" stop-color="#f3fbf6"/><stop offset=".7" stop-color="#d7ebe6"/><stop offset="1" stop-color="#8fb3b1"/></radialGradient>' +
    '<clipPath id="tjocular"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath></defs><rect width="' + W + '" height="' + H + '" fill="#03141a"/>' +
    '<g clip-path="url(#tjocular)"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#tjluz)"/><g class="tj-enfoque">' + capa(1) + capa(2) + capa(3) + '</g>' +
    '<path d="M' + cx + ' ' + (cy - r) + 'V' + (cy + r) + 'M' + (cx - r) + ' ' + cy + 'H' + (cx + r) + '" stroke="#1b2a2a" stroke-opacity=".55" stroke-width="2"/></g>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#d8ff6e" stroke-width="7"/></svg>';
}
/* CUADRÍCULA: la de la marca, en verde, que se desliza despacio (para las ramas que aún no tienen fondo propio) */
function tjCuadricula(W, H) {
  return '<svg class="tj-svg tj-cuad" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice"><defs><pattern id="tjrej" width="72" height="72" patternUnits="userSpaceOnUse">' +
    '<path d="M72 0H0V72" fill="none" stroke="#d8ff6e" stroke-opacity=".16" stroke-width="2"/></pattern></defs><rect width="' + W + '" height="' + H + '" fill="#1b3620"/>' +
    '<g class="tj-desliza"><rect x="-72" y="-72" width="' + (W + 144) + '" height="' + (H + 144) + '" fill="url(#tjrej)"/></g></svg>';
}
const TJ_HUD = {
  vascular: ['RED VASCULAR', '60 lpm', ''],
  microscopio: ['OCULAR · ×10', '<span class="tj-enf1">Enfocando…</span><span class="tj-enf2">ENFOCADO ✓</span>', 'Objetivo ×40 · Campo claro'],
  cuadricula: ['FP ONLINE', '', '']};

function tjCuerpo(e, formato) {
  const fmtT = t => esc(t || '').trim().replace(/\*(.+?)\*/g, '<em>$1</em>');
  const W = 1080, H = formato === 'vertical' ? 1920 : 1080, fondo = TJ_FONDOS.some(f => f[0] === e.fondo) ? e.fondo : 'cuadricula';
  const svg = fondo === 'vascular' ? tjVascular(W, H, e.id + formato) : fondo === 'microscopio' ? tjMicroscopio(W, H, e.id + formato) : tjCuadricula(W, H);
  const hud = TJ_HUD[fondo];
  const ciclos = String(e.ciclos || '').split('\n').map(x => x.trim()).filter(Boolean);
  const din = e.tipo === 'dinamico' && formato === 'vertical';
  return '<section class="pieza p-tarjeta f-' + formato + (din ? ' anim a-tarjeta' : '') + '">' +
    '<div class="tj-fondo">' + svg + '</div>' +
    '<div class="tj-hud"><span class="tj-h1">' + hud[0] + '</span><span class="tj-h2">' + hud[1] + '</span>' + (hud[2] ? '<span class="tj-h3">' + hud[2] + '</span>' : '') + '</div>' +
    '<div class="tj-tarjeta">' +
      (e.pegatina ? '<div class="tj-pegatina">' + fmtT(e.pegatina) + '</div>' : '') +
      '<div class="tj-cab"><span class="tj-logo"></span><span class="tj-oficial">● OFICIAL</span></div>' +
      (e.etiqueta ? '<div class="tj-sello">' + fmtT(e.etiqueta) + '</div>' : '') +
      '<h1 class="tj-titulo">' + fmtT(e.titulo) + '</h1>' +
      (ciclos.length ? '<div class="tj-ciclos">' + ciclos.map(c => '<span>' + fmtT(c) + '</span>').join('') + '</div>' : '') +
      (e.beneficio ? '<hr><p class="tj-beneficio">' + fmtT(e.beneficio) + '</p>' : '') +
      (e.cta ? '<span class="tj-boton">' + fmtT(e.cta) + '</span>' : '') +
    '</div></section>';
}
