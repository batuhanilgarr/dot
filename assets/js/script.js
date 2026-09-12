const introVideo = document.getElementById('introVideo');
const introWelcome = document.getElementById('introWelcome');
const videoContainer = document.getElementById('videoContainer');
const content = document.getElementById('content');
const butterfliesContainer = document.getElementById('butterflies');
const menu = document.getElementById('menu');
const menuToggle = document.getElementById('menuToggle');
const menuItems = document.getElementById('menuItems');
const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggle = document.getElementById('musicToggle');
const playIcon = musicToggle?.querySelector('.play');
const pauseIcon = musicToggle?.querySelector('.pause');
const mapFrame = document.getElementById('mapFrame');
const loadMapButton = document.getElementById('loadMapButton');
const rsvpCountValue = document.getElementById('rsvpCountValue');
const rsvpCountUpdated = document.getElementById('rsvpCountUpdated');
const rsvpConfirmButton = document.getElementById('rsvpConfirmButton');
const rsvpActionStatus = document.getElementById('rsvpActionStatus');
const rsvpGuestCount = document.getElementById('rsvpGuestCount');
const RSVP_API_URL = 'https://zeynepbatuhan-rsvp-api.batuhannilgarr.workers.dev/rsvp-count';
const RSVP_POST_URL = RSVP_API_URL.replace('/rsvp-count', '/rsvp');
const RSVP_LOCAL_KEY = 'rsvp-confirmed-v1';
/** Nişan döneminden kalan ham API sayısı (Cloudflare KV); gösterimde düşülür */
const RSVP_NISAN_BASELINE = 23;
const isMobile = window.matchMedia('(max-width: 768px)').matches;

let isMusicPlaying = false;
let hasUserInteracted = false;
let analyticsLoaded = false;

function loadDeferredAnalytics() {
    if (analyticsLoaded) return;

    const measurementId = document
        .querySelector('meta[name="ga-measurement-id"]')
        ?.getAttribute('content');
    if (!measurementId) return;

    analyticsLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
}

function ensureAudioSource() {
    if (!backgroundMusic || backgroundMusic.getAttribute('src')) return;
    const audioSrc = backgroundMusic.dataset.src;
    if (audioSrc) backgroundMusic.setAttribute('src', audioSrc);
}

function ensureVideoSource() {
    if (!introVideo || introVideo.querySelector('source')) return;
    const videoSrc = introVideo.dataset.src;
    if (!videoSrc) return;

    const source = document.createElement('source');
    source.src = videoSrc;
    source.type = 'video/mp4';
    introVideo.appendChild(source);
    // preload="none" ile load() sadece metadata cekiyordu; intro metni okunurken
    // videonun tamami insin ki gosterim aninda takilmasin.
    introVideo.preload = 'auto';
    introVideo.load();
}

function updateMusicButton() {
    if (!musicToggle) return;

    musicToggle.classList.add('visible');

    if (playIcon) playIcon.style.display = isMusicPlaying ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = isMusicPlaying ? 'block' : 'none';
}

async function tryPlayMusic() {
    if (!backgroundMusic) return;
    ensureAudioSource();

    try {
        await backgroundMusic.play();
        isMusicPlaying = true;
    } catch (error) {
        isMusicPlaying = false;
        console.log('Müzik otomatik başlatma engellendi:', error);
    }

    updateMusicButton();
}

function onFirstInteraction() {
    hasUserInteracted = true;
    loadDeferredAnalytics();
    tryPlayMusic();

    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
}

document.addEventListener('click', onFirstInteraction, { passive: true });
document.addEventListener('touchstart', onFirstInteraction, { passive: true });
document.addEventListener('keydown', onFirstInteraction);

const INTRO_TEXT_MIN_MS = 5000;

function showMobileIntroSplash() {
    if (!introWelcome) return;

    const splash = introWelcome.cloneNode(true);
    splash.id = 'introWelcomeMobile';
    splash.classList.add('mobile-splash');
    document.body.appendChild(splash);

    window.setTimeout(() => {
        splash.classList.add('fade-out');
        window.setTimeout(() => splash.remove(), 800);
    }, INTRO_TEXT_MIN_MS);
}

function beginIntroVideoAfterText() {
    if (!introVideo || isMobile) return;

    introVideo.classList.add('intro-video-hidden');
    videoContainer?.classList.add('intro-text-phase');

    const startedAt = Date.now();
    let beganPlayback = false;

    const startPlayback = () => {
        if (beganPlayback) return;
        beganPlayback = true;

        const waitMs = Math.max(0, INTRO_TEXT_MIN_MS - (Date.now() - startedAt));
        window.setTimeout(() => {
            introWelcome?.classList.add('fade-out');
            introVideo.classList.remove('intro-video-hidden');
            videoContainer?.classList.remove('intro-text-phase');

            introVideo.play().catch(() => {
                finishIntro();
            });
        }, waitMs);
    };

    introVideo.addEventListener('playing', () => {
        introWelcome?.classList.add('fade-out');
    }, { once: true });

    // canplaythrough: video kesintisiz oynayacak kadar veri gelmeden baslatma.
    introVideo.addEventListener('canplaythrough', startPlayback, { once: true });
    introVideo.addEventListener('canplay', startPlayback, { once: true });
    introVideo.addEventListener('error', finishIntro, { once: true });

    // Video gec kalirsa misafiri bekletme, davetiyeye gec.
    window.setTimeout(() => {
        if (!beganPlayback) finishIntro();
    }, INTRO_TEXT_MIN_MS + 2500);
}

function finishIntro() {
    videoContainer?.classList.add('hidden');
    videoContainer?.classList.remove('intro-text-phase');
    content?.classList.add('visible');
    menu?.classList.add('visible');
    document.body.style.overflow = 'auto';
    introWelcome?.classList.add('fade-out');
    updateMusicButton();
    if (hasUserInteracted) tryPlayMusic();
    showToastBanner();
}

