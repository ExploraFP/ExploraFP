// Motor de diseño de los carruseles: convierte una slide (objeto) en el HTML de 1080×1350.
// Lo comparten el generador de PNG (render.js, Node) y la herramienta web (sin dependencias).
// R resuelve los recursos según dónde se ejecute:
//   R.logo(color) · R.imagen(ruta) · R.postit() → URL;  R.cabeza(plantilla) → <link>/<style> de la cabeza.
export const PLANTILLAS = ["feed", "capas", "cuaderno", "poster"];
export const COLORES = ["verde01", "verde02", "blanco", "noche", "lima", "verde"];
export const TIPOS = ["portada", "contenido", "lista", "dato", "cierre"];

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
  const numero = (n) => si(n, `<div class="num"><span>${esc(n)}</span><i class="ovalo"></i></div>`);
  const flecha = (clase) => `<i class="flecha ${clase}"></i>`;
  const titulo = (t, h = "h2") => `<${h} class="titulo">${fmt(t)}</${h}>`;
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
          si(!sinDeco, flecha("f-portada-1")) +
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
      case "dato":
        return `<div class="cabeza">${etiqueta(s.etiqueta)}${sub(s.antetitulo)}</div>` +
          `<div class="pila"><div class="papel"></div><div class="caja caja-dato"><div class="cifra">${esc(s.cifra)}</div>${texto(s.texto)}` +
          si(s.fuente, `<div class="fuente">Fuente: ${esc(s.fuente)}</div>`) + `</div>${si(!sinDeco, flecha("f-dato"))}</div>`;
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
          texto(s.texto) + si(s.fuente, `<div class="fuente">Fuente: ${esc(s.fuente)}</div>`);
      case "cierre":
        return deco + etiqueta(s.etiqueta) + titulo(s.titulo) + texto(s.texto) +
          si(s.cta, `<div class="cta-bloque"><span>${fmt(s.cta)}</span>${si(s.cinta, `<small>${fmt(s.cinta)}</small>`)}</div>`) + nota(s.nota);
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
        return deco + foto + ante + `<div class="cifra">${esc(s.cifra)}</div>` + texto(s.texto) + si(s.fuente, `<div class="fuente">Fuente: ${esc(s.fuente)}</div>`);
      case "cierre":
        return deco + `<img class="logo-grande" src="${logo(LOGO_FONDO[s._color])}" alt="Explora × Ucademy">` + etiqueta(s.etiqueta) + titulo(s.titulo) + texto(s.texto) +
          si(s.cta, `<div class="cta-boton">${fmt(s.cta)}<i class="flecha f-boton"></i></div>`);
    }
  }

  // FEED: la base plana del Instagram actual (pastilla lima, logo arriba, cuadrícula suave, titular con
  // resaltado) + un solo toque a mano por slide (`trazo: flecha | ovalo | ninguno`).
  function feed(s) {
    const pastilla = si(s.etiqueta, `<div class="pastilla">${fmt(s.etiqueta)}</div>`);
    const trazo = s.trazo ?? (s.tipo === "portada" || s.tipo === "cierre" ? "flecha" : "ninguno");
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
          si(s.fuente, `<div class="fuente">Fuente: ${esc(s.fuente)}</div>`) + `${toque}</div>`;
      case "cierre":
        return pastilla + `<div class="bloque">${tit("h2")}${texto(s.texto)}` +
          si(s.cta, `<div class="cta-feed"><span>${fmt(s.cta)}</span>${si(s.cinta, `<small>${fmt(s.cinta)}</small>`)}</div>`) + `${toque}</div>`;
    }
  }

  const COMPOSICION = { feed, capas, cuaderno, poster };

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
    s._color = color;
    const fondoFoto = s.tipo === "portada" && s.imagen && s.marco === "fondo";
    // en feed, una slide de contenido con foto lleva la foto arriba: el logo va en blanco encima
    const fotoArriba = plantilla === "feed" && s.tipo === "contenido" && s.imagen && s.marco !== "portatil";
    const fondoNotas = s.tipo === "portada" && !fondoFoto && (s.marco === "notas" || (plantilla === "capas" && !s.imagen));
    const marca = (c) => `<img src="${logo(c)}" alt="Explora × Ucademy">`;
    const pag = `${si(etiquetaCinta, `${esc(etiquetaCinta)} · `)}${dos(i + 1)}`;
    const derecha = s.tipo === "cierre" && s.cinta ? `<span class="cinta-cta">${fmt(s.cinta)}</span>` : `<span class="pag">${pag}</span>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  ${R.cabeza(plantilla)}${s.estilo ? `<style>${estiloSlide(s.estilo)}</style>` : ""}
  </head><body><section${s.estilo ? ' id="estilo"' : ""} class="slide l-${plantilla} c-${color} tipo-${s.tipo}${s.trazo === "ninguno" ? " sin-trazo" : ""}${plantilla === "feed" && s.tipo === "contenido" && s.imagen && s.marco !== "portatil" ? " con-foto-feed" : ""}${fondoNotas ? " notas-fondo" : ""}${fondoFoto ? " foto-sangre" : s.tipo === "portada" && s.imagen && s.marco !== "portatil" ? " con-foto" : ""}">
  <div class="cabecera"><span>${pag}</span>${marca(fotoArriba ? "Blanco" : LOGO_FONDO[color])}</div>
  <div class="contenido">${fondoFoto ? portadaFoto(s, color) : fondoNotas ? portadaNotas(s) : COMPOSICION[plantilla](s)}</div>${decoracion(s)}
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
