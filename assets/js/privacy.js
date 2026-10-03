(function () {
    'use strict';
    const KEY = 'zb-consent-v1';
    const DISMISS_KEY = 'zb-consent-dismissed';
    const AGE = 180 * 24 * 60 * 60 * 1000;
    const measurementId = document.querySelector('meta[name="ga-measurement-id"]')?.content;
    let choice = null;
    let loaded = false;
    let dialog;
    let previousFocus;
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        if (saved && saved.version === 1 && typeof saved.analytics === 'boolean' &&
            Number.isFinite(saved.time) && saved.time <= Date.now() && Date.now() - saved.time < AGE) choice = saved;
    } catch (_) { /* A blocked store means no prior permission. */ }

    function allowed() { return choice?.analytics === true; }
    function clearAnalyticsCookies() {
        document.cookie.split(';').forEach((entry) => {
            const name = entry.split('=')[0].trim();
            if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) return;
            const domains = ['', location.hostname, '.' + location.hostname, 'zeynepbatuhan.com', '.zeynepbatuhan.com'];
            const segments = location.pathname.split('/');
            const paths = new Set(['/']);
            for (let i = 1; i < segments.length; i++) paths.add(segments.slice(0, i).join('/') || '/');
            paths.forEach((path) => domains.forEach((domain) => {
                document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=Lax${domain ? '; domain=' + domain : ''}`;
            }));
        });
    }
    if (measurementId) window['ga-disable-' + measurementId] = !allowed();
    if (!allowed()) clearAnalyticsCookies();

    function loadAnalytics() {
        if (!allowed() || loaded || !measurementId) return;
        loaded = true;
        window['ga-disable-' + measurementId] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
            analytics_storage: 'granted', ad_storage: 'denied',
            ad_user_data: 'denied', ad_personalization: 'denied'
        });
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
            allow_google_signals: false, allow_ad_personalization_signals: false,
            cookie_expires: 15552000,
            page_location: location.origin + location.pathname,
            page_referrer: document.referrer ? new URL(document.referrer).origin : ''
        });
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        document.head.appendChild(script);
    }
    function track(name, params) {
        if (!allowed()) return;
        loadAnalytics();
        if (loaded) window.gtag('event', name, params);
    }
    function save(analytics) {
        const revokeLoaded = loaded && !analytics;
        choice = { version: 1, analytics, time: Date.now() };
        try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (_) { /* Session-only choice. */ }
        if (measurementId) window['ga-disable-' + measurementId] = !analytics;
        if (!analytics) clearAnalyticsCookies();
        dialog?.close();
        updateStatus();
        if (revokeLoaded) { location.reload(); return; }
        if (analytics) loadAnalytics();
    }
    function updateStatus() {
        document.querySelectorAll('[data-consent-status]').forEach((el) => {
            el.textContent = allowed() ? 'İstatistik ölçümü açık.' : 'İstatistik ölçümü kapalı.';
        });
    }
    function open() {
        if (!dialog) return;
        previousFocus = document.activeElement;
        // Modal değil: altta sabit bir şerit olarak açılır, sayfa içeriğini kapatmaz.
        if (!dialog.open) dialog.show();
    }
    window.sitePrivacy = { allowed, loadAnalytics, track, open };
    window.addEventListener('storage', (event) => {
        if (event.key === KEY || event.key === null) location.reload();
    });
    function init() {
        dialog = document.createElement('dialog');
        dialog.className = 'privacy-dialog';
        dialog.setAttribute('aria-labelledby', 'privacy-title');
        dialog.innerHTML = '<h2 id="privacy-title">Çerez tercihleri</h2>' +
            '<p>Siteyi kullanmak için gerekli depolama araçları çalışır. Google Analytics ile sayfa kullanımı ve etkileşimleri ölçmemize izin vermek ister misiniz? Reddettiğinizde siteyi kullanmaya devam edebilirsiniz.</p>' +
            '<p><a href="/cerez-politikasi.html">Çerezler ve saklama süreleri</a> · <a href="/gizlilik.html">Gizlilik ve kişisel veriler</a></p>' +
            '<div class="privacy-actions"><button type="button" data-choice="no" autofocus>İstatistikleri reddet</button>' +
            '<button type="button" data-choice="yes">İstatistiklere izin ver</button></div>' +
            '<button type="button" data-close class="privacy-close">Seçmeden kapat</button>';
        document.body.appendChild(dialog);
        dialog.querySelector('[data-choice="no"]').addEventListener('click', () => save(false));
        dialog.querySelector('[data-choice="yes"]').addEventListener('click', () => save(true));
        dialog.querySelector('[data-close]').addEventListener('click', () => {
            try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (_) { /* Only this view. */ }
            dialog.close();
        });
        dialog.addEventListener('close', () => previousFocus?.focus());
        dialog.addEventListener('keydown', (event) => { if (event.key === 'Escape') dialog.close(); });
        document.querySelectorAll('[data-cookie-settings]').forEach((button) => button.addEventListener('click', open));
        updateStatus();
        if (allowed()) loadAnalytics();
        // Policy and contact information must remain readable without making a choice.
        // Etkinlik günü konum ekranı açıkken ve bu oturumda kapatıldıysa pencere kendiliğinden açılmaz.
        let dismissed = false;
        try { dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (_) { /* ignore */ }
        const eventScreen = document.documentElement.classList.contains('event-day');
        if (!choice && !dismissed && !eventScreen &&
            !/\/(gizlilik|cerez-politikasi|iletisim)\.html$/.test(location.pathname)) open();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