function getDisplayedRsvpCount(rawCount) {
    const count = Number(rawCount);
    if (!Number.isFinite(count)) return 0;
    return Math.max(0, count - RSVP_NISAN_BASELINE);
}

window.addEventListener('load', () => {
    if (!isMobile) {
        ensureVideoSource();
        beginIntroVideoAfterText();
    } else {
        videoContainer?.classList.add('hidden');
        content?.classList.add('visible');
        menu?.classList.add('visible');
        document.body.style.overflow = 'auto';
        showMobileIntroSplash();
        showToastBanner();
    }
    setTimeout(loadDeferredAnalytics, 2500);
});

if (musicToggle && backgroundMusic) {
    musicToggle.addEventListener('click', async () => {
        if (backgroundMusic.paused) {
            await tryPlayMusic();
        } else {
            backgroundMusic.pause();
            isMusicPlaying = false;
            updateMusicButton();
        }
    });

    // Tooltip — mobilde tap ile göster/gizle
    const tooltip = musicToggle.querySelector('.music-tooltip');
    if (tooltip) {
        const songName = musicToggle.dataset.song || '';
        tooltip.textContent = songName;

        musicToggle.addEventListener('touchstart', () => {
            musicToggle.classList.add('tooltip-visible');
            setTimeout(() => musicToggle.classList.remove('tooltip-visible'), 2800);
        }, { passive: true });
    }
}

function initScrollReveal() {
    const revealTargets = document.querySelectorAll(
        '.content section, .sakura-divider, .schedule-item, .info-item, .countdown-item'
    );

    revealTargets.forEach((element, index) => {
        if (element.classList.contains('hero-section')) return;
        element.classList.add('reveal');
        element.style.transitionDelay = `${Math.min(index % 4, 3) * 60}ms`;
    });

    if (!('IntersectionObserver' in window)) {
        revealTargets.forEach((element) => element.classList.add('in-view'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px'
    });

    revealTargets.forEach((element) => {
        if (!element.classList.contains('hero-section')) {
            observer.observe(element);
        }
    });
}

introVideo?.addEventListener('ended', () => {
    videoContainer.classList.add('hidden');
    content.classList.add('visible');
    menu.classList.add('visible');
    document.body.style.overflow = 'auto';

    updateMusicButton();
    if (hasUserInteracted) {
        tryPlayMusic();
    }
    showToastBanner();
});

introVideo?.addEventListener('error', () => {
    console.log('Video yüklenemedi, içerik gösteriliyor...');
    videoContainer.classList.add('hidden');
    content.classList.add('visible');
    menu.classList.add('visible');
    document.body.style.overflow = 'auto';

    updateMusicButton();
    if (hasUserInteracted) {
        tryPlayMusic();
    }
    showToastBanner();
});

menuToggle?.addEventListener('click', () => {
    menuItems.classList.toggle('active');
});

document.querySelectorAll('.menu-items a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
        
        if (window.innerWidth <= 768) {
            menuItems.classList.remove('active');
        }
    });
});

if (loadMapButton && mapFrame) {
    const loadMap = () => {
        if (!mapFrame.getAttribute('src') && mapFrame.dataset.src) {
            mapFrame.setAttribute('src', mapFrame.dataset.src);
        }
        mapFrame.classList.add('loaded');
        loadMapButton.style.display = 'none';
    };

    loadMapButton.addEventListener('click', loadMap);
}

document.querySelectorAll('.ctab').forEach((tab) => {
    tab.addEventListener('click', () => {
        const targetId = tab.dataset.target;
        document.querySelectorAll('.ctab').forEach((t) => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.ctab-panel').forEach((p) => { p.hidden = true; });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById(targetId);
        if (panel) panel.hidden = false;
    });
});

/* ============ NISAN GALERISI LIGHTBOX ============ */

const galleryStrip = document.getElementById('galleryStrip');
const lightbox = document.getElementById('lightbox');

if (galleryStrip && lightbox) {
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCount = document.getElementById('lightboxCount');
    const galleryImages = Array.from(galleryStrip.querySelectorAll('.gallery-item img'));
    let lightboxIndex = 0;
    let lastFocused = null;

    function showLightbox(index) {
        lightboxIndex = (index + galleryImages.length) % galleryImages.length;
        const source = galleryImages[lightboxIndex];
        lightboxImg.src = source.src;
        lightboxImg.alt = source.alt;
        lightboxCount.textContent = `${lightboxIndex + 1} / ${galleryImages.length}`;
    }

    function openLightbox(index) {
        lastFocused = document.activeElement;
        showLightbox(index);
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        document.getElementById('lightboxClose')?.focus();
    }

    function closeLightbox() {
        lightbox.hidden = true;
        lightboxImg.src = '';
        document.body.style.overflow = '';
        lastFocused?.focus();
    }

    galleryStrip.querySelectorAll('.gallery-item').forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });

    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev')?.addEventListener('click', () => showLightbox(lightboxIndex - 1));
    document.getElementById('lightboxNext')?.addEventListener('click', () => showLightbox(lightboxIndex + 1));

    // Fotografin disina tiklayinca kapansin.
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (event) => {
        if (lightbox.hidden) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') showLightbox(lightboxIndex - 1);
        if (event.key === 'ArrowRight') showLightbox(lightboxIndex + 1);
    });

    // Mobilde kaydirarak gezinme.
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (event) => {
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 50) showLightbox(lightboxIndex + (delta < 0 ? 1 : -1));
    }, { passive: true });
}

/* ============ DAVETİYE FOTOĞRAFI LIGHTBOX ============ */

const invitePhotoBtn = document.getElementById('invitePhotoBtn');
const photoLightbox = document.getElementById('photoLightbox');

