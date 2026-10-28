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

  // celular ou "economizar dados": metade dos frames (pula 1 a cada 2); o frame mais próximo cobre o buraco
  const lite = window.matchMedia("(max-width: 760px)").matches || !!(navigator.connection && navigator.connection.saveData);
  const STEP = lite ? 2 : 1;
  const isLoaded = (k) => !!(images[k] && images[k].complete && images[k].naturalWidth);

  function drawFrame(i) {
    i = Math.max(0, Math.min(SEQ.frames - 1, Math.round(i)));
    // usa o frame exato; se ainda não chegou, o carregado mais próximo (sem buracos nem piscadas)
    let k = -1;
    for (let d = 0; d < SEQ.frames; d++) {
      if (i - d >= 0 && isLoaded(i - d)) { k = i - d; break; }
      if (i + d < SEQ.frames && isLoaded(i + d)) { k = i + d; break; }
    }
    if (k < 0 || k === current) return;
    const img = images[k];
    current = k;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  function loadFrames(onProgress, onFirst) {
    const KEY = (i) => i % 10 === 0 || i === SEQ.frames - 1;
    const REDUCED_FRAME = Math.round(SEQ.frames * 0.45); // quadro estático do reduced-motion
    // quais frames existem neste aparelho
    const all = [];
    for (let i = 0; i < SEQ.frames; i++) if (i % STEP === 0 || i === SEQ.frames - 1) all.push(i);
    // 1ª fase (imediata): abertura (primeiros quadros) + quadros-chave de 10 em 10
    // reduced-motion: só o frame 0 e o quadro estático, o resto nem é baixado
    const first = reduced ? [0, REDUCED_FRAME] : all.filter((i) => i < 12 || KEY(i));
    const rest = reduced ? [] : all.filter((i) => !first.includes(i));
    const total = first.length + rest.length;
    return new Promise((resolve) => {
      let done = 0, active = 0, nextFirst = 0, idleStarted = false;
      const settle = (i) => {
        done++; active--;
        onProgress(done / total);
        if (i === 0) onFirst();
        if (done === total) resolve(); else pump();
      };
      const fetchFrame = (i) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = () => settle(i);
        active++;
        img.src = SEQ.path(i);
        images[i] = img;
      };
      // 2ª fase: o resto, 3 por vez, começando pelos mais próximos de onde o scroll está indo
      const takeRest = () => {
        const f = seq.f;
        let best = -1, bestCost = Infinity;
        rest.forEach((i, n) => { const c = i >= f ? i - f : (f - i) * 3; if (c < bestCost) { bestCost = c; best = n; } });
        return best < 0 ? null : rest.splice(best, 1)[0];
      };
      function pump() {
        if (nextFirst < first.length) { if (active < 6) fetchFrame(first[nextFirst++]); else return; pump(); return; }
        if (!idleStarted) return;
        while (active < 3 && rest.length) fetchFrame(takeRest());
      }
      // libera a 2ª fase quando a página terminou de carregar e o navegador está ocioso (ou ao primeiro scroll)
      const startIdle = () => {
        if (idleStarted) return;
        idleStarted = true;
        window.removeEventListener("scroll", startIdle);
        pump();
      };
      const whenIdle = () => (window.requestIdleCallback ? requestIdleCallback(startIdle, { timeout: 2500 }) : setTimeout(startIdle, 1200));
      if (document.readyState === "complete") whenIdle(); else window.addEventListener("load", whenIdle, { once: true });
      window.addEventListener("scroll", startIdle, { passive: true, once: true });
      pump();
    });
  }

  /* ---------- entrada (sem tela de espera) ---------- */
  // o texto da abertura aparece na hora; o estojo entra assim que o frame 0 chega
  // e os outros frames continuam carregando em segundo plano
  let started = false;
  function start() {
    if (started) return;
    started = true;
    sizeCanvas();
    drawFrame(0);
    if (reduced) return;
    // anima a escala pelo objeto pos (e não pelo transform do canvas, que é controlado pelo scroll)
    gsap.fromTo(pos, { s: 0.86 }, { s: 1, duration: 1.3, ease: "expo.out" });
    gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" });
  }
  const framesReady = loadFrames(() => {}, start);
  sizeCanvas();
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());

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
  $$('a[href^="#"]:not(.skip)').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id === "#topo" ? document.body : $(id);
      if (!el) return;
      e.preventDefault();
      // fecha o menu sem roubar o foco: o clique já levou o usuário à seção
      closeMenu(false);
      // o header que se escondia ao rolar volta a aparecer depois de navegar pelo menu
      header.classList.remove("is-hidden");
      keepHeader = true;
      scrollTo(id === "#topo" ? 0 : el);
    });
  });

  /* ---------- header ---------- */
  const header = $(".header");
  let lastY = 0;
  // depois de clicar numa âncora, o header fica visível até o usuário rolar para baixo por conta própria
  let keepHeader = false, keepTimer = 0;
  const onScrollHeader = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    if (keepHeader) {
      header.classList.remove("is-hidden");
      clearTimeout(keepTimer);
      keepTimer = setTimeout(() => { keepHeader = false; }, 250);
    } else {
      header.classList.toggle("is-hidden", y > 400 && y > lastY && !body.classList.contains("menu-open"));
    }
    lastY = y;
  };
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  const burger = $(".header__burger");
  const mnav = $(".mnav");
  // menu fechado fica inert (fora da ordem de Tab e do leitor de tela)
  function closeMenu(restoreFocus = true) {
    const wasOpen = body.classList.contains("menu-open");
    body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
    mnav.setAttribute("aria-hidden", "true");
    mnav.inert = true;
    if (lenis) lenis.start();
    if (wasOpen && restoreFocus) burger.focus();
  }
  function openMenu() {
    body.classList.add("menu-open");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Fechar menu");
    mnav.setAttribute("aria-hidden", "false");
    mnav.inert = false;
    if (lenis) lenis.stop();
    const first = $("a", mnav);
    if (first) first.focus({ preventScroll: true });
  }
  burger.addEventListener("click", () => {
    if (body.classList.contains("menu-open")) closeMenu(); else openMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (!body.classList.contains("menu-open")) return;
    if (e.key === "Escape") return closeMenu();
    if (e.key !== "Tab") return;
    // Tab preso entre o botão (fica no header) e os links do menu
    const items = [...$$("a", mnav), burger];
    const i = items.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
    e.preventDefault();
    items[next].focus();
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
      // abertura encurtada: 3 capítulos depois da capa (antes eram 4, em quase o dobro de rolagem)
      tl.fromTo(pos, { x: side(0.2), s: 1, y: 0 }, { x: side(-0.2), duration: 0.08, ease: "power2.inOut" }, 0.08)
        .to(pos, { x: side(0.2), duration: 0.06, ease: "power2.inOut" }, 0.31)
        .to(pos, { x: 0, y: () => (desktop ? -H() * 0.13 : -H() * 0.04), s: desktop ? 0.72 : 0.9, duration: 0.07, ease: "power2.inOut" }, 0.68);

      const show = (el, at, dur = 0.05) => tl.fromTo(el, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: dur, ease: "power2.out" }, at);
      const hide = (el, at, dur = 0.05) => tl.fromTo(el, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -50, duration: dur, ease: "power2.in", immediateRender: false }, at);
      hide(chapters[0], 0.05, 0.06);
      hide($(".trustbar"), 0.05, 0.06); // faixa de marcas sai junto com a abertura
      show(chapters[1], 0.15); hide(chapters[1], 0.27, 0.04);
      // capítulo da cor coincide com a troca de cor do pó (36%–66% dos frames)
      show(chapters[2], 0.37); hide(chapters[2], 0.63, 0.04);
      show(chapters[3], 0.76);

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
    // poeira só em telas com mouse: no celular economiza processamento contínuo
    if (reduced || !finePointer) { c.remove(); return; }
    const g = c.getContext("2d");
    let w = 0, h = 0, parts = [], running = true;
    // celular/janela estreita (o CSS esconde o canvas) e aba em segundo plano: o laço não desenha
    const narrow = window.matchMedia("(max-width: 760px)");
    const active = () => running && !document.hidden && !narrow.matches;
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
      if (!active()) return;
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
    // cópias só para o laço: fora da leitura de tela e da ordem de Tab
    for (let i = 0; i < 3; i++) {
      const copy = row.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      $$("a, button", copy).forEach((el) => el.setAttribute("tabindex", "-1"));
      track.appendChild(copy);
    }
    let x = 0, boost = 0, onScreen = true;
    // fora da tela não precisa recalcular a faixa a cada quadro
    if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; }).observe($(".marquee"));
    gsap.ticker.add(() => {
      if (!onScreen) return;
      const v = lenis ? lenis.velocity : 0;
      // limita o empurrão: um salto grande (link do menu) jogava a faixa para fora da tela
      boost += (Math.min(Math.abs(v) * 0.35, 40) - boost) * 0.1;
      x -= (reduced ? 0 : 0.6) + boost;
      const wRow = row.offsetWidth;
      if (wRow) x %= wRow;
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
    // no celular os modelos são um carrossel: entram juntos, sem cada card subir em separado
    const modelsSwipe = window.matchMedia("(max-width: 760px)").matches;
    gsap.from(".model", { y: modelsSwipe ? 0 : 70, opacity: 0, duration: 1.1, ease: "expo.out", stagger: modelsSwipe ? 0 : 0.08, scrollTrigger: { trigger: ".models__grid", start: "top 80%", once: true } });
    if ($(".quotes__grid")) gsap.from(".quote", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".quotes__grid", start: "top 80%", once: true } });
    gsap.from(".footer__word", { yPercent: 40, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 70%", once: true } });
  }
  const fmt = new Intl.NumberFormat("pt-BR");
  // números da indústria: cada card conta em sequência, com uma linha dourada que enche junto;
  // a animação recomeça sempre que a seção volta a aparecer na tela
  // cards dos números: no celular viram com um toque; no teclado, com Enter ou Espaço
  $$(".stats .stat").forEach((card) => {
    card.addEventListener("click", () => { if (!finePointer) card.classList.toggle("is-flipped"); });
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("is-flipped"); } });
  });

  (function counters() {
    const cards = $$(".stats .stat");
    const items = cards.map((card) => {
      const el = $("b", card);
      const bar = document.createElement("i");
      bar.className = "stat__bar";
      bar.setAttribute("aria-hidden", "true");
      $(".stat__front", card).appendChild(bar);
      if (!el.hasAttribute("data-count")) return { card, el, bar, seal: true };
      const end = Number(el.dataset.count), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
      const plain = el.hasAttribute("data-plain");
      const from = plain ? end - 7 : Math.round(end * 0.85); // parte de ~85% do valor (o ano, de 1985): nunca mostra "+0" nem 1950
      const unit = suf ? `<small>${suf.trim()}</small>` : ""; // unidade menor, ao lado do número
      const render = (v) => { el.innerHTML = pre + (plain ? Math.round(v) : fmt.format(Math.round(v))) + unit; };
      return { card, el, bar, end, from, render, o: { v: from } };
    });
    // cor acompanha o crescimento: do preto do texto ao dourado escuro no valor final
    const css = getComputedStyle(document.documentElement);
    const tint = gsap.utils.interpolate(css.getPropertyValue("--ink").trim(), css.getPropertyValue("--gold-deep").trim());
    const paint = (it, p) => { it.el.style.color = tint(Math.max(0, Math.min(1, p))); };
    const finish = () => items.forEach((it) => { if (it.render) it.render(it.end); paint(it, 1); gsap.set(it.bar, { scaleX: 1 }); });
    if (reduced || !items.length) return finish();

    let tl = null;
    const play = () => {
      if (tl) tl.kill();
      tl = gsap.timeline();
      items.forEach((it, i) => {
        const at = i * 0.16;
        tl.fromTo(it.bar, { scaleX: 0 }, { scaleX: 1, duration: 2.4, ease: "power2.out" }, at);
        if (it.seal) {
          paint(it, 1);
          tl.fromTo(it.el, { scale: 1.6, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "back.out(2.2)" }, at + 1.2);
        } else {
          it.o.v = it.from; it.render(it.from); paint(it, 0);
          tl.to(it.o, { v: it.end, duration: 2.4, ease: "power2.out", onUpdate: () => { it.render(it.o.v); paint(it, (it.o.v - it.from) / (it.end - it.from)); } }, at);
        }
      });
    };
    items.forEach((it) => { if (it.render) { it.render(it.from); paint(it, 0); } gsap.set(it.bar, { scaleX: 0 }); });
    ScrollTrigger.create({ trigger: ".stats", start: "top 68%", end: "bottom 20%", onEnter: play, onEnterBack: play });
  })();

  /* ---------- manifesto palavra por palavra ---------- */
  (function manifesto() {
    const p = $("[data-words]");
    const gold = ["ideias", "indústria", "cria."];
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w${gold.includes(w) ? " gold" : ""}">${w}</span>`).join(" ");
    if (reduced) return;
    gsap.to($$(".w", p), { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: p, start: "top 78%", end: "bottom 45%", scrub: true } });
  })();

  /* ---------- "o que fabricamos": scroll horizontal fixado (desktop) ou carrossel de deslizar (celular) ---------- */
  if (!reduced) {
    const pin = $(".hscroll__pin"), track = $(".hscroll__track"), section = $(".hscroll"), bar = $(".hscroll__bar i");
    const cats = $$(".cat", track);
    // fundo da seção acompanha a categoria mais perto do centro da tela
    const tintByCenter = () => {
      const mid = window.innerWidth / 2;
      let best = null, bd = Infinity;
      cats.forEach((c) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bd) { bd = d; best = c; }
      });
      const bg = best && best.style.getPropertyValue("--bg");
      if (bg) section.style.background = bg;
    };
    gsap.matchMedia().add({ desktop: "(min-width: 761px)", mobile: "(max-width: 760px)" }, (c) => {
      if (c.conditions.mobile) {
        // celular: o próprio dedo move as categorias, sem fixar a página (menos rolagem)
        const onSwipe = () => {
          const max = track.scrollWidth - track.clientWidth;
          bar.style.setProperty("--p", max > 0 ? track.scrollLeft / max : 0);
          tintByCenter();
        };
        track.addEventListener("scroll", onSwipe, { passive: true });
        onSwipe();
        return () => { track.removeEventListener("scroll", onSwipe); section.style.background = ""; };
      }
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
            bar.style.setProperty("--p", self.progress);
            tintByCenter();
          },
          onLeaveBack: () => { section.style.background = ""; },
        },
      });
      return () => { section.style.background = ""; };
    });
    gsap.set(section, { transition: "background-color .8s" });
    // Perfumaria mostra o perfume e o perfume capilar, trocando devagar (só opacidade)
    $$(".cat__img--duo .cat__alt").forEach((alt) => {
      gsap.timeline({ repeat: -1, repeatDelay: 2.6, delay: 2.6, yoyo: true }).to(alt, { opacity: 1, duration: 1.2, ease: "power2.inOut" });
    });
    gsap.from(".hscroll__intro > *", { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: section, start: "top 70%", once: true } });
  }


  /* ---------- processo: linha dourada e etapas ---------- */
  (function process() {
    const steps = $$(".steps li");
    const counter = $(".process__counter b");
    // no celular as etapas viram carrossel e já aparecem todas acesas
    if (reduced || window.matchMedia("(max-width: 760px)").matches) { steps.forEach((s) => s.classList.add("on")); return; }
    gsap.to(".steps__line line", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 60%", end: "bottom 60%", scrub: true } });
    steps.forEach((li, i) => {
      ScrollTrigger.create({
        trigger: li, start: "top 62%",
        onEnter: () => { li.classList.add("on"); counter.textContent = String(i + 1).padStart(2, "0"); },
        onLeaveBack: () => { li.classList.remove("on"); counter.textContent = String(Math.max(1, i)).padStart(2, "0"); },
      });
    });
  })();

  /* ---------- botão fixo "Inicie seu projeto" (celular) ---------- */
  // aparece depois da abertura e some quando o briefing já está na tela
  (function mobileCta() {
    const toggle = () => {
      const past = window.scrollY > window.innerHeight * 0.9;
      const contact = $("#contato").getBoundingClientRect().top < window.innerHeight * 0.85;
      // o atalho some também sobre o simulador; o WhatsApp só aparece depois da abertura e some no briefing
      const cfg = $("#personalize").getBoundingClientRect();
      const onCfg = cfg.top < window.innerHeight * 0.85 && cfg.bottom > window.innerHeight * 0.15;
      body.classList.toggle("show-mcta", past && !contact && !onCfg);
      body.classList.toggle("show-wa", past && !contact);
    };
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
  })();

  /* ---------- configurador ---------- */
  (function configurator() {
    const svg = $(".cfg");
    const body = $(".cfg-body", svg);
    const NS = "http://www.w3.org/2000/svg";
    const INITIAL = { format: "round", color: "#c4876a", art: "floral", relief: "high", finish: "matte", case: "gold", text: "SUA MARCA" };
    const state = { ...INITIAL };

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
    };

    // desenhos no espaço -50..50; "currentColor" recebe a cor de cada camada do relevo
    const initial = () => (state.text.trim()[0] || "G").toUpperCase();
    // texto efetivo do relevo: o mesmo que a prévia mostra (vazio cai no padrão)
    const reliefText = () => state.art === "mono" ? initial() : (state.text.trim().toUpperCase() || "SUA MARCA");
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const ARTS = {
      none: { label: "Liso", draw: () => "" },
      logo: {
        label: "Texto",
        draw: () => {
          const raw = reliefText(); // tamanho da fonte pelo texto cru (esc() aumenta o comprimento)
          const t = esc(raw);
          const fs = Math.min(15, 86 / (raw.length * 0.72));
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
      if (!art || state.art === "none") return "";
      const size = p.t === "c" ? p.r * 2 : Math.min(p.w, p.h);
      const s = (size / 100) * (p.t === "c" ? 0.78 : 0.84);
      const cx = 200 + p.x, cy = 200 + p.y;
      const d = Math.max(0.7, size / 90); // altura do relevo
      const up = state.relief === "high" ? 1 : -1;
      const inner = art.draw();
      const layer = (dx, dy, col, op) => `<g transform="translate(${cx + dx} ${cy + dy}) scale(${s.toFixed(3)})" color="${col}" opacity="${op}">${inner}</g>`;
      return layer(d * up, d * up, shade(c, -0.42), 0.75) + layer(-d * up, -d * up, shade(c, 0.45), 0.8) + layer(0, 0, c, 1);
    }

    function render(animate = true) {
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
      });
      html += caseRect(`fill="url(#cfgShine)" opacity=".7" pointer-events="none"`);
      body.innerHTML = html;

      const hasText = state.art === "logo" || state.art === "mono";
      $(".cfg-text-set").hidden = !hasText;
      $(".cfg-relief-set").hidden = state.art === "none"; // "Liso" não tem relevo
      const textLabel = state.art === "mono" ? "Inicial do monograma (usamos a 1ª letra)" : "Texto do relevo";
      $(".cfg-text-legend").textContent = textLabel;
      $('[data-opt="text"]').setAttribute("aria-label", textLabel);

      const colorName = names[state.color] || state.color.toUpperCase();
      const artName = `${ARTS[state.art].label}${state.art === "none" ? "" : " · " + (state.relief === "high" ? "alto relevo" : "baixo relevo")}`;
      // resumo curto (2 linhas) com as 5 escolhas principais; também vira o aria-label da prévia
      const line1 = `${fmt.label} · embalagem ${CASES[state.case][2].toLowerCase()}`;
      const line2 = `${colorName} · ${artName.toLowerCase()} · ${FINISH[state.finish].toLowerCase()}`;
      const sum = $(".cfg-sum");
      sum.innerHTML = `<span>${esc(line1)}</span><span>${esc(line2)}</span>`;
      svg.setAttribute("aria-label", `Prévia do produto configurado: ${line1}; ${line2}`);
      sync();
      const msg = [
        "Olá! Fiz uma simulação no site da Garnet e quero desenvolver a minha make 🙂",
        `Embalagem: ${fmt.label} (${CASES[state.case][2]})`,
        `Cor base: ${colorName}${fmt.pans.length > 1 ? ` (paleta com ${fmt.pans.length} tons)` : ""}`,
        `Acabamento: ${FINISH[state.finish]}`,
        `Desenho prensado: ${artName}`,
        hasText ? `${textLabel}: ${reliefText()}` : "",
      ].filter(Boolean).join("\n");
      $(".cfg-send").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
      $(".cfg-mail").href = `mailto:contato@garnetcosmeticos.com.br?subject=${encodeURIComponent("Simulação Monte a sua make")}&body=${encodeURIComponent(msg)}`;
      if (animate && !reduced) gsap.fromTo(svg, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, .5)", overwrite: true });
    }

    // sincroniza .on e aria-pressed de todos os botões de escolha (inclusive os criados dinamicamente)
    function sync() {
      $$(".config__panel [data-opt]").forEach((group) => {
        const key = group.dataset.opt;
        if (key === "text") return;
        let hit = false;
        $$("button", group).forEach((b) => {
          const on = b.dataset.v === state[key];
          hit = hit || on;
          b.classList.toggle("on", on);
          b.setAttribute("aria-pressed", on);
        });
        if (key === "color") {
          const cu = $(".swatch-custom");
          cu.classList.toggle("on", !hit);
          $("input", cu).setAttribute("aria-label", hit ? "Cor personalizada" : "Cor personalizada (selecionada)");
        }
      });
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
        // ao digitar: sem reanimar a prévia a cada tecla
        group.addEventListener("input", () => { state.text = group.value; drawArtChips(); render(false); });
        return;
      }
      group.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || btn.disabled) return;
        state[key] = btn.dataset.v;
        render();
      });
    });
    const custom = $(".swatch-custom input");
    custom.addEventListener("input", () => {
      state.color = custom.value;
      render();
    });
    // recomeçar: volta ao estado inicial
    $(".cfg-reset").addEventListener("click", () => {
      Object.assign(state, INITIAL);
      $('[data-opt="text"]').value = INITIAL.text;
      custom.value = "#b06f8a";
      drawArtChips();
      render();
    });
    render();
  })();

  /* ---------- cases: vitrine infinita + índice de marcas + foto completa ---------- */
  (function vitrine() {
    const data = window.GARNET_VITRINE;
    if (!data) return;
    const brandOf = Object.fromEntries(data.brands.map((b) => [b.id, b]));
    const tile = (s) => `assets/img/vitrine/${s}.webp`;
    const full = (s) => `assets/img/vitrine/full/${s}.webp`;
    let current = "all";
    let list = [];

    // "Todas": a ordem já vem pronta em vitrine-data.js (marcas espalhadas, mesmo produto separado)
    const mixed = () => data.items.slice();
    const itemsFor = (f) => (f === "all" ? mixed() : data.items.filter((it) => it.brand === f));

    // filtros e índice de marcas
    const filters = $("[data-vfilter]");
    const count = (id) => data.items.filter((it) => it.brand === id).length;
    filters.innerHTML = `<button type="button" data-v="all" class="on">Todas <small>${data.items.length}</small></button>` +
      data.brands.map((b) => `<button type="button" data-v="${b.id}">${b.short} <small>${count(b.id)}</small></button>`).join("");
    $("[data-brands]").innerHTML = data.brands.filter((b) => b.id !== "garnet").map((b) => {
      const names = [...new Set(data.items.filter((it) => it.brand === b.id).map((it) => it.name))].slice(0, 4).join(" · ");
      return `<li data-brand="${b.id}" tabindex="0" role="button"><span>${b.label}</span><em>${names}</em><i>${String(count(b.id)).padStart(2, "0")}</i></li>`;
    }).join("");

    // fileiras: cada uma recebe metade dos produtos, repetidos até cobrir duas larguras de tela
    const rows = $$(".vrow").map((el, r) => ({ el, track: $(".vrow__track", el), dir: r % 2 ? 1 : -1, x: 0, speed: 1, target: 1, half: 0 }));
    // cópia: a 2ª metade da trilha só existe para o laço; fica fora do Tab e da leitura de tela
    // pos < 6: as primeiras posições de cada trilha carregam já (eager) para não aparecerem cards vazios
    const card = (it, i, copy, pos) => `<button type="button" class="vcard" data-i="${i}"${copy ? ' tabindex="-1" aria-hidden="true"' : ""}><span class="vcard__img"><img src="${tile(it.slug)}" alt="${copy ? "" : it.name + " — " + brandOf[it.brand].label}" loading="${pos < 6 ? "eager" : "lazy"}" decoding="async" width="720" height="900" /></span><span class="vcard__meta"><b>${it.name}</b><em>${brandOf[it.brand].label}</em></span></button>`;
    const vitrineEl = $(".vitrine");
    function updateCount() {
      $(".vitrine__count").textContent = `${list.length} ${list.length === 1 ? "foto" : "fotos"} de produtos${current === "all" ? "" : " · " + brandOf[current].label}`;
    }
    function build() {
      list = itemsFor(current);
      vitrineEl.classList.add("is-built");
      const groups = rows.map((_, r) => list.map((it, i) => [it, i]).filter((_, k) => list.length < 6 || k % rows.length === r));
      rows.forEach((row, r) => {
        let g = groups[r].length ? groups[r] : groups[0];
        let reps = 1;
        const cardW = Math.min(280, Math.max(200, window.innerWidth * 0.19)) + 18;
        while (g.length * reps * cardW < window.innerWidth * 1.6) reps++;
        const units = (copy) => { let h = ""; for (let n = 0; n < reps; n++) h += g.map(([it, i], k) => card(it, i, copy, n * g.length + k)).join(""); return h; };
        // duas cópias: o laço volta sem emenda. Só a 1ª é focável e lida; a 2ª é aria-hidden
        row.track.innerHTML = units(false) + units(true);
        row.x = row.dir > 0 ? -row.track.scrollWidth / 2 : 0;
      });
      requestAnimationFrame(() => rows.forEach((row) => {
        row.half = row.track.scrollWidth / 2;
        if (row.dir > 0) row.x = -row.half;
        row.track.style.setProperty("--dur", (row.half / 38).toFixed(1) + "s"); // ~38 px/s no modo CSS
      }));
      // conta fotos (um mesmo produto pode ter mais de uma foto)
      updateCount();
    }
    const setFilter = (f) => {
      current = f;
      $$("button", filters).forEach((b) => b.classList.toggle("on", b.dataset.v === f));
      $$("[data-brands] li").forEach((li) => li.classList.toggle("on", li.dataset.brand === f));
      if (reduced) return build();
      gsap.to(".vitrine", { opacity: 0, duration: 0.25, onComplete: () => { build(); gsap.to(".vitrine", { opacity: 1, duration: 0.4 }); } });
    };
    filters.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setFilter(b.dataset.v); });
    $("[data-brands]").addEventListener("click", (e) => {
      const li = e.target.closest("li"); if (!li) return;
      setFilter(current === li.dataset.brand ? "all" : li.dataset.brand);
      scrollTo($(".cases .vitrine__filters"));
    });
    $("[data-brands]").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.target.click(); } });
    // a construção dos cards (centenas de nós) espera a vitrine chegar perto da tela; o espaço dela já
    // está reservado no CSS (.vitrine:not(.is-built)), então nada pula. Contador e filtros funcionam antes.
    list = itemsFor(current);
    updateCount();
    const buildOnce = () => {
      if (vitrineEl.classList.contains("is-built")) return;
      const h0 = vitrineEl.offsetHeight;
      build();
      if (Math.abs(vitrineEl.offsetHeight - h0) > 1) ScrollTrigger.refresh();
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); buildOnce(); } }, { rootMargin: "1500px 0px" });
      io.observe(vitrineEl);
    } else buildOnce();
    let rw = window.innerWidth;
    window.addEventListener("resize", () => { if (Math.abs(window.innerWidth - rw) > 40) { rw = window.innerWidth; if (vitrineEl.classList.contains("is-built")) build(); } });

    // pausa do movimento (WCAG 2.2.2): botão, foco de teclado num card e lightbox aberto
    const pauseBtn = $(".vitrine__pause");
    let userPaused = false, kbFocus = false;
    const lbOpen = () => body.classList.contains("lb-open");
    if (reduced) pauseBtn.hidden = true; // sem movimento, sem o que pausar
    pauseBtn.addEventListener("click", () => {
      userPaused = !userPaused;
      pauseBtn.setAttribute("aria-pressed", String(userPaused));
      pauseBtn.textContent = userPaused ? "Retomar" : "Pausar animação";
      vitrineEl.classList.toggle("is-paused", userPaused);
    });
    vitrineEl.addEventListener("focusin", (e) => { kbFocus = e.target.matches(":focus-visible"); vitrineEl.classList.toggle("is-kbfocus", kbFocus); });
    vitrineEl.addEventListener("focusout", () => { kbFocus = false; vitrineEl.classList.remove("is-kbfocus"); });

    // movimento contínuo. Com mouse: JavaScript (desacelera no hover, acelera com o scroll).
    // Em telas de toque: animação CSS, que roda fora do JavaScript e não engasga no celular.
    if (!reduced && !finePointer) $(".vitrine").classList.add("is-css");
    if (!reduced && finePointer) {
      rows.forEach((row) => {
        row.el.addEventListener("pointerenter", () => { row.target = 0.12; });
        row.el.addEventListener("pointerleave", () => { row.target = 1; });
      });
      let visible = false;
      ScrollTrigger.create({ trigger: ".vitrine", start: "top bottom", end: "bottom top", onToggle: (s) => (visible = s.isActive) });
      gsap.ticker.add(() => {
        if (!visible || userPaused || kbFocus || lbOpen()) return;
        const boost = lenis ? Math.min(6, Math.abs(lenis.velocity) * 0.15) : 0;
        rows.forEach((row) => {
          if (!row.half) return;
          row.speed += (row.target - row.speed) * 0.08;
          row.x += row.dir * (0.55 * row.speed + boost);
          if (row.x <= -row.half) row.x += row.half;
          if (row.x > 0) row.x -= row.half;
          row.track.style.transform = `translate3d(${row.x}px,0,0)`;
        });
      });
    }

    // foto completa (lightbox) com navegação entre os produtos do filtro atual
    const lb = $(".lightbox"), lbImg = $("img", lb);
    let at = 0, opener = null;
    const show = (i) => {
      at = (i + list.length) % list.length;
      const it = list[at];
      lbImg.src = full(it.slug);
      lbImg.alt = `${it.name} — ${brandOf[it.brand].label}`;
      $("figcaption b", lb).textContent = it.name;
      $("figcaption span", lb).textContent = brandOf[it.brand].label;
    };
    const open = (i) => {
      opener = document.activeElement;
      show(i); lb.hidden = false; document.body.classList.add("lb-open");
      if (lenis) lenis.stop();
      if (!reduced) gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      $(".lightbox__close", lb).focus();
    };
    const close = () => {
      lb.hidden = true; document.body.classList.remove("lb-open"); if (lenis) lenis.start();
      // devolve o foco ao cartão que abriu a foto
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      opener = null;
    };
    $(".vitrine").addEventListener("click", (e) => { const c = e.target.closest(".vcard"); if (c) open(Number(c.dataset.i)); });
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__prev", lb).addEventListener("click", () => show(at - 1));
    $(".lightbox__next", lb).addEventListener("click", () => show(at + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Tab") {
        // Tab preso entre fechar, anterior e próxima
        const f = [$(".lightbox__close", lb), $(".lightbox__prev", lb), $(".lightbox__next", lb)];
        const i = f.indexOf(document.activeElement);
        const n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
        e.preventDefault(); f[n].focus();
      }
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });
    let tx = null;
    lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
    });
    $(".vitrine").dataset.cursor = "ver";
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
    if (!form) return;
    const steps = $$(".bstep", form);
    const stepsBox = $(".brief__steps", form);
    const next = $(".brief__next", form), back = $(".brief__back", form), err = $(".brief__err", form);
    const live = $(".brief__live", form);
    const progress = $(".brief__progress i", form);
    let i = 0;
    let reviewing = false;
    let text = "";
    const val = (b) => b.dataset.v || b.textContent;
    const setOn = (b, on) => { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); };
    $$(".chips", form).forEach((g) => {
      const multi = g.classList.contains("chips--multi");
      g.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        if (multi) setOn(b, !b.classList.contains("on"));
        else $$("button", g).forEach((x) => setOn(x, x === b));
        err.textContent = "";
      });
    });
    const picked = (name) => $$(`[data-name="${name}"] .on`, form).map(val);

    // resumo legível do que será enviado (aparece no lugar dos campos, acima dos botões)
    const review = document.createElement("section");
    review.className = "brief__review";
    review.hidden = true;
    review.setAttribute("aria-labelledby", "brief-review-title");
    review.innerHTML = '<h3 id="brief-review-title" tabindex="-1">Revise antes de enviar</h3><dl></dl>';
    $(".brief__nav", form).before(review);
    const reviewTitle = $("h3", review), reviewList = $("dl", review);
    const row = (k, v) => {
      const dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = k; dd.textContent = v;
      reviewList.append(dt, dd);
    };

    const send = document.createElement("a");
    send.className = "btn btn--gold magnetic brief__send";
    send.target = "_blank";
    send.rel = "noopener";
    send.textContent = "Abrir conversa no WhatsApp";
    send.hidden = true;
    next.after(send);
    const mail = document.createElement("a");
    mail.className = "btn btn--ghost-light brief__mail";
    mail.textContent = "Prefiro enviar por e-mail";
    mail.hidden = true;
    send.after(mail);
    // copiar a mensagem: para quem não tem WhatsApp no aparelho
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn--ghost-light brief__copy";
    copy.textContent = "Copiar mensagem";
    copy.hidden = true;
    mail.after(copy);
    const copyLabel = (t, announce) => {
      copy.textContent = t;
      if (announce) live.textContent = announce;
      setTimeout(() => { copy.textContent = "Copiar mensagem"; }, 2200);
    };
    copy.addEventListener("click", () => {
      const copied = () => copyLabel("Copiado", "Mensagem copiada");
      const fallback = () => {
        const t = document.createElement("textarea");
        t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(t); t.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { /* sem permissão */ }
        t.remove();
        if (ok) copied(); else copyLabel("Não foi possível copiar", "Não foi possível copiar a mensagem");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(copied, fallback);
      else fallback();
    });

    // a altura do card acompanha o passo ativo (os passos inativos saem do fluxo; a transição é mantida)
    const go = (n, focus = true) => {
      const h0 = stepsBox.offsetHeight;
      reviewing = false;
      stepsBox.hidden = false;
      review.hidden = true;
      steps.forEach((s, k) => { s.classList.toggle("is-on", k === n); s.classList.toggle("is-past", k < n); });
      i = n;
      progress.style.width = (n + 1) * 25 + "%";
      back.disabled = n === 0;
      next.textContent = n === steps.length - 1 ? "Revisar e enviar" : "Continuar";
      send.hidden = mail.hidden = copy.hidden = true;
      next.hidden = false;
      err.textContent = "";
      const h1 = stepsBox.offsetHeight;
      if (!reduced && h0 && h0 !== h1) {
        stepsBox.classList.add("is-sizing");
        gsap.fromTo(stepsBox, { height: h0 }, { height: h1, duration: 0.5, ease: "power3.out", clearProps: "height", onComplete: () => stepsBox.classList.remove("is-sizing") });
      }
      if (focus) {
        live.textContent = `Passo ${n + 1} de ${steps.length}`;
        // a visibilidade do passo entra com transição: tenta o foco a cada quadro até ele ser focável
        const lg = $("legend", steps[n]);
        let tries = 0;
        const tryFocus = () => {
          lg.focus({ preventScroll: true });
          if (document.activeElement !== lg && i === n && tries++ < 20) requestAnimationFrame(tryFocus);
        };
        requestAnimationFrame(tryFocus);
        // o card encolhe/cresce: garante que o título do passo continue à vista
        const r = form.getBoundingClientRect();
        if (r.top < 0 || r.top > innerHeight * 0.6) window.scrollBy({ top: r.top - 90, behavior: reduced ? "auto" : "smooth" });
      }
    };

    // erro por campo: mensagem própria, aria-invalid e ligação por aria-describedby
    const fieldErr = (input, msg) => {
      const small = $(`#err-${input.name}`, form);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      input.classList.toggle("err", !!msg);
      if (small) small.textContent = msg || "";
    };
    // telefone brasileiro: 10 ou 11 dígitos, ignorando espaços, parênteses, hífen e +55
    const phoneOk = (v) => {
      v = v.trim();
      if (!/^\+?[0-9()\-\s.]+$/.test(v)) return false;
      let d = v.replace(/\D/g, "");
      if ((v.startsWith("+55") || d.length >= 12) && d.startsWith("55")) d = d.slice(2);
      return d.length === 10 || d.length === 11;
    };
    const validators = [
      () => picked("categoria").length || "Escolha pelo menos uma categoria.",
      () => picked("modelo").length || "Escolha um modelo (ou “Ainda não sei”).",
      () => picked("volume").length || "Escolha uma faixa de volume.",
      () => {
        const f = (n) => form.elements[n];
        const checks = [
          [f("nome"), (v) => v.trim().length >= 2, "Informe seu nome (mínimo 2 letras)."],
          [f("telefone"), phoneOk, "Informe um telefone com DDD, por exemplo (11) 98153-1188."],
          [f("email"), (v) => /^[^\s@]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test(v.trim()), "Informe um e-mail válido, como nome@empresa.com.br."],
        ];
        let first = null;
        checks.forEach(([input, test, msg]) => {
          const good = test(input.value);
          fieldErr(input, good ? "" : msg);
          if (!good && !first) first = input;
        });
        if (first) { first.focus(); return false; }
        return true;
      },
    ];
    form.addEventListener("input", (e) => {
      if (e.target.matches(".field[aria-invalid=true]")) fieldErr(e.target, "");
    });

    const shake = () => gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,.3)" });
    next.addEventListener("click", () => {
      const r = validators[i]();
      if (r === false || typeof r === "string") { if (typeof r === "string") err.textContent = r; if (!reduced) shake(); return; }
      if (i < steps.length - 1) return go(i + 1);
      const f = (n) => form.elements[n].value.trim();
      const empresa = f("empresa") || "ainda não definida";
      text = [
        "Olá! Vim pelo site e quero iniciar um projeto 🙂",
        `Nome: ${f("nome")}`, `Empresa/Marca: ${empresa}`, `Telefone: ${f("telefone")}`, `E-mail: ${f("email")}`,
        `Categorias: ${picked("categoria").join(", ")}`, `Modelo: ${picked("modelo").join(", ")}`, `Volume: ${picked("volume").join(", ")}`,
        f("mensagem") ? `Mensagem: ${f("mensagem")}` : "",
        "Origem: briefing do site",
      ].filter(Boolean).join("\n");
      // link real (e não window.open) para funcionar em qualquer navegador e app
      send.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
      // alternativa para quem prefere e-mail
      mail.href = `mailto:contato@garnetcosmeticos.com.br?subject=${encodeURIComponent(`Novo projeto — ${f("empresa") || f("nome")}`)}&body=${encodeURIComponent(text)}`;
      reviewList.textContent = "";
      row("Categorias", picked("categoria").join(", "));
      row("Modelo", picked("modelo").join(", "));
      row("Volume", picked("volume").join(", "));
      row("Nome", f("nome"));
      row("Empresa/Marca", empresa);
      row("Telefone", f("telefone"));
      row("E-mail", f("email"));
      if (f("mensagem")) row("Mensagem", f("mensagem"));
      reviewing = true;
      stepsBox.hidden = true;
      review.hidden = false;
      send.hidden = mail.hidden = copy.hidden = false;
      next.hidden = true;
      back.disabled = false;
      err.textContent = "";
      progress.style.width = "100%";
      live.textContent = "Revisão final. Confira os dados e escolha como enviar.";
      reviewTitle.focus({ preventScroll: true });
      window.scrollBy({ top: review.getBoundingClientRect().top - 110, behavior: reduced ? "auto" : "smooth" });
    });

    // Enter num campo equivale ao botão principal (nada é enviado sozinho para fora)
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.target.tagName !== "INPUT" || e.isComposing) return;
      e.preventDefault();
      if (!next.hidden) next.click();
    });
    back.addEventListener("click", () => {
      if (reviewing) return go(steps.length - 1);
      if (i > 0) go(i - 1);
    });

    // atalhos de outros pontos do site: [data-brief-cat="Maquiagem"] pré-seleciona a categoria
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-brief-cat]");
      if (!a) return;
      const b = $$('[data-name="categoria"] button', form).find((x) => x.textContent.trim() === a.dataset.briefCat);
      if (b) setOn(b, true);
      if (i !== 0 || reviewing) go(0, false);
    });
  })();

  /* ---------- cursor personalizado + botões magnéticos ---------- */
  if (finePointer && !reduced) {
    // o cursor só aparece depois do primeiro movimento real do mouse (senão ficava parado no canto)
    let moved = false;
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
      if (e.pointerType === "touch") return;
      cx = e.clientX; cy = e.clientY;
      if (!moved) {
        moved = true;
        gsap.set([dot, ring], { x: cx, y: cy }); // já nasce sob o mouse, sem deslizar do canto
        body.classList.add("has-cursor");
        gsap.set(cur, { opacity: 1 });
      }
      dx(cx); dy(cy); rx(cx); ry(cy);
      updateCursor();
    }, { passive: true });
    window.addEventListener("scroll", updateCursor, { passive: true });
    // depois de um clique (ex.: abrir a foto da vitrine) o rótulo "ver" não fica preso sobre o que abriu
    window.addEventListener("click", () => requestAnimationFrame(updateCursor));
    document.addEventListener("pointerleave", () => { if (moved) gsap.to(cur, { opacity: 0, duration: 0.2 }); });
    document.addEventListener("pointerenter", () => { if (moved) gsap.to(cur, { opacity: 1, duration: 0.2 }); });

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

  $(".year").textContent = new Date().getFullYear();
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
