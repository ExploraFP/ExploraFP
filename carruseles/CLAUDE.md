# Carruseles de Instagram · Explora

Motor para producir carruseles en masa. El contenido va en YAML, el diseño en CSS.
Nunca se diseña slide a slide: se escribe el YAML y se renderiza.

## Flujo
1. Sandra pide temas ("hazme 10 carruseles de mitos de la FP").
2. Claude escribe un `contenido/<slug>.yml` por carrusel, aplicando la skill
   `explora-brand-guidelines` (tono sin filtros / a fuego, glosario, CTAs de navegación,
   nada de "profesor", "lección", "matricúlate").
3. `npm install` (una vez) y `npm run render` → `salida/<slug>/01.png…`, `copy.txt`, `_resumen.png`.
4. Revisar `_resumen.png` de cada carrusel. Si el render avisa de texto desbordado, recortar el texto (no bajar el tamaño de letra).

## Sistema visual: capas ("el stack")
Cada slide se compone por capas que se pisan: fondo → papel torcido → caja de color → flechas, óvalos,
post-it → cinta de marca. Referencia: plantilla de dosier de Sandra (caja sobre foto, tarjetas con
números rodeados, flechas grandes). Evitar composiciones planas de texto sobre fondo: se ven genéricas.
Fuente de verdad visual: explorafp.com y las referencias de Sandra, por encima del brandbook (en revisión).

## Plantillas (solo cambian los colores; la composición es común)
| plantilla | fondo | caja | para qué |
|---|---|---|---|
| `selva`  | verde noche | verde vivo, titular negro | tips, guías |
| `diario` | lima claro | verde noche, titular lima | mitos, storytelling |
| `brecha` | verde vivo | verde noche, titular lima | datos, cifras |
| `cuaderno` | blanco con cuadrícula | lima, titular negro | "lo malo / así lo hacemos", checklists (favorita) |

`plantilla:` dentro de una slide sobrescribe la del carrusel (p. ej. problema en `cuaderno` → solución en `selva`).

## Tipos de slide
- `portada`: etiqueta (óvalo), titulo, subtitulo, nota. Con `imagen:` → foto arriba y caja encima.
  Sin imagen → papel con textura de notas + isotipo + flecha.
- `contenido`: etiqueta, titulo, antetitulo (subtítulo bajo el titular), numero (rodeado), texto, imagen (siempre en portátil).
- `lista`: etiqueta, titulo, antetitulo, items (2-4 → tarjetas en rejilla; 3 → filas).
- `dato`: etiqueta, antetitulo, cifra, texto, fuente — **nunca inventar cifras; siempre con fuente real**.
- `cierre`: etiqueta, titulo, texto, cta (banda con flecha), cinta (texto de la cinta final).

Campos globales del carrusel: `plantilla`, `cinta` (texto a la derecha de la cinta: "Lo malo · 02"), `copy`.
Campos extra por slide: `decoracion: postit | notas | isotipo | ninguna`.
`*palabra*` resalta en titulares y subraya en textos. Máximo 20 slides; ideal 4-8.

## Recursos
- Logos en `assets/logos/`, trazos originales en `assets/trazos/` (óvalo, flecha, notas, post-it).
  Se aplican como máscara CSS incrustada en base64 (Chrome exige CORS para máscaras con file://).
- Capturas de la plataforma en `contenido/img/plataforma-*.webp`: mockups de producto con datos ficticios, aprobados.
- `contenido/img/foto-web-alumnos.jpg`: recorte de la foto de la home de explorafp.com.
- Tipografía titular: Gravity Condensed en `fonts/GravityCondensed.otf` (fuera de git por licencia).
  ⚠ El archivo es la versión **Edu** (licencia educativa); confirmar licencia comercial antes de publicar.
  Sin el archivo, se usa Archivo como sustituto.
- Faltan: ilustraciones 3D, más fotos.
