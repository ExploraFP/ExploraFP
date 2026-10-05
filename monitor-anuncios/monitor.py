#!/usr/bin/env python3
"""Monitor semanal de anuncios activos de la competencia en la Biblioteca de Anuncios de Meta.

Fuentes (se usan las que tengan token):
  - META_ADS_TOKEN  -> API oficial de la Ad Library (fecha, texto, titular).
  - APIFY_TOKEN     -> scraper de Apify (añade CTA y URL de vídeo).

Salida en informes/AAAA-MM-DD/:
  anuncios.json, anuncios.csv, informe.md y, por cada vídeo, fotogramas
  de los segundos 0-3 en videos/<id>/ para describir el hook.
"""
import csv
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import requests

BASE = Path(__file__).resolve().parent
META_URL = "https://graph.facebook.com/v21.0/ads_archive"
META_FIELDS = ",".join([
    "id", "page_id", "page_name", "ad_delivery_start_time", "ad_delivery_stop_time",
    "ad_creative_bodies", "ad_creative_link_titles", "ad_creative_link_descriptions",
    "ad_creative_link_captions", "ad_snapshot_url", "publisher_platforms",
])
APIFY_ACTOR = os.environ.get("APIFY_ACTOR", "curious_coder~facebook-ads-library-scraper")
APIFY_URL = f"https://api.apify.com/v2/acts/{APIFY_ACTOR}/run-sync-get-dataset-items"


class Bloqueado(Exception):
    pass


def get(url, **kw):
    try:
        r = requests.request(kw.pop("method", "GET"), url, timeout=kw.pop("timeout", 60), **kw)
    except requests.exceptions.ProxyError as e:
        host = re.sub(r"https?://([^/]+).*", r"\1", url)
        raise Bloqueado(f"La red del entorno bloquea {host}. Añádelo en Network access del entorno.") from e
    if r.status_code in (401, 403) and "graph.facebook.com" in url:
        raise Bloqueado(f"Meta rechaza el token ({r.status_code}): {r.text[:300]}")
    r.raise_for_status()
    return r


def marca_de(page_name, cfg):
    p = (page_name or "").lower()
    for marca, m in cfg["marcas"].items():
        if any(alias in p for alias in m["paginas"]):
            return marca
    return None


def fecha(valor):
    if valor in (None, ""):
        return None
    if isinstance(valor, (int, float)):
        return dt.datetime.fromtimestamp(valor, dt.timezone.utc).date()
    return dt.date.fromisoformat(str(valor)[:10])


def primero(lista):
    return (lista or [None])[0]


# ---------- Fuente 1: API oficial ----------

def desde_meta(cfg, token):
    anuncios = {}
    for marca, m in cfg["marcas"].items():
        for termino in m["buscar"]:
            params = {
                "access_token": token, "search_terms": termino,
                "ad_reached_countries": json.dumps([cfg["pais"]]),
                "ad_active_status": "ACTIVE", "ad_type": "ALL",
                "fields": META_FIELDS, "limit": 250,
            }
            url = META_URL
            while url:
                data = get(url, params=params).json()
                for a in data.get("data", []):
                    if marca_de(a.get("page_name"), cfg) != marca:
                        continue  # la búsqueda por texto trae anuncios de terceros que mencionan la marca
                    anuncios[a["id"]] = {
                        "id": a["id"], "marca": marca, "pagina": a.get("page_name"),
                        "inicio": a.get("ad_delivery_start_time"),
                        "texto": primero(a.get("ad_creative_bodies")),
                        "titular": primero(a.get("ad_creative_link_titles")),
                        "descripcion": primero(a.get("ad_creative_link_descriptions")),
                        "cta": None, "video_url": None, "imagen_url": None,
                        "plataformas": ",".join(a.get("publisher_platforms") or []),
                        "enlace": f"https://www.facebook.com/ads/library/?id={a['id']}",
                    }
                url = data.get("paging", {}).get("next")
                params = None  # la URL "next" ya lleva los parámetros
                time.sleep(1)
    return anuncios


# ---------- Fuente 2: Apify (CTA y vídeo) ----------

