# Tazı Yenileme Merkezi — web demo

A read-only, in-browser demo of **Tazı Yenileme Merkezi** ("Tazı Refurbishment Centre"), an Android field app built for the Samsun operation of Tazı, a bike and e-scooter sharing company. The app ran periodic maintenance for the 299-bike Samsun fleet, the regional repair centre that served eight provinces, the 24/7 shift roster, vehicle handovers, station geofences and GPS driving sessions.

- `index.html` — project page (English / Turkish): problem, solution, role, measured results, timeline.
- `app.html` — the app's screens rebuilt for the browser inside a phone frame (full screen on mobile), driven by the real records after anonymisation. Nothing can be saved; write buttons show a "demo mode" notice.

The original app is Kotlin + Android with Google Sheets / Apps Script as the back end. This repository contains only the static demo; no app source, credentials or endpoints.

## Screens in the demo

Overview (dashboard), Depot records, Periodic maintenance (overdue list), Control-card repair, Service records (regional repair centre), Shift management (roster + actual start / delay report), Vehicle handover (photo slots as placeholders), Tasks, Stations map with geofences and visits, Vehicle tracking (sample GPS routes + driving sessions), Stock inventory, Inventory counts, Notifications. UI is Turkish like the app; titles and menus switch to English with the `EN` button.

## Run locally

```
python -m http.server 8000
# open http://localhost:8000/
```

The pages load JSON with `fetch`, so open them through a web server, not from the file system. No build step. External libraries are loaded from pinned CDN versions: Leaflet 1.9.4, Chart.js 4.4.1; map tiles from OpenStreetMap.

## Data and privacy

`data/*.json` (~1.4 MB) is generated from a private Google Sheets export that is **not** in this repository:

```
python tools/veri_uret.py --csv <folder with sheet1..26.csv>
python tools/anonim_denetim.py --csv <same folder> [--android <app project folder>]
```

`veri_uret.py` replaces every person with a consistent label (`Personel 1`, `Personel 2`, ... — the same person keeps the same number in every table and inside free-text notes and session ids) and drops passwords, phone numbers, e-mail addresses, vehicle plates, device ids, Drive photo ids and links, URLs and zones around staff homes. GPS tracks are limited to three sample shifts, thinned to about 30 m, with the first and last 300 m of each session cut and points near private zones removed. Station coordinates are kept (public docking stations). Bike, scooter and battery serial numbers, provinces and dates are real.

`anonim_denetim.py` reads the private export again, collects every name (full, first and last), PIN, plate, photo id, original session id, URL, Apps Script deployment id and API key, plus private-zone coordinates, and searches every file in this folder. It exits with an error on a single match.

## Layout

```
index.html          project page
app.html            app demo
assets/             theme.css, site.css/js, app.css/js, icon.svg
data/               anonymised JSON
tools/              veri_uret.py (build), anonim_denetim.py (audit), anonim_ortak.py (shared)
```
