/* 月满人间 — all visual coordinates are local to the hero's displayed image. */
(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const hero = $("#home"),
    art = $("#sceneArt"),
    sceneImage = $("#sceneImage");
  const canvas = $("#skyCanvas"),
    ctx = canvas.getContext("2d");
  const dialog = $("#wishDialog"),
    wishInput = $("#wishInput");
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer: fine)");
  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const TAU = Math.PI * 2;
  let reduced = motionQuery.matches,
    width = 0,
    height = 0,
    heroVisible = true;
  let frame = 0,
    lastTime = 0,
    elapsed = 0,
    petalClock = 0,
    lanternClock = 0;
  let particles = [],
    petals = [],
    stars = [],
    mood = "moon";
  let pan = { x: 0, y: 0 },
    targetPan = { x: 0, y: 0 };
  let prelude = null,
    toastTimer,
    hintTimer,
    cardURL = "",
    launchBusy = false,
    poemTimer;
  let storageAvailable = true;
  function readStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      storageAvailable = false;
      return fallback;
    }
  }
  function writeStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      storageAvailable = false;
      return false;
    }
  }
  const rawWishes = readStored("moonletter.wishes", []);
  let wishes = Array.isArray(rawWishes)
    ? rawWishes.filter((w) => w && typeof w.text === "string").slice(0, 20)
    : [];
  const rawSaved = readStored("moonletter.poems", []);
  let savedPoems = new Set(
    Array.isArray(rawSaved)
      ? rawSaved.filter((n) => Number.isInteger(n) && n >= 0 && n < 5)
      : [],
  );
  let totalWishes = Number(readStored("moonletter.count", wishes.length));
  if (!Number.isFinite(totalWishes) || totalWishes < 0)
    totalWishes = wishes.length;

  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3300);
  }
  function hint(message) {
    $("#sceneHint").textContent = message;
    $("#sceneHint").classList.add("show");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(
      () => $("#sceneHint").classList.remove("show"),
      4000,
    );
  }
  // Includes object-fit cropping, responsive object-position, CSS scale and pointer parallax.
  function imagePoint(u, v) {
    const bounds = sceneImage.getBoundingClientRect(),
      host = hero.getBoundingClientRect();
    const nw = sceneImage.naturalWidth || 1672,
      nh = sceneImage.naturalHeight || 941;
    const scale = Math.max(bounds.width / nw, bounds.height / nh);
    const pos = getComputedStyle(sceneImage)
      .objectPosition.split(" ")
      .map((n) => parseFloat(n) / 100);
    return {
      x:
        bounds.left -
        host.left +
        (bounds.width - nw * scale) * pos[0] +
        u * nw * scale,
      y:
        bounds.top -
        host.top +
        (bounds.height - nh * scale) * pos[1] +
        v * nh * scale,
      scale,
    };
  }
  function placeHotspot() {
    const mobile = width <= 600;
    const point = imagePoint(mobile ? 0.65 : 0.758, mobile ? 0.34 : 0.235);
    $("#moonHotspot").style.left = `${clamp(point.x, 90, width - 95)}px`;
    $("#moonHotspot").style.top = `${clamp(point.y, 145, height * 0.55)}px`;
  }
  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: width < 600 ? 30 : 65 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.85,
      r: random(0.4, 1.2),
      phase: random(0, TAU),
      speed: random(0.3, 1.1),
    }));
    placeHotspot();
    drawStatic();
  }
  function burst(x, y, count = 25) {
    if (reduced) return;
    const available = Math.max(0, 140 - particles.length);
    for (let i = 0; i < Math.min(count, available); i++) {
      const angle = random(0, TAU),
        speed = random(15, 85);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(1, 2.5),
        max: 2.5,
        r: random(0.8, 2),
      });
    }
  }
  function addPetals(count = 1) {
    if (reduced) return;
    const limit = width < 600 ? 45 : 75;
    for (
      let i = 0;
      i < Math.min(count, Math.max(0, limit - petals.length));
      i++
    ) {
      petals.push({
        x: random(0, width),
        y: random(-100, -10),
        speed: random(22, 49),
        drift: random(-7, 15),
        phase: random(0, TAU),
        angle: random(0, TAU),
        size: random(1.7, 3.5),
      });
    }
  }
  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((s) => {
      ctx.fillStyle = "rgba(240,220,180,.4)";
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, TAU);
      ctx.fill();
    });
  }
  function tick(time) {
    frame = 0;
    if (document.hidden || !heroVisible || reduced || prelude?.active) {
      lastTime = 0;
      return;
    }
    const dt = Math.min((time - (lastTime || time)) / 1000, 0.04);
    lastTime = time;
    elapsed += dt;
    ctx.clearRect(0, 0, width, height);
    for (const s of stars) {
      const alpha =
        0.17 + (0.5 + 0.5 * Math.sin(elapsed * s.speed + s.phase)) * 0.45;
      ctx.fillStyle = `rgba(243,223,184,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, TAU);
      ctx.fill();
    }
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 9 * dt;
      p.life -= dt;
      ctx.fillStyle = `rgba(255,225,158,${Math.max(0, p.life / p.max)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    petals = petals.filter((p) => p.y < height + 15);
    for (const p of petals) {
      p.y += p.speed * dt;
      p.x += (Math.sin(elapsed + p.phase) * 17 + p.drift) * dt;
      p.angle += dt * 0.6;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = "#d7b36a";
      ctx.globalAlpha = 0.65;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(
          Math.cos((k * TAU) / 4) * p.size,
          Math.sin((k * TAU) / 4) * p.size,
          p.size * 0.9,
          p.size * 0.55,
          (k * TAU) / 4,
          0,
          TAU,
        );
        ctx.fill();
      }
      ctx.restore();
    }
    if (mood === "osmanthus") {
      petalClock += dt;
      if (petalClock > 0.3) {
        addPetals(1);
        petalClock = 0;
      }
    }
    if (mood === "lantern") {
      lanternClock += dt;
      if (lanternClock > 2.8) {
        createLantern("", false);
        lanternClock = 0;
      }
    }
    const factor = 1 - Math.exp(-dt * 4);
    pan.x += (targetPan.x - pan.x) * factor;
    pan.y += (targetPan.y - pan.y) * factor;
    if (
      Math.abs(pan.x - targetPan.x) > 0.01 ||
      Math.abs(pan.y - targetPan.y) > 0.01
    ) {
      art.style.setProperty("--pan-x", `${pan.x.toFixed(2)}px`);
      art.style.setProperty("--pan-y", `${pan.y.toFixed(2)}px`);
      placeHotspot();
    }
    frame = requestAnimationFrame(tick);
  }
  function startFrame() {
    if (
      !frame &&
      !document.hidden &&
      heroVisible &&
      !reduced &&
      !prelude?.active
    )
      frame = requestAnimationFrame(tick);
  }
  function clearSceneEffects() {
    $("#lanternField").replaceChildren();
    $$(".moon-ring").forEach((el) => el.remove());
    particles = [];
    petals = [];
  }
  function createLantern(text = "", personal = false) {
    const field = $("#lanternField");
    if (field.children.length >= 18) field.firstElementChild.remove();
    const lantern = document.createElement("div");
    lantern.className = `sky-lantern${personal ? " personal" : ""}`;
    const x = personal
      ? width < 600
        ? width * 0.5
        : width * 0.69
      : random(width * 0.48, width * 0.94);
    const y = personal
      ? width < 600
        ? height * 0.39
        : height * 0.7
      : random(height * 0.82, height * 1.05);
    lantern.style.setProperty("--x", `${x}px`);
    lantern.style.setProperty("--y", `${y}px`);
    lantern.style.setProperty("--rise", `${-y - 140}px`);
    lantern.style.setProperty("--drift", `${random(-70, 70)}px`);
    lantern.style.setProperty(
      "--duration",
      personal ? "15s" : `${random(18, 26)}s`,
    );
    lantern.style.setProperty(
      "--scale",
      personal ? "1" : random(0.35, 0.7).toFixed(2),
    );
    const image = document.createElement("img");
    image.src = "assets/crafted/lantern.svg";
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = text;
    lantern.append(image, label);
    field.append(lantern);
    lantern.addEventListener("animationend", () => lantern.remove(), {
      once: true,
    });
    // Reduced-motion users see a stationary wish light, then it is removed quietly.
    setTimeout(() => lantern.remove(), reduced ? 7000 : 28000);
    if (personal) burst(x, y, 32);
  }
  let lastMoonTouch = 0;
  function touchMoon() {
    if (performance.now() - lastMoonTouch < 500) return;
    lastMoonTouch = performance.now();
    const moon = imagePoint(0.665, 0.255);
    if (!reduced) {
      const ring = document.createElement("i");
      ring.className = "moon-ring";
      ring.style.left = `${moon.x}px`;
      ring.style.top = `${moon.y}px`;
      ring.style.setProperty("--ring-scale", String((610 * moon.scale) / 20));
      $("#sceneWorld").append(ring);
      ring.addEventListener("animationend", () => ring.remove(), {
        once: true,
      });
      burst(moon.x, moon.y, 45);
    }
    hint("此刻的月光，也正落在你牵挂的人身上。");
    sound.chime();
  }
  function setMood(next, announce = true) {
    if (!["moon", "osmanthus", "lantern"].includes(next)) return;
    const changed = mood !== next;
    mood = next;
    document.body.dataset.mood = mood;
    $$(".mood-switch button").forEach((button) => {
      const selected = button.dataset.mood === mood;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (changed) {
      petals = [];
      $("#lanternField")
        .querySelectorAll(":not(.personal).sky-lantern")
        .forEach((el) => el.remove());
    }
    if (mood === "osmanthus") addPetals(28);
    if (mood === "lantern" && !reduced && changed)
      for (let i = 0; i < 6; i++) createLantern("", false);
    if (announce)
      hint(
        {
          moon: "澄月 · 今夜，清辉如水。",
          osmanthus: "桂雨 · 桂子月中落，天香云外飘。",
          lantern: "灯海 · 万家灯火，都有归处。",
        }[mood],
      );
    sound.chime(false);
  }
  const sound = {
    context: null,
    master: null,
    on: false,
    timer: 0,
    init() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) {
        toast("当前浏览器暂不支持月夜声音。");
        return false;
      }
      if (!this.context) {
        this.context = new Audio();
        this.master = this.context.createGain();
        this.master.gain.value = 0.18;
        this.master.connect(this.context.destination);
      }
      return true;
    },
    note(frequency, delay = 0, volume = 0.45) {
      if (!this.on || !this.context || document.hidden) return;
      const c = this.context,
        t = c.currentTime + delay,
        o = c.createOscillator(),
        g = c.createGain();
      o.type = "sine";
      o.frequency.value = frequency;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(volume, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 2.7);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    },
    chime(up = true) {
      this.note(up ? 523.25 : 440, 0, 0.16);
      this.note(up ? 783.99 : 659.25, 0.22, 0.1);
    },
    melody() {
      clearTimeout(this.timer);
      if (!this.on || document.hidden) return;
      const notes = [261.63, 293.66, 329.63, 392, 440];
      this.note(notes[Math.floor(Math.random() * notes.length)], 0, 0.1);
      this.timer = setTimeout(() => this.melody(), random(3300, 5600));
    },
    updateButton() {
      $("#soundBtn").setAttribute("aria-pressed", String(this.on));
      $("#soundBtn").setAttribute(
        "aria-label",
        this.on ? "关闭月夜声音" : "开启月夜声音",
      );
      $(".sound-label").textContent = this.on ? "声音开启" : "声音关闭";
      prelude?.setSound(this.on);
    },
    async toggle() {
      try {
        if (!this.init()) return;
        this.on = !this.on;
        this.updateButton();
        if (this.on) {
          await this.context.resume();
          this.chime();
          this.melody();
        } else {
          clearTimeout(this.timer);
          await this.context.suspend();
        }
      } catch {
        this.on = false;
        clearTimeout(this.timer);
        this.updateButton();
        toast("声音暂时无法开启，请稍后再试。");
      }
    },
  };
  function endIntro() {
    prelude?.finish();
    hero.classList.remove("is-entering");
    placeHotspot();
  }
  function runIntro() {
    clearSceneEffects();
    hero.scrollIntoView({ behavior: "instant" });
    if (reduced) {
      hint("月满人间，此刻共婵娟。");
      return;
    }
    prelude?.play();
  }
  function selectTab(name, focus = false) {
    ["lantern", "letter"].forEach((id) => {
      const selected = name === id,
        tab = $(`#${id}Tab`);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(`#${id}Panel`).hidden = !selected;
      if (selected && focus) tab.focus();
    });
    dialog.scrollTop = 0;
  }
  function openWish(type = "lantern") {
    endIntro();
    selectTab(type);
    renderHistory();
    if (!dialog.open) {
      dialog.showModal();
      document.body.classList.add("dialog-open");
    }
  }
  function renderHistory() {
    $("#wishCount").textContent = totalWishes
      ? `你已点亮 ${totalWishes} 盏心灯${storageAvailable ? " · 记录保存在这台设备" : " · 本次浏览记录"}`
      : "一盏灯，也是一份温柔的期许。";
    const list = $("#wishHistoryList");
    list.replaceChildren();
    wishes.slice(0, 3).forEach((wish) => {
      const item = document.createElement("li");
      item.textContent = wish.text;
      list.append(item);
    });
    $("#wishHistory").hidden = !wishes.length;
  }
  function updateLength() {
    $("#wishLength").textContent = `${wishInput.value.length} / 36`;
  }
  async function launchWish(event) {
    event.preventDefault();
    if (launchBusy) return;
    launchBusy = true;
    const text = wishInput.value.trim() || "愿所念之人，岁岁平安。";
    wishes.unshift({ text, date: Date.now() });
    wishes = wishes.slice(0, 20);
    totalWishes++;
    writeStored("moonletter.wishes", wishes);
    writeStored("moonletter.count", totalWishes);
    dialog.close();
    hero.scrollIntoView({ behavior: "instant" });
    wishInput.value = "";
    updateLength();
    requestAnimationFrame(() => {
      createLantern(text, true);
      sound.chime();
      hint(`「${text}」心愿已随灯火升起。`);
    });
    setTimeout(() => {
      launchBusy = false;
    }, 800);
  }
  const poems = [
    {
      lines: ["但愿人长久，", "千里共婵娟。"],
      author: "宋 · 苏轼《水调歌头》",
    },
    {
      lines: ["海上生明月，", "天涯共此时。"],
      author: "唐 · 张九龄《望月怀远》",
    },
    {
      lines: ["今夜月明人尽望，", "不知秋思落谁家。"],
      author: "唐 · 王建《十五夜望月寄杜郎中》",
    },
    {
      lines: ["天上若无修月户，", "桂枝撑损向西轮。"],
      author: "宋 · 米芾《中秋登楼望月》",
    },
    {
      lines: ["露从今夜白，", "月是故乡明。"],
      author: "唐 · 杜甫《月夜忆舍弟》",
    },
  ];
  // All quoted lines are attributed to their original authors.
  let poemIndex = 0;
  function renderPoem() {
    const poem = poems[poemIndex],
      text = $("#poemText");
    text.replaceChildren();
    poem.lines.forEach((line, i) => {
      if (i) text.append(document.createElement("br"));
      text.append(document.createTextNode(line));
    });
    $("#poemAuthor").textContent = poem.author;
    $("#poemIndex").textContent =
      `${String(poemIndex + 1).padStart(2, "0")} / 05`;
    const saved = savedPoems.has(poemIndex);
    $("#savePoem").setAttribute("aria-pressed", String(saved));
    $("#savePoem span").textContent = saved
      ? "已收藏 · 再点取消"
      : "收藏这句月光";
    $("#savedPoemNote").textContent = savedPoems.size
      ? `已收藏 ${savedPoems.size} 句月光${storageAvailable ? "，留在这台设备" : "，留在本次浏览"}。也可以写进你的月信。`
      : "收藏的诗句会留在这台设备，也可以写进你的月信。";
  }
  function nextPoem() {
    clearTimeout(poemTimer);
    $("#poemQuote").classList.add("changing");
    poemTimer = setTimeout(
      () => {
        poemIndex = (poemIndex + 1) % poems.length;
        renderPoem();
        $("#poemQuote").classList.remove("changing");
      },
      reduced ? 0 : 220,
    );
  }
  function togglePoem() {
    if (savedPoems.has(poemIndex)) savedPoems.delete(poemIndex);
    else savedPoems.add(poemIndex);
    const persisted = writeStored("moonletter.poems", [...savedPoems]);
    renderPoem();
    if (savedPoems.has(poemIndex)) {
      toast(persisted ? "这句月光，已替你珍藏。" : "已收藏到本次浏览。");
      sound.chime(false);
    }
  }
  function wrapText(context, text, maxWidth) {
    const lines = [];
    let line = "";
    for (const character of Array.from(text)) {
      if (character === "\n") {
        lines.push(line);
        line = "";
        continue;
      }
      if (context.measureText(line + character).width > maxWidth && line) {
        lines.push(line);
        line = character;
      } else line += character;
    }
    if (line) lines.push(line);
    return lines;
  }
  async function buildCard(event) {
    event.preventDefault();
    const button = $("#previewLetter");
    button.disabled = true;
    try {
      await document.fonts.ready;
      if (!sceneImage.complete || !sceneImage.naturalWidth)
        await sceneImage.decode();
      const c = document.createElement("canvas");
      c.width = 1080;
      c.height = 1620;
      const g = c.getContext("2d"),
        serif = '"STSong", "Songti SC", "SimSun", serif';
      g.fillStyle = "#111f2e";
      g.fillRect(0, 0, c.width, c.height);
      // Crop the existing illustration as one piece, preserving the character and moon.
      const nw = sceneImage.naturalWidth,
        nh = sceneImage.naturalHeight;
      const sourceWidth = Math.min(nw, (nh * 1080) / 865);
      g.drawImage(
        sceneImage,
        (nw - sourceWidth) * 0.64,
        0,
        sourceWidth,
        nh,
        0,
        0,
        1080,
        865,
      );
      const fade = g.createLinearGradient(0, 400, 0, 865);
      fade.addColorStop(0, "rgba(17,31,46,0)");
      fade.addColorStop(1, "#111f2e");
      g.fillStyle = fade;
      g.fillRect(0, 400, 1080, 465);
      g.strokeStyle = "#dbc29566";
      g.lineWidth = 1;
      g.strokeRect(44, 44, 992, 1532);
      g.strokeRect(55, 55, 970, 1510);
      g.textAlign = "center";
      g.fillStyle = "#f3e7d0";
      g.font = `76px ${serif}`;
      g.fillText("月满人间", 540, 847);
      g.font = "17px Georgia, serif";
      g.fillStyle = "#c7b18b";
      g.fillText("A LETTER FROM THE MOON", 540, 895);
      g.strokeStyle = "#bba37b66";
      g.beginPath();
      g.moveTo(460, 936);
      g.lineTo(620, 936);
      g.stroke();
      const recipient = $("#recipientInput").value.trim() || "心里牵挂的你";
      const sender = $("#senderInput").value.trim() || "一个想念你的人";
      const message =
        $("#letterInput").value.trim().replace(/\s+/gu, " ") ||
        "愿花长好，月长圆，人长久。";
      g.textAlign = "left";
      g.fillStyle = "#c7b694";
      g.font = `29px ${serif}`;
      g.fillText(`致 ${recipient}：`, 133, 1012, 815);
      g.fillStyle = "#e9e0d1";
      g.font = `36px ${serif}`;
      const lines = wrapText(g, message, 800);
      const lineHeight = lines.length > 4 ? 53 : 62;
      lines
        .slice(0, 6)
        .forEach((line, i) => g.fillText(line, 133, 1095 + i * lineHeight));
      g.textAlign = "right";
      g.fillStyle = "#c7b694";
      g.font = `27px ${serif}`;
      g.fillText(sender, 947, 1432, 815);
      g.textAlign = "center";
      g.font = `22px ${serif}`;
      g.fillText("八月十五 · 见字如晤", 540, 1510);
      const blob = await new Promise((resolve) =>
        c.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not generate card");
      if (cardURL) URL.revokeObjectURL(cardURL);
      cardURL = URL.createObjectURL(blob);
      $("#cardPreview").src = cardURL;
      $("#letterForm").hidden = true;
      $("#letterPreview").hidden = false;
      $("#downloadCard").focus();
    } catch (error) {
      console.error("Card generation failed:", error);
      toast("贺卡还没准备好，请稍后重试。");
    } finally {
      button.disabled = false;
    }
  }
  function setImmersed(enabled) {
    endIntro();
    document.body.classList.toggle("immersed", enabled);
    const targets = [
      $("#siteHeader"),
      $(".hero-inner"),
      $(".hero-bottom"),
      ...$$("main > section:not(.hero)"),
      $("footer"),
    ];
    targets.forEach((el) => {
      el.inert = enabled;
    });
    if (enabled) {
      hero.scrollIntoView({ behavior: "instant" });
      $("#exitImmerseBtn").focus({ preventScroll: true });
    } else $("#immerseBtn").focus({ preventScroll: true });
    resize();
  }
  $$("[data-open-wish]").forEach((button) =>
    button.addEventListener("click", () => openWish()),
  );
  $("#letterRitual").addEventListener("click", () => openWish("letter"));
  $("#flowerRitual").addEventListener("click", () => {
    hero.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
    setMood("osmanthus");
  });
  $("[data-close-dialog]").addEventListener("click", () => dialog.close());
  let backdropDown = false;
  dialog.addEventListener("pointerdown", (event) => {
    const r = dialog.getBoundingClientRect();
    backdropDown =
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom;
  });
  dialog.addEventListener("click", (event) => {
    if (backdropDown && event.target === dialog) dialog.close();
    backdropDown = false;
  });
  dialog.addEventListener("close", () =>
    document.body.classList.remove("dialog-open"),
  );
  ["lantern", "letter"].forEach((name) => {
    $(`#${name}Tab`).addEventListener("click", () => selectTab(name));
    $(`#${name}Tab`).addEventListener("keydown", (event) => {
      if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        selectTab(
          event.key === "Home"
            ? "lantern"
            : event.key === "End"
              ? "letter"
              : name === "lantern"
                ? "letter"
                : "lantern",
          true,
        );
      }
    });
  });
  wishInput.addEventListener("input", updateLength);
  $$("[data-wish]").forEach((button) =>
    button.addEventListener("click", () => {
      wishInput.value = button.dataset.wish;
      updateLength();
      wishInput.focus();
    }),
  );
  $("#wishForm").addEventListener("submit", launchWish);
  $("#letterForm").addEventListener("submit", buildCard);
  $("#editLetter").addEventListener("click", () => {
    $("#letterForm").hidden = false;
    $("#letterPreview").hidden = true;
    $("#letterInput").focus();
  });
  $("#usePoem").addEventListener("click", () => {
    $("#letterInput").value = poems[poemIndex].lines.join("");
    $("#letterInput").focus();
  });
  $("#downloadCard").addEventListener("click", () => {
    if (!cardURL) return;
    const link = document.createElement("a");
    link.href = cardURL;
    link.download = "月满人间-中秋来信.png";
    document.body.append(link);
    link.click();
    link.remove();
    $("#letterPreview>p").textContent = "已开始保存，愿这封月信带去你的心意。";
  });
  $("#nextPoem").addEventListener("click", nextPoem);
  $("#savePoem").addEventListener("click", togglePoem);
  $(".mood-switch").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mood]");
    if (button) setMood(button.dataset.mood);
  });
  $("#moonHotspot").addEventListener("click", touchMoon);
  $("#soundBtn").addEventListener("click", () => sound.toggle());
  $("#replayBtn").addEventListener("click", runIntro);
  $("#immerseBtn").addEventListener("click", () => setImmersed(true));
  $("#exitImmerseBtn").addEventListener("click", () => setImmersed(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("immersed"))
      setImmersed(false);
  });
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (
        reduced ||
        !finePointer.matches ||
        hero.classList.contains("is-entering")
      )
        return;
      const rect = hero.getBoundingClientRect();
      targetPan = {
        x: (-(event.clientX - rect.left - width / 2) / width) * 8,
        y: (-(event.clientY - rect.top - height / 2) / height) * 5,
      };
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    targetPan = { x: 0, y: 0 };
  });
  hero.addEventListener("click", (event) => {
    if (event.target.closest("button,a,input,textarea") || reduced) return;
    const rect = hero.getBoundingClientRect(),
      x = event.clientX - rect.left,
      y = event.clientY - rect.top;
    const moon = imagePoint(0.665, 0.255);
    if (Math.hypot(x - moon.x, y - moon.y) < 250 * moon.scale) touchMoon();
    else {
      burst(x, y, 22);
      sound.note(659.25, 0, 0.08);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      clearTimeout(sound.timer);
      sound.context?.suspend().catch(() => {});
    } else {
      startFrame();
      if (sound.on)
        sound.context
          .resume()
          .then(() => sound.melody())
          .catch(() => {});
    }
    $("#lanternField").style.visibility = document.hidden ? "hidden" : "";
  });
  motionQuery.addEventListener("change", (event) => {
    reduced = event.matches;
    clearSceneEffects();
    targetPan = { x: 0, y: 0 };
    pan = { x: 0, y: 0 };
    art.style.setProperty("--pan-x", "0px");
    art.style.setProperty("--pan-y", "0px");
    if (reduced) {
      endIntro();
      cancelAnimationFrame(frame);
      frame = 0;
      drawStatic();
    } else startFrame();
    placeHotspot();
  });
  const heroObserver = new IntersectionObserver(
    (entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) startFrame();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      }
      $("#lanternField")
        .querySelectorAll(".sky-lantern")
        .forEach((el) => {
          el.style.animationPlayState = heroVisible ? "running" : "paused";
        });
    },
    { threshold: 0 },
  );
  heroObserver.observe(hero);
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));
  if (!reduced) document.documentElement.classList.add("js-motion");
  const navObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting)
          $$(".main-nav a").forEach((link) =>
            link.classList.toggle(
              "current",
              link.hash === `#${entry.target.id}`,
            ),
          );
    },
    { rootMargin: "-20% 0px -50% 0px" },
  );
  [hero, $("#moments"), $("#poetry")].forEach((el) => navObserver.observe(el));
  new ResizeObserver(resize).observe(hero);
  sceneImage.addEventListener("load", resize);
  window.addEventListener("pagehide", () => {
    if (cardURL) URL.revokeObjectURL(cardURL);
  });
  renderPoem();
  renderHistory();
  resize();
  startFrame();
  prelude = window.createMoonPrelude({
    onBegin() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      targetPan = { x: 0, y: 0 };
      pan = { x: 0, y: 0 };
      art.style.setProperty("--pan-x", "0px");
      art.style.setProperty("--pan-y", "0px");
      hero.classList.add("is-entering");
    },
    onComplete() {
      hero.classList.remove("is-entering");
      placeHotspot();
      startFrame();
    },
    onSound: () => sound.toggle(),
    onChime: (up) => sound.chime(up),
  });
  // Direct links to lower sections should remain direct links.
  if (!reduced && (!location.hash || location.hash === "#home")) runIntro();
})();
