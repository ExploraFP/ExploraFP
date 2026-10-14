/* ---------- Descargar → Google Drive (pedido de Sandra, 14/10/2026) ----------
   La descarga al ordenador pide una confirmación por archivo y la plataforma no deja .zip.
   Con el conector de Google Drive (capacidad `mcp`) la web crea una carpeta
   «Explora · Carruseles / C16 · título» con todas las slides en PNG y el texto del post, de una vez.
   Cada persona sube a SU Drive (el conector va con las credenciales de quien mira la web).
   Las escrituras no se reintentan solas: si algo falla, se dice qué y se vuelve a pulsar. */
const DRV = {srv: 'Google Drive', padre: 'Explora · Carruseles', mcp: undefined, subiendo: false};
const DRV_MCP = (typeof claude !== 'undefined' && claude.use) ? claude.use('mcp').then(m => (DRV.mcp = m || null), () => (DRV.mcp = null)) : Promise.resolve(DRV.mcp = null);

const drvTitulo = c => String(c.titulo || c.tema || 'Carrusel').replace(/\*/g, '').trim();
const drvNombre = c => (codigoC(c) ? codigoC(c) + ' · ' : '') + drvTitulo(c);
const drvBase64 = blob => new Promise((ok, mal) => { const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => mal(r.error); r.readAsDataURL(blob); });

function drvMensaje(e) {
  const code = e && e.code;
  if (code === 'needs_reauth') return 'Tu conexión con Google Drive ha caducado. Reconéctala en claude.ai → Ajustes → Conectores y vuelve a pulsar.';
  if (code === 'server_not_connected' || code === 'server_not_found') return 'Google Drive no está conectado a tu cuenta. Añádelo en claude.ai → Ajustes → Conectores y vuelve a pulsar.';
  if (code === 'selection_required') return 'Tienes más de un Google Drive conectado: elige cuál en el aviso de claude.ai y vuelve a pulsar.';
  if (code === 'not_granted' || code === 'not_in_manifest') return 'No le has dado permiso a la web para usar Google Drive. Vuelve a pulsar y acepta el permiso.';
  if (code === 'blocked_by_policy' || code === 'approval_required') return 'Tu organización no deja usar Google Drive desde aquí. Descárgalo al ordenador.';
  if (code === 'capability_disabled' || code === 'capability_removed') return 'Google Drive no está disponible en esta vista. Descárgalo al ordenador.';
  if (code === 'png') return 'No he podido crear la imagen: ' + (e.message || '');
  if (code === 'tool_error') return 'Google Drive ha dado un error' + (e.message ? ': ' + e.message : '') + '.';
  if (code === 'server_unavailable') return 'Google Drive no responde ahora mismo. Espera un momento y vuelve a pulsar.';
  return 'No he podido terminar' + (code ? ' (' + code + (e.message ? ': ' + e.message : '') + ')' : '') + '.';
}

