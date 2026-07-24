/* ==========================================================================
   SalesIQ — Landing Page Script
   Modular vanilla JS. Sections:
   1. Preloader
   2. Cursor glow
   3. Navbar (scroll state, mobile menu)
   4. Scroll progress + back-to-top
   5. Reveal-on-scroll (IntersectionObserver)
   6. Text reveal (hero)
   7. Animated counters
   8. Dashboard: feed, heatmap, ring
   9. Content population (features / integrations / testimonials / faq)
   10. Accordion
   11. Magnetic buttons + ripple
   12. Modal
   13. Three.js hero particle field (adaptive quality, pause on hidden tab)
   ========================================================================== */

'use strict';

/* ---------------------------------------------------------------------- */
/* Utilities                                                              */
/* ---------------------------------------------------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function debounce(fn, wait = 150){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/* ---------------------------------------------------------------------- */
/* 1. Preloader                                                           */
/* ---------------------------------------------------------------------- */
(function preloader(){
  const el = $('#preloader');
  const pct = $('#preloaderPct');
  if (!el) return;

  let progress = 0;
  const tick = () => {
    progress += Math.random() * 18;
    if (progress >= 100) progress = 100;
    pct.textContent = Math.floor(progress);
    if (progress < 100) requestAnimationFrame(() => setTimeout(tick, 60));
    else finish();
  };
  const finish = () => {
    el.classList.add('is-done');
    document.body.style.overflow = '';
    setTimeout(() => el.remove(), 700);
  };

  document.body.style.overflow = 'hidden';
  window.addEventListener('load', () => setTimeout(tick, 200), { once:true });
  // Safety net in case load already fired
  setTimeout(() => { if (progress === 0) tick(); }, 1200);
})();

/* ---------------------------------------------------------------------- */
/* 2. Cursor glow (desktop only)                                          */
/* ---------------------------------------------------------------------- */
(function cursorGlow(){
  if (window.matchMedia('(hover: none)').matches) return;
  const glow = $('.cursor-glow');
  if (!glow) return;
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let cx = x, cy = y;
  let active = false;

  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!active){ active = true; glow.classList.add('is-active'); }
  }, { passive:true });

  function raf(){
    cx += (x - cx) * 0.14;
    cy += (y - cy) * 0.14;
    glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
})();

/* ---------------------------------------------------------------------- */
/* 3. Navbar                                                               */
/* ---------------------------------------------------------------------- */
(function navbar(){
  const nav = $('#siteNav');
  const burger = $('#navBurger');
  if (!nav) return;

  let lastY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (y > lastY && y > 200 && !nav.classList.contains('is-open')) nav.classList.add('is-hidden');
    else nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive:true });

  burger?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  $$('.nav__mobile a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
})();

