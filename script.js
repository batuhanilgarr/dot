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
const RSVP_API_URL = 'https://zeynepbatuhan-rsvp-api.batuhannilgarr.workers.dev/rsvp-count';
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
    
    butterfly.style.left = Math.random() * 100 + '%';
    butterfly.style.top = Math.random() * 100 + '%';
    
    const duration = 10 + Math.random() * 10;
    butterfly.style.animationDuration = duration + 's';
    
    const delay = Math.random() * 5;
    butterfly.style.animationDelay = delay + 's';
    
    butterfliesContainer.appendChild(butterfly);
}

for (let i = 0; i < 15; i++) {
    createButterfly();
}

const butterflies = document.querySelectorAll('.butterfly');
let rafId = null;

function updateButterflyParallax() {
    const scrollY = window.scrollY;

    butterflies.forEach((butterfly, index) => {
        const speed = 0.06 + (index % 3) * 0.03;
        butterfly.style.transform = `translateY(${scrollY * speed}px)`;
    });

    rafId = null;
}

if (!isMobile) {
    window.addEventListener('scroll', () => {
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(updateButterflyParallax);
    }, { passive: true });
}

function updateCountdown() {
    const weddingDate = new Date('2026-05-10T13:00:00').getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    
    if (distance < 0) {
        document.getElementById('countdown').innerHTML = '<p style="font-size: 24px; color: #667eea;">Mutlu Günler! 💕</p>';
    }
}

updateCountdown();
setInterval(updateCountdown, 1000);
initScrollReveal();
<<<<<<< HEAD
=======

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
>>>>>>> b600f7e (Improve mobile performance and add live RSVP counter.)
