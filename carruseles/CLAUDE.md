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
  Matriz = UNA tabla siempre (pedido de Sandra), con «vistas» en pestañas: Todas · 🔮 Viral · 🏆 Autoridad · 📌 Informativo · 🧲 Lead magnet
  (cada una con su cuenta de POR HACER, que cuadra con «por hacer» de la cabecera; cabecera = hechas · en producción · por hacer, sin «/total»; «Seleccionar todas» sin número; se combinan con Formación y búsqueda). En una vista: el CTA sale una vez arriba, «N hechas» y «Seleccionar las N»;
  en Todas hay columna de objetivo, justo antes de la idea (orden: casilla · formación · objetivo · idea · estado). «Seleccionar las N» a la izquierda y el CTA de la vista a la derecha; sin cifras repetidas (ya están en la cabecera y en las pestañas). Matriz con ancho máx. 1160 px (`.mz-ancho`) para que «Hecho» no quede lejísimos. Hecha / en producción = solo una raya en el borde izquierdo de la fila (antes salía en cada celda). 60 filas y «Ver 60 más» (`S.vista`, `S.limite`). Objetivos (antes eran grupos plegados): Viral · Autoridad · Informativo · Lead magnet, de menos a más push, cada uno
  con su CTA por defecto (`OBJETIVOS` en matriz.js; Informativo = «Escríbenos tu ciclo por DM y te decimos tu caso»). Cada idea trae
  un objetivo sugerido por reglas (`OBJ_REGLAS`), Sandra lo cambia en la ficha (se guarda en ops/<id>.objetivo). Al producir se
  elige objetivo y CTA; van al carrusel (`objetivo`, `cta`) y al prompt (`OBJ_PROMPT` en estudio.js). Buscador en una línea: caja + «Formación» (todas /
  transversales / una rama / un ciclo; junta los antiguos Enfoque, Rama y Ciclo). Sin filtro de estado (Sandra: eso se ve en Producción). Cifras ya no se muestra. Orden de formaciones fijo (`FORM_ORDEN`): primero las 4 ramas, luego los ciclos de Sanidad, Tecnología,
  Comercio, Administración, Educación Infantil y dobles; sin títulos. Es un desplegable propio (el <select> nativo de Mac no pinta
  colores) y cada opción es LA MISMA etiqueta (chip r-<rama> t-<tipo>) que en filas y fichas: regla de Sandra, una etiqueta
  se ve igual en todas partes (Transversal, ramas y ciclos). Sin «Abrir todos».
  Etiquetas de ciclo con el emoji del Playbook de Notion de Explora (`FORM_EMOJI` en matriz.js) en vez del punto;
  Transversal 📚 (pedido por Sandra); las ideas «DAM y DAW» llevan las dos etiquetas (🎮 DAM + 💻 DAW, `ALC_MULTI`) y salen al filtrar por cualquiera; ramas y «varios ciclos» siguen con su punto.
  «Sanidad y Tecnología» se enseña como las dos etiquetas de rama; «Varios ciclos» como la etiqueta de su rama. Emoji de
  Informativo = 📌 (📋 es de Asistencia a la Dirección). Viral = 🔮. Sugerencias con fondo lima clarito. Modo oscuro aclarado. El buscador es solo una barra blanca (sin título, sin fondo y SIN marco: a Sandra no le gusta el reborde), texto oscuro, lupa marcada y botón de formación lima. Antes era por tema; el tema (`TEMA_REGLAS`) sigue calculado pero no se muestra.
  Casillas para
  seleccionar ideas y «Producir (N)» arriba. Ficha mínima (pedido de Sandra: nada de más): rama / ciclo, las slides en fila
  horizontal y un solo botón (Producir o Abrir carrusel); si no hay carrusel y hay uno parecido hecho, lo enseña. Tema = el `eje` del banco, o deducido por palabras clave en `TEMA_REGLAS` para las ~230 sin eje),
  filtros Estado/Tema/Alcance rama-ciclo/Cifras, estado de cada idea (por hacer · en producción · hecha, con su
  carrusel enlazado) y «parecidas» (≥2 palabras con contenido en común y ≥60 %). Lo parecido ya hecho se le pasa
  a Claude al generar para que busque otro ángulo. En Hechos, «Unir a una idea» enlaza un hecho suelto a su idea.
- «Sugerencias de contenido» (subtítulo: «📅 <Mes>», solo el mes; `MES_FRASE` queda sin usar): 5 fichas arriba de la matriz según el calendario académico del banco (CATALOGO.momentos con
  sus meses; `momentosActivos`/`deTemporada`). Solo ideas por hacer, BOFU primero, variadas (máx. 2 por objetivo y por alcance);
  flechas ‹ › con contador (1/N) pasan de tanda sin repetir.
