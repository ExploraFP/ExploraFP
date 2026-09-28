// Genera carruseles de Instagram (PNG 1080×1350) a partir de ficheros YAML.
//   npm run render                      → todos los .yml de contenido/
//   npm run render -- contenido/x.yml   → solo esos
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as yaml from "js-yaml";
import { chromium } from "playwright";

import { crearMotor } from "./motor.js";

const RAIZ = resolve(import.meta.dirname);
const archivo = (rel) => pathToFileURL(join(RAIZ, rel));

// Trazos originales de marca aplicados como máscara (toman el color de la plantilla).
// Chrome exige CORS para las máscaras y file:// no lo cumple, por eso van incrustados en base64.
const dataUri = (ruta) => `url("data:image/png;base64,${readFileSync(join(RAIZ, ruta)).toString("base64")}")`;
const MASCARAS = `:root{--img-ovalo:${dataUri("assets/trazos/ovalo.png")};--img-flecha:${dataUri("assets/trazos/flecha.png")};` +
  `--img-notas:${dataUri("assets/trazos/notas.png")};--img-isotipo:${dataUri("assets/logos/Isotipo.png")}}`;

const { html, validar } = crearMotor({
  logo(color) {
    const f = [".png", ".webp", ".svg"].map((e) => join(RAIZ, "assets/logos", `Explora x Ucademy_Horizontal_${color} 1${e}`)).find(existsSync);
    if (!f) throw new Error(`falta el logo Explora x Ucademy_Horizontal_${color} 1 en assets/logos/`);
    return pathToFileURL(f);
  },
  imagen(ruta) {
    const f = resolve(RAIZ, "contenido", ruta);
    if (!existsSync(f)) throw new Error(`no encuentro la imagen ${ruta} (ruta relativa a contenido/)`);
    return pathToFileURL(f);
  },
  postit: () => archivo("assets/trazos/postit-100-online.png"),
  cabeza: (plantilla) => `<link rel="stylesheet" href="${archivo("plantillas/base.css")}">
<link rel="stylesheet" href="${archivo(`plantillas/${plantilla}.css`)}">
<link rel="stylesheet" href="${archivo("plantillas/colores.css")}">
<style>${MASCARAS}</style>`,
});

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
      const ancho = () => { const r = document.createRange(); r.selectNodeContents(c); return r.getBoundingClientRect().width; };
      let t = parseFloat(getComputedStyle(c).fontSize);
      while (ancho() > c.clientWidth && t > 80) c.style.fontSize = `${(t -= 6)}px`;
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
