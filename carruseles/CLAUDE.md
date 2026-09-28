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
| `selva`  | Verde 01, titulares lima | tips, guías, cómo se hace |
| `diario` | Blanco Verdoso, Besley, subrayador amarillo | storytelling, mitos vs realidad, testimonios |
| `brecha` | Negro, lima | datos, cifras, verdades incómodas |

## Tipos de slide (valen en las 3 plantillas)
- `portada`: antetitulo, titulo, subtitulo, nota
- `contenido`: numero, antetitulo, titulo, texto, nota
- `lista`: antetitulo, titulo, items[], nota
- `dato`: antetitulo, cifra, texto, fuente — **nunca inventar cifras; siempre con fuente real**
- `cierre`: antetitulo, titulo, texto, cta

`*palabra*` resalta (lima, blanco o subrayador según plantilla). Línea en blanco en `texto` = párrafo nuevo.
`nota` imita la anotación manuscrita al margen. Máximo 20 slides (límite de Instagram); ideal 5-8.

## Pendiente de marca
- Logos: ya están en `assets/logos/` (horizontal Verde 01, Verde 03, Blanco, Negro + versión "cinta" inclinada).
  El render acepta .png, .webp o .svg con el nombre del catálogo. No recrear el logo a mano.
- Gravity Condensed (de pago): dejar `GravityCondensed-Bold.woff2` u `.otf` en `fonts/`. Hasta entonces se usa Anton.
- Caveat sustituye provisionalmente a la caligrafía de Calligrapher.ai.
