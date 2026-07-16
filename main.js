// Auto-update copyright year
document.getElementById('copyright-year').textContent = new Date().getFullYear();

// Mobile hamburger menu
const hamburger = document.getElementById('navHamburger');
const navMobile = document.getElementById('navMobile');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        document.getElementById('nav').classList.toggle('menu-open');
    });

    // Close menu when a link is tapped
    navMobile.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('nav').classList.remove('menu-open');
        });
    });
}

// Nav scroll + active section highlighting
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-center a');
const navSections = document.querySelectorAll('#about, #work, #pricing, #why, #faq');

function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);

    let current = '';
    navSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5 && rect.bottom > 0) {
            current = section.id;
        }
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Hero sunrise glow — grows as user scrolls down toward work preview
const heroGlow = document.getElementById('heroGlow');
const heroSection = document.querySelector('.hero');

if (heroGlow && heroSection) {
    function updateHeroGlow() {
        const scrollY = window.scrollY;
        const heroH = heroSection.offsetHeight;
        // Start full, fade out as user scrolls down
        const progress = 1 - Math.max(0, Math.min(1, scrollY / (heroH * 0.45)));
        const glowScale = 0.85 + progress * 0.35;
        heroGlow.style.opacity = progress;
        heroGlow.style.transform = `scale(${glowScale})`;
    }
    window.addEventListener('scroll', updateHeroGlow, { passive: true });
    updateHeroGlow();
}

// ——— Hero deck: snap open into a horizontal work strip on scroll ———
const heroStage = document.getElementById('heroStage');
const heroTrack = document.getElementById('heroTrack');
const heroFeature = heroStage ? heroStage.querySelector('.hero-feature') : null;
const heroCards = heroStage ? heroStage.querySelectorAll('.hero-work-card') : [];

function layoutHeroDeck() {
    if (!heroStage || !heroFeature) return;
    const cards = heroStage.querySelectorAll('.hero-work-card');
    // On mobile the strip is hidden; clear computed offsets.
    if (window.innerWidth <= 768) {
        heroTrack.style.removeProperty('--track-x');
        cards.forEach(c => c.style.removeProperty('--closed-x'));
        return;
    }
    // Measure true layout positions with the offset transforms neutralized.
    heroTrack.style.transition = 'none';
    cards.forEach(c => { c.style.transition = 'none'; });
    heroTrack.style.setProperty('--track-x', '0px');
    cards.forEach(c => c.style.setProperty('--closed-x', '0px'));

    const fr = heroFeature.getBoundingClientRect();
    const featCenter = fr.left + fr.width / 2;
    const trackX = window.innerWidth / 2 - featCenter;
    const closed = [...cards].map(card => {
        const r = card.getBoundingClientRect();
        return featCenter - (r.left + r.width / 2);
    });

    // Apply: center the bull feature, and tuck every card behind it when closed.
    heroTrack.style.setProperty('--track-x', trackX + 'px');
    cards.forEach((card, i) => card.style.setProperty('--closed-x', closed[i] + 'px'));

    // Commit without animating, then restore transitions for open/close.
    void heroTrack.offsetWidth;
    heroTrack.style.transition = '';
    cards.forEach(c => { c.style.transition = ''; });
}

function updateHeroOpen() {
    if (!heroStage) return;
    // Desktop: the deck fans open on page load (not on scroll). Mobile: stays closed.
    if (window.innerWidth <= 768) { heroStage.classList.remove('open'); return; }
    heroStage.classList.add('open');
}

// Pagination + arrows for the horizontal work strip
const heroDotsEl = document.getElementById('heroDots');
const heroPrev = document.getElementById('heroPrev');
const heroNext = document.getElementById('heroNext');
const heroAllCards = heroStage ? heroStage.querySelectorAll('.hero-feature, .hero-work-card') : [];
let heroDots = [];

function heroCardStep() {
    const first = heroStage && heroStage.querySelector('.hero-feature');
    return first ? first.offsetWidth + 24 : 1;
}

// Looping: clone the set once so the strip can wrap seamlessly
let heroOriginalCount = 0;
function setupHeroLoop() {
    if (!heroTrack || heroTrack.dataset.looped) return;
    const originals = [...heroTrack.children];
    heroOriginalCount = originals.length;
    originals.forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.remove('hero-feature');
        clone.classList.add('hero-work-card');
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('id');
        heroTrack.appendChild(clone);
    });
    heroTrack.dataset.looped = '1';
}

function heroLoopCycle() {
    return heroOriginalCount * heroCardStep();
}

// Snap scrollLeft back by one cycle once a (non-drag) scroll settles past the end
function normalizeHeroLoop() {
    if (heroTrack.classList.contains('dragging')) return;
    const cycle = heroLoopCycle();
    if (cycle > 0 && heroTrack.scrollLeft >= cycle) {
        const prev = heroTrack.style.scrollBehavior;
        heroTrack.style.scrollBehavior = 'auto';
        heroTrack.scrollLeft -= cycle;
        heroTrack.style.scrollBehavior = prev;
    }
}

