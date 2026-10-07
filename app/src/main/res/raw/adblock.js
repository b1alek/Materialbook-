(function() {

    const sponsoredTexts = [
        "Sponsored", "Ad", "Gesponsert", "Sponsorlu", "Sponsorowane",
        "Ispoonsara godhameera", "Geborg", "Bersponsor", "Ditaja",
        "Disponsori", "Giisponsoran", "Sponzorováno", "Sponsoreret",
        "Publicidad", "May Sponsor", "Sponsorisée", "Sponsorisé", "Oipytyvôva",
        "Ɗaukar Nayin", "Sponzorirano", "Uterwa inkunga", "Sponsorizzato",
        "Imedhaminiwa", "Hirdetés", "Misy Mpiantoka", "Gesponsord",
        "Sponset", "Patrocinado", "Sponsorizat", "Sponzorované",
        "Sponsoroitu", "Sponsrat", "Được tài trợ", "Χορηγούμενη",
        "Спонсорирано", "Спонзорирано", "Ивээн тэтгэсэн", "Реклама",
        "Спонзорисано", "במימון", "سپانسرڈ", "دارای پشتیبانی مالی",
        "ስፖንሰር የተደረገ", "प्रायोजित", "ተደረገ", "प", "স্পনসর্ড",
        "ਪ੍ਰਯੋਜਿਤ", "પ્રાયોજિત", "ପ୍ରାୟୋଜିତ", "செய்யப்பட்ட",
        "చేయబడినది", "ಪ್ರಾಯೋಜಿಸಲಾಗಿದೆ", "ചെയ്‌തത്",
        "ලද", "สนับสนุน", "ကြော်ငြာ", "ឧបត្ថម្ភ", "광고",
        "贊助", "赞助内容", "広告", "Anzeige", "Peye", "Oglas"
    ];

    function containsSponsoredText(text) {
        if (!text) return false;
        // Strip zero-width chars and normalize whitespace
        const clean = text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase();
        if (!clean) return false;

        return sponsoredTexts.some(word => {
            const lowerWord = word.toLowerCase();
            const wordBoundaryRegex = new RegExp(`(^|\\s|[.,·•])(${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})($|\\s|[.,·•])`, 'i');
            return wordBoundaryRegex.test(clean);
        });
    }

    const AD_LINK_SELECTOR = 'a[href*="/ads/about"], a[href*="facebook.com/ads/about"], a[href*="/ads/preferences"], a[href*="/ads/disclosure"], a[href*="sponsored_ad"]';

    function isAdContainer(el) {
        if (!el || !(el instanceof HTMLElement)) return false;

        // 1. Mandatory ad transparency links
        if (el.querySelector(AD_LINK_SELECTOR)) return true;

        // 2. ARIA labels on element or children
        const aria = el.getAttribute('aria-label');
        if (aria && containsSponsoredText(aria)) return true;
        const ariaAd = el.querySelector('[aria-label*="Sponsor" i], [aria-label*="Sponsored" i], [aria-label*="Sponsorowane" i], [aria-label*="Reklama" i]');
        if (ariaAd) return true;

        // 3. Known ad text elements (classes frequently used by Facebook mobile/desktop)
        const candidates = el.querySelectorAll('span.f5, span.f2, div.native-text, div[role="button"] span, header span');
        for (const c of candidates) {
            const txt = c.textContent;
            if (txt && containsSponsoredText(txt)) return true;
            // Legacy inline color marker
            if (c.matches('span.f5[style*="color:#8a8d91"]:not([data-nosnippet])')) return true;
        }

        return false;
    }

    // --- Feed Ads Removal ---
    function removeFeedAds(root = document) {
        const isDesktop = window.isDesktopMode && window.isDesktopMode();

        if (isDesktop) {
            const desktopSelectors = 'div[data-pagelet*="FeedUnit"], div[role="feed"] > div, div[role="article"], div.sponsored_ad, article[data-ft*="sponsored_ad"]';
            const posts = root.querySelectorAll(desktopSelectors);
            posts.forEach(post => {
                if (post.dataset.adHidden === 'true') return;
                if (post.matches('div.sponsored_ad, article[data-ft*="sponsored_ad"]') || isAdContainer(post)) {
                    post.dataset.adHidden = 'true';
                    post.style.display = 'none';
                }
            });
            return;
        }

        // Mobile Feed Ads (m.facebook.com)
        const mobilePosts = root.querySelectorAll('[data-tracking-duration-id], div[data-dcm-id="1"][data-mcomponent="MContainer"]');
        mobilePosts.forEach(container => {
            if (container.dataset.adHidden === 'true') return;

            if (isAdContainer(container)) {
                container.dataset.adHidden = 'true';
                container.style.display = 'none';

                // Hide separator/gap preceding the post
                const postSeparator = container.previousElementSibling;
                if (postSeparator && (postSeparator.offsetHeight <= 8 || postSeparator.querySelector('[data-fd-action]'))) {
                    postSeparator.style.display = 'none';
                }
            }
        });
    }

    // Initial feed cleanup
    removeFeedAds();

    // --- Reel Ads Removal ---
    function removeReelAds(root = document) {
        const containers = root.querySelectorAll('div.vertically-snappable');

        containers.forEach(container => {
            if (container.dataset.adHidden === 'true') return;

            const spans = container.querySelectorAll('span');
            for (const span of spans) {
                const text = span.textContent;
                if (containsSponsoredText(text)) {
                    container.dataset.adHidden = 'true';
                    container.innerHTML = '';

                    const messageDiv = document.createElement('div');
                    messageDiv.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        width: 100%;
                        background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
                        color: #666;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                        box-sizing: border-box;
                    `;

                    const icon = document.createElement('div');
                    icon.style.cssText = 'font-size: 48px; margin-bottom: 16px; opacity: 0.6;';
                    icon.textContent = '🚫';

                    const title = document.createElement('div');
                    title.style.cssText = 'font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #888;';
                    title.textContent = 'Ad Blocked';

                    const subtitle = document.createElement('div');
                    subtitle.style.cssText = 'font-size: 14px; color: #555; line-height: 1.4;';
                    subtitle.textContent = 'Sponsored content was removed';

                    messageDiv.appendChild(icon);
                    messageDiv.appendChild(title);
                    messageDiv.appendChild(subtitle);
                    container.appendChild(messageDiv);

                    container.style.pointerEvents = 'none';
                    container.style.userSelect = 'none';

                    setupAutoScroll(container);
                    break;
                }
            }
        });
    }

    function setupAutoScroll(container) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    let nextReel = container.nextElementSibling;
                    while (nextReel && nextReel.dataset.adHidden === 'true') {
                        nextReel = nextReel.nextElementSibling;
                    }

                    if (nextReel) {
                        setTimeout(() => {
                            nextReel.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                                inline: 'nearest'
                            });
                            setTimeout(() => {
                                window.scrollBy({ top: 100, behavior: 'smooth' });
                            }, 200);
                        }, 100);
                    }
                    observer.unobserve(container);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(container);
    }

    removeReelAds();

    // Unified observer for feed & reel ads
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                removeFeedAds(node.parentElement || document);
                if (node.matches('div.vertically-snappable') || node.querySelector('div.vertically-snappable')) {
                    removeReelAds(node.parentElement || document);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
