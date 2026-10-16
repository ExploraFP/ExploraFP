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
    var envolver = function (obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      return new Proxy(obj, {get: function (t, k) {
        var v = t[k]; if (typeof v !== 'function') return v;
        return function () {
          var args = Array.prototype.map.call(arguments, aPadre), r = v.apply(t, args);
          return r && typeof r.then === 'function' ? r.then(envolver) : envolver(r);
        };
      }});
    };
    window.claude = {use: function (k) { return P.claude.use(k).then(envolver); }};
  } catch (e) {}
})();
