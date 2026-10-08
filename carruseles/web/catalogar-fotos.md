# Catalogar fotos del banco (tarea automática «Catalogar fotos»)

La web no puede enseñarle las fotos a Claude desde la vista de Sandra, así que las fotos que sube quedan en
`estado: "sin-catalogar"` y esta tarea las cataloga mirándolas. Nunca por el nombre del archivo.

1. ArtifactData `query` en https://claude.ai/artifact/1j6EgNthf9zB8n8rfSqa5t, colección `fotos`,
   where `estado` in ["sin-catalogar", "catalogando"]. Si no hay ninguna, termina sin hacer nada más.
   (Ignora las que tengan `oculta: true` o no tengan `asset`.)
2. Para cada una: Artifact `read` con esa url y `path` = su `asset` (UNA por llamada; `paths` no funciona).
   Abre la imagen descargada con Read y MÍRALA.
3. Ficha (describe SOLO lo que se ve; el nombre del archivo no vale). Criterios (aplícalos de forma estricta y coherente):
- desc: español, minúscula salvo nombres propios/siglas; 8-16 palabras CONCRETAS de lo que se ve (quién: mujer/hombre/chica/chico + edad aprox.; qué hace; dónde; objetos clave) + entre paréntesis 2-4 temas de carrusel de FP para los que sirve. Nada genérico ("profesional trabajando en entorno moderno"). Nunca: profesor, lección, unidad, aula.
- rama — UNA de: General | Sanidad | Tecnología | Comercio | Administración | Educación. Decide por lo que se VE, no por los temas posibles:
  · Sanidad: hospital, pijama sanitario, fonendo, paciente, laboratorio (clínico o de ciencias: bata + microscopio/tubos/pipeta), nutrición/dietética (bata o consulta con comida, cinta métrica).
  · Tecnología: código en pantalla, servidores/racks/cables de red, montar o reparar hardware, electrónica.
  · Comercio: almacén, palés, cajas, chaleco reflectante, contenedores/puerto, reparto, tienda, marketing visible (redes, grabar vídeo para redes, pósits de marketing), ventas.
  · Administración: oficina con papeles/archivadores/facturas/calculadora/gráficos financieros, contabilidad, gestoría, reunión de negocios con informes.
  · Educación: niños pequeños, escuela infantil, juguetes educativos.
  · General: estudiar o teletrabajar sin pista de sector (portátil + café, sofá, biblioteca, apuntes), retratos sin contexto, graduación, gimnasio/deporte, personas en la calle.
  Si dudas entre un sector y General, elige General.
- personas: Una persona | Varias personas | Sin personas (cuenta la gente visible, aunque sea solo una mano = Una persona).
- tono: Positivo (sonrisa, logro) | Problema (estrés, agobio, cansancio, duda, aburrimiento) | Neutro (concentración, sin emoción clara).
- etiquetas: 3-5 palabras sueltas en minúscula, en español.
   Antes de escribir, vuelve a mirar la foto y comprueba rama, personas y tono contra estos criterios.
4. Escribe con UN ArtifactData `batch` (máx. 50 por batch): op `update`, colección `fotos`, doc_id = id del doc,
   data = {desc, rama, personas, tono, etiquetas, estado: "lista"}, `if_version` = la versión leída.
   Si una versión cambió, vuelve a leer ese doc y reintenta.
5. No toques nada más (ni otras colecciones, ni el código, ni publiques la web).