if (invitePhotoBtn && photoLightbox) {
    const photoLightboxImg = document.getElementById('photoLightboxImg');
    let lastFocusedPhoto = null;

    function openPhotoLightbox() {
        const source = invitePhotoBtn.querySelector('img');
        lastFocusedPhoto = document.activeElement;
        photoLightboxImg.src = source.currentSrc || source.src;
        photoLightboxImg.alt = source.alt;
        photoLightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        document.getElementById('photoLightboxClose')?.focus();
    }

    function closePhotoLightbox() {
        photoLightbox.hidden = true;
        photoLightboxImg.src = '';
        document.body.style.overflow = '';
        lastFocusedPhoto?.focus();
    }

    invitePhotoBtn.addEventListener('click', openPhotoLightbox);
    document.getElementById('photoLightboxClose')?.addEventListener('click', closePhotoLightbox);

    photoLightbox.addEventListener('click', (event) => {
        if (event.target === photoLightbox) closePhotoLightbox();
    });

    document.addEventListener('keydown', (event) => {
        if (photoLightbox.hidden) return;
        if (event.key === 'Escape') closePhotoLightbox();
    });
}

// Kina gunu gectiyse geri sayim varsayilan olarak nikah sekmesinde acilsin.
(function selectDefaultCountdownTab() {
    if (Date.now() < new Date('2026-10-24T17:00:00+03:00').getTime()) return;
    document.getElementById('ctab-btn-nikah')?.click();
})();

const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        const shareData = {
            title: 'Zeynep & Batuhan Nikah Davetiyesi',
            text: 'Zeynep & Batuhan\'ın nikah törenine davetlisiniz! 💍',
            url: 'https://zeynepbatuhan.com/'
        };
        if (navigator.share) {
            try { await navigator.share(shareData); }
            catch (err) { if (err.name !== 'AbortError') console.log('Share failed:', err); }
        } else {
            window.open(
                `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`,
                '_blank', 'noopener,noreferrer'
            );
        }
    });
}

const faqButtons = document.querySelectorAll('.faq-question');
faqButtons.forEach((button, index) => {
    // Ekran okuyucular icin butonu kendi cevap paneline bagla.
    const answer = button.closest('.faq-item')?.querySelector('.faq-answer');
    if (answer) {
        const answerId = `faq-answer-${index + 1}`;
        answer.id = answerId;
        answer.setAttribute('role', 'region');
        button.setAttribute('aria-controls', answerId);
    }

    button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        if (!item) return;

        const isActive = item.classList.contains('active');

        faqButtons.forEach((b) => {
            b.closest('.faq-item')?.classList.remove('active');
            b.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
            item.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
        }
    });
});

function createButterfly() {
    const butterfly = document.createElement('div');
    butterfly.className = 'butterfly';
    butterfly.textContent = '🦋';

    butterfly.style.left = '0';
    butterfly.style.top = '0';
    butterfliesContainer.appendChild(butterfly);
    return butterfly;
}

const butterflyCount = isMobile ? 8 : 16;
const butterflies = [];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let butterflyAnimationId = null;

for (let i = 0; i < butterflyCount; i += 1) {
    const element = createButterfly();
    const size = 16 + Math.random() * 14;
    const depth = 0.7 + Math.random() * 0.7;
    const speed = 0.22 + Math.random() * 0.35;
    const direction = Math.random() * Math.PI * 2;

    element.style.fontSize = `${size}px`;
    element.style.opacity = String(0.4 + Math.random() * 0.4);

    butterflies.push({
        element,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: Math.cos(direction) * speed,
        vy: Math.sin(direction) * speed * 0.6,
        targetVx: Math.cos(direction) * speed,
        targetVy: Math.sin(direction) * speed * 0.6,
        depth,
        turnTimer: 900 + Math.random() * 1800,
        restTimer: Math.random() * 2200,
        wingOffset: Math.random() * Math.PI * 2,
        driftOffset: Math.random() * Math.PI * 2
    });
}

function randomDirection(butterfly) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.45;
    butterfly.targetVx = Math.cos(angle) * speed;
    butterfly.targetVy = Math.sin(angle) * speed * 0.65;
}

function updateButterflies(now) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const slowMotion = prefersReducedMotion ? 0.22 : 1;
    const bobBase = prefersReducedMotion ? 2 : 10;
    const scrollY = window.scrollY * 0.05;

    butterflies.forEach((butterfly, index) => {
        butterfly.turnTimer -= 16;
        butterfly.restTimer -= 16;

        if (butterfly.turnTimer <= 0) {
            butterfly.turnTimer = 900 + Math.random() * 2400;
            randomDirection(butterfly);
        }

        const restFactor = butterfly.restTimer > 0 ? 0.45 : 1;
        if (butterfly.restTimer <= 0) {
            butterfly.restTimer = 2200 + Math.random() * 3800;
        }

        butterfly.vx += (butterfly.targetVx - butterfly.vx) * 0.012;
        butterfly.vy += (butterfly.targetVy - butterfly.vy) * 0.012;

        const driftX = Math.sin(now * 0.001 + butterfly.driftOffset + index * 0.33) * 0.38;
        const driftY = Math.cos(now * 0.0013 + butterfly.driftOffset) * 0.24;

        butterfly.x += (butterfly.vx * restFactor + driftX) * slowMotion * butterfly.depth * 2.1;
        butterfly.y += (butterfly.vy * restFactor + driftY) * slowMotion * butterfly.depth * 2.1;

        if (butterfly.x < -80) butterfly.x = width + 40;
        if (butterfly.x > width + 80) butterfly.x = -40;
        if (butterfly.y < -80) butterfly.y = height + 40;
        if (butterfly.y > height + 80) butterfly.y = -40;

        const wingBeat = Math.sin(now * 0.018 + butterfly.wingOffset);
        const wingScale = 1 + wingBeat * (prefersReducedMotion ? 0.04 : 0.16);
        const bob = Math.sin(now * 0.0016 + butterfly.wingOffset) * bobBase;
        const rotation = Math.max(-26, Math.min(26, butterfly.vx * 45 + wingBeat * 5));
        const parallaxY = scrollY * (0.4 + butterfly.depth * 0.6);

        butterfly.element.style.transform = `translate3d(${butterfly.x}px, ${butterfly.y + bob + parallaxY}px, 0) rotate(${rotation}deg) scale(${wingScale})`;
    });

    butterflyAnimationId = window.requestAnimationFrame(updateButterflies);
}

