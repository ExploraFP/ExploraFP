// Genera carruseles de Instagram (PNG 1080×1350) a partir de ficheros YAML.
//   npm run render                      → todos los .yml de contenido/
//   npm run render -- contenido/x.yml   → solo esos
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as yaml from "js-yaml";
import { chromium } from "playwright";

const RAIZ = resolve(import.meta.dirname);
// 3 composiciones × 4 colores, combinables libremente (y por slide).
const PLANTILLAS = ["capas", "cuaderno", "poster"];
const COLORES = ["noche", "lima", "verde", "blanco"];
const TIPOS = ["portada", "contenido", "lista", "dato", "cierre"];

// Logos del catálogo de marca (assets/logos/): uno para ir sobre la cinta y otro sobre el fondo.
const LOGO_CINTA = { noche: "Negro", lima: "Verde 03", verde: "Verde 03", blanco: "Verde 01" };
const LOGO_FONDO = { noche: "Verde 03", lima: "Verde 01", verde: "Negro", blanco: "Verde 01" };

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// *palabra* → resaltado; salto de línea → <br>
const fmt = (s) => esc(s).trim().replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
const parrafos = (s) => String(s).trim().split(/\n\s*\n/).map((p) => `<p>${fmt(p)}</p>`).join("");
const si = (v, html) => (v ? html : "");
const dos = (n) => String(n).padStart(2, "0");
const archivo = (rel) => pathToFileURL(join(RAIZ, rel));

// Trazos originales de marca (assets/trazos/) aplicados como máscara: toman el color de la plantilla.
// Chrome exige CORS para las máscaras y file:// no lo cumple, por eso van incrustados en base64.
const dataUri = (ruta) => `url("data:image/png;base64,${readFileSync(join(RAIZ, ruta)).toString("base64")}")`;
const MASCARAS = `:root{--img-ovalo:${dataUri("assets/trazos/ovalo.png")};--img-flecha:${dataUri("assets/trazos/flecha.png")};` +
  `--img-notas:${dataUri("assets/trazos/notas.png")};--img-isotipo:${dataUri("assets/logos/Isotipo.png")}}`;

const etiqueta = (t) => si(t, `<div class="etiqueta"><span>${fmt(t)}</span><i class="ovalo"></i></div>`);
const numero = (n) => si(n, `<div class="num"><span>${esc(n)}</span><i class="ovalo"></i></div>`);
const flecha = (clase) => `<i class="flecha ${clase}"></i>`;
const titulo = (t, h = "h2") => `<${h} class="titulo">${fmt(t)}</${h}>`;
const sub = (t) => si(t, `<div class="subtitulo">${fmt(t)}</div>`);
const texto = (t) => si(t, `<div class="texto">${parrafos(t)}</div>`);
const nota = (t) => si(t, `<div class="nota">${fmt(t)}</div>`);

// Imagen: rutas relativas a contenido/. marco: portatil | foto (por defecto)
function rutaImagen(s) {
  const ruta = resolve(RAIZ, "contenido", s.imagen);
  if (!existsSync(ruta)) throw new Error(`no encuentro la imagen ${s.imagen} (ruta relativa a contenido/)`);
  return pathToFileURL(ruta);
}
const portatil = (s) => `<div class="portatil"><div class="pantalla"><img src="${rutaImagen(s)}" alt=""></div><div class="base"></div></div>`;

// Decoraciones extra. `decoracion: postit | notas | isotipo` (o lista), `ninguna` quita las de serie.
const DECORACIONES = ["isotipo", "notas", "postit"];
function decoracion(s) {
  const d = s.decoracion === "ninguna" ? [] : [].concat(s.decoracion ?? []);
  const malas = d.filter((x) => !DECORACIONES.includes(x));
  if (malas.length) throw new Error(`decoracion "${malas}" no existe (usa: ${DECORACIONES.join(", ")}, ninguna)`);
  return d.map((x) => x === "postit"
    ? `<img class="postit" src="${archivo("assets/trazos/postit-100-online.png")}" alt="">`
    : `<i class="deco-${x}"></i>`).join("");
}