/* ---------------------------------------------------------------------- */
/* 4. Scroll progress + back-to-top                                       */
/* ---------------------------------------------------------------------- */
(function scrollProgress(){
  const fill = $('#scrollFill');
  const backBtn = $('#backToTop');

  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    if (fill) fill.style.width = pct + '%';
    if (backBtn) backBtn.classList.toggle('is-visible', scrolled > 600);
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  backBtn?.addEventListener('click', () => window.scrollTo({ top:0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
})();

/* ---------------------------------------------------------------------- */
/* 5. Reveal-on-scroll                                                    */
/* ---------------------------------------------------------------------- */
function initReveal(root = document){
  const targets = $$('.reveal-up, .reveal-line, .feature-card, .dash-panel, .timeline__step, .benefit-card, .integration-card, .accordion-item', root)
    .filter(el => !el.dataset.revealBound);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => { el.dataset.revealBound = '1'; io.observe(el); });
}
initReveal();

/* ---------------------------------------------------------------------- */
/* 6. Hero scroll cue                                                     */
/* ---------------------------------------------------------------------- */
$('#scrollCue')?.addEventListener('click', () => {
  $('#about')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
});

/* ---------------------------------------------------------------------- */
/* 7. Animated counters                                                   */
/* ---------------------------------------------------------------------- */
(function counters(){
  const els = $$('[data-count]');
  if (!els.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.6 });

  els.forEach(el => io.observe(el));
})();

/* ---------------------------------------------------------------------- */
/* 8. Dashboard: resolution ring, live feed, heatmap                      */
/* ---------------------------------------------------------------------- */
(function dashboard(){
  const ring = $('.ring-fill');
  const dashPanel = $('.dash-panel');
  if (!dashPanel) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        if (ring){
          const val = parseFloat(ring.dataset.ring);
          const circumference = 2 * Math.PI * 50;
          ring.style.strokeDashoffset = circumference - (val / 100) * circumference;
        }
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.4 });
  io.observe(dashPanel);

  // Live activity feed
  const feedList = $('#feedList');
  const feedEvents = [
    ['Visitor from Cebu started a chat', '2s'],
    ['Zobot qualified a lead in Manila', '11s'],
    ['Screen share started with operator Mia', '24s'],
    ['New visitor from organic search', '38s'],
    ['Chat transferred to Sales dept.', '52s'],
    ['Lead score updated to 87', '1m'],
    ['Visitor revisited pricing page', '1m'],
    ['CRM record created automatically', '2m'],
  ];
  if (feedList){
    let i = 0;
    const renderFeed = () => {
      feedList.innerHTML = '';
      for (let n = 0; n < 5; n++){
        const [text, time] = feedEvents[(i + n) % feedEvents.length];
        const li = document.createElement('li');
        li.style.animationDelay = `${n * 0.08}s`;
        li.innerHTML = `<span class="dot"></span><span>${text}</span><span class="time">${time}</span>`;
        feedList.appendChild(li);
      }
    };
    renderFeed();
    setInterval(() => { i++; renderFeed(); }, 3200);
  }

  // Heatmap grid
  const heatmap = $('#heatmapGrid');
  if (heatmap){
    const cells = 48;
    for (let n = 0; n < cells; n++){
      const span = document.createElement('span');
      span.style.setProperty('--v', (0.05 + Math.random() * 0.55).toFixed(2));
      heatmap.appendChild(span);
    }
    setInterval(() => {
      $$('span', heatmap).forEach(s => {
        if (Math.random() > 0.6) s.style.setProperty('--v', (0.05 + Math.random() * 0.55).toFixed(2));
      });
    }, 1800);
  }
})();

/* ---------------------------------------------------------------------- */
/* 9. Content population                                                  */
/* ---------------------------------------------------------------------- */
const FEATURES = [
  ['location-crosshairs', 'Real-time visitor tracking', 'See exactly who is on your site, right now.'],
  ['comments', 'Live chat', 'Instant, human conversations with your visitors.'],
  ['route', 'Chat routing', 'Send every conversation to the right operator automatically.'],
  ['phone', 'Audio calls', 'Move from chat to voice without leaving the page.'],
  ['video', 'Video calls', 'Face-to-face support for the moments that need it.'],
  ['display', 'Screen sharing', 'Show, don\u2019t just tell, when visitors get stuck.'],
  ['robot', 'Zobot AI', 'A no-code bot builder that handles the repeat questions.'],
  ['message', 'Answer Bot', 'Instant answers pulled from your own knowledge base.'],
  ['diagram-project', 'CRM integration', 'Every conversation syncs straight into Zoho CRM.'],
  ['headset', 'Zoho Desk integration', 'Hand off support tickets without losing context.'],
  ['users-gear', 'Visitor segmentation', 'Group visitors by behavior, source, or value.'],
  ['building', 'Departments', 'Route chats to sales, support, or billing automatically.'],
  ['mobile-screen', 'Mobile apps', 'Manage every conversation from iOS or Android.'],
  ['chart-column', 'Reports', 'Track performance across teams and channels.'],
  ['gears', 'Automation', 'Rules that trigger the right action, every time.'],
  ['bolt', 'Triggers', 'Proactive chat invites based on real behavior.'],
  ['puzzle-piece', 'Custom widgets', 'Build the exact chat experience your brand needs.'],
  ['clock-rotate-left', 'Visitor history', 'Full context on every return visit.'],
  ['right-left', 'Chat transfers', 'Move a conversation between operators seamlessly.'],
  ['circle-check', 'Operator availability', 'Know who\u2019s online before you assign a chat.'],
  ['plug', 'Integrations', 'Connects to the tools your team already runs.'],
];

