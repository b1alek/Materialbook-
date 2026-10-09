// Preserve Scroll Userscript for Materialbook
(function() {
    'use strict';

    try {
        const STORAGE_KEY = 'materialbook_scroll_anchor';
        const GUARD_DURATION_MS = 1500;
        const TOUCH_ESCAPE_THRESHOLD_MS = 500;
        const DEBOUNCE_DELAY_MS = 200;

        let isGuardActive = false;
        let guardTimer = null;
        let lastUserTouch = 0;
        let saveTimer = null;

        // 1. User Touch Tracking
        function recordUserTouch() {
            lastUserTouch = Date.now();
        }

        window.addEventListener('touchstart', recordUserTouch, { passive: true, capture: true });
        window.addEventListener('pointerdown', recordUserTouch, { passive: true, capture: true });

        // 2. DOM Anchor Tracking
        function findTopmostPost() {
            try {
                const candidates = document.querySelectorAll('[data-tracking-duration-id], [role="article"], [data-ft], article');
                let bestElement = null;
                let minTopDistance = Infinity;

                for (let i = 0; i < candidates.length; i++) {
                    const el = candidates[i];
                    const rect = el.getBoundingClientRect();

                    // Ignore tiny non-content elements
                    if (rect.height < 40 || rect.width < 50) continue;

                    // Detect elements visible within viewport or near top reading area
                    if (rect.bottom > 50 && rect.top < window.innerHeight) {
                        const distance = Math.abs(rect.top);
                        if (distance < minTopDistance) {
                            minTopDistance = distance;
                            bestElement = el;
                        }
                    }
                }
                return bestElement;
            } catch (e) {
                return null;
            }
        }

        function saveAnchor() {
            try {
                const bestElement = findTopmostPost();
                const scrollY = window.scrollY || window.pageYOffset || 0;

                if (!bestElement) {
                    if (scrollY > 0) {
                        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                            scrollY: scrollY,
                            timestamp: Date.now()
                        }));
                    }
                    return;
                }

                // Tag current anchor element with unique attribute
                const existing = document.querySelector('[data-materialbook-anchor="true"]');
                if (existing && existing !== bestElement) {
                    existing.removeAttribute('data-materialbook-anchor');
                }
                bestElement.setAttribute('data-materialbook-anchor', 'true');

                const anchorData = {
                    id: bestElement.id || null,
                    trackingId: bestElement.getAttribute('data-tracking-duration-id') || null,
                    dataFt: bestElement.getAttribute('data-ft') || null,
                    rectTop: bestElement.getBoundingClientRect().top,
                    scrollY: scrollY,
                    timestamp: Date.now()
                };

                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(anchorData));
            } catch (e) {}
        }

        function debouncedSaveAnchor() {
            if (saveTimer) {
                clearTimeout(saveTimer);
            }
            saveTimer = setTimeout(saveAnchor, DEBOUNCE_DELAY_MS);
        }

        window.addEventListener('scroll', debouncedSaveAnchor, { passive: true });

        // 3. Media Silence on Page Hide
        function silenceMedia() {
            try {
                const mediaElements = document.querySelectorAll('video, audio');
                mediaElements.forEach(function(media) {
                    if (!media.paused) {
                        media.pause();
                    }
                });
            } catch (e) {}
        }

        function handlePageHide() {
            saveAnchor();
            silenceMedia();
        }

        window.addEventListener('pagehide', handlePageHide);

        // 4. Scroll Guard Window & Restoration
        function startGuardWindow() {
            isGuardActive = true;
            if (guardTimer) {
                clearTimeout(guardTimer);
            }
            guardTimer = setTimeout(function() {
                isGuardActive = false;
                guardTimer = null;
            }, GUARD_DURATION_MS);
        }

        function restoreAnchor() {
            try {
                const raw = sessionStorage.getItem(STORAGE_KEY);
                if (!raw) return;

                const data = JSON.parse(raw);
                if (!data) return;

                let element = document.querySelector('[data-materialbook-anchor="true"]');
                if (!element && data.id) {
                    element = document.getElementById(data.id);
                }
                if (!element && data.trackingId) {
                    element = document.querySelector('[data-tracking-duration-id="' + CSS.escape(data.trackingId) + '"]');
                }
                if (!element && data.dataFt) {
                    element = document.querySelector('[data-ft="' + CSS.escape(data.dataFt) + '"]');
                }

                if (element) {
                    element.scrollIntoView({ block: 'start' });
                } else if (typeof data.scrollY === 'number' && data.scrollY > 0) {
                    window.scrollTo(0, data.scrollY);
                }
            } catch (e) {}
        }

        function onResumeOrResize() {
            startGuardWindow();
            restoreAnchor();
            // Retry once after next frame in case of layout reflow
            setTimeout(restoreAnchor, 50);
        }

        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                handlePageHide();
            } else if (document.visibilityState === 'visible') {
                onResumeOrResize();
            }
        });

        window.addEventListener('resize', onResumeOrResize);
        window.addEventListener('orientationchange', onResumeOrResize);

        // 5. Intercept Programmatic Scroll to Top
        function isScrollToTopCall(args) {
            if (!args || args.length === 0) return false;
            const first = args[0];
            if (typeof first === 'object' && first !== null) {
                return first.top === 0;
            }
            if (args.length >= 2) {
                return args[1] === 0;
            }
            return false;
        }

        function shouldSuppressScroll(args) {
            if (!isGuardActive) return false;
            if (!isScrollToTopCall(args)) return false;

            const timeSinceTouch = Date.now() - lastUserTouch;
            if (timeSinceTouch < TOUCH_ESCAPE_THRESHOLD_MS) {
                return false; // User initiated touch within 500ms; allow scroll to top
            }
            return true; // Programmatic reset during guard window; suppress
        }

        const originalWindowScrollTo = window.scrollTo;
        const originalWindowScroll = window.scroll;
        const originalElementScrollTo = Element.prototype.scrollTo;

        window.scrollTo = function() {
            if (shouldSuppressScroll(arguments)) {
                return;
            }
            return originalWindowScrollTo.apply(this, arguments);
        };

        window.scroll = function() {
            if (shouldSuppressScroll(arguments)) {
                return;
            }
            return originalWindowScroll.apply(this, arguments);
        };

        Element.prototype.scrollTo = function() {
            if (shouldSuppressScroll(arguments)) {
                return;
            }
            return originalElementScrollTo.apply(this, arguments);
        };

    } catch (e) {
        // Suppress errors to prevent breaking webview runtime
    }
})();
