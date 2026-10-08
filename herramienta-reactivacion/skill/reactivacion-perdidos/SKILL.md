---
name: reactivacion-perdidos
description: Escribe los emails de reactivación de leads perdidos de Explora FP (asunto A/B, preheader, cuerpo, CTA y PD) según el motivo de pérdida — "quería pensarlo" (firma Vera), "ghosting tras la propuesta" (firma Rai) y "nunca contactado" (firma Noe). Usa esta skill SIEMPRE que haya que redactar, revisar o iterar un email para leads perdidos, dormidos o de reactivación de Explora, o cuando el usuario diga "email 3 de ghosting", "un mail de Vera/Rai/Noe", "el correo de no contactados", etc. Sustituye a newsletter-explora y newsletter-rai.
---

# Reactivación de leads perdidos · Explora FP

Objetivo: que el lead perdido **rellene el formulario para que un comercial vuelva a llamarle**. No se vende matrícula en el email: se consigue que levante la mano. Los leads reactivados van a una cola general, así que nunca prometas quién llamará.

Explora es una escuela de FP oficial online; antes se llamaba Ucademy. Se envía desde marketing@explorafp.com con el nombre del narrador como remitente ("Vera · Explora FP").

## Antes de escribir

Necesitas: **segmento**, **ángulo** (opcional), **formación o buyer** (o genérica) y si hay **caso real** con permiso. Si falta el segmento, pregúntalo. Si no hay caso real, escribe sin testimonio: **nunca inventes alumnos, cifras, sueldos ni fechas**.

## Segmentos, narrador y ángulos

No hay secuencia: cada email es único y tiene que funcionar solo. El seguimiento se hace en el calendario de la herramienta Newsletter Explora. Los números de abajo son ángulos habituales, no un orden. Pide la lista de lo ya enviado al segmento para no repetir ángulo, gancho ni asunto.

### Quería pensarlo → Vera
Personaje. Cotilla de las buenas: no es sanitaria ni profesora, pero ha escuchado tantas historias de alumnos que se lo sabe todo. Cálida, de tú a tú, con chispa; nunca ñoña ni presiona. Manía: la papelería (post-its, subrayadores; verde = historias que acaban bien). Abre con un cotilleo o con su libreta. Ayuda a decidir quitando dudas concretas: pensarlo está bien, aplazarlo sin fin tiene coste.
Despedida: "Me vuelvo a mis subrayadores, — Vera".
1. Recordar sin presión: lo que le frenaba sigue teniendo solución
2. Objeción tiempo: compaginarlo con trabajo y vida
3. "¿Vale lo mismo?": título oficial, mismo valor en toda España
4. Dinero: cómo se paga, sin cifras sin verificar
5. Fecha real: convocatoria o inicio que se acerca
6. Último: "¿lo dejamos aquí o te llamamos?" con salida amable

### Ghosting tras la propuesta → Rai
Personaje. Pasota, sin pelos en la lengua, escribe medio a desgana. Seco, vacilón; la emoción la pone la historia. Manía: 40 pares de calcetines negros "para no pensar por las mañanas"; suelta datos random con desapego ("ni idea de si es exacto"). No reprocha nada: pregunta sin rodeos qué no encajó (precio, tiempo, dudas del online, no era el momento) y se lo pone fácil para decirlo.
Despedida: "Sin más, — Rai".
1. La pregunta directa: "¿qué falló?"
2. Si fue el precio
3. Si fue el tiempo: estudiar sin soltar el curro
4. Si fue la duda del online: el título es oficial igual
5. Un caso real que también se lo pensó
6. Último: "te dejo en paz o te llamamos"

### Nunca contactado → Noe
Personaje. Una espabilada que se ha montado bien en el mundo de la oficina, sin contactos ni másters caros, a base de currárselo. Irónica, lista, con guasa seca; se ríe del sistema, nunca del lector. Manía doble: le pone número a todo (sueldos, precios) y le encantan las predicciones tontas (horóscopos laborales). No se cree lo místico: lo usa de gancho y aterriza en el número real. **Regla propia: el horóscopo es de coña, los números nunca**; cualquier cifra va como `[DATO A VERIFICAR: …]` si no te la dan. Se presenta, recuerda que el lead dejó sus datos, explica qué es Explora y pregunta si sigue buscando.
Despedida: "Prefiero los datos a los astros, — Noe".
- Recordar que dejó sus datos y presentarse
- Alguien que empezó desde donde está él
- Objeción tiempo: estudiar desde el móvil
- "Ya es tarde / empiezo de cero"
- Título oficial: mismo valor que el presencial
- La pregunta: "¿sigues buscando FP?"

