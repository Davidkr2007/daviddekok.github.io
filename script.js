/* ============================================================
   David de Kok - interacties
   ============================================================ */
(function () {
  "use strict";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- NAV ---------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* actieve link */
  const linkMap = {};
  navLinks.querySelectorAll("a").forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    if (id) linkMap[id] = a;
  });
  const sections = ["over", "ervaring", "opleiding", "certificaten", "projecten", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          Object.values(linkMap).forEach((l) => l.classList.remove("active"));
          const link = linkMap[e.target.id];
          if (link) link.classList.add("active");
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );
  sections.forEach((s) => navObserver.observe(s));

  /* ---------- Reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal:not(.in)");
  if (prefersReduced) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const revObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    revealEls.forEach((el) => revObserver.observe(el));
  }

  /* ---------- Gemiddelde hbo-cijfer (auto-berekend uit de rijen) ---------- */
  (function () {
    const cells = document.querySelectorAll("#cijfers-hbo .g-cijfer");
    const avgEl = document.querySelector("#cijfers-hbo .ga-num");
    if (!avgEl || !cells.length) return;
    let sum = 0, n = 0;
    cells.forEach((c) => {
      const v = parseFloat(c.textContent.trim().replace(",", "."));
      if (!isNaN(v)) { sum += v; n++; }
    });
    if (n > 0) {
      const avg = (Math.round((sum / n) * 10) / 10).toFixed(1);
      avgEl.textContent = avg.replace(".", ",");
      avgEl.dataset.en = avg;
    }
  })();

  /* ---------- Taalkeuze NL/EN ---------- */
  const langBtns = document.querySelectorAll(".lang button");
  function applyLang(lang) {
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.nl === undefined) el.dataset.nl = el.innerHTML;
      el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.nl;
    });
    langBtns.forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
    try { localStorage.setItem("lang", lang); } catch (e) {}
  }
  langBtns.forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));
  let savedLang = "nl";
  try { savedLang = localStorage.getItem("lang") || "nl"; } catch (e) {}
  if (savedLang === "en") applyLang("en");

  /* ---------- Vlaggetje bij ".nl" in de merknaam ---------- */
  const brandTld = document.querySelector(".brand .tld");
  const brandFlag = document.querySelector(".brand .flag");
  if (brandTld && brandFlag) {
    brandTld.addEventListener("mouseenter", () => brandFlag.classList.add("show"));
    brandTld.addEventListener("mouseleave", () => brandFlag.classList.remove("show"));
  }

  /* ---------- Dropdowns (werkervaring-foto's en certificaten) ---------- */
  document.querySelectorAll(".ptoggle, .cert-head").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      if (panel) panel.classList.toggle("open", !open);
      const row = btn.closest(".row");
      if (row) row.classList.toggle("open", !open);
    });
  });

  /* ---------- Projecten-scroller ---------- */
  const scroller = document.getElementById("projScroller");
  const prevBtn = document.getElementById("projPrev");
  const nextBtn = document.getElementById("projNext");
  if (scroller && prevBtn && nextBtn) {
    const step = () => {
      const card = scroller.querySelector(".pcard");
      return card ? card.getBoundingClientRect().width + 16 : 400;
    };
    prevBtn.addEventListener("click", () => scroller.scrollBy({ left: -step(), behavior: "smooth" }));
    nextBtn.addEventListener("click", () => scroller.scrollBy({ left: step(), behavior: "smooth" }));

    const sync = () => {
      prevBtn.disabled = scroller.scrollLeft <= 4;
      nextBtn.disabled = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 4;
    };
    scroller.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();

    /* slepen met de muis */
    let down = false, moved = false, startX = 0, startLeft = 0;
    scroller.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false;
      startX = e.clientX; startLeft = scroller.scrollLeft;
      scroller.classList.add("drag");
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      scroller.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      down = false;
      scroller.classList.remove("drag");
    });
    scroller.addEventListener("click", (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  }

  /* ---------- Python highlighting ---------- */
  const PY_KW = new Set([
    "import", "from", "as", "def", "return", "while", "for", "in", "if", "elif",
    "else", "try", "except", "finally", "with", "and", "or", "not", "None",
    "True", "False", "break", "continue", "pass", "class", "lambda", "is",
  ]);
  const PY_BI = new Set(["print", "input", "range", "len", "open", "getpass", "str", "int"]);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function highlightPython(el) {
    const src = el.textContent;
    const re = /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g;
    let out = "", last = 0, m;
    while ((m = re.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      last = re.lastIndex;
      if (m[1]) out += '<span class="tok-com">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-str">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="tok-num">' + esc(m[3]) + "</span>";
      else if (m[4]) {
        const w = m[4];
        const next = src[re.lastIndex];
        if (PY_KW.has(w)) out += '<span class="tok-kw">' + w + "</span>";
        else if (PY_BI.has(w)) out += '<span class="tok-bi">' + w + "</span>";
        else if (next === "(") out += '<span class="tok-fn">' + w + "</span>";
        else out += w;
      }
    }
    out += esc(src.slice(last));
    el.innerHTML = out;
  }
  document.querySelectorAll('pre[data-lang="python"]').forEach(highlightPython);

  /* ---------- Hero canvas: rustig netwerk ---------- */
  const canvas = document.getElementById("net-canvas");
  if (canvas && !prefersReduced) initNetwork(canvas);

  function initNetwork(cv) {
    const ctx = cv.getContext("2d");
    let w, h, dpr, nodes;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.max((w * h) / 24000, 26), 64);
      nodes = Array.from({ length: Math.floor(count) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.7,
        amber: Math.random() < 0.18,
      }));
    }

    const LINK = 120;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const dxm = p.x - mouse.x, dym = p.y - mouse.y;
        const dm2 = dxm * dxm + dym * dym;
        if (dm2 < 130 * 130) {
          const f = (1 - dm2 / (130 * 130)) * 0.4;
          p.x += (dxm / Math.sqrt(dm2 + 0.001)) * f;
          p.y += (dym / Math.sqrt(dm2 + 0.001)) * f;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const q = nodes[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const a = (1 - Math.sqrt(d2) / LINK) * 0.28;
            ctx.strokeStyle = "rgba(154,157,171," + a.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      for (const p of nodes) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.amber ? "rgba(227,168,87,.8)" : "rgba(154,157,171,.55)";
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    resize();
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(resize, 200);
    });
    cv.addEventListener("pointermove", (e) => {
      const rect = cv.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    cv.addEventListener("pointerleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });
    requestAnimationFrame(frame);
  }
})();
