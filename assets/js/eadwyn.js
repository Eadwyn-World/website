(function () {
  'use strict';

  // Mobile menu
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Statements fade up one per scroll stop
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || reduced) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  // Grow-on-scroll: vines and roots draw via stroke-dashoffset tied to progress
  var growers = document.querySelectorAll('[data-grow]');
  if (growers.length && !reduced) {
    // stroke-drawn paths (Manifesto vine) and clip-revealed svgs (dashed home root)
    var paths = [];
    growers.forEach(function (svg) {
      svg.querySelectorAll('path.grow').forEach(function (p) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        paths.push({ path: p, len: len, host: svg.closest('[data-grow-host]') || svg });
      });
    });
    var clips = document.querySelectorAll('[data-grow="clip"]');
    var leaves = document.querySelectorAll('.vine-leaf');
    if (leaves.length) leaves[0].closest('[data-grow-host]').classList.add('growing');
    var bud = document.querySelector('[data-grow-bud]');
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      clips.forEach(function (svg) {
        var r = svg.getBoundingClientRect();
        var progress = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / r.height));
        svg.style.clipPath = 'inset(0 0 ' + ((1 - progress) * 100).toFixed(2) + '% 0)';
      });
      paths.forEach(function (item) {
        var r = item.host.getBoundingClientRect();
        var progress = (vh * 0.6 - r.top) / r.height;
        progress = Math.max(0, Math.min(1, progress));
        item.path.style.strokeDashoffset = item.len * (1 - progress);
        if (item.path.hasAttribute('data-bud-path')) {
          leaves.forEach(function (leaf) {
            leaf.classList.toggle('on', parseFloat(leaf.style.top) / 100 <= progress);
          });
        }
        if (bud && item.path.hasAttribute('data-bud-path')) {
          var svg = item.path.ownerSVGElement;
          var vb = svg.viewBox.baseVal;
          var sr = svg.getBoundingClientRect();
          var pt = item.path.getPointAtLength(item.len * progress);
          bud.style.left = (sr.left - r.left + pt.x * (sr.width / vb.width)) + 'px';
          bud.style.top = (sr.top - r.top + pt.y * (sr.height / vb.height)) + 'px';
        }
      });
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // World hub: clicking a region cross-fades the side panel
  var world = document.querySelector('[data-world]');
  if (world) {
    var regions = world.querySelectorAll('[data-region]');
    var panels = world.querySelectorAll('[data-region-panel]');
    var select = function (id, focusPanel) {
      regions.forEach(function (r) {
        var on = r.getAttribute('data-region') === id;
        r.classList.toggle('active', on);
        r.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-region-panel') === id);
      });
      world.querySelectorAll('[data-path]').forEach(function (p) {
        p.classList.toggle('lit', (' ' + p.getAttribute('data-path') + ' ').indexOf(' ' + id + ' ') > -1);
      });
      if (focusPanel && window.innerWidth <= 1100) {
        var panel = world.querySelector('.world-panel');
        if (panel) panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    };
    regions.forEach(function (r) {
      r.addEventListener('click', function () { select(r.getAttribute('data-region'), true); });
      r.addEventListener('mouseleave', function () {
        var active = world.querySelector('[data-region].active');
        if (active) {
          var id = active.getAttribute('data-region');
          world.querySelectorAll('[data-path]').forEach(function (p) {
            p.classList.toggle('lit', (' ' + p.getAttribute('data-path') + ' ').indexOf(' ' + id + ' ') > -1);
          });
        }
      });
      r.addEventListener('mouseenter', function () {
        world.querySelectorAll('[data-path]').forEach(function (p) {
          p.classList.toggle('lit', (' ' + p.getAttribute('data-path') + ' ').indexOf(' ' + r.getAttribute('data-region') + ' ') > -1);
        });
      });
    });
    world.querySelectorAll('[data-go]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.getAttribute('data-go');
        select(id, false);
        if (window.history && window.history.replaceState) window.history.replaceState(null, '', '#' + id);
        var target = world.querySelector('[data-region="' + id + '"]');
        if (target) target.focus({ preventScroll: true });
      });
    });
    var initial = (window.location.hash || '').replace('#', '');
    var valid = Array.prototype.some.call(regions, function (r) { return r.getAttribute('data-region') === initial; });
    select(valid ? initial : regions[0].getAttribute('data-region'), false);
  }
  // Architecture: a diagram box and its row in "Five layers" light each other
  document.querySelectorAll('[data-arch-host]').forEach(function (host) {
    var linked = host.querySelectorAll('[data-layer]');
    linked.forEach(function (el) {
      var n = el.getAttribute('data-layer');
      var on = function (state) {
        host.querySelectorAll('[data-layer="' + n + '"]').forEach(function (m) { m.classList.toggle('lit', state); });
      };
      el.addEventListener('mouseenter', function () { on(true); });
      el.addEventListener('mouseleave', function () { on(false); });
    });
    // Knowledge roots: hovering a root tip pulses its path up to the retrieval layer
    host.querySelectorAll('.arch-node[data-tip]').forEach(function (tip) {
      var i = tip.getAttribute('data-tip');
      var path = host.querySelector('.tip-path[data-tip="' + i + '"]');
      tip.addEventListener('mouseenter', function () { tip.classList.add('lit'); if (path) path.classList.add('pulse'); });
      tip.addEventListener('mouseleave', function () { tip.classList.remove('lit'); if (path) path.classList.remove('pulse'); });
    });
  });
})();
