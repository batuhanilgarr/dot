(function () {
    'use strict';

    const loadAnalytics = () => {
        window.sitePrivacy?.loadAnalytics();
    };

    const track = (eventName, parameters) => {
        window.sitePrivacy?.track(eventName, parameters);
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