function buildHeroDots() {
    if (!heroDotsEl) return;
    heroDotsEl.innerHTML = '';
    heroDots = [...heroAllCards].map((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to work ' + (i + 1));
        dot.addEventListener('click', () => { pauseHeroAuto(900); heroTrack.scrollTo({ left: i * heroCardStep(), behavior: 'smooth' }); });
        heroDotsEl.appendChild(dot);
        return dot;
    });
}

function updateHeroPager() {
    if (!heroTrack || !heroDots.length) return;
    const count = heroOriginalCount || heroDots.length;
    const raw = Math.round(heroTrack.scrollLeft / heroCardStep());
    const idx = ((raw % count) + count) % count;
    heroDots.forEach((d, i) => d.classList.toggle('active', i === idx));
    // Looping: forward always available; backward bounded at the start
    if (heroPrev) heroPrev.disabled = heroTrack.scrollLeft <= 2;
    if (heroNext) heroNext.disabled = false;
}

// ——— Hero strip: slow auto-scroll once open, crawl on hover ———
let heroHovering = false;
let heroAutoPos = null;
let heroAutoPaused = false;
let heroAutoPauseTimer;

function pauseHeroAuto(ms) {
    heroAutoPaused = true;
    heroAutoPos = null;
    clearTimeout(heroAutoPauseTimer);
    heroAutoPauseTimer = setTimeout(() => { heroAutoPaused = false; }, ms);
}

function heroAutoScroll() {
    if (heroStage && heroTrack) {
        const dragging = heroTrack.classList.contains('dragging');
        const active = heroStage.classList.contains('open') && !dragging && !heroAutoPaused && window.innerWidth > 768;
        const r = active ? heroStage.getBoundingClientRect() : null;
        if (r && r.bottom > 0 && r.top < window.innerHeight) {
            if (heroAutoPos === null) heroAutoPos = heroTrack.scrollLeft;
            heroAutoPos += heroHovering ? 0.1 : 0.6;
            const cycle = heroLoopCycle();
            if (cycle > 0 && heroAutoPos >= cycle) heroAutoPos -= cycle;
            heroTrack.scrollLeft = heroAutoPos;
        } else if (!dragging) {
            heroAutoPos = null;
        }
    }
    requestAnimationFrame(heroAutoScroll);
}
if (heroStage && heroTrack) requestAnimationFrame(heroAutoScroll);

let heroScrollIdle;
if (heroStage) {
    setupHeroLoop();
    buildHeroDots();
    layoutHeroDeck();
    // Paint the closed deck for one frame, then fan it open so the load-in animates.
    requestAnimationFrame(() => requestAnimationFrame(updateHeroOpen));
    updateHeroPager();
    if (heroPrev) heroPrev.addEventListener('click', () => { pauseHeroAuto(900); heroTrack.scrollBy({ left: -heroCardStep(), behavior: 'smooth' }); });
    if (heroNext) heroNext.addEventListener('click', () => { pauseHeroAuto(900); heroTrack.scrollBy({ left: heroCardStep(), behavior: 'smooth' }); });
    heroTrack.addEventListener('scroll', () => {
        updateHeroPager();
        clearTimeout(heroScrollIdle);
        heroScrollIdle = setTimeout(normalizeHeroLoop, 140);
    }, { passive: true });
    window.addEventListener('resize', () => { layoutHeroDeck(); updateHeroOpen(); updateHeroPager(); });
    window.addEventListener('load', () => { layoutHeroDeck(); updateHeroPager(); });
}