const INTEGRATIONS = [
  ['circle-nodes', 'Zoho CRM'],
  ['headset', 'Zoho Desk'],
  ['chart-line', 'Zoho Analytics'],
  ['bullhorn', 'Zoho Campaigns'],
  ['diagram-project', 'Zoho Flow'],
  ['list-check', 'Zoho Projects'],
  ['cloud', 'Salesforce'],
  ['hubspot', 'HubSpot', true],
  ['slack', 'Slack', true],
  ['microsoft', 'Microsoft Teams', true],
  ['chart-simple', 'Google Analytics'],
  ['facebook-messenger', 'Meta Messenger', true],
  ['whatsapp', 'WhatsApp', true],
  ['instagram', 'Instagram', true],
];

const TESTIMONIALS = [
  ['Reyes M.', 'Head of Support, DMCI Homes', 'SalesIQ cut our average first-response time from minutes to seconds. Our operators finally see the visitor before the visitor has to explain anything.'],
  ['Priya K.', 'RevOps Lead', 'The lead scoring alone paid for the tool. Sales stopped chasing cold forms and started opening warm chats.'],
  ['Daniel O.', 'Founder, SaaS startup', 'Zobot handles our FAQ traffic entirely. My team only sees the conversations that actually need a human.'],
  ['Aiko T.', 'CX Manager', 'Screen sharing inside chat solved a support workflow we used to need three tools for.'],
  ['Marcus F.', 'Sales Director', 'Visitor intelligence changed how we prioritize outreach. We know who to call before we pick up the phone.'],
  ['Lena S.', 'Growth Lead', 'The CRM sync is instant. No exports, no duplicate records, no manual work.'],
];

const FAQS = [
  ['Do I need to install anything to use SalesIQ?', 'No. Add one lightweight embed code to your site and SalesIQ starts tracking visitors and enabling chat immediately.'],
  ['Does SalesIQ work with Zoho CRM out of the box?', 'Yes. Conversations, visitor scores, and contact details sync into Zoho CRM automatically, with no middleware required.'],
  ['Can Zobot answer questions without a developer?', 'Zobot ships with a no-code flow builder, so support and sales teams can build and edit bots without writing code.'],
  ['Is there a free trial?', 'Yes, every plan starts with a 15-day free trial. No card required to get started.'],
  ['Can I route chats to different departments?', 'Yes. Set up departments for sales, support, or billing, and SalesIQ routes each conversation based on rules you define.'],
  ['Does it work on mobile?', 'Operators can manage chats from the SalesIQ mobile app on iOS and Android, and the widget itself is fully responsive on visitor devices.'],
];

function populateFeatures(){
  const grid = $('#featureGrid');
  if (!grid) return;
  grid.innerHTML = FEATURES.map(([icon, title, desc]) => `
    <article class="feature-card">
      <i class="fa-solid fa-${icon}" aria-hidden="true"></i>
      <h4>${title}</h4>
      <p>${desc}</p>
    </article>
  `).join('');
}

function populateIntegrations(){
  const grid = $('#integrationGrid');
  if (!grid) return;
  grid.innerHTML = INTEGRATIONS.map(([icon, name, brand]) => `
    <div class="integration-card">
      <i class="fa-${brand ? 'brands' : 'solid'} fa-${icon}" aria-hidden="true"></i>
      <span>${name}</span>
    </div>
  `).join('');
}

