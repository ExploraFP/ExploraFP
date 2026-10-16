/* ===================== Contenidos (16/10/2026, pedido de Sandra) =====================
   Una sola herramienta con barra lateral izquierda: Carruseles y Newsletter, y lo que venga (guiones…).
   · Carruseles es esta misma web (no se mueve nada: mismo db, fotos y tareas programadas).
   · Newsletter vive en un marco aparte (newsletter.html, se carga al abrirla): así su código y sus estilos no chocan con
     los de Carruseles. Usa la misma base de datos (colecciones calendario, config y ejemplos) a través de window.claude del padre.
   · Para añadir una sección: una entrada en CNT_SECCIONES (+ su panel si no es Carruseles). */
const CNT_ICONOS = {
  carruseles: '<svg viewBox="0 0 44 44" aria-hidden="true"><rect x="5" y="9" width="21" height="27" rx="3" fill="#4CCD4B" transform="rotate(-14 15 22)"/><rect x="12" y="7" width="21" height="27" rx="3" fill="#EDFEC3" transform="rotate(-3 22 20)"/><rect x="19" y="8" width="21" height="27" rx="3" fill="#fff" transform="rotate(9 29 21)"/><rect x="22.5" y="14" width="11" height="3.2" rx="1.6" fill="#366B40" transform="rotate(9 29 21)"/></svg>',
  newsletter: '<svg viewBox="0 0 44 44" aria-hidden="true"><rect x="6" y="11" width="32" height="23" rx="4" fill="#EDFEC3"/><path d="M8 14l14 10 14-10" fill="none" stroke="#366B40" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="35" cy="12" r="5" fill="#4CCD4B"/></svg>'
};
const CNT_SECCIONES = [
  {id: 'carruseles', nombre: 'Carruseles'},
  {id: 'newsletter', nombre: 'Newsletter'}
];
const CNT = {sec: 'carruseles', nl: null};
try { const g = localStorage.getItem('contenidos.seccion'); if (CNT_SECCIONES.some(s => s.id === g)) CNT.sec = g; } catch (e) {}

function cntMontar() {
  const lado = document.createElement('aside'); lado.id = 'cnt-lado'; lado.setAttribute('aria-label', 'Secciones');
  lado.innerHTML = '<div class="cnt-marca"><b>Contenidos</b><img src="logos/blanco.webp" alt="Explora × Ucademy"></div>' +
    '<nav class="cnt-nav">' + CNT_SECCIONES.map(s => '<button type="button" data-cnt="' + s.id + '" title="' + s.nombre + '">' +
      '<span class="cnt-ico">' + (CNT_ICONOS[s.id] || '') + '</span><span class="cnt-txt">' + s.nombre + '</span></button>').join('') + '</nav>' +
    // claro / oscuro para toda la herramienta (hace lo mismo que el botón que tenía Carruseles en su cabecera)
    '<button type="button" class="cnt-tema" id="cnt-tema" title="Cambiar entre claro y oscuro" aria-label="Cambiar entre claro y oscuro"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg><span class="cnt-txt">Claro / oscuro</span></button>';
  document.body.insertBefore(lado, document.body.firstChild);
  const nl = document.createElement('section'); nl.id = 'cnt-newsletter'; nl.hidden = true; nl.setAttribute('aria-label', 'Newsletter');
  document.body.appendChild(nl);
  document.body.classList.add('cnt');
  cntIr(CNT.sec, true);
}
function cntIr(id, inicio) {
  CNT.sec = id; try { localStorage.setItem('contenidos.seccion', id); } catch (e) {}
  document.querySelectorAll('#cnt-lado [data-cnt]').forEach(b => b.setAttribute('aria-current', b.dataset.cnt === id ? 'page' : 'false'));
  document.body.classList.toggle('cnt-en-nl', id === 'newsletter');
  const p = document.getElementById('cnt-newsletter'); if (p) p.hidden = id !== 'newsletter';
  if (id === 'newsletter') cntCargarNewsletter();
  if (!inicio) { document.body.classList.remove('menu-abierto'); window.scrollTo(0, 0); }
}
/* La newsletter se carga la primera vez que se abre. srcdoc (no src) para que su window.claude sea el de esta página. */
async function cntCargarNewsletter() {
  if (CNT.nl) return;
  const p = document.getElementById('cnt-newsletter'); if (!p) return;
  CNT.nl = document.createElement('iframe'); CNT.nl.title = 'Newsletter';
  p.innerHTML = '<p class="cnt-cargando">Cargando la newsletter…</p>';
  try {
    const r = await fetch('newsletter.html'); if (!r.ok) throw new Error('http ' + r.status);
    const base = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
    CNT.nl.srcdoc = (await r.text()).replace('<head>', '<head><base href="' + base + '">');
    p.innerHTML = ''; p.appendChild(CNT.nl);
    CNT.nl.addEventListener('load', cntTemaNl);
  } catch (e) {
    CNT.nl = null;
    p.innerHTML = '<p class="cnt-cargando">No he podido abrir la newsletter (' + esc(e && e.message || 'error') + '). Recarga la página.</p>';
  }
}
// el tema claro/oscuro de Contenidos manda también en la newsletter
function cntTemaNl() {
  try { const d = CNT.nl && CNT.nl.contentDocument; if (!d) return; const t = document.documentElement.getAttribute('data-theme');
    if (t) d.documentElement.setAttribute('data-theme', t); else d.documentElement.removeAttribute('data-theme'); } catch (e) {}
}
new MutationObserver(cntTemaNl).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('#cnt-tema')) { const t = document.getElementById('tema'); if (t) t.click(); return; }
  const b = e.target.closest && e.target.closest('[data-cnt]'); if (!b) return;
  e.preventDefault(); cntIr(b.dataset.cnt);
});
cntMontar();
