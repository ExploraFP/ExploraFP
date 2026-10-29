// Motor de diseño de los carruseles: convierte una slide (objeto) en el HTML de 1080×1350.
// Lo comparten el generador de PNG (render.js, Node) y la herramienta web (sin dependencias).
// R resuelve los recursos según dónde se ejecute:
//   R.logo(color) · R.imagen(ruta) · R.postit() → URL;  R.cabeza(plantilla) → <link>/<style> de la cabeza.
export const PLANTILLAS = ["feed", "capas", "cuaderno", "poster", "chat", "tuit", "editorial", "bloques", "ruta"];
export const COLORES = ["verde01", "verde02", "blanco", "noche", "lima", "verde"];
// 23/10/2026 (Sandra: «todos los cuerpos son iguales»): tipos de cuerpo nuevos, con su estructura propia en TODAS las plantillas
export const TIPOS = ["portada", "contenido", "lista", "dato", "cierre", "mito", "pregunta", "pasos", "comparacion", "cita", "momento"];
const TIPOS_NUEVOS = ["mito", "pregunta", "pasos", "comparacion", "cita", "momento"];

// Logos del catálogo de marca: uno para ir sobre la caja de color y otro sobre el fondo.
const LOGO_CINTA = { verde01: "Verde 01", verde02: "Verde 03", noche: "Negro", lima: "Verde 03", verde: "Verde 03", blanco: "Verde 01" };
const LOGO_FONDO = { verde01: "Verde 03", verde02: "Negro", noche: "Verde 03", lima: "Verde 01", verde: "Negro", blanco: "Verde 01" };

