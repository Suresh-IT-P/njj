/* =========================================================================
   NJJ Technologies — site interactions
   Everything here is progressive: the page is complete without it.
   ========================================================================= */
(() => {
  "use strict";

  /* -----------------------------------------------------------------------
     INTRO SPLASH
     - Particle network on dark canvas
     - Logo path draw → dot pop → ripple
     - Typewriter tagline
     - Progress bar
     - Smooth exit at ~2.8s, body scrollable after
     ----------------------------------------------------------------------- */
  (() => {
    const splash = document.getElementById("introSplash");
    if (!splash) return;

    // Lock scroll while splash is visible
    document.body.style.overflow = "hidden";

    /* --- Particle canvas --- */
    const canvas = document.getElementById("introCanvas");
    const ctx = canvas.getContext("2d");
    let W, H, particles, animId;

    const PARTICLE_COUNT = 55;
    const CONNECT_DIST = 130;
    const ACCENT = "11,122,115";

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function mkParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        a: Math.random() * 0.5 + 0.2,
      };
    }

    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, mkParticle);
    }

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);

      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${ACCENT},${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // dots
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT},${p.a})`;
        ctx.fill();
      });
    }

    function moveParticles() {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
    }

    function loop() {
      moveParticles();
      drawParticles();
      animId = requestAnimationFrame(loop);
    }

    resize();
    initParticles();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      loop();
    }
    window.addEventListener("resize", () => { resize(); }, { passive: true });

    /* --- Typewriter --- */
    const taglines = [
      "Technology That Moves Businesses Forward.",
      "Enterprise Mobility Infrastructure.",
      "White-Label. Real-Time. Scalable.",
    ];
    const typingEl = document.getElementById("introTyping");
    let tagIndex = 0;
    let charIndex = 0;
    let typing = true;
    let typingTimer;

    function typeStep() {
      const tag = taglines[tagIndex];
      if (typing) {
        charIndex++;
        typingEl.textContent = tag.slice(0, charIndex);
        if (charIndex >= tag.length) {
          typing = false;
          typingTimer = setTimeout(typeStep, 1200);
          return;
        }
        typingTimer = setTimeout(typeStep, 42);
      } else {
        charIndex--;
        typingEl.textContent = tag.slice(0, charIndex);
        if (charIndex <= 0) {
          typing = true;
          tagIndex = (tagIndex + 1) % taglines.length;
          typingTimer = setTimeout(typeStep, 300);
          return;
        }
        typingTimer = setTimeout(typeStep, 22);
      }
    }

    // Start typing after brand name appears (~1.0s)
    setTimeout(() => typeStep(), 1100);

    /* --- Exit sequence --- */
    function exitSplash() {
      clearTimeout(typingTimer);
      cancelAnimationFrame(animId);

      splash.classList.add("is-exiting");

      // Fade out overlay
      splash.style.transition = "opacity 0.65s cubic-bezier(0.4,0,0.2,1)";
      splash.style.opacity = "0";

      setTimeout(() => {
        splash.classList.add("is-done");
        document.body.style.overflow = "";
        // Trigger entrance animations on hero
        document.documentElement.classList.add("intro-complete");
      }, 680);
    }

    // Exit after 2.85s (progress bar fills in 1.8s starting at 1.1s → done at 2.9s)
    const exitDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 600 : 2900;
    setTimeout(exitSplash, exitDelay);

    // Also allow clicking to skip
    splash.addEventListener("click", () => exitSplash(), { once: true });
  })();


  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

  // Seeded RNG so maps and networks are stable between renders
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* -----------------------------------------------------------------------
     Theme (System / Light / Dark)
     ----------------------------------------------------------------------- */
  const themeListeners = [];
  const onThemeChange = (fn) => themeListeners.push(fn);
  const applyTheme = (mode) => {
    const root = document.documentElement;
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
    $$("[data-theme-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeSet === mode)));
    requestAnimationFrame(() => themeListeners.forEach((fn) => fn()));
  };
  let savedTheme = "system";
  try { savedTheme = localStorage.getItem("njj-theme") || "system"; } catch (e) { /* storage unavailable */ }
  applyTheme(savedTheme);
  $$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => {
    applyTheme(b.dataset.themeSet);
    try { localStorage.setItem("njj-theme", b.dataset.themeSet); } catch (e) { /* ignore */ }
  }));
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => themeListeners.forEach((fn) => fn()));

  /* -----------------------------------------------------------------------
     Navigation: sticky state, dropdowns, mobile menu
     ----------------------------------------------------------------------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const dropdowns = $$("[data-dropdown]");
  const closeAll = (except) => dropdowns.forEach((d) => {
    if (d === except) return;
    d.classList.remove("is-open");
    d.querySelector("button").setAttribute("aria-expanded", "false");
  });
  dropdowns.forEach((d) => {
    const btn = d.querySelector("button");
    let timer;
    const open = () => { clearTimeout(timer); closeAll(d); d.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); };
    const close = () => { timer = setTimeout(() => { d.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }, 120); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); d.classList.contains("is-open") ? (d.classList.remove("is-open"), btn.setAttribute("aria-expanded", "false")) : open(); });
    d.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") open(); });
    d.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") close(); });
    d.addEventListener("focusout", (e) => { if (!d.contains(e.relatedTarget)) close(); });
    $$(".dd-link", d).forEach((a) => a.addEventListener("click", () => closeAll()));
  });
  document.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAll(); closeMenu(); } });

  const menu = $("#mobileMenu");
  const openBtn = $("#menuOpen");
  const openMenu = () => { menu.classList.add("is-open"); openBtn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; $("#menuClose").focus(); };
  function closeMenu() { if (!menu.classList.contains("is-open")) return; menu.classList.remove("is-open"); openBtn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
  openBtn.addEventListener("click", openMenu);
  $("#menuClose").addEventListener("click", () => { closeMenu(); openBtn.focus(); });
  $$("[data-close]", menu).forEach((a) => a.addEventListener("click", closeMenu));
  $$("[data-mgroup]", menu).forEach((g) => {
    const b = g.querySelector("button");
    b.addEventListener("click", () => { const o = g.classList.toggle("is-open"); b.setAttribute("aria-expanded", String(o)); });
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 1024) closeMenu(); });

  /* -----------------------------------------------------------------------
     Animation scheduler — one RAF loop, only for visible canvases
     ----------------------------------------------------------------------- */
  const actors = new Set();
  const visible = new WeakMap();
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => visible.set(en.target, en.isIntersecting));
  }, { rootMargin: "100px" }) : null;
  const register = (actor) => { actors.add(actor); if (io) io.observe(actor.el); else visible.set(actor.el, true); };
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!document.hidden) actors.forEach((a) => { if (visible.get(a.el) !== false) a.frame(dt, now / 1000); });
    requestAnimationFrame(loop);
  };

  const fitCanvas = (canvas) => {
    const r = canvas.getBoundingClientRect();
    const d = DPR();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (canvas.width !== w * d || canvas.height !== h * d) { canvas.width = w * d; canvas.height = h * d; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(d, 0, 0, d, 0, 0);
    return { ctx, w, h };
  };

  /* -----------------------------------------------------------------------
     City map — procedural streets, live vehicles, highlighted route
     ----------------------------------------------------------------------- */
  const MAP_PRESETS = {
    hero:           { cell: 44, vehicles: 14, route: true,  water: true,  seed: 11 },
    phone:          { cell: 38, vehicles: 3,  route: true,  water: false, seed: 5 },
    "phone-driver": { cell: 38, vehicles: 2,  route: true,  water: true,  seed: 8 },
    mini:           { cell: 22, vehicles: 7,  route: false, water: true,  seed: 3 },
    live:           { cell: 46, vehicles: 38, route: true,  water: true,  seed: 21 },
    "wl-cust":      { cell: 38, vehicles: 3,  route: true,  water: false, seed: 14 },
    "wl-drv":       { cell: 38, vehicles: 2,  route: true,  water: true,  seed: 17 },
    "wl-admin":     { cell: 22, vehicles: 7,  route: false, water: true,  seed: 9 },
    "live-control": { cell: 42, vehicles: 52, route: true,  water: true,  seed: 33 },
  };

  class CityMap {
    constructor(canvas) {
      this.el = canvas;
      this.opt = MAP_PRESETS[canvas.dataset.map] || MAP_PRESETS.mini;
      this.static = document.createElement("canvas");
      this.build();
      if ("ResizeObserver" in window) new ResizeObserver(() => this.build()).observe(canvas);
      onThemeChange(() => this.build());
      this.el.__map = this;
    }
    colors() {
      const e = this.el;
      return {
        bg: cssVar(e, "--map-bg"), road: cssVar(e, "--map-road"), road2: cssVar(e, "--map-road-2"),
        block: cssVar(e, "--map-block"), water: cssVar(e, "--map-water"),
        route: cssVar(e, "--brand") || cssVar(e, "--accent"), accent: cssVar(e, "--accent"),
        info: cssVar(e, "--info"), fg: cssVar(e, "--fg"), surface: cssVar(e, "--surface"), idle: "#9aa5a8",
      };
    }
    build() {
      const { w, h } = fitCanvas(this.el);
      if (w < 4 || h < 4) return;
      this.w = w; this.h = h;
      const R = rng(this.opt.seed);
      const cell = this.opt.cell;
      const xs = [], ys = [];
      for (let x = -R() * cell * 0.5; x < w + cell; x += cell * (0.8 + R() * 0.5)) xs.push(x);
      for (let y = -R() * cell * 0.5; y < h + cell; y += cell * (0.75 + R() * 0.5)) ys.push(y);
      this.xs = xs; this.ys = ys;
      this.majorX = new Set(xs.map((_, i) => i).filter((i) => i % 3 === 1));
      this.majorY = new Set(ys.map((_, i) => i).filter((i) => i % 3 === 2));
      this.c = this.colors();

      // Static layer
      const d = DPR();
      const s = this.static; s.width = w * d; s.height = h * d;
      const g = s.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
      const c = this.c;
      g.fillStyle = c.bg; g.fillRect(0, 0, w, h);
      // blocks
      for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
        const inset = 3.5;
        const bx = xs[i] + inset, by = ys[j] + inset, bw = xs[i + 1] - xs[i] - inset * 2, bh = ys[j + 1] - ys[j] - inset * 2;
        if (bw <= 0 || bh <= 0) continue;
        g.fillStyle = c.block;
        g.globalAlpha = 0.55 + R() * 0.45;
        roundRect(g, bx, by, bw, bh, 2); g.fill();
        if (R() > 0.55 && bw > 18 && bh > 18) { // subdivide some blocks
          g.globalAlpha = 1; g.strokeStyle = c.bg; g.lineWidth = 1.5;
          g.beginPath(); if (R() > 0.5) { g.moveTo(bx + bw / 2, by); g.lineTo(bx + bw / 2, by + bh); } else { g.moveTo(bx, by + bh / 2); g.lineTo(bx + bw, by + bh / 2); } g.stroke();
        }
      }
      g.globalAlpha = 1;
      // water
      if (this.opt.water) {
        g.strokeStyle = c.water; g.lineWidth = Math.max(10, Math.min(w, h) * 0.07); g.lineCap = "round";
        g.beginPath(); g.moveTo(-20, h * 0.78); g.bezierCurveTo(w * 0.3, h * 0.62, w * 0.55, h * 1.02, w + 20, h * 0.7); g.stroke();
      }
      // roads
      const drawRoad = (x1, y1, x2, y2, major) => {
        g.lineCap = "butt";
        g.strokeStyle = c.road2; g.lineWidth = major ? 7 : 4.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        g.strokeStyle = c.road; g.lineWidth = major ? 5 : 3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      };
      xs.forEach((x, i) => drawRoad(x, 0, x, h, this.majorX.has(i)));
      ys.forEach((y, j) => drawRoad(0, y, w, y, this.majorY.has(j)));

      // Route (pickup -> drop) along the grid
      this.route = null;
      if (this.opt.route && xs.length > 3 && ys.length > 3) {
        const cx = (v) => Math.max(1, Math.min(xs.length - 2, v));
        const cy = (v) => Math.max(1, Math.min(ys.length - 2, v));
        const i1 = cx(Math.floor(xs.length * 0.22)), j1 = cy(Math.floor(ys.length * 0.72));
        const i2 = cx(Math.floor(xs.length * 0.74)), j2 = cy(Math.floor(ys.length * 0.25));
        const im = cx(Math.floor((i1 + i2) / 2));
        const pts = [[xs[i1], ys[j1]], [xs[im], ys[j1]], [xs[im], ys[j2]], [xs[i2], ys[j2]]];
        let len = 0; const segs = [];
        for (let k = 0; k < pts.length - 1; k++) { const l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); segs.push(l); len += l; }
        this.route = { pts, segs, len, t: 0.18 };
      }

      // Vehicles on the grid
      const R2 = rng(this.opt.seed * 7 + 1);
      this.vehicles = [];
      for (let k = 0; k < this.opt.vehicles; k++) {
        const horizontal = R2() > 0.5;
        const lines = horizontal ? ys : xs, along = horizontal ? xs : ys;
        const li = Math.floor(R2() * lines.length);
        const from = Math.floor(R2() * (along.length - 1));
        const dir = R2() > 0.5 ? 1 : -1;
        const r = R2();
        this.vehicles.push({ horizontal, li, from, to: Math.max(0, Math.min(along.length - 1, from + dir)), t: R2(), speed: 14 + R2() * 16,
          state: r < 0.45 ? "trip" : r < 0.7 ? "pickup" : "idle" });
      }
      this.draw(0);
    }
    step(v, dt) {
      const along = v.horizontal ? this.xs : this.ys;
      const segLen = Math.abs(along[v.to] - along[v.from]) || 1;
      v.t += (v.speed * dt) / segLen;
      if (v.t >= 1) {
        v.t = 0;
        const R = Math.random();
        if (R < 0.3) { // turn at intersection
          const node = v.to;
          const newLines = v.horizontal ? this.xs : this.ys;
          const newAlong = v.horizontal ? this.ys : this.xs;
          v.horizontal = !v.horizontal;
          const li = node; const from = v.li;
          v.li = Math.min(li, newLines.length - 1);
          v.from = Math.min(from, newAlong.length - 1);
          const dir = Math.random() > 0.5 ? 1 : -1;
          v.to = v.from + dir; if (v.to < 0 || v.to >= newAlong.length) v.to = v.from - dir;
        } else {
          const dir = v.to - v.from;
          v.from = v.to; v.to = v.from + dir;
          if (v.to < 0 || v.to >= along.length) v.to = v.from - dir;
        }
      }
    }
    pos(v) {
      const along = v.horizontal ? this.xs : this.ys, lines = v.horizontal ? this.ys : this.xs;
      const a = along[v.from], b = along[v.to], l = lines[v.li];
      if (a === undefined || b === undefined || l === undefined) return null;
      const p = a + (b - a) * v.t;
      return v.horizontal ? [p, l] : [l, p];
    }
    routePoint(t) {
      const { pts, segs, len } = this.route;
      let dist = t * len;
      for (let k = 0; k < segs.length; k++) {
        if (dist <= segs[k]) { const f = dist / segs[k]; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]; }
        dist -= segs[k];
      }
      return pts[pts.length - 1];
    }
    frame(dt) {
      if (!this.vehicles) return;
      if (!reduceMotion) {
        this.vehicles.forEach((v) => this.step(v, dt));
        if (this.route) { this.route.t += dt * 0.035; if (this.route.t > 1) this.route.t = 0; }
      }
      this.draw();
    }
    draw() {
      const ctx = this.el.getContext("2d");
      const d = DPR();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.el.width, this.el.height);
      ctx.drawImage(this.static, 0, 0);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const c = this.c;
      // vehicles
      this.vehicles.forEach((v) => {
        const p = this.pos(v); if (!p) return;
        const col = v.state === "trip" ? c.accent : v.state === "pickup" ? c.info : c.idle;
        ctx.beginPath(); ctx.arc(p[0], p[1], 3.6, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = c.surface; ctx.stroke();
      });
      // route
      if (this.route) {
        const { pts } = this.route;
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.strokeStyle = c.route; ctx.globalAlpha = 0.22; ctx.lineWidth = 8;
        ctx.beginPath(); pts.forEach((pt, k) => (k ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]))); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 3;
        ctx.beginPath(); pts.forEach((pt, k) => (k ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]))); ctx.stroke();
        const a = pts[0], b = pts[pts.length - 1];
        ctx.beginPath(); ctx.arc(a[0], a[1], 5.5, 0, Math.PI * 2); ctx.fillStyle = c.surface; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = c.fg; ctx.stroke();
        ctx.fillStyle = c.route; ctx.fillRect(b[0] - 5, b[1] - 5, 10, 10); ctx.lineWidth = 2; ctx.strokeStyle = c.surface; ctx.strokeRect(b[0] - 5, b[1] - 5, 10, 10);
        const car = this.routePoint(this.route.t);
        ctx.beginPath(); ctx.arc(car[0], car[1], 10, 0, Math.PI * 2); ctx.fillStyle = c.route; ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(car[0], car[1], 5, 0, Math.PI * 2); ctx.fillStyle = c.fg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c.surface; ctx.stroke();
      }
    }
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  $$("canvas[data-map]").forEach((c) => register(new CityMap(c)));

  /* -----------------------------------------------------------------------
     Hero network — slow-moving digital nodes behind the UI fragments
     ----------------------------------------------------------------------- */
  class Network {
    constructor(canvas) {
      this.el = canvas;
      const R = rng(42);
      this.nodes = Array.from({ length: 30 }, () => ({ x: R(), y: R(), ph: R() * 6.28, sp: 0.15 + R() * 0.25, r: 1.4 + R() * 1.6 }));
      this.pulses = [];
      this.resize();
      if ("ResizeObserver" in window) new ResizeObserver(() => this.resize()).observe(canvas);
      onThemeChange(() => this.resize());
    }
    resize() { const f = fitCanvas(this.el); this.w = f.w; this.h = f.h; this.line = cssVar(this.el, "--line-2"); this.acc = cssVar(this.el, "--accent"); this.draw(0); }
    frame(dt, t) { this.draw(reduceMotion ? 0 : t); }
    draw(t) {
      const { w, h } = this; const ctx = this.el.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      const P = this.nodes.map((n) => [n.x * w + Math.sin(t * n.sp + n.ph) * 14, n.y * h + Math.cos(t * n.sp * 0.8 + n.ph) * 12, n.r]);
      const maxD = Math.min(w, h) * 0.28;
      const edges = [];
      ctx.lineWidth = 1;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const dd = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
        if (dd < maxD) {
          edges.push([i, j]);
          ctx.globalAlpha = (1 - dd / maxD) * 0.9; ctx.strokeStyle = this.line;
          ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      P.forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, 6.28); ctx.fillStyle = this.line; ctx.fill(); });
      // pulses travel along edges
      if (!reduceMotion && edges.length) {
        if (this.pulses.length < 5 && Math.random() < 0.03) { const e = edges[Math.floor(Math.random() * edges.length)]; this.pulses.push({ e, t: 0 }); }
        this.pulses = this.pulses.filter((p) => (p.t += 0.012) < 1);
        this.pulses.forEach((p) => {
          const a = P[p.e[0]], b = P[p.e[1]]; if (!a || !b) return;
          const x = a[0] + (b[0] - a[0]) * p.t, y = a[1] + (b[1] - a[1]) * p.t;
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.28); ctx.fillStyle = this.acc; ctx.fill();
          ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
        });
      }
    }
  }
  const heroNet = $("#heroNet");
  if (heroNet) register(new Network(heroNet));

  /* -----------------------------------------------------------------------
     Hero: sparkline, active-trip counter, dispatch log (illustrative)
     ----------------------------------------------------------------------- */
  const spark = { data: [38, 40, 39, 42, 41, 44, 43, 45, 44, 46, 45, 47, 46, 44, 45, 47, 48, 46, 47, 45, 46, 48, 47, 46] };
  const drawSpark = () => {
    const W = 160, H = 36, min = 34, max = 50;
    const pts = spark.data.map((v, i) => [(i / (spark.data.length - 1)) * W, H - ((v - min) / (max - min)) * (H - 4) - 2]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    $("#sparkLine")?.setAttribute("d", d);
    $("#sparkArea")?.setAttribute("d", d + ` L${W} ${H} L0 ${H} Z`);
  };
  drawSpark();
  const heroEvents = $("#heroEvents");
  const templates = [
    ["CR-2%n assigned to driver D-1%d", "var(--accent)"],
    ["Fare estimate sent · %v", "var(--info)"],
    ["CR-2%n completed · fare recorded", "var(--ok)"],
    ["Vendor North Zone · VH-0%d online", "var(--muted)"],
    ["CR-2%n pickup confirmed", "var(--accent)"],
  ];
  let evtN = 419, clock = 9 * 60 + 41;
  if (!reduceMotion) setInterval(() => {
    if (document.hidden) return;
    const v = spark.data[spark.data.length - 1] + (Math.random() > 0.5 ? 1 : -1);
    spark.data.push(Math.max(40, Math.min(49, v))); spark.data.shift(); drawSpark();
    const el = $("#heroActive"); if (el) el.textContent = spark.data[spark.data.length - 1];
    if (heroEvents) {
      const [tpl, col] = templates[Math.floor(Math.random() * templates.length)];
      const txt = tpl.replace("%n", String(evtN++).padStart(4, "0")).replace("%d", String(10 + Math.floor(Math.random() * 89))).replace("%v", ["Sedan", "SUV", "Hatchback"][Math.floor(Math.random() * 3)]);
      clock += Math.random() > 0.5 ? 1 : 0;
      const row = document.createElement("div");
      row.className = "evt new";
      row.innerHTML = `<i style="background:${col}"></i><span></span><time>${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}</time>`;
      row.querySelector("span").textContent = txt;
      heroEvents.prepend(row);
      while (heroEvents.children.length > 3) heroEvents.lastElementChild.remove();
    }
  }, 2600);

  /* -----------------------------------------------------------------------
     Dashboard: revenue chart + live activity feed
     ----------------------------------------------------------------------- */
  const rev = [412, 438, 455, 431, 472, 498, 486];   // ₹ thousands, sample
  const prior = [398, 405, 430, 420, 441, 452, 463];
  const days = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Today"];
  const drawChart = () => {
    const svg = $("#revChart"); if (!svg) return;
    const W = Math.max(320, Math.round(svg.getBoundingClientRect().width || 480)), H = 190;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const pad = { l: 44, r: 16, t: 16, b: 26 };
    const y0 = 350, y1 = 510;
    const X = (i) => pad.l + (i / (rev.length - 1)) * (W - pad.l - pad.r);
    const Y = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
    const path = (arr) => arr.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    let s = `<defs><linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".18"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
    [350, 400, 450, 500].forEach((v) => {
      s += `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;
      s += `<text x="${pad.l - 8}" y="${Y(v) + 3}" text-anchor="end">₹${(v / 100).toFixed(1)}L</text>`;
    });
    days.forEach((d, i) => { s += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${d}</text>`; });
    s += `<path class="line-2" d="${path(prior)}"/>`;
    s += `<path class="area" d="${path(rev)} L${X(rev.length - 1)} ${Y(y0)} L${X(0)} ${Y(y0)} Z"/>`;
    s += `<path class="line${reduceMotion ? "" : " draw"}" d="${path(rev)}"/>`;
    rev.forEach((v, i) => { if (i === rev.length - 1) return; s += `<circle cx="${X(i)}" cy="${Y(v)}" r="2.5" fill="var(--accent)"/>`; });
    const li = rev.length - 1;
    s += `<line x1="${X(li)}" x2="${X(li)}" y1="${Y(rev[li])}" y2="${Y(y0)}" stroke="var(--accent)" stroke-dasharray="2 3" opacity=".5"/>`;
    s += `<circle class="pt" cx="${X(li)}" cy="${Y(rev[li])}" r="4.5"/>`;
    s += `<rect x="${X(li) - 62}" y="${Y(rev[li]) - 30}" width="56" height="20" rx="4" fill="var(--fg)"/>`;
    s += `<text x="${X(li) - 34}" y="${Y(rev[li]) - 16}" text-anchor="middle" style="fill:var(--surface);font-weight:600">₹4.86L</text>`;
    svg.innerHTML = s;
  };
  drawChart();
  let chartT; window.addEventListener("resize", () => { clearTimeout(chartT); chartT = setTimeout(drawChart, 150); });

  const feed = $("#feed");
  const feedTpl = [
    ["i-route", "Booking <b>CR-2%n</b> created · Sedan"],
    ["i-dispatch", "<b>CR-2%n</b> dispatched to Ravi K."],
    ["i-check", "Trip <b>CR-2%n</b> completed · ₹%f"],
    ["i-car", "<b>VH-0%v</b> marked available"],
    ["i-vendor", "Airport Line added driver <b>D-1%v</b>"],
    ["i-wallet", "Payout batch prepared · North Zone"],
    ["i-fare", "Fare rule updated · Airport surcharge"],
  ];
  let feedN = 412, feedMin = 41;
  const addFeed = (initial) => {
    if (!feed) return;
    const [ic, html] = feedTpl[Math.floor(Math.random() * feedTpl.length)];
    const row = document.createElement("div");
    row.className = "feed-item" + (initial ? "" : " new");
    const txt = html.replace("%n", String(feedN++).padStart(4, "0")).replace("%v", String(100 + Math.floor(Math.random() * 99))).replace("%f", String(200 + Math.floor(Math.random() * 60) * 10));
    const ago = initial ? `${Math.max(1, Math.floor(Math.random() * 9))} min ago` : "Just now";
    row.innerHTML = `<span class="fi"><svg class="icon"><use href="#${ic}"/></svg></span><span>${txt}<time>${ago}</time></span>`;
    feed.prepend(row);
    while (feed.children.length > 6) feed.lastElementChild.remove();
  };
  for (let k = 0; k < 6; k++) addFeed(true);
  $$(".feed-item time", feed).forEach((t, k) => { t.textContent = k === 0 ? "Just now" : `${k * 2} min ago`; });
  if (!reduceMotion) setInterval(() => { if (!document.hidden) addFeed(false); }, 3400);

  /* -----------------------------------------------------------------------
     Ecosystem connectors
     ----------------------------------------------------------------------- */
  const eco = $("#eco"), ecoSvg = $("#ecoSvg"), ecoCore = $("#ecoCore");
  let ecoActive = 0, ecoPaused = false;
  const drawEco = () => {
    if (!eco || getComputedStyle(ecoSvg).display === "none") return;
    const box = eco.getBoundingClientRect();
    const core = ecoCore.querySelector(".eco-core-in").getBoundingClientRect();
    const cx = core.left + core.width / 2 - box.left, cy = core.top + core.height / 2 - box.top, cr = core.width / 2 + 10;
    ecoSvg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    let s = "";
    $$("[data-eco]", eco).forEach((n) => {
      const r = n.getBoundingClientRect();
      const i = +n.dataset.eco;
      let x1, y1, x2, y2, dpath;
      if (i === 4) { // admin below
        x1 = cx; y1 = r.top - box.top; x2 = cx; y2 = cy + cr;
        dpath = `M${x1} ${y1} L${x2} ${y2}`;
      } else {
        const left = r.left + r.width / 2 < cx + box.left;
        x1 = left ? r.right - box.left : r.left - box.left;
        y1 = r.top + r.height / 2 - box.top;
        const ang = Math.atan2(y1 - cy, x1 - cx);
        x2 = cx + Math.cos(ang) * cr; y2 = cy + Math.sin(ang) * cr;
        const mx = (x1 + x2) / 2;
        dpath = `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      }
      s += `<path d="${dpath}"/>`;
      if (i === ecoActive) s += `<path class="flow" d="${dpath}"/>`;
      n.classList.toggle("is-hot", i === ecoActive);
    });
    ecoSvg.innerHTML = s;
  };
  if (eco) {
    drawEco();
    window.addEventListener("resize", drawEco);
    if ("ResizeObserver" in window) new ResizeObserver(drawEco).observe(eco);
    $$("[data-eco]", eco).forEach((n) => {
      n.addEventListener("pointerenter", () => { ecoPaused = true; ecoActive = +n.dataset.eco; drawEco(); });
      n.addEventListener("pointerleave", () => { ecoPaused = false; });
    });
    if (!reduceMotion) setInterval(() => { if (!ecoPaused && !document.hidden) { ecoActive = (ecoActive + 1) % 5; drawEco(); } }, 2200);
  }

  /* -----------------------------------------------------------------------
     Automation: before -> platform -> after
     ----------------------------------------------------------------------- */
  const auto = $("#auto"), autoSvg = $("#autoSvg"), autoCore = $("#autoCore");
  let autoI = 0;
  const drawAuto = () => {
    if (!auto || getComputedStyle(autoSvg).display === "none") {
      $$(".auto-item", auto).forEach((it) => it.classList.toggle("is-hot", +it.dataset.auto === autoI));
      return;
    }
    const box = auto.getBoundingClientRect(), core = autoCore.getBoundingClientRect();
    autoSvg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const cyc = core.top + core.height / 2 - box.top;
    let s = "";
    $$(".auto-before .auto-item", auto).forEach((it, i) => {
      const r = it.getBoundingClientRect();
      const x1 = r.right - box.left, y1 = r.top + r.height / 2 - box.top, x2 = core.left - box.left, y2 = cyc + (i - 2.5) * 10;
      const mx = (x1 + x2) / 2;
      const d = `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      s += `<path d="${d}"/>` + (i === autoI ? `<path class="hot" d="${d}"/>` : "");
    });
    $$(".auto-after .auto-item", auto).forEach((it, i) => {
      const r = it.getBoundingClientRect();
      const x1 = core.right - box.left, y1 = cyc + (i - 2.5) * 10, x2 = r.left - box.left, y2 = r.top + r.height / 2 - box.top;
      const mx = (x1 + x2) / 2;
      const d = `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      s += `<path class="after" d="${d}"/>` + (i === autoI ? `<path class="hot" d="${d}"/>` : "");
    });
    autoSvg.innerHTML = s;
    $$(".auto-item", auto).forEach((it) => it.classList.toggle("is-hot", +it.dataset.auto === autoI));
  };
  if (auto) {
    drawAuto();
    window.addEventListener("resize", drawAuto);
    if ("ResizeObserver" in window) new ResizeObserver(drawAuto).observe(auto);
    $$(".auto-item", auto).forEach((it) => it.addEventListener("pointerenter", () => { autoI = +it.dataset.auto; drawAuto(); }));
    if (!reduceMotion) setInterval(() => { if (!document.hidden) { autoI = (autoI + 1) % 6; drawAuto(); } }, 1800);
  }

  /* -----------------------------------------------------------------------
     Architecture: walk a ride request through the services
     ----------------------------------------------------------------------- */
  const archCells = $$("[data-arch]");
  const archFoot = $("#archFoot");
  const archSteps = [
    [0, "Ride Management creates the booking and its trip record."],
    [6, "Real-Time Services push the new request to nearby drivers."],
    [1, "Dispatch matches the booking with a suitable, available driver."],
    [7, "Location Services track the driver to pickup and through the trip."],
    [2, "The Fare Engine calculates the fare using your configured rules."],
    [4, "Commission rules split the fare between platform, vendor and driver."],
    [5, "Notifications keep the customer, driver and vendor informed."],
    [8, "The Data Layer stores the completed trip for reports and analytics."],
  ];
  let archI = 0;
  const stepArch = () => {
    const [idx, txt] = archSteps[archI];
    archCells.forEach((c, k) => c.classList.toggle("hl", k === idx));
    if (archFoot) archFoot.textContent = `Step ${archI + 1} of ${archSteps.length} · ${txt}`;
    archI = (archI + 1) % archSteps.length;
  };
  if (archCells.length) { stepArch(); if (!reduceMotion) setInterval(() => { if (!document.hidden) stepArch(); }, 2400); }

  /* -----------------------------------------------------------------------
     Vision constellation
     ----------------------------------------------------------------------- */
  class Vision {
    constructor(canvas) {
      this.el = canvas;
      const R = rng(7);
      this.stars = Array.from({ length: 90 }, () => ({ x: R(), y: R(), a: 0.2 + R() * 0.5 }));
      this.slots = 7;
      this.resize();
      if ("ResizeObserver" in window) new ResizeObserver(() => this.resize()).observe(canvas);
    }
    resize() {
      const f = fitCanvas(this.el); this.w = f.w; this.h = f.h;
      this.fg = cssVar(this.el, "--fg"); this.acc = cssVar(this.el, "--accent"); this.mut = cssVar(this.el, "--muted");
      this.draw(0);
    }
    frame(dt, t) { this.draw(reduceMotion ? 0 : t); }
    draw(t) {
      const { w, h } = this; const ctx = this.el.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      const narrow = w < 820;
      const cx = narrow ? w * 0.5 : w * 0.76, cy = narrow ? h * 0.8 : h * 0.5;
      const R1 = Math.min(narrow ? w * 0.36 : w * 0.17, h * (narrow ? 0.3 : 0.33));
      const R2 = R1 * 1.7;
      ctx.globalAlpha = narrow ? 0.5 : 1;
      // stars / grid dots
      this.stars.forEach((s) => { ctx.fillStyle = this.mut; ctx.globalAlpha = s.a * (narrow ? 0.4 : 0.6); ctx.fillRect(s.x * w, s.y * h, 1.2, 1.2); });
      ctx.globalAlpha = narrow ? 0.6 : 1;
      // orbits
      ctx.strokeStyle = this.mut; ctx.lineWidth = 1;
      [R1, R2].forEach((r, k) => { ctx.globalAlpha = (k ? 0.12 : 0.22) * (narrow ? 0.7 : 1); ctx.setLineDash(k ? [2, 6] : []); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.stroke(); });
      ctx.setLineDash([]);
      const rot = t * 0.03;
      const pts = [];
      for (let k = 0; k < this.slots; k++) {
        const ang = -Math.PI / 2 - 0.6 + (k / this.slots) * Math.PI * 2 + rot;
        const r = k % 2 ? R2 : R1;
        pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
      }
      // connections
      pts.forEach((p, k) => {
        ctx.globalAlpha = k === 0 ? 0.9 : 0.18; ctx.strokeStyle = k === 0 ? this.acc : this.mut; ctx.lineWidth = k === 0 ? 1.4 : 1;
        ctx.setLineDash(k === 0 ? [] : [3, 5]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke();
      });
      ctx.setLineDash([]);
      // pulse to CityRideTaxi
      if (!reduceMotion) {
        const f = (t * 0.5) % 1; const p = pts[0];
        ctx.globalAlpha = 1 - f; ctx.fillStyle = this.acc; ctx.beginPath(); ctx.arc(cx + (p[0] - cx) * f, cy + (p[1] - cy) * f, 2.5, 0, 6.28); ctx.fill();
      }
      // future slots
      pts.forEach((p, k) => {
        if (k === 0) return;
        ctx.globalAlpha = 0.45; ctx.strokeStyle = this.mut; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 6.28); ctx.stroke();
      });
      // CityRideTaxi node
      const p0 = pts[0];
      ctx.globalAlpha = 0.18; ctx.fillStyle = this.acc; ctx.beginPath(); ctx.arc(p0[0], p0[1], 22 + Math.sin(t * 2) * 3, 0, 6.28); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p0[0], p0[1], 8, 0, 6.28); ctx.fill();
      ctx.font = "500 12px 'Geist Mono', ui-monospace, monospace"; ctx.fillStyle = this.fg; ctx.textAlign = "left";
      ctx.fillText("CITYRIDETAXI", p0[0] + 16, p0[1] + 4);
      // core
      ctx.globalAlpha = 0.12; ctx.fillStyle = this.fg; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 6.28); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 6.28); ctx.fill();
      ctx.fillStyle = this.mut; ctx.textAlign = "center";
      ctx.fillText("NJJ TECHNOLOGIES", cx, cy + 50);
      ctx.globalAlpha = 1;
    }
  }
  const visionNet = $("#visionNet");
  if (visionNet) register(new Vision(visionNet));

  /* -----------------------------------------------------------------------
     White-label brand preview
     ----------------------------------------------------------------------- */
  const wlStage = $("#wlStage");
  if (wlStage) {
    const surfaces = $$(".phone, .browser", wlStage);
    const setBrand = (color) => {
      surfaces.forEach((s) => s.style.setProperty("--brand", color));
      $$("canvas[data-map]", wlStage).forEach((c) => c.__map && c.__map.build());
    };
    $$(".swatch").forEach((sw) => sw.addEventListener("click", () => {
      $$(".swatch").forEach((o) => o.setAttribute("aria-pressed", String(o === sw)));
      setBrand(sw.dataset.color);
    }));
    const nameIn = $("#wlName");
    nameIn.addEventListener("input", () => {
      const name = nameIn.value.trim() || "YourBrand";
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourbrand";
      $$("[data-wl-name]").forEach((n) => (n.textContent = name));
      $$("[data-wl-domain]").forEach((n) => (n.textContent = slug + ".com"));
    });
  }

  /* -----------------------------------------------------------------------
     FAQ accordion
     ----------------------------------------------------------------------- */
  $$(".faq-item").forEach((item, k) => {
    const q = item.querySelector(".faq-q");
    const set = (o) => { item.classList.toggle("is-open", o); q.setAttribute("aria-expanded", String(o)); };
    if (k === 0) set(true);
    q.addEventListener("click", () => set(!item.classList.contains("is-open")));
  });

  /* -----------------------------------------------------------------------
     Contact form — validation, loading, success
     ----------------------------------------------------------------------- */
  const form = $("#inquiry");
  if (form) {
    const success = $("#formSuccess");
    const banner = $("#formBanner");
    const btn = $("#submitBtn");
    let attempted = false;
    const F = (n) => form.elements.namedItem(n);
    const rules = {
      name: (v) => v.trim().length >= 2,
      company: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      phone: (v) => !v.trim() || /^[+\d][\d\s\-()]{6,}$/.test(v.trim()),
      type: (v) => !!v,
      build: (v) => !!v,
      message: (v) => v.trim().length >= 20,
      consent: (_, el) => el.checked,
    };
    const check = (el) => {
      const rule = rules[el.name]; if (!rule) return true;
      const ok = rule(el.value, el);
      const field = el.closest(".field");
      field.classList.toggle("has-error", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      return ok;
    };
    $$("input, select, textarea", form).forEach((el) => {
      el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "blur", () => { if (attempted || el.value) check(el); });
      el.addEventListener("input", () => { if (attempted) check(el); });
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      attempted = true;
      const fields = $$("input, select, textarea", form);
      const bad = fields.filter((el) => !check(el));
      banner.classList.toggle("show", bad.length > 0);
      if (bad.length) { bad[0].focus(); return; }
      btn.classList.add("is-loading");
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Sending…';
      setTimeout(() => {
        const name = F("name").value.trim().split(" ")[0];
        const build = F("build").options[F("build").selectedIndex].text;
        $("#successDetail").textContent = `${name}, we've received your inquiry about "${build}" and will reply to ${F("email").value.trim()}.`;
        form.hidden = true; success.hidden = false; success.focus();
        btn.classList.remove("is-loading");
        btn.innerHTML = 'Send Inquiry <svg class="icon icon-sm arrow"><use href="#i-arrow"/></svg>';
      }, 1200);
    });
    $("#formReset").addEventListener("click", () => {
      form.reset(); attempted = false; banner.classList.remove("show");
      $$(".field", form).forEach((f) => f.classList.remove("has-error"));
      success.hidden = true; form.hidden = false; F("name").focus();
    });

    // CTAs that pre-fill the form
    const preset = (value) => {
      form.hidden = false; success.hidden = true;
      if (value) F("build").value = value;
      if (attempted) check(F("build"));
      setTimeout(() => F("name").focus({ preventScroll: true }), 500);
    };
    $$("[data-demo]").forEach((a) => a.addEventListener("click", () => preset("demo")));
    $$("[data-custom]").forEach((a) => a.addEventListener("click", () => preset("custom")));
    $$("[data-focus-form]").forEach((a) => a.addEventListener("click", () => preset("")));
  }

  /* -----------------------------------------------------------------------
     Platform Overview: Expandable Accordion Rows
     ----------------------------------------------------------------------- */
  $$(".acc-row").forEach((row) => {
    const btn = row.querySelector(".acc-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = row.classList.contains("is-open");
      $$(".acc-row").forEach((r) => {
        r.classList.remove("is-open");
        r.querySelector(".acc-btn")?.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        row.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* -----------------------------------------------------------------------
     Intelligent Dispatch: Interactive Step Simulation
     ----------------------------------------------------------------------- */
  const dispatchNodes = $$(".dispatch-node");
  const dispatchExplain = $("#dispatchRuleExplain");
  const dispatchRules = [
    "Step 1: Rider creates a booking specifying pickup, drop-off, vehicle class (Sedan, SUV, Hatchback) and immediate or scheduled dispatch.",
    "Step 2: Geocoding and route engine determines road geometry, traffic density, pickup zone boundaries, and ETA thresholds.",
    "Step 3: Real-time query identifies online drivers within the target polygon with active shift credentials and vehicle readiness.",
    "Step 4: System verifies vehicle document compliance, fuel/battery level, safety inspection records, and vendor operational status.",
    "Step 5: Dynamic matrix ranks eligible drivers based on proximity, historical pickup reliability, traffic delay, and turn radius.",
    "Step 6: Smart dispatch engine offers ride to highest-scoring driver with automated fallback if not acknowledged within 15 seconds.",
    "Step 7: Driver receives audio cue and route preview in driver app and accepts with a single tap, locking the reservation.",
    "Step 8: Turn-by-turn navigation starts; real-time telemetry and encrypted tracking link stream to customer and vendor control rooms."
  ];

  let dispatchTimer = null;
  let activeDispatchIdx = 0;

  const setDispatchStep = (idx, manual = false) => {
    activeDispatchIdx = idx;
    dispatchNodes.forEach((node, k) => {
      node.classList.toggle("is-active", k === idx);
    });
    if (dispatchExplain) {
      dispatchExplain.textContent = dispatchRules[idx] || dispatchRules[0];
    }
  };

  dispatchNodes.forEach((node, idx) => {
    node.addEventListener("click", () => {
      clearInterval(dispatchTimer);
      setDispatchStep(idx, true);
    });
  });

  if (dispatchNodes.length && !reduceMotion) {
    dispatchTimer = setInterval(() => {
      if (document.hidden) return;
      activeDispatchIdx = (activeDispatchIdx + 1) % dispatchNodes.length;
      setDispatchStep(activeDispatchIdx);
    }, 3800);
  }

  /* -----------------------------------------------------------------------
     Fare & Pricing Engine: Interactive Calculator
     ----------------------------------------------------------------------- */
  const fareVehicle = $("#fareVehicle");
  const fareCategory = $("#fareCategory");
  const fareDistance = $("#fareDistance");
  const fareDistanceVal = $("#fareDistanceVal");
  const fareSurge = $("#fareSurge");

  const outBaseFare = $("#outBaseFare");
  const outDistFare = $("#outDistFare");
  const outSurge = $("#outSurge");
  const outGst = $("#outGst");
  const outTotalFare = $("#outTotalFare");
  const outCommission = $("#outCommission");
  const outVendorShare = $("#outVendorShare");
  const outDriverShare = $("#outDriverShare");

  const vehicleRates = {
    sedan: { base: 60, perKm: 14, min: 100 },
    suv: { base: 90, perKm: 19, min: 150 },
    hatchback: { base: 45, perKm: 11, min: 80 },
    premium: { base: 120, perKm: 26, min: 220 },
    electric: { base: 70, perKm: 15, min: 110 }
  };

  const updateFareCalc = () => {
    if (!fareVehicle || !fareDistance) return;
    const veh = fareVehicle.value || "sedan";
    const rates = vehicleRates[veh] || vehicleRates.sedan;
    const dist = parseFloat(fareDistance.value) || 12;
    if (fareDistanceVal) fareDistanceVal.textContent = `${dist} km`;

    const surgeMult = parseFloat(fareSurge?.value) || 1.0;
    const cat = fareCategory?.value || "city";
    const isAirport = cat === "airport";
    const isOutstation = cat === "outstation";
    const isHillStation = cat === "hillstation";
    const isParcel = cat === "parcel";

    let effectiveDist = dist;
    let categorySurcharge = 0;

    if (isAirport) categorySurcharge += 80;
    if (isHillStation) categorySurcharge += 400;

    // Outstation rule: Minimum 130 km running + Driver Betta (₹400 standard, ₹600 above 250 kms)
    if (isOutstation) {
      effectiveDist = Math.max(130, dist);
      const betta = effectiveDist > 250 ? 600 : 400;
      categorySurcharge += betta;
    }

    const base = isParcel ? 40 : rates.base;
    const perKmRate = isParcel ? 8 : rates.perKm;
    const distCost = effectiveDist * perKmRate;
    const subtotal = Math.max(rates.min, (base + distCost + categorySurcharge) * surgeMult);
    const gst = Math.round(subtotal * 0.05);
    const finalFare = Math.round(subtotal + gst);

    const platformComm = Math.round(finalFare * 0.10);
    const vendorShare = Math.round(finalFare * 0.15);
    const driverShare = finalFare - platformComm - vendorShare;

    let baseText = `₹${base}`;
    if (isOutstation) baseText += ` + Betta ₹${effectiveDist > 250 ? 600 : 400}`;
    else if (isAirport) baseText += ` + Toll ₹80`;
    else if (isHillStation) baseText += ` + Hill ₹400`;

    if (outBaseFare) outBaseFare.textContent = baseText;
    if (outDistFare) outDistFare.textContent = isOutstation && dist < 130 
      ? `₹${Math.round(distCost)} (Min 130km)` 
      : `₹${Math.round(distCost)}`;
    if (outSurge) outSurge.textContent = surgeMult > 1.0 ? `${surgeMult}x (Peak)` : "1.0x (Standard)";
    if (outGst) outGst.textContent = `₹${gst} (5%)`;
    if (outTotalFare) outTotalFare.textContent = `₹${finalFare}`;
    if (outCommission) outCommission.textContent = `₹${platformComm} (10%)`;
    if (outVendorShare) outVendorShare.textContent = `₹${vendorShare} (15%)`;
    if (outDriverShare) outDriverShare.textContent = `₹${driverShare} (75%)`;
  };

  [fareVehicle, fareCategory, fareDistance, fareSurge].forEach((el) => {
    if (el) el.addEventListener("input", updateFareCalc);
  });
  updateFareCalc();

  /* -----------------------------------------------------------------------
     App View Tabs (Customer & Driver Showcases)
     ----------------------------------------------------------------------- */
  $$("[data-tab-group]").forEach((group) => {
    const groupId = group.dataset.tabGroup;
    const buttons = $$("[data-tab-target]", group);
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.tabTarget;
        buttons.forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        $$(`[data-tab-content="${groupId}"]`).forEach((panel) => {
          panel.hidden = panel.id !== targetId;
        });
      });
    });
  });

  /* -----------------------------------------------------------------------
     Book a Demo Modal Dialog
     ----------------------------------------------------------------------- */
  const demoModal = $("#demoModal");
  const openModalBtns = $$("[data-open-modal]");
  const closeModalBtns = $$("[data-close-modal]");

  const openDemoModal = (presetService = "") => {
    if (!demoModal) return;
    demoModal.classList.add("is-active");
    document.body.style.overflow = "hidden";
    const modalType = $("#m-type");
    if (modalType && presetService) modalType.value = presetService;
    const firstInput = $("#m-name");
    if (firstInput) setTimeout(() => firstInput.focus(), 150);
  };

  const closeDemoModal = () => {
    if (!demoModal) return;
    demoModal.classList.remove("is-active");
    document.body.style.overflow = "";
  };

  openModalBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDemoModal(btn.dataset.openModal || "");
    });
  });

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeDemoModal);
  });

  if (demoModal) {
    demoModal.addEventListener("click", (e) => {
      if (e.target === demoModal) closeDemoModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDemoModal();
    }
  });

  const modalForm = $("#modalDemoForm");
  if (modalForm) {
    modalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = $("#modalSubmitBtn");
      submitBtn.classList.add("is-loading");
      submitBtn.textContent = "Scheduling Demo…";
      setTimeout(() => {
        submitBtn.classList.remove("is-loading");
        modalForm.innerHTML = `
          <div style="text-align:center;padding:24px 0;display:flex;flex-direction:column;align-items:center;gap:16px;">
            <div style="width:52px;height:52px;border-radius:50%;background:var(--ok-soft);color:var(--ok);display:grid;place-items:center;font-size:24px;">✓</div>
            <h3 style="font-size:1.4rem;letter-spacing:-0.02em;">Demo Walkthrough Requested</h3>
            <p style="color:var(--fg-2);font-size:0.9375rem;max-width:44ch;line-height:1.5;">Our enterprise mobility specialists will contact you within 2 business hours to schedule an architecture and white-label platform walkthrough.</p>
            <button type="button" class="btn btn-secondary btn-sm" data-close-modal style="margin-top:8px;">Close Window</button>
          </div>
        `;
        modalForm.querySelector("[data-close-modal]")?.addEventListener("click", closeDemoModal);
      }, 1000);
    });
  }

  requestAnimationFrame(loop);
})();

