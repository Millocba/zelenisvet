document.documentElement.classList.add('js');

(function () {
  'use strict';

  var menuToggle = document.getElementById('menu-toggle');
  var mainNav = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      var open = mainNav.classList.toggle('active');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mainNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
  }

  var header = document.getElementById('site-header');
  var onScroll = function () {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    var toggleTop = function () {
      backToTop.classList.toggle('show', window.scrollY > 600);
    };
    window.addEventListener('scroll', toggleTop, { passive: true });
    toggleTop();
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
    }
  }

  var form = document.getElementById('contactForm');
  var responseBox = document.getElementById('respuesta');
  var submitBtn = document.getElementById('enviar-btn');

  if (!form) return;

  var lastToken = '';

  function setResponse(msg, isError) {
    if (!responseBox) return;
    if (msg === '' && !isError) {
      responseBox.className = 'form-response';
      return;
    }
    responseBox.textContent = msg;
    responseBox.className = 'form-response ' + (isError ? 'form-response--error' : 'form-response--ok');
  }

  function loadToken() {
    return fetch('enviar.php?action=token', { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('token');
        return res.json();
      })
      .then(function (data) {
        lastToken = data.csrf_token;
        form.elements['csrf'].value = data.csrf_token;
        if (submitBtn) submitBtn.disabled = false;
      })
      .catch(function () {
        setResponse('Hubo un error al conectar con el servidor. Escribinos directamente a informacion@zelenisvet.com.ar', true);
      });
  }

  if (submitBtn) submitBtn.disabled = true;
  loadToken();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setResponse('', false);
    if (submitBtn) submitBtn.disabled = true;

    fetch('enviar.php', {
      method: 'POST',
      body: new FormData(form)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw { message: data.message || 'Hubo un error al enviar el mensaje.' };
          return data.message;
        });
      })
      .then(function (msg) {
        setResponse(msg, false);
        form.reset();
        form.elements['csrf'].value = lastToken;
      })
      .catch(function (err) {
        setResponse(err.message || 'Hubo un error al enviar el mensaje. Escribinos directamente a informacion@zelenisvet.com.ar', true);
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();