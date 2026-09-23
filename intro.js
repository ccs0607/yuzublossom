/* A cancellable, visibility-aware timeline for the original layered moon story. */
"use strict";
window.createMoonPrelude = function createMoonPrelude(options = {}) {
  const dialog = document.querySelector("#introDialog");
  const canvas = document.querySelector("#introCanvas");
  const context = canvas.getContext("2d");
  const $ = (selector) => dialog.querySelector(selector);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const duration = 13.4;
  const chapters = [
    [0, "stars", "序 · 星河", "今夜，从一片星光开始。"],
    [1.3, "gather", "一 · 凝光", "把散落的思念，聚成一轮圆满。"],
    [2.9, "moon", "二 · 月升", "一轮明月，照见千里相思。"],
    [4.4, "clouds", "三 · 云起", "云舒云卷，清辉缓缓落下。"],
    [5.7, "silhouette", "四 · 月影", "月色深处，有人踏光而来。"],
    [7.2, "reveal", "五 · 婵娟", "衣袂生风，桂香盈袖。"],
    [9, "title", "六 · 团圆", "愿花长好，月长圆，人长久。"],
    [11.5, "handoff", "终 · 相逢", "把今夜的月光，赠予你。"],
  ];
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const smooth = (n) => {
    const v = clamp(n);
    return v * v * (3 - 2 * v);
  };
  const random = (a, b) => a + Math.random() * (b - a);
  let active = false,
    generation = 0,
    frame = 0,
    elapsed = 0,
    lastTime = 0;
  let width = 0,
    height = 0,
    animations = [],
    stars = [],
    flowers = [];
  let phase = "",
    loadingTimer = 0,
    ready = false;
  const assets = [...dialog.querySelectorAll("img[data-src]")];
  let assetPromise;

  function prepareAssets() {
    if (!assetPromise)
      assetPromise = Promise.all(
        assets.map(async (image) => {
          image.src = image.dataset.src;
          await image.decode();
        }),
      );
    return assetPromise;
  }
  function fitCanvas() {
    width = dialog.clientWidth || innerWidth;
    height = dialog.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function createParticles() {
    stars = Array.from({ length: width < 600 ? 110 : 185 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      r: random(0.5, 1.6),
      angle: random(0, Math.PI * 2),
      orbit: Math.sqrt(Math.random()),
      speed: random(0.5, 1.2),
      brightness: random(0.25, 0.75),
      index,
    }));
    flowers = Array.from({ length: width < 600 ? 25 : 42 }, () => ({
      x: Math.random(),
      y: random(-0.5, 0.6),
      size: random(1.4, 3.2),
      phase: random(0, Math.PI * 2),
      speed: random(0.025, 0.065),
    }));
  }
  // All layers share this clock. Paused WAAPI effects are sampled at the same time
  // as the Canvas, so tab suspension, skipping and replay cannot leave late timers.
  function animate(
    selector,
    keyframes,
    start,
    length,
    easing = "cubic-bezier(.22,.68,.22,1)",
  ) {
    const effect = $(selector).animate(keyframes, {
      duration: length * 1000,
      delay: start * 1000,
      easing,
      fill: "both",
    });
    effect.pause();
    effect.currentTime = 0;
    animations.push(effect);
  }
  function composeTimeline() {
    animations.forEach((effect) => effect.cancel());
    animations = [];
    animate(".prelude-atmosphere", [{ opacity: 0 }, { opacity: 1 }], 2.4, 4);
    animate(
      ".prelude-moon-rise",
      [
        {
          opacity: 0,
          transform: "translateY(26%) scale(.8)",
          filter: "brightness(.45)",
        },
        {
          opacity: 0.75,
          transform: "translateY(8%) scale(.95)",
          filter: "brightness(.8)",
          offset: 0.55,
        },
        {
          opacity: 1,
          transform: "translateY(0) scale(1)",
          filter: "brightness(1)",
        },
      ],
      2.3,
      2.6,
    );
    animate(
      ".prelude-moon-glow",
      [
        { opacity: 0.1, transform: "scale(.8)" },
        { opacity: 1, transform: "scale(1.15)" },
      ],
      3.5,
      5,
    );
    animate(
      ".prelude-cloud-far",
      [
        { opacity: 0, transform: "translateX(-8%)" },
        { opacity: 0.62, transform: "translateX(0)", offset: 0.45 },
        { opacity: 0.46, transform: "translateX(4%)" },
      ],
      3.8,
      6.5,
    );
    animate(
      ".prelude-cloud-near",
      [
        { opacity: 0, transform: "translateX(10%) translateY(7%)" },
        {
          opacity: 0.78,
          transform: "translateX(1%) translateY(0)",
          offset: 0.5,
        },
        { opacity: 0.5, transform: "translateX(-4%) translateY(-2%)" },
      ],
      4.4,
      6.3,
    );
    // One figure throughout: brightness reveals her without swapping mismatched cutouts.
    animate(
      ".prelude-figure",
      [
        {
          opacity: 0,
          transform: "translateY(20px)",
          filter: "brightness(.12) saturate(.45) blur(5px)",
        },
        {
          opacity: 0.93,
          transform: "translateY(3px)",
          filter: "brightness(.22) saturate(.5) blur(0)",
          offset: 0.25,
        },
        {
          opacity: 1,
          transform: "translateY(0)",
          filter: "brightness(.94) saturate(.8) blur(0)",
          offset: 0.55,
        },
        {
          opacity: 1,
          transform: "translateY(-7px)",
          filter: "brightness(1) saturate(.85) blur(0)",
        },
      ],
      5.15,
      5.5,
      "linear",
    );
    animate(
      ".prelude-ribbon",
      [
        { opacity: 0, transform: "translate(4%,5%) rotate(3deg)" },
        { opacity: 0.38, transform: "translate(0,0) rotate(0)", offset: 0.45 },
        { opacity: 0.24, transform: "translate(-3%,-3%) rotate(-2deg)" },
      ],
      7,
      4.8,
    );
    animate(
      ".prelude-title",
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      8.4,
      1.3,
    );
    animate(
      ".prelude-calligraphy",
      [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
      8.6,
      1.9,
    );
    // Clear the portrait and lettering before exposing the new hero, avoiding
    // duplicate faces, titles and navigation during a cross-fade.
    animate(".prelude-composition", [{ opacity: 1 }, { opacity: 0 }], 11.1, 1);
    animate(".prelude-night", [{ opacity: 1 }, { opacity: 0 }], 12.1, 1.3);
    animate(".prelude-atmosphere", [{ opacity: 1 }, { opacity: 0 }], 11.7, 1.7);
    // The second atmosphere animation must not override its earlier reveal.
    animations[animations.length - 1].effect.updateTiming({ fill: "forwards" });
    animate(".prelude-chrome", [{ opacity: 1 }, { opacity: 0 }], 11.5, 0.6);
  }
  function draw() {
    context.clearRect(0, 0, width, height);
    const bounds = $(".prelude-moon-rise").getBoundingClientRect();
    const host = dialog.getBoundingClientRect();
    const mx = bounds.left - host.left + bounds.width / 2,
      my = bounds.top - host.top + bounds.height / 2;
    const radius = bounds.width * 0.38;
    const gather =
      smooth((elapsed - 1) / 2) * (1 - smooth((elapsed - 4.3) / 2));
    const handoff = 1 - smooth((elapsed - 11.1) / 1);
    for (const s of stars) {
      const angle = s.angle + elapsed * 0.22;
      const bx = s.x * width,
        by = s.y * height;
      const gx = mx + Math.cos(angle) * radius * s.orbit,
        gy = my + Math.sin(angle) * radius * s.orbit;
      const x = bx + (gx - bx) * gather,
        y = by + (gy - by) * gather;
      const alpha =
        (s.brightness * (0.65 + 0.35 * Math.sin(elapsed * s.speed + s.angle)) +
          gather * 0.16) *
        handoff;
      context.fillStyle = `rgba(241,222,185,${alpha})`;
      context.beginPath();
      context.arc(x, y, s.r + gather * 0.45, 0, Math.PI * 2);
      context.fill();
      if (s.index % 7 === 0) {
        context.fillStyle = `rgba(229,202,142,${alpha * 0.1})`;
        context.beginPath();
        context.arc(x, y, s.r * 4, 0, Math.PI * 2);
        context.fill();
      }
    }
    if (elapsed > 7.1)
      for (const flower of flowers) {
        const age = elapsed - 7.1;
        const x = flower.x * width + Math.sin(age * 0.55 + flower.phase) * 22;
        const y = (flower.y + age * flower.speed) * height;
        context.save();
        context.translate(x, y);
        context.rotate(flower.phase + age * 0.7);
        context.fillStyle = "#d4b26d";
        context.globalAlpha = smooth(age) * 0.65 * handoff;
        for (let i = 0; i < 4; i++) {
          context.beginPath();
          context.ellipse(
            Math.cos((i * Math.PI) / 2) * flower.size,
            Math.sin((i * Math.PI) / 2) * flower.size,
            flower.size,
            flower.size * 0.56,
            (i * Math.PI) / 2,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
        context.restore();
      }
  }
  function updateChapter() {
    const chapter = chapters.findLast((item) => elapsed >= item[0]);
    if (chapter[1] === phase) return;
    phase = chapter[1];
    dialog.dataset.phase = phase;
    $("#introChapter").textContent = chapter[2];
    $("#introNarration").textContent = chapter[3];
    if (phase === "moon" || phase === "reveal" || phase === "title")
      options.onChime?.(phase !== "title");
  }
  function tick(now) {
    frame = 0;
    if (!active || document.hidden) {
      lastTime = 0;
      return;
    }
    const delta = Math.min((now - (lastTime || now)) / 1000, 0.1);
    lastTime = now;
    if (ready) elapsed = Math.min(duration, elapsed + delta);
    animations.forEach((effect) => {
      effect.currentTime = elapsed * 1000;
    });
    updateChapter();
    draw();
    $("#introProgress").style.transform = `scaleX(${elapsed / duration})`;
    if (elapsed >= duration) {
      finish();
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  function finish() {
    generation++;
    clearTimeout(loadingTimer);
    cancelAnimationFrame(frame);
    frame = 0;
    const wasActive = active;
    active = false;
    ready = false;
    lastTime = 0;
    if (dialog.open) dialog.close();
    animations.forEach((effect) => effect.cancel());
    animations = [];
    document.body.classList.remove("prelude-open");
    context.clearRect(0, 0, width, height);
    if (wasActive) {
      options.onComplete?.();
      // A replay ends at the hero, so return focus there rather than to its footer trigger.
      const target = document.querySelector(".hero-actions [data-open-wish]");
      if (target) target.focus({ preventScroll: true });
    }
  }
  async function play() {
    if (motion.matches) {
      finish();
      return;
    }
    if (active) finish();
    const id = ++generation;
    active = true;
    ready = false;
    phase = "";
    elapsed = 0;
    lastTime = 0;
    options.onBegin?.();
    document.body.classList.add("prelude-open");
    dialog.showModal();
    fitCanvas();
    createParticles();
    composeTimeline();
    updateChapter();
    draw();
    $("#introProgress").style.transform = "scaleX(0)";
    $("#skipBtn").focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
    try {
      await Promise.race([
        prepareAssets(),
        new Promise((_, reject) => {
          loadingTimer = setTimeout(
            () => reject(new Error("Prelude assets timed out")),
            6000,
          );
        }),
      ]);
      if (id !== generation || !active) return;
      clearTimeout(loadingTimer);
      ready = true;
    } catch {
      if (id === generation && active) finish();
      // A failed image never traps the page behind an opening sequence.
    }
  }
  $("#skipBtn").addEventListener("click", finish);
  $("#introSoundBtn").addEventListener("click", () => options.onSound?.());
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const first = $("#introSoundBtn"),
      last = $("#skipBtn");
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    finish();
  });
  document.addEventListener("visibilitychange", () => {
    if (!active) return;
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (!document.hidden) frame = requestAnimationFrame(tick);
  });
  motion.addEventListener("change", (event) => {
    if (event.matches) finish();
  });
  new ResizeObserver(() => {
    if (active) {
      fitCanvas();
      draw();
    }
  }).observe(dialog);
  return {
    play,
    finish,
    get active() {
      return active;
    },
    setSound(on) {
      $("#introSoundBtn").setAttribute("aria-pressed", String(on));
      $("#introSoundBtn").setAttribute(
        "aria-label",
        on ? "关闭月夜声音" : "开启月夜声音",
      );
      $("#introSoundBtn span").textContent = on ? "声音开启" : "声音关闭";
    },
  };
};