function populateTestimonials(){
  const track = $('#testimonialTrack');
  if (!track) return;
  const cardHTML = ([name, role, quote]) => `
    <article class="t-card">
      <div class="t-card__stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <p>&ldquo;${quote}&rdquo;</p>
      <div class="t-card__who">
        <span class="t-card__avatar" aria-hidden="true"></span>
        <div><strong>${name}</strong><span>${role}</span></div>
      </div>
    </article>`;
  // duplicate list for seamless infinite scroll
  track.innerHTML = TESTIMONIALS.map(cardHTML).join('') + TESTIMONIALS.map(cardHTML).join('');
}

function populateFAQ(){
  const wrap = $('#accordion');
  if (!wrap) return;
  wrap.innerHTML = FAQS.map(([q, a], i) => `
    <div class="accordion-item">
      <button class="accordion-item__q" aria-expanded="false" aria-controls="faq-a-${i}">
        <span>${q}</span>
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
      </button>
      <div class="accordion-item__a" id="faq-a-${i}">${a}</div>
    </div>
  `).join('');
}

populateFeatures();
populateIntegrations();
populateTestimonials();
populateFAQ();
initReveal(); // bind reveal observers to freshly injected nodes

/* ---------------------------------------------------------------------- */
/* 10. Accordion                                                          */
/* ---------------------------------------------------------------------- */
(function accordion(){
  const wrap = $('#accordion');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.accordion-item__q');
    if (!btn) return;
    const item = btn.closest('.accordion-item');
    const answer = item.querySelector('.accordion-item__a');
    const isOpen = item.classList.contains('is-open');

    // close others
    $$('.accordion-item', wrap).forEach(other => {
      other.classList.remove('is-open');
      other.querySelector('.accordion-item__q').setAttribute('aria-expanded', 'false');
      other.querySelector('.accordion-item__a').style.maxHeight = null;
    });

    if (!isOpen){
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
})();

/* ---------------------------------------------------------------------- */
/* 11. Magnetic buttons + ripple                                          */
/* ---------------------------------------------------------------------- */
(function magneticButtons(){
  if (window.matchMedia('(hover: none)').matches || prefersReducedMotion) return;
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
})();

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
});

/* ---------------------------------------------------------------------- */
/* 12. Demo modal                                                         */
/* ---------------------------------------------------------------------- */
(function modal(){
  const modalEl = $('#demoModal');
  const openBtn = $('#watchDemoBtn');
  const closeBtn = $('#modalClose');
  const backdrop = $('#modalBackdrop');
  if (!modalEl) return;

  const open = () => { modalEl.hidden = false; document.body.style.overflow = 'hidden'; closeBtn.focus(); };
  const close = () => { modalEl.hidden = true; document.body.style.overflow = ''; openBtn?.focus(); };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modalEl.hidden) close(); });
})();