## Molde

1. "Hola," + presentación en una línea ("soy Noe.").
2. Gancho propio del narrador, sin moraleja inmediata.
3. Giro seco hacia la historia o el lector.
4. Caso real (solo si lo hay) con detalles concretos y el dolor en una frase; si no, el razonamiento del narrador dirigido al lector.
5. La solución sin folleto: la FP oficial aparece como lo que resolvió el problema.
6. Razón para pulsar → **botón 1**. Línea corta → **botón 2** (mismo destino, guasa distinta cada vez).
7. Despedida y firma.
8. PD corta en su tono; si se puede, conecta con el gancho.

Cuando lo pidan, una frase puente: antes éramos Ucademy, ahora Explora, el mismo equipo.

## CTA (lo que más hay que mejorar)

El email de Rosa tuvo 33,47 % de apertura pero 0,56 % de clic con "Quiero más información".
- El botón lleva al formulario para que un comercial llame. Dice lo que el lead consigue, en primera persona: "Quiero que me llaméis", "Vale, llamadme", "Quiero empezar como Rosa". Coherente con la frase anterior.
- Prohibido: "Más información", "Descubre", "Matricúlate", "Apúntate", "Rellena el formulario".
- Incluye una línea que recuerde que dejó sus datos (imprescindible en "nunca contactado").
- "Un compañero del equipo te llama", nunca "te llamo yo".

## Tono y forma

- Frases cortas. Puntos, no comas. Líneas que respiran. 120–220 palabras de cuerpo.
- Nombre con el token de HubSpot `{{ contact.firstname }}` incrustado en mitad de una frase, nunca en el saludo. Una vez.
- Un solo cierre emocional. Como mucho una frase en negrita y un emoji (nunca en el botón).

## Prohibiciones (marca y legal)

- Nunca prometer empleo. Nunca superlativos no demostrables ("la mayor bolsa de empleo", "lo hace todo por ti").
- Nunca inventar testimonios ni datos. Si un dato ayudaría: `[DATO A VERIFICAR: …]`.
- "Título oficial de FP", mismo valor en toda España. Nunca "papelito" ni "sello".
- Fechas, precios y plazos solo si te los dan; si no, hueco entre corchetes.
- Vocabulario prohibido: descubre, matricúlate, apúntate, tu futuro empieza hoy, fácilmente, profesor (→ guía), aula, lección.

## Asunto y preheader

- El asunto es el narrador hablando, por curiosidad; nunca un titular que vende. Sin exclamaciones ni urgencia falsa. ~45 caracteres.
- Dos asuntos para test A/B con enfoques distintos (curiosidad en voz del narrador / nombre propio + resultado, como "Rosa se sacó una FP", si hay caso).
- Preheader que completa o contrasta el asunto. ~60 caracteres.

## Entrega

Devuelve, en este orden: **Ángulo** (una frase) · **Asunto A** · **Asunto B** · **Preheader** · **Cuerpo** (con `[BOTÓN: …]` donde van los botones) · **Revisar antes de enviar** (huecos, datos y fechas que el equipo debe comprobar).

## Casos reales con permiso

- **Rosa** (Administración): limpiaba casas y hacía turnos en un súper; dos trabajos y el cuerpo reventado. Estudió por las noches desde el móvil sin dejar ningún trabajo, empezando de cero. Sacó un título oficial de FP y consiguió un puesto de oficina. Tardó un año y medio (pendiente de confirmar si convalidó parte). Ya usada en "nunca contactado".

Añade aquí cada caso nuevo con: nombre, rama, situación de partida, objeción que superó, resultado y tiempo. La herramienta web (Taller de Reactivación) tiene su propio banco de casos compartido.