- Ideas añadidas: `web/ideas-extra.json` (20 de Autoridad A01-A20 y 22 de Tendencia V01-V22, solo con datos verificados) y
  «✏️ Anota tu idea» (franja arriba de la tabla, donde aparece la idea nueva; ni bajo el buscador ni en la cabecera, a Sandra no le gustaba) (colección `ideas` del db + localStorage; salen primero y con etiqueta «Tuya»). Tendencias con etiqueta 📈.
  `web/objetivos-revisados.json`: revisión de las 108 de Autoridad (quedan 20; el resto a Informativo/Lead magnet/Viral).
  Ojo A08 (becas): el dato D13 tiene fuentes contradictorias; confirmar en el BOE antes de publicar.
- Titulares = HOOKS (pedido de Sandra): `web/hooks.json` {id: hook} reescribe el titular de cada idea como gancho de portada
  (informativo/autoridad claros; viral/lead magnet persuasivos). El titular original del banco se conserva (`it.titular`) y va
  también al prompt. Ficha: titular arriba y debajo Formación · Objetivo · De qué va (`dentro`) · CTA final.
- `motor.js`: el motor de diseño, compartido por render.js y la web → lo que se ve en la web es lo que sale en PNG.
- Producción e Inventario (`web/produccion.js` + `web/produccion.css`): cuatro etapas con nombre fijo en toda la web: Por generar → En revisión → Listo → Publicado (`etapaDe`; «Listo» = `c.listo`, lo da Sandra con «✓ Dar el OK»; «Publicado» = `estado: 'hecho'` + `fecha` + `ig`). Producción: secciones una debajo de otra con las tarjetas GRANDES de siempre (a Sandra no le gustaron las compactas en columnas): «Por generar» (solo si hay algo) · «En revisión» · «Listo para publicar». Cada tarjeta: un botón principal por etapa (Generar / Revisar / ⬇ Descargar + Marcar como publicado) y un menú ⋯ (Abrir, Volver a revisión, Copiar texto, Devolver a la Matriz, con aviso). «Marcar como publicado» pide fecha y enlace de Instagram. Editor: etapa junto al título, pestañas «Slide» / «Texto del post», fotos con buscador y filtros (rama, orientación), avisos de calidad que llevan a su slide. Inventario = archivo para rescatar carruseles antiguos: «♻️ Reutilizar» (tarjeta y editor) hace una copia en «En revisión» (`origen`, `origenFecha`) y el original se queda en Inventario con su fecha; una copia por original a la vez. Inventario agrupado por mes, buscador + filtros de objetivo y formación, un botón (Abrir) y el resto en ⋯; sin «Descargar todos».
- Datos (`web/datos.js` + `web/datos.css`): agrupados por tema (`DATO_GRUPO`; los de confianza BAJA arriba en «No lo uses todavía»), buscador, una fila por dato con la frase citable; al abrirla, Cuidado, norma, fuente, «Copiar la frase» y las ideas que lo usan por su titular (no por código).
- Matriz: se añade una idea a mano en la línea de arriba de la tabla (escribir + Enter; objetivo = vista abierta, formación = filtro; «Más detalles» abre la ventana completa). Hechas / en producción llevan ✓ / ● en la columna de la casilla. El carrusel hecho / en producción va en su columna (c-est, 160 px) justo detrás de la idea (520 px); lo que sobra de ancho va a una columna vacía al final (c-hueco), así no se va al borde ni se corta. «☐ Seleccionar» va a la izquierda de las vistas. Sin botón «Descargar el listo / los N listos» (ni en Producción ni en Inicio). Inventario sin la cifra «sin idea».
- Imágenes: filtros «Rama · Personas · Tono · Orientación»; el sombreado lima abarca toda la ficha; fecha de subida dd/mm/aaaa en la ficha; orientación solo texto. El título se limpia de la fecha que ponen los bancos de stock. Si Claude no puede mirar la foto, cataloga por el nombre del archivo; si falla, «Sin catalogar» y botón «✨ Catalogar con Claude» en el visor. Todas las fotos son de stock libres de derechos y las sube Sandra: no hace falta origen ni permiso.
- Tildes: los buscadores (`buscar`, `ft-q`, `dt-q`) no reaccionan durante la composición de la tecla muerta (´+e), solo al terminarla (`BUSCADORES` en inicio.js).
- Inicio (`web/inicio.js` + `web/inicio.css`): pantalla con la que se entra y a la que lleva el logo (`#ir-home`, cierra ficha/visor/editor). Es la primera pestaña, «Inicio». Hasta 900 px de ancho (móvil y panel estrecho de claude.ai) las seis pestañas van en un menú lateral que se abre con ☰ (junto al botón del tema). Bloques: Sugerencias de contenido (se mudaron aquí; la Matriz ya no las lleva) · En producción ahora (4 tarjetas + «Ver todo en Producción») · Lo nuevo (ideas 🆕 del mes y las anotadas por Sandra, sin repetir las de Sugerencias) · Avisos (solo si hay: errores de calidad, foto en ≥3 carruseles, fotos a medio catalogar). Sin cifras de ritmo ni objetivos por semana: Sandra aún no tiene estrategia de redes.
- `node web/construir.mjs` → `web/dist/` (HTML + fotos, logos, trazos, fuentes). Publicar con root `web/dist`,
  `files` = `web/dist/archivos.json`, capacidades `{db, downloads, sample}`.
