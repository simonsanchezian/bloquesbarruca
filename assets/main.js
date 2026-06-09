    // Prevent pinch-zoom and double-tap zoom on iOS (viewport meta alone is ignored by Safari).
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    (function () {
      var lastTap = 0;
      document.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTap <= 300) e.preventDefault();
        lastTap = now;
      }, false);
    })();

    // ── Mobile menu ──────────────────────────────
    const menuBtn   = document.getElementById('menu-btn');
    const mobileNav = document.getElementById('mobile-menu');
    const iconOpen  = document.getElementById('icon-open');
    const iconClose = document.getElementById('icon-close');

    menuBtn.addEventListener('click', () => {
      const open = !mobileNav.classList.contains('hidden');
      mobileNav.classList.toggle('hidden', open);
      iconOpen.classList.toggle('hidden', !open);
      iconClose.classList.toggle('hidden', open);
    });

    document.querySelectorAll('.m-link').forEach(l =>
      l.addEventListener('click', () => {
        mobileNav.classList.add('hidden');
        iconOpen.classList.remove('hidden');
        iconClose.classList.add('hidden');
      })
    );

    // ── Scroll reveal via IntersectionObserver ──
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // ── Anchor smooth scroll ─────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = this.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + id);
        }
      });
    });

    // ── Social FAB ──────────────────────────────
    (function () {
      const btn  = document.getElementById('social-fab-btn');
      const menu = document.getElementById('social-fab-menu');
      if (!btn || !menu) return;
      let open = false;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        open = !open;
        btn.classList.toggle('open', open);
        menu.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open);
      });
      document.addEventListener('click', function () {
        if (!open) return;
        open = false;
        btn.classList.remove('open');
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', false);
      });
    })();

    // ── Brick wall fall animation ──────────────
    (function () {
      const col = document.getElementById('brick-column');
      if (!col) return;

      // Only run on screens 1920×1080 or larger
      if (window.screen.width < 1920 || window.screen.height < 1080) return;

      // Only run on the homepage
      const p = window.location.pathname;
      if (p !== '/' && !p.endsWith('/index.html') && p !== '') return;

      const SPA = ['ensayos','prestaciones','articulos','prescripciones',
                   'producto-fireproof','producto-coupe','producto-hib','producto-bloque'];


      let rows        = [];
      let totalRows   = 0;
      let curRows     = 0;
      let running     = false;
      let aspectRatio = 2.2;

      const probe = new Image();
      probe.onload = function () {
        if (this.naturalWidth && this.naturalHeight) aspectRatio = this.naturalWidth / this.naturalHeight;
        if (running) initBricks();
      };
      probe.src = 'assets/ladrillo2.png';

      function computeLayout() {
        const hdr = document.querySelector('header .max-w-6xl');
        if (!hdr) return null;
        const rect          = hdr.getBoundingClientRect();
        const containerLeft = Math.max(0, rect.left);
        const innerPad      = window.innerWidth >= 1024 ? 32 : window.innerWidth >= 640 ? 24 : 16;
        const textStart     = containerLeft + innerPad;
        const gutterAvail   = textStart - 4;
        if (gutterAvail < 70) return null;

        // Widest row = 3 bricks; leave ~25% of gutter as margin before text
        const brickW  = Math.max(20, Math.floor(gutterAvail / 4));
        const brickH  = Math.max(12, Math.round(brickW / aspectRatio));
        const numRows = Math.min(Math.ceil(window.innerHeight / brickH), 65);

        return { brickW, brickH, numRows };
      }

      function initBricks() {
        col.innerHTML = '';
        rows    = [];
        curRows = 0;

        const layout = computeLayout();
        if (!layout) { col.style.display = 'none'; running = false; return; }

        const { brickW, brickH, numRows } = layout;
        totalRows = numRows;
        const half = Math.round(brickW / 2);

        col.style.display  = 'block';
        col.style.left     = '0px';
        col.style.width    = (brickW * 3) + 'px';
        col.style.height   = (numRows * brickH) + 'px';
        col.style.overflow = 'visible';

      const WALL_PAT = [
        [2,false],[3,true ],[2,false],[2,true ],[2,false],
        [3,true ],[2,false],[3,true ],[2,false],[2,true ],
        [2,false],[3,true ],[2,false],[2,true ],[2,false],
        [3,true ],[2,false],[3,true ],[2,false],[2,true ]
      ];

        for (let r = 0; r < numRows; r++) {
          const [n, halfOff] = WALL_PAT[r % WALL_PAT.length];
          const startX = halfOff ? -half : 0;
          const y      = r * brickH;
          const rowEls = [];

          for (let b = 0; b < n; b++) {
            const img = document.createElement('img');
            img.src       = 'assets/ladrillo2.png';
            img.alt       = '';
            img.className = 'brick-item';
            img.style.cssText =
              'left:'   + (startX + b * brickW) + 'px;' +
              'bottom:' + y       + 'px;' +
              'width:'  + brickW  + 'px;' +
              'height:' + brickH  + 'px;' +
              'object-fit:fill;';
            col.appendChild(img);
            rowEls.push(img);
          }
          rows.push(rowEls);
        }
        onScroll();
      }

      function dropRow(r, batchPos) {
        // baseDelay guarantees row r won't start before row r-1's last brick.
        // Within-row max stagger = 0.08s, so offset per row = 0.09s > 0.08s.
        // Cap at 0.27s (3 rows) so fast scrolling never queues more than ~270ms.
        const baseDelay = Math.min((batchPos || 0) * 0.09, 0.27);
        rows[r].forEach(function (el) {
          const dur   = 0.52 + Math.random() * 0.26;
          const delay = baseDelay + Math.random() * 0.08;
          el.style.setProperty('--brick-dur',   dur.toFixed(2)   + 's');
          el.style.setProperty('--brick-delay', delay.toFixed(2) + 's');
          el.classList.remove('rising');
          el.classList.remove('landed');
          void el.offsetWidth;
          el.classList.add('landed');
        });
      }

      function riseRow(r) {
        rows[r].forEach(function (el) {
          const dur   = (0.32 + Math.random() * 0.16).toFixed(2);
          const delay = (Math.random() * 0.14).toFixed(2);
          el.style.setProperty('--rise-dur',   dur   + 's');
          el.style.setProperty('--rise-delay', delay + 's');
          el.classList.remove('landed');
          el.classList.remove('rising');
          void el.offsetWidth;
          el.classList.add('rising');
        });
      }

      function onScroll() {
        if (!running) return;
        const scrollH   = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress  = Math.min(1, window.scrollY / scrollH);
        const newTarget = Math.round(progress * totalRows);

        if (newTarget > curRows) {
          for (let r = curRows; r < newTarget; r++) dropRow(r, r - curRows);
        } else if (newTarget < curRows) {
          for (let r = curRows - 1; r >= newTarget; r--) riseRow(r);
        }
        curRows = newTarget;
      }

      function show(visible) {
        running = visible;
        if (visible) setTimeout(initBricks, 150);
        else col.style.display = 'none';
      }

      function checkPage() {
        const hash = window.location.hash.replace('#', '');
        show(!SPA.includes(hash));
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { if (running) initBricks(); });
      window.addEventListener('hashchange', checkPage);
      checkPage();
    })();

    // ── Counter animation (+40 años) ──────────────
    (function () {
      const el = document.getElementById('counter-years');
      if (!el) return;
      const obs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        obs.unobserve(el);
        const end = 40, duration = 1800;
        const startTime = performance.now();
        function tick(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * end);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      obs.observe(el);
    })();

    // ── Cookie consent ──────────────────────────
    (function () {
      const KEY     = 'barruca_cookie_consent';
      if (localStorage.getItem(KEY)) return;
      const banner  = document.getElementById('cookie-banner');
      const overlay = document.getElementById('cookie-overlay');
      if (!banner) return;
      setTimeout(function () {
        banner.classList.add('visible');
        if (overlay) overlay.classList.add('visible');
      }, 900);
      function dismiss(val) {
        banner.classList.remove('visible');
        banner.classList.add('hiding');
        if (overlay) overlay.classList.remove('visible');
        localStorage.setItem(KEY, val);
        setTimeout(function () { banner.style.display = 'none'; }, 600);
      }
      document.getElementById('cookie-accept').addEventListener('click', function () { dismiss('accepted'); });
      document.getElementById('cookie-reject').addEventListener('click', function () { dismiss('rejected'); });
    })();

    // ── Catálogo carrusel móvil ──────────────────
    (function () {
      if (!window.matchMedia('(max-width: 1023px)').matches) return;
      var section = document.getElementById('productos');
      if (!section) return;

      var IDS   = ['coupe', 'fireproof', 'hib', 'bloque-hormigon'];
      var n     = IDS.length;
      var inner = section.querySelector('.max-w-6xl');
      var hdr   = inner.querySelector('.mb-16');
      var cardCls = inner.querySelector('.productos-card').className;
      var pDivs = IDS.map(function (id) { return document.getElementById(id); });

      pDivs.forEach(function (p) {
        p.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('visible'); });
        p.classList.remove('mb-24');
      });

      section.innerHTML = '';
      section.classList.remove('py-24');
      section.style.cssText = 'padding-top:5rem;padding-bottom:3rem;background:#f4f4f5;';

      // Header
      var hw = document.createElement('div');
      hw.style.cssText = 'padding:0 1.25rem 1.5rem;';
      hw.appendChild(hdr);
      section.appendChild(hw);

      // Scroll-snap track — con padding lateral para que asome el siguiente card
      var SLIDE_W = 'calc(100vw - 2.5rem)'; // deja ~20px del siguiente card visible
      var GAP     = '0.75rem';

      var track = document.createElement('div');
      track.id = 'cat-mob-track';
      track.style.cssText = 'display:flex;gap:' + GAP + ';overflow-x:scroll;overflow-y:hidden;' +
        'scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;' +
        'scrollbar-width:none;-ms-overflow-style:none;' +
        'padding:0 1.25rem 1rem;box-sizing:border-box;';

      pDivs.forEach(function (div) {
        var slide = document.createElement('div');
        slide.style.cssText = 'flex-shrink:0;width:' + SLIDE_W + ';scroll-snap-align:start;';
        var card = document.createElement('div');
        card.className = cardCls;
        card.appendChild(div);
        slide.appendChild(card);
        track.appendChild(slide);
      });
      section.appendChild(track);

      // Hide webkit scrollbar
      var st = document.createElement('style');
      st.textContent = '#cat-mob-track::-webkit-scrollbar{display:none}';
      document.head.appendChild(st);

      // Dot indicators
      var dots = [];
      var dw = document.createElement('div');
      dw.style.cssText = 'display:flex;justify-content:center;gap:0.5rem;padding:0.75rem 0 2rem;';
      for (var i = 0; i < n; i++) {
        var d = document.createElement('div');
        d.style.cssText = 'width:7px;height:7px;border-radius:50%;transition:all 0.3s;';
        d.style.background = i === 0 ? '#b91c1c' : '#d4d4d8';
        dw.appendChild(d); dots.push(d);
      }
      section.appendChild(dw);

      var slideW = window.innerWidth - 40 + 12; // slide width + gap en px

      track.addEventListener('scroll', function () {
        var idx = Math.round(track.scrollLeft / slideW);
        dots.forEach(function (d, i) {
          d.style.background = i === idx ? '#b91c1c' : '#d4d4d8';
          d.style.transform  = i === idx ? 'scale(1.4)' : 'scale(1)';
        });
      }, { passive: true });

      // Hint: anima levemente hacia la derecha para indicar que hay más contenido
      setTimeout(function () {
        track.scrollTo({ left: 48, behavior: 'smooth' });
        setTimeout(function () {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        }, 500);
      }, 800);
    })();

    // ── Catálogo brick hover ─────────────────────
    document.querySelectorAll('.productos-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = this.getBoundingClientRect();
        this.style.setProperty('--cat-mx', ((e.clientX - r.left) / r.width  * 100) + '%');
        this.style.setProperty('--cat-my', ((e.clientY - r.top)  / r.height * 100) + '%');
      });
    });


    // ── Carrusel proyectos en #nosotros ──────────
    (function () {
      var slides  = document.querySelectorAll('#nos-slides img');
      var counter = document.getElementById('nos-counter');
      var prev    = document.getElementById('nos-prev');
      var next    = document.getElementById('nos-next');
      if (!slides.length || !prev || !next) return;

      var cur = 0;

      function goTo(idx) {
        slides[cur].style.display = 'none';
        cur = (idx + slides.length) % slides.length;
        slides[cur].style.display = 'block';
        if (counter) counter.textContent = (cur + 1) + ' / ' + slides.length;
      }

      prev.addEventListener('click', function () { goTo(cur - 1); });
      next.addEventListener('click', function () { goTo(cur + 1); });
    })();

    // ── Contact form → mailto ───────────────────
    (function () {
      var form = document.getElementById('contact-form');
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nombre   = document.getElementById('nombre').value;
        var email    = document.getElementById('email').value;
        var telefono = document.getElementById('telefono').value;
        var mensaje  = document.getElementById('mensaje').value;
        var subject  = encodeURIComponent('Consulta web — ' + nombre);
        var body     = encodeURIComponent(
          'Nombre: '   + nombre  + '\n' +
          'Email: '    + email   + '\n' +
          (telefono ? 'Teléfono: ' + telefono + '\n' : '') +
          '\nMensaje:\n' + mensaje
        );
        form.innerHTML =
          '<div style="text-align:center;padding:2.5rem 1rem">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 1rem"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
          '<p style="font-weight:700;font-size:1.125rem;color:#18181b;margin-bottom:.5rem">¡Mensaje preparado!</p>' +
          '<p style="color:#71717a;font-size:.9375rem">Se ha abierto tu cliente de correo con los datos listos para enviar a <strong>barruca@barruca.es</strong>.</p>' +
          '</div>';
        setTimeout(function () {
          window.location.href = 'mailto:barruca@barruca.es?subject=' + subject + '&body=' + body;
        }, 200);
      });
    })();