// CAPAS: fondo → papel torcido → caja de color → trazos y pegatinas.
function capas(s) {
  const sinDeco = s.decoracion === "ninguna";
  switch (s.tipo) {
    case "portada":
      if (s.imagen && s.marco !== "portatil") {
        return `<img class="foto-portada" src="${rutaImagen(s)}" alt="">` + etiqueta(s.etiqueta) +
          si(!sinDeco, flecha("f-portada-1") + flecha("f-portada-2")) +
          `<div class="caja caja-portada">${titulo(s.titulo, "h1")}${sub(s.subtitulo)}</div>`;
      }
      return si(!sinDeco, `<div class="papel papel-portada"><i class="deco-notas"></i></div><i class="deco-isotipo"></i>` + flecha("f-portada-1")) +
        `<div class="cabeza">${etiqueta(s.etiqueta)}</div>` +
        `<div class="caja caja-portada">${titulo(s.titulo, "h1")}${sub(s.subtitulo)}${nota(s.nota)}</div>`;
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
  const deco = s.decoracion === "ninguna" ? "" : `<i class="deco-isotipo"></i>`;
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
      return deco + etiqueta(s.etiqueta) + titulo(s.titulo) + texto(s.texto) + nota(s.nota);
  }
}

// POSTER: titular gigante, isotipo enorme de fondo, foto recortada en diagonal, píldoras.
function poster(s) {
  const deco = s.decoracion === "ninguna" ? "" : `<i class="deco-isotipo"></i>`;
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

const COMPOSICION = { capas, cuaderno, poster };

// Portada de foto a sangre (como el feed actual): vale para cualquier plantilla con `marco: fondo`.
const portadaFoto = (s, color) =>
  `<img class="foto-fondo" src="${rutaImagen(s)}" alt=""><div class="velo"></div>` +
  `<img class="logo-foto" src="${logo("Verde 03")}" alt="Explora × Ucademy">` +
  si(s.etiqueta, `<div class="pastilla">${fmt(s.etiqueta)}</div>`) +
  `<div class="bloque-foto">${titulo(s.titulo, "h1")}${sub(s.subtitulo)}</div>`;
const logo = (color) => {
  const f = [".png", ".webp", ".svg"].map((e) => join(RAIZ, "assets/logos", `Explora x Ucademy_Horizontal_${color} 1${e}`)).find(existsSync);
  if (!f) throw new Error(`falta el logo Explora x Ucademy_Horizontal_${color} 1 en assets/logos/`);
  return pathToFileURL(f);
};

function html(plantilla, color, s, i, total, etiquetaCinta) {
  s._color = color;
  const fondoFoto = s.tipo === "portada" && s.imagen && s.marco === "fondo";
  const marca = (c) => `<img src="${logo(c)}" alt="Explora × Ucademy">`;
  const pag = `${si(etiquetaCinta, `${esc(etiquetaCinta)} · `)}${dos(i + 1)}`;
  const derecha = s.tipo === "cierre" && s.cinta ? `<span class="cinta-cta">${fmt(s.cinta)}</span>` : `<span class="pag">${pag}</span>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="stylesheet" href="${archivo("plantillas/base.css")}">
<link rel="stylesheet" href="${archivo(`plantillas/${plantilla}.css`)}">
<link rel="stylesheet" href="${archivo("plantillas/colores.css")}">
<style>${MASCARAS}</style>
</head><body><section class="slide l-${plantilla} c-${color} tipo-${s.tipo}${fondoFoto ? " foto-sangre" : s.tipo === "portada" && s.imagen && s.marco !== "portatil" ? " con-foto" : ""}">
<div class="cabecera"><span>${pag}</span>${marca(LOGO_FONDO[color])}</div>
<div class="contenido">${fondoFoto ? portadaFoto(s, color) : COMPOSICION[plantilla](s)}</div>${decoracion(s)}
${i === 0 && total > 1 ? `<div class="desliza">desliza →</div>` : ""}
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

const args = process.argv.slice(2);
const ficheros = args.length ? args : readdirSync(join(RAIZ, "contenido")).filter((f) => /\.ya?ml$/.test(f)).map((f) => join(RAIZ, "contenido", f));

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1350 } });
let avisos = 0, errores = 0;

for (const f of ficheros) {
  let c;
  try { c = yaml.load(readFileSync(f, "utf8")); validar(c, f); }
  catch (e) { errores++; console.error(`✗ ${basename(f)}: ${e.message.split("\n").slice(0, 4).join("\n  ")}`); continue; }
  const nombre = basename(f).replace(/\.ya?ml$/, "");
  const dir = join(RAIZ, "salida", nombre);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const pngs = [];

  for (const [i, s] of c.slides.entries()) {
    const tmp = join(dir, `.slide.html`);
    writeFileSync(tmp, html(s.plantilla || c.plantilla, s.color || c.color, s, i, c.slides.length, c.cinta));
    await pagina.goto(pathToFileURL(tmp).href);
    await pagina.evaluate(() => document.fonts.ready);
    // La cifra gigante se encoge hasta caber en una línea.
    await pagina.evaluate(() => {
      const c = document.querySelector(".cifra");
      if (!c) return;
      const max = c.parentElement.clientWidth - 110;
      let t = parseFloat(getComputedStyle(c).fontSize);
      while (c.scrollWidth > max && t > 80) c.style.fontSize = `${(t -= 6)}px`;
    });
    // Aviso si el texto se sale del área útil (encima de la cinta).
    const sobra = await pagina.evaluate(() => {
      if (document.querySelector(".foto-sangre")) {
        const b = document.querySelector(".bloque-foto").getBoundingClientRect();
        return Math.round(Math.max(b.bottom - 1310, 200 - b.top, 0));
      }
      const portada = document.querySelector(".tipo-portada");
      const cinta = document.querySelector(".cinta");
      const tope = (cinta.offsetParent ? cinta.getBoundingClientRect().top : 1350) - (portada ? 0 : 20);
      const bloques = [...document.querySelectorAll(".contenido > :not(.papel):not(.flecha):not(img):not(i), .caja")];
      const fondo = Math.max(...bloques.map((b) => b.getBoundingClientRect().bottom));
      const arriba = Math.min(...bloques.map((b) => b.getBoundingClientRect().top));
      return Math.round(Math.max(fondo - tope, 40 - arriba, 0));
    });
    if (sobra > 0) { avisos++; console.warn(`  ⚠ ${nombre} slide ${i + 1}: el texto no cabe (${sobra}px). Recórtalo.`); }
    const png = join(dir, `${String(i + 1).padStart(2, "0")}.png`);
    await pagina.screenshot({ path: png });
    pngs.push(png);
    rmSync(tmp);
  }

  if (c.copy) writeFileSync(join(dir, "copy.txt"), String(c.copy).trim() + "\n");

  // Hoja de contactos para revisar el carrusel de un vistazo.
  const cols = Math.min(pngs.length, 5), filas = Math.ceil(pngs.length / cols), w = 324, h = 405, g = 16;
  await pagina.setViewportSize({ width: cols * (w + g) + g, height: filas * (h + g) + g });
  await pagina.setContent(`<body style="margin:0;background:#ddd;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:${g}px;padding:${g}px">${pngs
    .map((p) => `<img src="data:image/png;base64,${readFileSync(p).toString("base64")}" style="width:${w}px;height:${h}px;display:block">`).join("")}</body>`);
  await pagina.screenshot({ path: join(dir, "_resumen.png"), fullPage: true });
  await pagina.setViewportSize({ width: 1080, height: 1350 });

  console.log(`✓ ${nombre}: ${pngs.length} slides (${c.plantilla} · ${c.color}) → salida/${nombre}/`);
}

await navegador.close();
if (avisos) console.warn(`\n${avisos} slide(s) con texto desbordado.`);
if (errores) console.error(`${errores} carrusel(es) con errores.`);
if (avisos || errores) process.exitCode = 1;
