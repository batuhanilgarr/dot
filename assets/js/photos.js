/* Misafir fotoğraf paylaşımı: yükleme ve galeri. Konum ekranı 25 Ekim 14:00'ten sonra
   fotoğraf alanına dönüştüğünde script.js tarafından yüklenir. */
(function () {
    'use strict';
    const DEFAULT_API = 'https://zeynepbatuhan-photos-api.batuhannilgarr.workers.dev';
    const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const API = ((isLocal && new URLSearchParams(location.search).get('photosApi')) || DEFAULT_API).replace(/\/$/, '');
    const MAX_FILES = 20;
    const PAGE = 24;
    const POLL_MS = 45000;

    const $ = (id) => document.getElementById(id);
    const form = $('photoForm');
    if (!form) return;
    const grid = $('photoGrid');
    const empty = $('photoEmpty');
    const more = $('photoMore');
    const pick = $('photoPick');
    const input = $('photoInput');
    const consent = $('photoConsent');
    const nameInput = $('photoName');
    const status = $('photoStatus');
    const queue = $('photoQueue');

    const seen = new Set();
    const items = [];
    let nextCursor = null;
    let uploadState = 'open';

    try { nameInput.value = sessionStorage.getItem('zb-guest-name') || ''; } catch (_) { /* ignore */ }

    function say(text, isError) {
        status.textContent = text || '';
        status.classList.toggle('is-error', !!isError);
    }

    function applyState(state) {
        uploadState = state;
        const closed = state !== 'open';
        pick.disabled = closed;
        if (state === 'not_open') say('Fotoğraf yükleme 25 Ekim Pazar 14:00’te açılır.');
        else if (state === 'closed') say('Fotoğraf yükleme kapandı. Paylaşılanlar aşağıda.');
    }

    /* ——— Galeri ——— */
    function makeItem(item) {
        const li = document.createElement('button');
        li.type = 'button';
        li.className = 'photo-item';
        li.dataset.id = item.id;
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = item.name ? `${item.name} tarafından paylaşılan fotoğraf` : 'Misafir fotoğrafı';
        img.src = `${API}/thumb/${encodeURIComponent(item.id)}`;
        li.appendChild(img);
        li.addEventListener('click', () => openLightbox(items.findIndex((x) => x.id === item.id)));
        return li;
    }

    function addItems(list, prepend) {
        const fresh = list.filter((item) => item && typeof item.id === 'string' && !seen.has(item.id));
        if (!fresh.length) return;
        fresh.forEach((item) => seen.add(item.id));
        if (prepend) {
            items.unshift(...fresh);
            const frag = document.createDocumentFragment();
            fresh.forEach((item) => frag.appendChild(makeItem(item)));
            grid.insertBefore(frag, grid.firstChild);
        } else {
            items.push(...fresh);
            fresh.forEach((item) => grid.appendChild(makeItem(item)));
        }
        empty.hidden = items.length > 0;
    }

    async function fetchPage(cursor) {
        const url = `${API}/photos?limit=${PAGE}${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('list');
        return response.json();
    }

    async function loadFirst() {
        try {
            const data = await fetchPage(null);
            applyState(data.open);
            addItems(data.items, false);
            nextCursor = data.cursor;
            more.hidden = !nextCursor;
        } catch (_) {
            say('Fotoğraflar şu an yüklenemedi. Biraz sonra tekrar deneyin.', true);
        }
    }

    more.addEventListener('click', async () => {
        if (!nextCursor) return;
        more.disabled = true;
        try {
            const data = await fetchPage(nextCursor);
            addItems(data.items, false);
            nextCursor = data.cursor;
            more.hidden = !nextCursor;
        } catch (_) {
            say('Daha fazla fotoğraf yüklenemedi.', true);
        } finally {
            more.disabled = false;
        }
    });

    async function poll() {
        if (document.hidden) return;
        try {
            const data = await fetchPage(null);
            if (data.open !== uploadState) applyState(data.open);
            addItems(data.items.filter((item) => !seen.has(item.id)), true);
        } catch (_) { /* sessizce geç */ }
    }

    /* ——— Büyütme ——— */
    let lightbox;
    let lbIndex = 0;
    function ensureLightbox() {
        if (lightbox) return;
        lightbox = document.createElement('dialog');
        lightbox.className = 'photo-lightbox';
        lightbox.setAttribute('aria-label', 'Fotoğraf önizleme');
        lightbox.innerHTML = '<button type="button" class="lb-close" aria-label="Kapat">✕</button>' +
            '<button type="button" class="lb-prev" aria-label="Önceki">‹</button>' +
            '<button type="button" class="lb-next" aria-label="Sonraki">›</button>' +
            '<div class="photo-lightbox-inner"><img alt=""><p></p></div>';
        document.body.appendChild(lightbox);
        lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
        lightbox.querySelector('.lb-prev').addEventListener('click', () => showLightbox(lbIndex - 1));
        lightbox.querySelector('.lb-next').addEventListener('click', () => showLightbox(lbIndex + 1));
        lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
        lightbox.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') showLightbox(lbIndex - 1);
            if (event.key === 'ArrowRight') showLightbox(lbIndex + 1);
        });
    }
    function showLightbox(index) {
        if (index < 0 || index >= items.length) return;
        lbIndex = index;
        const item = items[index];
        const img = lightbox.querySelector('img');
        img.src = `${API}/photo/${encodeURIComponent(item.id)}`;
        img.alt = item.name ? `${item.name} tarafından paylaşılan fotoğraf` : 'Misafir fotoğrafı';
        lightbox.querySelector('p').textContent = item.name ? `📷 ${item.name}` : '';
        lightbox.querySelector('.lb-prev').hidden = index === 0;
        lightbox.querySelector('.lb-next').hidden = index === items.length - 1;
    }
    function openLightbox(index) {
        if (index < 0) return;
        ensureLightbox();
        showLightbox(index);
        if (!lightbox.open) lightbox.showModal();
    }

    /* ——— Yükleme ——— */
    async function toJpeg(file, maxSide, quality) {
        let source;
        if (window.createImageBitmap) {
            try { source = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { source = null; }
        }
        if (!source) {
            source = await new Promise((resolve, reject) => {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
                img.src = url;
            });
        }
        const width = source.width || source.naturalWidth;
        const height = source.height || source.naturalHeight;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        if (source.close) source.close();
        // JPEG'e yeniden çizmek EXIF (konum dahil) bilgisini de temizler.
        return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('encode')), 'image/jpeg', quality));
    }

    async function uploadOne(file, name) {
        const [full, thumb] = await Promise.all([toJpeg(file, 1600, 0.82), toJpeg(file, 480, 0.72)]);
        const body = new FormData();
        body.append('file', full, 'photo.jpg');
        body.append('thumb', thumb, 'thumb.jpg');
        body.append('name', name);
        const response = await fetch(`${API}/upload`, { method: 'POST', body });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const error = new Error(err.error || 'upload');
            error.code = err.error || String(response.status);
            throw error;
        }
        return response.json();
    }

    const ERRORS = {
        not_open: 'Yükleme henüz açılmadı.',
        closed: 'Yükleme kapandı.',
        rate_limited: 'Çok fazla yükleme. Birkaç dakika sonra tekrar deneyin.',
        too_large: 'Fotoğraf çok büyük.',
        decode: 'Bu fotoğraf biçimi desteklenmiyor.'
    };

    async function handleFiles(fileList) {
        const files = Array.from(fileList).filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
        if (!files.length) { say('Lütfen fotoğraf dosyası seçin.', true); return; }
        const batch = files.slice(0, MAX_FILES);
        if (files.length > MAX_FILES) say(`Tek seferde en fazla ${MAX_FILES} fotoğraf yüklenir; ilk ${MAX_FILES} tanesi gönderiliyor.`);
        else say('');
        const name = nameInput.value.trim().slice(0, 40);
        try { sessionStorage.setItem('zb-guest-name', name); } catch (_) { /* ignore */ }

        queue.textContent = '';
        const rows = batch.map((file) => {
            const li = document.createElement('li');
            const label = document.createElement('span');
            label.textContent = file.name || 'fotoğraf';
            const state = document.createElement('span');
            state.textContent = 'Bekliyor';
            li.append(label, state);
            queue.appendChild(li);
            return { file, li, state };
        });

        pick.disabled = true;
        let done = 0;
        let cursor = 0;
        async function worker() {
            while (cursor < rows.length) {
                const row = rows[cursor++];
                row.state.textContent = 'Yükleniyor…';
                try {
                    const result = await uploadOne(row.file, name);
                    row.li.classList.add('is-ok');
                    row.state.textContent = '✓ Yüklendi';
                    done += 1;
                    addItems([{ id: result.id, name: result.name || '' }], true);
                } catch (error) {
                    row.li.classList.add('is-error');
                    row.state.textContent = ERRORS[error.code] || ERRORS[error.message] || 'Yüklenemedi';
                    if (error.code === 'not_open' || error.code === 'closed') applyState(error.code);
                }
            }
        }
        await Promise.all([worker(), worker()]);
        pick.disabled = uploadState !== 'open';
        if (done) say(`${done} fotoğraf paylaşıldı, teşekkür ederiz 💕`);
        else say('Fotoğraflar yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.', true);
        input.value = '';
    }

    pick.addEventListener('click', () => {
        if (uploadState !== 'open') return;
        if (!consent.checked) {
            say('Devam etmek için önce paylaşım onayını işaretleyin.', true);
            consent.focus();
            return;
        }
        input.click();
    });
    input.addEventListener('change', () => { if (input.files && input.files.length) handleFiles(input.files); });
    consent.addEventListener('change', () => { if (consent.checked) say(''); });
    form.addEventListener('submit', (event) => event.preventDefault());

    loadFirst();
    setInterval(poll, POLL_MS);
}());
