/* Julieta Sartori · interacciones y animaciones */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = function () { return window.innerWidth <= 760; };

  /* ---------------- HERO: dos roles ---------------- */
  var hero = document.querySelector('.hero');
  var panels = Array.prototype.slice.call(hero.querySelectorAll('.panel'));
  var toggles = Array.prototype.slice.call(hero.querySelectorAll('.hero-toggle button'));
  var active = 'artista';
  var autoTimer = null;

  function setActive(role) {
    if (role === active && hero.dataset.active === role) return;
    active = role;
    hero.dataset.active = role;
    panels.forEach(function (p) {
      var on = p.dataset.role === role;
      p.classList.toggle('is-active', on);
      var v = p.querySelector('video');
      if (!v) return;
      if (on) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else { v.pause(); }
    });
    toggles.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.role === role ? 'true' : 'false'); });
  }

  // arranque
  hero.dataset.active = 'artista';
  setTimeout(function () { active = ''; setActive('artista'); }, 50);

  // escritorio: el cursor decide qué rol se expande (con histéresis)
  hero.addEventListener('mousemove', function (e) {
    if (isMobile()) return;
    hero.classList.add('touched');
    var r = hero.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    if (active === 'artista' && x > 0.58) setActive('productora');
    else if (active === 'productora' && x < 0.42) setActive('artista');
  });
  panels.forEach(function (p) {
    p.addEventListener('focus', function () { setActive(p.dataset.role); });
  });

  // celular: botones, deslizar y alternancia automática hasta que la persona toque
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
  function startAuto() {
    stopAuto();
    if (!isMobile()) return;
    autoTimer = setInterval(function () { setActive(active === 'artista' ? 'productora' : 'artista'); }, 6000);
  }
  toggles.forEach(function (b) {
    b.addEventListener('click', function () { stopAuto(); setActive(b.dataset.role); });
  });
  var x0 = null;
  hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) { stopAuto(); setActive(dx < 0 ? 'productora' : 'artista'); }
    x0 = null;
  });
  if (!reduced) startAuto();

  // pausa los videos cuando la portada no se ve
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = hero.querySelector('.panel.is-active video');
        if (!v) return;
        if (en.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause();
      });
    }, { threshold: 0.05 }).observe(hero);
  }

  /* ---------------- CARRUSEL ---------------- */
  (function () {
    var root = document.getElementById('carrusel'); if (!root) return;
    var slides = root.querySelectorAll('.slide'), dots = root.querySelectorAll('.car-dots button');
    var cap = root.querySelector('.car-cap'), count = root.querySelector('.car-count b');
    var total = slides.length, i = 0, timer = null, DELAY = 4000;
    function show(n) {
      i = (n + total) % total;
      Array.prototype.forEach.call(slides, function (s, k) { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle('is-active', k === i); });
      cap.textContent = slides[i].querySelector('figcaption').textContent;
      count.textContent = ('0' + (i + 1)).slice(-2);
    }
    function start() { stop(); timer = setInterval(function () { show(i + 1); }, DELAY); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    root.querySelector('.car-prev').addEventListener('click', function () { show(i - 1); start(); });
    root.querySelector('.car-next').addEventListener('click', function () { show(i + 1); start(); });
    Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener('click', function () { show(k); start(); }); });
    root.addEventListener('mouseenter', stop); root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop); root.addEventListener('focusout', start);
    var sx = null, stage = root.querySelector('.car-stage');
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { show(dx < 0 ? i + 1 : i - 1); start(); } sx = null; });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    show(0); start();
  })();

  /* ---------------- ANIMACIONES (GSAP) ---------------- */
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  // separa títulos en líneas/palabras para revelarlos
  document.querySelectorAll('[data-anim="lines"]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="split-line" style="display:inline-block"><span>' + w + '</span></span>'; }).join(' ');
    gsap.from(el.querySelectorAll('.split-line > span'), {
      yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  gsap.utils.toArray('[data-anim="up"]').forEach(function (el) {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  gsap.utils.toArray('[data-anim="stagger"]').forEach(function (el) {
    gsap.from(el.children, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // retrato: cortina + parallax
  gsap.utils.toArray('[data-anim="reveal"]').forEach(function (el) {
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 80%' } });
  });
  gsap.utils.toArray('[data-anim="parallax"]').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // contadores
  var fmt = new Intl.NumberFormat('es-AR');
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var end = parseInt(el.dataset.count, 10), o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: end > 100 ? 2.2 : 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: function () { el.textContent = fmt.format(Math.round(o.v)); } });
  });

  // línea de tiempo que se dibuja con el scroll
  gsap.fromTo('.tl-line', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 80%', end: 'bottom 55%', scrub: true } });

  // marquesina infinita que acelera con la velocidad del scroll
  (function () {
    var track = document.querySelector('.marquee-track'); if (!track) return;
    track.innerHTML += track.innerHTML;
    var loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    var dir = 1;
    ST.create({
      onUpdate: function (self) {
        dir = self.direction;
        var boost = Math.min(Math.abs(self.getVelocity()) / 250, 6);
        gsap.to(loop, { timeScale: dir * (1 + boost), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, overwrite: false });
      }
    });
  })();

  var mm = gsap.matchMedia();

  mm.add('(min-width: 761px)', function () {
    // portada: se fija un momento, el nombre se abre y el bloque se encoge
    var tl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=70%', scrub: 1, pin: true } });
    tl.to('.hero-mark .word:first-child', { xPercent: -45, opacity: 0, ease: 'none' }, 0)
      .to('.hero-mark .word:last-child', { xPercent: 45, opacity: 0, ease: 'none' }, 0)
      .to('.hero-mark small', { opacity: 0, ease: 'none' }, 0)
      .to('.hero-inner', { scale: 0.86, borderRadius: 28, ease: 'none' }, 0);

    // galería horizontal fijada
    var track = document.querySelector('.hscroll-track');
    var dist = function () { return track.scrollWidth - window.innerWidth; };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '.hscroll', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true }
    });
    gsap.to('.shot img', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.hscroll', start: 'top bottom', end: function () { return '+=' + (dist() + window.innerHeight); }, scrub: true } });

    // la sección de productora entra como un telón que se abre
    gsap.fromTo('.productora', { clipPath: 'inset(0% 6% 0% 6% round 32px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.productora', start: 'top bottom', end: 'top 25%', scrub: true } });
  });

  // entrada del nombre al cargar
  gsap.from('.hero-mark .word', { yPercent: 60, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.15, delay: 0.2 });
  gsap.from('.hero-mark small', { opacity: 0, duration: 1.2, delay: 0.9 });

  window.addEventListener('load', function () { ST.refresh(); });

  // anclas suaves que respetan los pines
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
    });
  });

  /* ---------------- CURSOR ---------------- */
  if (finePointer) {
    var c = document.querySelector('.cursor');
    var qx = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
    var qy = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', function (e) { c.classList.add('is-on'); qx(e.clientX); qy(e.clientY); });
    document.addEventListener('mouseleave', function () { c.classList.remove('is-on'); });
    document.querySelectorAll('a, button, [data-cursor="big"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { c.classList.add('is-big'); });
      el.addEventListener('mouseleave', function () { c.classList.remove('is-big'); });
    });
  }
})();