if (butterflies.length > 0) {
    butterflyAnimationId = window.requestAnimationFrame(updateButterflies);
}

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    butterflies.forEach((butterfly) => {
        butterfly.x = Math.min(Math.max(butterfly.x, 0), width);
        butterfly.y = Math.min(Math.max(butterfly.y, 0), height);
    });
}, { passive: true });

const WEDDING_DATE_MS = new Date('2026-10-25T14:00:00+03:00').getTime();
const EVENT_END_MS = new Date('2026-10-25T22:00:00+03:00').getTime();
const KINA_DATE_MS = new Date('2026-10-24T12:00:00+03:00').getTime();

/* ============================================== */
/* BLOOM MODE — 10 Mayis 2026 Pazar 13:00 sonrasi  */
/* Sayfa cicek bahcesine donusur                   */
/* ============================================== */

const BLOOM_FLOWERS = ['🌸', '🌺', '🌷', '🌹', '🌻', '🌼', '💮', '🏵️', '💐'];
let bloomActivated = false;
let bloomRainTimer = null;

const BLOOM_MESSAGE_LIVE = `
    Bu güzel günde bizimle birlikte olduğunuz için
    <strong>çok teşekkür ederiz.</strong>
    <br><br>
    Şimdi günün tadını çıkarın 🌸
`;

const BLOOM_MESSAGE_AFTER = `
    Hayatımızın bu güzel gününü bizimle paylaştığınız için
    <strong>çok teşekkür ederiz.</strong>
    <br><br>
    İyi ki vardınız 💕
`;

function activateBloomMode() {
    if (bloomActivated) return;
    bloomActivated = true;

    window.scrollTo(0, 0);
    document.body.classList.add('bloom-mode');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (typeof countdownTickHandle !== 'undefined') {
        clearInterval(countdownTickHandle);
    }

    updateBloomMessage();
    if (Date.now() < EVENT_END_MS) {
        setInterval(updateBloomMessage, 60000);
    }

    if (typeof backgroundMusic !== 'undefined' && backgroundMusic && backgroundMusic.paused) {
        tryPlayMusic();
    }

    bloomBurst();
    startBloomRain();
}

function updateBloomMessage() {
    const body = document.getElementById('bloomMessageBody');
    if (!body) return;

    const expected = Date.now() >= EVENT_END_MS ? 'after' : 'live';
    if (body.dataset.state === expected) return;

    body.dataset.state = expected;
    body.innerHTML = expected === 'after' ? BLOOM_MESSAGE_AFTER : BLOOM_MESSAGE_LIVE;
}

function bloomBurst() {
    if (prefersReducedMotion) return;
    const burstCount = isMobile ? 24 : 48;

    for (let i = 0; i < burstCount; i++) {
        setTimeout(() => spawnBloomPetal(true), i * 60);
    }
}

function spawnBloomPetal(burst = false) {
    if (prefersReducedMotion) return;

    const petal = document.createElement('span');
    petal.className = 'bloom-petal';
    petal.textContent = BLOOM_FLOWERS[Math.floor(Math.random() * BLOOM_FLOWERS.length)];
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.fontSize = `${16 + Math.random() * 18}px`;
    petal.style.animationDuration = `${burst ? 3 + Math.random() * 1.5 : 4 + Math.random() * 2}s`;
    petal.style.opacity = String(0.7 + Math.random() * 0.3);

    document.body.appendChild(petal);
    petal.addEventListener('animationend', () => petal.remove(), { once: true });
}

function startBloomRain() {
    if (prefersReducedMotion || bloomRainTimer) return;
    const intervalMs = isMobile ? 1100 : 650;

    bloomRainTimer = setInterval(() => {
        if (document.hidden) return;
        spawnBloomPetal(false);
    }, intervalMs);
}

document.addEventListener('visibilitychange', () => {
    if (!bloomActivated) return;
    if (document.hidden && bloomRainTimer) {
        clearInterval(bloomRainTimer);
        bloomRainTimer = null;
    } else if (!document.hidden && !bloomRainTimer) {
        startBloomRain();
    }
});

