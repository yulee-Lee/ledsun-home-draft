(function () {
  'use strict';

  var desktopMq = window.matchMedia('(min-width: 1024px)');
  var phoneMq = window.matchMedia('(max-width: 767px)');

  /* --------------------------------------------------------------------------
     行動版主選單（側滑）：開啟時主內容設 inert、焦點移入；關閉時焦點回到按鈕
     -------------------------------------------------------------------------- */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('main-nav');
  var inertTargets = document.querySelectorAll('main, footer, .mobile-bar');

  function setNav(open, restoreFocus) {
    if (!menuBtn || !nav) return;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
    Array.prototype.forEach.call(inertTargets, function (el) {
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) {
      var first = nav.querySelector('a, button');
      if (first) first.focus();
    } else if (restoreFocus) {
      menuBtn.focus({ preventScroll: true });
    }
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setNav(!nav.classList.contains('is-open'), false);
    });
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      closeAllSub();
      if (nav.classList.contains('is-open')) setNav(false, false);
    });
  }

  /* --------------------------------------------------------------------------
     下拉子選單：點擊／Enter 切換；桌機 hover 由 CSS 處理；焦點離開即收合；Esc 收合並回焦
     -------------------------------------------------------------------------- */
  var subItems = document.querySelectorAll('.has-sub');

  function setSub(li, open) {
    var btn = li.querySelector('.nav-toggle');
    li.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeAllSub() {
    Array.prototype.forEach.call(subItems, function (li) { setSub(li, false); });
  }

  Array.prototype.forEach.call(subItems, function (li) {
    var btn = li.querySelector('.nav-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = li.classList.contains('is-open');
      closeAllSub();
      setSub(li, !open);
    });
    li.addEventListener('focusout', function (e) {
      if (desktopMq.matches && !li.contains(e.relatedTarget)) setSub(li, false);
    });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && li.classList.contains('is-open')) {
        e.stopPropagation();
        setSub(li, false);
        btn.focus();
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub')) closeAllSub();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeAllSub();
    if (nav && nav.classList.contains('is-open')) setNav(false, true);
  });

  /* 跨越桌機斷點時重設選單狀態，避免桌機殘留側滑開啟或 inert */
  desktopMq.addEventListener('change', function () {
    closeAllSub();
    if (nav && nav.classList.contains('is-open')) setNav(false, false);
  });

  /* --------------------------------------------------------------------------
     頁首捲動陰影
     -------------------------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onHeaderScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  /* --------------------------------------------------------------------------
     行動版輪播：scroll-snap 由 CSS 負責；此處只做分頁圓點與無障礙屬性
     - 捲動監聽只綁一次；圓點只在跨越 767 斷點時重建
     - 位置計算扣除軌道左側 padding，與 scroll-padding-inline 對齊
     -------------------------------------------------------------------------- */
  var carousels = document.querySelectorAll('[data-carousel]');

  function setupCarousel(carousel) {
    var track = carousel.querySelector('.carousel-track');
    var dots = carousel.querySelector('.carousel-dots');
    if (!track || !dots) return;
    var items = track.children;

    function pad() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }

    function currentIndex() {
      var idx = 0, min = Infinity, p = pad();
      Array.prototype.forEach.call(items, function (item, i) {
        var d = Math.abs(item.offsetLeft - track.offsetLeft - p - track.scrollLeft);
        if (d < min) { min = d; idx = i; }
      });
      return idx;
    }

    function syncDots() {
      var idx = currentIndex();
      Array.prototype.forEach.call(dots.children, function (d, i) {
        if (i === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }

    function build() {
      dots.innerHTML = '';
      var phone = phoneMq.matches;
      if (phone) {
        carousel.setAttribute('role', 'region');
        carousel.setAttribute('aria-roledescription', '輪播');
        carousel.setAttribute('aria-label', dots.getAttribute('aria-label') || '');
      } else {
        carousel.removeAttribute('role');
        carousel.removeAttribute('aria-roledescription');
        carousel.removeAttribute('aria-label');
      }
      Array.prototype.forEach.call(items, function (item, i) {
        if (phone) {
          item.setAttribute('role', 'group');
          item.setAttribute('aria-label', (i + 1) + ' / ' + items.length);
        } else {
          item.removeAttribute('role');
          item.removeAttribute('aria-label');
        }
      });
      if (!phone || items.length < 2) return;

      Array.prototype.forEach.call(items, function (item, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '第 ' + (i + 1) + ' 項，共 ' + items.length + ' 項');
        b.addEventListener('click', function () {
          track.scrollTo({ left: item.offsetLeft - track.offsetLeft - pad(), behavior: 'smooth' });
        });
        dots.appendChild(b);
      });
      syncDots();
    }

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking || !dots.children.length) return;
      ticking = true;
      window.requestAnimationFrame(function () { syncDots(); ticking = false; });
    }, { passive: true });

    build();
    phoneMq.addEventListener('change', build);
  }

  Array.prototype.forEach.call(carousels, setupCarousel);

  /* --------------------------------------------------------------------------
     進場淡入：進入視窗即顯示，只觸發一次；無 IntersectionObserver 時直接全部顯示
     -------------------------------------------------------------------------- */
  var revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    Array.prototype.forEach.call(revealTargets, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(revealTargets, function (el) { el.classList.add('is-visible'); });
  }
})();
