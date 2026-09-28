// Genera carruseles de Instagram (PNG 1080×1350) a partir de ficheros YAML.
//   npm run render                      → todos los .yml de contenido/
//   npm run render -- contenido/x.yml   → solo esos
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as yaml from "js-yaml";
import { chromium } from "playwright";

const RAIZ = resolve(import.meta.dirname);
const PLANTILLAS = ["selva", "diario", "brecha"];
const TIPOS = ["portada", "contenido", "lista", "dato", "cierre"];

// Logo de la cinta por plantilla (ficheros del catálogo de marca, en assets/logos/).
const LOGO = {
  selva: "Explora x Ucademy_Horizontal_Verde 03 1.png",
  diario: "Explora x Ucademy_Horizontal_Blanco 1.png",
  brecha: "Explora x Ucademy_Horizontal_Negro 1.png",
};

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// *palabra* → resaltado; salto de línea → <br>
const fmt = (s) => esc(s).trim().replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
const parrafos = (s) => String(s).trim().split(/\n\s*\n/).map((p) => `<p>${fmt(p)}</p>`).join("");
const si = (v, html) => (v ? html : "");

function cuerpo(s, i) {
  switch (s.tipo) {
    case "portada":
      return si(s.antetitulo, `<div class="antetitulo">${fmt(s.antetitulo)}</div>`) +
        `<h1 class="titulo">${fmt(s.titulo)}</h1>` +
        si(s.subtitulo, `<div class="subtitulo">${fmt(s.subtitulo)}</div>`) +
        si(s.nota, `<div class="nota">${fmt(s.nota)}</div>`);
    case "contenido":
      return si(s.numero, `<div class="num">${esc(s.numero)}</div>`) +
        si(s.antetitulo, `<div class="antetitulo">${fmt(s.antetitulo)}</div>`) +
        `<h2 class="titulo">${fmt(s.titulo)}</h2>` +
        si(s.texto, `<div class="texto">${parrafos(s.texto)}</div>`) +
        si(s.nota, `<div class="nota">${fmt(s.nota)}</div>`);
    case "lista":
      return si(s.antetitulo, `<div class="antetitulo">${fmt(s.antetitulo)}</div>`) +
        `<h2 class="titulo">${fmt(s.titulo)}</h2>` +
        `<ul class="lista">${(s.items || []).map((it, n) => `<li data-n="${String(n + 1).padStart(2, "0")}">${fmt(it)}</li>`).join("")}</ul>` +
        si(s.nota, `<div class="nota">${fmt(s.nota)}</div>`);
    case "dato":
      return si(s.antetitulo, `<div class="antetitulo">${fmt(s.antetitulo)}</div>`) +
        `<div class="cifra">${esc(s.cifra)}</div>` +
        si(s.texto, `<div class="texto">${parrafos(s.texto)}</div>`) +
        si(s.fuente, `<div class="fuente">Fuente: ${esc(s.fuente)}</div>`);
    case "cierre":
      return si(s.antetitulo, `<div class="antetitulo">${fmt(s.antetitulo)}</div>`) +
        `<h2 class="titulo">${fmt(s.titulo)}</h2>` +
        si(s.texto, `<div class="texto">${parrafos(s.texto)}</div>`) +
        si(s.cta, `<div class="cta">${fmt(s.cta)}</div>`);
  }
}

function html(plantilla, s, i, total) {
  const logo = join(RAIZ, "assets/logos", LOGO[plantilla]);
  const marca = existsSync(logo)
    ? `<img src="${pathToFileURL(logo)}" alt="Explora × Ucademy">`
    : `<span class="logo-texto">[logo] Explora <small>× Ucademy</small></span>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="stylesheet" href="${pathToFileURL(join(RAIZ, "plantillas/base.css"))}">
<link rel="stylesheet" href="${pathToFileURL(join(RAIZ, `plantillas/${plantilla}.css`))}">
</head><body><section class="slide tipo-${s.tipo}"><div class="contenido">${cuerpo(s, i)}</div>
${i === 0 && total > 1 ? `<div class="desliza">desliza →</div>` : ""}
<div class="cinta">${marca}<span class="pag">${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span></div>
</section></body></html>`;
}

function validar(c, fichero) {
  const errores = [];
  if (!PLANTILLAS.includes(c.plantilla)) errores.push(`plantilla "${c.plantilla}" no existe (usa: ${PLANTILLAS.join(", ")})`);
  if (!Array.isArray(c.slides) || !c.slides.length) errores.push("faltan slides");
  (c.slides || []).forEach((s, i) => {
    if (!TIPOS.includes(s.tipo)) errores.push(`slide ${i + 1}: tipo "${s.tipo}" no existe (usa: ${TIPOS.join(", ")})`);
  });
  if (c.slides?.length > 20) errores.push("Instagram admite 20 slides como máximo");
  if (errores.length) throw new Error(`${fichero}:\n  - ${errores.join("\n  - ")}`);
}

const args = process.argv.slice(2);
const ficheros = args.length ? args : readdirSync(join(RAIZ, "contenido")).filter((f) => /\.ya?ml$/.test(f)).map((f) => join(RAIZ, "contenido", f));

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1350 } });
let avisos = 0;

for (const f of ficheros) {
  const c = yaml.load(readFileSync(f, "utf8"));
  validar(c, f);
  const nombre = basename(f).replace(/\.ya?ml$/, "");
  const dir = join(RAIZ, "salida", nombre);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const pngs = [];

  for (const [i, s] of c.slides.entries()) {
    const tmp = join(dir, `.slide.html`);
    writeFileSync(tmp, html(c.plantilla, s, i, c.slides.length));
    await pagina.goto(pathToFileURL(tmp).href);
    await pagina.evaluate(() => document.fonts.ready);
    // La cifra gigante se encoge hasta caber en una línea.
    await pagina.evaluate(() => {
      const c = document.querySelector(".cifra");
      if (!c) return;
      const max = 1080 - 96 - 90;
      let t = parseFloat(getComputedStyle(c).fontSize);
      while (c.scrollWidth > max && t > 80) c.style.fontSize = `${(t -= 6)}px`;
    });
    // Aviso si el texto se sale del área útil (encima de la cinta).
    const sobra = await pagina.evaluate(() => {
      const r = document.querySelector(".contenido").getBoundingClientRect();
      const tope = document.querySelector(".cinta").getBoundingClientRect().top - 30;
      return Math.round(Math.max(r.bottom - tope, 60 - r.top, 0));
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

  console.log(`✓ ${nombre}: ${pngs.length} slides (${c.plantilla}) → salida/${nombre}/`);
}

await navegador.close();
if (avisos) { console.warn(`\n${avisos} slide(s) con texto desbordado.`); process.exitCode = 1; }
