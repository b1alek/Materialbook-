
// Desktop mode identifier
(() => {
    window.isDesktopMode = () => {
        return document.querySelector('html[id="facebook"]') !== null;
    }
})();

// Feed identifier
(() => {
    window.isFeed = () => {
        const isHomeUrl = window.location.pathname === '/' &&
            (window.location.hostname === 'm.facebook.com' || window.location.hostname === 'www.facebook.com');

        if (window.isDesktopMode()) return isHomeUrl;

        const hasSpecialButton = Array.from(document.querySelectorAll('[role="button"] span'))
            .some(span => span.textContent === '󱥆');

        return isHomeUrl && hasSpecialButton;
    };
})();





(function() {
    if (!window.isDesktopMode()) return;

    document.documentElement.style.fontSize = '18px';


    // Do not stick the navbar by default
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

      const forceAbsolute = el => {
        if (el?.classList.contains('xixxii4')) {
          el.style.setProperty('position', 'absolute', 'important');
        }
      };

      waitForBanner().then(banner => {
        const style = document.createElement('style');
        style.textContent = `
          div[role="banner"].xixxii4,
          div[role="banner"] .xixxii4 {
            position: absolute !important;
          }
        `;
        document.head.appendChild(style);

        forceAbsolute(banner);
        banner.querySelectorAll('.xixxii4').forEach(forceAbsolute);

        new MutationObserver(mutations => {
          for (const m of mutations) {
            if (m.type === 'childList') {
              m.addedNodes.forEach(n => {
                forceAbsolute(n);
                n.querySelectorAll?.('.xixxii4')?.forEach(forceAbsolute);
              });
            } else if (m.type === 'attributes' && m.attributeName === 'class') {
              forceAbsolute(m.target);
            }
          }
        }).observe(banner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      });
    })();


    // Remove "send" button to save space
    // Remove the third element in the interaction bar if nb is 4
    (function() {
      const parentSelector = '.xbmvrgn.x1diwwjn';
      const childSelector = '.x10b6aqq.x1yrsyyn.xs83m0k';

      function checkAndRemoveThird(parent) {
        const children = parent.querySelectorAll(childSelector);
        if (children.length === 4) children[2].remove();
      }

      document.querySelectorAll(parentSelector).forEach(checkAndRemoveThird);

      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches(parentSelector)) {
                checkAndRemoveThird(node);
              }
              node.querySelectorAll(parentSelector).forEach(checkAndRemoveThird);
            }
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    })();
})();


// Scroll to top on back-press at feed
(() => {
    window.backHandlerNB = () => {

        const dialogs = document.querySelectorAll('div[role="dialog"]');
        const isMenu = document.querySelector('div[role="menu"]')

        function scrollToTop() {
            if (window.scrollY !== 0) {
              // to interrupt any current scroll event.
              document.body.style.overflow = 'hidden';
              setTimeout(() => {
                 document.body.style.overflow = '';
                 window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 30);
              return "scrolling";
           } else return "exit";
        }

        if (window.isDesktopMode()) {
            if (window.isFeed() && !isMenu && dialogs.length === 1)
                return scrollToTop();
            else if (isMenu || dialogs.length > 1) {
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true
                });
                window.dispatchEvent(escapeEvent);
                return "true";
            } else return "false"
        } else if (window.isFeed() && !isMenu && !dialogs.length) {
            return scrollToTop();
        } else return "false";
    }
})();