export function crearMotor(R) {
  const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // *palabra* → resaltado; salto de línea → <br>
  const fmt = (s) => esc(s).trim().replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
  const parrafos = (s) => String(s).trim().split(/\n\s*\n/).map((p) => `<p>${fmt(p)}</p>`).join("");
  const si = (v, html) => (v ? html : "");
  const dos = (n) => String(n).padStart(2, "0");

  const etiqueta = (t) => si(t, `<div class="etiqueta"><span>${fmt(t)}</span><i class="ovalo"></i></div>`);
  const etiquetaOvalo = etiqueta;
  const numero = (n) => si(n, `<div class="num"><span>${esc(n)}</span><i class="ovalo"></i></div>`);
  const flecha = (clase) => `<i class="flecha ${clase}"></i>`;
  const titulo = (t, h = "h2") => `<${h} class="titulo">${fmt(t)}</${h}>`;
  // dato: la fuente no se enseña en la slide (Sandra, 19/10/2026); sigue siendo obligatoria en el carrusel y el control de calidad la pide
  const fuente = () => "";
  const sub = (t) => si(t, `<div class="subtitulo">${fmt(t)}</div>`);
  const texto = (t) => si(t, `<div class="texto">${parrafos(t)}</div>`);
  const nota = (t) => si(t, `<div class="nota">${fmt(t)}</div>`);

  const rutaImagen = (s) => R.imagen(s.imagen);
  const portatil = (s) => `<div class="portatil"><div class="pantalla"><img src="${rutaImagen(s)}" alt=""></div><div class="base"></div></div>`;

  // Decoraciones extra. `decoracion: postit | notas | isotipo` (o lista), `ninguna` quita las de serie.
  const DECORACIONES = ["isotipo", "notas", "postit"];
  function decoracion(s) {
    const d = s.decoracion === "ninguna" ? [] : [].concat(s.decoracion ?? []);
    const malas = d.filter((x) => !DECORACIONES.includes(x));
    if (malas.length) throw new Error(`decoracion "${malas}" no existe (usa: ${DECORACIONES.join(", ")}, ninguna)`);
    return d.map((x) => x === "postit"
      ? `<img class="postit" src="${R.postit()}" alt="">`
      : `<i class="deco-${x}"></i>`).join("");
  }

  // CAPAS: fondo → papel torcido → caja de color → trazos y pegatinas.
  function capas(s) {
    const sinDeco = s.decoracion === "ninguna";
    switch (s.tipo) {
      case "portada":
        // Con foto: la foto ocupa el sitio del papel, torcida, y la caja de color se monta encima.
        return `<div class="papel papel-portada foto-papel"><img src="${rutaImagen(s)}" alt=""></div>` + etiqueta(s.etiqueta) +
          si(s.trazo === "flecha", flecha("f-portada-1")) +   // 29/10: de serie sin flecha (no señalaba nada)
          `<div class="caja caja-portada">${titulo(s.titulo, "h1")}${sub(s.subtitulo)}${nota(s.nota)}` +
          `<img class="logo-caja" src="${logo(LOGO_CINTA[s._color])}" alt="Explora × Ucademy"></div>`;
      case "contenido": {
        const caja = s.numero || s.texto || s.imagen;
        return `<div class="cabeza">${etiqueta(s.etiqueta)}${titulo(s.titulo)}${sub(s.antetitulo)}</div>` +
          si(caja, `<div class="pila"><div class="papel"></div><div class="caja">${numero(s.numero)}${texto(s.texto)}${s.imagen ? portatil(s) : ""}</div></div>`) +
          nota(s.nota);
      }
      case "lista": {
        const items = s.items || [];
        return `<div class="cabeza">${etiqueta(s.etiqueta)}${titulo(s.titulo)}${sub(s.antetitulo)}</div>` +
          `<div class="pila"><div class="papel"><i class="deco-notas"></i></div><div class="tarjetas n${items.length}">` +
          items.map((it, n) => `<div class="caja tarjeta">${numero(dos(n + 1))}<div class="texto">${fmt(it)}</div></div>`).join("") +
          `</div></div>` + nota(s.nota);
      }
      case "dato": {
        // Como «contenido»: la cifra grande arriba, fuera de la caja, y la explicación en la caja; sin flecha suelta
        // (Sandra, 19/10/2026: «la flecha solitaria no se justifica», «demasiado vacío»). Si la «cifra» es una frase, va como titular (con su *resaltado*).
        const frase = /[a-záéíóúñ]{4,}/i.test(String(s.cifra || ""));
        return `<div class="cabeza">${etiqueta(s.etiqueta)}${si(s.antetitulo, `<div class="ante">${fmt(s.antetitulo)}</div>`)}` +
          (frase ? titulo(s.cifra) : `<div class="cifra">${esc(s.cifra)}</div>`) + `</div>` +
          si(s.texto, `<div class="pila"><div class="papel"></div><div class="caja caja-dato">${texto(s.texto)}${fuente(s)}</div></div>`);
      }
      case "cierre":
        return `<div class="cabeza">${etiqueta(s.etiqueta)}${titulo(s.titulo)}${texto(s.texto)}</div>` +
          si(s.cta, `<div class="cta-fila"><div class="cta">${fmt(s.cta)}</div>${flecha("f-cta")}</div>`) + nota(s.nota);
    }
  }

  // CUADERNO: libreta con cuadrícula, logo arriba, número fantasma, checklist. Limpia y editorial.
  function cuaderno(s) {
    const deco = "";
    switch (s.tipo) {
      case "portada":
        return deco + `<div class="marco-torcido"></div>` + etiqueta(s.etiqueta) + si(s.antetitulo, `<div class="ante">${fmt(s.antetitulo)}</div>`) +
          titulo(s.titulo, "h1") + sub(s.subtitulo) + nota(s.nota);
      case "contenido":
        return si(s.numero, `<div class="num-fantasma">${esc(s.numero)}</div>`) + etiqueta(s.etiqueta) + titulo(s.titulo) +
          sub(s.antetitulo) + texto(s.texto) + (s.imagen ? portatil(s) : "") + nota(s.nota);
      case "lista":
        return etiqueta(s.etiqueta) + titulo(s.titulo) + sub(s.antetitulo) +
          `<ul class="checklist">${(s.items || []).map((it) => `<li><b>✓</b><span>${fmt(it)}</span></li>`).join("")}</ul>` + nota(s.nota);
      case "dato":
        return etiqueta(s.etiqueta) + si(s.antetitulo, `<div class="ante">${fmt(s.antetitulo)}</div>`) + `<div class="cifra">${esc(s.cifra)}</div>` +
          texto(s.texto) + fuente(s);
      case "cierre":
        return deco + etiqueta(s.etiqueta) + titulo(s.titulo) + texto(s.texto) +
          si(s.cta, `<div class="cta-bloque"><span>${fmt(s.cta)}</span>${si(s.cinta, `<small>${fmt(s.cinta)}</small>`)}${flecha("f-cta-abajo")}</div>`) + nota(s.nota);
    }
  }

  // POSTER: titular gigante, isotipo enorme de fondo, foto recortada en diagonal, píldoras.
  function poster(s) {
    const deco = "";
    const foto = s.imagen ? `<img class="foto-diagonal" src="${rutaImagen(s)}" alt="">` : (s.decoracion === "ninguna" ? "" : `<i class="deco-notas"></i>`);
    const ante = si(s.antetitulo, `<div class="ante">${fmt(s.antetitulo)}</div>`);
    switch (s.tipo) {
      case "portada":
        return deco + foto + etiqueta(s.etiqueta) + titulo(s.titulo, "h1") + sub(s.subtitulo) + nota(s.nota);
      case "contenido":
        return deco + foto + numero(s.numero) + etiqueta(s.etiqueta) + titulo(s.titulo) + ante + texto(s.texto) + nota(s.nota);
      case "lista":
        return deco + etiqueta(s.etiqueta) + titulo(s.titulo) + ante +
          `<div class="pildoras">${(s.items || []).map((it) => `<span class="pildora"><b></b>${fmt(it)}</span>`).join("")}</div>`;
      case "dato":
        return deco + foto + ante + `<div class="cifra">${esc(s.cifra)}</div>` + texto(s.texto) + fuente(s);
      case "cierre":
        return deco + `<img class="logo-grande" src="${logo(LOGO_FONDO[s._color])}" alt="Explora × Ucademy">` + etiqueta(s.etiqueta) + titulo(s.titulo) + texto(s.texto) +
          si(s.cta, `<div class="cta-boton">${fmt(s.cta)}<i class="flecha f-boton"></i></div>`);
    }
  }

  // FEED: la base plana del Instagram actual (pastilla lima, logo arriba, cuadrícula suave, titular con
  // resaltado) + un solo toque a mano por slide (`trazo: flecha | ovalo | ninguno`).
  function feed(s) {
    const pastilla = si(s.etiqueta, `<div class="pastilla">${fmt(s.etiqueta)}</div>`);
    // 29/10/2026 (Sandra: «la flecha de la portada no tiene sentido hacia dónde apunta»): de serie solo en el cierre, que señala el botón
    const trazo = s.trazo ?? (s.tipo === "cierre" ? "flecha" : "ninguno");
    if (!["flecha", "ovalo", "ninguno"].includes(trazo)) throw new Error(`trazo "${trazo}" no existe (usa: flecha, ovalo, ninguno)`);
    const toque = trazo === "flecha" ? flecha(`f-feed f-${s.tipo}`) : "";
    const tit = (h) => trazo === "ovalo"
      ? `<${h} class="titulo">${fmt(s.titulo).replace(/<em>(.+?)<\/em>/, '<em class="rodeado">$1<i class="ovalo"></i></em>')}</${h}>`
      : titulo(s.titulo, h);
    switch (s.tipo) {
      case "portada":
        return pastilla + `<div class="bloque">${tit("h1")}${sub(s.subtitulo)}${toque}</div>` + nota(s.nota);
      case "contenido":
        if (s.imagen && s.marco !== "portatil")
          return `<img class="foto-feed" src="${rutaImagen(s)}" alt="">` + pastilla +
            `<div class="bloque">${si(s.numero, `<div class="num-feed">${esc(s.numero)}</div>`)}${tit("h2")}${sub(s.antetitulo)}${texto(s.texto)}</div>` + nota(s.nota);
        return pastilla + `<div class="bloque">${si(s.numero, `<div class="num-feed">${esc(s.numero)}</div>`)}${tit("h2")}${sub(s.antetitulo)}${texto(s.texto)}${s.imagen ? portatil(s) : ""}${toque}</div>` + nota(s.nota);
      case "lista":
        return pastilla + `<div class="bloque">${tit("h2")}${sub(s.antetitulo)}` +
          `<ol class="lista-feed">${(s.items || []).map((it, n) => `<li><b>${dos(n + 1)}</b><span>${fmt(it)}</span></li>`).join("")}</ol>${toque}</div>` + nota(s.nota);
      case "dato":
        return pastilla + `<div class="bloque">${sub(s.antetitulo)}<div class="cifra">${esc(s.cifra)}</div>${texto(s.texto)}` +
          fuente(s) + `${toque}</div>`;
      case "cierre":
        return pastilla + `<div class="bloque">${tit("h2")}${texto(s.texto)}` +
          si(s.cta, `<div class="cta-feed"><span>${fmt(s.cta)}</span>${si(s.cinta, `<small>${fmt(s.cinta)}</small>`)}</div>`) + `${toque}</div>`;
    }
  }

  // ===== Plantillas nuevas (22/10/2026, Sandra: «hazme varios diseños, algunos más virales, otros más normales») =====
  // CHAT (viral): la duda del lead como mensaje que llega y la respuesta de Explora como mensaje que sale.
  function chat(s) {
    const yo = (t) => si(t, `<div class="burbuja sale">${parrafos(t)}<i class="hora">✓✓</i></div>`);
    const el = (t) => si(t, `<div class="burbuja llega">${fmt(t)}</div>`);
    const cab = `<div class="chat-cab"><b class="avatar">e</b><div><strong>Explora FP</strong><span>en línea</span></div></div>`;
    switch (s.tipo) {
      case "portada":
        return cab + etiqueta(s.etiqueta) + `<div class="chat-hilo">${el(s.subtitulo || "")}</div>` + titulo(s.titulo, "h1") + nota(s.nota);
      case "contenido":
        return cab + `<div class="chat-hilo">${el(s.titulo)}${yo(s.texto)}${s.antetitulo ? el(s.antetitulo) : ""}</div>` + nota(s.nota);
      case "lista":
        return cab + `<div class="chat-hilo">${el(s.titulo)}${(s.items || []).map((it) => `<div class="burbuja sale corta">${fmt(it)}</div>`).join("")}</div>`;
      case "dato":
        return cab + `<div class="chat-hilo">${el(s.antetitulo || "¿Y eso es verdad?")}<div class="burbuja sale dato"><div class="cifra">${esc(s.cifra)}</div>${texto(s.texto)}</div></div>`;
      case "cierre":
        return cab + `<div class="chat-hilo">${el(s.titulo)}${yo(s.texto)}</div>` +
          si(s.cta, `<div class="chat-escribe"><span>${fmt(s.cta)}</span><b>➤</b></div>`);
    }
  }

  // TUIT (viral): la frase como publicación de la cuenta, en una tarjeta blanca sobre el color.
  function tuit(s) {
    const tarjeta = (cuerpo, pie = "") => `<div class="tuit"><div class="tuit-cab"><b class="avatar">e</b><div><strong>Explora FP <i class="verif">✓</i></strong><span>@explorafp</span></div></div>${cuerpo}${pie}</div>`;
    const pie = `<div class="tuit-pie"><span>💬 312</span><span>🔁 1,2 mil</span><span>♥ 8,4 mil</span></div>`;
    switch (s.tipo) {
      case "portada":
        return etiqueta(s.etiqueta) + tarjeta(titulo(s.titulo, "h1") + sub(s.subtitulo), pie) + nota(s.nota);
      case "contenido":
        return tarjeta(titulo(s.titulo) + texto(s.texto)) + nota(s.nota);
      case "lista":
        return tarjeta(titulo(s.titulo) + `<ol class="tuit-lista">${(s.items || []).map((it, n) => `<li><b>${n + 1}.</b> ${fmt(it)}</li>`).join("")}</ol>`);
      case "dato":
        return tarjeta(si(s.antetitulo, `<div class="ante">${fmt(s.antetitulo)}</div>`) + `<div class="cifra">${esc(s.cifra)}</div>` + texto(s.texto));
      case "cierre":
        return tarjeta(titulo(s.titulo) + texto(s.texto) + si(s.cta, `<div class="tuit-cta">${fmt(s.cta)}</div>`), pie);
    }
  }

  // EDITORIAL (normal): como una revista. Número de índice grande y fino, raya, mucho aire.
  function editorial(s, i) {
    const indice = `<div class="indice">${dos((s._i || 0) + 1)}</div>`;
    switch (s.tipo) {
      case "portada":
        return si(s.etiqueta, `<div class="seccion">${fmt(s.etiqueta)}</div>`) + titulo(s.titulo, "h1") + `<hr>` + sub(s.subtitulo) + nota(s.nota);
      case "contenido":
        return indice + si(s.etiqueta, `<div class="seccion">${fmt(s.etiqueta)}</div>`) + titulo(s.titulo) + `<hr>` + texto(s.texto) + (s.imagen ? portatil(s) : "") + nota(s.nota);
      case "lista":
        return indice + titulo(s.titulo) + `<hr>` + `<ol class="ed-lista">${(s.items || []).map((it, n) => `<li><b>${dos(n + 1)}</b><span>${fmt(it)}</span></li>`).join("")}</ol>`;
      case "dato":
        return si(s.antetitulo, `<div class="seccion">${fmt(s.antetitulo)}</div>`) + `<div class="cifra">${esc(s.cifra)}</div><hr>` + texto(s.texto);
      case "cierre":
        return titulo(s.titulo) + `<hr>` + texto(s.texto) + si(s.cta, `<div class="ed-cta">${fmt(s.cta)} <b>→</b></div>`);
    }
  }

  // BLOQUES (normal): la slide partida en dos. Arriba el bloque de color con el titular; abajo, en claro, la explicación.
  function bloques(s) {
    const arriba = (inner) => `<div class="bq-arriba">${inner}</div>`;
    const abajo = (inner) => `<div class="bq-abajo">${inner}</div>`;
    switch (s.tipo) {
      case "portada":
        return arriba(etiqueta(s.etiqueta) + titulo(s.titulo, "h1")) + abajo(sub(s.subtitulo) + nota(s.nota));
      case "contenido":
        return arriba(si(s.numero, `<div class="bq-num">${esc(s.numero)}</div>`) + titulo(s.titulo)) + abajo(texto(s.texto) + sub(s.antetitulo) + nota(s.nota));
      case "lista":
        return arriba(titulo(s.titulo)) + abajo(`<ul class="bq-lista">${(s.items || []).map((it) => `<li>${fmt(it)}</li>`).join("")}</ul>`);
      case "dato":
        return arriba(si(s.antetitulo, `<div class="ante">${fmt(s.antetitulo)}</div>`) + `<div class="cifra">${esc(s.cifra)}</div>`) + abajo(texto(s.texto));
      case "cierre":
        return arriba(titulo(s.titulo)) + abajo(texto(s.texto) + si(s.cta, `<div class="bq-cta">${fmt(s.cta)}</div>`));
    }
  }

  // ===== RUTA (26/10/2026): réplica de las referencias de Sandra =====
  // Portada «La parte mala de estudiar online» (papel con cuadrícula y lomo), cuerpo «Aquí tienes a quién escribir» (verde,
  // titular y la plataforma en un portátil abajo), cuerpo numerado «02 · La metodología» (mitad foto/plataforma arriba con
  // número y sección, mitad clara abajo con titular, texto y frase a mano), «momento» (hora + titular + tarjeta de la
  // plataforma dibujada) y cierre «Nunca solo» (verde, logo centrado, frase a mano y banda lima con el CTA).
  // Titulares siempre en minúscula salvo la inicial (Sandra: «mayúsculas en los titulares nunca»). La letra «a mano» es
  // Besley cursiva (Sandra no sabe cuál era la de las referencias). _palabra_ = subrayado verde en el titular.
  const esPlataforma = (s) => /plataforma-/.test(String(s.imagen || ""));
  const rTit = (t, h = "h2") => `<${h} class="titulo">${fmt(t).replace(/_(.+?)_/g, '<u class="r-sub">$1</u>')}</${h}>`;
  const rPill = (t) => si(t, `<div class="r-pill">${fmt(t)}</div>`);
  const rMano = (t) => si(t, `<div class="r-mano">${fmt(t)}</div>`);
  const rSub = (t, s) => si(t, `<div class="subtitulo">${s.trazo === "ovalo" ? fmt(t).replace(/<em>(.+?)<\/em>/, '<em class="rodeado">$1<i class="ovalo"></i></em>') : fmt(t)}</div>`);
  const rLogo = (c, cl = "") => `<img class="r-logo ${cl}" src="${logo(c)}" alt="Explora × Ucademy">`;
  function ruta(s) {
    switch (s.tipo) {
      case "portada":
        return rPill(s.etiqueta) + rTit(s.titulo, "h1") + rSub(s.subtitulo, s) + rMano(s.nota);   // sin logo, como su referencia
      case "contenido": {
        if (s.numero) {
          // numerada: arriba la foto (o la plataforma en portátil sobre verde) con «02 · SECCIÓN» y el logo; abajo, en claro, el texto
          const arriba = s.imagen ? (esPlataforma(s) ? `<div class="r-arriba r-verde">${portatil(s)}</div>` : `<div class="r-arriba"><img class="r-foto" src="${rutaImagen(s)}" alt=""><i class="r-velo"></i></div>`)
            : `<div class="r-arriba r-verde"></div>`;
          return arriba + `<div class="r-seccion"><b>${esc(String(s.numero).padStart(2, "0"))}</b>${si(s.etiqueta, `<span>${fmt(s.etiqueta)}</span>`)}</div>` + rLogo("Blanco", "r-logo-arriba") +
            `<div class="r-abajo">${rTit(s.titulo)}${texto(s.texto)}${rMano(s.nota)}</div>`;
        }
        const img = s.imagen ? (esPlataforma(s) ? portatil(s) : `<img class="r-foto-caja" src="${rutaImagen(s)}" alt="">`) : "";
        return rLogo("Verde 03", "r-logo-esquina") + rPill(s.etiqueta) + rTit(s.titulo) + rSub(s.antetitulo, s) + texto(s.texto) + img + rMano(s.nota);
      }
      case "lista":
        return rLogo("Verde 01", "r-logo-esquina") + rPill(s.etiqueta) + rTit(s.titulo) + rSub(s.antetitulo, s) +
          `<ol class="r-lista">${(s.items || []).map((it, n) => `<li><b>${dos(n + 1)}</b><span>${fmt(it)}</span></li>`).join("")}</ol>` + rMano(s.nota);
      case "dato":
        return rLogo("Verde 03", "r-logo-esquina") + rPill(s.etiqueta) + si(s.antetitulo, `<div class="r-ante">${fmt(s.antetitulo)}</div>`) +
          (/[a-záéíóúñ]{4,}/i.test(String(s.cifra || "")) ? rTit(s.cifra) : `<div class="cifra">${esc(s.cifra)}</div>`) + texto(s.texto) + rMano(s.nota);
      case "cierre":
        return rLogo("Verde 03", "r-logo-centro") + rTit(s.titulo) + texto(s.texto) + rMano(s.nota ? s.nota + " ✳" : "") +
          si(s.cta, `<div class="r-banda"><span class="r-cta">${fmt(s.cta)}</span>${si(s.cinta, `<small>${fmt(s.cinta)}</small>`)}<i>→</i></div>`);
    }
  }

  // MOMENTO (tipo nuevo, 26/10/2026, referencia de Sandra «07:30 · mañana»): la hora en píldora, el titular, un texto y una
  // tarjeta de la plataforma DIBUJADA (no captura: se lee en el móvil). tarjeta: clase | mensaje | nota | aviso.
  const ICONOS_TARJETA = {
    clase: '<svg viewBox="0 0 48 48"><rect x="7" y="10" width="34" height="31" rx="5" fill="#fff" stroke="#1B3620" stroke-width="3"/><path d="M7 19h34" stroke="#1B3620" stroke-width="3"/><rect x="7" y="10" width="34" height="9" rx="4" fill="#C8433A"/><path d="M16 6v8M32 6v8" stroke="#1B3620" stroke-width="3" stroke-linecap="round"/><path d="M15 27h5M22 27h5M29 27h5M15 33h5M22 33h5" stroke="#1B3620" stroke-width="3" stroke-linecap="round"/></svg>',
    mensaje: '<svg viewBox="0 0 48 48"><path d="M8 12a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H21l-9 8v-8h-0a4 4 0 0 1-4-4z" fill="#fff" stroke="#1B3620" stroke-width="3" stroke-linejoin="round"/><circle cx="17" cy="20" r="2.6" fill="#1B3620"/><circle cx="24" cy="20" r="2.6" fill="#1B3620"/><circle cx="31" cy="20" r="2.6" fill="#1B3620"/></svg>',
    nota: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="#fff" stroke="#1B3620" stroke-width="3"/><path d="M16 24.5l5.5 5.5L33 18.5" fill="none" stroke="#2F9B3A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    aviso: '<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="15" fill="#fff" stroke="#1B3620" stroke-width="3"/><path d="M24 18v9l6 4" fill="none" stroke="#1B3620" stroke-width="3" stroke-linecap="round"/><path d="M12 9l-4 4M36 9l4 4" stroke="#1B3620" stroke-width="3" stroke-linecap="round"/></svg>'};
  const CABEZA_TARJETA = { clase: "Tu próxima clase", mensaje: "Mensaje de tu tutor", nota: "Nueva nota", aviso: "Recordatorio" };
  function momento(s, plantilla) {
    const k = ICONOS_TARJETA[s.tarjeta] ? s.tarjeta : "clase";
    const hora = si(s.hora, `<div class="r-hora">${fmt(s.hora)}</div>`);
    const tarjeta = `<div class="mo-tarjeta"><div class="mo-cab"><i></i>${esc(s.tarjetaCabecera || CABEZA_TARJETA[k])}</div>` +
      `<div class="mo-fila"><span class="mo-icono">${ICONOS_TARJETA[k]}</span><div class="mo-txt"><b>${fmt(s.tarjetaTitulo || "")}</b>${si(s.tarjetaTexto, `<span>${fmt(s.tarjetaTexto)}</span>`)}</div>` +
      si(s.boton, `<span class="mo-boton">${fmt(s.boton)} →</span>`) + `</div></div>`;
    return hora + (plantilla === "ruta" ? rTit(s.titulo) : titulo(s.titulo)) + si(s.texto, `<div class="subtitulo">${fmt(s.texto)}</div>`) + tarjeta;
  }

  const COMPOSICION = { feed, capas, cuaderno, poster, chat, tuit, editorial, bloques, ruta };

  // Tipos de cuerpo nuevos (23/10/2026). Misma estructura en todas las plantillas; el aspecto lo ponen los colores de cada una.
  //   mito: la frase falsa tachada y la verdad debajo · pregunta: la duda como mensaje y la respuesta
  //   pasos: 1 → 2 → 3 · comparacion: dos columnas · cita: frase grande entre comillas y quién la dice
  function tipoNuevo(s, plantilla) {
    // en feed la etiqueta es la pastilla de arriba (como en sus otras slides); en el resto, la etiqueta con óvalo
    const etiqueta = (t) => plantilla === "feed" ? si(t, `<div class="pastilla">${fmt(t)}</div>`) : etiquetaOvalo(t);
    const lis = (l) => (l || []).map((it) => `<li>${fmt(it)}</li>`).join("");
    switch (s.tipo) {
      case "mito":
        return etiqueta(s.etiqueta) + `<div class="tn-mito"><span class="tn-falso">${fmt(s.mito)}</span></div>` + titulo(s.titulo) + texto(s.texto);
      case "pregunta":
        return etiqueta(s.etiqueta) + `<div class="tn-chat"><div class="tn-llega">${fmt(s.pregunta)}</div><div class="tn-sale">${parrafos(s.respuesta || "")}</div></div>`;
      case "pasos":
        return etiqueta(s.etiqueta) + titulo(s.titulo) + `<ol class="tn-pasos">${(s.items || []).map((it, n) => `<li><b>${n + 1}</b><span>${fmt(it)}</span></li>`).join("")}</ol>`;
      case "comparacion":
        return etiqueta(s.etiqueta) + titulo(s.titulo) + `<div class="tn-comp"><div class="tn-col tn-a"><h3>${fmt(s.colA)}</h3><ul>${lis(s.itemsA)}</ul></div>` +
          `<div class="tn-col tn-b"><h3>${fmt(s.colB)}</h3><ul>${lis(s.itemsB)}</ul></div></div>`;
      case "cita":
        return etiqueta(s.etiqueta) + `<blockquote class="tn-cita"><p>${fmt(s.cita)}</p>${si(s.autor, `<cite>${fmt(s.autor)}</cite>`)}</blockquote>`;
      case "momento":
        return momento(s, plantilla);
    }
  }

  // Portada "notas": la textura manuscrita de marca de fondo a toda la slide y el titular en una esquina.
  // Vale para cualquier plantilla con `marco: notas`; en capas es la portada por defecto si no hay foto.
  const portadaNotas = (s) =>
    `<i class="textura-notas"></i>` + etiqueta(s.etiqueta) +
    `<div class="bloque-notas">${titulo(s.titulo, "h1")}${sub(s.subtitulo)}${nota(s.nota)}</div>`;

  // Portada de foto a sangre (como el feed actual): vale para cualquier plantilla con `marco: fondo`.
  const portadaFoto = (s, color) =>
    `<img class="foto-fondo" src="${rutaImagen(s)}" alt=""><div class="velo"></div>` +
    `<img class="logo-foto" src="${logo("Verde 03")}" alt="Explora × Ucademy">` +
    si(s.etiqueta, `<div class="pastilla">${fmt(s.etiqueta)}</div>`) +
    `<div class="bloque-foto">${titulo(s.titulo, "h1")}${sub(s.subtitulo)}</div>`;
  const logo = (color) => R.logo(color);

  // Retoques de diseño de UNA slide (campo `estilo`, CSS que escribe Claude desde el chat de la web; pedido de Sandra, oct-2026).
  // Se aplica solo a esa slide: cada selector se prefija con #estilo (la <section> de esa slide), que gana a las reglas de la plantilla.
  // Se quitan @-reglas, @import, url() externas y cualquier intento de cerrar el <style>.
  function estiloSlide(css) {
    let t = String(css || "").replace(/<\/?\s*style[^>]*>/gi, "").replace(/<[^>]*>/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/@import[^;]*;?/gi, "")
      .replace(/url\s*\(\s*['"]?(?!data:)[^)]*\)/gi, "none").replace(/expression\s*\(/gi, "(");
    for (let k = 0; k < 5 && /@[a-z-]+[^{;]*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/i.test(t); k++) t = t.replace(/@[a-z-]+[^{;]*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/gi, "");
    // solo salen las reglas «selector { declaraciones }»; cualquier otro texto se tira
    return [...t.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([m, sel, dec]) => {
      const sels = sel.split(",").map(x => x.trim()).filter(Boolean).map(x =>
        /^(\.slide|section|&|:scope)(?![\w-])/.test(x) ? x.replace(/^(\.slide|section|&|:scope)/, "#estilo") : "#estilo " + x);
      return sels.length ? sels.join(", ") + " {" + dec.replace(/[<>]/g, "") + "}\n" : "";
    }).join("").slice(0, 6000);
  }

  function html(plantilla, color, s, i, total, etiquetaCinta) {
    s._color = color; s._i = i;
    const fondoFoto = s.tipo === "portada" && s.imagen && s.marco === "fondo";
    // en feed, una slide de contenido con foto lleva la foto arriba: el logo va en blanco encima
    const fotoArriba = plantilla === "feed" && s.tipo === "contenido" && s.imagen && s.marco !== "portatil";
    const fondoNotas = s.tipo === "portada" && !fondoFoto && (s.marco === "notas" || (plantilla === "capas" && !s.imagen));
    const marca = (c) => `<img src="${logo(c)}" alt="Explora × Ucademy">`;
    const pag = `${si(etiquetaCinta, `${esc(etiquetaCinta)} · `)}${dos(i + 1)}`;
    const derecha = s.tipo === "cierre" && s.cinta ? `<span class="cinta-cta">${fmt(s.cinta)}</span>` : `<span class="pag">${pag}</span>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  ${R.cabeza(plantilla)}${s.estilo ? `<style>${estiloSlide(s.estilo)}</style>` : ""}
  </head><body><section${s.estilo ? ' id="estilo"' : ""} class="slide l-${plantilla} c-${color} tipo-${s.tipo}${s.trazo === "ninguno" ? " sin-trazo" : ""}${i % 2 === 1 && s.tipo !== "portada" ? " alterna" : ""}${plantilla === "feed" && s.tipo === "contenido" && s.imagen && s.marco !== "portatil" ? " con-foto-feed" : ""}${fondoNotas ? " notas-fondo" : ""}${fondoFoto ? " foto-sangre" : s.tipo === "portada" && s.imagen && s.marco !== "portatil" ? " con-foto" : ""}${plantilla === "ruta" && s.tipo === "contenido" && s.numero ? " r-numerada" : ""}">
  <div class="cabecera"><span>${pag}</span>${marca(fotoArriba ? "Blanco" : fondoNotas ? "Verde 03" : LOGO_FONDO[color])}</div>
  <div class="contenido">${fondoFoto ? portadaFoto(s, color) : fondoNotas ? portadaNotas(s) : (TIPOS_NUEVOS.includes(s.tipo) ? tipoNuevo(s, plantilla) : COMPOSICION[plantilla](s))}</div>${decoracion(s)}
  <div class="cinta">${plantilla === "cuaderno" && s.cta ? `<span class="cinta-cta">${fmt(s.cta)}</span>` : marca(LOGO_CINTA[color])}${plantilla === "cuaderno" && s.cta ? `<span class="pag">${fmt(s.cinta ?? "")}</span>` : derecha}</div>
  <div class="pie">${marca(LOGO_FONDO[color])}<span class="pag">${dos(i + 1)} / ${dos(total)}</span></div>
  </section></body></html>`;
  }

  function validar(c, fichero) {
    const errores = [];
    if (!PLANTILLAS.includes(c.plantilla)) errores.push(`plantilla "${c.plantilla}" no existe (usa: ${PLANTILLAS.join(", ")})`);
    if (!COLORES.includes(c.color)) errores.push(`color "${c.color}" no existe (usa: ${COLORES.join(", ")})`);
    if (!Array.isArray(c.slides) || !c.slides.length) errores.push("faltan slides");
    (c.slides || []).forEach((s, i) => {
      if (s.plantilla && !PLANTILLAS.includes(s.plantilla)) errores.push(`slide ${i + 1}: plantilla "${s.plantilla}" no existe`);
      if (s.color && !COLORES.includes(s.color)) errores.push(`slide ${i + 1}: color "${s.color}" no existe`);
      if (!TIPOS.includes(s.tipo)) errores.push(`slide ${i + 1}: tipo "${s.tipo}" no existe (usa: ${TIPOS.join(", ")})`);
    });
    if (c.slides?.length > 20) errores.push("Instagram admite 20 slides como máximo");
    if (errores.length) throw new Error(`${fichero}:\n  - ${errores.join("\n  - ")}`);
  }

  return { html, validar };
}
