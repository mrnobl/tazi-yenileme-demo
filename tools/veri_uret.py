"""Build the anonymised demo data (data/*.json) from the private Sheets export.

Usage:
    python tools/veri_uret.py --csv <folder with sheet1..26.csv> [--out data]

The CSV export itself is private and is never committed. Everything that could
identify a person is removed or replaced here:
  * person names  -> "Personel N" (same person = same number everywhere,
    including free-text notes and session ids)
  * passwords, phone numbers, e-mail, vehicle plates, device ids, Drive file
    ids, photo links, URLs                                       -> dropped
  * GPS tracks    -> only a few sample shifts, thinned to ~30 m, first and last
    300 m of every session cut, points near private zones removed
  * geofences that mark staff homes (MerkezId M-3)              -> dropped
Run tools/anonim_denetim.py afterwards; it fails on any leak.
"""
import argparse
import json
import math
import os
import re
import statistics
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from anonim_ortak import (  # noqa: E402
    NAME_COLUMNS, NON_PERSON, SHEETS, SUFFIX_RE, VEHICLE_COLUMNS,
    fix_mojibake, fold, name_regex, read_csv, table,
)

EPOCH = datetime(1899, 12, 30)
PRIVATE_ZONE_MERKEZ = "M-3"   # geofences around staff homes


# ---------------------------------------------------------------- helpers

# ---- parça adları / stok kodları anonimleştirme (tedarikçi stok kodu, model ve parça numarası, marka çıkar)
_PARCA_RX = [
    (re.compile(r"\bY[A-Z]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\.\d{3}\b"), ""),           # stok kodu
    (re.compile(r"\(\s*TZ\d+\s*\)|\bTZ\d+\b"), ""),                                # iç model kodu
    (re.compile(r"\(\s*(?:BRAKE|REAR|WHEEL)\s*LOCK\s*\)", re.I), ""),              # kilit ürün hattı
    (re.compile(r"\(\s*Q\d[^)]*\)"), ""),
    (re.compile(r"(?<![A-Za-z0-9])(?:ON-ARKA-)?Q\d(?:[-/]Q\d)*\??(?![A-Za-z0-9])"), ""),  # model kuşağı
    (re.compile(r"(?<![A-Za-z0-9])V\d(?![A-Za-z0-9])"), ""),
    (re.compile(r"\b(?=[A-Z0-9-]*\d)(?=[A-Z0-9-]*[A-Z])[A-Z0-9]+(?:-[A-Z0-9]+){1,}\b"), ""),  # parça no (tireli)
    (re.compile(r"\b(?=\w*\d)(?=\w*[A-Z])[A-Z0-9]{8,}\b"), ""),                    # parça no (uzun)
    (re.compile(r"\b(?:YD-TAZI|YD|MADY|MOBI|YONCA|MAIN)\b"), ""),                  # marka / tedarikçi
    (re.compile(r"\bsilinecek\b|\bKAÇ T\?|\?"), ""),
]
def parca_temizle(s):
    if not isinstance(s, str) or not s:
        return s
    t = s
    for rx, rep in _PARCA_RX:
        t = rx.sub(rep, t)
    t = re.sub(r"\(\s*\)", "", t)
    t = re.sub(r"\s+-\s*$|^\s*-\s+", "", t)
    t = re.sub(r"\s{2,}", " ", t).strip(" -")
    return t

# Genel geçiş (tüm dosyalar): yalnız kesin desenler. Tireli/uzun parça no desenleri GENEL geçişte
# kullanılmaz; bisiklet no, oturum kimliği (OT-0001) gibi alanları bozar — onlar yalnız stok adında.
_GENEL_IDX = (0, 1, 2, 3, 4, 8)
def genel_temizle(s):
    if not isinstance(s, str) or not s:
        return s
    t = s
    for i in _GENEL_IDX:
        rx, rep = _PARCA_RX[i]
        t = rx.sub(rep, t)
    if t != s:
        t = re.sub(r"\(\s*\)", "", t)
        t = re.sub(r"\s{2,}", " ", t).strip(" -")
    return t

def _derin_temizle(o):
    if isinstance(o, str):
        return genel_temizle(o)
    if isinstance(o, list):
        return [_derin_temizle(x) for x in o]
    if isinstance(o, dict):
        return {k: _derin_temizle(v) for k, v in o.items()}
    return o

