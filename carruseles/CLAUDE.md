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

## Sistema: 4 composiciones × 6 colores
Se combinan libremente, a nivel de carrusel o por slide (`plantilla:` y `color:` dentro de una slide).
Fuente de verdad visual: explorafp.com y las referencias de Sandra, por encima del brandbook (en revisión).
Dirección acordada: parecido al Instagram actual + un poco más de identidad → **`feed` es la plantilla por defecto**.
No borrar nunca plantillas ni colores existentes: se añaden, no se sustituyen.
**Nunca poner "desliza →" ni indicadores de swipe en ninguna slide.**
**Isotipo de fondo: nunca por defecto; solo si se pide (`decoracion: isotipo`) y muy suave.**
**Amarillo solo como detalle pequeño (pastilla de arriba, post-it), nunca como resaltado de titulares; pero no quitarlo del todo.**
**Ninguna plantilla lleva pie ni banda abajo ("footer de web"): el logo va arriba a la derecha** (en la portada de capas, dentro de la caja).
**Titulares siempre en minúscula salvo la inicial** (nunca en mayúsculas), también en el YAML.
Portadas: el feed actual es mayoritariamente foto a sangre → `marco: fondo` en la portada cuando haya foto.

| plantilla | estilo | referencia |
|---|---|---|
| `feed` | base plana del Instagram actual: pastilla amarilla arriba, logo arriba, cuadrícula suave, resaltado lima, un toque a mano por slide (`trazo: flecha / ovalo / ninguno`), sin banda abajo. Contenido con `imagen:` → foto arriba a sangre y texto abajo | feed de Instagram (por defecto) |
| `capas` | caja de color sobre foto o papel torcido, flechas, números rodeados, post-it, cinta | plantilla de dosier |
| `cuaderno` | libreta con cuadrícula y lomo, logo arriba, número fantasma, checklist, cinta solo en el cierre | "La parte mala de estudiar online" (favorita) |
| `poster` | titular gigante, isotipo enorme de fondo, foto en diagonal, píldoras, logo abajo | "Antes de elegir una FP" |