- Datos: colección `carruseles` del db (un documento por carrusel: titulo, plantilla, color, slides, copy, estado,
  idea). Estados: pendiente → generando → borrador → hecho. La colección `ops` es la del banco (ideas hechas).
- Fotos nuevas: añadir a `contenido/img/foto-*.jpg` y su descripción en `DESC` de `web/construir.mjs`.
- Ideas del mes (tarea programada «Ideas del mes», día 25 a las 8:46 Madrid, sesión nueva): Claude investiga el mes siguiente y escribe
  8-10 ideas en la colección `ideas` del db del artefacto con `origen: 'claude'`, `mes: 'AAAA-MM'` (el mes siguiente), `subtipo: 'tendencia'`,
  `momentos`, `fuentes` (URLs) e id `M<AAAAMM><letra>`. Salen arriba de la matriz con la pastilla «🆕 Nueva de <mes>» y van primero en
  Sugerencias ese mes (`candidatasMes`, peso +10). No hace falta republicar la web: las lee del db. No se ven hasta el día 1 de su mes (`yaVisible`). TCAE, SMR, DAM… = SIEMPRE el ciclo de FP, nunca la oposición que se llama igual: las oposiciones SÍ valen si tienen que ver con la FP (piden un título de FP; ángulo del que estudia, etiquetada con el ciclo, titular deja claro que es una oposición). La tarea lleva ese FILTRO ESTRICTO y pide 6-8 ideas.
- Pestaña «Imágenes» (antes «Fotos») (`web/fotos.js` + `web/fotos.css`): banco de fotos. Sandra sube fotos desde la web (capacidad `assets`, reducidas a 1800 px JPEG);
  cada una es un doc `fotos/<assetId>` en el db con su ficha (desc, rama, personas, tono, orientación, etiquetas) que Claude rellena al subirla
  (`sample` con imagen) y Sandra corrige («✏️ Editar ficha») o borra (🗑, con confirmación; borra el asset y el doc). Las 11 de serie no se borran:
  se ocultan (`fotos/base-<clave>` con `oculta: true`). `FOTOS` se rehace en sitio con las no ocultas: las usan Producción, el editor y el prompt.
  Filtros = buscador + 4 desplegables (rama, personas, tono, orientación) en una línea, nada de filas de chips. Galería tipo Pinterest (CSS columns, cada foto con su alto). Galería estilo Envato: cada tarjeta es solo la foto (cursor normal, nada de lupa); al pasar el ratón se oscurece un poco, sube, borde lima, título arriba cortado con «…» y a la derecha tres botones redondos apilados: 🗑 arriba, ✏️, ⬇ pegado a la esquina inferior (en táctil siempre visibles y en fila). Debajo de cada foto, siempre, una línea «En N carruseles» / «Sin usar todavía» (`usoFotos`, cuenta las slides con esa `imagen`). La ficha del visor añade Subida (fecha de `subida`), Tamaño (px) y Usada en (lista de carruseles). Bajo la foto del visor, fila pequeña de «Parecidas» (hasta 6, `parecidas()`: rama, personas, tono, orientación, etiquetas y palabras en común); al pulsar una se abre en el visor (si los filtros la esconden, se quitan). Borrar pide confirmación en una ventana («¿Seguro que quieres borrar esta imagen?» + «Sí, borrar»). Sin etiquetas en la tarjeta: nada de etiquetas ni «De serie» (a Sandra no le interesa distinguir de serie / subidas). La ficha completa sale en el visor, a la derecha de la foto (abajo en móvil). Borrar una de serie = ocultarla («Ver borradas» para recuperar). Pulsar la foto abre el visor a pantalla completa (× cierra, ‹ › pasan dentro de lo filtrado, teclado ← → Esc, deslizar en móvil). Columnas repartidas en orden de lectura (`colsGaleria`). Publicar con capabilities {db, downloads, sample, assets}.
- Control de calidad (estudio.js, `avisosTexto` + `medir`): errores = texto que no cabe, palabras prohibidas,
  titular en mayúsculas, dato sin cifra o sin fuente; avisos = emojis, titular largo o sin resaltado, cifras fuera
  de la slide de dato, falta el texto del post. Con errores, «Marcar hecho» pide un segundo clic.
- Descarga en lote: la plataforma NO permite .zip (solo imágenes, PDF, texto y Office). El lote baja los PNG
  seguidos con nombres ordenados (01-titulo-01.png…) y una confirmación del navegador por archivo.
- La fuente Gravity se publica con la herramienta (privada); no hacer público el enlace (licencia de Dinamo).

## Pendientes (anotados por Sandra)
- **Verificar contenido**: distinguir en la Matriz lo que propone Claude (ideas, hooks, objetivos, datos) de lo que Sandra ha revisado y dado el OK. Algo tendremos que hacer: estado «Propuesta de Claude» / «Revisada ✓» por idea, y que solo lo revisado se pueda producir o salga primero. Incluye las 42 ideas de ideas-extra, la clasificación automática de objetivos, las ideas del mes y el dato D13 (becas).
