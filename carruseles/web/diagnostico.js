/* 20/11/2026 · DIAGNÓSTICO TEMPORAL del editor (Sandra: «no se puede editar nada», un clic no hace nada, en Chrome;
   no se reproduce en las pruebas). Apunta lo que pasa al pinchar en el editor y lo guarda en el db (`diagnostico/<n>`)
   para leerlo desde Claude Code. QUITAR cuando se encuentre la causa. 20/11 tarde: vuelto a poner para «borro una slide, apruebo y no la borra» (mira también #onb). */
const DG = {ev: [], pintados: 0, guardado: 0, t0: Date.now(), n: 0, version: '20/11 v269 quitar'};
function dgApunta(o) { o.ms = Date.now() - DG.t0; DG.ev.push(o); if (DG.ev.length > 80) DG.ev.shift(); dgGuardarPronto(); }
let DG_T = null;
function dgGuardarPronto() { clearTimeout(DG_T); DG_T = setTimeout(dgGuardar, 2500); }
function dgGuardar() {
  if (typeof EST_DB === 'undefined' || !EST_DB || !EST.abierto) return;
  const c = EST.lista[EST.abierto] || {};
  const d = {cuando: new Date().toISOString(), version: DG.version, ua: navigator.userAgent, ancho: innerWidth, alto: innerHeight, dpr: devicePixelRatio,
    carrusel: c.num || '', estado: c.estado || '', listo: !!c.listo, sel: EST.sel, tab: typeof LZ !== 'undefined' ? LZ.tab : '',
    clase: (document.querySelector('#est-editor') || {}).className || '', pintados: DG.pintados, ev: JSON.stringify(DG.ev)};
  try { EST_DB.collection('diagnostico').doc('d' + (Date.now() % 1e8)).set(d); } catch (e) {}
  DG.ev = [];
}
function dgDesc(el) { if (!el || !el.tagName) return String(el); return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''); }
['pointerdown', 'pointerup', 'click', 'dblclick'].forEach(tipo => window.addEventListener(tipo, e => {
  if (!EST.abierto || !e.target || !e.target.closest || !e.target.closest('#est-editor, #onb')) return;
  const g = e.target.closest('.est-grande'), o = {e: tipo, t: dgDesc(e.target), x: Math.round(e.clientX), y: Math.round(e.clientY), pt: e.pointerType || '', tr: e.isTrusted};
  if (g && tipo === 'pointerdown') {
    const fr = g.querySelector('iframe'); o.fr = fr ? Math.round(fr.getBoundingClientRect().width) + 'px' : 'sin iframe';
    try { o.doc = fr && fr.contentDocument ? fr.contentDocument.readyState + ':' + !!fr.contentDocument.querySelector('.slide') : 'sin doc'; } catch (x) { o.doc = 'error ' + x.message; }
    try { const ob = fr && objetivoEn(fr, e.clientX, e.clientY); o.obj = ob ? ob.tipo + ':' + (ob.campo || '') : 'nada'; } catch (x) { o.obj = 'error ' + x.message; }
    try { const r = fr.getBoundingClientRect(), k = r.width / 1080, el = fr.contentDocument.elementFromPoint((e.clientX - r.left) / k, (e.clientY - r.top) / k); o.dentro = dgDesc(el); } catch (x) {}
  }
  o.slides = (EST.lista[EST.abierto] || {slides: []}).slides.length; o.onb = !document.querySelector('#onb').hidden; o.inline = SEL.inline ? 'si:' + (SEL.inline.el && SEL.inline.el.isConnected) : 'no'; o.pop = SEL.pop ? SEL.pop.tipo + ':' + (SEL.pop.campo || '') : '';
  dgApunta(o);
  if (tipo === 'pointerdown' || tipo === 'click') setTimeout(() => dgApunta({e: 'despues-' + tipo, slides: (EST.lista[EST.abierto] || {slides: []}).slides.length, onb: !document.querySelector('#onb').hidden, pop: SEL.pop ? SEL.pop.tipo + ':' + (SEL.pop.campo || '') : '', inline: !!SEL.inline, caja: !!document.querySelector('.lz-caja'), pintados: DG.pintados}), 600);
}, true));
window.addEventListener('error', e => { if (EST.abierto) dgApunta({e: 'ERROR', m: String(e.message), f: String(e.filename || '').slice(-40) + ':' + e.lineno}); });
window.addEventListener('unhandledrejection', e => { if (EST.abierto) dgApunta({e: 'PROMESA', m: String(e.reason && (e.reason.message || e.reason)).slice(0, 200)}); });
const _pintarEditorDg = pintarEditor;
pintarEditor = function (todo) {
  DG.pintados++;
  if (EST.abierto) dgApunta({e: 'pintarEditor', todo: !!todo, de: String(new Error().stack || '').split('\n').slice(2, 6).map(l => l.trim().replace(/^at /, '').replace(/\(.*\)/, '').trim()).join(' < ')});
  return _pintarEditorDg.apply(this, arguments);
};