// Enable native long-press text selection & restore "See more" expansion
(() => {
  const selectionStyle = document.createElement('style');
  selectionStyle.id = 'materialbook-text-selection-v5';
  selectionStyle.textContent = `
    /* Post text, comments, articles, captions: fully selectable */
    div[dir="auto"],
    span[dir="auto"],
    p,
    article,
    [role="article"] div[dir="auto"],
    [role="article"] span[dir="auto"],
    .story_body_container div[dir="auto"],
    .story_body_container span[dir="auto"],
    [data-ad-preview="message"],
    [data-ad-comet-preview="message"],
    .native-text,
    [role="article"] div._5rgt,
    [role="article"] span._5rgu,
    [role="article"] div[data-mcomponent="MText"] {
      -webkit-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default !important;
    }

    /* Media elements, videos, reels, and player overlays: non-selectable, instant tap response */
    video,
    audio,
    [data-sigil*="video"],
    [data-sigil*="play"],
    [data-mcomponent="VideoArea"],
    [data-mcomponent="MVideo"],
    [data-video-id],
    [data-pagelet*="Video"],
    [data-pagelet*="Reel"],
    [aria-label*="play" i],
    [aria-label*="odtwórz" i],
    [aria-label*="odtwarz" i],
    [aria-label*="pause" i],
    [aria-label*="pauza" i],
    [aria-label*="wstrzymaj" i],
    [aria-label*="reel" i],
    [aria-label*="rolk" i],
    [aria-label*="video" i],
    [aria-label*="wideo" i] {
      -webkit-user-select: none !important;
      user-select: none !important;
      touch-action: manipulation !important;
      cursor: pointer !important;
    }

    /* Leaf interactive controls: non-selectable, instant tap response */
    button,
    a,
    [aria-haspopup="menu"],
    [aria-haspopup="true"],
    [data-sigil*="more"],
    [data-action-id],
    [data-sigil*="popover"],
    [data-sigil*="touchable"],
    [aria-label*="opcj" i],
    [aria-label*="option" i],
    [aria-label*="action" i],
    nav [role="button"],
    header [role="button"],
    footer [role="button"] {
      -webkit-user-select: none !important;
      user-select: none !important;
      touch-action: manipulation !important;
      cursor: pointer !important;
    }

    ::selection {
      background: #3b5998 !important;
      color: #ffffff !important;
    }
  `;
  document.head.appendChild(selectionStyle);

  // Internationalized check for "See more" / "Zobacz więcej"
  const SEE_MORE_REGEX = /(\.{3}\s*)?(see more|zobacz więcej|pokaż więcej|see less|zobacz mniej|more|więcej)/i;

  const isSeeMoreElement = (el) => {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (el.matches && (el.matches('[data-sigil*="more"]') || el.matches('[data-action-id]'))) return true;
    const txt = (el.textContent || '').trim();
    if (txt.length > 0 && txt.length < 35 && SEE_MORE_REGEX.test(txt)) {
      return true;
    }
    return false;
  };

  // Dedicated media / Reels / video element detector
  const isMediaElement = (el) => {
    if (!el || el === document.body || el === document.documentElement) return false;

    // Direct video/audio tag or inside one
    if (el.closest && el.closest('video, audio')) return true;

    // Facebook video/reels sigils, components, and media attributes
    const mediaContainer = el.closest && el.closest(
      '[data-sigil*="video" i], [data-sigil*="play" i], ' +
      '[data-mcomponent="VideoArea"], [data-mcomponent="MVideo"], ' +
      '[data-video-id], [data-pagelet*="Video" i], [data-pagelet*="Reel" i], ' +
      '[aria-label*="play" i], [aria-label*="odtwórz" i], [aria-label*="odtwarz" i], ' +
      '[aria-label*="pause" i], [aria-label*="pauza" i], [aria-label*="wstrzymaj" i], ' +
      '[aria-label*="reel" i], [aria-label*="rolk" i], ' +
      '[aria-label*="video" i], [aria-label*="wideo" i], ' +
      '[aria-label*="mute" i], [aria-label*="wycisz" i], [aria-label*="głośn" i]'
    );
    if (mediaContainer) return true;

    // Element or immediate parent/wrapper contains a video tag (e.g. click backdrop overlay)
    if (el.querySelector && el.querySelector('video, audio')) return true;
    const parent = el.parentElement;
    if (parent) {
      if (parent.querySelector && parent.querySelector('video, audio')) return true;
      const grandParent = parent.parentElement;
      if (grandParent && !grandParent.matches('[role="feed"], #root, body') && grandParent.querySelector && grandParent.querySelector('video, audio')) {
        return true;
      }
    }

    return false;
  };

  const isInteractiveLeaf = (target) => {
    if (!target || target === document.body || target === document.documentElement) return false;

    // Media and video elements are interactive leaf controls
    if (isMediaElement(target)) return true;

    // Check target and immediate parent for "See more" pattern
    if (isSeeMoreElement(target) || isSeeMoreElement(target.parentElement)) return true;

    // Native links and buttons
    const linkOrBtn = target.closest('a, button');
    if (linkOrBtn) return true;

    // Options menu / overflow button ("...", "More options", "Więcej opcji", flyout, popover)
    const optionsBtn = target.closest(
      '[aria-haspopup="menu"], [aria-haspopup="true"], ' +
      '[aria-label*="opcj" i], [aria-label*="option" i], [aria-label*="action" i], ' +
      '[data-sigil*="popover"], [data-sigil*="flyout"]'
    );
    if (optionsBtn) return true;

    // ARIA buttons (excluding outer post card containers)
    const roleBtn = target.closest('[role="button"]');
    if (roleBtn) {
      if (roleBtn.matches('[role="article"], [data-pagelet*="FeedUnit"]')) return false;
      const rect = roleBtn.getBoundingClientRect();
      // Large cards are container wrappers (>120px tall AND >220px wide), not leaf action buttons
      if (rect.height > 120 && rect.width > 220) return false;
      return true;
    }

    return false;
  };

  const hasActiveSelection = () => {
    const sel = window.getSelection();
    return Boolean(sel && !sel.isCollapsed && sel.toString().trim().length > 0);
  };

  // Helper to expand caret position to word boundaries
  const selectWordAtPoint = (x, y) => {
    if (!document.caretRangeFromPoint) return false;
    const range = document.caretRangeFromPoint(x, y);
    if (!range || !range.startContainer) return false;
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;

    const text = node.textContent;
    const offset = range.startOffset;
    let start = offset;
    let end = offset;

    while (start > 0 && /\S/.test(text[start - 1])) start--;
    while (end < text.length && /\S/.test(text[end])) end++;

    if (end > start) {
      const wordRange = document.createRange();
      wordRange.setStart(node, start);
      wordRange.setEnd(node, end);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(wordRange);
        return true;
      }
    }
    return false;
  };

  // 1. Long-press text selection: unblock contextmenu and ensure text selection triggers Android ActionMode
  window.addEventListener('contextmenu', (e) => {
    const target = e.target;
    if (!target) return;

    if (isMediaElement(target) || isInteractiveLeaf(target) || target.closest('img, video, audio, input, textarea')) {
      return;
    }

    const isTextContainer = target.closest(
      'div[dir="auto"], span[dir="auto"], p, article, [role="article"], ' +
      '.native-text, .story_body_container, [data-ad-preview="message"]'
    );
    if (isTextContainer) {
      if (isMediaElement(target)) return;

      // Prevent Facebook from canceling native selection
      e.stopImmediatePropagation();

      // If Chromium did not select word automatically, select it programmatically to activate Android ActionMode
      if (!hasActiveSelection()) {
        selectWordAtPoint(e.clientX, e.clientY);
      }
    }
  }, true);

  // 2. Safe click handling: allow buttons & media through; clear selections on interactive taps; prevent card navigation during text selection
  document.addEventListener('click', (e) => {
    // Media / video playback: never intercept or block clicks
    if (isMediaElement(e.target)) {
      if (hasActiveSelection()) {
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      }
      return;
    }

    const interactive = isInteractiveLeaf(e.target);

    if (interactive) {
      if (hasActiveSelection()) {
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      }
      return; // Allow Facebook to process button clicks (See more, three dots, reactions, comments)
    }

    // Suppress card navigation only when the user is actively selecting text
    if (hasActiveSelection()) {
      e.stopPropagation();
    }
  }, true);
})();

