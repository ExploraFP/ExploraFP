# Monitor de anuncios de la competencia (Meta Ad Library)

Cada lunes saca los anuncios **activos en España** de ILERNA, MEDAC, Planeta FP, CEAC y UNIVERSAE
y deja un informe en `informes/AAAA-MM-DD/informe.md` (+ `anuncios.csv` para Excel).

Por anuncio: marca, fecha de inicio, días activo, texto, titular, CTA, formato y, si es vídeo de
Laboratorio, el hook de los segundos 0-3 (fotogramas + descripción).
Los anuncios que mencionan Laboratorio Clínico y Biomédico salen primero; el resto va debajo.
`🆕` = no estaba la semana anterior (`historial.json`).

## Lo que tienes que hacer tú (una vez)

1. **Red del entorno** → Network access → Custom → añadir:
   `graph.facebook.com` (obligatorio) · `api.apify.com` y `video.xx.fbcdn.net`, `scontent.xx.fbcdn.net` (si usas Apify).
2. **Llaves** → variables de entorno (secretos) del entorno:
   - `META_ADS_TOKEN`: verifica tu identidad en facebook.com/ID, crea una app en developers.facebook.com
     y genera un token con acceso a la Ad Library API. Caduca ~60 días: hay que renovarlo.
   - `APIFY_TOKEN` (opcional, de pago): es lo único que da **CTA y vídeos**. Sin él no hay CTA ni hook.

## Uso manual

```bash
pip install requests
python3 monitor.py                                   # genera el informe de hoy
python3 monitor.py --rehacer-informe informes/2026-10-05   # tras rellenar hook_3s en anuncios.json
python3 -m pytest tests                              # prueba sin red
```

Ajustes en `config.json` (marcas, palabras de Laboratorio, `solo_laboratorio`).
