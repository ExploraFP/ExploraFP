// Construye la herramienta web (banco de carruseles + estudio de producción) en web/dist/.
//   node web/construir.mjs
// Parte de la página publicada del banco (web/banco-base.html, se refresca leyendo el artifact)
// y le añade el estudio, el motor de diseño compartido y los recursos (fotos, logos, trazos, fuentes).
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const RAIZ = resolve(import.meta.dirname, "..");
const WEB = join(RAIZ, "web"), DIST = join(WEB, "dist");
rmSync(DIST, { recursive: true, force: true });
for (const d of ["fotos", "logos", "trazos", "fuentes"]) mkdirSync(join(DIST, d), { recursive: true });

// Fotos del banco de imágenes, con la descripción que usa Claude para elegir.
const DESC = {
  "foto-globo-diploma": "globo terráqueo, título enrollado con lazo rojo y libros (homologación, títulos, estudiar fuera)",
  "foto-grupo-estudiantes": "grupo de estudiantes diversos riendo al aire libre con carpetas (comunidad, éxito, juventud)",
  "foto-chica-cascos-portatil": "chica sonriente con cascos estudiando en portátil en casa (estudiar online, rutina)",
  "foto-chico-saluda-portatil": "chico saludando en videollamada con portátil en biblioteca (tutor, clase online, contacto)",
  "foto-chica-biblioteca-portatil": "chica sonriente con portátil en biblioteca (estudiar, motivación)",
  "foto-web-alumnos": "dos chicos mirando juntos una pantalla (aprender en equipo, curiosidad)",
  "foto-libreta-apuntes": "libreta con apuntes a mano y bolígrafo (organizarse, estudiar, planificar)",
  "foto-chica-riendo-exterior": "chica riendo al sol al aire libre (libertad, alivio, cambio de vida)",
  "foto-chica-gafas-portatil-parque": "chica con gafas de sol y portátil en un parque (estudiar donde quieras, flexibilidad)",
  "foto-chica-escritorio-sonrie": "chica sonriente en su escritorio mirando a cámara (tutora, testimonio, cercanía)",
  "foto-chica-agobiada-examen": "chica agobiada con la mano en la cabeza escribiendo (estrés, lo malo, bloqueo, exámenes)",
};
const FOTOS = [];
const nav = await chromium.launch();
const pag = await nav.newPage();
for (const f of readdirSync(join(RAIZ, "contenido/img")).filter((f) => /^foto-.*\.(jpe?g|png|webp)$/.test(f)).sort()) {
  const clave = f.replace(/\.[^.]+$/, "");
  const datos = await pag.evaluate(async (src) => {
    const i = new Image(); i.src = src; await i.decode();
    const k = Math.min(1, 1500 / Math.max(i.width, i.height));
    const c = document.createElement("canvas"); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
    c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.84);
  }, `data:image/jpeg;base64,${readFileSync(join(RAIZ, "contenido/img", f)).toString("base64")}`);
  writeFileSync(join(DIST, "fotos", clave + ".jpg"), Buffer.from(datos.split(",")[1], "base64"));
  FOTOS.push({ ruta: `fotos/${clave}.jpg`, desc: DESC[clave] || clave.replace(/^foto-/, "").replace(/-/g, " ") });
}
await nav.close();

// Logos (nombre en minúsculas y con guiones: "verde-01.webp") y trazos.
for (const f of readdirSync(join(RAIZ, "assets/logos"))) {
  const m = f.match(/^Explora x Ucademy_Horizontal_(.+) 1\.(webp|png)$/);
  if (m) copyFileSync(join(RAIZ, "assets/logos", f), join(DIST, "logos", m[1].toLowerCase().replace(/\s+/g, "-") + ".webp"));
}
copyFileSync(join(RAIZ, "assets/trazos/ovalo.png"), join(DIST, "trazos/ovalo.png"));
copyFileSync(join(RAIZ, "assets/trazos/flecha.png"), join(DIST, "trazos/flecha.png"));
copyFileSync(join(RAIZ, "assets/trazos/notas.png"), join(DIST, "trazos/notas.png"));
copyFileSync(join(RAIZ, "assets/trazos/postit-100-online.png"), join(DIST, "trazos/postit.png"));
copyFileSync(join(RAIZ, "assets/logos/Isotipo.png"), join(DIST, "trazos/isotipo.png"));

// Fuentes: las del repositorio + Gravity si está (no va en git por licencia).
for (const f of readdirSync(join(RAIZ, "fonts"))) copyFileSync(join(RAIZ, "fonts", f), join(DIST, "fuentes", f));
if (!existsSync(join(RAIZ, "fonts/GravityCondensed.otf"))) console.warn("⚠ Sin fonts/GravityCondensed.otf: la web usará Archivo en los titulares.");

