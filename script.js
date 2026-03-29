const introVideo = document.getElementById('introVideo');
const videoContainer = document.getElementById('videoContainer');
const content = document.getElementById('content');
const butterfliesContainer = document.getElementById('butterflies');
const menu = document.getElementById('menu');
const menuToggle = document.getElementById('menuToggle');
const menuItems = document.getElementById('menuItems');
const backgroundMusic = document.getElementById('backgroundMusic');

introVideo.addEventListener('ended', () => {
    videoContainer.classList.add('hidden');
    content.classList.add('visible');
    menu.classList.add('visible');
    document.body.style.overflow = 'auto';
    
    backgroundMusic.play().catch(error => {
        console.log('Müzik otomatik başlatma engellendi:', error);
    });
});

introVideo.addEventListener('error', () => {
    console.log('Video yüklenemedi, içerik gösteriliyor...');
    videoContainer.classList.add('hidden');
    content.classList.add('visible');
    menu.classList.add('visible');
    document.body.style.overflow = 'auto';
    
    backgroundMusic.play().catch(error => {
        console.log('Müzik otomatik başlatma engellendi:', error);
    });
});

menuToggle.addEventListener('click', () => {
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

window.addEventListener('scroll', () => {
    const butterflies = document.querySelectorAll('.butterfly');
    const scrollY = window.scrollY;
    
    butterflies.forEach((butterfly, index) => {
        const speed = 0.1 + (index % 3) * 0.05;
        butterfly.style.transform = `translateY(${scrollY * speed}px)`;
    });
});

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
