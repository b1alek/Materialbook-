
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
  if (document.getElementById('materialbook-text-selection-v6')) {
    return;
  }

  // Strip .unselectable class dynamically added by Facebook (Keep .ssr intact so Facebook's CSS layout and image sizing work!)
  const stripBlockingClasses = () => {
    if (document.documentElement) {
      if (document.documentElement.classList.contains('unselectable')) {
        document.documentElement.classList.remove('unselectable');
      }
    }
  };
  stripBlockingClasses();

  if (window.__materialbook_root_observer) {
    try { window.__materialbook_root_observer.disconnect(); } catch (e) {}
  }
  if (document.documentElement && window.MutationObserver) {
    window.__materialbook_root_observer = new MutationObserver(() => stripBlockingClasses());
    window.__materialbook_root_observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  const selectionStyle = document.createElement('style');
  selectionStyle.id = 'materialbook-text-selection-v6';
  selectionStyle.textContent = `
    /* Core image layout strictly scoped to ServerImageArea and MVideo */
    .ssr #screen-root div[data-mcomponent="ServerImageArea"] img.img,
    .ssr #screen-root div[data-mcomponent="MVideo"] img.img,
    div[data-mcomponent="ServerImageArea"] img.img,
    div[data-mcomponent="MVideo"] img.img {
      position: absolute !important;
      width: 100% !important;
      height: 100% !important;
    }
    .ssr #screen-root div[data-mcomponent="ServerImageArea"] .contain,
    div[data-mcomponent="ServerImageArea"] .contain {
      object-fit: contain !important;
    }
    .ssr #screen-root div[data-mcomponent="ServerImageArea"] .cover,
    div[data-mcomponent="ServerImageArea"] .cover {
      object-fit: cover !important;
    }
    .ssr #screen-root div[data-mcomponent="ServerImageArea"] .stretch,
    div[data-mcomponent="ServerImageArea"] .stretch {
      object-fit: fill !important;
    }
    .ssr #screen-root div[data-mcomponent="MVideo"] .m,
    div[data-mcomponent="MVideo"] .m {
      position: relative;
    }

    /* Post text, comments, articles, captions, feed units, and text containers: fully selectable */
    .ssr #screen-root div[dir="auto"],
    .ssr #screen-root span[dir="auto"],
    .ssr #screen-root p,
    .ssr #screen-root article,
    .ssr #screen-root [role="article"],
    .ssr #screen-root [role="article"] div,
    .ssr #screen-root [role="article"] span,
    .ssr #screen-root .story_body_container,
    .ssr #screen-root .story_body_container div,
    .ssr #screen-root .story_body_container span,
    .ssr #screen-root [data-ad-preview="message"],
    .ssr #screen-root [data-ad-comet-preview="message"],
    .ssr #screen-root .native-text,
    .ssr #screen-root span.f4,
    .ssr #screen-root span.f5,
    .ssr #screen-root div._5rgt,
    .ssr #screen-root span._5rgu,
    .ssr #screen-root div[data-mcomponent="MText"],
    .ssr #screen-root div[data-mcomponent="MText"] *,
    .ssr #screen-root div[data-mcomponent="ServerTextArea"],
    .ssr #screen-root div[data-mcomponent="ServerTextArea"] *,
    div[dir="auto"],
    span[dir="auto"],
    p,
    article,
    [role="article"],
    .story_body_container,
    .native-text,
    span.f4,
    span.f5,
    div._5rgt,
    span._5rgu,
    div[data-mcomponent="MText"],
    div[data-mcomponent="ServerTextArea"],
    html.unselectable div.m,
    html.unselectable span,
    html.unselectable p {
      -webkit-user-select: text !important;
      user-select: text !important;
      pointer-events: auto !important;
      -webkit-touch-callout: default !important;
    }

    /* Keep decorative post background images from stealing touch events, but preserve photo tap-to-open links */
    div[data-mcomponent="ServerTextArea"] {
      position: relative !important;
      z-index: 10 !important;
    }

    div[data-mcomponent="ServerImageArea"] > img:not([role="presentation"]),
    div[data-mcomponent="ServerImageArea"] > div:not(a) {
      pointer-events: none !important;
    }
    div[data-mcomponent="ServerImageArea"] a,
    div[data-mcomponent="ServerImageArea"] a * {
      pointer-events: auto !important;
    }

    /* Media elements, videos, reels, and player overlays: non-selectable, instant tap response */
    .ssr #screen-root video,
    .ssr #screen-root audio,
    .ssr #screen-root [data-sigil*="video"],
    .ssr #screen-root [data-sigil*="play"],
    .ssr #screen-root [data-mcomponent="VideoArea"],
    .ssr #screen-root [data-mcomponent="VideoArea"] *,
    .ssr #screen-root [data-mcomponent="MVideo"],
    .ssr #screen-root [data-mcomponent="MVideo"] *,
    .ssr #screen-root [data-video-id],
    .ssr #screen-root [data-pagelet*="Video"],
    .ssr #screen-root [data-pagelet*="Reel"],
    .ssr #screen-root .inline-video-icon,
    .ssr #screen-root .inline-video-container,
    .ssr #screen-root .inline-video-container *,
    video,
    audio,
    [data-sigil*="video"],
    [data-sigil*="play"],
    [data-mcomponent="VideoArea"],
    [data-mcomponent="MVideo"],
    [data-video-id],
    [data-pagelet*="Video"],
    [data-pagelet*="Reel"],
    .inline-video-icon,
    .inline-video-container,
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

    .inline-video-icon.play,
    .ssr #screen-root .inline-video-icon.play {
      z-index: 10 !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    /* Leaf interactive controls: non-selectable, instant tap response */
    .ssr #screen-root button,
    .ssr #screen-root a,
    .ssr #screen-root [role="button"],
    .ssr #screen-root [aria-haspopup="menu"],
    .ssr #screen-root [aria-haspopup="true"],
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

    /* Elevate top navigation and header controls above full-screen multi-view overlays */
    .ssr #screen-root .fixed-container:not([style*="height:838px"]):not([style*="height: 838px"]),
    .ssr #screen-root div[role="button"][aria-label*="Back" i],
    .ssr #screen-root div[role="button"][aria-label*="Wstecz" i] {
      z-index: 99 !important;
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

  // Robust text node discovery supporting element containers and deep text branches
  const getTextNodeAtPoint = (x, y) => {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (range && range.startContainer) {
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
          return { node, offset: range.startOffset };
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          let curr;
          while ((curr = walker.nextNode())) {
            if (curr.textContent && curr.textContent.trim().length > 0) {
              const r = document.createRange();
              r.selectNodeContents(curr);
              const rect = r.getBoundingClientRect();
              if (y >= rect.top - 15 && y <= rect.bottom + 15 && x >= rect.left - 15 && x <= rect.right + 15) {
                return { node: curr, offset: 0 };
              }
            }
          }
          const walker2 = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          let first;
          while ((first = walker2.nextNode())) {
            if (first.textContent && first.textContent.trim().length > 0) {
              return { node: first, offset: 0 };
            }
          }
        }
      }
    }
    const el = document.elementFromPoint(x, y);
    if (el) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let bestNode = null;
      let curr;
      while ((curr = walker.nextNode())) {
        if (curr.textContent && curr.textContent.trim().length > 0) {
          const r = document.createRange();
          r.selectNodeContents(curr);
          const rect = r.getBoundingClientRect();
          if (y >= rect.top - 15 && y <= rect.bottom + 15 && x >= rect.left - 15 && x <= rect.right + 15) {
            return { node: curr, offset: 0 };
          }
          if (!bestNode) bestNode = curr;
        }
      }
      if (bestNode) return { node: bestNode, offset: 0 };
    }
    return null;
  };

  // Helper to expand caret position to word boundaries
  const selectWordAtPoint = (x, y) => {
    const targetInfo = getTextNodeAtPoint(x, y);
    if (!targetInfo || !targetInfo.node) return false;
    const node = targetInfo.node;
    const text = node.textContent;
    let offset = targetInfo.offset || 0;
    if (offset >= text.length) offset = Math.max(0, text.length - 1);

    if (/\s/.test(text[offset])) {
      let forward = offset;
      while (forward < text.length && /\s/.test(text[forward])) forward++;
      if (forward < text.length) {
        offset = forward;
      } else {
        let backward = offset;
        while (backward > 0 && /\s/.test(text[backward])) backward--;
        offset = backward;
      }
    }

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

    if (isMediaElement(target) || isInteractiveLeaf(target) || target.closest('video, audio, input, textarea')) {
      return;
    }

    if (target.closest('img') && !target.closest('[data-mcomponent="ServerImageArea"], [data-mcomponent="ServerTextArea"], div.m')) {
      return;
    }

    const isTextContainer = target.closest(
      'div[dir="auto"], span[dir="auto"], p, article, [role="article"], ' +
      '.native-text, .story_body_container, [data-ad-preview="message"], ' +
      'div.m, span.f4, span.f5, div[data-mcomponent="MText"], div[data-mcomponent="ServerTextArea"]'
    ) || (target.textContent && target.textContent.trim().length > 0);

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
    // Media / video playback: start stream and manage play icon
    if (isMediaElement(e.target)) {
      if (hasActiveSelection()) {
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      }

      // If tapping play button or video container, ensure underlying video stream plays
      const clickedBtn = e.target.closest('button.inline-video-icon, [data-sigil*="play"], [aria-label*="Play video" i]');
      const videoContainer = e.target.closest('[data-video-url], [data-mcomponent="MVideo"]');
      if (clickedBtn || videoContainer) {
        const targetMVideo = videoContainer || (clickedBtn ? clickedBtn.closest('[data-video-url], [data-mcomponent="MVideo"]') : null);
        const streamUrl = targetMVideo ? (targetMVideo.getAttribute('data-video-url') || (targetMVideo.dataset && targetMVideo.dataset.videoUrl)) : null;
        if (targetMVideo && streamUrl) {
          let targetVideo = targetMVideo.querySelector('video');
          if (!targetVideo) {
            targetVideo = document.createElement('video');
            targetVideo.style.position = 'absolute';
            targetVideo.style.objectFit = 'cover';
            targetVideo.style.width = '100%';
            targetVideo.style.height = '100%';
            targetVideo.setAttribute('playsinline', '');
            targetVideo.setAttribute('webkit-playsinline', '');
            targetMVideo.appendChild(targetVideo);
          }
          if (!targetVideo.src || targetVideo.src === window.location.href) {
            targetVideo.src = streamUrl;
          }
          targetVideo.muted = true;
          targetVideo.defaultMuted = true;
          targetVideo.setAttribute('muted', '');
          const soundBtn = targetMVideo.querySelector('button.sound');
          if (soundBtn) {
            soundBtn.classList.remove('sound-on');
            soundBtn.classList.add('sound-off');
            soundBtn.setAttribute('aria-pressed', 'true');
          }
          const playBtn = targetMVideo.querySelector('button.inline-video-icon.play, button.inline-video-icon, [data-sigil*="play"], [aria-label*="Play video" i]');
          const posterImg = targetMVideo.querySelector('img.img');
          if (targetVideo.paused) {
            targetVideo.play();
            if (playBtn) playBtn.style.display = 'none';
            if (posterImg) posterImg.style.display = 'none';
          } else {
            targetVideo.pause();
            if (playBtn) playBtn.style.display = 'block';
            if (posterImg) posterImg.style.display = 'block';
          }
        }
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

  // 3. Guarantee all media starts muted by default
  document.addEventListener('play', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') {
      if (!e.target.__user_unmuted) {
        e.target.muted = true;
        e.target.defaultMuted = true;
        e.target.setAttribute('muted', '');
      }
      const container = e.target.closest('[data-mcomponent="MVideo"], [data-video-url]');
      if (container) {
        const pBtn = container.querySelector('button.inline-video-icon.play, [data-sigil*="play"]');
        if (pBtn) pBtn.style.display = 'none';
      }
    }
  }, true);

  // 4. Restore play button and thumbnail poster when video pauses or finishes
  const onVideoPauseOrEnd = (e) => {
    if (e.target && e.target.tagName === 'VIDEO') {
      const container = e.target.closest('[data-mcomponent="MVideo"], [data-video-url]');
      if (container) {
        const pBtn = container.querySelector('button.inline-video-icon.play, button.inline-video-icon, [data-sigil*="play"], [aria-label*="Play video" i]');
        if (pBtn) {
          pBtn.style.display = 'block';
          pBtn.classList.remove('hidden');
        }
        const posterImg = container.querySelector('img.img');
        if (posterImg) {
          posterImg.style.display = 'block';
        }
      }
    }
  };
  document.addEventListener('pause', onVideoPauseOrEnd, true);
  document.addEventListener('ended', onVideoPauseOrEnd, true);
})();

// Enhance Loading Overlay Script (Prevent click blocking & freezing)
(function() {
    function applyOverlayStyle() {
        const overlays = document.querySelectorAll('.loading-overlay, .loading-overlay-background');
        overlays.forEach(overlay => {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            overlay.style.pointerEvents = 'none';
        });
    }
    applyOverlayStyle();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length)
                applyOverlayStyle();
        });
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });
})();

// Resilient Section Navigation Fallback for Mobile Web Tabs
(function() {
    const tabRoutes = {
        'marketplace': 'https://m.facebook.com/marketplace/',
        'messages': 'https://m.facebook.com/messages/'
    };

    document.addEventListener('click', (e) => {
        const tab = e.target.closest?.('[role="tab"]');
        if (!tab) return;
        const label = (tab.getAttribute('aria-label') || '').toLowerCase();
        for (const [key, url] of Object.entries(tabRoutes)) {
            if (label.includes(key)) {
                // If it's marketplace, native WebBloks handler fails to trigger navigation on mobile web
                if (key === 'marketplace') {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = url;
                }
                break;
            }
        }
    }, true);
})();

// Auto-dismiss cookie consent banner (Primary: Allow all cookies, Fallback: Decline optional cookies)
(function() {
  let cookieHandled = false;
  function handleCookieConsent() {
    if (cookieHandled) return;
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], a[role="button"]'));
    const allowBtn = buttons.find(b => {
      const t = (b.textContent || b.getAttribute('aria-label') || '').trim().toLowerCase();
      return t.includes('allow all cookies') || t.includes('zezwól na wszystkie') || t.includes('accept all');
    });
    const declineBtn = buttons.find(b => {
      const t = (b.textContent || b.getAttribute('aria-label') || '').trim().toLowerCase();
      return t.includes('decline optional cookies') || t.includes('odrzuć opcjonalne') || t.includes('only essential');
    });
    const target = allowBtn || declineBtn;
    if (target && target.offsetParent !== null) {
      cookieHandled = true;
      target.click();
    }
  }

  handleCookieConsent();
  new MutationObserver(() => {
    if (!cookieHandled) handleCookieConsent();
  }).observe(document.documentElement || document.body, { childList: true, subtree: true });
})();

// Hide facebook download button and other distractions at login page
(function() {
  function removeDistr() {
    // 1. Bloks-based distracting banners (collapse with display: none, NEVER remove() to prevent breaking React/Bloks tree)
    document.querySelectorAll(
      'div[style*="padding: 10px 12px"][style*="background: rgb(255, 255, 255)"],' +
      'div[style*="padding: 10px 12px"][style*="background:#000000"],' +
      'div[style*="padding: 10px 12px"][style*="background: #000000"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding-top: 20px; padding-bottom: 20px"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding-left: 4px; padding-right: 4px; padding-bottom: 4px"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding: 10px 12px"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding: 20px"]'
    )?.forEach(distr => {
      distr.style.setProperty('display', 'none', 'important');
    });

    // 2. Hide 'Get Facebook for Android and browse faster' / App install promo banner
    const promoKeywords = ['Get Facebook for Android', 'browse faster', 'Pobierz Facebooka na Androida', 'szybciej przeglądać'];
    const allLeaves = document.querySelectorAll('span, a, p, div');
    for (const el of allLeaves) {
      if (el.children.length === 0) {
        const text = el.textContent || '';
        if (promoKeywords.some(kw => text.includes(kw))) {
          // Walk up to find the banner container (height < 100px), never touching header, body or root containers
          let curr = el;
          while (curr && curr.parentElement && curr.parentElement !== document.body && curr.parentElement.id !== 'root' && curr.parentElement.getBoundingClientRect().height < 100) {
            curr = curr.parentElement;
          }
          if (curr && curr !== document.body && curr.id !== 'root') {
            curr.style.setProperty('display', 'none', 'important');
          }
        }
      }
    }
  }

  // Also inject a pure CSS rule so banner never flickers on screen
  try {
    const styleId = 'materialbook-login-promo-hide';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        div[style*="padding: 10px 12px"][style*="background: rgb(255, 255, 255)"],
        div[style*="padding: 10px 12px"][style*="background:#000000"],
        div[style*="padding: 10px 12px"][style*="background: #000000"] {
          display: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
  } catch (e) {}

  removeDistr();

  new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length) {
        removeDistr();
        break;
      }
    }
  }).observe(document.documentElement || document.body, {
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
    @media (orientation: landscape) {
      /* Only target mobile layout, never desktop mode */
      html:not([id="facebook"]) body {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 100% !important;
      }

      html:not([id="facebook"]) body > #root,
      html:not([id="facebook"]) body > div,
      html:not([id="facebook"]) #root,
      html:not([id="facebook"]) #root > div,
      html:not([id="facebook"]) div[data-type="vscroller"],
      html:not([id="facebook"]) div[data-type="vscroller"] > div {
        max-width: 600px !important;
        width: 100% !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      /* Center fixed top navigation safely */
      html:not([id="facebook"]) div[data-tti-phase="-1"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m,
      html:not([id="facebook"]) div[role="tablist"][data-tti-phase="-1"][data-type="container"][data-mcomponent="MContainer"].m {
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        max-width: 600px !important;
        width: 100% !important;
      }

      /* Ensure cards and video containers expand within the 600px column */
      html:not([id="facebook"]) div[data-tracking-duration-id],
      html:not([id="facebook"]) div[data-mcomponent="VideoArea"],
      html:not([id="facebook"]) div[data-mcomponent="MVideo"] {
        max-width: 100% !important;
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
