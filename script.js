/* ==========================================================================
   AAVEG / INDUCTIONS 2026 — script.js
   Plain vanilla JavaScript. No libraries, no build step.

   SECTIONS
   1. Helpers
   2. Broken-image fallback
   3. Carousel (intro + every team page)
   4. Fit-text (keeps giant headings inside the screen)
   5. Reveal-on-scroll
   6. Intro -> team selection (index.html)
   7. Back button (team pages)
   8. Apply buttons (placeholder guard)
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SCROLL_KEY = "aaveg:teamsScroll";

  /* ---------- 1. Helpers ---------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function store(key, val) {
    try { sessionStorage.setItem(key, val); } catch (e) { /* storage may be blocked: ignore */ }
  }
  function read(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }

  /* ---------- 2. Broken-image fallback ----------
     If a picture can't load, show a labelled dark panel instead of a broken-image icon. */
  function markBroken(img) {
    var holder = img.closest(".photo") || img.parentElement;
    if (!holder || holder.classList.contains("img-broken")) return;
    holder.classList.add("img-broken");
    var box = document.createElement("div");
    box.className = "fallback label";
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", img.alt || "Image unavailable");
    box.innerHTML = '<span class="label--orange">IMAGE UNAVAILABLE</span><span></span>';
    box.lastChild.textContent = img.alt || "";
    holder.appendChild(box);
  }
  document.addEventListener("error", function (e) {
    if (e.target && e.target.tagName === "IMG") markBroken(e.target);
  }, true);
  function checkImages() {
    $all("img").forEach(function (img) {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) markBroken(img);
    });
  }

  /* ---------- 3. Carousel ----------
     Markup: <div class="carousel" data-carousel data-autoplay="5000"> ... .slide elements ...
     - data-autoplay="ms" turns on auto progression (omit it for manual-only)
     - buttons, dots and counter are created here so the HTML stays short. */
  function Carousel(root) {
    var self = this;
    this.root = root;
    this.slides = $all(".slide", root);
    this.index = 0;
    this.delay = parseInt(root.getAttribute("data-autoplay"), 10) || 0;
    this.canPlay = this.delay > 0 && !reduceMotion;
    this.playing = this.canPlay;
    this.timer = null;
    this.hoverPaused = false;
    this.focusPaused = false;
    if (this.slides.length < 2) return;

    var total = this.slides.length;
    this.slides.forEach(function (s, i) {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute("aria-label", i + 1 + " of " + total);
    });
    root.setAttribute("role", "region");
    root.setAttribute("aria-roledescription", "carousel");
    $(".carousel__viewport", root).setAttribute("aria-live", this.playing ? "off" : "polite");

    // Controls (marked data-no-nav so they never trigger intro navigation)
    var ui = document.createElement("div");
    ui.className = "carousel__ui";
    ui.setAttribute("data-no-nav", "");
    ui.innerHTML =
      '<span class="carousel__count" aria-hidden="true"><b>01</b>/ ' + pad2(total) + "</span>" +
      (this.canPlay ? '<button type="button" class="carousel__btn carousel__btn--text" data-act="toggle" aria-label="Pause automatic slides">PAUSE</button>' : "") +
      '<button type="button" class="carousel__btn" data-act="prev" aria-label="Previous slide">&larr;</button>' +
      '<button type="button" class="carousel__btn" data-act="next" aria-label="Next slide">&rarr;</button>';
    root.appendChild(ui);
    this.countEl = $(".carousel__count b", ui);
    this.toggleBtn = $('[data-act="toggle"]', ui);

    var dots = document.createElement("div");
    dots.className = "carousel__dots";
    dots.setAttribute("data-no-nav", "");
    this.dots = this.slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "carousel__dot";
      b.setAttribute("aria-label", "Go to slide " + (i + 1));
      b.addEventListener("click", function () { self.go(i, true); });
      dots.appendChild(b);
      return b;
    });
    root.appendChild(dots);

    ui.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      if (act === "prev") self.go(self.index - 1, true);
      else if (act === "next") self.go(self.index + 1, true);
      else if (act === "toggle") self.setPlaying(!self.playing);
    });

    // Keyboard arrows while focus is inside the carousel
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { self.go(self.index - 1, true); e.preventDefault(); }
      if (e.key === "ArrowRight") { self.go(self.index + 1, true); e.preventDefault(); }
    });

    // Touch / pen / mouse swipe
    var startX = 0, startY = 0, tracking = false, moved = false;
    root.addEventListener("pointerdown", function (e) {
      if (e.target.closest("[data-no-nav]")) return;
      tracking = true; moved = false; startX = e.clientX; startY = e.clientY;
    });
    root.addEventListener("pointermove", function (e) {
      if (tracking && Math.abs(e.clientX - startX) > 10) moved = true;
    });
    function end(e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
        self.go(self.index + (dx < 0 ? 1 : -1), true);
      }
      if (moved) {
        // A swipe must not count as a "tap to continue"
        root.setAttribute("data-swiped", "1");
        setTimeout(function () { root.removeAttribute("data-swiped"); }, 400);
      }
    }
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", function () { tracking = false; });

    // Pause while the pointer or keyboard focus is on the carousel
    // (Only *keyboard* focus pauses it. A tap on a button leaves focus behind on phones, which must not stop the slides.)
    // Hover pause is for real mice only: on touch screens "hover" sticks after a tap.
    root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { self.hoverPaused = true; self.schedule(); } });
    root.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { self.hoverPaused = false; self.schedule(); } });
    root.addEventListener("focusin", function (e) {
      var kb = false;
      try { kb = e.target.matches(":focus-visible"); } catch (err) { kb = false; }
      self.focusPaused = kb; self.schedule();
    });
    root.addEventListener("focusout", function () { self.focusPaused = false; self.schedule(); });
    document.addEventListener("visibilitychange", function () { self.schedule(); });

    this.go(0, false);
    this.schedule();
  }
  Carousel.prototype.go = function (i, userAction) {
    var n = this.slides.length;
    this.index = (i + n) % n;
    var idx = this.index;
    this.slides.forEach(function (s, k) {
      var on = k === idx;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
    });
    this.dots.forEach(function (d, k) {
      if (k === idx) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
    this.countEl.textContent = pad2(idx + 1);
    if (userAction) this.schedule();
  };
  Carousel.prototype.setPlaying = function (on) {
    this.playing = on;
    if (this.toggleBtn) {
      this.toggleBtn.textContent = on ? "PAUSE" : "PLAY";
      this.toggleBtn.setAttribute("aria-label", on ? "Pause automatic slides" : "Play automatic slides");
    }
    $(".carousel__viewport", this.root).setAttribute("aria-live", on ? "off" : "polite");
    this.schedule();
  };
  Carousel.prototype.schedule = function () {
    var self = this;
    clearTimeout(this.timer);
    if (!this.playing || this.hoverPaused || this.focusPaused || document.hidden || !this.canPlay) return;
    this.timer = setTimeout(function () {
      self.go(self.index + 1, false);
      self.schedule();
    }, this.delay);
  };
  var carousels = $all("[data-carousel]").map(function (el) { return new Carousel(el); });

  /* ---------- 4. Fit-text ----------
     Any element with data-fit is shrunk (if needed) so it never spills sideways,
     whichever font ends up loading. */
  function fitAll() {
    $all("[data-fit]").forEach(function (el) {
      el.style.fontSize = "";
      var avail = el.clientWidth;
      if (!avail) return; // element is hidden right now (e.g. the intro after it has slid away)
      var guard = 60;
      var size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > avail + 1 && guard-- > 0) {
        size *= 0.97;
        el.style.fontSize = size + "px";
      }
    });
  }
  var fitTimer;
  window.addEventListener("resize", function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitAll, 120);
  });

  /* ---------- 5. Reveal-on-scroll ---------- */
  function setupReveal() {
    var els = $all(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. Intro -> team selection (index.html only) ---------- */
  var intro = $("#intro");
  var teams = $("#teams");
  if (intro && teams) {
    var view = "intro";

    function setView(next, opts) {
      opts = opts || {};
      var instant = opts.instant || reduceMotion;
      view = next;
      if (next === "teams") {
        document.body.style.overflow = "";
        teams.removeAttribute("inert");
        teams.removeAttribute("aria-hidden");
        intro.setAttribute("inert", "");
        if (instant) {
          intro.hidden = true;
        } else {
          intro.classList.add("is-leaving");
          setTimeout(function () { if (view === "teams") intro.hidden = true; }, 950);
        }
        var saved = opts.restoreScroll ? parseInt(read(SCROLL_KEY), 10) : 0;
        window.scrollTo(0, saved || 0);
        var h = $("#teams-heading");
        if (h && !opts.restoreScroll) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      } else {
        intro.hidden = false;
        intro.removeAttribute("inert");
        document.body.style.overflow = "hidden";
        teams.setAttribute("inert", "");
        teams.setAttribute("aria-hidden", "true");
        // force a reflow so the slide-down transition plays
        void intro.offsetWidth;
        intro.classList.remove("is-leaving");
        window.scrollTo(0, 0);
        fitAll();
      }
    }

    function goToTeams() {
      if (view === "teams") return;
      history.pushState({ view: "teams" }, "", "#teams");
      setView("teams");
    }
    function goToIntro() {
      if (location.hash === "#teams" && history.state && history.state.view === "teams") history.back();
      else { history.replaceState(null, "", location.pathname + location.search); setView("intro"); }
    }

    // Tap / click anywhere on the intro, except on controls
    intro.addEventListener("click", function (e) {
      if (e.target.closest("[data-no-nav]")) return;
      if (e.target.closest("[data-swiped]")) return;
      goToTeams();
    });
    // Keyboard: the real button, plus Enter / Space anywhere that is not a control
    $("#continue-btn").addEventListener("click", function (e) { e.stopPropagation(); goToTeams(); });
    document.addEventListener("keydown", function (e) {
      if (view !== "intro") return;
      var onControl = e.target.closest && e.target.closest("button, a, [data-carousel]");
      if ((e.key === "Enter" || e.key === " ") && !onControl) { e.preventDefault(); goToTeams(); }
    });

    $("#to-intro").addEventListener("click", goToIntro);
    var toIntroFoot = $("#to-intro-foot");
    if (toIntroFoot) toIntroFoot.addEventListener("click", goToIntro);

    window.addEventListener("popstate", function () {
      if (location.hash === "#teams") setView("teams", { instant: true, restoreScroll: true });
      else setView("intro", {});
    });

    // Remember scroll position so BACK from a team page lands in the same place
    function saveScroll() { if (view === "teams") store(SCROLL_KEY, String(window.scrollY)); }
    window.addEventListener("pagehide", saveScroll);
    $all(".team-card").forEach(function (c) { c.addEventListener("click", saveScroll); });
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    // Initial state: #teams opens the team screen directly (used by BACK buttons)
    if (location.hash === "#teams") {
      history.replaceState({ view: "teams" }, "", "#teams");
      setView("teams", { instant: true, restoreScroll: true });
    } else {
      setView("intro", {});
    }
  }

  /* ---------- 7. Back button (team pages) ----------
     Prefer real browser history (keeps the team screen's scroll position).
     If the visitor arrived some other way, go to index.html#teams. */
  var back = $("#back-btn");
  if (back) {
    back.addEventListener("click", function (e) {
      e.preventDefault();
      var cameFromIndex = false;
      try {
        var ref = document.referrer ? new URL(document.referrer) : null;
        cameFromIndex = !!ref && ref.origin === location.origin && /(^|\/)(index\.html)?$/.test(ref.pathname);
      } catch (err) { cameFromIndex = false; }
      if (cameFromIndex && history.length > 1) history.back();
      else window.location.href = back.getAttribute("href");
    });
  }

  /* ---------- 8. Apply buttons ----------
     A button counts as PLACEHOLDER (and is safely disabled) when:
       - its link still points at example.com, or
       - it has data-apply="off".
     To switch one on: put the real form URL in its href and delete data-apply="off". */
  $all(".apply-btn").forEach(function (btn) {
    var href = btn.getAttribute("href") || "";
    var off = btn.getAttribute("data-apply") === "off" || /^https?:\/\/([^/]*\.)?example\.(com|org|net)/i.test(href);
    var wrap = btn.closest(".apply");
    var status = wrap ? $(".apply__status", wrap) : null;
    var note = wrap ? $(".apply__note", wrap) : null;
    if (off) {
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("data-placeholder", "true");
      btn.removeAttribute("target");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (status) status.textContent = "PLACEHOLDER LINK. APPLICATIONS ARE NOT OPEN YET.";
      });
    } else {
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener noreferrer");
      if (note) note.hidden = true;
    }
  });

  /* ---------- Start-up ---------- */
  document.documentElement.classList.add("js");
  function init() {
    checkImages();
    setupReveal();
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    window.addEventListener("load", function () { checkImages(); fitAll(); });
    // Handle the page being restored from the browser's back/forward cache
    window.addEventListener("pageshow", function (e) { if (e.persisted) fitAll(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
