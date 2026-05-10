const introVideo = document.getElementById('introVideo');
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

window.addEventListener('load', () => {
    if (!isMobile) {
        ensureVideoSource();
    } else {
        videoContainer?.classList.add('hidden');
        content?.classList.add('visible');
        menu?.classList.add('visible');
        document.body.style.overflow = 'auto';
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

document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        if (!item) return;

        item.classList.toggle('active');
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

const WEDDING_DATE_MS = new Date('2026-05-10T13:00:00+03:00').getTime();
const EVENT_END_MS = new Date('2026-05-10T17:00:00+03:00').getTime();

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

        rsvpCountValue.textContent = String(count);
        rsvpCountUpdated.textContent = new Date(updatedAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.log('RSVP sayisi alinamadi:', error);
        rsvpCountUpdated.textContent = 'Canli veri alinamadi';
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
        rsvpActionStatus.textContent = `Katilim bildiriminiz alindi (${previousValue} kisi). Tesekkur ederiz!`;
        return;
    }

    const selectedGuestCount = Math.floor(Number(rsvpGuestCount.value || 1));
    if (!Number.isFinite(selectedGuestCount) || selectedGuestCount < 1) {
        rsvpActionStatus.textContent = 'Lutfen 1 veya daha buyuk bir kisi sayisi girin.';
        return;
    }
    rsvpConfirmButton.disabled = true;
    rsvpGuestCount.disabled = true;
    rsvpActionStatus.textContent = `${selectedGuestCount} kisi icin kaydediliyor...`;

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
        rsvpActionStatus.textContent = `Katilim bildiriminiz alindi (${selectedGuestCount} kisi). Cok tesekkurler!`;
        await updateRsvpCount();
    } catch (error) {
        console.log('RSVP kaydi gonderilemedi:', error);
        rsvpActionStatus.textContent = 'Gonderilemedi, lutfen tekrar deneyin.';
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
            rsvpActionStatus.textContent = `Bu cihazdan katilim bildirimi daha once yapildi (${previousValue} kisi).`;
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

    const weddingDate = new Date('2026-05-10T13:00:00').getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

    let message;
    if (distance <= 0) message = '🎉 Bugün o özel gün!';
    else if (days === 0) message = '🌸 Bu gece nişan var! Görüşmek üzere!';
    else if (days === 1) message = '🌸 Yarın nişan! Görüşmek üzere!';
    else message = `🌸 Nişana ${days} gün kaldı! Görüşmek üzere!`;

    toast.textContent = message;

    toast.addEventListener('click', () => toast.classList.remove('visible'), { once: true });

    setTimeout(() => {
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 5500);
    }, 1800);
}

async function loadWeather() {
    const weatherCard = document.getElementById('weatherCard');
    if (!weatherCard) return;

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

    try {
        const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=40.9989&longitude=29.1500&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe%2FIstanbul&start_date=2026-05-10&end_date=2026-05-10'
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const code = data.daily.weathercode[0];
        const tmax = Math.round(data.daily.temperature_2m_max[0]);
        const tmin = Math.round(data.daily.temperature_2m_min[0]);
        const [icon, desc] = WMO[code] || ['🌡️', 'Belirsiz'];

        const iconEl = document.getElementById('weatherIcon');
        const descEl = document.getElementById('weatherDesc');
        const tempEl = document.getElementById('weatherTemp');

        if (iconEl) iconEl.textContent = icon;
        if (descEl) descEl.textContent = desc;
        if (tempEl) tempEl.textContent = `${tmin}° — ${tmax}°C`;
        weatherCard.classList.add('loaded');
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

if (Date.now() >= WEDDING_DATE_MS) {
    activateBloomMode();
}

const bloomQueryFlag = new URLSearchParams(window.location.search).get('bloom') === '1';
const bloomHashFlag = window.location.hash === '#bloom';
if (bloomQueryFlag || bloomHashFlag) {
    activateBloomMode();
}
