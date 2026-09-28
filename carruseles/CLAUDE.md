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

## Plantillas
| plantilla | fondo | para qué |
|---|---|---|
| `selva`  | Verde noche (#1B3620), titulares lima, resaltado amarillo | tips, guías, cómo se hace |
| `diario` | Lima claro (#EDFEC3), texto verde noche, resaltado amarillo | storytelling, mitos vs realidad, testimonios |
| `brecha` | Verde vivo (#85E159), texto casi negro, resaltado lima | datos, cifras, verdades incómodas |
| `cuaderno` | Blanco verdoso con cuadrícula, titular negro, resaltado lima, logo arriba | "lo malo / así lo hacemos", checklists, preguntas (favorita de Sandra) |

**Mezclar plantillas**: `plantilla:` dentro de una slide sobrescribe la del carrusel. Patrón probado:
problema en `cuaderno` → solución en `selva` con captura en portátil → cierre.

Fuente de verdad visual: **explorafp.com** (por encima del brandbook, que está en revisión).
Titulares en caja normal (nunca todo mayúsculas), condensados y apretados; resaltado en bloque;
trazos a mano; botones píldora con Besley.

## Tipos de slide (valen en las 4 plantillas)
- `portada`: etiqueta (texto rodeado con óvalo a mano), antetitulo (con subrayado a mano), titulo, subtitulo, nota
- `contenido`: numero, antetitulo, titulo, texto, nota
- `lista`: antetitulo, titulo, items[], nota
- `dato`: antetitulo, cifra, texto, fuente — **nunca inventar cifras; siempre con fuente real**
- `cierre`: etiqueta, antetitulo, titulo, texto, cta (con flechas a mano)

Campos extra en cualquier slide:
- `imagen: img/archivo.png` (relativa a `contenido/`) + `marco: portatil` (captura en portátil) o `foto`.
- `cabecera:` etiqueta arriba a la izquierda (solo `cuaderno`). A nivel de carrusel, `cabecera: Lo malo`
  pone "LO MALO · 02" en cada slide; `cabecera: ""` en una slide la oculta.
- `decoracion:` isotipo | notas | postit (o lista). Por defecto la portada lleva isotipo; `decoracion: ninguna` lo quita.
  `notas` (textura manuscrita) solo en slides con poco texto: ocupa la esquina inferior derecha.
- `cinta:` (solo en `cierre`) texto de la cinta final, p. ej. "Traza tu ruta · enlace en el perfil".

`*palabra*` resalta (lima, blanco o subrayador según plantilla). Línea en blanco en `texto` = párrafo nuevo.
`nota` imita la anotación manuscrita al margen. Máximo 20 slides (límite de Instagram); ideal 5-8.

## Pendiente de marca
- Logos: ya están en `assets/logos/` (horizontal Verde 01, Verde 03, Blanco, Negro + versión "cinta" inclinada).
  El render acepta .png, .webp o .svg con el nombre del catálogo. No recrear el logo a mano.
- Gravity Condensed (de pago): dejar `GravityCondensed-Bold.woff2` u `.otf` en `fonts/`. Hasta entonces se usa Archivo condensada.
- Trazos originales en `assets/trazos/` (óvalo, flecha, notas, post-it) e isotipo en `assets/logos/Isotipo.png`.
  Se aplican como máscara (toman el color de la plantilla) incrustados en base64. El subrayado aún es SVG provisional.
- Faltan: ilustraciones 3D, capturas reales de la plataforma (van en `contenido/img/`).
- Caveat sustituye provisionalmente a la caligrafía de Calligrapher.ai.