def num(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None


def xdate(v):
    x = num(v)
    if x is None or x < 20000:
        return None
    return EPOCH + timedelta(days=x)


def d_str(v):
    t = xdate(v)
    return t.strftime("%Y-%m-%d") if t else ""


def dt_str(v):
    t = xdate(v)
    return t.strftime("%Y-%m-%d %H:%M") if t else ""


def tm_str(v):
    """Fraction of a day -> HH:MM."""
    x = num(v)
    if x is None:
        return ""
    x = x % 1
    m = int(round(x * 1440))
    return f"{m // 60:02d}:{m % 60:02d}"


def intish(v):
    x = num(v)
    if x is None:
        return str(v).strip()
    return str(int(x)) if x == int(x) else str(x)


def haversine(a, b):
    r = 6371000.0
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def cols_rows(cols, rows):
    return {"cols": cols, "rows": rows}


# ---------------------------------------------------------------- anonymiser
class Anon:
    def __init__(self, T):
        self.T = T
        self.label = {}          # fold(full name) -> label
        self.persons = {}        # label -> dict(first, last)
        self.first = defaultdict(set)
        self.last = defaultdict(set)
        self.cities = set()
        self.unknown = Counter()
        self.plates = {}
        self.sessions = {}
        self._build()

    def _city_set(self):
        T = self.T
        for r in T["personeller"][1]:
            if r.get("İl"):
                self.cities.add(fold(r["İl"]))
        for r in T["servis"][1]:
            for k in ("Teslim Eden", "Teslim Alan", "IL"):
                if r.get(k):
                    self.cities.add(fold(r[k]))
        for r in T["parca"][1]:
            for k in ("Teslim Alınan İl", "Teslim Edilen İl"):
                if r.get(k):
                    self.cities.add(fold(r[k]))
        self.cities.discard("")

    def _is_account(self, name):
        f = fold(name)
        return f in self.cities or "tazi" in f or "personeli" in f or "kademe" in f

    def _account_label(self, name):
        f = fold(name)
        if "kademe" in f:
            return "Kademe hesabı"
        if "personeli" in f:
            return "Saha Personeli"
        return name.strip().title() if name.isupper() else name.strip() + " hesabı"

    def _add_person(self, name, n):
        name = fix_mojibake(name).strip()
        lab = f"Personel {n}"
        toks = name.split()
        self.label[fold(name)] = lab
        self.persons[lab] = {"name": name, "first": toks[0], "last": toks[-1] if len(toks) > 1 else ""}
        self.first[fold(toks[0])].add(lab)
        if len(toks) > 1:
            self.last[fold(toks[-1])].add(lab)

    def _build(self):
        self._city_set()
        T = self.T
        used = []
        for r in T["personeller"][1]:
            pid, name = r.get("Personel ID", "").strip(), r.get("Ad soyad", "").strip()
            if not pid or not name:
                continue
            n = int(re.sub(r"\D", "", pid) or 0)
            used.append(n)
            if self._is_account(name):
                self.label[fold(name)] = self._account_label(name)
            else:
                self._add_person(name, n)
        nxt = max(used or [0]) + 1
        # discover names that appear in data but not in the personnel sheet
        for sheet, cols in NAME_COLUMNS.items():
            for r in T[sheet][1]:
                for c in cols:
                    for part in self._split(r.get(c, "")):
                        f = fold(part)
                        if self._skip(part) or f in self.label:
                            continue
                        toks = part.split()
                        if len(toks) >= 2 and not self._is_account(part):
                            # same person spelled differently? match first+last
                            hit = self.first.get(fold(toks[0]), set()) & self.last.get(fold(toks[-1]), set())
                            if hit:
                                self.label[f] = next(iter(hit))
                            else:
                                self._add_person(part, nxt)
                                nxt += 1
        # free-text patterns, longest first
        pats = []
        for lab, p in self.persons.items():
            pats.append((p["name"], lab))
        for tok_map in (self.first, self.last):
            for f, labs in tok_map.items():
                lab = next(iter(labs)) if len(labs) == 1 else "Personel"
                # recover a display spelling for the token
                src = next(iter(labs))
                p = self.persons[src]
                token = p["first"] if fold(p["first"]) == f else p["last"]
                if len(token) >= 4:
                    pats.append((token, lab))
        pats.sort(key=lambda x: -len(x[0]))
        self.text_res = []
        for token, lab in pats:
            prefix = len(token) >= 5 or " " in token
            self.text_res.append((re.compile(name_regex(token, prefix_only=prefix)), lab))

    @staticmethod
    def _split(v):
        v = fix_mojibake(str(v or "")).strip()
        if not v:
            return []
        return [SUFFIX_RE.sub("", p).strip() for p in v.split(",") if p.strip()]

    def _skip(self, part):
        f = fold(part)
        return (f in {fold(x) for x in NON_PERSON} or f in self.cities or "|" in part
                or re.fullmatch(r"p\d+", f) is not None)

    # ---- public
    def name(self, v):
        """Anonymise a person field (may be 'A, B' and may carry a suffix)."""
        v = fix_mojibake(str(v or "")).strip()
        if not v:
            return ""
        out = []
        for raw in v.split(","):
            raw = raw.strip()
            if not raw:
                continue
            m = SUFFIX_RE.search(raw)
            suffix = m.group(0).strip() if m else ""
            core = SUFFIX_RE.sub("", raw).strip()
            f = fold(core)
            if f in self.label:
                lab = self.label[f]
            elif self._skip(core):
                lab = core
            elif len(core.split()) == 1 and len(self.first.get(f, ())) == 1:
                lab = next(iter(self.first[f]))
            else:
                lab = self.text(core)
                if lab == core:
                    self.unknown[core] += 1
                    lab = "Personel"
            out.append(lab + (" " + suffix if suffix else ""))
        return ", ".join(out)

    def vehicle(self, v):
        v = str(v or "").strip()
        if not v or fold(v) in ("bilinmiyor", "bilinmeyen arac", "bos"):
            return v
        key = re.sub(r"\s+", "", v).upper()
        if key not in self.plates:
            self.plates[key] = f"Araç {len(self.plates) + 1}"
        return self.plates[key]

    def session(self, v):
        v = str(v or "").strip()
        if not v:
            return ""
        if v not in self.sessions:
            self.sessions[v] = f"OT-{len(self.sessions) + 1:04d}"
        return self.sessions[v]

    def text(self, s):
        s = fix_mojibake(str(s or ""))
        if not s:
            return s
        s = re.sub(r"(Oturum ID:\s*)([\w-]+)", lambda m: m.group(1) + self.session(m.group(2)), s)
        s = re.sub(r"Haritada Gör:\s*\S+", "", s)
        s = re.sub(r"https?://\S+", "", s)
        s = re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+", "[gizli]", s)
        s = re.sub(r"(?:\+90|0)\s?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}", "[gizli]", s)
        s = re.sub(r"\b[A-Za-z0-9_-]{25,}\b", "", s)  # Drive ids / tokens
        for key, lab in self.plates.items():
            m = re.match(r"(\d+)([A-Z]+)(\d+)", key)
            pat = r"\s*".join(map(re.escape, m.groups())) if m else re.escape(key)
            s = re.sub(pat, lab, s, flags=re.I)
        for rx, lab in self.text_res:
            s = rx.sub(lab, s)
        return s.strip()


# ---------------------------------------------------------------- builders
def load_all(csv_dir):
    T = {}
    for key, fn in SHEETS.items():
        p = os.path.join(csv_dir, fn)
        T[key] = table(p) if os.path.exists(p) else ([], [])
    return T


def build(csv_dir, out_dir):
    T = load_all(csv_dir)
    A = Anon(T)
    # register plates first so text() can scrub them
    for sheet, cols in VEHICLE_COLUMNS.items():
        for r in T[sheet][1]:
            for c in cols:
                A.vehicle(r.get(c, ""))
    os.makedirs(out_dir, exist_ok=True)
    files = {}
    stats = {"generated": datetime.now().strftime("%Y-%m-%d"), "periods": {}}

    def period(key, dates):
        ds = sorted(d for d in dates if d)
        if ds:
            stats["periods"][key] = [ds[0][:10], ds[-1][:10], len(ds)]

    # ---- fleet list
    fleet = set()
    for row in read_csv(os.path.join(csv_dir, SHEETS["bisiklet_listesi"])):
        if len(row) > 1 and row[1].strip():
            fleet.add(intish(row[1]))

    # ---- depo (maintenance records)
    depo_all = [r for r in T["depo"][1] if r.get("ID", "").strip()]
    rows = []
    for r in depo_all:
        if r.get("Silindi", "").strip() == "1":
            continue
        rows.append([
            intish(r["ID"]), intish(r["Bisiklet numarası"]), r["Scooter numarası"].strip(),
            intish(r["Batarya numarası"]), r["Durum"].strip(), A.text(r["Açıklama"]),
            r["Sahada"].strip(), r["Periyodik bakım"].strip(), intish(r["Km"]),
            A.text(r["İhtiyaç"]), A.text(r["Parça değişimi"]), A.text(r["Eksik parça"]),
            d_str(r["Tarih"]), A.name(r["Personel"]), r["İL"].strip(),
        ])
    rows.sort(key=lambda x: (x[12], int(num(x[0]) or 0)), reverse=True)
    files["depo"] = cols_rows(["id", "bisiklet", "scooter", "batarya", "durum", "aciklama", "sahada",
                               "periyodik", "km", "ihtiyac", "parca", "eksik", "tarih", "personel", "il"], rows)
    period("depo", [x[12] for x in rows])

    periodic = [r for r in depo_all if r["Durum"].strip() == "Periyodik bakım"]
    per_bike = [r for r in periodic if intish(r["Bisiklet numarası"])]
    bikes_maint = {intish(r["Bisiklet numarası"]) for r in per_bike} & fleet
    batteries = {intish(r["Batarya numarası"]) for r in depo_all if r["Batarya numarası"].strip()}
    bat_records = sum(1 for r in depo_all if r["Batarya numarası"].strip())

    # ---- servis (regional repair centre intake)
    serv = [r for r in T["servis"][1] if r.get("ID", "").strip()]
    rows, durs = [], defaultdict(list)
    for r in serv:
        gi, ci = xdate(r["GirisTarihi"]), xdate(r["CikisTarihi"])
        rows.append([
            intish(r["ID"]), r["Tip"].strip(), r["Numara"].strip(), d_str(r["GirisTarihi"]),
            d_str(r["CikisTarihi"]), A.text(r["ArizaSebebi"]), r["Durum"].strip(),
            r["Teslim Eden"].strip(), r["Teslim Alan"].strip(), A.text(r["Yedek Parça"]),
            A.text(r["Yapılan İşlem"]), A.name(r["Personel"]), r["IL"].strip(),
        ])
    rows.sort(key=lambda x: (x[3], x[0]), reverse=True)
    files["servis"] = cols_rows(["id", "tip", "numara", "giris", "cikis", "ariza", "durum", "teslimEden",
                                 "teslimAlan", "parca", "islem", "personel", "il"], rows)
    period("servis", [x[3] for x in rows])
    # The regional centre's own records (each province also logs its side of a
    # shipment; those rows would double count the same scooter).
    centre = Counter(r["IL"].strip() for r in serv if r["IL"].strip()).most_common(1)[0][0]
    own = [r for r in serv if r["IL"].strip() == centre]
    for r in own:
        gi, ci = xdate(r["GirisTarihi"]), xdate(r["CikisTarihi"])
        if gi and ci and ci >= gi:
            durs[gi.strftime("%Y-%m")].append((ci - gi).days)
    med = [{"ay": k, "n": len(v), "medyan": statistics.median(v)} for k, v in sorted(durs.items())]
    med_ok = [m for m in med if m["n"] >= 20]
    serv_provinces = sorted({r["Teslim Eden"].strip() for r in serv if r["Teslim Eden"].strip()})
    repaired = sum(1 for r in own if r["Durum"].strip() == "Onarıldı")
    scooters = {r["Numara"].strip() for r in own if r["Tip"].strip() == "Scooter"}

    # ---- parça onarımı (control-card repair)
    parca = [r for r in T["parca"][1] if r.get("ID", "").strip()]
    rows = []
    for r in parca:
        rows.append([
            intish(r["ID"]), r["Tip"].strip(), r["Numara"].strip(), r["Yedek Parça"].strip().upper(),
            A.name(r["Personel"]), A.text(r["Açıklama"]), d_str(r["Tarih"]),
            r["Teslim Alınan İl"].strip(), r["Teslim Edilen İl"].strip(), A.text(r["Arıza Sebebi"]),
            A.text(r["Yapılan İşlem"]), r["Onarım Aşaması"].strip(),
        ])
    rows.sort(key=lambda x: (x[6], int(num(x[0]) or 0)), reverse=True)
    files["onarim"] = cols_rows(["id", "tip", "numara", "parca", "personel", "aciklama", "tarih",
                                 "alinanIl", "edilenIl", "ariza", "islem", "asama"], rows)
    period("onarim", [x[6] for x in rows])

    # ---- görevler
    rows = []
    for r in T["gorev"][1]:
        if not r.get("no", "").strip():
            continue
        rows.append([
            intish(r["no"]), intish(r["Bisiklet numarası"]), r["Scooter numarası"].strip(),
            r["Atama ili"].strip(), r["Durum"].strip() or "Bekliyor", A.text(r["Görev"]),
            A.name(r["Personel"]), dt_str(r["Tarih"]), dt_str(r["Tamamlanma Tarihi"]),
            A.name(r["Tamamlayan"]), A.name(r["Vardiya Sahibi"]), A.text(r["Not"]),
        ])
    rows.sort(key=lambda x: (x[7], int(num(x[0]) or 0)), reverse=True)
    files["gorevler"] = cols_rows(["no", "bisiklet", "scooter", "il", "durum", "gorev", "personel",
                                   "tarih", "tamamlanma", "tamamlayan", "vardiyaSahibi", "not"], rows)
    period("gorevler", [x[7] for x in rows])

    # ---- sayımlar
    rows = []
    for r in T["sayim"][1]:
        if not r.get("ID", "").strip() or not r.get("Tip", "").strip():
            continue
        rows.append([intish(r["ID"]), r["Tip"].strip().capitalize(), intish(r["Numara"]),
                     d_str(r["Tarih"]), A.name(r["Personel"]), r["İl"].strip()])
    rows.sort(key=lambda x: (x[3], int(num(x[0]) or 0)), reverse=True)
    files["sayimlar"] = cols_rows(["id", "tip", "numara", "tarih", "personel", "il"], rows)
    period("sayimlar", [x[3] for x in rows])

    # ---- vardiya plan + gerçekleşme
    head, vrows = T["vardiya"]
    people_cols = []
    for h in head[2:]:
        base = re.sub(r"#\d+$", "", SUFFIX_RE.sub("", h)).strip()
        if not base or fold(base).startswith(("column", "gercek", "unnamed")):
            continue
        people_cols.append(h)
    people = [A.name(h) for h in people_cols]
    plan = []
    for r in vrows:
        d = d_str(r.get("Tarih", ""))
        if not d:
            continue
        vals = [r.get(h, "").strip() for h in people_cols]
        notes = [A.text(r.get(h, "")) for h in head if fold(h).startswith("column") and r.get(h, "").strip()]
        # keep calendar notes (holidays, swaps); drop HR / health remarks
        notes = [n for n in notes if not re.search(r"ayr[ıi]l|işten|rapor|hasta|düğün|kına|nişan|cenaze|doğum|taziye", n, re.I)]
        if any(vals):
            plan.append([d, r.get("Gün", "").strip(), vals, " · ".join(notes)])
    gercek = []
    for r in T["vardiya_gercek"][1]:
        if not d_str(r.get("Tarih", "")):
            continue
        gercek.append([d_str(r["Tarih"]), A.name(r["Personel"]), r["Planlanan"].strip(),
                       tm_str(r["Gerçek Başlangıç"]), int(num(r["Gecikme (dk)"]) or 0)])
    gercek.sort(key=lambda x: x[0], reverse=True)
    files["vardiya"] = {"kisiler": people, "plan": plan,
                        "gerceklesme": cols_rows(["tarih", "personel", "planlanan", "gercek", "gecikme"], gercek)}
    period("vardiya_plan", [p[0] for p in plan])
    period("vardiya_gerceklesme", [g[0] for g in gercek])

    # ---- araç teslim
    rows = []
    for r in T["teslim"][1]:
        if not r.get("ID", "").strip():
            continue
        fotos = sum(1 for i in range(1, 6) if r.get(f"Foto {i} (Drive ID)", "").strip())
        rows.append([intish(r["ID"]), dt_str(r["Tarih"]), A.name(r["Vardiyası Biten"]),
                     A.name(r["Vardiyası Başlayan"]), A.vehicle(r["Araç No"]), A.text(r["Hasar Notu"]),
                     fotos, r["İl"].strip(), A.name(r["Personel"]), r["Durum"].strip()])
    rows.sort(key=lambda x: x[1], reverse=True)
    files["teslim"] = cols_rows(["id", "tarih", "biten", "baslayan", "arac", "not", "foto", "il",
                                 "personel", "durum"], rows)
    period("teslim", [x[1] for x in rows])

    # ---- istasyonlar (drop private home zones)
    private_names, private_pts, stations = set(), [], []
    zones_total = 0
    for r in T["istasyon"][1]:
        if not r.get("İstasyon Adı", "").strip():
            continue
        if r.get("İl", "").strip():
            zones_total += 1
        lat, lng = num(r["Enlem"]), num(r["Boylam"])
        if r.get("MerkezId", "").strip() == PRIVATE_ZONE_MERKEZ:
            private_names.add(fold(r["İstasyon Adı"]))
            if lat and lng:
                private_pts.append((lat, lng, max(400.0, (num(r["Yarıçap (Metre)"]) or 0) + 150)))
            continue
        tur = r.get("Açıklama", "").strip() or "İstasyon"
        stations.append([r["ID"].strip(), r["İstasyon Adı"].strip(), r["İl"].strip(),
                         round(lat, 6), round(lng, 6), int(num(r["Yarıçap (Metre)"]) or 50), tur])
    files["istasyonlar"] = cols_rows(["id", "ad", "il", "lat", "lng", "yaricap", "tur"], stations)
    station_count = sum(1 for s in stations if s[6] == "İstasyon")

    def is_private(name):
        f = fold(name)
        return any(p and p in f for p in private_names)

    # ---- istasyon ziyaretleri
    rows = []
    visits_total = 0
    for r in T["ziyaret"][1]:
        if not r.get("Ziyaret ID", "").strip() or r.get("Silindi", "").strip() == "1":
            continue
        visits_total += 1
        ad = r.get("İstasyon Adı", "").strip() or r.get("İstasyon ID", "").strip()
        if is_private(ad):
            continue
        g, c = xdate(r["Giriş Zamanı"]), xdate(r["Çıkış Zamanı"])
        dk = round((c - g).total_seconds() / 60, 1) if g and c and c >= g else None
        rows.append([intish(r["Ziyaret ID"]), ad, A.name(r["Sürücü"]), A.vehicle(r["Araç No"]),
                     dt_str(r["Giriş Zamanı"]), dt_str(r["Çıkış Zamanı"]), dk, r["İl"].strip()])
    rows.sort(key=lambda x: x[4], reverse=True)
    files["ziyaretler"] = cols_rows(["id", "istasyon", "surucu", "arac", "giris", "cikis", "dakika", "il"], rows)
    period("ziyaretler", [x[4] for x in rows])

    # ---- sürüş oturumları (AracDinamik)
    dyn = []
    km_total = 0.0
    for r in T["dinamik"][1]:
        if not r.get("Oturum ID", "").strip():
            continue
        km = num(r["Mesafe (km)"]) or 0.0
        km_total += km
        dyn.append([A.session(r["Oturum ID"]), A.name(r["Sürücü"]), dt_str(r["Başlangıç"]),
                    dt_str(r["Bitiş"]), r["Süre"].strip(), num(r["Max Hız (km/h)"]) or 0,
                    num(r["Ort Hız (km/h)"]) or 0, round(km, 2), int(num(r["Sert Fren"]) or 0),
                    int(num(r["Ani Gaz"]) or 0), int(num(r["30 Dk Üzeri Duraklama Sayısı"]) or 0)])
    dyn.sort(key=lambda x: x[2], reverse=True)
    files["suruler"] = cols_rows(["oturum", "surucu", "baslangic", "bitis", "sure", "maxHiz", "ortHiz",
                                  "km", "sertFren", "aniGaz", "duraklama30"], dyn)
    period("suruler", [x[2] for x in dyn])

    # ---- GPS sample routes
    by_sess = defaultdict(list)
    for r in T["rota"][1]:
        sid = r.get("Oturum ID", "").strip()
        lat, lng = num(r.get("Enlem")), num(r.get("Boylam"))
        t = xdate(r.get("Zaman"))
        if sid and lat and lng and t:
            by_sess[sid].append((t, lat, lng, num(r.get("Hız (km/h)")) or 0.0, r.get("Olay", "").strip(),
                                 r.get("Sürücü", "")))
    cand = []
    for sid, pts in by_sess.items():
        pts.sort()
        dist = sum(haversine(pts[i][1:3], pts[i + 1][1:3]) for i in range(len(pts) - 1))
        cand.append((dist, sid))
    cand.sort(reverse=True)
    chosen, days = [], set()
    for dist, sid in cand:
        day = by_sess[sid][0][0].strftime("%Y-%m-%d")
        if 30000 <= dist <= 120000 and day not in days:
            chosen.append(sid)
            days.add(day)
        if len(chosen) == 3:
            break
    routes = []
    for sid in sorted(chosen, key=lambda s: by_sess[s][0][0]):
        pts = by_sess[sid]
        cum = [0.0]
        for i in range(1, len(pts)):
            cum.append(cum[-1] + haversine(pts[i - 1][1:3], pts[i][1:3]))
        total = cum[-1]
        kept, last = [], None
        for p, c in zip(pts, cum):
            if c < 300 or c > total - 300:
                continue
            if any(haversine(p[1:3], z[:2]) < z[2] for z in private_pts):
                continue
            if last is None or haversine(last[1:3], p[1:3]) >= 30:
                kept.append([round(p[1], 5), round(p[2], 5), round(p[3]), "H" if p[4] == "Aşırı Hız" else ""])
                last = p
        routes.append({"oturum": A.session(sid), "tarih": pts[0][0].strftime("%Y-%m-%d"),
                       "baslangic": pts[0][0].strftime("%H:%M"), "bitis": pts[-1][0].strftime("%H:%M"),
                       "surucu": A.name(pts[0][5]), "km": round(total / 1000, 1), "noktalar": kept})
    files["rotalar"] = {"not": "Örnek vardiyalar; ~30 m seyreltildi, her oturumun ilk/son 300 m'si kesildi.",
                        "rotalar": routes}

    # ---- stok
    def stok(key):
        head, rs = T[key]
        iller = [h for h in head[2:] if h and h not in ("Toplam Stok", "Kritik Eşik", "Son Güncelleme")
                 and not h.startswith("Unnamed")]
        out = []
        for r in rs:
            if not r.get("Stok kodu", "").strip():
                continue
            out.append([f"{'SC' if key == 'stok_scooter' else 'BS'}-{len(out) + 1:03d}", parca_temizle(r["Ürün"].strip())] +
                       [int(num(r.get(il)) or 0) for il in iller] +
                       [int(num(r.get("Toplam Stok")) or 0), r.get("Kritik Eşik", "").strip(),
                        d_str(r.get("Son Güncelleme", ""))])
        return {"iller": iller, "rows": out}
    files["stok"] = {"scooter": stok("stok_scooter"), "bisiklet": stok("stok_bisiklet")}

    # ---- bildirimler (automatic alerts)
    notif = [r for r in T["notifications"][1] if r.get("ID", "").strip()]
    rows, by_month, by_kind = [], Counter(), Counter()
    for r in notif:
        title = r["Title"].strip()
        t = dt_str(r["CreatedAt"])
        kind = title.split(":")[0].strip() if ":" in title else title
        by_month[t[:7]] += 1
        by_kind[kind] += 1
        if is_private(title) or is_private(r["Message"]):
            continue
        rows.append([intish(r["ID"]), A.text(title), A.text(r["Message"]), t, A.name(r["CreatedBy"]),
                     r["TargetIl"].strip(), r["TargetRole"].strip(), r["Tip"].strip() or "genel"])
    rows.sort(key=lambda x: x[3], reverse=True)
    files["bildirimler"] = cols_rows(["id", "baslik", "mesaj", "tarih", "olusturan", "il", "rol", "tip"],
                                     rows[:1500])
    period("bildirimler", [x[3] for x in rows])

    # ---- personel (roles only)
    pers = []
    for r in T["personeller"][1]:
        if not r.get("Personel ID", "").strip() or not r.get("Ad soyad", "").strip():
            continue
        perms = [k.split(":")[1].strip() for k in r if k.startswith("Yetki:") and r[k].strip().upper() == "EVET"]
        pers.append([A.name(r["Ad soyad"]), r["İl"].strip(), r["Rol"].strip(), r["Aktif/Pasif"].strip(), perms])
    files["personel"] = cols_rows(["ad", "il", "rol", "durum", "yetkiler"], pers)

    # ---- activity / changelog (counts only)
    act = T["activity"][1]
    chg = T["changelog"][1]
    ops_month = Counter()
    for r in act:
        t = xdate(r.get("Tarih"))
        if t:
            ops_month[t.strftime("%Y-%m")] += 1
    for r in chg:
        t = xdate(r.get("ts"))
        if t:
            ops_month[t.strftime("%Y-%m")] += 1
    provinces_used = set()
    for r in chg:
        for k in ("personel", "personel#1"):
            v = r.get(k, "")
            if "|" in v:
                il = v.split("|", 1)[1].strip()
                if il:
                    provinces_used.add(il.replace(" Anadolu", ""))
    for r in T["personeller"][1]:
        if r.get("İl", "").strip() and r.get("Ad soyad", "").strip():
            provinces_used.add(r["İl"].strip())

    # ---- dashboard snapshot (sheet as the app showed it)
    snap = {}
    dash = read_csv(os.path.join(csv_dir, SHEETS["dashboard"]))
    for i, row in enumerate(dash[:40]):
        cells = [c for c in row if c.strip()]
        if any("TOPLAM FİLO" in c for c in cells) and i + 1 < len(dash):
            nums = [num(c) for c in dash[i + 1] if num(c) is not None]
            if len(nums) >= 4:
                snap.update(toplam=int(nums[0]), sahada=int(nums[1]), bakimda=int(nums[2]), kayip=int(nums[3]))
        if any("5+ GÜN DEPODA" in c for c in cells) and i + 1 < len(dash):
            vals = [c for c in dash[i + 1] if c.strip()]
            if len(vals) >= 5:
                snap.update(gun5=int(num(vals[1]) or 0), ortDepo=vals[2], parcaDegisimi=int(num(vals[3]) or 0),
                            tamamlananOnarim=int(num(vals[4]) or 0))
        if any("TAM BAKIMLI FİLO" in c for c in cells) and i + 1 < len(dash):
            vals = [c for c in dash[i + 1] if c.strip()]
            if len(vals) >= 5:
                snap.update(tamBakimli=int(num(vals[1]) or 0), parcaIhtiyaci=int(num(vals[2]) or 0),
                            sonGuncelleme=d_str(vals[4]))

    # ---- monthly series for charts
    depo_month = Counter(d_str(r["Tarih"])[:7] for r in depo_all if d_str(r["Tarih"]))
    per_month = Counter(d_str(r["Tarih"])[:7] for r in per_bike if d_str(r["Tarih"]))
    parca_month = Counter(x[6][:7] for x in files["onarim"]["rows"] if x[6])
    serv_month = Counter(x[3][:7] for x in files["servis"]["rows"] if x[3])
    p_levels = Counter(r["Periyodik bakım"].strip() for r in per_bike if r["Periyodik bakım"].strip())
    parts = Counter()
    for r in depo_all:
        for p in re.split(r"[,;/]", r.get("Parça değişimi", "")):
            p = p.strip().capitalize()
            if p:
                parts[p] += 1

    team = len(people)  # persons on the 24/7 shift plan

    stats.update({
        "filo": {"bisiklet": len(fleet), "bolge": zones_total, "istasyon": station_count,
                 "demoBolge": len(stations), "sahada": snap.get("sahada"), "toplam": snap.get("toplam"),
                 "sahadaYuzde": round(100 * snap["sahada"] / snap["toplam"], 1) if snap.get("toplam") else None},
        "bakim": {"bakimdanGecenBisiklet": len(bikes_maint), "filo": len(fleet),
                  "periyodikKayit": len(per_bike), "bataryaKontrol": len(batteries),
                  "bataryaKayit": bat_records, "depoKayit": len(depo_all)},
        "onarimMerkezi": {"kartOnarimi": len(parca), "scooter": len(scooters), "servisKayit": len(serv),
                          "merkez": centre, "merkezKayit": len(own), "onarildi": repaired,
                          "onarildiYuzde": round(100 * repaired / len(own), 1) if own else None,
                          "iller": serv_provinces, "ilSayisi": len(serv_provinces),
                          "medyanIlk": med_ok[0] if med_ok else None, "medyanSon": med_ok[-1] if med_ok else None,
                          "medyanAylik": med},
        "kullanim": {"ilSayisi": len(provinces_used), "iller": sorted(provinces_used),
                     "islem": len(act) + len(chg), "aktivite": len(act), "degisiklik": len(chg),
                     "km": round(km_total, 1), "surusOturumu": len(dyn), "istasyonZiyareti": visits_total,
                     "uyari": len(notif), "ekip": team},
        "dashboard": snap,
        "seriler": {
            "depoAylik": sorted(depo_month.items()), "periyodikAylik": sorted(per_month.items()),
            "kartOnarimAylik": sorted(parca_month.items()), "servisAylik": sorted(serv_month.items()),
            "islemAylik": sorted(ops_month.items()), "uyariAylik": sorted(by_month.items()),
            "uyariTur": by_kind.most_common(8), "periyodikKademe": sorted(p_levels.items()),
            "enCokParca": parts.most_common(8),
        },
    })
    files["stats"] = stats

    # Row ids are not needed by the demo and short numbers could collide with
    # PIN codes in the audit, so they are dropped.
    for obj in files.values():
        if isinstance(obj, dict) and obj.get("cols") and obj["cols"][0] in ("id", "no"):
            obj["cols"] = obj["cols"][1:]
            obj["rows"] = [r[1:] for r in obj["rows"]]
    for name in list(files):
        if name != "stats":
            files[name] = _derin_temizle(files[name])
    for name, obj in files.items():
        with open(os.path.join(out_dir, f"{name}.json"), "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    total = sum(os.path.getsize(os.path.join(out_dir, f"{n}.json")) for n in files)
    print(f"{len(files)} files, {total / 1024:.0f} KB -> {out_dir}")
    if A.unknown:
        print("Unrecognised name-field values replaced with 'Personel':", sum(A.unknown.values()))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True, help="folder with the private sheet1..26.csv export")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data"))
    a = ap.parse_args()
    build(a.csv, a.out)
