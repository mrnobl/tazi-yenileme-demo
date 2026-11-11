"""Shared helpers for the anonymisation build and the audit.

No real personal data lives in this file: every name, plate, PIN or link is
read at run time from the private CSV export, which is never committed.
"""
import csv
import re

csv.field_size_limit(10**9)

TR_FOLD = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")


def tr_lower(s: str) -> str:
    return s.replace("I", "ı").replace("İ", "i").lower()


def fold(s: str) -> str:
    """Case- and diacritic-insensitive key (Turkish aware)."""
    return tr_lower(s).translate(TR_FOLD).strip()


def fix_mojibake(s: str) -> str:
    """Repair UTF-8 text that was decoded as cp1252/latin-1 (e.g. 'KÃ–SE')."""
    if "Ã" not in s and "Ä" not in s and "Å" not in s:
        return s
    s2 = re.sub(r"_x([0-9a-fA-F]{4})_", lambda m: chr(int(m.group(1), 16)), s)
    out = bytearray()
    for ch in s2:
        try:
            out += ch.encode("cp1252")
        except UnicodeEncodeError:
            try:
                out += ch.encode("latin-1")
            except UnicodeEncodeError:
                return s
    try:
        return out.decode("utf-8")
    except UnicodeDecodeError:
        return s


def char_class(c: str) -> str:
    variants = {c, c.lower(), c.upper(), tr_lower(c)}
    up = {"i": "İ", "ı": "I"}.get(c, c.upper())
    variants.add(up)
    for v in list(variants):
        variants.add(v.translate(TR_FOLD))
        variants.add(v.translate(TR_FOLD).lower())
        variants.add(v.translate(TR_FOLD).upper())
    if c == " ":
        return r"[\s_]+"
    return "[" + "".join(re.escape(v) for v in sorted(variants) if v) + "]"


def name_regex(name: str, prefix_only: bool = True) -> str:
    """Regex for a name, Turkish case/diacritic insensitive.
    Left word boundary always; right boundary only if prefix_only is False."""
    body = "".join(char_class(c) for c in name)
    pat = r"(?<![\w])" + body
    if not prefix_only:
        pat += r"(?![\w])"
    return pat


def read_csv(path):
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.reader(f))


def table(path):
    """Return (header, rows as dicts). Duplicate headers get a numeric suffix."""
    rows = read_csv(path)
    if not rows:
        return [], []
    head = []
    seen = {}
    for h in rows[0]:
        h = h.strip()
        if h in seen:
            seen[h] += 1
            h = f"{h}#{seen[h]}"
        else:
            seen[h] = 0
        head.append(h)
    out = []
    for r in rows[1:]:
        d = {head[i]: (r[i] if i < len(r) else "") for i in range(len(head))}
        out.append(d)
    return head, out


SHEETS = {
    "dashboard": "sheet1.csv",
    "depo": "sheet2.csv",
    "notifications": "sheet3.csv",
    "personeller": "sheet4.csv",
    "gecikme": "sheet5.csv",
    "gorev": "sheet6.csv",
    "sayim": "sheet7.csv",
    "vardiya": "sheet8.csv",
    "vardiya_gercek": "sheet9.csv",
    "rota": "sheet10.csv",
    "teslim": "sheet11.csv",
    "dinamik": "sheet12.csv",
    "konum": "sheet13.csv",
    "takip": "sheet14.csv",
    "stok_scooter": "sheet15.csv",
    "stok_bisiklet": "sheet16.csv",
    "servis": "sheet17.csv",
    "parca": "sheet18.csv",
    "istasyon": "sheet19.csv",
    "ziyaret": "sheet20.csv",
    "activity": "sheet21.csv",
    "changelog": "sheet22.csv",
    "systemlogs": "sheet23.csv",
    "versiyon": "sheet24.csv",
    "bisiklet_listesi": "sheet25.csv",
    "gorev_yedek": "sheet26.csv",
}

# Columns that hold a person (or a comma separated list of persons).
NAME_COLUMNS = {
    "depo": ["Personel"],
    "notifications": ["CreatedBy"],
    "personeller": ["Ad soyad"],
    "gorev": ["Personel", "Tamamlayan", "Vardiya Sahibi", "Not Yazan", "Düzenleyen"],
    "gorev_yedek": ["Personel", "Tamamlayan", "Vardiya Sahibi", "Not Yazan", "Düzenleyen"],
    "sayim": ["Personel"],
    "vardiya_gercek": ["Personel"],
    "rota": ["Sürücü"],
    "teslim": ["Vardiyası Biten", "Vardiyası Başlayan", "Personel"],
    "dinamik": ["Sürücü"],
    "konum": ["Personel ID", "Sürücü"],
    "servis": ["Personel"],
    "parca": ["Personel"],
    "ziyaret": ["Sürücü"],
    "activity": ["Kullanıcı"],
    "changelog": ["personel#1"],
    "systemlogs": ["Personel ID"],
}

VEHICLE_COLUMNS = {
    "rota": ["Araç No"],
    "teslim": ["Araç No"],
    "dinamik": ["Araç No"],
    "konum": ["Araç No"],
    "ziyaret": ["Araç No"],
    "systemlogs": ["Araç No"],
}

NON_PERSON = {
    "", "boş", "sistem", "deneme", "bilinmiyor", "depo", "e-tablo", "belli değil",
    "saha personeli", "bilinmeyen araç", "tümü", "admin", "personel", "nan",
}
SUFFIX_RE = re.compile(r"\s*\((?:vardiya dışı|sabit)\)\s*$", re.I)