// Enhance Loading Overlay Script
(function() {
    function applyOverlayStyle() {
        const overlays = document.querySelectorAll('.loading-overlay');
        overlays.forEach(overlay => {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        });
    }
    applyOverlayStyle();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length)
                applyOverlayStyle();
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

// Hide facebook download button and other distractions at login page
(function() {
  function removeDistr() {
    document.querySelector('div[data-bloks-name="bk.components.Flexbox"][style*="background: rgb(255, 255, 255)"].wbloks_1')?.parentElement?.remove();

    document.querySelectorAll(
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding-top: 20px; padding-bottom: 20px"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding-left: 4px; padding-right: 4px; padding-bottom: 4px"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding: 10px 12px; background: rgb(255, 255, 255)"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding: 20px"]'
    )?.forEach(distr => distr.remove());
  }

  removeDistr();

  new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length) {
        removeDistr();
        break;
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
})();

// Make the loading bar's background transparent
(() => {
    const style = document.createElement('style');
    style.textContent = `
    .revamped-progress-bar-color .loading-bar-background { background: transparent; }
    .loading-bar-background { background-color: transparent; }
    `;
    document.head.appendChild(style);
})();

// Hide annoying bottom banners
const observer = new MutationObserver(() => {

  if (location.pathname === '/'
  && document.querySelector('div[role="button"][aria-label*="Facebook"]') === null) return;

  const element = document.querySelector('.bottom.fixed-container');
  if (
    element &&
    !element.hasAttribute('data-shift-on-keyboard-shown')
  ) {
    const heightAttr = element.getAttribute('data-actual-height');
    if (heightAttr && parseInt(heightAttr, 10) < 80) {
      element.style.display = 'none';
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });


// Hold Effect Script
(function() {
  const style = document.createElement('style');
  style.innerHTML = '* { -webkit-tap-highlight-color: rgba(180, 180, 180, 0.35); }';
  document.head.appendChild(style);
})();

// Responsive Mobile Landscape Centering
(function() {
  const style = document.createElement('style');
  style.id = 'materialbook-responsive-landscape';
  style.textContent = `
    @media (orientation: landscape) and (max-width: 1000px) {
      /* Only target mobile layout, never desktop mode */
      html:not([id="facebook"]) body > #root,
      html:not([id="facebook"]) body > div:not([id]),
      html:not([id="facebook"]) div[data-type="vscroller"],
      html:not([id="facebook"]) #root > div:only-child {
        max-width: 560px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        width: 100% !important;
      }
      /* Center fixed top navigation safely */
      html:not([id="facebook"]) div[data-tti-phase="-1"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m,
      html:not([id="facebook"]) div[role="tablist"][data-tti-phase="-1"][data-type="container"][data-mcomponent="MContainer"].m {
        left: 50% !important;
        transform: translateX(-50%) !important;
        max-width: 560px !important;
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
})();


/* The below scripts are specific to com.eepiemi.materialbook application. */

(() => {
  const onReady = (fn) => {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn);
     else fn();
  };

  onReady(() => {
    const BUTTON_ID = 'custom-settings-btn';
    const ICON_SVG = `
        <svg width="28" height="28" viewBox="0 -960 960 960"  fill="%FILL%">
            <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z"/>
        </svg>`;

    const getFillColor = () => {
      const color = document.querySelector('meta[name="theme-color"]')?.content?.toLowerCase();
      return color === '#ffffff' ? '#080809' : '#e4e6eb';
    };

    const updateButtonColor = () => {
      const svg = document.querySelector(`#${BUTTON_ID} svg`);
      if (svg) svg.setAttribute('fill', getFillColor());
    };

    const findInsertionPoint = () => {
      const iconSpan = Array.from(document.querySelectorAll('span'))
        .find(span => span.textContent === '󱥊');
      const container = iconSpan?.closest('div[role="button"]')?.parentNode;

      const desktopTarget = document.querySelector(
        '.x6s0dn4.x78zum5.x1s65kcs.x1n2onr6.x1ja2u2z'
      );

      return { container, desktopTarget };
    };

    const createButton = () => {
      const btn = document.createElement('button');
      btn.id = BUTTON_ID;
      btn.setAttribute('style', `
        position: ${findInsertionPoint().desktopTarget === null ? 'fixed' : 'block'};
        top: 8px;
        right: 100px;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: auto;
      `);
      btn.innerHTML = ICON_SVG.replace('%FILL%', getFillColor());
      btn.onclick = () => SettingsBridge?.onSettingsToggle?.();
      return btn;
    };

    const insertButton = () => {
      if (document.getElementById(BUTTON_ID)) return;

      const { container, desktopTarget } = findInsertionPoint();
      const button = createButton();

      if (desktopTarget) desktopTarget.insertBefore(button, desktopTarget.firstChild);
      else if (container) container.insertBefore(button, container.firstChild);
    };

    insertButton();

    const observer = new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID) && isFeed()) {
        insertButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // observer for theme-color changes
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      new MutationObserver(updateButtonColor).observe(themeMeta, {
        attributes: true,
        attributeFilter: ['content'],
      });
    }
  });
})();


