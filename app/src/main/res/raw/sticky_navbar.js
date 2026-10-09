(function() {

    if (window.isDesktopMode()) {
        (() => {
          const waitForBanner = () => new Promise(resolve => {
            const existing = document.querySelector('div[role="banner"]');
            if (existing) return resolve(existing);

            new MutationObserver((mutations, obs) => {
              for (const { addedNodes } of mutations) {
                for (const node of addedNodes) {
                  if (node.nodeType === 1 && node.matches('div[role="banner"]')) {
                    obs.disconnect();
                    return resolve(node);
                  }
                }
              }
            }).observe(document.body, { childList: true, subtree: true });
          });

          const forceFixed = el => {
            if (el?.classList.contains('xixxii4')) {
              el.style.setProperty('position', 'fixed', 'important');
            }
          };

          waitForBanner().then(banner => {
            const style = document.createElement('style');
            style.textContent = `
              div[role="banner"].xixxii4,
              div[role="banner"] .xixxii4 {
                position: fixed !important;
              }
            `;
            document.head.appendChild(style);

            forceFixed(banner);
            banner.querySelectorAll('.xixxii4').forEach(forceFixed);

            new MutationObserver(mutations => {
              for (const m of mutations) {
                if (m.type === 'childList') {
                  m.addedNodes.forEach(n => {
                    forceFixed(n);
                    n.querySelectorAll?.('.xixxii4')?.forEach(forceFixed);
                  });
                } else if (m.type === 'attributes' && m.attributeName === 'class') {
                  forceFixed(m.target);
                }
              }
            }).observe(banner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
          });
        })();
        return;
    }

    const applyStyles = () => {
        const tabbar = document.querySelector('div[role="tablist"][data-tti-phase="-1"][data-type="container"][data-mcomponent="MContainer"].m');
        const scroller = document.querySelector('div[data-type="vscroller"]');

        const logo = document.querySelector('div[aria-label*="Facebook"]');
        let navbar = null;
        if (logo && scroller) {
            let cur = logo;
            while (cur && cur.parentElement !== scroller && cur !== document.body) {
                cur = cur.parentElement;
            }
            if (cur && cur.parentElement === scroller) {
                navbar = cur;
            }
        }

        const hasLogo = Boolean(navbar && logo);
        const hasFeed = Boolean(tabbar?.querySelector('div[aria-label*="feed"]'));

        const navbarHeight = (navbar && hasLogo) ? (parseFloat(getComputedStyle(navbar).height) || parseFloat(navbar.style.height) || 0) : 0;
        const tabbarHeight = tabbar ? (parseFloat(getComputedStyle(tabbar).height) || parseFloat(tabbar.style.height) || 0) : 0;

        const isLandscape = window.innerWidth > window.innerHeight;
        const maxHeaderWidth = isLandscape ? '600px' : '100%';
        const headerLeft = isLandscape ? '50%' : '0';
        const headerTransform = isLandscape ? 'translateX(-50%)' : 'none';

        if (navbar && hasLogo) Object.assign(navbar.style, {
            position: 'fixed',
            top: '0',
            left: headerLeft,
            transform: headerTransform,
            maxWidth: maxHeaderWidth,
            width: '100%',
            zIndex: '1000',
            pointerEvents: 'auto'
        });

        if (tabbar && hasFeed) Object.assign(tabbar.style, {
            position: 'fixed',
            top: hasLogo ? navbarHeight + 'px' : '0px',
            left: headerLeft,
            transform: headerTransform,
            maxWidth: maxHeaderWidth,
            width: '100%',
            zIndex: '999',
            pointerEvents: 'auto'
        });

        if (scroller) {
            if (isLandscape) {
                scroller.style.maxWidth = '600px';
                scroller.style.width = '100%';
                scroller.style.marginLeft = 'auto';
                scroller.style.marginRight = 'auto';
                if (scroller.parentElement) {
                    scroller.parentElement.style.display = 'flex';
                    scroller.parentElement.style.flexDirection = 'column';
                    scroller.parentElement.style.alignItems = 'center';
                    scroller.parentElement.style.width = '100%';
                }
            } else {
                scroller.style.maxWidth = '';
                scroller.style.width = '';
                scroller.style.marginLeft = '';
                scroller.style.marginRight = '';
                if (scroller.parentElement) {
                    scroller.parentElement.style.display = '';
                    scroller.parentElement.style.flexDirection = '';
                    scroller.parentElement.style.alignItems = '';
                    scroller.parentElement.style.width = '';
                }
            }

            const offset = (hasLogo ? navbarHeight : 0) + (hasFeed ? tabbarHeight : 0);
            const scrollContent = scroller.querySelector(':scope > div:not(.pull-to-refresh-spinner-container)');
            scrollContent ? scrollContent.style.marginTop = offset + 'px' : scroller.style.paddingTop = offset + 'px';

            if (window.isFeed()) scroller.style.paddingBottom = '0';

            const spinnerContainer = scroller.querySelector('.pull-to-refresh-spinner-container');
            if (spinnerContainer) Object.assign(spinnerContainer.style, {
                zIndex: '1001',
            });

            const spinner = scroller.querySelector('.pull-to-refresh-spinner');
            if (spinner) spinner.style.margin = '0 auto';
        }

        Object.assign(document.body.style, {
            paddingTop: '0',
            marginTop: '0',
            overflow: 'visible',
            height: '100%'
        });
    };

    applyStyles();
    window.addEventListener('resize', applyStyles, { passive: true });
    window.addEventListener('orientationchange', applyStyles, { passive: true });
    new MutationObserver(applyStyles).observe(document.body, { childList: true, subtree: true });
})();