function updateCountdown() {
    const now = new Date().getTime();
    const distance = WEDDING_DATE_MS - now;
    const countdownSection = document.getElementById('geri-sayim');
    const countdownEl = document.getElementById('countdown');

    if (distance < 0) {
        activateBloomMode();
        if (countdownEl && !countdownEl.querySelector('.event-day-msg')) {
            const afterEnd = now >= EVENT_END_MS;
            countdownEl.innerHTML = afterEnd
                ? '<p class="event-day-msg">💕 Harika bir gün geçirdik, teşekkürler!</p>'
                : '<p class="event-day-msg">🌸 Bugün o özel gün! Çiçekler açtı, görüşmek üzere! 💐</p>';
        }
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

    const kinaDistance = KINA_DATE_MS - now;
    if (kinaDistance > 0) {
        const kd = Math.floor(kinaDistance / (1000 * 60 * 60 * 24));
        const kh = Math.floor((kinaDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const km = Math.floor((kinaDistance % (1000 * 60 * 60)) / (1000 * 60));
        const ks = Math.floor((kinaDistance % (1000 * 60)) / 1000);
        const kinaEl = document.getElementById('kina-days');
        if (kinaEl) {
            document.getElementById('kina-days').textContent = String(kd).padStart(2, '0');
            document.getElementById('kina-hours').textContent = String(kh).padStart(2, '0');
            document.getElementById('kina-minutes').textContent = String(km).padStart(2, '0');
            document.getElementById('kina-seconds').textContent = String(ks).padStart(2, '0');
        }
    } else {
        const kinaPanel = document.getElementById('ctab-kina');
        if (kinaPanel && !kinaPanel.querySelector('.event-day-msg')) {
            const msg = document.createElement('p');
            msg.className = 'event-day-msg';
            msg.textContent = '🌷 Kına gecesi güzeldi, teşekkürler!';
            kinaPanel.replaceChildren(msg);
        }
    }

    if (days < 7 && countdownSection) {
        countdownSection.classList.add('last-days');

        let badge = countdownSection.querySelector('.last-days-badge');
        const badgeText = days === 0 ? '🌸 Bugün! Az kaldı!' : days === 1 ? '🌸 Yarın!' : `🌸 ${days} Gün Kaldı!`;

        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'last-days-badge';
            const eventDateEl = countdownSection.querySelector('.event-date');
            if (eventDateEl) eventDateEl.insertAdjacentElement('afterend', badge);
        }
        badge.textContent = badgeText;
    }
}

let countdownTickHandle = setInterval(updateCountdown, 1000);
updateCountdown();
initScrollReveal();

async function updateRsvpCount() {
    if (!rsvpCountValue || !rsvpCountUpdated) return;

    try {
        const response = await fetch(`${RSVP_API_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`RSVP data error: ${response.status}`);
        const data = await response.json();
        const count = Number(data.count || 0);
        const updatedAt = data.updatedAt || new Date().toISOString();

        rsvpCountValue.textContent = String(getDisplayedRsvpCount(count));
        rsvpCountUpdated.textContent = new Date(updatedAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.log('RSVP sayisi alinamadi:', error);
        rsvpCountUpdated.textContent = 'Canlı veri alınamadı';
    }
}

updateRsvpCount();
setInterval(updateRsvpCount, 60000);

async function submitRsvp() {
    if (!rsvpConfirmButton || !rsvpActionStatus || !rsvpGuestCount) return;
    const previousValue = Number(localStorage.getItem(RSVP_LOCAL_KEY) || 0);
    if (previousValue > 0) {
        rsvpConfirmButton.disabled = true;
        rsvpGuestCount.disabled = true;
        rsvpActionStatus.textContent = `Katılım bildiriminiz alındı (${previousValue} kişi). Teşekkür ederiz!`;
        return;
    }

    const selectedGuestCount = Math.floor(Number(rsvpGuestCount.value || 1));
    if (!Number.isFinite(selectedGuestCount) || selectedGuestCount < 1) {
        rsvpActionStatus.textContent = 'Lütfen 1 veya daha büyük bir kişi sayısı girin.';
        return;
    }
    rsvpConfirmButton.disabled = true;
    rsvpGuestCount.disabled = true;
    rsvpActionStatus.textContent = `${selectedGuestCount} kişi için kaydediliyor...`;

    try {
        for (let i = 0; i < selectedGuestCount; i += 1) {
            const response = await fetch(RSVP_POST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'web', index: i + 1, total: selectedGuestCount })
            });

            if (!response.ok) throw new Error(`RSVP post error: ${response.status}`);
        }

        localStorage.setItem(RSVP_LOCAL_KEY, String(selectedGuestCount));
        rsvpActionStatus.textContent = `Katılım bildiriminiz alındı (${selectedGuestCount} kişi). Çok teşekkürler!`;
        await updateRsvpCount();
    } catch (error) {
        console.log('RSVP kaydi gonderilemedi:', error);
        rsvpActionStatus.textContent = 'Gönderilemedi, lütfen tekrar deneyin.';
        rsvpConfirmButton.disabled = false;
        rsvpGuestCount.disabled = false;
    }
}

if (rsvpConfirmButton && rsvpGuestCount) {
    const previousValue = Number(localStorage.getItem(RSVP_LOCAL_KEY) || 0);
    if (previousValue > 0) {
        rsvpConfirmButton.disabled = true;
        rsvpGuestCount.disabled = true;
        if (rsvpActionStatus) {
            rsvpActionStatus.textContent = `Bu cihazdan katılım bildirimi daha önce yapıldı (${previousValue} kişi).`;
        }
    } else {
        rsvpConfirmButton.addEventListener('click', submitRsvp);
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const registerSw = () => navigator.serviceWorker.register('./sw.js').catch(() => {});
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(registerSw);
        } else {
            setTimeout(registerSw, 2000);
        }
    });
}

function showToastBanner() {
    const toast = document.getElementById('toastBanner');
    if (!toast) return;

    const weddingDate = new Date('2026-10-25T14:00:00+03:00').getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

    let message;
    if (distance <= 0) message = '🎉 Bugün o özel gün!';
    else if (days === 0) message = '🌸 Bu gece nikah var! Görüşmek üzere!';
    else if (days === 1) message = '🌸 Yarın nikah! Görüşmek üzere!';
    else message = `🌸 Nikaha ${days} gün kaldı! Görüşmek üzere!`;

    toast.textContent = message;

    toast.addEventListener('click', () => toast.classList.remove('visible'), { once: true });

    setTimeout(() => {
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 5500);
    }, 1800);
}

async function loadWeather() {
    const WMO = {
        0: ['☀️', 'Açık hava'],
        1: ['🌤️', 'Çoğunlukla açık'],
        2: ['⛅', 'Parçalı bulutlu'],
        3: ['☁️', 'Kapalı'],
        45: ['🌫️', 'Sisli'],
        48: ['🌫️', 'Sisli'],
        51: ['🌦️', 'Hafif çisenti'],
        53: ['🌦️', 'Çisenti'],
        55: ['🌧️', 'Yoğun çisenti'],
        61: ['🌧️', 'Hafif yağmur'],
        63: ['🌧️', 'Yağmur'],
        65: ['🌧️', 'Yoğun yağmur'],
        80: ['🌦️', 'Sağanak'],
        81: ['🌦️', 'Kuvvetli sağanak'],
        82: ['⛈️', 'Şiddetli sağanak'],
        95: ['⛈️', 'Fırtınalı'],
    };

    function applyWeather(iconId, descId, tempId, cardId, code, tmin, tmax) {
        const [icon, desc] = WMO[code] || ['🌡️', 'Belirsiz'];
        const iconEl = document.getElementById(iconId);
        const descEl = document.getElementById(descId);
        const tempEl = document.getElementById(tempId);
        const card   = document.getElementById(cardId);
        if (iconEl) iconEl.textContent = icon;
        if (descEl) descEl.textContent = desc;
        if (tempEl) tempEl.textContent = `${tmin}° — ${tmax}°C`;
        if (card)   card.classList.add('loaded');
    }

    function applyPlaceholder(iconId, descId, cardId, msg) {
        const iconEl = document.getElementById(iconId);
        const descEl = document.getElementById(descId);
        const card   = document.getElementById(cardId);
        if (iconEl) iconEl.textContent = '🌤️';
        if (descEl) descEl.textContent = msg;
        if (card)   card.classList.add('loaded');
    }

    const FORECAST_HORIZON_MS = 16 * 24 * 60 * 60 * 1000;
    const kinaMs = KINA_DATE_MS;
    const now = Date.now();

    if (kinaMs - now > FORECAST_HORIZON_MS) {
        applyPlaceholder('weatherIconKina', 'weatherDescKina', 'weatherCardKina', 'Kınaya yakın güncellenir');
        applyPlaceholder('weatherIcon',     'weatherDesc',     'weatherCard',     'Nikaha yakın güncellenir');
        return;
    }

    try {
        const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=40.9989&longitude=29.1500&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe%2FIstanbul&start_date=2026-10-24&end_date=2026-10-25'
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // index 0 = 24 Ekim (kına), index 1 = 25 Ekim (nikah)
        applyWeather(
            'weatherIconKina', 'weatherDescKina', 'weatherTempKina', 'weatherCardKina',
            data.daily.weathercode[0],
            Math.round(data.daily.temperature_2m_min[0]),
            Math.round(data.daily.temperature_2m_max[0])
        );
        applyWeather(
            'weatherIcon', 'weatherDesc', 'weatherTemp', 'weatherCard',
            data.daily.weathercode[1],
            Math.round(data.daily.temperature_2m_min[1]),
            Math.round(data.daily.temperature_2m_max[1])
        );
    } catch (err) {
        console.log('Hava durumu alınamadı:', err);
    }
}

function launchSakuraConfetti() {
    if (prefersReducedMotion) return;
    const symbols = ['🌸', '🌸', '🌸', '🌺', '✨', '🌸'];
    const count = isMobile ? 20 : 42;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const petal = document.createElement('span');
            petal.className = 'sakura-petal';
            petal.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            petal.style.left = `${5 + Math.random() * 90}vw`;
            petal.style.fontSize = `${13 + Math.random() * 14}px`;
            petal.style.animationDuration = `${2.8 + Math.random() * 2.5}s`;
            document.body.appendChild(petal);
            petal.addEventListener('animationend', () => petal.remove(), { once: true });
        }, i * 75);
    }
}

function initConfettiObserver() {
    if (!('IntersectionObserver' in window)) return;

    const target = document.getElementById('geri-sayim');
    if (!target) return;

    let fired = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !fired) {
                fired = true;
                launchSakuraConfetti();
                observer.disconnect();
            }
        });
    }, { threshold: 0.35 });

    observer.observe(target);
}

loadWeather();
initConfettiObserver();
initVenueDistances();

function initVenueDistances() {
    if (!('geolocation' in navigator)) return;

    const venues = [
        { id: 'dist-kina',  lat: 41.0165514, lng: 29.1561369 },
        { id: 'dist-nikah', lat: 41.0619082, lng: 29.1107091 },
    ];

    const targets = venues
        .map(({ id }) => document.getElementById(id))
        .filter(Boolean);
    if (!targets.length) return;

    let requested = false;
    const observer = new IntersectionObserver((entries) => {
        if (requested || !entries.some((entry) => entry.isIntersecting)) return;
        requested = true;
        observer.disconnect();
        requestVenueDistances(venues);
    }, { threshold: 0.35 });

    targets.forEach((el) => observer.observe(el));
}

function requestVenueDistances(venues) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude: srcLat, longitude: srcLng } = pos.coords;
            venues.forEach(({ id, lat, lng }) => {
                const el = document.getElementById(id);
                if (!el) return;

                fetch(
                    `https://router.project-osrm.org/route/v1/driving/${srcLng},${srcLat};${lng},${lat}?overview=false`,
                    { cache: 'no-store' }
                )
                    .then((r) => r.ok ? r.json() : Promise.reject())
                    .then((data) => {
                        const mins = Math.round(data.routes[0].duration / 60);
                        el.textContent = ` · ~${mins} dk`;
                    })
                    .catch(() => {});
            });
        },
        () => {},
        { timeout: 8000 }
    );
}

