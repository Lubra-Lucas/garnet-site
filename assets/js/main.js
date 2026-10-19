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
    const body = $(".cfg-body", svg);
    const NS = "http://www.w3.org/2000/svg";
    const state = { format: "round", color: "#c4876a", art: "floral", relief: "high", finish: "matte", case: "gold", text: "SUA MARCA" };

    // embalagens inspiradas nas usadas nos cases (medidas no espaço 400×400, centro em 200,200)
    const grid = (cols, rows, w, h, gx, gy, r) => {
      const out = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++)
        out.push({ t: "r", x: (i - (cols - 1) / 2) * gx, y: (j - (rows - 1) / 2) * gy, w, h, r });
      return out;
    };
    const FORMATS = {
      round: { label: "Compacto redondo", w: 300, h: 300, r: 150, pans: [{ t: "c", x: 0, y: 0, r: 120 }] },
      single: { label: "Unitária quadrada", w: 262, h: 262, r: 30, pans: [{ t: "c", x: 0, y: 0, r: 94 }] },
      trio: { label: "Trio redondo", w: 344, h: 156, r: 30, pans: [-102, 0, 102].map((x) => ({ t: "c", x, y: 0, r: 44 })) },
      quad: { label: "Quarteto", w: 268, h: 268, r: 30, pans: grid(2, 2, 104, 104, 118, 118, 14) },
      six: { label: "Sexteto em linha", w: 350, h: 156, r: 24, pans: grid(6, 1, 44, 108, 52, 0, 8) },
      twelve: { label: "Paleta 12 cores", w: 330, h: 262, r: 24, pans: grid(4, 3, 66, 66, 76, 76, 10) },
      jar: { label: "Pote pó solto", w: 300, h: 300, r: 150, jar: true, pans: [{ t: "c", x: 0, y: 0, r: 116 }] },
    };

    // desenhos no espaço -50..50; "currentColor" recebe a cor de cada camada do relevo
    const initial = () => (state.text.trim()[0] || "G").toUpperCase();
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const ARTS = {
      none: { label: "Liso", draw: () => "" },
      logo: {
        label: "Texto",
        draw: () => {
          const t = esc(state.text.trim().toUpperCase() || "SUA MARCA");
          const fs = Math.min(15, 86 / (t.length * 0.72));
          return `<text x="0" y="1" fill="currentColor" font-family="Montserrat, sans-serif" font-weight="600" font-size="${fs.toFixed(1)}" letter-spacing="${(fs * 0.18).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${t}</text><path d="M-30 ${fs + 3}h60M-30 ${-fs - 3}h60" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`;
        },
      },
      mono: {
        label: "Monograma",
        draw: () => `<circle r="38" fill="none" stroke="currentColor" stroke-width="3"/><circle r="31" fill="none" stroke="currentColor" stroke-width="1.2"/><text y="3" fill="currentColor" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="50" text-anchor="middle" dominant-baseline="middle">${esc(initial())}</text>`,
      },
      floral: {
        label: "Floral",
        draw: () => Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-22" rx="9" ry="19" fill="currentColor" transform="rotate(${i * 45})"/>`).join("") + `<circle r="9" fill="currentColor"/>`,
      },
      arabesque: {
        label: "Arabesco",
        draw: () => {
          const half = `<path d="M0 -40 C 16 -34 20 -18 8 -12 C -2 -7 4 6 16 4 C 28 2 32 -12 22 -18 M8 -12 C 22 -4 30 14 18 26 C 10 34 2 30 0 40" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>`;
          return half + `<g transform="scale(-1 1)">${half}</g><path d="M0 -10 L7 0 L0 10 L-7 0Z" fill="currentColor"/>`;
        },
      },
      geo: {
        label: "Geométrico",
        draw: () => {
          let d = "";
          for (let k = -84; k <= 84; k += 14) d += `M${k - 60} -60 L${k + 60} 60 M${k + 60} -60 L${k - 60} 60 `;
          return `<path d="${d}" stroke="currentColor" stroke-width="2.6" fill="none"/>`;
        },
      },
      rays: {
        label: "Raios",
        draw: () => Array.from({ length: 28 }, (_, i) => `<path d="M0 -14 L0 -48" stroke="currentColor" stroke-width="${i % 2 ? 1.8 : 3.4}" stroke-linecap="round" transform="rotate(${(i * 360) / 28})"/>`).join("") + `<circle r="9" fill="currentColor"/>`,
      },
      heart: { label: "Coração", draw: () => `<path d="M0 34 C -46 6 -40 -34 -14 -34 C -4 -34 0 -24 0 -20 C 0 -24 4 -34 14 -34 C 40 -34 46 6 0 34Z" fill="currentColor"/>` },
      waves: {
        label: "Ondas",
        draw: () => [-36, -18, 0, 18, 36].map((y) => `<path d="M-60 ${y} q 10 -9 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>`).join(""),
      },
      leaf: {
        label: "Folhas",
        draw: () => {
          const leaf = (rot) => `<g transform="rotate(${rot})"><path d="M0 4 C 14 -8 14 -30 0 -44 C -14 -30 -14 -8 0 4Z" fill="currentColor"/></g>`;
          return leaf(-38) + leaf(0) + leaf(38) + `<path d="M0 6 L0 30" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
        },
      },
    };

    const CASES = {
      gold: ["#ecd4a0", "#a87e46", "Dourada"], black: ["#4a4541", "#0e0d0c", "Preta"], rose: ["#f1cfc2", "#b98270", "Rosé"],
      lilac: ["#e3d8f0", "#a28fc4", "Lilás"], white: ["#ffffff", "#d8d2c8", "Branca"], clear: ["rgba(255,255,255,.75)", "rgba(205,210,222,.5)", "Acrílico"],
    };
    const FINISH = { matte: "Matte", satin: "Acetinado", shimmer: "Cintilante", metal: "Metálico" };
    const names = { "#c4876a": "Nude", "#d75c78": "Rosa", "#e9a07f": "Pêssego", "#8a4526": "Bronze", "#d2a65e": "Dourado", "#651c2e": "Vinho", "#7b5ea7": "Lavanda" };

    const shade = (hex, amt) => {
      const n = parseInt(hex.slice(1), 16);
      const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * (amt > 0 ? 255 - v : v))));
      return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
    };
    // tons da paleta: do mais claro ao mais escuro a partir da cor base
    const tones = (n) => n === 1 ? [state.color] : Array.from({ length: n }, (_, i) => shade(state.color, 0.5 - (0.9 * i) / (n - 1)));

    const shapeSvg = (p, extra = "") => p.t === "c"
      ? `<circle cx="${200 + p.x}" cy="${200 + p.y}" r="${p.r}" ${extra}/>`
      : `<rect x="${200 + p.x - p.w / 2}" y="${200 + p.y - p.h / 2}" width="${p.w}" height="${p.h}" rx="${p.r}" ${extra}/>`;
    const box = (p) => p.t === "c" ? [200 + p.x - p.r, 200 + p.y - p.r, p.r * 2, p.r * 2] : [200 + p.x - p.w / 2, 200 + p.y - p.h / 2, p.w, p.h];

    function finishLayer(b) {
      const [x, y, w, h] = b;
      if (state.finish === "satin") return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cfgShine)" opacity=".6"/>`;
      if (state.finish === "shimmer") return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cfgSparkle)" opacity=".85"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cfgShine)" opacity=".5"/>`;
      if (state.finish === "metal") return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cfgMetal)"/>`;
      return "";
    }

    // relevo: o desenho é desenhado 3 vezes (sombra, luz e cor), deslocado pela luz vinda do alto à esquerda
    function reliefLayer(p, c) {
      const art = ARTS[state.art];
      const fmt = FORMATS[state.format];
      if (!art || state.art === "none" || fmt.jar) return "";
      const size = p.t === "c" ? p.r * 2 : Math.min(p.w, p.h);
      const s = (size / 100) * (p.t === "c" ? 0.78 : 0.84);
      const cx = 200 + p.x, cy = 200 + p.y;
      const d = Math.max(0.7, size / 90); // altura do relevo
      const up = state.relief === "high" ? 1 : -1;
      const inner = art.draw();
      const layer = (dx, dy, col, op) => `<g transform="translate(${cx + dx} ${cy + dy}) scale(${s.toFixed(3)})" color="${col}" opacity="${op}">${inner}</g>`;
      return layer(d * up, d * up, shade(c, -0.42), 0.75) + layer(-d * up, -d * up, shade(c, 0.45), 0.8) + layer(0, 0, c, 1);
    }

    function render() {
      const fmt = FORMATS[state.format];
      const [a, b] = CASES[state.case];
      $(".cfg-case-a", svg).setAttribute("stop-color", a);
      $(".cfg-case-b", svg).setAttribute("stop-color", b);
      const cx = 200 - fmt.w / 2, cy = 200 - fmt.h / 2;
      const caseRect = (extra) => `<rect x="${cx}" y="${cy}" width="${fmt.w}" height="${fmt.h}" rx="${fmt.r}" ${extra}/>`;
      const cols = tones(fmt.pans.length);
      let html = `<linearGradient id="cfgMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset=".7" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
      html += `<rect x="${cx + 6}" y="${cy + 22}" width="${fmt.w}" height="${fmt.h}" rx="${fmt.r}" fill="rgba(60,40,20,.22)" style="filter:blur(16px)"/>`;
      html += caseRect(`fill="url(#cfgCase)" ${state.case === "clear" || state.case === "white" ? 'stroke="rgba(150,140,130,.45)"' : ""}`);
      html += `<rect x="${cx + 10}" y="${cy + 10}" width="${fmt.w - 20}" height="${fmt.h - 20}" rx="${Math.max(0, fmt.r - 10)}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"/>`;

      fmt.pans.forEach((p, i) => {
        const c = cols[i], id = `cfgPan${i}`, bb = box(p);
        html += `<clipPath id="${id}">${shapeSvg(p)}</clipPath>`;
        html += shapeSvg(p, `fill="${shade(c, -0.25)}" stroke="rgba(0,0,0,.18)" stroke-width="3"`); // godê
        html += `<g clip-path="url(#${id})">${shapeSvg(p, `fill="${c}"`)}${reliefLayer(p, c)}${finishLayer(bb)}<rect x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}" fill="url(#cfgPanShade)"/></g>`;
        if (fmt.jar) {
          // peneira do pote: disco translúcido com furos
          let holes = "";
          [[0, 1], [22, 8], [44, 14], [66, 20]].forEach(([r, n]) => {
            for (let k = 0; k < n; k++) { const t = (k / n) * Math.PI * 2; holes += `<circle cx="${200 + Math.cos(t) * r}" cy="${200 + Math.sin(t) * r}" r="3.2" fill="${shade(c, -0.35)}"/>`; }
          });
          html += `<circle cx="200" cy="200" r="${p.r}" fill="rgba(255,255,255,.32)" stroke="rgba(255,255,255,.7)" stroke-width="2"/>${holes}`;
        }
      });
      html += caseRect(`fill="url(#cfgShine)" opacity=".7" pointer-events="none"`);
      body.innerHTML = html;

      const jar = !!fmt.jar;
      $(".cfg-note").hidden = !jar;
      $$('[data-opt="relief"] button, [data-opt="art"] button').forEach((b) => (b.disabled = jar));
      $(".cfg-text-set").hidden = !(state.art === "logo" || state.art === "mono") || jar;

      const colorName = names[state.color] || state.color.toUpperCase();
      const artName = jar ? "sem relevo (pó solto)" : `${ARTS[state.art].label}${state.art === "none" ? "" : " · " + (state.relief === "high" ? "alto relevo" : "baixo relevo")}`;
      $(".cfg-sum").textContent = `${fmt.label} · ${colorName} · ${jar ? "pó solto" : ARTS[state.art].label}`;
      const msg = [
        "Olá! Montei um produto no site da Garnet e quero desenvolver 🙂",
        `Embalagem: ${fmt.label} (${CASES[state.case][2]})`,
        `Cor base: ${colorName}${fmt.pans.length > 1 ? ` (paleta com ${fmt.pans.length} tons)` : ""}`,
        `Acabamento: ${FINISH[state.finish]}`,
        `Desenho prensado: ${artName}`,
        !jar && (state.art === "logo" || state.art === "mono") ? `Texto do relevo: ${state.text.trim() || "—"}` : "",
      ].filter(Boolean).join("\n");
      $(".cfg-send").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
      if (!reduced) gsap.fromTo(svg, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, .5)", overwrite: true });
    }

    // chips com miniaturas desenhadas a partir das mesmas definições
    const formatIcon = (f) => {
      const k = 30 / 360;
      const pans = f.pans.map((p) => p.t === "c"
        ? `<circle cx="${20 + p.x * k}" cy="${20 + p.y * k}" r="${Math.max(1.4, p.r * k)}"/>`
        : `<rect x="${20 + (p.x - p.w / 2) * k}" y="${20 + (p.y - p.h / 2) * k}" width="${p.w * k}" height="${p.h * k}" rx="${p.r * k}"/>`).join("");
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="${20 - (f.w * k) / 2}" y="${20 - (f.h * k) / 2}" width="${f.w * k}" height="${f.h * k}" rx="${f.r * k}" fill="none" stroke="currentColor" stroke-width="1.4"/><g fill="currentColor" opacity=".55">${pans}</g></svg>`;
    };
    const artIcon = (key) => `<svg viewBox="-55 -55 110 110" aria-hidden="true"><circle r="52" fill="none" stroke="currentColor" stroke-width="4" opacity=".35"/><g color="currentColor">${ARTS[key].draw()}</g></svg>`;
    $('[data-opt="format"]').innerHTML = Object.entries(FORMATS).map(([k, f]) => `<button type="button" data-v="${k}"${k === state.format ? ' class="on"' : ""}>${formatIcon(f)}<span>${f.label}</span></button>`).join("");
    const drawArtChips = () => {
      $('[data-opt="art"]').innerHTML = Object.keys(ARTS).map((k) => `<button type="button" data-v="${k}"${k === state.art ? ' class="on"' : ""}>${k === "none" ? '<svg viewBox="-55 -55 110 110" aria-hidden="true"><circle r="52" fill="none" stroke="currentColor" stroke-width="4" opacity=".35"/></svg>' : artIcon(k)}<span>${ARTS[k].label}</span></button>`).join("");
    };
    drawArtChips();

    $$(".config__panel [data-opt]").forEach((group) => {
      const key = group.dataset.opt;
      if (key === "text") {
        group.addEventListener("input", () => { state.text = group.value; render(); drawArtChips(); });
        return;
      }
      group.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || btn.disabled) return;
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
      if (e.button !== 0) return; // só o botão principal arrasta
      dragging = true; moved = 0; startX = lastX = e.clientX; startPos = x;
      gallery.setPointerCapture(e.pointerId);
    });
    const end = () => { dragging = false; };
    gallery.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      // o navegador às vezes perde o "soltar" do mouse; sem botão pressionado, o arraste termina
      if (e.pointerType === "mouse" && e.buttons === 0) return end();
      v = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(v);
      x = startPos + (e.clientX - startX);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => gallery.addEventListener(t, end));
    window.addEventListener("blur", end);
    gallery.addEventListener("dragstart", (e) => e.preventDefault());
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
    // a imagem aparece só enquanto o ponteiro está de fato sobre um nome de marca.
    // A checagem usa elementFromPoint também no scroll: rolando com a roda o mouse
    // "sai" do nome sem disparar mouseleave, e a imagem ficava grudada no cursor.
    let timer = null, active = null, px = -1, py = -1;
    const show = (li) => {
      const imgs = li.dataset.imgs.split(",");
      let k = 0;
      img.src = src(imgs[0]);
      gsap.to(box, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5, ease: "expo.out", overwrite: "auto" });
      clearInterval(timer);
      timer = setInterval(() => { k = (k + 1) % imgs.length; img.src = src(imgs[k]); }, 750);
    };
    const hide = () => {
      clearInterval(timer);
      gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.35, ease: "power3.in", overwrite: "auto" });
    };
    const check = () => {
      const el = px < 0 ? null : document.elementFromPoint(px, py);
      const li = el ? el.closest(".brands li") : null;
      if (li === active) return;
      active = li;
      if (li) show(li); else hide();
    };
    $$(".brands li").forEach((li) => { li.dataset.cursor = "ver"; });
    window.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; xTo(px); yTo(py); check(); }, { passive: true });
    window.addEventListener("scroll", check, { passive: true });
    document.addEventListener("pointerleave", () => { px = -1; check(); });
    window.addEventListener("blur", () => { px = -1; check(); });
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
      next.textContent = n === steps.length - 1 ? "Revisar e enviar" : "Continuar";
      send.hidden = true;
      next.hidden = false;
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
      // link real (e não window.open) para funcionar em qualquer navegador e app
      send.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
      send.hidden = false;
      next.hidden = true;
      err.textContent = "";
    });
    const send = document.createElement("a");
    send.className = "btn btn--gold magnetic brief__send";
    send.target = "_blank";
    send.rel = "noopener";
    send.textContent = "Abrir conversa no WhatsApp";
    send.hidden = true;
    next.after(send);
    form.addEventListener("input", () => { if (!send.hidden) { send.hidden = true; next.hidden = false; } });
    back.addEventListener("click", () => i > 0 && go(i - 1));
  })();

  /* ---------- cursor personalizado + botões magnéticos ---------- */
  if (finePointer && !reduced) {
    body.classList.add("has-cursor");
    const cur = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    let cx = -1, cy = -1;
    // estado do cursor pelo elemento sob o ponteiro; refeito também no scroll,
    // senão o rótulo ("ver", "arraste") fica preso ao rolar sem mexer o mouse
    const updateCursor = () => {
      const el = cx < 0 ? null : document.elementFromPoint(cx, cy);
      const t = el && el.closest("[data-cursor]");
      const link = el && el.closest("a, button, summary, .chips button, input, label");
      cur.classList.toggle("is-label", !!t);
      cur.classList.toggle("is-link", !t && !!link);
      if (t) label.textContent = t.dataset.cursor;
    };
    window.addEventListener("pointermove", (e) => {
      cx = e.clientX; cy = e.clientY;
      dx(cx); dy(cy); rx(cx); ry(cy);
      updateCursor();
    }, { passive: true });
    window.addEventListener("scroll", updateCursor, { passive: true });
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