/* ---------------------------------------------------------------------- */
/* 13. Three.js hero particle field                                       */
/* ---------------------------------------------------------------------- */
(async function heroScene(){
  const canvas = $('#heroCanvas');
  if (!canvas) return;

  if (prefersReducedMotion){
    canvas.style.opacity = '0.25';
    return; // skip heavy 3D animation entirely
  }

  let THREE;
  try{
    THREE = await import('three');
  } catch(err){
    console.warn('Three.js failed to load; hero renders as static gradient.', err);
    return;
  }

  const hero = $('#hero');
  let width = hero.clientWidth, height = hero.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); // cap pixel ratio
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
  camera.position.z = 9;

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dLight = new THREE.DirectionalLight(0xffb066, 1.1);
  dLight.position.set(4, 6, 6);
  scene.add(dLight);
  const pLight1 = new THREE.PointLight(0xff2d55, 6, 20);
  pLight1.position.set(-4, 2, 3);
  scene.add(pLight1);
  const pLight2 = new THREE.PointLight(0xffd60a, 5, 20);
  pLight2.position.set(4, -2, 2);
  scene.add(pLight2);

  // --- Particle field (glowing nodes) ---
  const PARTICLE_COUNT = window.innerWidth < 700 ? 260 : 620;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colorPalette = [0xff2d55, 0xff6b00, 0xff9900, 0xffd60a];
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < PARTICLE_COUNT; i++){
    const radius = 4.5 + Math.random() * 4.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i*3]   = radius * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i*3+2] = radius * Math.cos(phi) * 0.6 - 2;

    tmpColor.set(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
    colors[i*3] = tmpColor.r; colors[i*3+1] = tmpColor.g; colors[i*3+2] = tmpColor.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors:true,
    transparent:true,
    opacity:0.85,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // --- Wireframe glass sphere centerpiece ---
  const sphereGeo = new THREE.IcosahedronGeometry(2.3, 2);
  const sphereMat = new THREE.MeshStandardMaterial({
    color:0x1a1a1a, wireframe:true, transparent:true, opacity:0.35,
    emissive:0xff6b00, emissiveIntensity:0.15,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // --- Floating rings ---
  const rings = [];
  const ringColors = [0xff2d55, 0xffd60a];
  for (let i = 0; i < 2; i++){
    const ringGeo = new THREE.TorusGeometry(3.1 + i * 0.8, 0.012, 12, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: ringColors[i], transparent:true, opacity:0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.4 + i * 0.4;
    ring.rotation.y = i * 0.6;
    scene.add(ring);
    rings.push(ring);
  }

  // --- Mouse parallax ---
  let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
  window.addEventListener('pointermove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive:true });

  // --- Adaptive quality based on FPS ---
  let lastFrame = performance.now();
  let frameCount = 0, fpsAccum = 0;
  let quality = 1; // 1 = full, 0 = reduced
  let running = true;
  let disposed = false;

  function checkVisibility(){
    running = document.visibilityState === 'visible';
  }
  document.addEventListener('visibilitychange', checkVisibility);

  const clock = new THREE.Clock();

  function animate(){
    if (disposed) return;
    requestAnimationFrame(animate);
    if (!running) return;

    const now = performance.now();
    const delta = now - lastFrame;
    lastFrame = now;
    frameCount++;
    fpsAccum += 1000 / Math.max(delta, 1);

    if (frameCount >= 40){
      const avgFps = fpsAccum / frameCount;
      if (avgFps < 40 && quality === 1){
        quality = 0;
        mat.size = 0.04;
        renderer.setPixelRatio(1);
      }
      frameCount = 0; fpsAccum = 0;
    }

    const t = clock.getElapsedTime();

    points.rotation.y = t * 0.035;
    points.rotation.x = Math.sin(t * 0.05) * 0.05;

    sphere.rotation.y = t * 0.06;
    sphere.rotation.x = t * 0.03;

    rings.forEach((ring, i) => { ring.rotation.z = t * (0.05 + i * 0.02) * (i % 2 === 0 ? 1 : -1); });

    targetRotX += (mouseY * 0.15 - targetRotX) * 0.04;
    targetRotY += (mouseX * 0.2 - targetRotY) * 0.04;
    scene.rotation.x = targetRotX;
    scene.rotation.y = targetRotY;

    pLight1.position.x = Math.sin(t * 0.3) * 4;
    pLight2.position.x = Math.cos(t * 0.25) * 4;

    renderer.render(scene, camera);
  }
  animate();

  const onResize = debounce(() => {
    width = hero.clientWidth; height = hero.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }, 180);
  window.addEventListener('resize', onResize);

  // Cleanup if hero is ever removed (defensive; SPA-safety, not used here but good practice)
  window.addEventListener('beforeunload', () => {
    disposed = true;
    geo.dispose(); mat.dispose(); sphereGeo.dispose(); sphereMat.dispose();
    rings.forEach(r => { r.geometry.dispose(); r.material.dispose(); });
    renderer.dispose();
  });
})();