// Color Extraction Script
(function() {
    const meta = document.querySelector('meta[name="theme-color"]');
    const notify = () => window.ThemeBridge?.onThemeColorChanged?.(meta?.content ?? "null");
    if (meta) {
        notify();
        new MutationObserver(() => notify())
            .observe(meta, { attributes: true, attributeFilter: ['content'] });
    }
})();

// File Download Script
(function() {
    if (window._downloadBridgeInitialized) return;
    window._downloadBridgeInitialized = true;
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
        const reader = new FileReader();
        reader.onloadend = function() {
            if (reader.result)
                DownloadBridge.downloadBase64File(reader.result, blob.type);
        };
        reader.readAsDataURL(blob);
        return originalCreateObjectURL(blob);
    };
})();

// Skeleton Freeze Watchdog with Session Circuit Breaker
(function() {
  const WATCHDOG_TIMEOUT_MS = 12000;
  const CIRCUIT_BREAKER_KEY = 'mbook_watchdog_reloaded';

  const isFeedPage = () => {
    const path = window.location.pathname;
    return path === '/' || path === '/home.php' || (typeof window.isFeed === 'function' && window.isFeed());
  };

  const hasLoadedArticles = () => {
    return document.querySelectorAll('[role="article"]').length > 0;
  };

  const checkSkeletonStall = () => {
    if (!isFeedPage()) return;
    if (hasLoadedArticles()) return;
    if (typeof navigator.onLine === 'boolean' && !navigator.onLine) return;

    const alreadyReloaded = sessionStorage.getItem(CIRCUIT_BREAKER_KEY) === 'true';

    const triggerCleanReload = () => {
      if (window.SettingsBridge && typeof window.SettingsBridge.cleanReload === 'function') {
        window.SettingsBridge.cleanReload();
      } else if (window.caches && caches.keys) {
        caches.keys().then((keys) => {
          return Promise.all(keys.map((k) => caches.delete(k)));
        }).finally(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    };

    if (!alreadyReloaded) {
      sessionStorage.setItem(CIRCUIT_BREAKER_KEY, 'true');
      console.warn('Materialbook Watchdog: Feed skeleton stall detected. Executing single clean auto-recovery.');
      triggerCleanReload();
    } else {
      if (document.getElementById('mbook-feed-recovery-banner')) return;
      const banner = document.createElement('div');
      banner.id = 'mbook-feed-recovery-banner';
      banner.setAttribute('style', `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #242526;
        color: #e4e6eb;
        padding: 10px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
      `);
      banner.innerHTML = `
        <span>Feed taking too long to load</span>
        <button id="mbook-feed-retry-btn" style="
          background: #1877f2;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        ">Reload</button>
      `;
      document.body.appendChild(banner);
      document.getElementById('mbook-feed-retry-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem(CIRCUIT_BREAKER_KEY);
        triggerCleanReload();
      });
    }
  };

  const armWatchdog = () => {
    setTimeout(() => {
      checkSkeletonStall();
    }, WATCHDOG_TIMEOUT_MS);
  };

  if (document.readyState === 'complete') {
    armWatchdog();
  } else {
    window.addEventListener('load', armWatchdog, { once: true });
  }
})();