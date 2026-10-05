"""Prueba sin red: simula respuestas de Meta y Apify y comprueba el informe."""
import datetime as dt
import json
import sys
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import monitor  # noqa: E402

CFG = json.loads((Path(monitor.__file__).parent / "config.json").read_text())

META = {"data": [
    {"id": "111", "page_name": "ILERNA", "ad_delivery_start_time": "2026-09-01",
     "ad_creative_bodies": ["Estudia el CFGS de Laboratorio Clínico y Biomédico online"],
     "ad_creative_link_titles": ["Matrícula abierta"], "publisher_platforms": ["facebook"]},
    {"id": "222", "page_name": "Academia Cualquiera", "ad_delivery_start_time": "2026-09-01",
     "ad_creative_bodies": ["Mejor que ILERNA"]},
    {"id": "333", "page_name": "MEDAC", "ad_delivery_start_time": "2026-10-01",
     "ad_creative_bodies": ["FP de Farmacia"], "ad_creative_link_titles": ["Infórmate"]},
]}
APIFY = [{"ad_archive_id": "111", "page_name": "ILERNA", "start_date": 1756684800,
          "snapshot": {"cta_text": "Más información", "videos": [{"video_sd_url": "https://x/v.mp4"}]}}]


class R:
    def __init__(self, d): self.d = d
    def json(self): return self.d


def fake_get(url, **kw):
    if "graph.facebook.com" in url:
        return R(META)
    return R(APIFY)


def test_flujo_completo(tmp_path):
    with mock.patch.object(monitor, "get", side_effect=fake_get), mock.patch.object(monitor.time, "sleep"):
        a = monitor.fusionar(monitor.desde_meta(CFG, "t"), monitor.desde_apify(CFG, "t"))
    assert set(a) == {"111", "333"}, "debe descartar páginas que no son de la marca"
    assert a["111"]["cta"] == "Más información" and a["111"]["video_url"] == "https://x/v.mp4"
    monitor.enriquecer(a, CFG, dt.date(2026, 10, 5), {"333": {}})
    assert a["111"]["dias_activo"] == 34 and a["111"]["laboratorio"] and a["111"]["nuevo"]
    assert not a["333"]["laboratorio"] and not a["333"]["nuevo"]
    monitor.escribir(a, tmp_path, dt.date(2026, 10, 5))
    md = (tmp_path / "informe.md").read_text()
    assert "## Laboratorio Clínico y Biomédico (1)" in md and "Más información" in md and "pendiente" in md
    # rellenar hook y regenerar
    filas = json.loads((tmp_path / "anuncios.json").read_text())
    filas[0]["hook_3s"] = "Chica con bata: '¿Te gusta la ciencia?'"
    d = tmp_path.parent / "2026-10-05"; d.mkdir(exist_ok=True)
    (d / "anuncios.json").write_text(json.dumps(filas))
    monitor.rehacer_informe(d)
    assert "Te gusta la ciencia" in (d / "informe.md").read_text()
