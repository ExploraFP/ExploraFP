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
    // 19/10/2026 (Sandra: «no se me abre la ficha cuando abro un mail nuevo»): crear un correo (add) no funcionaba. Lo que se
    // GUARDA (add, set, update) también se copia a objetos de la página padre. Leer sigue yendo directo: orderBy, where,
    // onSnapshot y get devuelven lo mismo que la base de datos de verdad (envolver la lectura rompió el calendario el 16/10).
    var envolverDoc = function (r) {
      return {
        id: r.id,
        set: function (d, o) { return r.set(aPadre(d), aPadre(o)); },
        update: function (d) { return r.update(aPadre(d)); },
        'delete': function () { return r['delete'](); },
        get: function () { return r.get.apply(r, arguments); },
        onSnapshot: function () { return r.onSnapshot.apply(r, arguments); }
      };
    };
    var envolverCol = function (c) {
      return {
        add: function (d) { return c.add(aPadre(d)); },
        doc: function () { return envolverDoc(c.doc.apply(c, arguments)); },
        orderBy: function () { return c.orderBy.apply(c, arguments); },
        where: function () { return c.where.apply(c, arguments); },
        limit: function () { return c.limit.apply(c, arguments); },
        onSnapshot: function () { return c.onSnapshot.apply(c, arguments); },
        get: function () { return c.get.apply(c, arguments); }
      };
    };
    var envolverDb = function (db) {
      if (!db || typeof db.collection !== 'function') return db;
      return {
        collection: function () { return envolverCol(db.collection.apply(db, arguments)); },
        doc: function () { return envolverDoc(db.doc.apply(db, arguments)); }
      };
    };
    window.claude = {use: function (k) {
      return k === 'sample' ? P.claude.use(k).then(envolverSample) : k === 'db' ? P.claude.use(k).then(envolverDb) : P.claude.use(k);
    }};
  } catch (e) {}
})();
