# Catalogar fotos del banco (tarea automática «Catalogar fotos»)

La web no puede enseñarle las fotos a Claude desde la vista de Sandra, así que las fotos que sube quedan en
`estado: "sin-catalogar"` y esta tarea las cataloga mirándolas. Nunca por el nombre del archivo.

1. ArtifactData `query` en https://claude.ai/artifact/1j6EgNthf9zB8n8rfSqa5t, colección `fotos`,
   where `estado` in ["sin-catalogar", "catalogando"]. Si no hay ninguna, termina sin hacer nada más.
   (Ignora las que tengan `oculta: true` o no tengan `asset`.)
2. Para cada una: Artifact `read` con esa url y `path` = su `asset` (UNA por llamada; `paths` no funciona).
   Abre la imagen descargada con Read y MÍRALA.
3. Ficha (describe SOLO lo que se ve):
   - desc: español, en minúscula salvo nombres propios/siglas, 8-16 palabras concretas (quién: mujer/hombre/chica/chico y edad aprox.;
     qué hace; dónde; objetos clave) + entre paréntesis 2-4 temas de carrusel de FP.
     Ej.: "mujer con chaleco reflectante sujetando cajas en la calle (logística, reparto, transporte)".
     Nada genérico tipo "profesional trabajando en entorno moderno". Nunca: profesor, lección, unidad, aula.
   - rama: General | Sanidad | Tecnología | Comercio | Administración | Educación.
     Sanidad = TCAE, hospital, laboratorio clínico o de ciencias, anatomía patológica, dietética/nutrición.
     Tecnología = informática, programación, sistemas. Comercio = marketing, comercio internacional, logística, almacén, transporte, ventas.
     Administración = oficina, contabilidad, gestoría, finanzas. Educación = educación infantil, niños pequeños.
     Gimnasio/deporte o sin pista clara → General.
   - personas: Una persona | Varias personas | Sin personas.
   - tono: Positivo | Problema | Neutro (Problema = estrés, agobio, cansancio, duda).
   - etiquetas: 3-5 palabras sueltas en minúscula, en español.
4. Escribe con UN ArtifactData `batch` (máx. 50 por batch): op `update`, colección `fotos`, doc_id = id del doc,
   data = {desc, rama, personas, tono, etiquetas, estado: "lista"}, `if_version` = la versión leída.
   Si una versión cambió, vuelve a leer ese doc y reintenta.
5. No toques nada más (ni otras colecciones, ni el código, ni publiques la web).
