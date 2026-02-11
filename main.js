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
const navSections = document.querySelectorAll('#work, #pricing, #faq');

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

// Subtle parallax on hero devices
const hero = document.querySelector('.hero');
const devices = document.querySelectorAll('.hero-device');

hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    devices.forEach((dev, i) => {
        const strength = i === 0 ? 12 : 8;
        const img = dev.querySelector('img');
        img.style.transition = 'transform 0.3s ease-out';
        img.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
});

hero.addEventListener('mouseleave', () => {
    devices.forEach((dev) => {
        const img = dev.querySelector('img');
        img.style.transition = 'transform 0.6s ease-out';
        img.style.transform = 'translate(0, 0)';
    });
});

// ——— Scroll + bob device animation ———
const phoneDevice = document.querySelector('.hero-device--phone');
const macDevice = document.querySelector('.hero-device--mac');
let startTime = performance.now();

function animateDevices(now) {
    const elapsed = (now - startTime) / 1000;
    const scrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;
    const progress = Math.min(scrollY / heroHeight, 1);

    // Gentle bob
    const phoneBob = Math.sin(elapsed * 1.05) * 5;
    const macBob = Math.sin(elapsed * 0.9 + 1) * 4;

    // Scroll drift
    const phoneScrollX = -progress * 30;
    const phoneScrollY = -progress * 60;
    const macScrollX = progress * 20;
    const macScrollY = progress * 40;
    const opacity = Math.max(1 - progress * 1.2, 0);

    phoneDevice.style.transform = `translate(${phoneScrollX}px, ${phoneScrollY + phoneBob}px)`;
    phoneDevice.style.opacity = opacity;
    macDevice.style.transform = `translate(${macScrollX}px, ${macScrollY + macBob}px)`;
    macDevice.style.opacity = opacity;

    requestAnimationFrame(animateDevices);
}
requestAnimationFrame(animateDevices);

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

// ——— Work TOC active state ———
const tocLinks = document.querySelectorAll('.work-toc a');
const projects = document.querySelectorAll('.work-project');

function updateToc() {
    let currentProject = null;

    projects.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.4) {
            currentProject = p.dataset.project;
        }
    });

    tocLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.project === currentProject);
    });
}

window.addEventListener('scroll', updateToc, { passive: true });
updateToc();

// Smooth scroll for TOC links
tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

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