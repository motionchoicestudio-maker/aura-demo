/* AURA Dental — front-end behaviour. Requires GSAP + ScrollTrigger (enqueued before this file). */
(function () {
	'use strict';
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var hasGsap = typeof gsap !== 'undefined';
	var ease = 'expo.out';
	if (hasGsap && typeof ScrollTrigger !== 'undefined') { gsap.registerPlugin(ScrollTrigger); }

	/* Reveals: [data-aura-reveal] (left | right | up). Staggered inside [data-aura-stagger]. CSS does the motion, IO flips the class. */
	function reveals() {
		document.documentElement.classList.add('aura-js');
		var all = document.querySelectorAll('[data-aura-reveal]');
		if (reduce || !('IntersectionObserver' in window)) { all.forEach(function (el) { el.classList.add('is-in'); }); return; }
		document.querySelectorAll('[data-aura-stagger]').forEach(function (group) {
			group.querySelectorAll('[data-aura-reveal]').forEach(function (el, i) { el.style.setProperty('--aura-delay', (i * 0.1) + 's'); });
		});
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
		}, { rootMargin: '0px 0px -10% 0px' });
		all.forEach(function (el) { io.observe(el); });
		setTimeout(function () { all.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } }); }, 1500);
	}

	/* Hero headline: word by word blur-in. */
	function heroWords() {
		var h = document.querySelector('[data-aura-words]');
		if (!h) { return; }
		var walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
		var nodes = [];
		while (walker.nextNode()) { nodes.push(walker.currentNode); }
		nodes.forEach(function (n) {
			var frag = document.createDocumentFragment();
			n.textContent.split(/(\s+)/).forEach(function (part) {
				if (!part) { return; }
				if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
				var s = document.createElement('span'); s.className = 'aura-w'; s.style.display = 'inline-block'; s.textContent = part; frag.appendChild(s);
			});
			n.parentNode.replaceChild(frag, n);
		});
		if (!hasGsap || reduce) { return; }
		var words = h.querySelectorAll('.aura-w');
		gsap.from(words, { opacity: 0, y: 40, filter: 'blur(8px)', duration: 0.95, ease: ease, stagger: 0.07, delay: 0.1 });
		setTimeout(function () { gsap.set(words, { clearProps: 'all' }); }, 2600);
		var tooth = document.querySelector('[data-aura-tilt]');
		if (tooth) { gsap.from(tooth, { y: 110, opacity: 0, duration: 1.1, ease: 'back.out(1.2)', delay: 0.4, onComplete: function () { gsap.set(tooth, { clearProps: 'opacity' }); } }); setTimeout(function () { gsap.set(tooth, { clearProps: 'opacity,y' }); }, 2600); }
	}

	/* Hero tooth: cursor tilt. */
	function tilt() {
		var el = document.querySelector('[data-aura-tilt]');
		if (!el || !hasGsap || reduce || !window.matchMedia('(hover: hover)').matches) { return; }
		var qx = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' }), qy = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
		var mx = gsap.quickTo(el, 'x', { duration: 0.6 }), my = gsap.quickTo(el, 'y', { duration: 0.6 });
		gsap.set(el, { transformPerspective: 900 });
		var drift = [];
		document.querySelectorAll('.aura-hero__sat-chip').forEach(function (p) { drift.push([gsap.quickTo(p, 'x', { duration: 0.8 }), gsap.quickTo(p, 'y', { duration: 0.8 }), 54]); });
		document.querySelectorAll('.aura-hero__sat-dot').forEach(function (p) { drift.push([gsap.quickTo(p, 'x', { duration: 0.8 }), gsap.quickTo(p, 'y', { duration: 0.8 }), 74]); });
		window.addEventListener('mousemove', function (e) {
			var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
			qx(nx * 16); qy(-ny * 13); mx(-nx * 30); my(-ny * 26);
			drift.forEach(function (d) { d[0](nx * d[2]); d[1](ny * d[2] * 0.8); });
		});
	}

	/* Count-up on [data-aura-count]: parses prefix + number + suffix ("14+", "2.4k", "98%", "24/7"). */
	function counters() {
		document.querySelectorAll('[data-aura-count]').forEach(function (el) {
			var m = el.textContent.trim().match(/^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/);
			if (!m || reduce) { return; }
			var target = parseFloat(m[2].replace(',', '.')), dec = (m[2].split(/[.,]/)[1] || '').length;
			var run = function () {
				var t0 = performance.now(), dur = 1400;
				var tick = function (t) {
					var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
					el.textContent = m[1] + (target * e).toFixed(dec) + m[3];
					if (p < 1) { requestAnimationFrame(tick); }
				};
				requestAnimationFrame(tick);
			};
			if ('IntersectionObserver' in window) {
				var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
				io.observe(el);
			} else { run(); }
		});
	}

	/* Scroll-driven word reveal on [data-aura-words-scroll]. */
	function wordsScroll() {
		document.querySelectorAll('[data-aura-words-scroll]').forEach(function (p) {
			var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), nodes = [];
			while (walker.nextNode()) { nodes.push(walker.currentNode); }
			nodes.forEach(function (n) {
				var frag = document.createDocumentFragment();
				n.textContent.split(/(\s+)/).forEach(function (part) {
					if (!part) { return; }
					if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
					var s = document.createElement('span'); s.className = 'aura-word'; s.textContent = part; frag.appendChild(s);
				});
				n.parentNode.replaceChild(frag, n);
			});
			var words = p.querySelectorAll('.aura-word');
			if (reduce) { words.forEach(function (w) { w.classList.add('is-on'); }); return; }
			var update = function () {
				var r = p.getBoundingClientRect(), vh = window.innerHeight;
				var prog = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.45)));
				var n = Math.round(prog * words.length);
				words.forEach(function (w, i) { w.classList.toggle('is-on', i < n); });
			};
			window.addEventListener('scroll', update, { passive: true }); update();
		});
	}

	/* Reviews slider. */
	function reviews() {
		document.querySelectorAll('[data-aura-reviews]').forEach(function (root) {
			var items = root.querySelectorAll('.aura-review'), dots = root.querySelectorAll('.aura-reviews__dots button'), i = 0, timer;
			var go = function (n) {
				i = (n + items.length) % items.length;
				items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
				dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
			};
			var start = function () { clearInterval(timer); if (!reduce) { timer = setInterval(function () { go(i + 1); }, 3500); } };
			dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); start(); }); });
			start();
		});
	}

	/* Doctors filter chips (client side, by specialty slug in data attribute). */
	function doctorFilter() {
		var bar = document.querySelector('[data-aura-filter]');
		if (!bar) { return; }
		var cards = document.querySelectorAll('[data-aura-filter-target] .aura-doctor');
		bar.querySelectorAll('button').forEach(function (b) {
			b.addEventListener('click', function () {
				var f = b.getAttribute('data-filter');
				bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
				cards.forEach(function (c) {
					var cls = (c.closest('li') || c).className;
					c.style.display = (f === 'all' || cls.indexOf('aura_specialty-' + f) > -1) ? '' : 'none';
				});
			});
		});
	}

	/* Services rail scroll-spy + About chapters (shared: [data-aura-spy] items point at ids). */
	function spy() {
		var links = document.querySelectorAll('[data-aura-spy]');
		if (!links.length) { return; }
		var targets = Array.prototype.map.call(links, function (l) { return document.getElementById(l.getAttribute('data-aura-spy')); }).filter(Boolean);
		var visuals = document.querySelectorAll('[data-aura-visual]');
		var set = function (id) {
			links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-aura-spy') === id); });
			targets.forEach(function (t) { t.classList.toggle('is-active', t.id === id); });
			visuals.forEach(function (v) { v.classList.toggle('is-active', v.getAttribute('data-aura-visual') === id); });
		};
		var update = function () {
			var best = targets[0], line = window.innerHeight * 0.4;
			targets.forEach(function (t) { if (t.getBoundingClientRect().top <= line) { best = t; } });
			if (best) { set(best.id); }
		};
		window.addEventListener('scroll', update, { passive: true }); update();
	}

	document.addEventListener('DOMContentLoaded', function () {
		heroWords(); tilt(); reveals(); counters(); wordsScroll(); reviews(); doctorFilter(); spy();
	});
})();
