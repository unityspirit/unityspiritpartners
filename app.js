/* ─── Unity Spirit Partners — ScrollCanvas Engine ─── */
'use strict';

/* ── Constants ──────────────────────────── */
const TOTAL_FRAMES = 672;
const PAGE_COUNT = 6;
const LERP = 0.08;
const SCROLL_SPEED_WHEEL = 0.15;
const CONCURRENCY = 48;

const isMobile = innerWidth < 768;
const FRAME_DIR = isMobile ? 'frames-mobile' : 'frames-webp';

/* ── DOM refs ───────────────────────────── */
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loaderBar');
const loaderPct = document.getElementById('loaderPct');
const loaderCap = document.getElementById('loaderCaption');
const progressFill = document.getElementById('progressFill');
const pages = Array.from(document.querySelectorAll('.page'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const drawerLinks = Array.from(document.querySelectorAll('.nav-drawer-link'));
const canvas = document.getElementById('gl-canvas');
const ctx = canvas.getContext('2d');

/* ── State ──────────────────────────────── */
let targetFrame = 0;
let currentFrame = 0;
let isReady = false;
let preloaderDismissed = false;
const PRELOADER_THRESHOLD = 15;
const frames = new Array(TOTAL_FRAMES);

/* ── Canvas sizing (HiDPI) ──────────────── */
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(Math.round(currentFrame));
}
addEventListener('resize', resize);

/* ── Frame loader with concurrency ──────── */
function padNum(n) { return String(n).padStart(6, '0'); }

function loadFrame(index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.decode) {
        img.decode().then(() => { frames[index] = img; resolve(); }).catch(() => { frames[index] = img; resolve(); });
      } else {
        frames[index] = img;
        resolve();
      }
    };
    img.onerror = () => resolve(); // skip broken frames
    img.src = `${FRAME_DIR}/frame_${padNum(index + 1)}.webp`;
  });
}

