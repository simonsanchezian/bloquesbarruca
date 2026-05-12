    // Re-enable smooth scroll after browser finishes back/forward restoration.
    // The inline <head> script disabled it (scrollBehavior='auto') so the
    // browser-native scroll restoration snaps instantly instead of animating.
    if (document.documentElement.style.scrollBehavior === 'auto') {
      window.addEventListener('load', function () {
        setTimeout(function () { document.documentElement.style.scrollBehavior = ''; }, 50);
      });
    }

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
        var target = document.getElementById(this.getAttribute('href').slice(1));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
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
      const KEY    = 'barruca_cookie_consent';
      if (localStorage.getItem(KEY)) return;
      const banner = document.getElementById('cookie-banner');
      if (!banner) return;
      setTimeout(function () { banner.classList.add('visible'); }, 900);
      function dismiss(val) {
        banner.classList.remove('visible');
        banner.classList.add('hiding');
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

      var IDS   = ['fireproof', 'coupe', 'hib', 'bloque-hormigon'];
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

    // ── Blog modal ──────────────────────────────
    (function () {
      var POSTS = {
        "1":  { cat:"Ladrillo",     titulo:"Ladrillo Fireproof®",
                hero:"https://www.barruca.es/images/blog/fireProofRecorte.jpeg",
                texto:"Poco a poco nuestro ladrillo Fireproof ® EI-120 + 78 dBA (certificado con ensayo), va ganando espacio con respecto a otros materiales. Obra de la Constructora RFS en sus 38 Viviendas en el Paseo de la Isla, #Burgos #construccion #prefabricado #hormigon #viviendas #materiales",
                imgs:["https://www.barruca.es/images/blog/con_fireproof.jpeg","https://www.barruca.es/images/blog/confireproof.jpeg"] },
        "2":  { cat:"Colegio",      titulo:"Colegio Indira Gandhi, Málaga",
                hero:"https://www.barruca.es/images/blog/indiraRecorte.jpeg",
                texto:"La pasada semana os traíamos unas fotos del trabajo que realizamos en Málaga en el colegio Indira Ghandi. Queremos mostraros al fotógrafo autor de las fotos y la reseña en la revista onDiseño.<br><a href='https://lnkd.in/eb-B2q4T' target='_blank' rel='noopener'>Revista onDiseño</a><br>Fantásticas fotos de Javier Callejas Sevilla — <a href='https://lnkd.in/etdbYbq3' target='_blank' rel='noopener'>Ver fotógrafo</a>",
                imgs:["https://www.barruca.es/images/blog/Colegio-Indira.png"] },
        "4":  { cat:"Revista",      titulo:"Revista Cemento de Hormigón",
                hero:"https://www.barruca.es/images/blog/RevistaRecorte.jpeg",
                texto:"<a href='https://cemento-hormigon.com/realizaciones/proyectos-y-obras-con-elementos-prefabricados-de-hormigon-iv-especial-fachadas-arquitectonicas/' target='_blank' rel='noopener'>Ver artículo en cemento-hormigon.com →</a>",
                imgs:["https://www.barruca.es/images/blog/Revista-cemento.jpg"] },
        "5":  { cat:"Mercado",      titulo:"Inauguración del Mercado Provisional",
                hero:"https://www.barruca.es/images/blog/MercadoRecorte.png",
                texto:"@diariodeburgos avanza la inauguración del #mercadoprovisional en el que @acuellar_com ha estado suministrando bloques Barruca. Cuando el nuevo mercado esté listo, gracias a que todos nuestros bloques son 100% reciclables ♻️ habremos avanzado en SOSTENIBILIDAD y les podremos ofrecer una segunda vida. 🌎🌱",
                imgs:["https://www.barruca.es/images/blog/mercado.png","https://www.barruca.es/images/blog/mercado2.png"] },
        "6":  { cat:"Salud",        titulo:"Centro de Salud en El Ejido",
                hero:"https://www.barruca.es/images/blog/el-ejido-Recorte.jpg",
                texto:"Estamos dando vida a un nuevo y moderno Centro de Salud en El Ejido, Almería. Construyendo con nuestro ladrillo caravista coupe. ORDAZ Arquitectura + Ingeniería · Vialterra Infraestructuras. #andalucía #apae #salud #construccion #hormigon #prefabricado #SaludEnElEjido #Almería #ConstruyendoElFuturo",
                imgs:["https://www.barruca.es/images/blog/IMG_5892.jpg","https://www.barruca.es/images/blog/IMG_5947.jpg"] },
        "7":  { cat:"Arquitectura", titulo:"Conservatorio de Danza Kina Jiménez",
                hero:"https://www.barruca.es/images/blog/kinaRecorte.jpeg",
                texto:"Puesta de largo del conservatorio Kina Jiménez, ¡Nos sentimos realmente satisfechos de formar parte de esta iniciativa tan especial! Con nuestro ladrillo coupe caravista, hemos contribuido a este proyecto de manera significativa, aportando todas las ventajas que ofrece a la construcción. Con ANFRASA Construcción.<br><a href='https://www.lavozdealmeria.com/noticia/9/opinion/216667/nuevo-conservatorio-de-danza-para-almeria' target='_blank' rel='noopener'>La Voz de Almería</a> · @apae_andalucia @fresnedazamora @javiercallejas_ #ConservatorioKinaJiménez #LadrilloCoupe #Almería",
                imgs:["https://www.barruca.es/images/blog/kina1.jpg","https://www.barruca.es/images/blog/kina2.jpg","https://www.barruca.es/images/blog/foto1.jpg","https://www.barruca.es/images/blog/foto2.jpg"] },
        "8":  { cat:"Aniversario",  titulo:"35 Aniversario de Bloques Barruca",
                hero:"https://www.barruca.es/images/anuncio.jpeg",
                texto:"Celebramos 35 años de trayectoria brindando calidad y confianza en cada uno de nuestros productos. 🧱 35 años en los que hemos tenido el honor de colaborar con grandes profesionales de la construcción en Burgos y toda España. Gracias a nuestros clientes, empleados y colaboradores que han sido parte de este camino, ¡por 35 años más construyendo juntos! 💪🏼 #Aniversario #35Años #ConstruyendoFuturo #BloquesBarruca #OrgullosamenteBurgaleses",
                imgs:["https://www.barruca.es/images/blog/aniversario.jpg","https://www.barruca.es/images/blog/aniversario2.jpg"] },
        "9":  { cat:"Arquitectura", titulo:"Nuevo Ladrillo Coupe Caravista",
                hero:"https://www.barruca.es/images/blog/NuevoLadrilloCoupe.png",
                texto:"<p>Descubre el ladrillo Coupe Caravista — Diseñado para destacar, construido para durar. Con su acabado elegante y resistente, el ladrillo Coupe Caravista es la elección perfecta para fachadas con estilo propio. Ideal para proyectos que buscan un equilibrio entre estética y durabilidad. 🏗️ Fabricado con precisión. 🌦️ Resistente a la intemperie. 🌱 Sostenible y de bajo mantenimiento. 📽️ Dale al play y comprueba por qué el Coupe Caravista marca la diferencia en cada obra.</p><iframe src='https://www.youtube.com/embed/1aXI1_p2sGg' title='Ladrillo coupe' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>",
                imgs:["https://www.barruca.es/images/blog/LadrilloCoupe.png"] },
        "10": { cat:"Arquitectura", titulo:"Congreso Proyecta y Construye",
                hero:"https://www.barruca.es/images/blog/Ciclo-Proyecta-construye.png",
                texto:"<p>Paco Barruca, en representación de Bloques Barruca, participó en el Foro Técnico de Construcción Sostenible y Prefabricada, organizado por ANDECE. En este encuentro intervino junto al arquitecto Enrique Jerez, con quien compartió una ponencia sobre el papel de los bloques prefabricados en la construcción de viviendas, destacando sus ventajas en sostenibilidad, eficiencia y calidad. 🌍 💡 Una ocasión única para seguir poniendo en valor la innovación y el compromiso de la construcción industrializada con el futuro de nuestro sector.</p>",
                imgs:["https://www.barruca.es/images/blog/Ciclo-Proyecta-construye1.png","https://www.barruca.es/images/blog/congreso1.jpeg"] },
        "11": { cat:"Ciclos",       titulo:"Ciclo de Conferencias ANDECE",
                hero:"https://www.barruca.es/images/blog/congreso2.png",
                texto:"<p>¡Por si te lo perdiste! Puedes volver a ver en el canal de ANDECE el vídeo del ciclo de conferencias, en el que expertos de la industria comparten sus conocimientos y experiencias sobre el uso de bloques prefabricados en la construcción. Desde las ventajas y aplicaciones hasta las últimas innovaciones.</p><iframe src='https://www.youtube.com/embed/ru2YLHw2Las' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>",
                imgs:[] },
        "12": { cat:"Ciclos",       titulo:"Foro ANDECE — Construcción Sostenible y Prefabricada",
                hero:"https://www.barruca.es/images/blog/cicloAndece.png",
                texto:"<p>Francisco Barruca, en representación de Bloques Barruca, participó en el Foro Técnico de Construcción Sostenible y Prefabricada, organizado por ANDECE. En este encuentro intervino junto al arquitecto Enrique Jerez, con quien compartió una ponencia sobre el papel de los bloques prefabricados en la construcción de viviendas, destacando sus ventajas en sostenibilidad, eficiencia y calidad. 🌍 💡 Intervención de Enrique Jerez (Jerez Arquitectos), acompañado de Francisco Ibáñez (BLOQUES BARRUCA).</p><iframe src='https://www.youtube.com/embed/wm3uQPBQlFM' title='Ciclo ANDECE' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>",
                imgs:[] }
      };

      var modal  = document.getElementById('blog-modal');
      var heroEl = document.getElementById('blog-modal-hero');
      var bodyEl = document.getElementById('blog-modal-body');
      var bd     = document.getElementById('blog-modal-bd');
      if (!modal) return;

      function openPost(id) {
        var p = POSTS[String(id)];
        if (!p) return;
        heroEl.innerHTML = '<img src="' + p.hero + '" alt="' + p.titulo + '" loading="lazy">';
        var validImgs = (p.imgs || []).filter(Boolean);
        var colClass = validImgs.length <= 1 ? 'cols-1' : 'cols-2';
        var imgsHtml = validImgs.length
          ? '<div class="bm-imgs ' + colClass + '">' + validImgs.map(function(s){ return '<img src="' + s + '" alt="' + p.titulo + ' — Bloques Barruca" loading="lazy">'; }).join('') + '</div>'
          : '';
        bodyEl.innerHTML =
          '<span style="font-size:.625rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#b91c1c">' + p.cat + '</span>' +
          '<h2 id="bm-title">' + p.titulo + '</h2>' +
          '<div class="bm-text">' + p.texto + '</div>' +
          imgsHtml;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        modal.scrollTop = 0;
      }

      function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        bodyEl.innerHTML = '';
        heroEl.innerHTML = '';
      }

      document.getElementById('blog-modal-close').addEventListener('click', closeModal);
      bd.addEventListener('click', closeModal);
      document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

      document.querySelectorAll('[data-post]').forEach(function(card) {
        card.addEventListener('click', function() { openPost(this.dataset.post); });
      });
    })();

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
