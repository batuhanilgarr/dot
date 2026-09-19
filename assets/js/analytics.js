(function () {
    'use strict';

    const measurementId = document.querySelector('meta[name="ga-measurement-id"]')?.content;
    if (!measurementId || window.__siteAnalyticsLoaded) return;

    let loaded = false;
    const loadAnalytics = () => {
        if (loaded || window.__siteAnalyticsLoaded) return;
        loaded = true;
        window.__siteAnalyticsLoaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', measurementId, { anonymize_ip: true });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
    };

    ['pointerdown', 'keydown', 'scroll'].forEach((eventName) => {
        window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
    });

    window.setTimeout(loadAnalytics, 5000);
}());