// Drag-to-scroll + custom "View work" cursor for the hero work strip (mouse)
if (heroStage && heroTrack) {
    const heroCursor = document.getElementById('heroCursor');
    let down = false, startX = 0, startScroll = 0, moved = false;

    const moveCursor = (e) => {
        if (!heroCursor) return;
        heroCursor.style.left = e.clientX + 'px';
        heroCursor.style.top = e.clientY + 'px';
    };

    heroTrack.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        heroHovering = true;
        if (heroStage.classList.contains('open') && heroCursor) {
            moveCursor(e);
            heroCursor.classList.add('visible');
        }
    });

    heroTrack.addEventListener('pointerleave', () => {
        heroHovering = false;
        if (heroCursor) heroCursor.classList.remove('visible');
    });

    heroTrack.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || !heroStage.classList.contains('open')) return;
        down = true;
        moved = false;
        startX = e.clientX;
        startScroll = heroTrack.scrollLeft;
        heroTrack.classList.add('dragging');
        if (heroCursor) heroCursor.classList.add('grabbing');
        heroTrack.setPointerCapture(e.pointerId);
    });

    heroTrack.addEventListener('pointermove', (e) => {
        moveCursor(e);
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        heroTrack.scrollLeft = startScroll - dx;
        // Loop seamlessly: when we scroll past one full set, shift the reference back
        const cycle = heroLoopCycle();
        if (cycle > 0 && heroTrack.scrollLeft >= cycle) {
            startScroll -= cycle;
            heroTrack.scrollLeft = startScroll - dx;
        }
    });

    const stopDrag = (e) => {
        if (!down) return;
        down = false;
        heroTrack.classList.remove('dragging');
        if (heroCursor) heroCursor.classList.remove('grabbing');
        if (e.pointerId != null && heroTrack.hasPointerCapture(e.pointerId)) {
            heroTrack.releasePointerCapture(e.pointerId);
        }
        if (moved) {
            // Snap to the nearest work card, then let auto-scroll resume
            const step = heroCardStep();
            pauseHeroAuto(900);
            heroTrack.scrollTo({ left: Math.round(heroTrack.scrollLeft / step) * step, behavior: 'smooth' });
        } else {
            // Clean click → open the work example under the cursor
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const card = el && el.closest('.hero-feature, .hero-work-card');
            const href = card && card.getAttribute('href');
            if (href) window.location.hash = href;
        }
    };
    heroTrack.addEventListener('pointerup', stopDrag);
    heroTrack.addEventListener('pointercancel', stopDrag);

    // Block the browser's native image ghost-drag
    heroTrack.addEventListener('dragstart', (e) => e.preventDefault());
}

// ——— Scroll-fill text ———
const aboutText = document.getElementById('aboutText');
const rawHTML = aboutText.innerHTML.trim();
const parts = rawHTML.split(/(<br\s*\/?>)+/g);
const output = parts.map(part => {
    if (/^<br/.test(part.trim())) return '';
    if (!part.trim()) return '<span class="word-break"></span>';
    return part.trim().split(/\s+/).map(w => `<span class="word">${w} </span>`).join('');
}).join('');
aboutText.innerHTML = output;
const wordEls = aboutText.querySelectorAll('.word');

const aboutGlow = document.getElementById('aboutGlow');

function updateTextFill() {
    const section = aboutText.closest('.about-section');
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;

    // Progress: 0 when section top hits viewport bottom, 1 when section bottom hits viewport top
    const start = vh;
    const end = -rect.height;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));

    // Map progress to word index — start filling at 10% scroll, finish at 70%
    const adjusted = Math.min(1, Math.max(0, (progress - 0.1) / 0.6));
    const activeCount = Math.floor(adjusted * wordEls.length);

    wordEls.forEach((el, i) => {
        el.classList.toggle('filled', i < activeCount);
    });

    // Drive sunrise glow with text progress
    if (aboutGlow) {
        const glowOpacity = Math.min(1, adjusted * 1.2);
        const glowScale = 0.8 + adjusted * 0.5;
        aboutGlow.style.opacity = glowOpacity;
        aboutGlow.style.transform = `scale(${glowScale})`;
    }
}

window.addEventListener('scroll', updateTextFill, { passive: true });
updateTextFill();

// ——— FAQ accordion ———
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const wasOpen = item.classList.contains('open');

        // Close all
        document.querySelectorAll('.faq-item.open').forEach(openItem => {
            openItem.classList.remove('open');
        });

        // Toggle clicked
        if (!wasOpen) {
            item.classList.add('open');
        }
    });
});

// ——— Comparison tabs with bar animation ———
// Max bar height in the scale area (excluding value text)
const COMP_BAR_MAX = 340;
const COMP_BAR_MIN = 24;

function getBarTargetPx(bar) {
    const pct = parseFloat(bar.dataset.height) / 100;
    return Math.max(COMP_BAR_MAX * pct, COMP_BAR_MIN);
}

function animateCompBars(slide) {
    const cols = slide.querySelectorAll('.comp-bar-col');
    cols.forEach(col => {
        const bar = col.querySelector('.comp-bar');
        const value = col.querySelector('.comp-bar-value');
        const targetPx = getBarTargetPx(bar);
        // Start small
        bar.style.transition = 'none';
        bar.style.height = COMP_BAR_MIN + 'px';
        value.style.transition = 'none';
        value.style.bottom = (COMP_BAR_MIN + 12) + 'px';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bar.style.transition = 'height 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
                bar.style.height = targetPx + 'px';
                value.style.transition = 'bottom 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
                value.style.bottom = (targetPx + 12) + 'px';
            });
        });
    });
}

function setBarHeights(slide) {
    const cols = slide.querySelectorAll('.comp-bar-col');
    cols.forEach(col => {
        const bar = col.querySelector('.comp-bar');
        const value = col.querySelector('.comp-bar-value');
        const targetPx = getBarTargetPx(bar);
        bar.style.height = targetPx + 'px';
        value.style.bottom = (targetPx + 12) + 'px';
    });
}

