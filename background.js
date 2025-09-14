// background.js — full-page SVG-petal canvas animation (small petals, 80% opacity, soft halo)
(() => {
  const existing = document.getElementById('bgCanvas');
  const canvas = existing || (() => {
    const c = document.createElement('canvas');
    c.id = 'bgCanvas';
    document.body.prepend(c);
    return c;
  })();

  const ctx = canvas.getContext('2d');
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let w = 0, h = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    // map drawing units to CSS pixels
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Petal SVG (teardrop shape) with 80% opacity in fill
  const petalSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 120">
    <path d="M30 0 C50 40, 50 80, 30 120 C10 80, 10 40, 30 0 Z" fill="rgba(255,182,193,0.8)"/>
  </svg>`;

  const petalImg = new Image();
  petalImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(petalSVG);

  // Petal objects
  let petals = [];
  function makePetal() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 16 + 6,          // small petals (6 - 22px)
      speed: Math.random() * 0.6 + 0.35,     // vertical speed
      angle: (Math.random() - 0.5) * 0.5,    // initial rotation
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      swayAmp: Math.random() * 18 + 6,       // horizontal sway amplitude
      swayFreq: Math.random() * 0.02 + 0.006,
      phase: Math.random() * Math.PI * 2
    };
  }

  function initPetals() {
    const area = w * h;
    // density factor: tweak this to increase/decrease number of petals
    const densityFactor = 50000; // higher => fewer petals
    let count = Math.round(area / densityFactor);
    count = Math.min(Math.max(count, 18), 75); // clamp between 18 and 75
    petals = [];
    for (let i = 0; i < count; i++) {
      const p = makePetal();
      // spread them vertically initially
      p.y = Math.random() * h;
      petals.push(p);
    }
  }

  // Draw single petal with soft halo
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // soft halo behind petal (bigger, low alpha)
    ctx.globalAlpha = 0.18;
    const haloSize = p.size * 2.2;
    ctx.drawImage(petalImg, -haloSize / 2, -haloSize, haloSize, haloSize * 2);

    // main petal (80% - set in SVG fill alpha)
    ctx.globalAlpha = 1.0;
    ctx.drawImage(petalImg, -p.size / 2, -p.size, p.size, p.size * 2);

    ctx.restore();
  }

  let last = performance.now();
  function step(now) {
    const dt = now - last;
    last = now;

    // clear canvas (let page background show through)
    ctx.clearRect(0, 0, w, h);

    for (let p of petals) {
      // sway by sin of vertical position plus a phase
      p.x += Math.sin((p.y * p.swayFreq) + p.phase) * 0.5;
      // vertical movement scaled to delta time (frame-rate independent)
      p.y += p.speed * (dt / 16.67);
      p.angle += p.rotationSpeed * (dt / 16.67);

      drawPetal(p);

      // recycle when below viewport
      if (p.y > h + p.size * 2) {
        p.x = Math.random() * w;
        p.y = - (Math.random() * h * 0.25) - p.size * 2; // slightly staggered top spawn
        p.speed = Math.random() * 0.6 + 0.35;
        p.swayAmp = Math.random() * 18 + 6;
        p.swayFreq = Math.random() * 0.02 + 0.006;
        p.phase = Math.random() * Math.PI * 2;
      }
    }

    requestAnimationFrame(step);
  }

  petalImg.onload = () => {
    initPetals();
    last = performance.now();
    requestAnimationFrame(step);
  };

  // re-init on resize so density follows viewport
  window.addEventListener('resize', () => {
    // small debounce
    clearTimeout(window._petalResize);
    window._petalResize = setTimeout(() => {
      resize();
      initPetals();
    }, 120);
  });

})();
