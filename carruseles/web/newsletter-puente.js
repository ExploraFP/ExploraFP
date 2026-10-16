/* Puente con Contenidos (se mete al principio del <head> de la newsletter, construir.mjs).
   La newsletter vive en un marco y usa el window.claude de la página de Contenidos. Todo lo que le pasa (mensajes del chat,
   opciones, datos a guardar) se copia antes a objetos de la página padre: el sistema de claude.ai puede no aceptar objetos
   creados en otro marco (16/10/2026: el chat de la newsletter no funcionaba dentro de Contenidos). */
(function () {
  try {
    var P = window.parent; if (P === window || !P.claude) return;
    var aPadre = function (x) {
      if (x === null || typeof x !== 'object') return x;                 // texto, números y funciones pasan tal cual
      if (typeof AbortSignal !== 'undefined' && x instanceof AbortSignal) {
        var c = new P.AbortController(); if (x.aborted) c.abort(); else x.addEventListener('abort', function () { c.abort(); }); return c.signal;
      }
      if (x instanceof Date) return new P.Date(x.getTime());
      if (Array.isArray(x)) { var a = new P.Array(); for (var i = 0; i < x.length; i++) a.push(aPadre(x[i])); return a; }
      var o = new P.Object(); for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k)) o[k] = aPadre(x[k]); return o;
    };
    // Solo se adapta «sample» (el chat). La base de datos va directa, como antes: envolverla rompió la lectura del
    // calendario en claude.ai (16/10/2026: «solo salen recuadros Sin asunto»).
    var envolverSample = function (s) {
      if (!s) return s;
      return {
        json: function (turns, opts) { return s.json(aPadre(turns), aPadre(opts)); },
        limits: function () { return s.limits.apply(s, arguments); },
        text: s.text ? function (turns, opts) { return s.text(aPadre(turns), aPadre(opts)); } : undefined
      };
    };
    window.claude = {use: function (k) { return k === 'sample' ? P.claude.use(k).then(envolverSample) : P.claude.use(k); }};
  } catch (e) {}
})();