// CSS del motor, con rutas relativas a la página.
const css = (f) => readFileSync(join(RAIZ, "plantillas", f), "utf8").replace(/url\("\.\.\/fonts\//g, 'url("fuentes/');
const MOTOR_CSS = {
  base: css("base.css"), feed: css("feed.css"), capas: css("capas.css"), cuaderno: css("cuaderno.css"),
  poster: css("poster.css"), colores: css("colores.css"),
  mascaras: ':root{--img-ovalo:url("trazos/ovalo.png");--img-flecha:url("trazos/flecha.png");--img-notas:url("trazos/notas.png");--img-isotipo:url("trazos/isotipo.png")}',
};

// Motor compartido, sin las palabras de módulo.
const motor = readFileSync(join(RAIZ, "motor.js"), "utf8").replace(/^export /gm, "");

// Montaje sobre la página del banco.
let h = readFileSync(join(WEB, "banco-base.html"), "utf8");
const cambiar = (de, a) => { if (!h.includes(de)) throw new Error("No encuentro en el banco: " + de.slice(0, 60)); h = h.replace(de, () => a); };
cambiar('<button data-v="ideas" aria-current="true">Ideas</button>',
  '<button data-v="ideas" aria-current="true">Matriz</button>\n      <button data-v="producir">Producción</button>\n      <button data-v="hechos">Inventario</button>');
cambiar('<button data-v="inventario">Inventario</button>', '');
// Cabecera de Datos con el mismo formato que las demás pestañas.
cambiar(`'<p>Los 16 hechos con fuente comprobada. Si una cifra no está aquí, no sale en un carrusel.</p></div></div>';`,
  `'</div>' +
    '<div class="vstats"><div class="vstat ok"><b>' + DATOS.length + '</b><span>datos con fuente</span></div></div></div>';`);
// Botón claro/oscuro con un icono limpio (luna) en vez del carácter ◐.
cambiar('aria-label="Cambiar entre claro y oscuro">◐</button>',
  'aria-label="Cambiar entre claro y oscuro"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg></button>');
// Icono de la pestaña: el mismo abanico de slides de la cabecera.
const ICONO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><rect width="44" height="44" rx="10" fill="#1B3620"/>' +
  '<rect x="5" y="9" width="21" height="27" rx="3" fill="#4CCD4B" transform="rotate(-14 15 22)"/>' +
  '<rect x="12" y="7" width="21" height="27" rx="3" fill="#EDFEC3" transform="rotate(-3 22 20)"/>' +
  '<rect x="19" y="8" width="21" height="27" rx="3" fill="#fff" transform="rotate(9 29 21)"/>' +
  '<rect x="22.5" y="14" width="11" height="3.2" rx="1.6" fill="#366B40" transform="rotate(9 29 21)"/></svg>';
cambiar('<title>Banco de carruseles</title>', '<title>Banco de carruseles</title>\n<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' + encodeURIComponent(ICONO) + '">');
// Marca de la herramienta: icono de slides en abanico + nombre en Gravity + logo real de Explora × Ucademy.
cambiar('<div class="mark">\n      <b>Banco d<i>e</i> carruseles</b>\n      <span>Explora <em>×</em> Ucademy</span>\n    </div>',
  '<div class="mark mk"><svg class="mk-ico" viewBox="0 0 44 44" aria-hidden="true">' +
  '<rect x="5" y="9" width="21" height="27" rx="3" fill="#4CCD4B" transform="rotate(-14 15 22)"/>' +
  '<rect x="12" y="7" width="21" height="27" rx="3" fill="#EDFEC3" transform="rotate(-3 22 20)"/>' +
  '<rect x="19" y="8" width="21" height="27" rx="3" fill="#fff" transform="rotate(9 29 21)"/>' +
  '<rect x="22.5" y="14" width="11" height="3.2" rx="1.6" fill="#366B40" transform="rotate(9 29 21)"/>' +
  '<rect x="22.5" y="19.5" width="14" height="2" rx="1" fill="#85E159" transform="rotate(9 29 21)"/>' +
  '<rect x="22.5" y="23.5" width="9" height="2" rx="1" fill="#85E159" transform="rotate(9 29 21)"/></svg>' +
  '<span class="mk-txt"><b>Banco de carruseles</b><img src="logos/blanco.webp" alt="Explora × Ucademy"></span></div>');
cambiar('<div class="toast" id="toast" role="status" aria-live="polite"></div>',
  '<div class="toast" id="toast" role="status" aria-live="polite"></div>\n<div class="est-editor" id="est-editor" hidden></div>');
cambiar("<script>\nconst CATALOGO", `<style>\n${readFileSync(join(WEB, "estudio.css"), "utf8")}\n${readFileSync(join(WEB, "matriz.css"), "utf8")}</style>\n<script>\nconst CATALOGO`);
const script = `<script>\n/* ===== motor de diseño compartido (motor.js) ===== */\n${motor}\n` +
  `const MOTOR_CSS = ${JSON.stringify(MOTOR_CSS)};\nconst FOTOS = ${JSON.stringify(FOTOS)};\n` +
  `const HOOKS = ${existsSync(join(WEB, 'hooks.json')) ? readFileSync(join(WEB, 'hooks.json'), 'utf8').trim() : '{}'};\n` +
  `${readFileSync(join(WEB, "estudio.js"), "utf8")}\n${readFileSync(join(WEB, "matriz.js"), "utf8")}\nrender();\n</script>\n`;
cambiar("</body></html>", script + "</body></html>");
writeFileSync(join(DIST, "banco-de-carruseles.html"), h);

const archivos = [];
for (const d of ["fotos", "logos", "trazos", "fuentes"]) for (const f of readdirSync(join(DIST, d))) archivos.push(`${d}/${f}`);
writeFileSync(join(DIST, "archivos.json"), JSON.stringify(archivos.map((p) => ({ path: p }))));
console.log(`✓ web/dist/banco-de-carruseles.html (${Math.round(h.length / 1024)} KB) + ${archivos.length} archivos`);