def desde_apify(cfg, token):
    urls = []
    for m in cfg["marcas"].values():
        for termino in m["buscar"]:
            q = requests.utils.quote(termino)
            urls.append({"url": (
                "https://www.facebook.com/ads/library/?active_status=active&ad_type=all"
                f"&country={cfg['pais']}&q={q}&search_type=keyword_unordered&media_type=all")})
    items = get(APIFY_URL, method="POST", params={"token": token}, timeout=900,
                json={"urls": urls, "count": 300, "scrapeAdDetails": False}).json()
    anuncios = {}
    for it in items:
        snap = it.get("snapshot") or {}
        marca = marca_de(it.get("page_name") or snap.get("page_name"), cfg)
        if not marca:
            continue
        cards = snap.get("cards") or []
        card = cards[0] if cards else {}
        videos = snap.get("videos") or card.get("videos") or []
        v = videos[0] if videos else card
        imgs = snap.get("images") or []
        body = snap.get("body") or card.get("body")
        aid = str(it.get("ad_archive_id") or it.get("adArchiveID") or it.get("id"))
        anuncios[aid] = {
            "id": aid, "marca": marca, "pagina": it.get("page_name") or snap.get("page_name"),
            "inicio": it.get("start_date") or it.get("startDate"),
            "texto": body.get("text") if isinstance(body, dict) else body,
            "titular": snap.get("title") or card.get("title"),
            "descripcion": snap.get("link_description") or card.get("link_description"),
            "cta": snap.get("cta_text") or card.get("cta_text"),
            "video_url": v.get("video_hd_url") or v.get("video_sd_url"),
            "imagen_url": (imgs[0].get("original_image_url") if imgs else None)
                          or card.get("original_image_url"),
            "plataformas": ",".join(it.get("publisher_platform") or []),
            "enlace": f"https://www.facebook.com/ads/library/?id={aid}",
        }
    return anuncios


def fusionar(base, extra):
    """La API oficial manda en fechas y textos; Apify rellena lo que falte (CTA, vídeo)."""
    for aid, a in extra.items():
        if aid in base:
            for k, v in a.items():
                if base[aid].get(k) in (None, "") and v:
                    base[aid][k] = v
        else:
            base[aid] = a
    return base


# ---------- Enriquecido ----------

def enriquecer(anuncios, cfg, hoy, historial):
    palabras = [p.lower() for p in cfg["palabras_laboratorio"]]
    for a in anuncios.values():
        inicio = fecha(a["inicio"])
        a["inicio"] = inicio.isoformat() if inicio else None
        a["dias_activo"] = (hoy - inicio).days if inicio else None
        texto = " ".join(str(a.get(k) or "") for k in ("texto", "titular", "descripcion")).lower()
        a["laboratorio"] = any(p in texto for p in palabras)
        a["formato"] = "video" if a.get("video_url") else ("imagen" if a.get("imagen_url") else "?")
        a["nuevo"] = a["id"] not in historial
        a["hook_3s"] = None
    return anuncios


def extraer_hook(anuncio, carpeta):
    """Descarga el vídeo y saca fotogramas de 0, 1, 2 y 3 s + audio de los 3 primeros segundos."""
    destino = carpeta / "videos" / anuncio["id"]
    destino.mkdir(parents=True, exist_ok=True)
    mp4 = destino / "video.mp4"
    mp4.write_bytes(get(anuncio["video_url"], timeout=120).content)
    for s in range(4):
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(s), "-i", str(mp4),
                        "-frames:v", "1", "-vf", "scale=540:-1", str(destino / f"seg{s}.jpg")], check=False)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(mp4), "-t", "3", "-vn",
                    "-ac", "1", "-ar", "16000", str(destino / "audio_3s.wav")], check=False)
    mp4.unlink()  # no guardamos el vídeo entero en el repo
    return str(destino.relative_to(BASE))


# ---------- Informe ----------

COLUMNAS = ["marca", "laboratorio", "nuevo", "inicio", "dias_activo", "formato",
            "titular", "texto", "cta", "hook_3s", "fotogramas", "enlace", "id"]


