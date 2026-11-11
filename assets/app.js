/* Tazı Yenileme Merkezi — read-only web demo of the Android field app.
   Vanilla JS, hash routing, data from ../data/*.json (anonymised). */
(function () {
  "use strict";

  // ------------------------------------------------------------ i18n
  const I18N = {
    tr: {
      appName: "Tazı Yenileme Merkezi", demo: "Demo modu", demoNote: "salt okunur · gerçek veri, anonimleştirilmiş",
      readonly: "Demo modu: kaydedilmez", notInDemo: "Bu ekran demoda yer almıyor",
      dashboard: "Genel Durum", depo: "Depo Kayıtları", periyodik: "Periyodik Bakımlar", servis: "Servis Kayıtları",
      onarim: "Kontrol Kartı Onarımı", vardiya: "Vardiya Yönetimi", teslim: "Araç Teslim", gorevler: "Görevler",
      istasyonlar: "İstasyonlar", takip: "Araç Takip", stok: "Stok Envanteri", sayim: "Envanter Sayımları",
      bildirimler: "Bildirimler", istatistik: "İstatistikler", prim: "Prim Raporu", ayarlar: "Ayarlar",
      secMain: "Ana", secField: "Saha ve vardiya", secRepair: "Bakım ve onarım", secInv: "Envanter", secOther: "Diğer",
      search: "Ara…", all: "Tümü", loadMore: "Daha fazla göster", records: "kayıt", shown: "gösteriliyor",
      noResult: "Sonuç yok", total: "Toplam", loading: "Yükleniyor…",
      totalFleet: "Toplam Filo", inMaint: "Bakımda", fieldBike: "Sahada Bisiklet", lost: "Kayıp",
      snapshot: "Pano anlık görüntüsü", shiftStatus: "Vardiya Durumu", todayPlan: "Bugünün planı",
      startShift: "Vardiyayı Başlat / Araç Teslim Al", maintCard: "Bakım ve Periyodik",
      avgDepot: "Ortalama depo süresi", over5: "5+ gün bakımda", fullMaint: "Tam bakımlı filo",
      partChanges: "Parça değişimi", openRepair: "Tamamlanan onarım", partNeed: "Parça ihtiyacı",
      levels: "Periyodik kademe dağılımı", topParts: "En çok değişen parçalar", monthly: "Aylık kayıt",
      seeDue: "Bakımı gelenleri gör (>30 gün)", inventory: "Envanter", countScreens: "Sayım ekranları",
      repairs: "Onarımlar", partOps: "Parça işlemleri", lastRecord: "Son kayıt",
      dueOnly: ">30 gün", lastMaint: "son periyodik", daysAgo: "gün önce", bikes: "bisiklet",
      repaired: "Onarıldı", medianDays: "Medyan onarım süresi (gün, giriş ayına göre)", byProvince: "Gönderen il",
      stages: "Onarım aşaması", parts: "Parça", repeat: "Tekrarlayan", days: "gün",
      plan: "Çizelge", actual: "Gerçekleşme", week: "Hafta", delay: "Gecikme", lateShare: "Ortalama gecikme (dk, aylık)",
      onTime: "zamanında", late: "geç", photos: "fotoğraf", handover: "Devir",
      pending: "Bekliyor", done: "Tamamlandı", addNote: "Not Ekle",
      stations: "İstasyon", office: "Ofis", restricted: "Yasak alan", visits: "Ziyaret", visitList: "Son ziyaretler",
      privacyZones: "Personel ev bölgeleri gizlilik nedeniyle çıkarıldı.",
      route: "Rota", sessions: "Sürüş oturumları", maxSpeed: "Maks. hız", hardBrake: "Sert fren", hardAcc: "Ani gaz",
      speeding: "Aşırı hız", normal: "Normal", routeNote: "Örnek vardiya; her oturumun ilk ve son 300 m'si kesildi, ~30 m seyreltildi.",
      inStock: "Yalnız stokta olanlar", critical: "Kritik eşik", scooter: "Scooter", bicycle: "Bisiklet",
      byType: "Türe göre", byDay: "Günlere göre sayım", alerts: "Uyarı", alertsMonthly: "Aylık otomatik bildirim",
      back: "Tanıtım sayfası", sideTitle: "Uygulamanın web demosu",
      sideText: "Android saha uygulamasının ekranları, gerçek operasyon verisiyle. Kişi adları, plakalar, telefonlar ve fotoğraflar çıkarıldı; kayıt yapılamaz.",
      sideNote: "Kişiler 'Personel N' olarak gösterilir; aynı kişi her ekranda aynı numaradır.",
      theme: "Tema", lang: "EN",
    },
    en: {
      appName: "Tazı Refurbishment Centre", demo: "Demo mode", demoNote: "read-only · real data, anonymised",
      readonly: "Demo mode: nothing is saved", notInDemo: "This screen is not part of the demo",
      dashboard: "Overview", depo: "Depot Records", periyodik: "Periodic Maintenance", servis: "Service Records",
      onarim: "Control-Card Repair", vardiya: "Shift Management", teslim: "Vehicle Handover", gorevler: "Tasks",
      istasyonlar: "Stations", takip: "Vehicle Tracking", stok: "Stock Inventory", sayim: "Inventory Counts",
      bildirimler: "Notifications", istatistik: "Statistics", prim: "Bonus Report", ayarlar: "Settings",
      secMain: "Main", secField: "Field and shifts", secRepair: "Maintenance and repair", secInv: "Inventory", secOther: "Other",
      search: "Search…", all: "All", loadMore: "Show more", records: "records", shown: "shown",
      noResult: "No results", total: "Total", loading: "Loading…",
      totalFleet: "Total fleet", inMaint: "In maintenance", fieldBike: "Bikes in the field", lost: "Lost",
      snapshot: "Dashboard snapshot", shiftStatus: "Shift status", todayPlan: "Today's plan",
      startShift: "Start shift / take over vehicle", maintCard: "Maintenance and periodic",
      avgDepot: "Average time in depot", over5: "In depot 5+ days", fullMaint: "Fully maintained fleet",
      partChanges: "Part replacements", openRepair: "Completed repairs", partNeed: "Parts needed",
      levels: "Periodic level distribution", topParts: "Most replaced parts", monthly: "Records per month",
      seeDue: "Show bikes due (>30 days)", inventory: "Inventory", countScreens: "Count screens",
      repairs: "Repairs", partOps: "Part operations", lastRecord: "Last record",
      dueOnly: ">30 days", lastMaint: "last periodic", daysAgo: "days ago", bikes: "bikes",
      repaired: "Repaired", medianDays: "Median repair time (days, by intake month)", byProvince: "Sending province",
      stages: "Repair stage", parts: "Part", repeat: "Repeat", days: "days",
      plan: "Roster", actual: "Actual", week: "Week", delay: "Delay", lateShare: "Average delay (min, monthly)",
      onTime: "on time", late: "late", photos: "photos", handover: "Handover",
      pending: "Pending", done: "Completed", addNote: "Add note",
      stations: "Station", office: "Office", restricted: "Restricted zone", visits: "Visits", visitList: "Latest visits",
      privacyZones: "Zones around staff homes were removed for privacy.",
      route: "Route", sessions: "Driving sessions", maxSpeed: "Max speed", hardBrake: "Hard brake", hardAcc: "Hard accel.",
      speeding: "Speeding", normal: "Normal", routeNote: "Sample shift; first and last 300 m of every session cut, thinned to ~30 m.",
      inStock: "In stock only", critical: "Critical level", scooter: "Scooter", bicycle: "Bicycle",
      byType: "By type", byDay: "Counts per day", alerts: "Alerts", alertsMonthly: "Automatic notifications per month",
      back: "Project page", sideTitle: "Web demo of the app",
      sideText: "The Android field app's screens with real operating data. Names, plates, phone numbers and photos are removed; nothing can be saved.",
      sideNote: "People appear as 'Personel N'; the same person has the same number on every screen.",
      theme: "Theme", lang: "TR",
    },
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  let LANG = store.get("tazi-lang") || (new URLSearchParams(location.search).get("lang") === "en" ? "en" : "tr");
  const t = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.tr[k] || k;

  // ------------------------------------------------------------ icons
  const P = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    box: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l2 8h-6M14 5h2"/>',
    scooter: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 18h7M15 18 12 5h3"/>',
    battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 11v2M7 10v4M11 10v4"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    swap: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
    stack: '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    left: '<path d="M15 18l-6-6 6-6"/>',
    right: '<path d="M9 18l6-6-6-6"/>',
    alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  };
  const ic = (n, cls) => `<svg class="icon ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;

  // ------------------------------------------------------------ helpers
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = (n, d) => (n == null || isNaN(n) ? "-" : Number(n).toLocaleString(LANG === "tr" ? "tr-TR" : "en-GB", { maximumFractionDigits: d == null ? 0 : d }));
  const fmtD = (s) => { if (!s) return ""; const [y, m, d] = s.slice(0, 10).split("-"); return `${d}.${m}.${y}${s.length > 10 ? " " + s.slice(11, 16) : ""}`; };
  const dayDiff = (a, b) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000);
  const fold = (s) => String(s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  const cache = {};
  function load(name) {
    if (!cache[name]) {
      cache[name] = fetch(`data/${name}.json`).then((r) => { if (!r.ok) throw new Error(name); return r.json(); });
    }
    return cache[name];
  }
  const objs = (tbl) => tbl.rows.map((r) => { const o = {}; tbl.cols.forEach((c, i) => (o[c] = r[i])); return o; });
  const memo = {};
  async function table(name) { if (!memo[name]) memo[name] = objs(await load(name)); return memo[name]; }

  let TODAY = "2026-11-10";
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }
  const ro = () => toast(t("readonly"));

  // ------------------------------------------------------------ charts
  const charts = [];
  function destroyCharts() { while (charts.length) { try { charts.pop().destroy(); } catch (e) { /* noop */ } } }
  function barChart(canvas, labels, values, opts) {
    if (!window.Chart) return;
    opts = opts || {};
    Chart.defaults.locale = LANG === "tr" ? "tr-TR" : "en-GB";
    const ink2 = cssVar("--ink-2"), line = cssVar("--line"), brand = cssVar("--brand");
    const c = new Chart(canvas, {
      type: opts.type || "bar",
      data: { labels, datasets: [{ label: opts.label || "", data: values, backgroundColor: brand, borderColor: brand,
        borderRadius: 4, borderSkipped: "start", maxBarThickness: 26, borderWidth: opts.type === "line" ? 2 : 0,
        pointRadius: opts.type === "line" ? 4 : 0, pointHoverRadius: 6, tension: 0.25 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: (x) => `${opts.label ? opts.label + ": " : ""}${nf(x.parsed.y, 1)}${opts.unit || ""}` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: ink2, font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, border: { color: line } },
          y: { beginAtZero: true, grid: { color: line }, ticks: { color: ink2, font: { size: 10 }, maxTicksLimit: 5 }, border: { display: false } },
        },
      },
    });
    charts.push(c);
  }
  const monthLabel = (ym) => { const [y, m] = ym.split("-"); const tr = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]; const en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return (LANG === "tr" ? tr : en)[+m - 1] + " " + y.slice(2); };

  function hbars(items, max) {
    max = max || Math.max(1, ...items.map((x) => x[1]));
    return `<div class="bars">${items.map(([n, v]) => `<div class="b"><span class="n" title="${esc(n)}">${esc(n)}</span><span class="track"><span class="fill" style="width:${(100 * v) / max}%"></span></span><span class="v">${nf(v)}</span></div>`).join("")}</div>`;
  }
  const countBy = (arr, f) => { const m = new Map(); arr.forEach((x) => { const k = f(x); if (k !== "" && k != null) m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };

  // ------------------------------------------------------------ generic list screen
  function listScreen(view, cfg) {
    // cfg: rows, filters:[{key,label,values}], search(row)->text, item(row)->html, head(html), fab
    let q = "", active = cfg.defaultFilter || "", limit = 40;
    const chipsHtml = () => {
      if (!cfg.filter) return "";
      const counts = countBy(cfg.rows, cfg.filter).slice(0, 12);
      return `<div class="chips" role="group">` +
        `<button class="chip" data-f="" aria-pressed="${active === ""}">${t("all")}<span class="c">${nf(cfg.rows.length)}</span></button>` +
        counts.map(([k, n]) => `<button class="chip" data-f="${esc(k)}" aria-pressed="${active === k}">${esc(cfg.label ? cfg.label(k) : k)}<span class="c">${nf(n)}</span></button>`).join("") + `</div>`;
    };
    view.innerHTML = `<div class="tools"><label class="search">${ic("search")}<span class="sr-only">${t("search")}</span><input type="search" placeholder="${t("search")}" autocomplete="off"></label>${chipsHtml()}</div>${cfg.head || ""}<div class="count"></div><div class="list"></div>`;
    const listEl = $(".list", view), countEl = $(".count", view);
    const idx = cfg.rows.map((r) => fold(cfg.search(r)));
    function render() {
      const fq = fold(q.trim());
      const res = [];
      cfg.rows.forEach((r, i) => { if ((!active || cfg.filter(r) === active) && (!fq || idx[i].includes(fq))) res.push(r); });
      countEl.textContent = `${nf(res.length)} ${t("records")}${res.length > limit ? ` · ${nf(limit)} ${t("shown")}` : ""}`;
      listEl.innerHTML = res.length ? res.slice(0, limit).map(cfg.item).join("") + (res.length > limit ? `<button class="more">${t("loadMore")}</button>` : "") : `<div class="empty">${t("noResult")}</div>`;
    }
    $("input", view).addEventListener("input", (e) => { q = e.target.value; limit = 40; render(); });
    view.addEventListener("click", (e) => {
      const ch = e.target.closest(".chip[data-f]");
      if (ch) { active = ch.dataset.f; limit = 40; view.querySelectorAll(".chip[data-f]").forEach((b) => b.setAttribute("aria-pressed", String(b === ch))); render(); return; }
      if (e.target.closest(".more")) { limit += 60; render(); return; }
    });
    render();
    if (cfg.after) cfg.after(view);
  }
  const actBtns = () => `<span class="acts"><button class="iconbtn" data-ro aria-label="edit">${ic("edit")}</button><button class="iconbtn" data-ro aria-label="delete">${ic("trash")}</button></span>`;

  // ------------------------------------------------------------ screens
  const S = {};

  S.dashboard = async (v) => {
    const [st, var_, gor] = await Promise.all([load("stats"), load("vardiya"), table("gorevler")]);
    const d = st.dashboard || {}, se = st.seriler;
    const today = var_.plan.find((p) => p[0] === TODAY) || var_.plan.filter((p) => p[0] <= TODAY).pop();
    const shiftRows = today ? var_.kisiler.map((k, i) => [k, today[2][i]]).filter((x) => x[1]) : [];
    const done = gor.filter((g) => g.durum === "Tamamlandı").length;
    v.innerHTML = `
      <div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:8px"><span style="color:var(--ink-2)">İl:</span><b>Samsun</b><span class="pill" style="margin-left:auto">${t("snapshot")} · ${fmtD(d.sonGuncelleme)}</span></div>
      <div class="card"><h3>${ic("clock")}${t("shiftStatus")}</h3><div class="sub">${t("todayPlan")} · ${fmtD(today ? today[0] : TODAY)} ${today ? esc(today[1]) : ""}</div>
        ${shiftRows.map(([k, s]) => `<div class="vardiya-row"><span>${esc(k)}</span>${shiftPill(s)}</div>`).join("")}
        <button class="btn block" data-ro style="margin-top:10px">${ic("camera")}${t("startShift")}</button></div>
      <div class="grid2">
        <a class="card card-link" href="#/depo"><span class="ic">${ic("box")}</span><span><div class="tt">${t("depo")}</div><div class="ss">${t("lastRecord")}: ${fmtD(st.periods.depo[1])}</div></span></a>
        <a class="card card-link" href="#/gorevler"><span class="ic">${ic("check")}</span><span><div class="tt">${t("gorevler")}</div><div class="ss">${t("total")}: ${nf(gor.length)} · ${nf(done)} ✓</div></span></a>
        <a class="card card-link" href="#/sayim"><span class="ic">${ic("clip")}</span><span><div class="tt">${t("inventory")}</div><div class="ss">${t("countScreens")}</div></span></a>
        <a class="card card-link" href="#/onarim"><span class="ic">${ic("wrench")}</span><span><div class="tt">${t("repairs")}</div><div class="ss">${t("partOps")}</div></span></a>
      </div>
      <div class="grid2">
        <div class="card stat accent"><div class="v tnum">${nf(d.toplam)}</div><div class="l">${t("totalFleet")} · ${t("lost")}: ${nf(d.kayip)}</div></div>
        <div class="card stat"><div class="v tnum">${nf(d.bakimda)}</div><div class="l">${t("inMaint")}</div></div>
        <div class="card stat"><div class="v tnum">${nf(d.sahada)}</div><div class="l">${t("fieldBike")}</div></div>
        <div class="card stat"><div class="v tnum">%${nf(st.filo.sahadaYuzde, 1)}</div><div class="l">${t("fieldBike")} / ${t("totalFleet")}</div></div>
      </div>
      <div class="card"><h3>${ic("wrench")}${t("maintCard")}</h3>
        <div class="kv"><span>${t("avgDepot")}</span><span>${esc(d.ortDepo || "-")}</span></div>
        <div class="kv"><span>${t("over5")}</span><span>${nf(d.gun5)}</span></div>
        <div class="kv"><span>${t("fullMaint")}</span><span>${nf(d.tamBakimli)}</span></div>
        <div class="kv"><span>${t("partChanges")}</span><span>${nf(d.parcaDegisimi)}</span></div>
        <div class="kv"><span>${t("openRepair")}</span><span>${nf(d.tamamlananOnarim)}</span></div>
        <div class="kv"><span>${t("partNeed")}</span><span>${nf(d.parcaIhtiyaci)}</span></div>
        <a class="btn ghost block" href="#/periyodik" style="margin-top:10px;text-decoration:none">${t("seeDue")}</a></div>
      <div class="card"><h3>${ic("stack")}${t("levels")}</h3>${hbars(se.periyodikKademe)}</div>
      <div class="card"><h3>${ic("chip")}${t("topParts")}</h3>${hbars(se.enCokParca.slice(0, 6))}</div>
      <div class="card"><h3>${ic("chart")}${t("depo")} · ${t("monthly")}</h3><div class="chart"><canvas aria-label="${t("monthly")}"></canvas></div></div>`;
    barChart($("canvas", v), se.depoAylik.map((x) => monthLabel(x[0])), se.depoAylik.map((x) => x[1]), { label: t("records") });
  };

  function shiftKind(s) {
    if (!s) return "";
    if (/izin/i.test(s)) return "sh-izin";
    const h = parseInt(s, 10);
    if (h === 9 || h === 8) return "sh-gun";
    if (h === 6 || h === 7) return "sh-sabah";
    if (h >= 13 && h <= 17) return "sh-aksam";
    if (h >= 18 || h <= 2) return "sh-gece";
    return "";
  }
  const shiftPill = (s) => `<span class="pill ${/izin/i.test(s) ? "err" : "brand"} tnum">${esc(s)}</span>`;

  const durumCls = (d) => /giderildi|tamir|periyodik|çıkış/i.test(d) ? "st-ok" : /arızalı|eksik/i.test(d) ? "st-err" : /tespit|parça|ihtiyaç/i.test(d) ? "st-warn" : "st-info";
  const durumPill = (d) => { const c = durumCls(d); return `<span class="pill ${c === "st-ok" ? "ok" : c === "st-err" ? "err" : c === "st-warn" ? "warn" : "info"}">${esc(d)}</span>`; };

  S.depo = async (v) => {
    const rows = await table("depo");
    listScreen(v, {
      rows, filter: (r) => r.durum,
      search: (r) => [r.bisiklet, r.scooter, r.batarya, r.durum, r.aciklama, r.parca, r.eksik, r.personel, r.periyodik].join(" "),
      item: (r) => `<div class="item ${durumCls(r.durum)}">
        <div class="row"><span class="no">${ic(r.bisiklet ? "bike" : r.scooter ? "scooter" : "battery")}${esc(r.bisiklet || r.scooter || r.batarya)}</span>${actBtns()}</div>
        ${r.batarya && (r.bisiklet || r.scooter) ? `<div class="txt">Batarya: ${esc(r.batarya)}</div>` : ""}
        <div class="row" style="margin-top:6px">${durumPill(r.durum)}${r.sahada ? `<span class="pill ${r.sahada === "Sahada" ? "ok" : "warn"}">${esc(r.sahada)}</span>` : ""}${r.periyodik ? `<span class="pill brand">${esc(r.periyodik)}</span>` : ""}${r.km ? `<span class="pill tnum">${esc(r.km)} km</span>` : ""}</div>
        ${r.aciklama || r.parca || r.eksik || r.ihtiyac ? `<div class="txt">${r.parca ? `<b>Parça:</b> ${esc(r.parca)}<br>` : ""}${r.eksik ? `<b>Eksik:</b> ${esc(r.eksik)}<br>` : ""}${r.ihtiyac ? `<b>İhtiyaç:</b> ${esc(r.ihtiyac)}<br>` : ""}${esc(r.aciklama)}</div>` : ""}
        <div class="meta"><span>${esc(r.personel)} • ${esc(r.il)}</span><span class="tnum">${fmtD(r.tarih)}</span></div></div>`,
    });
    fab(true);
  };

  S.periyodik = async (v) => {
    const rows = await table("depo");
    const last = new Map();
    rows.forEach((r) => { if (r.durum === "Periyodik bakım" && r.bisiklet) { const p = last.get(r.bisiklet); if (!p || r.tarih > p.tarih) last.set(r.bisiklet, r); } });
    const list = [...last.values()].map((r) => Object.assign({ gun: dayDiff(r.tarih, TODAY) }, r)).sort((a, b) => b.gun - a.gun);
    listScreen(v, {
      rows: list, filter: (r) => (r.gun > 30 ? t("dueOnly") : "≤30"), defaultFilter: t("dueOnly"),
      head: `<div class="card"><div class="kv"><span>${t("bikes")}</span><span>${nf(list.length)}</span></div><div class="kv"><span>${t("dueOnly")}</span><span>${nf(list.filter((r) => r.gun > 30).length)}</span></div><div class="sub" style="margin:8px 0 0">${fmtD(TODAY)}</div></div>`,
      search: (r) => [r.bisiklet, r.periyodik, r.personel].join(" "),
      item: (r) => `<div class="item ${r.gun > 30 ? "st-warn" : "st-ok"}"><div class="row"><span class="no">${ic("bike")}${esc(r.bisiklet)}</span>${r.periyodik ? `<span class="pill brand">${esc(r.periyodik)}</span>` : ""}<span class="pill ${r.gun > 30 ? "warn" : "ok"}" style="margin-left:auto">${nf(r.gun)} ${t("daysAgo")}</span></div>
        <div class="meta"><span>${t("lastMaint")}: ${esc(r.personel)}${r.km ? " · " + esc(r.km) + " km" : ""}</span><span class="tnum">${fmtD(r.tarih)}</span></div></div>`,
    });
  };

  S.servis = async (v) => {
    const [rows, st] = await Promise.all([table("servis"), load("stats")]);
    const om = st.onarimMerkezi;
    const head = `<div class="grid2"><div class="card stat accent"><div class="v tnum">${nf(om.merkezKayit)}</div><div class="l">${esc(om.merkez)} · ${t("records")}</div></div>
      <div class="card stat"><div class="v tnum">%${nf(om.onarildiYuzde, 1)}</div><div class="l">${t("repaired")}</div></div></div>
      <div class="card"><h3>${ic("clock")}${t("medianDays")}</h3><div class="chart"><canvas></canvas></div></div>
      <div class="card"><h3>${ic("truck")}${t("byProvince")}</h3>${hbars(countBy(rows.filter((r) => r.il === om.merkez), (r) => r.teslimEden).slice(0, 8))}</div>`;
    listScreen(v, {
      rows, filter: (r) => r.durum, head,
      search: (r) => [r.numara, r.tip, r.ariza, r.islem, r.parca, r.teslimEden, r.teslimAlan, r.personel].join(" "),
      item: (r) => {
        const g = r.giris && r.cikis ? dayDiff(r.giris, r.cikis) : null;
        return `<div class="item ${r.durum === "Onarıldı" ? "st-ok" : r.durum === "Serviste" ? "st-warn" : "st-info"}">
        <div class="row"><span class="no">${ic(r.tip === "Bisiklet" ? "bike" : "scooter")}${esc(r.numara)}</span><span class="pill ${r.durum === "Onarıldı" ? "ok" : "warn"}">${esc(r.durum)}</span>${actBtns()}</div>
        <div class="txt"><b>${esc(r.teslimEden)} → ${esc(r.teslimAlan)}</b>${r.parca ? " · " + esc(r.parca) : ""}${r.ariza ? `<br>Arıza: ${esc(r.ariza)}` : ""}${r.islem ? `<br>İşlem: ${esc(r.islem)}` : ""}</div>
        <div class="meta"><span>${esc(r.personel)} • ${esc(r.il)}</span><span class="tnum">${fmtD(r.giris)}${r.cikis ? " → " + fmtD(r.cikis) : ""}${g != null && g >= 0 ? ` (${g} ${t("days")})` : ""}</span></div></div>`;
      },
      after: (view) => barChart($("canvas", view), om.medyanAylik.map((m) => monthLabel(m.ay)), om.medyanAylik.map((m) => m.medyan), { label: t("days"), unit: " " + t("days") }),
    });
    fab(true);
  };

  S.onarim = async (v) => {
    const rows = await table("onarim");
    const rep = new Map(); rows.forEach((r) => rep.set(r.numara, (rep.get(r.numara) || 0) + 1));
    const stageCls = (a) => (a === "Sevk Edildi" ? "ok" : a === "Onarılmadı" ? "err" : "warn");
    const head = `<div class="grid2"><div class="card stat accent"><div class="v tnum">${nf(rows.length)}</div><div class="l">${t("onarim")}</div></div>
      <div class="card stat"><div class="v tnum">${nf(new Set(rows.map((r) => r.numara)).size)}</div><div class="l">${t("scooter")} / ${t("bicycle")}</div></div></div>
      <div class="card"><h3>${ic("truck")}${t("byProvince")}</h3>${hbars(countBy(rows, (r) => r.alinanIl).slice(0, 8))}</div>
      <div class="card"><h3>${ic("chip")}${t("parts")}</h3>${hbars(countBy(rows, (r) => r.parca).slice(0, 5))}</div>`;
    listScreen(v, {
      rows, filter: (r) => r.asama, head,
      search: (r) => [r.numara, r.parca, r.ariza, r.islem, r.aciklama, r.alinanIl, r.personel].join(" "),
      item: (r) => `<div class="item st-${stageCls(r.asama) === "ok" ? "ok" : stageCls(r.asama) === "err" ? "err" : "warn"}">
        <div class="row"><span class="no">${ic("chip")}${esc(r.numara)}</span><span class="pill ${stageCls(r.asama)}">${esc(r.asama || "-")}</span>${rep.get(r.numara) > 1 ? `<span class="pill info">${t("repeat")} ×${rep.get(r.numara)}</span>` : ""}${actBtns()}</div>
        <div class="txt"><b>${esc(r.parca)}</b>${r.alinanIl ? ` · ${esc(r.alinanIl)}` : ""}${r.ariza ? `<br>Arıza: ${esc(r.ariza)}` : ""}${r.islem ? `<br>İşlem: ${esc(r.islem)}` : ""}${r.aciklama ? `<br>${esc(r.aciklama)}` : ""}</div>
        <div class="meta"><span>${esc(r.personel)} • ${esc(r.tip)}</span><span class="tnum">${fmtD(r.tarih)}</span></div></div>`,
    });
    fab(true);
  };

  S.vardiya = async (v) => {
    const data = await load("vardiya");
    const ger = objs(data.gerceklesme);
    let mode = "plan";
    const monday = (iso) => { const d = new Date(iso + "T12:00:00Z"); const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd); return d.toISOString().slice(0, 10); };
    let wk = monday(TODAY);
    const byDate = new Map(data.plan.map((p) => [p[0], p]));
    const add = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    const short = (k) => k.replace("Personel ", "P").replace(" (Sabit)", "*");
    function draw() {
      let body;
      if (mode === "plan") {
        const days = [...Array(7)].map((_, i) => add(wk, i));
        const notes = days.map((d) => byDate.get(d)).filter((p) => p && p[3]).map((p) => `${fmtD(p[0])}: ${esc(p[3])}`);
        body = `<div class="card"><div class="week"><button class="iconbtn" data-w="-7" aria-label="prev">${ic("left")}</button><b class="tnum">${fmtD(days[0])} – ${fmtD(days[6])}</b><button class="iconbtn" data-w="7" aria-label="next">${ic("right")}</button></div>
          <table class="shift-table"><thead><tr><th style="width:52px"></th>${data.kisiler.map((k) => `<th title="${esc(k)}">${esc(short(k))}</th>`).join("")}</tr></thead><tbody>
          ${days.map((d) => { const p = byDate.get(d); return `<tr><td class="d">${esc(p ? p[1].slice(0, 3) : "")} ${d.slice(8)}</td>${data.kisiler.map((_, i) => { const s = p ? p[2][i] : ""; return `<td class="${shiftKind(s)} ${d === TODAY ? "today" : ""}">${esc(/izin/i.test(s) ? "İZİN" : s.replace(" - ", "–").replace(/:00/g, ""))}</td>`; }).join("")}</tr>`; }).join("")}
          </tbody></table>
          <div class="legend" style="margin-top:10px"><span><i style="background:var(--brand)"></i>09–17</span><span><i style="background:var(--info)"></i>06–14</span><span><i style="background:var(--ok)"></i>14–22</span><span><i style="background:#263238"></i>22–06</span><span><i style="background:var(--err)"></i>İZİN</span><span>* sabit</span></div>
          ${notes.length ? `<div class="notes">${notes.join("<br>")}</div>` : ""}</div>`;
      } else {
        const byM = new Map(); ger.forEach((g) => { const m = g.tarih.slice(0, 7); const a = byM.get(m) || []; a.push(g.gecikme); byM.set(m, a); });
        const ms = [...byM.keys()].sort();
        const late = ger.filter((g) => g.gecikme > 10).length;
        body = `<div class="grid2"><div class="card stat accent"><div class="v tnum">${nf(ger.length)}</div><div class="l">${t("actual")} · ${t("records")}</div></div><div class="card stat"><div class="v tnum">%${nf((100 * (ger.length - late)) / ger.length)}</div><div class="l">≤10 dk · ${t("onTime")}</div></div></div>
          <div class="card"><h3>${ic("clock")}${t("lateShare")}</h3><div class="chart"><canvas></canvas></div></div>
          ${ger.slice(0, 80).map((g) => `<div class="item ${g.gecikme > 10 ? "st-err" : "st-ok"}"><div class="row"><span class="no">${esc(g.personel)}</span><span class="pill ${g.gecikme > 10 ? "err" : "ok"}" style="margin-left:auto">${g.gecikme > 0 ? "+" + nf(g.gecikme) + " dk" : t("onTime")}</span></div><div class="meta"><span>${esc(g.planlanan)} · ${esc(g.gercek)}</span><span class="tnum">${fmtD(g.tarih)}</span></div></div>`).join("")}`;
        setTimeout(() => barChart($("canvas", v), ms.map(monthLabel), ms.map((m) => byM.get(m).reduce((a, b) => a + b, 0) / byM.get(m).length), { label: t("delay"), unit: " dk" }));
      }
      destroyCharts();
      v.innerHTML = `<div class="seg"><button data-m="plan" aria-pressed="${mode === "plan"}">${t("plan")}</button><button data-m="actual" aria-pressed="${mode === "actual"}">${t("actual")}</button></div>${body}`;
    }
    v.onclick = (e) => {
      const m = e.target.closest("[data-m]"); if (m) { mode = m.dataset.m; draw(); return; }
      const w = e.target.closest("[data-w]"); if (w) { wk = add(wk, +w.dataset.w); draw(); }
    };
    draw();
  };

  S.teslim = async (v) => {
    const rows = await table("teslim");
    listScreen(v, {
      rows, filter: (r) => r.durum,
      search: (r) => [r.biten, r.baslayan, r.not, r.durum].join(" "),
      item: (r) => `<div class="item ${r.durum === "Vardiya Başlangıcı" ? "st-ok" : "st-info"}">
        <div class="row"><span class="no">${ic("swap")}${esc(r.durum)}</span><span class="pill" style="margin-left:auto">${esc(r.arac)}</span></div>
        <div class="txt"><b>${esc(r.biten)}</b> → <b>${esc(r.baslayan)}</b>${r.not ? `<br>${esc(r.not)}` : ""}</div>
        <div class="photos" aria-label="${r.foto} ${t("photos")}">${[0, 1, 2, 3, 4].map((i) => `<span class="photo ${i < r.foto ? "on" : ""}">${ic("camera")}</span>`).join("")}</div>
        <div class="meta"><span>${nf(r.foto)}/5 ${t("photos")} • ${esc(r.il)}</span><span class="tnum">${fmtD(r.tarih)}</span></div></div>`,
    });
    fab(true);
  };

  S.gorevler = async (v) => {
    const rows = await table("gorevler");
    listScreen(v, {
      rows, filter: (r) => r.durum,
      search: (r) => [r.bisiklet, r.scooter, r.gorev, r.tamamlayan, r.vardiyaSahibi, r.not].join(" "),
      item: (r) => `<div class="item ${r.durum === "Tamamlandı" ? "st-ok" : "st-warn"}">
        <div class="row"><span class="no">${esc(r.gorev || "-")}</span><span class="pill ${r.durum === "Tamamlandı" ? "ok" : "warn"}" style="margin-left:auto">${esc(r.durum)}</span></div>
        <div class="txt">${ic("bike")} <b>${esc(r.bisiklet || r.scooter)}</b> · İl: ${esc(r.il || "-")}${r.tamamlayan ? `<br>${t("done")}: ${esc(r.tamamlayan)} · ${fmtD(r.tamamlanma)}` : ""}${r.not ? `<br>Not: ${esc(r.not)}` : ""}</div>
        <div class="meta"><span><button class="chip" data-ro>${t("addNote")}</button></span><span class="tnum">${fmtD(r.tarih)}</span></div></div>`,
    });
    fab(true);
  };

  // ---- maps
  function mapBase(el) {
    const m = L.map(el, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(m);
    return m;
  }
  let maps = [];
  function destroyMaps() { maps.forEach((m) => { try { m.remove(); } catch (e) { /* noop */ } }); maps = []; }

  S.istasyonlar = async (v) => {
    const [st, zi] = await Promise.all([table("istasyonlar"), table("ziyaretler")]);
    const visits = new Map(countBy(zi, (z) => z.istasyon));
    const col = (tur) => (tur === "Yasak alan" ? cssVar("--err") : tur === "Ofis" ? cssVar("--info") : cssVar("--brand"));
    let mode = "map";
    function draw() {
      destroyMaps();
      const sorted = st.slice().sort((a, b) => (visits.get(b.ad) || 0) - (visits.get(a.ad) || 0));
      v.innerHTML = `<div class="seg"><button data-m="map" aria-pressed="${mode === "map"}">${t("istasyonlar")}</button><button data-m="list" aria-pressed="${mode === "list"}">${t("visitList")}</button></div>` +
        (mode === "map" ? `<div class="map tall" id="stmap"></div>
        <div class="legend"><span><i style="background:${col("İstasyon")}"></i>${t("stations")}</span><span><i style="background:${col("Ofis")}"></i>${t("office")}</span><span><i style="background:${col("Yasak alan")}"></i>${t("restricted")}</span></div>
        <div class="count">${nf(st.length)} · ${t("privacyZones")}</div>
        ${sorted.map((s) => `<div class="item ${s.tur === "Yasak alan" ? "st-err" : s.tur === "Ofis" ? "st-info" : "st-warn"}" data-s="${esc(s.id)}" style="cursor:pointer"><div class="row"><span class="no">${ic("pin")}${esc(s.ad)}</span><span class="pill" style="margin-left:auto">${nf(visits.get(s.ad) || 0)} ${t("visits")}</span></div><div class="meta"><span>${esc(s.tur)} · r=${nf(s.yaricap)} m</span><span>${esc(s.id)}</span></div></div>`).join("")}`
          : `<div class="count">${nf(zi.length)} ${t("visits")}</div>${zi.slice(0, 120).map((z) => `<div class="item st-info"><div class="row"><span class="no">${ic("pin")}${esc(z.istasyon)}</span><span class="pill tnum" style="margin-left:auto">${z.dakika != null ? nf(z.dakika, 1) + " dk" : "-"}</span></div><div class="meta"><span>${esc(z.surucu)} · ${esc(z.arac)}</span><span class="tnum">${fmtD(z.giris)}</span></div></div>`).join("")}`);
      if (mode === "map" && window.L) {
        const m = mapBase($("#stmap", v)); maps.push(m);
        const layers = {};
        const b = [];
        st.forEach((s) => {
          const c = L.circle([s.lat, s.lng], { radius: Math.max(s.yaricap, 40), color: col(s.tur), weight: 2, fillOpacity: 0.25 }).addTo(m)
            .bindPopup(`<b>${esc(s.ad)}</b><br>${esc(s.tur)} · ${nf(visits.get(s.ad) || 0)} ${t("visits")}`);
          layers[s.id] = c;
          if (s.tur !== "Yasak alan") b.push([s.lat, s.lng]);
        });
        m.fitBounds(b, { padding: [20, 20] });
        v.querySelectorAll("[data-s]").forEach((el) => el.addEventListener("click", () => { const c = layers[el.dataset.s]; if (c) { m.setView(c.getLatLng(), 16); c.openPopup(); $("#stmap", v).scrollIntoView({ behavior: "smooth" }); } }));
      }
    }
    v.onclick = (e) => { const b = e.target.closest("[data-m]"); if (b) { mode = b.dataset.m; draw(); } };
    draw();
  };

  S.takip = async (v) => {
    const [rd, ses] = await Promise.all([load("rotalar"), table("suruler")]);
    let cur = 0;
    function draw() {
      destroyMaps(); destroyCharts();
      const r = rd.rotalar[cur];
      const over = r.noktalar.filter((p) => p[3] === "H").length;
      const sp = r.noktalar.map((p) => p[2]);
      v.innerHTML = `<div class="chips" style="padding-top:0">${rd.rotalar.map((x, i) => `<button class="chip" data-r="${i}" aria-pressed="${i === cur}">${fmtD(x.tarih)} · ${esc(x.surucu)}</button>`).join("")}</div>
        <div class="map tall" id="rmap"></div>
        <div class="legend"><span><i style="background:${cssVar("--brand-dark")}"></i>${t("normal")}</span><span><i style="background:${cssVar("--err")}"></i>${t("speeding")}</span></div>
        <div class="grid2"><div class="card stat accent"><div class="v tnum">${nf(r.km, 1)} km</div><div class="l">${esc(r.baslangic)}–${esc(r.bitis)} · ${esc(r.oturum)}</div></div><div class="card stat"><div class="v tnum">${nf(Math.max(...sp))}</div><div class="l">${t("maxSpeed")} (km/h) · ${nf(over)} ${t("speeding").toLowerCase()}</div></div></div>
        <div class="count">${t("routeNote")}</div>
        <div class="card"><h3>${ic("chart")}${t("sessions")} · km</h3><div class="chart"><canvas></canvas></div></div>
        <div class="count">${nf(ses.length)} ${t("sessions").toLowerCase()}</div>
        ${ses.slice(0, 60).map((s) => `<div class="item ${s.sertFren + s.aniGaz > 40 ? "st-warn" : "st-ok"}"><div class="row"><span class="no">${esc(s.surucu)}</span><span class="pill tnum" style="margin-left:auto">${nf(s.km, 1)} km</span></div>
          <div class="row" style="margin-top:6px"><span class="pill tnum">${t("maxSpeed")}: ${nf(s.maxHiz)}</span><span class="pill tnum">${t("hardBrake")}: ${nf(s.sertFren)}</span><span class="pill tnum">${t("hardAcc")}: ${nf(s.aniGaz)}</span></div>
          <div class="meta"><span>${esc(s.oturum)} · ${esc(s.sure)}</span><span class="tnum">${fmtD(s.baslangic)}</span></div></div>`).join("")}`;
      if (window.L) {
        const m = mapBase($("#rmap", v)); maps.push(m);
        const pts = r.noktalar;
        let seg = [], segH = null;
        const flush = () => { if (seg.length > 1) L.polyline(seg, { color: segH ? cssVar("--err") : cssVar("--brand-dark"), weight: 4, opacity: 0.9 }).addTo(m); };
        pts.forEach((p) => { const h = p[3] === "H"; if (segH !== null && h !== segH) { flush(); seg = [seg[seg.length - 1]]; } segH = h; seg.push([p[0], p[1]]); });
        flush();
        if (pts.length) m.fitBounds(pts.map((p) => [p[0], p[1]]), { padding: [16, 16] });
      }
      const byDay = new Map(); ses.forEach((s) => byDay.set(s.baslangic.slice(0, 10), (byDay.get(s.baslangic.slice(0, 10)) || 0) + s.km));
      const ds = [...byDay.keys()].sort();
      barChart($("canvas", v), ds.map((d) => d.slice(8) + "." + d.slice(5, 7)), ds.map((d) => byDay.get(d)), { label: "km", unit: " km" });
    }
    v.onclick = (e) => { const b = e.target.closest("[data-r]"); if (b) { cur = +b.dataset.r; draw(); } };
    draw();
  };

  S.stok = async (v) => {
    const data = await load("stok");
    let kind = "bisiklet", only = true;
    function draw() {
      const d = data[kind];
      const rows = d.rows.map((r) => ({ kod: r[0], urun: r[1], q: d.iller.map((il, i) => [il, r[2 + i]]), toplam: r[2 + d.iller.length], esik: r[3 + d.iller.length], son: r[4 + d.iller.length] }))
        .filter((r) => !only || r.toplam !== 0 || r.q.some((x) => x[1])).sort((a, b) => b.toplam - a.toplam);
      v.onclick = null;
      const wrap = document.createElement("div");
      v.innerHTML = `<div class="seg"><button data-k="bisiklet" aria-pressed="${kind === "bisiklet"}">${t("bicycle")}</button><button data-k="scooter" aria-pressed="${kind === "scooter"}">${t("scooter")}</button></div>
        <label class="chip" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:10px"><input type="checkbox" ${only ? "checked" : ""} id="only"> ${t("inStock")}</label>`;
      v.appendChild(wrap);
      listScreen(wrap, {
        rows, search: (r) => r.kod + " " + r.urun,
        item: (r) => { const crit = r.esik !== "" && r.toplam <= +r.esik; return `<div class="item ${crit ? "st-err" : r.toplam > 0 ? "st-ok" : ""}"><div class="row"><span class="no" style="font-size:14px">${esc(r.urun)}</span><span class="pill ${r.toplam > 0 ? "ok" : r.toplam < 0 ? "err" : ""} tnum" style="margin-left:auto">${nf(r.toplam)}</span></div>
          <div class="row" style="margin-top:6px">${r.q.filter((x) => x[1]).map((x) => `<span class="pill tnum">${esc(x[0])}: ${nf(x[1])}</span>`).join("")}${crit ? `<span class="pill err">${t("critical")}: ${esc(r.esik)}</span>` : ""}</div>
          <div class="meta"><span>${esc(r.kod)}</span><span class="tnum">${fmtD(r.son)}</span></div></div>`; },
      });
      const tools = $(".tools", wrap); tools.style.position = "static"; tools.style.margin = "0 0 10px"; tools.style.padding = "0"; tools.style.border = "0";
      $("#only", v).addEventListener("change", (e) => { only = e.target.checked; draw(); });
      v.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => { kind = b.dataset.k; draw(); }));
    }
    draw();
    fab(true);
  };

  S.sayim = async (v) => {
    const rows = await table("sayimlar");
    const days = countBy(rows, (r) => r.tarih).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const head = `<div class="card"><h3>${ic("clip")}${t("byType")}</h3>${hbars(countBy(rows, (r) => r.tip))}</div>
      <div class="card"><h3>${ic("chart")}${t("byDay")}</h3><div class="chart"><canvas></canvas></div></div>`;
    listScreen(v, {
      rows, filter: (r) => r.tip, head,
      search: (r) => [r.numara, r.tip, r.personel].join(" "),
      item: (r) => `<div class="item st-ok"><div class="row"><span class="no">${ic(r.tip === "Bisiklet" ? "bike" : r.tip === "Scooter" ? "scooter" : "battery")}${esc(r.numara)}</span><span class="pill" style="margin-left:auto">${esc(r.tip)}</span></div><div class="meta"><span>${esc(r.personel)} • ${esc(r.il)}</span><span class="tnum">${fmtD(r.tarih)}</span></div></div>`,
      after: (view) => barChart($("canvas", view), days.map((d) => fmtD(d[0]).slice(0, 5)), days.map((d) => d[1]), { label: t("records") }),
    });
    fab(true);
  };

  S.bildirimler = async (v) => {
    const [rows, st] = await Promise.all([table("bildirimler"), load("stats")]);
    const kindIc = (r) => (/ihlal/i.test(r.baslik) ? "alert" : /duraklama/i.test(r.baslik) ? "clock" : /vardiya/i.test(r.baslik) ? "swap" : r.tip === "yeni_gorev" ? "check" : "bell");
    const se = st.seriler;
    const head = `<div class="grid2"><div class="card stat accent"><div class="v tnum">${nf(st.kullanim.uyari)}</div><div class="l">${t("alerts")} · ${t("total")}</div></div><div class="card stat"><div class="v tnum">${nf(rows.length)}</div><div class="l">${t("shown")}</div></div></div>
      <div class="card"><h3>${ic("chart")}${t("alertsMonthly")}</h3><div class="chart"><canvas></canvas></div></div>`;
    listScreen(v, {
      rows, filter: (r) => r.tip, head,
      search: (r) => r.baslik + " " + r.mesaj + " " + r.olusturan,
      item: (r) => `<div class="item ${r.tip === "kritik_uyari" ? "st-err" : r.tip === "yeni_gorev" ? "st-info" : "st-warn"}"><div class="row"><span class="no" style="font-size:14px">${ic(kindIc(r))}${esc(r.baslik)}</span></div><div class="txt">${esc(r.mesaj)}</div><div class="meta"><span>${esc(r.olusturan)} → ${esc(r.il)} / ${esc(r.rol)}</span><span class="tnum">${fmtD(r.tarih)}</span></div></div>`,
      after: (view) => barChart($("canvas", view), se.uyariAylik.map((x) => monthLabel(x[0])), se.uyariAylik.map((x) => x[1]), { label: t("alerts") }),
    });
  };

  // ------------------------------------------------------------ shell
  const NAV = [
    ["secMain", [["dashboard", "home"]]],
    ["secRepair", [["depo", "box"], ["periyodik", "cal"], ["onarim", "chip"], ["servis", "wrench"]]],
    ["secField", [["vardiya", "clock"], ["teslim", "swap"], ["gorevler", "check"], ["takip", "route"], ["istasyonlar", "pin"]]],
    ["secInv", [["stok", "stack"], ["sayim", "clip"]]],
    ["secOther", [["bildirimler", "bell"], ["istatistik", "chart", true], ["prim", "gift", true], ["ayarlar", "gear", true]]],
  ];
  const ROUTES = NAV.flatMap((s) => s[1]).filter((x) => !x[2]).map((x) => x[0]);

  function fab(show) { $("#fab").classList.toggle("show", !!show); }

  function shell() {
    document.documentElement.lang = LANG;
    $("#drawerNav").innerHTML = NAV.map(([sec, items]) => `<div class="sec">${t(sec)}</div>` + items.map(([k, icon, off]) => off
      ? `<button class="navitem muted" data-off>${ic(icon)}${t(k)}</button>`
      : `<a href="#/${k}" data-k="${k}">${ic(icon)}${t(k)}</a>`).join("")).join("");
    $("#sideNav").innerHTML = ROUTES.map((k) => `<li><a href="#/${k}" data-k="${k}">${t(k)}</a></li>`).join("");
    $("#appName").textContent = t("appName");
    $("#drawerName").textContent = t("appName");
    $("#demoTxt").innerHTML = `<b>${t("demo")}</b> · ${t("demoNote")}`;
    $("#langBtn").textContent = t("lang");
    $("#sideTitle").textContent = t("sideTitle");
    $("#sideText").textContent = t("sideText");
    $("#sideNote").textContent = t("sideNote");
    $("#backTxt").textContent = t("back");
  }

  async function route() {
    const key = (location.hash.replace(/^#\/?/, "") || "dashboard").split("?")[0];
    const k = ROUTES.includes(key) ? key : "dashboard";
    destroyCharts(); destroyMaps(); fab(false);
    $(".screen").classList.remove("drawer-open");
    $("#title").textContent = t(k);
    document.title = `${t(k)} · Tazı Yenileme Merkezi demo`;
    document.querySelectorAll("[data-k]").forEach((a) => a.classList.toggle("active", a.dataset.k === k));
    const old = $("#view");
    const v = old.cloneNode(false); // fresh element: drops listeners of the previous screen
    old.replaceWith(v);
    v.innerHTML = `<div class="empty">${t("loading")}</div>`;
    v.scrollTop = 0;
    try { await S[k](v); } catch (e) { v.innerHTML = `<div class="empty">Veri yüklenemedi (${esc(e.message)}). Sayfayı bir web sunucusu üzerinden açın.</div>`; }
  }

  function setTheme(next) {
    if (next) { document.documentElement.setAttribute("data-theme", next); store.set("tazi-theme", next); }
    const dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    $("#themeBtn").innerHTML = ic(dark ? "sun" : "moon");
    return dark;
  }

  async function init() {
    const saved = store.get("tazi-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    try { const st = await load("stats"); TODAY = st.periods.vardiya_gerceklesme ? st.periods.vardiya_gerceklesme[1] : TODAY; } catch (e) { /* offline */ }
    $("#menuBtn").innerHTML = ic("menu");
    $("#fab").innerHTML = ic("plus");
    $("#backIc").innerHTML = ic("back");
    setTheme();
    shell();
    $("#menuBtn").addEventListener("click", () => $(".screen").classList.add("drawer-open"));
    $(".scrim").addEventListener("click", () => $(".screen").classList.remove("drawer-open"));
    $("#drawerNav").addEventListener("click", (e) => { if (e.target.closest("[data-off]")) { toast(t("notInDemo")); } });
    $("#fab").addEventListener("click", ro);
    $(".screen").addEventListener("click", (e) => { if (e.target.closest("#view [data-ro]")) ro(); });
    $("#themeBtn").addEventListener("click", () => { setTheme(setTheme() ? "light" : "dark"); route(); });
    $("#langBtn").addEventListener("click", () => { LANG = LANG === "tr" ? "en" : "tr"; store.set("tazi-lang", LANG); shell(); route(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") $(".screen").classList.remove("drawer-open"); });
    window.addEventListener("hashchange", route);
    route();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
