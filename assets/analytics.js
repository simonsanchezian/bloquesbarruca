/* Google Analytics 4 de barruca.es — ID de medición G-TX3V7KP3ZW (cuenta
 * «Bloques Barruca», creada por Ian el 06-10-2026).
 *
 * CONSENTIMIENTO. La política de cookies promete que las cookies analíticas
 * «solo se activan si el usuario acepta». Por eso Google Analytics NO se carga
 * hasta que el visitante pulsa «Aceptar todas»; antes no se envía nada a
 * Google. La elección se guarda en localStorage con la misma clave que usa
 * main.js (`barruca_cookie_consent`), así que vale para todo el sitio.
 *
 * LAS PÁGINAS SIN AVISO. Solo las 11 páginas principales llevan el aviso de
 * cookies (con main.js). Los artículos del blog y las páginas legales no, y
 * los artículos son donde aterriza la gente desde Google. Si la página no
 * tiene #cookie-banner y el visitante no ha elegido, este script pinta un
 * aviso igual (barra inferior, mismo texto y mismos botones).
 *
 * EVENTOS. Analytics ya mide por sí solo páginas, desplazamiento, clics en
 * enlaces externos y descargas de PDF (medición mejorada). Aquí se añaden los
 * que importan al negocio:
 *   generate_lead     mensaje del formulario de contacto ENVIADO (main.js lo
 *                     envía a Formspree y avisa con el evento barruca:lead)
 *   contact_whatsapp  clic en WhatsApp
 *   contact_phone     clic en un teléfono
 *   contact_email     clic en un correo
 * Marcar generate_lead como «evento clave» en Analytics.
 */
(function () {
  'use strict';
  var ID = 'G-TX3V7KP3ZW', KEY = 'barruca_cookie_consent', activo = false;

  function cargar() {
    if (activo) return;
    activo = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }
  function evento(nombre, extra) {
    if (activo && window.gtag) window.gtag('event', nombre, extra || {});
  }
  function guardar(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function leer() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  function barra() {
    var css = document.createElement('style');
    css.textContent =
      '#bb-cookies{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#fff;box-shadow:0 -8px 32px rgba(0,0,0,.18);' +
      'padding:1rem 1.25rem;display:flex;gap:1rem;align-items:center;justify-content:center;flex-wrap:wrap;font-family:inherit}' +
      '#bb-cookies p{margin:0;max-width:640px;font-size:.85rem;line-height:1.55;color:#3d3d3f}' +
      '#bb-cookies a{color:#111;font-weight:600;text-decoration:underline;text-underline-offset:2px}' +
      '#bb-cookies button{font:inherit;font-size:.85rem;font-weight:600;padding:.7rem 1.3rem;border-radius:2rem;border:0;cursor:pointer;white-space:nowrap}' +
      '#bb-cookies .si{background:#111;color:#fff}#bb-cookies .no{background:#f5f5f5;color:#111}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'bb-cookies';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Aviso de cookies');
    d.innerHTML =
      '<p>Utilizamos cookies propias y de terceros para analizar el tráfico y mejorar tu experiencia de navegación. ' +
      'Puedes modificar tus preferencias en cualquier momento. Más información en nuestra ' +
      '<a href="/politica-cookies.html">Política de cookies</a>.</p>' +
      '<button class="no" type="button">Rechazar todas</button><button class="si" type="button">Aceptar todas</button>';
    document.body.appendChild(d);
    d.querySelector('.si').addEventListener('click', function () { guardar('accepted'); d.remove(); cargar(); });
    d.querySelector('.no').addEventListener('click', function () { guardar('rejected'); d.remove(); });
  }

  function iniciar() {
    // Si ya aceptó en cualquier página del sitio, se carga desde el primer momento
    if (leer() === 'accepted') cargar();
    else if (!leer()) {
      var propio = document.getElementById('cookie-banner');
      if (propio) {
        // Aviso de main.js: se engancha al botón para cargar en el momento
        var ok = document.getElementById('cookie-accept');
        if (ok) ok.addEventListener('click', cargar);
      } else if (!/politica-cookies/.test(location.pathname)) barra();
    }

    // Eventos de negocio (solo se envían si hay consentimiento)
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)/.test(h)) evento('contact_whatsapp', { link_url: h });
      else if (/^tel:/.test(h)) evento('contact_phone');
      else if (/^mailto:/.test(h)) evento('contact_email');
    }, true);
    // main.js lanza este evento solo cuando el mensaje se ha enviado de verdad
    document.addEventListener('barruca:lead', function () { evento('generate_lead', { form: 'contacto' }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