async function loadAllFrames() {
  let loaded = 0;
  const msgs = [
    'Loading cinematic frames…',
    'Rendering galaxy sequences…',
    'Building neural networks…',
    'Assembling holographic UI…',
    'Preparing experience…'
  ];

  const queue = Array.from({ length: TOTAL_FRAMES }, (_, i) => i);

  async function worker() {
    while (queue.length > 0) {
      const idx = queue.shift();
      if (idx === undefined) return;
      await loadFrame(idx);
      loaded++;
      const realPct = Math.floor((loaded / TOTAL_FRAMES) * 100);
      if (!preloaderDismissed) {
        const visualPct = Math.min(Math.round((realPct / PRELOADER_THRESHOLD) * 100), 100);
        loaderBar.style.width = visualPct + '%';
        loaderPct.textContent = visualPct;
        if (loaderCap) loaderCap.textContent = msgs[Math.min(msgs.length - 1, Math.floor(visualPct / 22))];
        if (realPct >= PRELOADER_THRESHOLD) {
          preloaderDismissed = true;
          setTimeout(() => { loader.style.transition='opacity 0.7s';loader.style.opacity='0';setTimeout(function(){loader.style.display='none'},700); if (typeof initEffects === 'function') initEffects(); }, 400);
          const slb = document.getElementById('siteLoadingBar');
          setTimeout(() => { if(slb) slb.style.opacity='1';slb.style.visibility='visible'; }, 600);
        }
      } else {
        const fill = document.getElementById('siteLoadingFillInner');
        const txt = document.getElementById('siteLoadingText');
        const phase2Pct = Math.round(((realPct - PRELOADER_THRESHOLD) / (100 - PRELOADER_THRESHOLD)) * 100);
        if (fill) fill.style.width = phase2Pct + '%';
        if (txt) txt.textContent = 'Loading video ' + realPct + '%';
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
}

/* ── Draw a frame to canvas (cover fit) ── */
function drawFrame(idx) {
  idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, idx));
  const img = frames[idx];
  if (!img) return;

  const cw = innerWidth, ch = innerHeight;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  // Cover fit — scale image to cover canvas
  const scale = Math.max(cw / iw, ch / ih);
  const sw = iw * scale;
  const sh = ih * scale;
  const sx = (cw - sw) / 2;
  const sy = (ch - sh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, sx, sy, sw, sh);
}

/* ── Scroll input ───────────────────────── */
window.addEventListener('scroll', () => {
  if (!isReady) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  targetFrame = progress * (TOTAL_FRAMES - 1);
  clampFrame();
}, { passive: true });

function clampFrame() {
  targetFrame = Math.max(0, Math.min(targetFrame, TOTAL_FRAMES - 1));
}

function scrollToPage(i) {
  const p = pages[i];
  if (p) window.scrollTo({ top: p.offsetTop, behavior: 'smooth' });
}

document.querySelectorAll('[data-scroll]').forEach(el => {
  el.addEventListener('click', () => {
    scrollToPage(parseInt(el.getAttribute('data-scroll'), 10));
    closeDrawer();
  });
});

/* ── Drawer ─────────────────────────────── */
const navMenuBtn = document.getElementById('navMenuBtn');
const navScrim = document.getElementById('navScrim');
const navDrawer = document.getElementById('navDrawer');
const navDrawerClose = document.getElementById('navDrawerClose');
function openDrawer() { navDrawer.hidden = false; navScrim.hidden = false; }
function closeDrawer() { navDrawer.hidden = true; navScrim.hidden = true; }
navMenuBtn.addEventListener('click', openDrawer);
navScrim.addEventListener('click', closeDrawer);
navDrawerClose.addEventListener('click', closeDrawer);

/* ── UI update ──────────────────────────── */
let lastIdx = -1;
function updateUI() {
  const progress = currentFrame / (TOTAL_FRAMES - 1);
  progressFill.style.transform = `scaleX(${Math.min(1, progress)})`;
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = pages.indexOf(entry.target);
      if (idx !== -1) {
        pages.forEach((p, i) => p.classList.toggle('is-active', i === idx));
        navLinks.forEach((l, i) => l.classList.toggle('active', i === idx));
        drawerLinks.forEach((l, i) => l.classList.toggle('active', i === idx));
        if (idx !== lastIdx) { lastIdx = idx; runCounters(idx); }
      }
    }
  });
}, { root: null, rootMargin: '-40% 0px -40% 0px' });
pages.forEach(p => observer.observe(p));

/* ── Counters ───────────────────────────── */
function runCounters(pi) {
  if (pi !== 3) return;
  document.querySelectorAll('.counter').forEach(el => {
    const tgt = parseInt(el.getAttribute('data-target'), 10);
    let cur = 0; const step = tgt / 60;
    const t = setInterval(() => {
      cur += step;
      if (cur >= tgt) { el.textContent = tgt; clearInterval(t); return; }
      el.textContent = Math.floor(cur);
    }, 16);
  });
}

/* ── Render loop ────────────────────────── */
function animate() {
  requestAnimationFrame(animate);
  currentFrame += (targetFrame - currentFrame) * LERP;
  if (isReady) {
    updateUI();
    drawFrame(Math.round(currentFrame));
  }
}
animate();

/* ── Mouse parallax ─────────────────────── */
let mouseX = 0, mouseY = 0;
addEventListener('mousemove', e => { mouseX = (e.clientX / innerWidth - .5) * 2; mouseY = (e.clientY / innerHeight - .5) * 2; });

/* ── Init ────────────────────────────────── */
(async function init() {
  resize();
  await loadAllFrames();
  onReady();
})();

function onReady() {
  isReady = true;
  // Draw the first frame immediately
  drawFrame(0);
  if (!preloaderDismissed) { loader.style.transition='opacity 0.7s';loader.style.opacity='0';setTimeout(function(){loader.style.display='none'},700); }
  const slb = document.getElementById('siteLoadingBar');
  const slbTxt = document.getElementById('siteLoadingText');
  if (slbTxt) slbTxt.textContent = 'Loading complete';
  setTimeout(() => { if(slb) { slb.style.opacity='0';setTimeout(function(){if(slb)slb.remove()},600); } }, 800);
}