if (Date.now() >= WEDDING_DATE_MS) {
    activateBloomMode();
}

const bloomQueryFlag = new URLSearchParams(window.location.search).get('bloom') === '1';
const bloomHashFlag = window.location.hash === '#bloom';
if (bloomQueryFlag || bloomHashFlag) {
    activateBloomMode();
}

/* ——— Hikayemiz: rastgele nişan fotoğrafı ——— */
const NISAN_PHOTOS = [
    'dsc09069.jpg','dsc09070.jpg','dsc09075.jpg','dsc09090.jpg','dsc09105.jpg',
    'dsc09110.jpg','dsc09112.jpg','dsc09125.jpg','dsc09130.jpg','dsc09136.jpg',
    'dsc09138.jpg','dsc09144.jpg','dsc09145.jpg','dsc09175.jpg','dsc09177.jpg',
    'dsc09186.jpg','dsc09188.jpg','dsc09215.jpg','dsc09227.jpg','dsc09232.jpg',
    'dsc09235.jpg','dsc09243.jpg','dsc09276.jpg','dsc09286.jpg','dsc09291.jpg',
    'dsc09321.jpg','dsc09347.jpg','dsc09365.jpg','dsc09366.jpg','dsc09367.jpg',
    'dsc09392.jpg','dsc09396.jpg','dsc09403.jpg','dsc09404.jpg','dsc09410.jpg',
    'dsc09414.jpg','dsc09421.jpg','dsc09427.jpg','dsc09453.jpg','dsc09493.jpg',
    'dsc09510.jpg','dsc09513.jpg','dsc09528.jpg','dsc09531.jpg','dsc09566.jpg',
    'dsc09567.jpg','dsc09631.jpg','dsc09634.jpg','dsc09636.jpg'
];