def escribir(anuncios, carpeta, hoy):
    filas = sorted(anuncios.values(),
                   key=lambda a: (not a["laboratorio"], a["marca"], -(a["dias_activo"] or 0)))
    (carpeta / "anuncios.json").write_text(json.dumps(filas, ensure_ascii=False, indent=2))
    with open(carpeta / "anuncios.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNAS, extrasaction="ignore")
        w.writeheader()
        w.writerows(filas)

    def limpio(t, n=220):
        t = re.sub(r"\s+", " ", str(t or "")).strip()
        return (t[:n] + "…" if len(t) > n else t).replace("|", "/")

    md = [f"# Anuncios activos de la competencia · {hoy.isoformat()}", ""]
    md.append("| Marca | Activos | De Laboratorio | Nuevos esta semana |")
    md.append("|---|---|---|---|")
    for marca in sorted({a["marca"] for a in filas}):
        grupo = [a for a in filas if a["marca"] == marca]
        md.append(f"| {marca} | {len(grupo)} | {sum(a['laboratorio'] for a in grupo)} "
                  f"| {sum(a['nuevo'] for a in grupo)} |")
    for titulo, seleccion in (("Laboratorio Clínico y Biomédico", [a for a in filas if a["laboratorio"]]),
                              ("Resto de anuncios", [a for a in filas if not a["laboratorio"]])):
        md += ["", f"## {titulo} ({len(seleccion)})", "",
               "| Marca | Inicio | Días | Formato | Titular | Texto | CTA | Hook 0-3 s |",
               "|---|---|---|---|---|---|---|---|"]
        for a in seleccion:
            nuevo = " 🆕" if a["nuevo"] else ""
            md.append(f"| [{a['marca']}]({a['enlace']}){nuevo} | {a['inicio'] or '?'} | {a['dias_activo'] or '?'} "
                      f"| {a['formato']} | {limpio(a['titular'], 80)} | {limpio(a['texto'])} "
                      f"| {a['cta'] or '—'} | {limpio(a['hook_3s'], 160) or ('pendiente' if a['formato'] == 'video' else '—')} |")
    (carpeta / "informe.md").write_text("\n".join(md) + "\n", encoding="utf-8")


def rehacer_informe(carpeta):
    """Regenera informe.md/csv tras rellenar hook_3s a mano o por Claude en anuncios.json."""
    carpeta = Path(carpeta)
    filas = json.loads((carpeta / "anuncios.json").read_text())
    escribir({a["id"]: a for a in filas}, carpeta, dt.date.fromisoformat(carpeta.name))


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--rehacer-informe":
        return rehacer_informe(sys.argv[2])
    cfg = json.loads((BASE / "config.json").read_text())
    hoy = dt.date.today()
    meta_token, apify_token = os.environ.get("META_ADS_TOKEN"), os.environ.get("APIFY_TOKEN")
    if not (meta_token or apify_token):
        sys.exit("ERROR: falta META_ADS_TOKEN y/o APIFY_TOKEN como secreto del entorno.")

    anuncios, errores = {}, []
    for nombre, token, fuente in (("Meta API", meta_token, desde_meta), ("Apify", apify_token, desde_apify)):
        if not token:
            continue
        try:
            anuncios = fusionar(anuncios, fuente(cfg, token))
            print(f"{nombre}: OK ({len(anuncios)} anuncios acumulados)")
        except Exception as e:  # una fuente caída no debe tumbar la otra
            errores.append(f"{nombre}: {e}")
            print(f"{nombre}: FALLO -> {e}", file=sys.stderr)
    if not anuncios and errores:
        sys.exit("ERROR: ninguna fuente funcionó.\n" + "\n".join(errores))

    hist_path = BASE / "historial.json"
    historial = json.loads(hist_path.read_text()) if hist_path.exists() else {}
    enriquecer(anuncios, cfg, hoy, historial)
    if cfg.get("solo_laboratorio"):
        anuncios = {k: a for k, a in anuncios.items() if a["laboratorio"]}

    carpeta = BASE / "informes" / hoy.isoformat()
    carpeta.mkdir(parents=True, exist_ok=True)
    for a in anuncios.values():
        if a["video_url"] and a["laboratorio"]:
            try:
                a["fotogramas"] = extraer_hook(a, carpeta)
            except Exception as e:
                a["fotogramas"] = f"error: {e}"

    for aid, a in anuncios.items():
        historial.setdefault(aid, {"marca": a["marca"], "visto_primera_vez": hoy.isoformat()})
    hist_path.write_text(json.dumps(historial, ensure_ascii=False, indent=2))
    escribir(anuncios, carpeta, hoy)
    print(f"Informe: {carpeta.relative_to(BASE)}/informe.md ({len(anuncios)} anuncios)")
    if errores:
        print("AVISOS:\n" + "\n".join(errores))


if __name__ == "__main__":
    main()