/* ── Effects (GSAP-free) ─────────────────── */
function initEffects() {
  // Bento card glow effect
  document.querySelectorAll('.bento-card').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  // Scroll hint
  const hero = document.querySelector('.page[data-index="0"]');
  if (hero) {
    const h = document.createElement('div');
    h.className = 'scroll-hint';
    h.innerHTML = '<div class="scroll-hint-line"></div><span>scroll</span>';
    hero.appendChild(h);
  }

  // Char reveal on hero title
  const titleEl = document.querySelector('.gsap-title');
  if (titleEl) {
    const html = titleEl.innerHTML;
    const parts = html.split(/(<[^>]+>)/);
    let delay = 0;
    titleEl.innerHTML = parts.map(part => {
      if (part.startsWith('<')) return part;
      return part.split('').map(ch => {
        if (ch === ' ') return ' ';
        delay += 0.02;
        return `<span class="char" style="animation-delay:${delay.toFixed(2)}s">${ch}</span>`;
      }).join('');
    }).join('');
    titleEl.classList.add('char-reveal');
  }
}

/* ── Cursor Glow — Linear-style ──────── */
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow && matchMedia('(hover:hover)').matches) {
  let cx = 0, cy = 0, gx = 0, gy = 0;
  addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });
  (function trackCursor() {
    gx += (cx - gx) * 0.08; gy += (cy - gy) * 0.08;
    cursorGlow.style.left = gx + 'px';
    cursorGlow.style.top = gy + 'px';
    requestAnimationFrame(trackCursor);
  })();
}

/* ── Form ─────────────────────────────────── */
window.handleSubmit = function() {
  const name = document.getElementById('formName').value.trim();
  const email = document.getElementById('formEmail').value.trim();
  if (!name || !email) { alert('Please enter your name and email.'); return; }
  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('submitText');
  btn.disabled = true; txt.textContent = 'Sending…';
  setTimeout(() => {
    document.querySelector('.contact-form').innerHTML = `
      <div class="form-success">
        <div class="success-icon">🚀</div>
        <div class="success-title">You're in!</div>
        <div class="success-text">Thank you, ${name}! We'll reach out within 24h.<br><br>Check <strong>${email}</strong></div>
      </div>`;
  }, 1200);
};


// Site loading bar CSS (Phase 2 - deferred)
const siteBarStyle = document.createElement('style');
siteBarStyle.textContent = '.site-loading-bar{position:fixed;bottom:0;left:0;width:100%;height:28px;background:rgba(10,10,10,.85);backdrop-filter:blur(8px);z-index:9998;display:flex;align-items:center;padding:0 16px;gap:10px;opacity:0;visibility:hidden;transition:opacity .5s,visibility .5s;border-top:1px solid rgba(255,255,255,.08)}.site-loading-bar.active{opacity:1;visibility:visible}.site-loading-bar.done{opacity:0;visibility:hidden}.site-loading-fill{flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}.site-loading-fill-inner{height:100%;width:0;background:linear-gradient(90deg,var(--gold,var(--accent,#c9a84c)),var(--gold-light,#e8c97a));border-radius:2px;transition:width .2s}.site-loading-text{font-size:11px;color:rgba(255,255,255,.5);white-space:nowrap}';
document.head.appendChild(siteBarStyle);

// === SITE LOADING BAR (Phase 2 — deferred) ===
(function(){
  if (document.getElementById('siteLoadingBar')) return;
  var el = document.createElement('div');
  el.id = 'siteLoadingBar';
  el.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:32px;background:rgba(10,10,10,.88);backdrop-filter:blur(10px);z-index:9998;display:flex;align-items:center;padding:0 20px;gap:12px;opacity:0;visibility:hidden;transition:opacity .5s,visibility .5s;border-top:1px solid rgba(255,255,255,.08);';
  el.innerHTML = '<div style="flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;"><div id="slbFill" style="height:100%;width:0;background:linear-gradient(90deg,var(--gold,var(--accent,#c9a84c)),#e8c97a);border-radius:2px;transition:width .25s;"></div></div><span id="siteLoadingText" style="font-size:11px;color:rgba(255,255,255,.5);white-space:nowrap;">Loading video...</span>';
  document.body.appendChild(el);
})();
