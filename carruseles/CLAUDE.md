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

## Sistema: 3 composiciones × 4 colores
Se combinan libremente, a nivel de carrusel o por slide (`plantilla:` y `color:` dentro de una slide).
Fuente de verdad visual: explorafp.com y las referencias de Sandra, por encima del brandbook (en revisión).
Evitar composiciones planas de texto sobre fondo: Sandra las ve genéricas.
**Nunca poner "desliza →" ni indicadores de swipe en ninguna slide.**
**Amarillo solo como detalle puntual (post-it), nunca como resaltado general.**
**Titulares siempre en minúscula salvo la inicial** (nunca en mayúsculas), también en el YAML.
Portadas: el feed actual es mayoritariamente foto a sangre → `marco: fondo` en la portada cuando haya foto.

| plantilla | estilo | referencia |
|---|---|---|
| `capas` | caja de color sobre foto o papel torcido, flechas, números rodeados, post-it, cinta | plantilla de dosier |
| `cuaderno` | libreta con cuadrícula y lomo, logo arriba, número fantasma, checklist, cinta solo en el cierre | "La parte mala de estudiar online" (favorita) |
| `poster` | titular gigante, isotipo enorme de fondo, foto en diagonal, píldoras, logo abajo | "Antes de elegir una FP" |

Colores (`plantillas/colores.css`): `noche` (verde noche), `lima` (lima claro), `verde` (verde vivo), `blanco`.
Muestrarios en `contenido/muestrario-*.yml` (una composición, un color por slide).

## Tipos de slide (valen en las 3 composiciones)
- `portada`: etiqueta (óvalo), antetitulo, titulo, subtitulo, nota, imagen (foto). Con `marco: fondo` → foto a sangre con pastilla lima (vale en las 3 plantillas).
- `contenido`: etiqueta, titulo, antetitulo, numero, texto, imagen (portátil en capas/cuaderno; foto en poster), nota.
- `lista`: etiqueta, titulo, antetitulo, items (2-4). capas → tarjetas; cuaderno → checklist; poster → píldoras.
- `dato`: antetitulo, cifra, texto, fuente — **nunca inventar cifras; siempre con fuente real**.
- `cierre`: etiqueta, titulo, texto, cta, cinta (texto final, p. ej. "Enlace en el perfil").

Campos del carrusel: `plantilla`, `color`, `cinta` (etiqueta de página: "Lo malo · 02"), `copy`.
Extra por slide: `decoracion: postit | notas | isotipo | ninguna`.
`*palabra*` resalta en titulares y subraya en textos. Máximo 20 slides; ideal 4-8.
Si un YAML falla, el render sigue con los demás y lo lista al final.

## Recursos
- Logos en `assets/logos/`, trazos originales en `assets/trazos/` (óvalo, flecha, notas, post-it).
  Se aplican como máscara CSS incrustada en base64 (Chrome exige CORS para máscaras con file://).
- Capturas de la plataforma en `contenido/img/plataforma-*.webp`: mockups de producto con datos ficticios, aprobados.
- `contenido/img/foto-web-alumnos.jpg`: recorte de la foto de la home de explorafp.com.
- Tipografía titular: Gravity Condensed en `fonts/GravityCondensed.otf` (fuera de git por licencia).
  Licencia pagada por Explora (el nombre interno es "ABC Gravity Edu"). La licencia de Dinamo prohíbe
  redistribuir o subir la fuente a servidores públicos: por eso NO va en git. En una sesión nueva, pedir a
  Sandra el .otf y copiarlo a `fonts/GravityCondensed.otf`. Sin el archivo, se usa Archivo como sustituto.
- Faltan: ilustraciones 3D, más fotos.
