"""Anonymity audit: fails if any personal value from the private export leaks.

Usage:
    python tools/anonim_denetim.py --csv <private csv folder> [--android <app project>] [--root .]

It collects, from the private sources at run time,
  * every person name (full name, first name, surname),
  * passwords / PINs, vehicle plates, Drive photo ids, original session ids,
  * every URL / Apps Script deployment id / API key in the data and app code,
  * coordinates of private geofences (staff homes),
and searches every file under --root (except .git). Exit code 1 on any hit.
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from anonim_ortak import (  # noqa: E402
    NAME_COLUMNS, NON_PERSON, SHEETS, SUFFIX_RE, VEHICLE_COLUMNS,
    fix_mojibake, fold, name_regex, table,
)

TEXT_EXT = {".html", ".htm", ".js", ".css", ".json", ".md", ".py", ".txt", ".svg", ".xml", ".yml", ".yaml", ""}


def collect(csv_dir, android_dir):
    T = {k: table(os.path.join(csv_dir, f)) if os.path.exists(os.path.join(csv_dir, f)) else ([], [])
         for k, f in SHEETS.items()}
    cities = set()
    for r in T["personeller"][1]:
        cities.add(fold(r.get("İl", "")))
    for r in T["servis"][1]:
        for k in ("Teslim Eden", "Teslim Alan", "IL"):
            cities.add(fold(r.get(k, "")))
    for r in T["parca"][1]:
        for k in ("Teslim Alınan İl", "Teslim Edilen İl"):
            cities.add(fold(r.get(k, "")))
    non_person = {fold(x) for x in NON_PERSON} | cities

    names = set()
    for sheet, cols in NAME_COLUMNS.items():
        for r in T[sheet][1]:
            for c in cols:
                for part in fix_mojibake(r.get(c, "")).split(","):
                    part = SUFFIX_RE.sub("", part).strip()
                    f = fold(part)
                    if (not part or f in non_person or "|" in part or re.fullmatch(r"p\d+", f)
                            or "tazi" in f or "personeli" in f or "kademe" in f):
                        continue
                    names.add(part)
    full = {n for n in names if len(n.split()) >= 2}
    tokens = set()
    for n in full:
        for t in n.split():
            if len(t) >= 4:
                tokens.add(t)
    # single first names used as ids (shift plan headers, system logs)
    for n in names:
        if len(n.split()) == 1 and len(n) >= 4:
            tokens.add(n)

    checks = []  # (label, compiled regex)
    for n in sorted(full):
        checks.append(("ad-soyad", re.compile(name_regex(n, prefix_only=False))))
    for t in sorted(tokens):
        checks.append(("ad/soyad parçası", re.compile(name_regex(t, prefix_only=len(t) >= 5))))

    pins = set()
    for r in T["personeller"][1]:
        for k, v in r.items():
            if ("ifre" in k or "assword" in k.lower()) and v.strip():
                pins.add(re.sub(r"\.0$", "", v.strip()))
    for p in sorted(pins):
        checks.append(("şifre", re.compile(r"(?<![\w.])" + re.escape(p) + r"(?![\w])")))

    plates = set()
    for sheet, cols in VEHICLE_COLUMNS.items():
        for r in T[sheet][1]:
            for c in cols:
                v = r.get(c, "").strip()
                if v and fold(v) not in ("bilinmiyor", "bilinmeyen arac", "bos"):
                    plates.add(re.sub(r"\s+", "", v).upper())
    for p in sorted(plates):
        m = re.match(r"(\d+)([A-Z]+)(\d+)$", p)
        pat = r"\s*".join(map(re.escape, m.groups())) if m else re.escape(p)
        checks.append(("plaka", re.compile(pat, re.I)))

    literals = set()
    for r in T["teslim"][1]:
        for k, v in r.items():
            if k.startswith("Foto") and len(v.strip()) >= 12:
                literals.add(v.strip())
    for sheet in ("rota", "dinamik", "konum"):
        for r in T[sheet][1]:
            v = r.get("Oturum ID", "").strip()
            if v:
                literals.add(v)
    url_re = re.compile(r"https?://[^\s\"'<>),]+")
    for sheet in T:
        for r in T[sheet][1]:
            for v in r.values():
                for u in url_re.findall(v):
                    literals.add(u.rstrip("."))
    if android_dir and os.path.isdir(android_dir):
        for dp, dn, fn in os.walk(android_dir):
            dn[:] = [d for d in dn if d not in ("build", ".gradle", ".git", ".idea")]
            for f in fn:
                if os.path.splitext(f)[1] not in (".kt", ".java", ".xml", ".txt", ".html", ".js", ".properties", ".json"):
                    continue
                try:
                    s = open(os.path.join(dp, f), encoding="utf-8", errors="ignore").read()
                except OSError:
                    continue
                for m in re.findall(r"AKfy(?:c)b[\w-]{20,}", s):
                    literals.add(m)
                for m in re.findall(r"AIza[\w-]{30,}", s):
                    literals.add(m)
                for m in re.findall(r"https://script[.]google[.]com/[^\s\"']+", s):
                    literals.add(m)
    # generic leak patterns, independent of the source
    checks.append(("apps-script", re.compile(r"script[.]google[.]com|AKfy(?:c)b|AIza[\w-]{20,}")))
    checks.append(("drive/maps", re.compile(r"drive[.]google|docs[.]google|googleuser(?:c)ontent|maps[.]google")))
    checks.append(("e-posta", re.compile(r"[\w.+-]+@[\w-]+\.(?:com|net|org|tr|io|co)\b")))
    checks.append(("telefon", re.compile(r"(?<!\d)(?:\+90|0)\s?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)")))
    for lit in sorted(literals, key=len, reverse=True):
        if len(lit) >= 8:
            checks.append(("kaynak değeri", re.compile(re.escape(lit))))

    zones = []
    for r in T["istasyon"][1]:
        if r.get("MerkezId", "").strip() == "M-3":
            try:
                lat, lng = float(r["Enlem"].replace(",", ".")), float(r["Boylam"].replace(",", "."))
                rad = float(r.get("Yarıçap (Metre)", "0") or 0)
                zones.append((lat, lng, max(300.0, rad)))
            except (ValueError, KeyError):
                pass
            if r.get("İstasyon Adı", "").strip():
                checks.append(("özel bölge adı", re.compile(name_regex(r["İstasyon Adı"].strip(), False))))
    checks.append(("özel bölge yakınında koordinat", zones))
    summary = {"ad-soyad": len(full), "ad/soyad parçası": len(tokens), "şifre": len(pins),
               "plaka": len(plates), "kaynak değeri (url/foto/oturum/anahtar)": len(literals)}
    return checks, summary


COORD = re.compile(r"(?<![\d.])(3[6-9]\.\d{3,}|4[0-2]\.\d{3,})\s*,\s*(2[6-9]\.\d{3,}|3[0-9]\.\d{3,}|4[0-5]\.\d{3,})")


def dist(a, b):
    import math
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def scan(root, checks):
    hits = []
    nfiles = 0
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in (".git", "__pycache__")]
        for f in fn:
            path = os.path.join(dp, f)
            if os.path.splitext(f)[1].lower() not in TEXT_EXT:
                continue
            nfiles += 1
            s = open(path, encoding="utf-8", errors="ignore").read()
            # Izin listesi: sayfa sahibinin kendi adi YALNIZ tanitim sayfasinda (kendi rizasiyla).
            if f == "index.html":
                for izinli in ("".join(map(chr, [78, 101, 118, 122, 97, 116, 32, 75, 246, 115, 101, 111, 287, 108, 117])), "".join(map(chr, [110, 101, 118, 122, 97, 116, 45, 107, 37, 67, 51, 37, 66, 54, 115, 101, 111, 37, 67, 52, 37, 57, 70, 108, 117, 45, 52, 49, 53, 49, 57, 97, 98, 48]))):
                    s = s.replace(izinli, "")
            for label, rx in checks:
                if isinstance(rx, list):
                    for m in COORD.finditer(s):
                        p = (float(m.group(1)), float(m.group(2)))
                        z = next((z for z in rx if dist(p, z[:2]) < z[2]), None)
                        if z:
                            hits.append((os.path.relpath(path, root), label, f"{p} ~{dist(p, z[:2]):.0f} m"))
                            break
                    continue
                for m in rx.finditer(s):
                    a = max(0, m.start() - 30)
                    hits.append((os.path.relpath(path, root), label, s[a:m.end() + 30].replace("\n", " ")))
                    break
    return hits, nfiles


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--android", default="")
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    a = ap.parse_args()
    checks, summary = collect(a.csv, a.android)
    # Tedarikçi stok kodları ve iç model kodları da yasak (parça adları anonim olmalı)
    checks += [("stok kodu", re.compile(r"\bY[A-Z]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\.\d{3}\b")),
               ("iç model kodu", re.compile(r"\bTZ\d+\b"))]
    hits, nfiles = scan(a.root, checks)
    print("Aranan değer grupları:", summary, "| toplam desen:", len(checks))
    print("Taranan dosya:", nfiles)
    if hits:
        print(f"HATA: {len(hits)} eşleşme bulundu")
        for h in hits[:200]:
            print("  ", h[0], "|", h[1], "|", h[2])
        sys.exit(1)
    print("TEMİZ: hiçbir kişisel değer bulunmadı.")


if __name__ == "__main__":
    main()