(function initStoryPhoto() {
    const img = document.getElementById('storyPhoto');
    if (!img) return;

    const STORY_PHOTO_KEY = 'story-photo-idx';
    let index = Math.floor(Math.random() * NISAN_PHOTOS.length);

    // Ayni fotograf iki yenilemede ust uste gelmesin
    try {
        const previous = Number(localStorage.getItem(STORY_PHOTO_KEY));
        if (Number.isInteger(previous) && index === previous && NISAN_PHOTOS.length > 1) {
            index = (index + 1) % NISAN_PHOTOS.length;
        }
        localStorage.setItem(STORY_PHOTO_KEY, String(index));
    } catch (e) { /* localStorage kapaliysa rastgele sec */ }

    const base = NISAN_PHOTOS[index].replace(/\.jpg$/, '');
    img.addEventListener('error', () => {
        img.src = `./assets/images/nisan/${base}.jpg`;
    }, { once: true });
    img.src = `./assets/images/nisan/${base}.webp`;
    img.removeAttribute('srcset');
})();

/* ——— Push Notifications ——— */
const VAPID_PUBLIC_KEY = 'BEy1KoVu7x7X0-677GF1EV0P4ViPeL7RSNz1IygEVl8Zbzqw19XgVkMS0jL6E0u6AejFRTgtMIYu1vTSDcaDp0U';
const PUSH_SUBSCRIBE_URL = 'https://zeynepbatuhan-rsvp-api.batuhannilgarr.workers.dev/push-subscribe';

function urlBase64ToUint8Array(b64) {
    const pad = '='.repeat((4 - b64.length % 4) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function sendPushSubscription(sub) {
    await fetch(PUSH_SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
    });
}

async function initPushNotifications() {
    if (!('Notification' in window) || !('PushManager' in window)) return;
    const btn = document.getElementById('notifyBtn');
    const item = document.getElementById('notifyItem');
    if (!btn) return;

    if (Notification.permission === 'denied') {
        item?.remove();
        return;
    }

    if (Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        if (!reg) return;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
            btn.textContent = '✅ Bildirimler açık';
            btn.disabled = true;
            return;
        }
    }

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') { item?.remove(); return; }
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            await sendPushSubscription(sub);
            btn.textContent = '✅ Bildirimler açık';
        } catch {
            btn.disabled = false;
            btn.textContent = '🔔 Bildirimlere Abone Ol';
        }
    });
}

initPushNotifications();

/* ============ PAYLASILABILIR GERI SAYIM KARTI ============ */
/* Aktif geri sayim sekmesine gore 1080x1920 story gorseli uretir.
   Paylasim destegi varsa dogrudan paylasir, yoksa indirir. */

const storyCardBtn = document.getElementById('storyCardBtn');