// Set initial heights and animate on scroll
const firstSlide = document.querySelector('.comparison-slide.active');
if (firstSlide) {
    setBarHeights(firstSlide);
    const compObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCompBars(firstSlide);
                compObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });
    compObserver.observe(document.querySelector('.comparison-section'));
}

document.querySelectorAll('.comparison-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.comparison-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.comparison-slide').forEach(s => {
            s.classList.remove('active');
            if (s.dataset.slide === target) {
                s.classList.add('active');
                animateCompBars(s);
            }
        });
    });
});

// Auto-cycle comparison tabs
let compInterval = setInterval(() => {
    const tabs = document.querySelectorAll('.comparison-tab');
    const activeIdx = [...tabs].findIndex(t => t.classList.contains('active'));
    const nextIdx = (activeIdx + 1) % tabs.length;
    tabs[nextIdx].click();
}, 5000);

// Stop auto-cycle on manual interaction
document.querySelector('.comparison-tabs').addEventListener('click', () => {
    clearInterval(compInterval);
});

// ——— Tool slider ———
const toolQuotes = [
    "We're in Figma every day all day. This is where a lot of the work takes shape.",
    "New to our stack and we can't let it go. We've been able to increase our speed by 1.5x and found it really helpful in exploring directions early.",
    "This is where we run the studio. All of our docs, SOPs, knowledge base, swipe files ... everything. Happy to give a tour if interested!",
    "We love how fast we can build in Webflow and how user friendly the CMS is for our clients.",
    "New-ish kid on the block. Super fun (and fast) to prop up a site.",
    "Really cool tool to record walkthroughs, case study, demo videos, and more.",
    'Right now I\'m listening to a lot of Fred Again and lo-fi Japanese beats while I work. Outside normal business hours I\'ll be listening to The National, War on Drugs, Vampire Weekend ... that sort of thing. <a href="https://open.spotify.com/playlist/4AmJC57OjAyyNSiTaqEZob?si=1b5e464c2b2246f1" target="_blank">Check out the studio playlist &rarr;</a>'
];
const toolCards = document.querySelectorAll('.tool-card');
const toolQuoteText = document.getElementById('toolQuoteText');
let activeToolIdx = 0;
let toolInterval;

function setActiveTool(idx) {
    activeToolIdx = idx;
    toolCards.forEach(c => c.classList.remove('active'));
    toolCards[idx].classList.add('active');
    toolQuoteText.classList.add('fading');
    setTimeout(() => {
        toolQuoteText.innerHTML = toolQuotes[idx];
        toolQuoteText.classList.remove('fading');
    }, 250);
}

function startToolCycle() {
    toolInterval = setInterval(() => {
        setActiveTool((activeToolIdx + 1) % toolCards.length);
    }, 4000);
}

toolCards.forEach(card => {
    card.addEventListener('click', () => {
        clearInterval(toolInterval);
        setActiveTool(parseInt(card.dataset.tool));
        startToolCycle();
    });
});

startToolCycle();

// Testimonials carousel — duplicate each track for a seamless marquee loop
document.querySelectorAll('.testimonials-track').forEach(track => {
    track.innerHTML += track.innerHTML;
});

// Slow (don't stop) the marquee on hover
const testimonialsCarousel = document.querySelector('.testimonials-carousel');
if (testimonialsCarousel) {
    const setMarqueeRate = (rate) => {
        testimonialsCarousel.querySelectorAll('.testimonials-track').forEach(track => {
            track.getAnimations().forEach(a => { a.playbackRate = rate; });
        });
    };
    testimonialsCarousel.addEventListener('mouseenter', () => setMarqueeRate(0.2));
    testimonialsCarousel.addEventListener('mouseleave', () => setMarqueeRate(1));
}

// Dynamic current month + randomized slot counts (1-3)
const monthName = new Date().toLocaleString('en-US', { month: 'long' });
document.querySelectorAll('.current-month').forEach(el => el.textContent = ' ' + monthName);

// Pricing testimonial slider
const pricingSlider = document.getElementById('pricingTestimonialSlider');
if (pricingSlider) {
    const slides = pricingSlider.querySelectorAll('.pricing-testimonial');
    const lines = pricingSlider.querySelectorAll('.pricing-testimonial-line');
    let activeSlide = 0;

    function setPricingSlide(idx) {
        slides.forEach(s => s.classList.remove('active'));
        lines.forEach(l => l.classList.remove('active'));
        slides[idx].classList.add('active');
        lines[idx].classList.add('active');
        activeSlide = idx;
    }

    setInterval(() => {
        setPricingSlide((activeSlide + 1) % slides.length);
    }, 5000);
}

