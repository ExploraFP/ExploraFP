#!/usr/bin/env bash
# Pruebas de la herramienta Contenidos (26/10/2026). Antes de publicar: bash pruebas/todas.sh
# Construye web/dist, la sirve en 127.0.0.1:8765 y pasa cada prueba con una base de datos falsa (la copia más reciente de copias/).
# Necesita: npm install (playwright), y para las de descargas/vídeo html-to-image y mp4-muxer@5.2.2 desempaquetados (H2I, MUX).
set -u
cd "$(dirname "$0")/.."
export SALIDA="${SALIDA:-/tmp/pruebas-contenidos/}"; mkdir -p "$SALIDA"
export COPIA="${COPIA:-$(ls -d "$PWD"/copias/20*/ | sort | tail -1)}"
export H2I="${H2I:-/tmp/claude-0/h2i/package/dist/html-to-image.js}" MUX="${MUX:-/tmp/claude-0/mux/package/build/mp4-muxer.js}"
node web/construir.mjs | tail -1
# sintaxis de cada <script> del HTML construido (la versión 184 se rompió por esto)
for f in web/dist/banco-de-carruseles.html web/dist/newsletter.html; do
  node -e "const s=require('fs').readFileSync('$f','utf8');let i=0,m,re=/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g;while((m=re.exec(s)))require('fs').writeFileSync('$SALIDA/chk'+(i++)+'.js',m[1])"
  for j in "$SALIDA"/chk*.js; do node --check "$j" || { echo "FALLO de sintaxis en $f"; exit 1; }; done; rm -f "$SALIDA"/chk*.js
done
if ! curl -s -o /dev/null http://127.0.0.1:8765/banco-de-carruseles.html; then
  (cd web/dist && exec python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1) & SRV=$!; sleep 1
fi
fallos=0
for t in ${PRUEBAS:-minis tres dir2 gu2 mz faltan dis nav pap audit es tj}; do
  [ -f "$H2I" ] || case $t in es|tj) echo "== $t: sin html-to-image, se salta"; continue;; esac
  echo "== $t"; out=$(timeout 300 node "pruebas/$t.mjs" 2>&1); echo "$out" | grep -v '^    at' | tail -3
  echo "$out" | grep -v "CERT_AUTHORITY" | grep -qE "Error|errores [^n]|err \[[^]]" && fallos=$((fallos+1))
done
[ -n "${SRV:-}" ] && kill $SRV
echo "---- $fallos con problemas"
