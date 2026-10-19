/* =========================================================
   Garnet Cosméticos — interações do protótipo
   GSAP + ScrollTrigger (animações no scroll), Lenis (scroll suave),
   canvas (sequência de frames + poeira dourada) e JS puro.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const body = document.body;
  const WHATSAPP = "5511981531188";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem storage */ } },
  };

  if (reduced) document.documentElement.classList.add("reduced");
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- sequência de frames (técnica da MBOOM) ---------- */
  const SEQ = { frames: 150, path: (i) => `assets/seq/compact-${String(i).padStart(3, "0")}.webp` };
  const images = new Array(SEQ.frames);
  const canvas = $(".story__canvas");
  const ctx = canvas.getContext("2d");
  let current = -1;

  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // a largura pode estar escalada pelo transform; usa o tamanho de layout
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    current = -1;
    return r;
  }

  function drawFrame(i) {
    i = Math.max(0, Math.min(SEQ.frames - 1, Math.round(i)));
    let k = i;
    while (k > 0 && !(images[k] && images[k].complete && images[k].naturalWidth)) k--;
    if (k === current) return;
    const img = images[k];
    if (!img || !img.naturalWidth) return;
    current = k;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  function loadFrames(onProgress) {
    let done = 0;
    // primeiro o frame 0 e alguns "âncoras" espalhados; depois o resto, 6 por vez
    const order = [0];
    for (let step = 16; step >= 1; step = Math.floor(step / 2)) {
      for (let i = 0; i < SEQ.frames; i += step) if (!order.includes(i)) order.push(i);
      if (step === 1) break;
    }
    return new Promise((resolve) => {
      let next = 0;
      const pump = () => {
        if (next >= order.length) return;
        const i = order[next++];
        const img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = () => {
          done++;
          onProgress(done / SEQ.frames);
          if (i === 0) drawFrame(0);
          if (done === SEQ.frames) resolve();
          else pump();
        };
        img.src = SEQ.path(i);
        images[i] = img;
      };
      for (let c = 0; c < 6; c++) pump();
    });
  }

  /* ---------- preloader ---------- */
  const pre = $(".preloader");
  const preYear = $(".preloader__year");
  const prePct = $(".preloader__pct");
  function setPre(p) {
    pre.style.setProperty("--p", p);
    $(".preloader__bar i").style.setProperty("--p", p);
    prePct.textContent = Math.round(p * 100) + "%";
    preYear.textContent = Math.round(1992 + (new Date().getFullYear() - 1992) * p);
  }
  $(".preloader__bar i").style.transform = "scaleX(var(--p))";

  const framesReady = loadFrames(setPre);
  const timeout = new Promise((r) => setTimeout(r, 7000));
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  sizeCanvas();
  Promise.all([Promise.race([framesReady, timeout]), fontsReady]).then(start);

  function start() {
    setPre(1);
    sizeCanvas();
    drawFrame(0);
    const tl = gsap.timeline({ delay: 0.25 });
    tl.to(".preloader__mark span", { yPercent: -110, opacity: 0, stagger: 0.04, duration: 0.6, ease: "power3.in" })
      .to(".preloader__meta", { opacity: 0, duration: 0.3 }, "<")
      .to(pre, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "-=0.2")
      .add(() => { pre.remove(); body.classList.remove("is-loading"); ScrollTrigger.refresh(); }, "-=0.35")
      // anima a escala pelo objeto pos (e não pelo transform do canvas, que é controlado pelo scroll)
      .fromTo(pos, { s: 0.7 }, { s: 1, duration: 1.4, ease: "expo.out" }, "-=0.55")
      .from(canvas, { opacity: 0, duration: 1, ease: "power2.out" }, "<")
      .fromTo(".chapter--hero", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, "<")
      .from(".chapter--hero > *", { y: 40, opacity: 0, stagger: 0.09, duration: 1.1, ease: "expo.out" }, "<0.1");
  }

  /* ---------- scroll suave (Lenis) ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id === "#topo" ? document.body : $(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollTo(id === "#topo" ? 0 : el);
    });
  });

  /* ---------- header ---------- */
  const header = $(".header");
  let lastY = 0;
  const onScrollHeader = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", y > 400 && y > lastY && !body.classList.contains("menu-open"));
    lastY = y;
  };
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  const burger = $(".header__burger");
  function closeMenu() {
    body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    $(".mnav").setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
  }
  burger.addEventListener("click", () => {
    const open = !body.classList.contains("menu-open");
    if (!open) return closeMenu();
    body.classList.add("menu-open");
    burger.setAttribute("aria-expanded", "true");
    $(".mnav").setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
  });

  /* ---------- linha do tempo da história ---------- */
  const chapters = $$(".chapter");
  const swatchItems = $$(".swatches li");
  const pos = { x: 0, y: 0, s: 1 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const seq = { f: 0 };

  if (reduced) {
    // sem scroll animado: mostra o estojo aberto e colorido
    const showStatic = () => { sizeCanvas(); drawFrame(Math.round(SEQ.frames * 0.45)); };
    framesReady.then(showStatic);
    window.addEventListener("resize", showStatic);
  } else {
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 761px)", mobile: "(max-width: 760px)" }, (c) => {
      const { desktop } = c.conditions;
      const W = () => window.innerWidth, H = () => window.innerHeight;
      const side = (k) => () => (desktop ? W() * k : 0);
      pos.x = desktop ? W() * 0.2 : 0; pos.y = 0; pos.s = 1;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: ".story",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate(self) { $(".story__progress").style.setProperty("--p", self.progress); },
        },
      });
      tl.to(seq, { f: SEQ.frames - 1, duration: 1 }, 0);

      // posição do estojo acompanha o lado livre de cada capítulo
      // o estojo atravessa a tela só quando nenhum texto está visível
      tl.fromTo(pos, { x: side(0.2), s: 1, y: 0 }, { x: side(-0.2), duration: 0.08, ease: "power2.inOut" }, 0.09)
        .to(pos, { x: side(0.2), duration: 0.05, ease: "power2.inOut" }, 0.36)
        .to(pos, { x: side(-0.2), duration: 0.05, ease: "power2.inOut" }, 0.635)
        .to(pos, { x: 0, y: () => (desktop ? -H() * 0.13 : -H() * 0.04), s: desktop ? 0.72 : 0.9, duration: 0.05, ease: "power2.inOut" }, 0.85);

      const show = (el, at, dur = 0.05) => tl.fromTo(el, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: dur, ease: "power2.out" }, at);
      const hide = (el, at, dur = 0.05) => tl.fromTo(el, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -50, duration: dur, ease: "power2.in", immediateRender: false }, at);
      hide(chapters[0], 0.03, 0.06);
      show(chapters[1], 0.18); hide(chapters[1], 0.32, 0.04);
      show(chapters[2], 0.41); hide(chapters[2], 0.6, 0.035);
      show(chapters[3], 0.69); hide(chapters[3], 0.81, 0.04);
      show(chapters[4], 0.9);

      return () => { pos.x = 0; pos.y = 0; pos.s = 1; };
    });

    if (finePointer) {
      window.addEventListener("pointermove", (e) => {
        mouse.tx = e.clientX / window.innerWidth - 0.5;
        mouse.ty = e.clientY / window.innerHeight - 0.5;
      });
    }

    let lastSw = -1;
    gsap.ticker.add((time) => {
      drawFrame(seq.f);
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      const idle = seq.f < 2 ? Math.sin(time * 1.4) * 8 : 0; // flutua parado no topo
      canvas.style.setProperty("--cx", (pos.x + mouse.x * 24).toFixed(1) + "px");
      canvas.style.setProperty("--cy", (pos.y + mouse.y * 18 + idle).toFixed(1) + "px");
      canvas.style.setProperty("--cs", pos.s.toFixed(3));

      // destaca a cor atual enquanto o pó troca de cor (36%–66% da animação)
      const t = seq.f / (SEQ.frames - 1);
      const sw = t < 0.36 ? 0 : t > 0.66 ? 4 : Math.round(((t - 0.36) / 0.3) * 4);
      if (sw !== lastSw) {
        swatchItems.forEach((li, i) => li.classList.toggle("on", i === sw));
        lastSw = sw;
      }
    });
  }
  window.addEventListener("resize", () => { sizeCanvas(); drawFrame(seq.f); });

  /* ---------- poeira dourada (inspirado nas "brasas" do Tibidle) ---------- */
  (function dust() {
    const c = $(".dust");
    if (reduced) { c.remove(); return; }
    const g = c.getContext("2d");
    let w = 0, h = 0, parts = [], running = true;
    const make = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.12 + Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.25,
      a: 0.15 + Math.random() * 0.5,
      ph: Math.random() * 6.28,
      hue: 34 + Math.random() * 14,
    });
    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * d; c.height = h * d; g.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.min(80, Math.floor(w / 18));
      parts = Array.from({ length: n }, () => make(true));
    };
    resize();
    addEventListener("resize", resize);
    ScrollTrigger.create({ trigger: ".story", start: "top bottom", end: "bottom top", onToggle: (s) => { running = s.isActive; c.style.opacity = running ? 1 : 0; } });
    gsap.ticker.add(() => {
      if (!running) return;
      g.clearRect(0, 0, w, h);
      const mx = (mouse.x + 0.5) * w, my = (mouse.y + 0.5) * h;
      for (const p of parts) {
        p.ph += 0.02;
        p.y -= p.vy;
        p.x += p.vx + Math.sin(p.ph) * 0.2;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (finePointer && d2 < 14000) { p.x += dx * 0.02; p.y += dy * 0.02; }
        if (p.y < -10) Object.assign(p, make(false));
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, 6.283);
        g.fillStyle = `hsla(${p.hue}, 60%, 62%, ${p.a * (0.6 + 0.4 * Math.sin(p.ph * 2))})`;
        g.fill();
      }
    });
  })();

  /* ---------- marquee reativo à velocidade do scroll ---------- */
  (function marquee() {
    const track = $(".marquee__track");
    const row = $(".marquee__row");
    for (let i = 0; i < 3; i++) track.appendChild(row.cloneNode(true));
    let x = 0, boost = 0;
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      boost += (Math.abs(v) * 0.35 - boost) * 0.1;
      x -= (reduced ? 0 : 0.6) + boost;
      const wRow = row.offsetWidth;
      if (wRow && -x >= wRow) x += wRow;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-8, Math.min(8, -v * 0.25))}deg)`;
    });
  })();

  /* ---------- tilt 3D + brilho que segue o mouse (efeito da tabela do Tibidle) ---------- */
  if (finePointer && !reduced) {
    $$("[data-tilt]").forEach((el) => {
      const max = Number(el.dataset.tiltMax || 6);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", nx * 100 + "%");
        el.style.setProperty("--my", ny * 100 + "%");
        el.classList.add("is-tilting");
        el.style.transform = `perspective(900px) rotateY(${(nx - 0.5) * 2 * max}deg) rotateX(${(0.5 - ny) * 2 * max}deg) translateZ(0)`;
      });
      el.addEventListener("pointerleave", () => { el.classList.remove("is-tilting"); el.style.transform = ""; });
    });
  }

  /* ---------- revelações e contadores ---------- */
  if (!reduced) {
    ScrollTrigger.batch(".reveal", {
      start: "top 85%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 }),
    });
    gsap.from(".stat", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".stats", start: "top 80%", once: true } });
    gsap.from(".model", { y: 70, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".models__grid", start: "top 80%", once: true } });
    gsap.from(".quote", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".quotes__grid", start: "top 80%", once: true } });
    gsap.from(".footer__word", { yPercent: 40, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 70%", once: true } });
  }
  const fmt = new Intl.NumberFormat("pt-BR");
  $$("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const plain = el.hasAttribute("data-plain");
    const render = (v) => { el.textContent = pre + (plain ? Math.round(v) : fmt.format(Math.round(v))) + suf; };
    if (reduced) return render(end);
    const o = { v: plain ? end - 60 : 0 };
    render(o.v);
    gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", onUpdate: () => render(o.v), scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  /* ---------- manifesto palavra por palavra ---------- */
  (function manifesto() {
    const p = $("[data-words]");
    const gold = ["pigmento,", "pó", "ideia", "indústria", "cria."];
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w${gold.includes(w) ? " gold" : ""}">${w}</span>`).join(" ");
    if (reduced) return;
    gsap.to($$(".w", p), { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: p, start: "top 78%", end: "bottom 45%", scrub: true } });
  })();

  /* ---------- "o que fabricamos": scroll horizontal fixado ---------- */
  if (!reduced) {
    const pin = $(".hscroll__pin"), track = $(".hscroll__track"), section = $(".hscroll");
    const cats = $$(".cat", track);
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: () => "+=" + dist(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate(self) {
          $(".hscroll__bar i").style.setProperty("--p", self.progress);
          const mid = window.innerWidth / 2;
          let best = null, bd = Infinity;
          cats.forEach((c) => {
            const r = c.getBoundingClientRect();
            const d = Math.abs(r.left + r.width / 2 - mid);
            if (d < bd) { bd = d; best = c; }
          });
          const bg = best && best.style.getPropertyValue("--bg");
          if (bg) section.style.background = bg;
        },
        onLeaveBack: () => { section.style.background = ""; },
      },
    });
    gsap.set(section, { transition: "background-color .8s" });
    gsap.from(".hscroll__intro > *", { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: section, start: "top 70%", once: true } });
  }

  /* ---------- processo: linha dourada e etapas ---------- */
  (function process() {
    const steps = $$(".steps li");
    const counter = $(".process__counter b");
    if (reduced) { steps.forEach((s) => s.classList.add("on")); return; }
    gsap.to(".steps__line line", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 60%", end: "bottom 60%", scrub: true } });
    steps.forEach((li, i) => {
      ScrollTrigger.create({
        trigger: li, start: "top 62%",
        onEnter: () => { li.classList.add("on"); counter.textContent = String(i + 1).padStart(2, "0"); },
        onLeaveBack: () => { li.classList.remove("on"); counter.textContent = String(Math.max(1, i)).padStart(2, "0"); },
      });
    });
  })();

  /* ---------- linha de produção "ao vivo" (dados simulados) ---------- */
  (function live() {
    const tbody = $(".live__table tbody");
    const stages = ["Pesagem", "Mistura", "Prensagem", "Envase", "Controle de qualidade", "Expedição"];
    const products = [
      ["Pó compacto · Nude", "#c4876a"], ["Blush · Rosa", "#d75c78"], ["Sombra quarteto", "#8a4526"],
      ["Iluminador · Dourado", "#d2a65e"], ["Batom matte · Vinho", "#651c2e"], ["Body splash", "#c9b6e4"],
      ["Sérum facial", "#a7c9bb"], ["Paleta 12 cores", "#b06f8a"], ["Gloss holográfico", "#f2b8c6"],
    ];
    let lot = 412;
    const rand = (a, b) => a + Math.random() * (b - a);
    const newRow = () => {
      const [name, c] = products[Math.floor(Math.random() * products.length)];
      return { id: `GRN-26-${String(lot++).padStart(4, "0")}`, name, c, stage: Math.floor(rand(0, 3)), units: Math.round(rand(3, 60)) * 500, p: rand(5, 40) };
    };
    const rows = Array.from({ length: 5 }, newRow);
    const html = (r) => `<td>${r.id}</td><td><span class="chip"><i style="--c:${r.c}"></i>${r.name}</span></td><td class="stage">${stages[r.stage]}</td><td class="hide-sm">${fmt.format(r.units)}</td><td><div class="bar"><i style="--w:${r.p.toFixed(0)}%"></i></div></td>`;
    tbody.innerHTML = rows.map((r) => `<tr>${html(r)}</tr>`).join("");
    setInterval(() => {
      const i = Math.floor(Math.random() * rows.length);
      const r = rows[i];
      r.p += rand(18, 40);
      if (r.p >= 100) {
        if (r.stage < stages.length - 1) { r.stage++; r.p = rand(4, 15); } else { rows[i] = newRow(); }
      }
      const tr = tbody.children[i];
      tr.innerHTML = html(rows[i]);
      tr.classList.add("flash");
      setTimeout(() => tr.classList.remove("flash"), 900);
    }, 3000);
  })();

  /* ---------- configurador ---------- */
  (function configurator() {
    const svg = $(".cfg");
    const pansG = $(".cfg-pans", svg);
    const state = { shape: "round", color: "#c4876a", finish: "matte", case: "gold", text: "SUA MARCA" };
    const names = { "#c4876a": "Nude", "#d75c78": "Rosa", "#e9a07f": "Pêssego", "#8a4526": "Bronze", "#d2a65e": "Dourado", "#651c2e": "Vinho" };
    const labels = {
      shape: { round: "Redondo", square: "Quadrado", quad: "Paleta 4 cores" },
      finish: { matte: "Matte", satin: "Acetinado", shimmer: "Cintilante", metal: "Metálico" },
      case: { gold: "Embalagem dourada", black: "Embalagem preta", rose: "Embalagem rosé", clear: "Embalagem acrílica" },
    };
    const cases = { gold: ["#ecd4a0", "#a87e46"], black: ["#4a4541", "#0e0d0c"], rose: ["#f1cfc2", "#b98270"], clear: ["rgba(255,255,255,.75)", "rgba(205,210,222,.5)"] };
    const NS = "http://www.w3.org/2000/svg";
    const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

    const shade = (hex, amt) => {
      const n = parseInt(hex.slice(1), 16);
      const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * (amt > 0 ? 255 - v : v))));
      return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
    };

    function finishLayer(x, y, w, h, rx) {
      const g = el("g", {});
      if (state.finish === "satin") g.appendChild(el("rect", { x, y, width: w, height: h, rx, fill: "url(#cfgShine)", opacity: 0.6 }));
      if (state.finish === "shimmer") {
        g.appendChild(el("rect", { x, y, width: w, height: h, rx, fill: "url(#cfgSparkle)", opacity: 0.85 }));
        g.appendChild(el("rect", { x, y, width: w, height: h, rx, fill: "url(#cfgShine)", opacity: 0.5 }));
      }
      if (state.finish === "metal") {
        const id = "met" + Math.random().toString(36).slice(2, 7);
        const lg = el("linearGradient", { id, x1: 0, y1: 0, x2: 1, y2: 1 });
        [[0, "#fff", 0.0], [0.35, "#fff", 0.55], [0.5, "#fff", 0.05], [0.7, "#fff", 0.4], [1, "#fff", 0]].forEach(([o, c, a]) => lg.appendChild(el("stop", { offset: o, "stop-color": c, "stop-opacity": a })));
        g.appendChild(lg);
        g.appendChild(el("rect", { x, y, width: w, height: h, rx, fill: `url(#${id})` }));
      }
      return g;
    }

    function render() {
      const round = state.shape !== "square";
      const caseRx = state.shape === "round" ? 150 : state.shape === "quad" ? 60 : 36;
      const clipRx = state.shape === "round" ? 130 : state.shape === "quad" ? 44 : 22;
      $(".cfg-case", svg).setAttribute("rx", caseRx);
      $(".cfg-gloss", svg).setAttribute("rx", caseRx);
      $(".cfg-shadow", svg).setAttribute("rx", caseRx);
      $(".cfg-rim", svg).setAttribute("rx", caseRx - 12);
      $(".cfg-clip", svg).setAttribute("rx", clipRx);
      const [a, b] = cases[state.case];
      $(".cfg-case-a", svg).setAttribute("stop-color", a);
      $(".cfg-case-b", svg).setAttribute("stop-color", b);
      $(".cfg-case", svg).setAttribute("stroke", state.case === "clear" ? "rgba(150,155,170,.55)" : "none");

      pansG.replaceChildren();
      pansG.appendChild(el("rect", { x: 70, y: 70, width: 260, height: 260, fill: shade(state.color, -0.25) }));
      const pans = state.shape === "quad"
        ? [[78, 78, -0.05], [204, 78, 0.18], [78, 204, -0.3], [204, 204, 0.35]].map(([x, y, s]) => ({ x, y, w: 118, h: 118, rx: 18, c: shade(state.color, s) }))
        : [{ x: 74, y: 74, w: 252, h: 252, rx: round ? 126 : 18, c: state.color }];
      pans.forEach((p) => {
        pansG.appendChild(el("rect", { class: "pan", x: p.x, y: p.y, width: p.w, height: p.h, rx: p.rx, fill: p.c }));
        pansG.appendChild(finishLayer(p.x, p.y, p.w, p.h, p.rx));
      });
      if (state.text.trim()) {
        const t = el("text", { class: "pan-text", x: 200, y: 200, fill: shade(state.color, state.shape === "quad" ? 0.55 : -0.18), filter: "url(#cfgEmboss)", opacity: 0.9 });
        t.textContent = state.text.trim().toUpperCase();
        if (state.shape === "quad") t.setAttribute("style", "font-size:11px;letter-spacing:.25em");
        pansG.appendChild(t);
      }

      const colorName = names[state.color] || state.color.toUpperCase();
      $(".cfg-sum").textContent = `${labels.shape[state.shape]} · ${colorName} · ${labels.finish[state.finish]}`;
      const msg = [
        "Olá! Montei um produto no site da Garnet e quero desenvolver 🙂",
        `Formato: ${labels.shape[state.shape]}`,
        `Cor: ${colorName}`,
        `Acabamento: ${labels.finish[state.finish]}`,
        `${labels.case[state.case]}`,
        `Relevo prensado: ${state.text.trim() || "sem relevo"}`,
      ].join("\n");
      $(".cfg-send").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
      if (!reduced) gsap.fromTo(svg, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, .5)" });
    }

    $$(".config__panel [data-opt]").forEach((group) => {
      const key = group.dataset.opt;
      if (key === "text") { group.addEventListener("input", () => { state.text = group.value; render(); }); return; }
      group.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        $$("button, .swatch-custom", group).forEach((b) => b.classList.toggle("on", b === btn));
        state[key] = btn.dataset.v;
        render();
      });
    });
    const custom = $(".swatch-custom input");
    custom.addEventListener("input", () => {
      $$(".swatch-pick button").forEach((b) => b.classList.remove("on"));
      custom.parentElement.classList.add("on");
      state.color = custom.value;
      render();
    });
    render();
  })();

  /* ---------- cases: imagem que segue o cursor + galeria arrastável ---------- */
  (function cases() {
    const data = [
      ["karen-blush", "Paleta de Blush", "Karen Bachini"], ["johnjohn-gold", "Sombra Gold", "John John"],
      ["bocarosa-omg", "#OMG", "Boca Rosa"], ["fran-your-browns", "Your Browns", "Fran"],
      ["karen-sombras", "Paleta de Sombras", "Karen Bachini"], ["johnjohn-purple", "Sombra Purple", "John John"],
      ["bocarosa-bembasiquinha", "#BemBasiquinha", "Boca Rosa"], ["fran-beach-face", "Beach Face", "Fran"],
      ["karen-12-cores", "Paleta 12 Cores", "Karen Bachini"], ["johnjohn-red", "Sombra Red", "John John"],
      ["bocarosa-copacabana", "#Copacabana 2", "Boca Rosa"], ["fran-gritani", "Gritani", "Fran"],
    ];
    const src = (k) => `assets/img/cases/${k}.webp`;
    const track = $(".gallery__track");
    track.innerHTML = data.map(([k, t, b]) => `<figure class="gcard glass" data-tilt data-tilt-max="7"><img src="${src(k)}" alt="${t} — ${b}" loading="lazy" draggable="false" /><figcaption><b>${t}</b><span>${b}</span></figcaption></figure>`).join("");

    // tilt nos cards recém-criados
    if (finePointer && !reduced) {
      $$(".gcard").forEach((el) => {
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
          el.style.setProperty("--mx", nx * 100 + "%"); el.style.setProperty("--my", ny * 100 + "%");
          el.classList.add("is-tilting");
          el.style.transform = `perspective(900px) rotateY(${(nx - 0.5) * 14}deg) rotateX(${(0.5 - ny) * 14}deg)`;
        });
        el.addEventListener("pointerleave", () => { el.classList.remove("is-tilting"); el.style.transform = ""; });
      });
    }

    // arrastar com inércia + deriva lenta
    const gallery = $(".gallery");
    let x = 0, v = 0, dragging = false, startX = 0, startPos = 0, lastX = 0, moved = 0;
    const bounds = () => -(track.scrollWidth - gallery.clientWidth);
    gallery.addEventListener("pointerdown", (e) => {
      dragging = true; moved = 0; startX = lastX = e.clientX; startPos = x;
      gallery.setPointerCapture(e.pointerId);
    });
    gallery.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      v = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(v);
      x = startPos + (e.clientX - startX);
    });
    const end = () => { dragging = false; };
    gallery.addEventListener("pointerup", end);
    gallery.addEventListener("pointercancel", end);
    let dir = -1; // deriva lenta que inverte nas pontas
    gsap.ticker.add(() => {
      if (!dragging) {
        const min = bounds();
        x += v; v *= 0.94;
        if (Math.abs(v) < 0.1 && !reduced) x += dir * 0.35;
        if (x > 0) { x += (0 - x) * 0.15; v = 0; dir = -1; }
        if (x < min) { x += (min - x) * 0.15; v = 0; dir = 1; }
      }
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
    // evita abrir/selecionar ao soltar depois de arrastar
    gallery.addEventListener("click", (e) => { if (moved > 6) e.preventDefault(); }, true);

    // imagem flutuante nos nomes das marcas
    if (!finePointer || reduced) return;
    const box = $(".hoverimg"), img = $("img", box);
    const xTo = gsap.quickTo(box, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(box, "y", { duration: 0.6, ease: "power3" });
    let timer = null;
    $$(".brands li").forEach((li) => {
      const imgs = li.dataset.imgs.split(",");
      li.dataset.cursor = "ver";
      li.addEventListener("mouseenter", () => {
        let k = 0;
        img.src = src(imgs[0]);
        gsap.to(box, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5, ease: "expo.out" });
        clearInterval(timer);
        timer = setInterval(() => { k = (k + 1) % imgs.length; img.src = src(imgs[k]); }, 750);
      });
      li.addEventListener("mouseleave", () => {
        clearInterval(timer);
        gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.4, ease: "power3.in" });
      });
    });
    window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); });
    gallery.dataset.cursor = "arraste";
  })();

  /* ---------- FAQ com abertura suave ---------- */
  $$(".acc details").forEach((d) => {
    const s = $("summary", d), content = $("div", d);
    s.addEventListener("click", (e) => {
      if (reduced) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(content, { height: 0, duration: 0.45, ease: "power3.inOut", onComplete: () => { d.open = false; gsap.set(content, { clearProps: "height" }); } });
      } else {
        d.open = true;
        gsap.from(content, { height: 0, duration: 0.55, ease: "power3.out", clearProps: "height" });
      }
    });
  });

  /* ---------- briefing guiado ---------- */
  (function brief() {
    const form = $(".brief__form");
    const steps = $$(".bstep", form);
    const next = $(".brief__next", form), back = $(".brief__back", form), err = $(".brief__err", form);
    let i = 0;
    $$(".chips", form).forEach((g) => {
      const multi = g.classList.contains("chips--multi");
      g.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        if (multi) b.classList.toggle("on");
        else $$("button", g).forEach((x) => x.classList.toggle("on", x === b));
        err.textContent = "";
      });
    });
    const picked = (name) => $$(`[data-name="${name}"] .on`, form).map((b) => b.textContent);
    const go = (n) => {
      steps.forEach((s, k) => { s.classList.toggle("is-on", k === n); s.classList.toggle("is-past", k < n); });
      i = n;
      $(".brief__progress i", form).style.width = (n + 1) * 25 + "%";
      back.disabled = n === 0;
      next.textContent = n === steps.length - 1 ? "Enviar pelo WhatsApp" : "Continuar";
      err.textContent = "";
    };
    const validators = [
      () => picked("categoria").length || "Escolha pelo menos uma categoria.",
      () => picked("modelo").length || "Escolha um modelo (ou “Ainda não sei”).",
      () => picked("volume").length || "Escolha uma faixa de volume.",
      () => {
        const f = (n) => form.elements[n];
        const checks = [
          [f("nome"), (v) => v.trim().length >= 2],
          [f("empresa"), (v) => v.trim().length >= 2],
          [f("telefone"), (v) => /^[0-9+()\-\s]{8,25}$/.test(v.trim())],
          [f("email"), (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
        ];
        let ok = true;
        checks.forEach(([input, test]) => { const good = test(input.value); input.classList.toggle("err", !good); ok = ok && good; });
        return ok || "Confira os campos destacados.";
      },
    ];
    next.addEventListener("click", () => {
      const r = validators[i]();
      if (r !== true && typeof r === "string") { err.textContent = r; gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,.3)" }); return; }
      if (i < steps.length - 1) return go(i + 1);
      const f = (n) => form.elements[n].value.trim();
      const text = [
        "Olá! Vim pelo site e quero iniciar um projeto 🙂",
        `Nome: ${f("nome")}`, `Empresa/Marca: ${f("empresa")}`, `Telefone: ${f("telefone")}`, `E-mail: ${f("email")}`,
        `Categorias: ${picked("categoria").join(", ")}`, `Modelo: ${picked("modelo").join(", ")}`, `Volume: ${picked("volume").join(", ")}`,
        f("mensagem") ? `Mensagem: ${f("mensagem")}` : "",
      ].filter(Boolean).join("\n");
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    });
    back.addEventListener("click", () => i > 0 && go(i - 1));
  })();

  /* ---------- cursor personalizado + botões magnéticos ---------- */
  if (finePointer && !reduced) {
    body.classList.add("has-cursor");
    const cur = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    window.addEventListener("pointermove", (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      const t = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, summary, .chips button, input, label");
      cur.classList.toggle("is-label", !!t);
      cur.classList.toggle("is-link", !t && !!link);
      if (t) label.textContent = t.dataset.cursor;
    });
    document.addEventListener("pointerleave", () => gsap.to(cur, { opacity: 0, duration: 0.2 }));
    document.addEventListener("pointerenter", () => gsap.to(cur, { opacity: 1, duration: 0.2 }));

    $$(".magnetic").forEach((m) => {
      const mx = gsap.quickTo(m, "x", { duration: 0.6, ease: "elastic.out(1,.4)" });
      const my = gsap.quickTo(m, "y", { duration: 0.6, ease: "elastic.out(1,.4)" });
      m.addEventListener("pointermove", (e) => {
        const r = m.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      m.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }

  /* ---------- menu: seção atual ---------- */
  $$(".header__nav a").forEach((a) => {
    const target = $(a.getAttribute("href"));
    if (!target) return;
    ScrollTrigger.create({ trigger: target, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-current", s.isActive) });
  });

  /* ---------- botão "modo protótipo" ---------- */
  const proto = $(".proto");
  const setProto = (on) => { body.classList.toggle("proto-on", on); proto.setAttribute("aria-pressed", String(on)); store.set("garnet-proto", on ? "1" : "0"); };
  setProto(store.get("garnet-proto") !== "0");
  proto.addEventListener("click", () => setProto(!body.classList.contains("proto-on")));

  $(".year").textContent = new Date().getFullYear();
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
