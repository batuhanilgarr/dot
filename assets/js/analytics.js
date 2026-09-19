(function () {
    'use strict';

    const measurementId = document.querySelector('meta[name="ga-measurement-id"]')?.content;
    if (!measurementId || window.__siteAnalyticsLoaded) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

    let loaded = false;
    const loadAnalytics = () => {
        if (loaded || window.__siteAnalyticsLoaded) return;
        loaded = true;
        window.__siteAnalyticsLoaded = true;

        window.gtag('js', new Date());
        window.gtag('config', measurementId, { anonymize_ip: true });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
    };

    const track = (eventName, parameters) => {
        loadAnalytics();
        window.gtag('event', eventName, parameters);
    };

    document.addEventListener('click', (event) => {
        const target = event.target.closest('a, button');
        if (!target) return;

        if (target.matches('button[onclick*="window.print"]')) {
            track('print_checklist', { page_path: location.pathname });
            return;
        }

        if (!(target instanceof HTMLAnchorElement)) return;
        const url = new URL(target.href, location.href);

        if (target.hasAttribute('download')) {
            track('file_download', {
                file_name: url.pathname.split('/').pop() || '',
                link_url: url.href
            });
        } else if (url.origin !== location.origin) {
            track('outbound_click', {
                link_domain: url.hostname,
                link_url: url.href
            });
        } else if (target.classList.contains('seo-link-card')) {
            track('select_content', {
                content_type: 'guide',
                item_id: url.pathname
            });
        }
    });

    let articleCompleteTracked = false;
    const trackArticleComplete = () => {
        if (articleCompleteTracked) return;
        const article = document.querySelector('.seo-page');
        if (!article) return;
        const articleBottom = article.getBoundingClientRect().bottom + window.scrollY;
        if (window.scrollY + window.innerHeight < articleBottom - 120) return;
        articleCompleteTracked = true;
        track('article_complete', { page_path: location.pathname });
    };

    ['pointerdown', 'keydown', 'scroll'].forEach((eventName) => {
        window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
    });
    window.addEventListener('scroll', trackArticleComplete, { passive: true });
    window.setTimeout(loadAnalytics, 5000);
}());
