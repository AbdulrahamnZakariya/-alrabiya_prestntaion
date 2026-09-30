// Brand motion tokens + deterministic helpers. Load with <script src="brand/motion.js"></script>
// قيم الحركة الموحّدة للاستوديو. غيّرها هون مرة وحدة بدل ما تغيّرها بكل مشهد.
window.BRAND_MOTION = {
  fps: 30,
  ease: {
    in: "power3.out",      // entrances
    out: "power2.in",      // exits
    move: "power2.inOut",  // position/scale moves, camera drifts
    punch: "expo.out",     // hook hits, numbers landing
    calm: "sine.inOut",    // ambient loops / background drift
  },
  dur: { ui: 0.35, base: 0.6, hero: 0.9, exit: 0.4, transition: 0.35 },
  stagger: { captionWord: 0.09, kineticWord: 0.2, line: 0.18, card: 0.12 },
  // RTL: "forward" travel is right -> left, so entrances start at +x.
  enterX: 48,
  enterY: 36,
};

// Frame helpers: always think in frames at 30fps.
window.f = (frames) => frames / window.BRAND_MOTION.fps;   // f(36) === 1.2s

// Seeded PRNG (mulberry32). Same seed => same "random" every render.
window.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Split an Arabic string into word spans (never letters). Keeps punctuation attached to its word.
window.wordsToSpans = function (el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "w";
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return el.querySelectorAll(".w");
};

// Localized numbers for count-ups, following --numerals in tokens.css.
window.fmtNum = function (n, opts = {}) {
  const nu = getComputedStyle(document.documentElement).getPropertyValue("--numerals").trim() || "latn";
  return new Intl.NumberFormat(`ar-u-nu-${nu}`, { maximumFractionDigits: 0, ...opts }).format(n);
};
