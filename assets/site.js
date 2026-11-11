/* Project page: language + theme toggles, numbers and charts from data/stats.json */
(function () {
  "use strict";
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const ICON = {
    sun: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  };
  const isDark = () => root.getAttribute("data-theme") === "dark" || (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  const lang = () => root.getAttribute("data-lang") || "tr";
  let stats = null;
  const charts = [];

  function paintThemeBtn() { document.getElementById("themeBtn").innerHTML = isDark() ? ICON.sun : ICON.moon; }
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const fmt = (n, d) => Number(n).toLocaleString(lang() === "tr" ? "tr-TR" : "en-GB", { maximumFractionDigits: d == null ? 1 : d });

  function fill() {
    if (!stats) return;
    const med = stats.onarimMerkezi.medyanAylik.filter((m) => m.n >= 20);
    const derived = { medyanMin: med.length ? Math.round(Math.min(...med.map((m) => m.medyan))) : null };
    document.querySelectorAll("[data-stat]").forEach((el) => {
      const k = el.dataset.stat;
      const v = k in derived ? derived[k] : get(stats, k);
      if (v != null && v !== "") el.textContent = typeof v === "number" ? fmt(v, el.dataset.d != null ? +el.dataset.d : 1) : v;
    });
  }

  function drawCharts() {
    if (!stats || !window.Chart) return;
    while (charts.length) charts.pop().destroy();
    Chart.defaults.locale = lang() === "tr" ? "tr-TR" : "en-GB";
    const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
    const ink2 = css("--ink-2"), line = css("--line"), brand = css("--brand");
    const mon = (ym) => { const [y, m] = ym.split("-"); const tr = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]; const en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return (lang() === "tr" ? tr : en)[+m - 1] + " " + y.slice(2); };
    const base = (labels, data, unit) => ({
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: brand, borderRadius: 4, borderSkipped: "start", maxBarThickness: 28 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: (x) => fmt(x.parsed.y, 1) + unit } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: ink2, font: { size: 11 }, maxRotation: 0, autoSkip: true }, border: { color: line } },
          y: { beginAtZero: true, grid: { color: line }, ticks: { color: ink2, font: { size: 11 }, maxTicksLimit: 5 }, border: { display: false } },
        },
      },
    });
    const med = stats.onarimMerkezi.medyanAylik.filter((m) => m.n >= 20);
    charts.push(new Chart(document.getElementById("chMedian"), base(med.map((m) => mon(m.ay)), med.map((m) => m.medyan), lang() === "tr" ? " gün" : " days")));
    const ops = stats.seriler.islemAylik;
    charts.push(new Chart(document.getElementById("chOps"), base(ops.map((x) => mon(x[0])), ops.map((x) => x[1]), lang() === "tr" ? " işlem" : " operations")));
  }

  function setLang(l) {
    root.setAttribute("data-lang", l);
    root.lang = l;
    store.set("tazi-lang", l);
    fill();
    drawCharts();
  }

  document.addEventListener("DOMContentLoaded", () => {
    paintThemeBtn();
    document.getElementById("themeBtn").addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("tazi-theme", next);
      paintThemeBtn();
      drawCharts();
    });
    document.getElementById("langBtn").addEventListener("click", () => setLang(lang() === "en" ? "tr" : "en"));
    fetch("data/stats.json").then((r) => r.json()).then((s) => { stats = s; fill(); drawCharts(); }).catch(() => { /* static numbers stay */ });
  });
})();