if (storyCardBtn) {
    const storyCardStatus = document.getElementById('storyCardStatus');
    const STORY_W = 1080;
    const STORY_H = 1920;

    const STORY_EVENTS = {
        kina: {
            eyebrow: 'KINA GECEMİZE',
            dateMs: KINA_DATE_MS,
            dateLine: '24 EKİM 2026',
            venue: 'Aşk-ı Lavinya · 12:00',
            file: 'kina-geri-sayim.png'
        },
        nikah: {
            eyebrow: 'NİKAHIMIZA',
            dateMs: WEDDING_DATE_MS,
            dateLine: '25 EKİM 2026',
            venue: 'Beykoz Belediyesi · 14:00',
            file: 'nikah-geri-sayim.png'
        }
    };

    function activeStoryEvent() {
        const activeTab = document.querySelector('.ctab.active');
        return activeTab?.dataset.target === 'ctab-nikah'
            ? STORY_EVENTS.nikah
            : STORY_EVENTS.kina;
    }

    function daysLeft(targetMs) {
        return Math.max(0, Math.ceil((targetMs - Date.now()) / 86400000));
    }

    // ctx.letterSpacing her tarayicida yok; yoksa harfleri tek tek yerlestir.
    function drawTracked(ctx, text, centerX, y, spacing) {
        if ('letterSpacing' in ctx) {
            ctx.letterSpacing = `${spacing}px`;
            ctx.fillText(text, centerX, y);
            ctx.letterSpacing = '0px';
            return;
        }
        const chars = Array.from(text);
        const total = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, 0) - spacing;
        let x = centerX - total / 2;
        const prevAlign = ctx.textAlign;
        ctx.textAlign = 'left';
        chars.forEach((ch) => {
            ctx.fillText(ch, x, y);
            x += ctx.measureText(ch).width + spacing;
        });
        ctx.textAlign = prevAlign;
    }

    function loadBranch() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = './assets/images/sakura-branch.png';
        });
    }

    async function ensureStoryFonts() {
        if (!document.fonts?.load) return;
        try {
            await Promise.all([
                document.fonts.load("500 320px 'Cormorant Garamond'"),
                document.fonts.load("500 92px 'Cormorant Garamond'"),
                document.fonts.load("600 34px 'Lato'"),
                document.fonts.load("600 120px 'Dancing Script'")
            ]);
        } catch (err) { /* fallback fontlarla devam */ }
    }

    async function buildStoryCard(event, days) {
        await ensureStoryFonts();
        const branch = await loadBranch();

        const canvas = document.createElement('canvas');
        canvas.width = STORY_W;
        canvas.height = STORY_H;
        const ctx = canvas.getContext('2d');

        // Porselen zemin + petal isimalari
        ctx.fillStyle = '#fbf8f4';
        ctx.fillRect(0, 0, STORY_W, STORY_H);

        const topGlow = ctx.createRadialGradient(540, 60, 0, 540, 60, 900);
        topGlow.addColorStop(0, 'rgba(238, 179, 195, 0.42)');
        topGlow.addColorStop(1, 'rgba(238, 179, 195, 0)');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, STORY_W, STORY_H);

        const bottomGlow = ctx.createRadialGradient(540, 1880, 0, 540, 1880, 820);
        bottomGlow.addColorStop(0, 'rgba(207, 174, 127, 0.30)');
        bottomGlow.addColorStop(1, 'rgba(207, 174, 127, 0)');
        ctx.fillStyle = bottomGlow;
        ctx.fillRect(0, 0, STORY_W, STORY_H);

        // Ince cerceve
        ctx.strokeStyle = 'rgba(201, 113, 139, 0.32)';
        ctx.lineWidth = 2;
        ctx.strokeRect(52, 52, STORY_W - 104, STORY_H - 104);

        // Sakura dallari
        if (branch) {
            const bw = 860;
            const bh = branch.height * (bw / branch.width);
            ctx.globalAlpha = 0.85;
            ctx.drawImage(branch, (STORY_W - bw) / 2, 170, bw, bh);
            ctx.save();
            ctx.translate(STORY_W / 2, STORY_H - 200);
            ctx.rotate(Math.PI);
            ctx.drawImage(branch, -bw / 2, 0, bw, bh);
            ctx.restore();
            ctx.globalAlpha = 1;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        // Eyebrow
        ctx.fillStyle = '#b08d55';
        ctx.font = "600 34px 'Lato', system-ui, sans-serif";
        drawTracked(ctx, event.eyebrow, STORY_W / 2, 560, 13);

        // Gun sayisi
        ctx.fillStyle = '#43323c';
        if (days === 0) {
            ctx.font = "500 210px 'Cormorant Garamond', Georgia, serif";
            ctx.fillText('BUGÜN', STORY_W / 2, 810);
        } else if (days === 1) {
            ctx.font = "500 210px 'Cormorant Garamond', Georgia, serif";
            ctx.fillText('YARIN', STORY_W / 2, 810);
        } else {
            ctx.font = "500 330px 'Cormorant Garamond', Georgia, serif";
            ctx.fillText(String(days), STORY_W / 2, 830);
            ctx.fillStyle = '#8d7a82';
            ctx.font = "600 40px 'Lato', system-ui, sans-serif";
            drawTracked(ctx, 'GÜN KALDI', STORY_W / 2, 985, 12);
        }

        // Ayirici
        ctx.strokeStyle = 'rgba(201, 113, 139, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(STORY_W / 2 - 90, 1060);
        ctx.lineTo(STORY_W / 2 + 90, 1060);
        ctx.stroke();

        // Isimler
        ctx.fillStyle = '#43323c';
        ctx.font = "500 96px 'Cormorant Garamond', Georgia, serif";
        const zW = ctx.measureText('Zeynep').width;
        const bW = ctx.measureText('Batuhan').width;
        ctx.font = "400 84px 'Dancing Script', cursive";
        const ampW = ctx.measureText('&').width;
        const gap = 30;
        const totalW = zW + ampW + bW + gap * 2;
        let cursor = (STORY_W - totalW) / 2;

        ctx.textAlign = 'left';
        ctx.fillStyle = '#43323c';
        ctx.font = "500 96px 'Cormorant Garamond', Georgia, serif";
        ctx.fillText('Zeynep', cursor, 1195);
        cursor += zW + gap;
        ctx.fillStyle = '#c9718b';
        ctx.font = "400 84px 'Dancing Script', cursive";
        ctx.fillText('&', cursor, 1195);
        cursor += ampW + gap;
        ctx.fillStyle = '#43323c';
        ctx.font = "500 96px 'Cormorant Garamond', Georgia, serif";
        ctx.fillText('Batuhan', cursor, 1195);
        ctx.textAlign = 'center';

        // Tarih ve mekan
        ctx.fillStyle = '#5c4652';
        ctx.font = "600 36px 'Lato', system-ui, sans-serif";
        drawTracked(ctx, event.dateLine, STORY_W / 2, 1300, 10);

        ctx.fillStyle = '#8d7a82';
        ctx.font = "400 32px 'Lato', system-ui, sans-serif";
        ctx.fillText(event.venue, STORY_W / 2, 1360);

        // Alt imza
        ctx.fillStyle = '#b08d55';
        ctx.font = "600 28px 'Lato', system-ui, sans-serif";
        drawTracked(ctx, 'zeynepbatuhan.com', STORY_W / 2, 1560, 8);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        });
    }

    function setStoryStatus(message) {
        if (storyCardStatus) storyCardStatus.textContent = message;
    }

    storyCardBtn.addEventListener('click', async () => {
        const event = activeStoryEvent();
        const days = daysLeft(event.dateMs);

        storyCardBtn.disabled = true;
        setStoryStatus('Kartınız hazırlanıyor...');

        try {
            const blob = await buildStoryCard(event, days);
            if (!blob) throw new Error('blob olusturulamadi');

            const file = new File([blob], event.file, { type: 'image/png' });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Zeynep & Batuhan',
                    text: 'Zeynep & Batuhan · 25 Ekim 2026'
                });
                setStoryStatus('');
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = event.file;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            setStoryStatus('Kart indirildi — story\'nizde paylaşabilirsiniz 🌸');
        } catch (err) {
            if (err?.name === 'AbortError') {
                setStoryStatus('');
            } else {
                setStoryStatus('Kart oluşturulamadı, lütfen tekrar deneyin.');
            }
        } finally {
            storyCardBtn.disabled = false;
        }
    });
}
