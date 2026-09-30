/* ===================== Datos: las cifras que se pueden citar =====================
   Antes: 16 tarjetas de distinto alto con todo abierto y códigos de idea (T27, B048…).
   Ahora: agrupados por tema, buscador, una fila por dato con la frase citable a la vista; al abrirla,
   norma, fuente, «Cuidado» y las ideas que lo usan con su titular. Los que no se pueden usar, arriba y en rojo. */
const DATO_GRUPO = {
  D13: 'No lo uses todavía',
  D01: 'Cómo funciona la FP', D14: 'Cómo funciona la FP', D15: 'Cómo funciona la FP',
  D04: 'Acceso y títulos', D05: 'Acceso y títulos', D06: 'Acceso y títulos',
  D02: 'Prácticas', D03: 'Prácticas',
  D07: 'Cifras de la FP', D08: 'Cifras de la FP', D09: 'Cifras de la FP', D16: 'Cifras de la FP',
  D10: 'Ciclos concretos', D11: 'Ciclos concretos', D12: 'Ciclos concretos'};
const DATO_ORDEN = ['No lo uses todavía', 'Cómo funciona la FP', 'Acceso y títulos', 'Prácticas', 'Cifras de la FP', 'Ciclos concretos', 'Otros'];
const DATO_EMO = {'No lo uses todavía': '⛔', 'Cómo funciona la FP': '🧭', 'Acceso y títulos': '🎓', 'Prácticas': '🏢', 'Cifras de la FP': '📊', 'Ciclos concretos': '🔎', 'Otros': '📎'};
const DT = {q: '', abiertos: {}};
const grupoDato = d => /^BAJA/.test(d.confianza) ? 'No lo uses todavía' : (DATO_GRUPO[d.id] || 'Otros');
const estadoDato = d => /^BAJA/.test(d.confianza) ? ['bloq', 'No lo uses'] : d.confianza === 'ALTA' ? ['ok', 'Fiable'] : ['matiz', 'Con matices'];
function filaDato(d) {
  const [cl, txt] = estadoDato(d), ab = !!DT.abiertos[d.id];
  const ideas = d.ideas.concat(d.ideasSug).filter(id => IMAP[id]);
  return '<article class="dt-fila' + (cl === 'bloq' ? ' bloq' : '') + (ab ? ' abierta' : '') + '">' +
    '<button class="dt-cab" data-dt-abrir="' + d.id + '" aria-expanded="' + ab + '">' +
      '<span class="dt-est ' + cl + '">' + txt + '</span>' +
      '<span class="dt-txt"><b>' + esc(d.tema) + '</b><span class="dt-frase">' + esc(d.frase) + '</span></span>' +
      '<span class="dt-usos">' + (ideas.length ? ideas.length + (ideas.length === 1 ? ' idea' : ' ideas') : '') + '</span>' +
      '<span class="dt-flecha" aria-hidden="true">▾</span></button>' +
    (ab ? '<div class="dt-cuerpo">' +
      '<div class="dt-cuidado"><b>Cuidado:</b> ' + esc(d.aviso) + '</div>' +
      '<dl><dt>Norma</dt><dd>' + esc(d.norma) + '</dd><dt>Fuente</dt><dd>' + esc(d.fuente) + (d.url ? ' · <a href="' + esc(d.url) + '" target="_blank" rel="noopener">abrir la fuente ↗</a>' : '') + '</dd></dl>' +
      '<div class="dt-acc"><button class="btn" data-dt-copiar="' + d.id + '">Copiar la frase</button><span class="dt-id">' + esc(d.id) + '</span></div>' +
      (ideas.length ? '<div class="dt-ideas"><h4>Lo usan ' + ideas.length + (ideas.length === 1 ? ' idea' : ' ideas') + '</h4><ul>' +
        ideas.slice(0, 12).map(id => '<li><button data-abrir="' + id + '">' + esc(tituloIdea(IMAP[id])) + '</button></li>').join('') +
        (ideas.length > 12 ? '<li class="dt-mas">y ' + (ideas.length - 12) + ' más</li>' : '') + '</ul></div>' : '') +
    '</div>' : '') + '</article>';
}
vDatos = function () {
  const caducado = hoy() > CADUCA, bloq = DATOS.filter(d => /^BAJA/.test(d.confianza)).length;
  let h = cabecera('Datos que puedes citar', '', [[DATOS.length - bloq, 'listos para citar', 'ok']].concat(bloq ? [[bloq, 'no usar todavía', 'rojo']] : []));
  h += '<p class="dt-rev' + (caducado ? ' tarde' : '') + '">' + (caducado ? '⚠️ <b>Toca revisar:</b> han pasado más de seis meses desde ' + esc(CONSULTA) + '.'
    : '📅 Comprobados en ' + esc(CONSULTA) + '. <b>Próxima revisión: marzo de 2027.</b> Después, ninguna cifra sale sin recomprobar.') + '</p>';
  h += '<div class="mz-buscabarra dt-busca"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
    '<input type="search" id="dt-q" placeholder="Busca un dato: prácticas, becas, Grado Superior…" value="' + esc(DT.q) + '" aria-label="Buscar datos"></div>';
  const q = norm(DT.q), vis = DATOS.filter(d => !q || norm([d.tema, d.frase, d.norma, d.fuente, d.aviso, d.id].join(' ')).indexOf(q) >= 0);
  if (!vis.length) return h + '<div class="vacio"><b>Ningún dato con esa búsqueda</b>Prueba con otra palabra.</div>';
  DATO_ORDEN.forEach(g => {
    const ds = vis.filter(d => grupoDato(d) === g); if (!ds.length) return;
    h += '<section class="dt-grupo' + (g === 'No lo uses todavía' ? ' dt-g-bloq' : '') + '"><h3>' + DATO_EMO[g] + ' ' + esc(g) + ' <span>' + ds.length + '</span></h3>' + ds.map(filaDato).join('') + '</section>';
  });
  return h;
};
document.addEventListener('click', e => {
  const t = e.target;
  const ab = t.closest && t.closest('[data-dt-abrir]'); if (ab) { const id = ab.dataset.dtAbrir; DT.abiertos[id] = !DT.abiertos[id]; render(); return; }
  const cp = t.closest && t.closest('[data-dt-copiar]'); if (cp) { const d = DATOS.find(x => x.id === cp.dataset.dtCopiar); if (d) copiar(d.frase, 'Frase copiada'); }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'dt-q') return;
  DT.q = e.target.value; const pos = e.target.selectionStart; render();
  const i = $('#dt-q'); if (i) { i.focus(); i.setSelectionRange(pos, pos); }
});
BUSCADORES.push('dt-q');