Colores (`plantillas/colores.css`): de marca `verde01` (#366B40, base del 80 %), `verde02` (#4CCD4B), `blanco`;
de soporte (sacados de la web) `noche` (#1B3620, a Sandra le parece demasiado oscuro: no usarlo de fondo salvo que lo pida), `lima` (#EDFEC3), `verde` (#85E159).
`verde` (#85E159) NO es de la paleta de marca (dicho por Sandra): sigue en el motor pero la herramienta no lo ofrece.
Al producir, las 4 plantillas salen juntas en versión con foto y sin foto (8 opciones, sin separar); feed y cuaderno la ponen a sangre (`marco: fondo`).
Muestrarios en `contenido/muestrario-*.yml` (una composición, un color por slide).

## Tipos de slide (valen en las 4 composiciones)
- `portada`: etiqueta (óvalo), antetitulo, titulo, subtitulo, nota, imagen (foto). Tipos de portada:
  - `marco: fondo` + imagen → foto a sangre con pastilla amarilla (cualquier plantilla).
  - `marco: notas` → textura manuscrita de fondo a toda la slide, titular en una esquina (cualquier plantilla).
  - capas + imagen → foto torcida (en el sitio del antiguo papel) con la caja de color encima.
  - capas sin imagen → portada notas por defecto (el papel blanco suelto no tenía sentido).
- `contenido`: etiqueta, titulo, antetitulo, numero, texto, imagen (portátil en capas/cuaderno; foto en poster; en feed foto arriba a sangre, o portátil con `marco: portatil`), nota.
- `lista`: etiqueta, titulo, antetitulo, items (2-4). feed → cuadros numerados; capas → tarjetas; cuaderno → checklist; poster → píldoras.
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
- Fotos en `contenido/img/foto-*.jpg` (banco de Sandra): globo-diploma, grupo-estudiantes, chica-cascos-portatil,
  chico-saluda-portatil, chica-biblioteca-portatil, web-alumnos, libreta-apuntes, chica-riendo-exterior,
  chica-gafas-portatil-parque, chica-escritorio-sonrie, chica-agobiada-examen (útil para "lo malo"). Nuevas fotos → `contenido/img/foto-<descripcion>.jpg`.
- Capas: la foto de portada va inclinada, sin marco blanco (nada de polaroid), y la caja inclinada al otro lado.
- Faltan: ilustraciones 3D.

## Herramienta web (banco + estudio)
Publicada en https://claude.ai/artifact/1j6EgNthf9zB8n8rfSqa5t (antes "Banco de carruseles").
- `web/banco-base.html`: la página del banco tal como estaba publicada (ideas, inventario, datos). Si se edita
  el banco desde otra sesión, volver a leer el artifact y guardar aquí su HTML antes de reconstruir.
- `web/estudio.js` + `web/estudio.css`: pestaña Producción (antes «Producir»), editor, control de calidad y exportación a PNG.
- `web/matriz.js` + `web/matriz.css`: pestaña Matriz (antes Ideas) e Inventario (antes «Hechos»; junta Hechos + Inventario del banco).
  Matriz agrupada por OBJETIVO (pedido de Sandra): Viral · Autoridad · Informativo · Lead magnet, de menos a más push, cada uno
  con su CTA por defecto (`OBJETIVOS` en matriz.js; Informativo = «Escríbenos tu ciclo por DM y te decimos tu caso»). Cada idea trae
  un objetivo sugerido por reglas (`OBJ_REGLAS`), Sandra lo cambia en la ficha (se guarda en ops/<id>.objetivo). Al producir se
  elige objetivo y CTA; van al carrusel (`objetivo`, `cta`) y al prompt (`OBJ_PROMPT` en estudio.js). Buscador en una línea: caja + «Formación» (todas /
  transversales / una rama / un ciclo; junta los antiguos Enfoque, Rama y Ciclo). Sin filtro de estado (Sandra: eso se ve en Producción). Cifras ya no se muestra. Antes era por tema; el tema (`TEMA_REGLAS`) sigue calculado pero no se muestra.
  Cada grupo es una fila grande plegada (se abren solos al buscar o filtrar por tema); casillas para
  seleccionar ideas y «Producir (N)» arriba. Ficha mínima (pedido de Sandra: nada de más): rama / ciclo, las slides en fila
  horizontal y un solo botón (Producir o Abrir carrusel); si no hay carrusel y hay uno parecido hecho, lo enseña. Tema = el `eje` del banco, o deducido por palabras clave en `TEMA_REGLAS` para las ~230 sin eje),
  filtros Estado/Tema/Alcance rama-ciclo/Cifras, estado de cada idea (por hacer · en producción · hecha, con su
  carrusel enlazado) y «parecidas» (≥2 palabras con contenido en común y ≥60 %). Lo parecido ya hecho se le pasa
  a Claude al generar para que busque otro ángulo. En Hechos, «Unir a una idea» enlaza un hecho suelto a su idea.
- «Sugerencias de contenido» (subtítulo por mes en `MES_FRASE`): 5 fichas arriba de la matriz según el calendario académico del banco (CATALOGO.momentos con
  sus meses; `momentosActivos`/`deTemporada`). Solo ideas por hacer, BOFU primero, variadas (máx. 2 por objetivo y por alcance);
  flechas ‹ › con contador (1/N) pasan de tanda sin repetir.
- Titulares = HOOKS (pedido de Sandra): `web/hooks.json` {id: hook} reescribe el titular de cada idea como gancho de portada
  (informativo/autoridad claros; viral/lead magnet persuasivos). El titular original del banco se conserva (`it.titular`) y va
  también al prompt. Ficha: titular arriba y debajo Formación · Objetivo · De qué va (`dentro`) · CTA final.
- `motor.js`: el motor de diseño, compartido por render.js y la web → lo que se ve en la web es lo que sale en PNG.
- `node web/construir.mjs` → `web/dist/` (HTML + fotos, logos, trazos, fuentes). Publicar con root `web/dist`,
  `files` = `web/dist/archivos.json`, capacidades `{db, downloads, sample}`.
- Datos: colección `carruseles` del db (un documento por carrusel: titulo, plantilla, color, slides, copy, estado,
  idea). Estados: pendiente → generando → borrador → hecho. La colección `ops` es la del banco (ideas hechas).
- Fotos nuevas: añadir a `contenido/img/foto-*.jpg` y su descripción en `DESC` de `web/construir.mjs`.
- Control de calidad (estudio.js, `avisosTexto` + `medir`): errores = texto que no cabe, palabras prohibidas,
  titular en mayúsculas, dato sin cifra o sin fuente; avisos = emojis, titular largo o sin resaltado, cifras fuera
  de la slide de dato, falta el texto del post. Con errores, «Marcar hecho» pide un segundo clic.
- Descarga en lote: la plataforma NO permite .zip (solo imágenes, PDF, texto y Office). El lote baja los PNG
  seguidos con nombres ordenados (01-titulo-01.png…) y una confirmación del navegador por archivo.
- La fuente Gravity se publica con la herramienta (privada); no hacer público el enlace (licencia de Dinamo).
