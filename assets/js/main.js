(function () {
  'use strict';

  /* 行動版主選單 */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('main-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
      document.body.classList.toggle('nav-open', open);
    });
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });
  }

  /* 下拉子選單：點擊／鍵盤切換；桌機另有 hover */
  var toggles = document.querySelectorAll('.nav-toggle');
  Array.prototype.forEach.call(toggles, function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      Array.prototype.forEach.call(toggles, function (b) {
        b.setAttribute('aria-expanded', 'false');
        b.parentNode.classList.remove('is-open');
      });
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      btn.parentNode.classList.toggle('is-open', !expanded);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub')) {
      Array.prototype.forEach.call(toggles, function (b) {
        b.setAttribute('aria-expanded', 'false');
        b.parentNode.classList.remove('is-open');
      });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      Array.prototype.forEach.call(toggles, function (b) {
        b.setAttribute('aria-expanded', 'false');
        b.parentNode.classList.remove('is-open');
      });
      if (nav && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        menuBtn.focus();
      }
    }
  });

  /* 行動版輪播分頁圓點（桌機為格線，輪播僅在窄版生效） */
  var mq = window.matchMedia('(max-width: 767px)');
  var carousels = document.querySelectorAll('[data-carousel]');

  function buildDots(carousel) {
    var track = carousel.querySelector('.carousel-track');
    var dots = carousel.querySelector('.carousel-dots');
    if (!track || !dots) return;
    var items = track.children;
    dots.innerHTML = '';
    if (!mq.matches || items.length < 2) return;

    Array.prototype.forEach.call(items, function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 項');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: 'smooth' });
      });
      dots.appendChild(b);
    });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var idx = 0, min = Infinity;
        Array.prototype.forEach.call(items, function (item, i) {
          var d = Math.abs(item.offsetLeft - track.offsetLeft - track.scrollLeft);
          if (d < min) { min = d; idx = i; }
        });
        Array.prototype.forEach.call(dots.children, function (d, i) {
          d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
        });
        ticking = false;
      });
    }, { passive: true });
  }

  Array.prototype.forEach.call(carousels, buildDots);
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      Array.prototype.forEach.call(carousels, buildDots);
    }, 150);
  });

  /* 回頂端：出現時機 */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var onScroll = function () {
      toTop.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