async function drvCarpetaPadre(mcp) {
  const q = "title = '" + DRV.padre.replace(/'/g, "\\'") + "' and mimeType = 'application/vnd.google-apps.folder' and owner = 'me'";
  try {
    const r = await mcp.callTool(DRV.srv, 'search_files', {query: q, excludeContentSnippets: true, pageSize: 5});
    const f = r && r.payload && r.payload.files && r.payload.files[0];
    if (f && f.id) return f.id;
  } catch (e) { if (e && e.code !== 'tool_error' && e.code !== 'not_in_manifest') throw e; }
  const r = await mcp.callTool(DRV.srv, 'create_file', {title: DRV.padre, contentMimeType: 'application/vnd.google-apps.folder'});
  return r.payload.id;
}

/* catálogo en Drive: una carpeta por carrusel, «C16 · título», que se ordenan solas por código.
   Si ya se subió antes, la nueva es «C16 · título (v2)», «(v3)»… para no mezclar versiones. */
async function drvNombreLibre(mcp, padre, c) {
  const nombre = drvNombre(c), cod = codigoC(c) || nombre;
  try {
    const r = await mcp.callTool(DRV.srv, 'search_files', {query: "parentId = '" + padre + "' and mimeType = 'application/vnd.google-apps.folder' and title contains '" + cod.replace(/'/g, "\\'") + "'", excludeContentSnippets: true, pageSize: 50});
    const n = ((r && r.payload && r.payload.files) || []).filter(f => String(f.title || '').indexOf(cod) === 0).length;
    return n ? nombre + ' (v' + (n + 1) + ')' : nombre;
  } catch (e) { if (e && e.code !== 'tool_error') throw e; return nombre; }
}
async function subirADrive(c) {
  if (DRV.subiendo) return;
  const mcp = DRV.mcp; if (!mcp) { drvPintar(c, {error: drvMensaje({code: 'capability_disabled'})}); return; }
  const total = c.slides.length + (c.copy ? 1 : 0), base = (codigoC(c) ? codigoC(c) + '-' : '') + nombreBase(c);
  let hechos = 0; DRV.subiendo = true;
  const paso = txt => drvAvisar(c, {progreso: txt, hechos: hechos, total: total});
  try {
    paso('Buscando tu carpeta «' + DRV.padre + '»…');
    const padre = await drvCarpetaPadre(mcp);
    const nombre = await drvNombreLibre(mcp, padre, c);
    paso('Creando la carpeta «' + nombre + '»…');
    const r = await mcp.callTool(DRV.srv, 'create_file', {title: nombre, parentId: padre, contentMimeType: 'application/vnd.google-apps.folder'});
    const carpeta = r.payload, url = carpeta.viewUrl || ('https://drive.google.com/drive/folders/' + carpeta.id);
    for (let i = 0; i < c.slides.length; i++) {
      paso('Subiendo la slide ' + (i + 1) + ' de ' + c.slides.length + '…');
      let png;
      try { png = await pngDe(c, i); } catch (e) { throw {code: 'png', message: 'slide ' + (i + 1) + (e && e.message ? ': ' + e.message : '')}; }
      await mcp.callTool(DRV.srv, 'create_file', {title: base + '-' + String(i + 1).padStart(2, '0') + '.png', parentId: carpeta.id,
        base64Content: await drvBase64(png), contentMimeType: 'image/png', disableConversionToGoogleType: true});
      hechos++;
    }
    if (c.copy) {
      paso('Subiendo el texto del post…');
      await mcp.callTool(DRV.srv, 'create_file', {title: base + '-texto.txt', parentId: carpeta.id,
        textContent: c.copy, contentMimeType: 'text/plain', disableConversionToGoogleType: true});
      hechos++;
    }
    drvAvisar(c, {hecho: url, hechos: hechos, nombre: nombre});
  } catch (e) {
    console.error('drive', e);
    drvAvisar(c, {error: drvMensaje(e) + (hechos ? ' Se subieron ' + hechos + ' de ' + total + '; si vuelves a pulsar, se crea una carpeta nueva.' : ''), hechos: hechos});
  } finally { DRV.subiendo = false; }
}

/* si Sandra cierra la ventana mientras sube, sigue subiendo y avisa con un toast al acabar */
function drvAvisar(c, st) {
  const onb = $('#onb');
  if (!onb.hidden && onb.dataset.drv === c.id) return drvPintar(c, st);
  if (st.hecho) toast('✓ ' + drvNombre(c) + ' ya está en tu Google Drive');
  else if (st.error) toast(st.error);
  else if (st.progreso) toast(st.progreso);
}
function drvPintar(c, st) {
  st = st || {};
  const n = c.slides.length, onb = $('#onb'); onb.hidden = false;
  let cuerpo, pie;
  if (st.progreso) {
    cuerpo = '<p class="drv-prog">' + esc(st.progreso) + '</p><div class="drv-barra"><i style="width:' + Math.round(100 * (st.hechos || 0) / (st.total || 1)) + '%"></i></div>';
    pie = '';
  } else if (st.hecho) {
    cuerpo = '<p class="drv-ok">✓ ' + (st.hechos === 1 ? '1 archivo subido' : st.hechos + ' archivos subidos') + ' a tu Google Drive.</p>' +
      '<p>Carpeta «' + esc(DRV.padre) + '» › «' + esc(st.nombre || drvNombre(c)) + '». Desde Drive puedes bajarla entera en .zip o abrirla en el móvil.</p>';
    pie = '<button class="btn" id="onbCerrar">Cerrar</button><a class="btn pri" href="' + esc(st.hecho) + '" target="_blank" rel="noopener">Abrir la carpeta</a>';
  } else {
    cuerpo = (st.error ? '<p class="drv-error" role="alert">' + esc(st.error) + '</p>' : '') +
      '<button class="drv-op" data-drv="drive"' + (DRV.mcp === null ? ' disabled' : '') + '><b>📁 A Google Drive</b><span>' +
        (DRV.mcp === null ? 'No disponible en esta vista.' : 'Las ' + n + ' slides' + (c.copy ? ' y el texto del post' : '') + ' en una carpeta, de una vez.') + '</span></button>' +
      '<button class="drv-op" data-drv="pc"><b>💻 Al ordenador</b><span>Te pide una confirmación por cada slide (' + (n + (c.copy ? 1 : 0)) + ').</span></button>';
    pie = '<button class="btn" id="onbCerrar">Cancelar</button>';
  }
  onb.innerHTML = '<div class="onbcaja drv-caja" role="dialog" aria-modal="true" aria-labelledby="drv-t"><header><k>' + esc(codigoC(c) || 'Descargar') + '</k><h2 id="drv-t">' +
    (st.hecho ? 'Ya está en tu Drive' : 'Descargar «' + esc(drvTitulo(c)) + '»') + '</h2></header><div class="cuerpo">' + cuerpo + '</div>' +
    (pie ? '<footer><span class="puntos"></span>' + pie + '</footer>' : '') + '</div>';
  onb.dataset.drv = c.id;
}

// en window y en captura: el clic de estudio.js (document, captura) descargaría al ordenador antes
window.addEventListener('click', e => {
  const t = e.target; if (!t.closest) return;
  const b = t.closest('#est-descargar, [data-est-descargar]');
  if (b) {
    const c = EST.lista[b.id === 'est-descargar' ? EST.abierto : b.dataset.estDescargar]; if (!c || !c.slides.length) return;
    e.stopPropagation(); e.preventDefault();
    if (DRV.subiendo) { drvPintar(c, {progreso: 'Subiendo…'}); return; }
    drvPintar(c); if (DRV.mcp === undefined) DRV_MCP.then(() => { if ($('#onb').dataset.drv === c.id && !DRV.subiendo && $('.drv-op')) drvPintar(c); });
    return;
  }
  const op = t.closest('[data-drv]'); if (!op) return;
  const c = EST.lista[$('#onb').dataset.drv]; if (!c) return;
  if (op.dataset.drv === 'pc') { cerrarPanel(); descargar(c); return; }
  if (op.dataset.drv === 'drive') subirADrive(c);
}, true);
