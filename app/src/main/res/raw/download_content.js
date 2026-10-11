/*
 * Script to add download buttons for stories, stories highlights and reels on Facebook
 * Original Author: @YeiversonYurgaky
 * Optimizations: Scoped reel buttons, better URL extraction, download progress, memory safety
 */

(function() {
  // Configuration
  const CONFIG = {
    buttonZIndex: 999999,
    debug: false,
    downloadTimeoutMs: 30000,
    maxConcurrentDownloads: 1
  };

  // Global state
  let isProcessing = false;
  let currentContentContainer = null;
  let lastDownloadedUrl = null;
  let activeDownloads = 0;
  const DOWNLOAD_BTN_ID = "materialbook-global-downloader";
  const REEL_BTN_CLASS = "materialbook-reel-downloader";
  const PROGRESS_CLASS = "materialbook-download-progress";

  // Selectors for finding media content
  const SELECTORS = {
    mediaElements: [
      'div[role="dialog"] video:not([hidden])',
      'div[role="dialog"] img[src*="fbcdn"]:not([width="16"]):not([hidden])',
      'div.x1ey2m1c.x9f619.xds687c.x17qophe.x10l6tqk.x13vifvy[role="presentation"] video',
      'div.x1ey2m1c.x9f619.xds687c.x17qophe.x10l6tqk.x13vifvy[role="presentation"] img[src*="fbcdn"]',
      'div[data-pagelet="Story"] video',
      'div[aria-label*="reel"] video',
      'div[data-mcomponent="MVideo"] video:not([hidden])',
      'div[data-video-url] video:not([hidden])',
      'video[src*="mp4"]:not([hidden])',
      'video:not([hidden])',
      'div[data-pagelet="ProfilePhoto"] img[src*="fbcdn"]'
    ],
    containers: [
      'div[role="dialog"]',
      'div[data-pagelet="Story"]',
      'div[aria-label*="story"]',
      '.story-viewer',
      '.story_viewer',
      'div.x1ey2m1c.x9f619.xds687c.x17qophe.x10l6tqk.x13vifvy[role="presentation"]',
      'div[data-pagelet="ProfilePhoto"]',
      'div[aria-label*="photo"]',
      'div[data-pagelet*="ProfileAppSection"]',
      'div[data-mcomponent="MVideo"]',
      'div[data-video-url]',
      'div[data-mcomponent="MMultiView"]'
    ],
    storyIndicators: [
      'div[data-sigil="story-viewer"]',
      'div[data-sigil="story-popup-header"]',
      'div[data-sigil="story-tray-item"]',
      ".story_body_container",
      ".story_viewer",
      ".story-container",
      'div[aria-label*="highlight"]',
      'div[aria-label*="Highlight"]',
      'div.x1ey2m1c.x9f619.xds687c.x17qophe.x10l6tqk.x13vifvy[role="presentation"]',
      'div[data-pagelet="ProfilePhoto"]',
      'div[data-mcomponent="MVideo"]',
      'div[data-video-url]'
    ]
  };

  // Utility functions
  const debugLog = (...args) => CONFIG.debug && console.log("[ContentDownloader]", ...args);

  const isElementVisible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return (
      rect.bottom > 0 &&
      rect.top < vh &&
      rect.right > 0 &&
      rect.left < vw &&
      rect.width > 0 &&
      rect.height > 0
    );
  };

  /**
   * Extract true media URL by walking up the DOM tree to find data-video-url
   * on ancestor elements (MVideo, vertically-snappable, etc.)
   */
  const getMediaUrl = (element) => {
    if (!element) return null;
    const isInvalid = (url) => !url || url.startsWith('blob:') || url === window.location.href;

    if (element.tagName === 'VIDEO') {
      // Walk up to find ancestor with data-video-url
      let container = element;
      for (let i = 0; i < 5 && container; i++) {
        container = container.parentElement;
        if (!container) break;
        const dataUrl = container.getAttribute?.('data-video-url') || container.dataset?.videoUrl;
        if (dataUrl && !isInvalid(dataUrl) && (dataUrl.includes('fbcdn.net') || dataUrl.includes('.mp4') || dataUrl.startsWith('http'))) {
          debugLog("Found video URL on ancestor:", container.tagName, dataUrl.substring(0, 80));
          return dataUrl;
        }
      }
      // Fallback to video element's own src/currentSrc
      if (element.src && !isInvalid(element.src)) return element.src;
      if (element.currentSrc && !isInvalid(element.currentSrc)) return element.currentSrc;
      return null;
    }
    // For images, check element and ancestors
    let el = element;
    for (let i = 0; i < 3 && el; i++) {
      const src = el.src || el.getAttribute?.('data-video-url');
      if (src && !isInvalid(src)) return src;
      el = el.parentElement;
    }
    return null;
  };

  // Find the appropriate container for the content
  const findContentContainer = (element) => {
    if (!element) return null;

    for (const selector of SELECTORS.containers) {
      const container = element.closest(selector);
      if (container) return container;
    }

    return element.parentElement;
  };

  // Get the current visible media element
  const getCurrentMediaElement = () => {
    // Try each selector in order of priority
    for (const selector of SELECTORS.mediaElements) {
      const elements = document.querySelectorAll(selector);

      // Find the first visible element with valid media URL
      for (const element of elements) {
        if (isElementVisible(element) && getMediaUrl(element)) {
          return element;
        }
      }
    }

    // Fallback: look for any large visible media
    return Array.from(
      document.querySelectorAll('video:not([hidden]), img[src*="fbcdn"]:not([width="16"]):not([hidden])')
    ).find(el => {
      const rect = el.getBoundingClientRect();
      return isElementVisible(el) && rect.width > 120 && rect.height > 120 && getMediaUrl(el);
    });
  };

  // Check if we are in a story or reel view
  const isInStoryOrReelView = () => {
    // URL pattern checks
    const url = window.location.href;
    if (
      url.includes("/stories/") ||
      url.includes("/reel/") ||
      url.includes("/videos/") ||
      url.includes("/watch/?") ||
      url.includes("/photo") ||
      url.includes("/photos/") ||
      url.includes("/highlights/")
    ) {
      return true;
    }

    // Element selectors check
    for (const selector of SELECTORS.storyIndicators) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  };

  // Check if we're on the main feed
  const isFeed = () => window.isFeed?.() ?? false;

  // Show download progress indicator on a button
  const showProgress = (btn, show) => {
    let progress = btn.querySelector(`.${PROGRESS_CLASS}`);
    if (show) {
      if (!progress) {
        progress = document.createElement('div');
        progress.className = PROGRESS_CLASS;
        progress.style.cssText = `
          position: absolute !important;
          inset: 0 !important;
          border-radius: 50% !important;
          border: 3px solid rgba(255,255,255,0.3) !important;
          border-top-color: white !important;
          animation: ${PROGRESS_CLASS}-spin 1s linear infinite !important;
        `;
        // Add keyframes if not exists
        if (!document.getElementById(`${PROGRESS_CLASS}-style`)) {
          const style = document.createElement('style');
          style.id = `${PROGRESS_CLASS}-style`;
          style.textContent = `
            @keyframes ${PROGRESS_CLASS}-spin {
              to { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }
        btn.appendChild(progress);
      }
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else if (progress) {
      progress.remove();
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  };

  // Download media from URL with progress feedback
  const downloadMedia = (url, sourceBtn = null) => {
    if (activeDownloads >= CONFIG.maxConcurrentDownloads) {
      debugLog("Download queue full, skipping:", url);
      // Brief busy feedback so the tap doesn't feel dead
      const busyBtn = sourceBtn || document.getElementById(DOWNLOAD_BTN_ID);
      if (busyBtn && !busyBtn.disabled) {
        const prevOpacity = busyBtn.style.opacity;
        busyBtn.style.opacity = '0.5';
        setTimeout(() => { busyBtn.style.opacity = prevOpacity || '1'; }, 300);
      }
      return;
    }
    if (!url || url.startsWith('blob:')) {
      debugLog("Invalid URL, skipping:", url);
      return;
    }

    activeDownloads++;
    const btn = sourceBtn || document.getElementById(DOWNLOAD_BTN_ID);
    if (btn) showProgress(btn, true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.downloadTimeoutMs);

    fetch(url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        if (window.DownloadBridge && window.DownloadBridge.downloadBase64File) {
          const reader = new FileReader();
          reader.onloadend = function() {
            clearTimeout(timeoutId);
            if (reader.result) {
              window.DownloadBridge.downloadBase64File(
                reader.result,
                blob.type || "video/mp4"
              );
              debugLog("DownloadBridge called for:", url.substring(0, 80), "size:", blob.size);
            }
            if (btn) showProgress(btn, false);
            activeDownloads--;
          };
          reader.readAsDataURL(blob);
        } else {
          clearTimeout(timeoutId);
          debugLog("DownloadBridge not available");
          if (btn) showProgress(btn, false);
          activeDownloads--;
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        debugLog("Error downloading media:", err.name === 'AbortError' ? 'timeout' : err.message);
        if (btn) showProgress(btn, false);
        activeDownloads--;
      });
  };

  // Extract and download videos or images
  const extractAndDownloadMedia = (sourceBtn = null) => {
    // Find current media element
    const mediaElement = getCurrentMediaElement();
    const mediaUrl = getMediaUrl(mediaElement);

    if (mediaElement && mediaUrl && mediaUrl !== lastDownloadedUrl) {
      downloadMedia(mediaUrl, sourceBtn);
      lastDownloadedUrl = mediaUrl;
      return;
    }

    // Get container to search in
    const container = currentContentContainer || document.body;

    // Find videos first
    const videoElement = container.querySelector("video:not([hidden])");
    const videoUrl = getMediaUrl(videoElement);
    if (videoElement && videoUrl && videoUrl !== lastDownloadedUrl) {
      downloadMedia(videoUrl, sourceBtn);
      lastDownloadedUrl = videoUrl;
      return;
    }

    // If no video, try with images
    const images = Array.from(container.querySelectorAll("img"))
      .filter(img =>
        img.src &&
        !img.src.includes("data:image") &&
        img.src !== lastDownloadedUrl
      )
      .filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.width >= 100 && rect.height >= 100 && isElementVisible(img);
      })
      .sort((a, b) => {
        const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
        const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
        return areaB - areaA; // Largest first
      });

    if (images.length > 0) {
      downloadMedia(images[0].src, sourceBtn);
      lastDownloadedUrl = images[0].src;
      return;
    }

    // Nothing found
    debugLog("No media content found to download");
  };

  // Create and manage download button (global fixed button)
  const createDownloadButton = () => {
    // Add CSS for the button
    const css = `
      #${DOWNLOAD_BTN_ID} {
        position: fixed;
        top: 200px;
        right: 15px;
        width: 40px;
        height: 40px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 50%;
        z-index: ${CONFIG.buttonZIndex};
        border: none;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        cursor: pointer;
        /* Explicit auto: FB ancestors may carry pointer-events:none, which
           would otherwise make this button dead to hit-testing. */
        pointer-events: auto;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 960 960" fill="white"><path d="M480,640L280,440L336,384L440,488L440,160L520,160L520,488L624,384L680,440L480,640ZM240,800Q207,800 183.5,776.5Q160,753 160,720L160,600L240,600L240,720Q240,720 240,720Q240,720 240,720L720,720Q720,720 720,720Q720,720 720,720L720,600L800,600L800,720Q800,753 776.5,776.5Q753,800 720,800L240,800Z"/></svg>');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 24px;
      }
      #${DOWNLOAD_BTN_ID}.visible {
        display: flex !important;
      }
      .${REEL_BTN_CLASS} {
        position: absolute !important;
        /* Clears FB's top-right sound control (mute rect ends ~y170 while
           tap-paused): 200px top leaves a >=8px gap. Verified on device via
           elementsFromPoint topmost assertion, not by guessing. */
        top: 200px !important;
        right: 15px !important;
        width: 40px !important;
        height: 40px !important;
        background-color: rgba(0, 0, 0, 0.7) !important;
        color: white !important;
        border-radius: 50% !important;
        z-index: ${CONFIG.buttonZIndex} !important;
        border: none !important;
        display: flex;
        align-items: center !important;
        justify-content: center !important;
        font-size: 20px !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3) !important;
        cursor: pointer !important;
        /* Explicit auto: FB ancestors may carry pointer-events:none, which
           would otherwise make this button dead to hit-testing. */
        pointer-events: auto !important;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 960 960" fill="white"><path d="M480,640L280,440L336,384L440,488L440,160L520,160L520,488L624,384L680,440L480,640ZM240,800Q207,800 183.5,776.5Q160,753 160,720L160,600L240,600L240,720Q240,720 240,720Q240,720 240,720L720,720Q720,720 720,720Q720,720 720,720L720,600L800,600L800,720Q800,753 776.5,776.5Q753,800 720,800L240,800Z"/></svg>') !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
        background-size: 24px !important;
      }
      /* Scoped reel download buttons are positioned by JS against their own card.
         Do not restyle Facebook's .vertically-snappable containers here. */
    `;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    // Create button element
    const btn = document.createElement("button");
    btn.id = DOWNLOAD_BTN_ID;
    btn.setAttribute("aria-label", "Download content");

    btn.addEventListener("click", () => {
      // Reset state
      currentContentContainer = null;
      lastDownloadedUrl = null;

      // Find current media and container
      const mediaElement = getCurrentMediaElement();
      if (mediaElement) {
        currentContentContainer = findContentContainer(mediaElement);
      }

      extractAndDownloadMedia(btn);
    });

    document.body.appendChild(btn);

    return btn;
  };

  // Attach a scoped download button to a Reel card that scrolls naturally with it
  const updateReelDownloadButtons = () => {
    const snappables = document.querySelectorAll('.vertically-snappable');
    if (!snappables || snappables.length === 0) return false;

    let attachedCount = 0;
    snappables.forEach(reelContainer => {
      if (reelContainer.dataset.adHidden === 'true') return;
      if (reelContainer.querySelector(`.${REEL_BTN_CLASS}`)) return;

      // Only real reel cards: must contain playable media and be card-sized.
      // This skips non-reel .vertically-snappable nodes such as the fixed
      // pull-to-refresh spinner (height ~50px), whose fixed positioning would
      // otherwise anchor its button to the viewport (the original stuck-button bug).
      const hasMedia = reelContainer.querySelector('video:not([hidden])') ||
                       reelContainer.querySelector('[data-video-url]');
      if (!hasMedia) return;
      if (reelContainer.offsetHeight > 0 && reelContainer.offsetHeight < 100) return;

      // Ensure the card establishes a positioning context for the absolute button.
      // Only touch 'static' containers; never override Facebook's own
      // positioned layouts (fixed/sticky) — those nodes are skipped above.
      if (window.getComputedStyle(reelContainer).position === 'static') {
        reelContainer.style.position = 'relative';
      }

      const reelBtn = document.createElement('button');
      reelBtn.className = REEL_BTN_CLASS;
      reelBtn.setAttribute('aria-label', 'Download reel');
      // Initially hidden - scroll listener shows the most-visible card's button
      reelBtn.style.display = 'none';

      reelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentContentContainer = reelContainer;
        lastDownloadedUrl = null;

        // Find video specifically inside this reel card
        // Strategy: check video element, then [data-video-url] on container, then walk ancestors
        const videoElement = reelContainer.querySelector('video:not([hidden])');
        let videoUrl = getMediaUrl(videoElement);

        // If video element has no valid URL, check container's data-video-url
        if (!videoUrl) {
          const dataUrlEl = reelContainer.querySelector('[data-video-url]');
          videoUrl = dataUrlEl?.getAttribute('data-video-url') || null;
        }

        if (videoUrl) {
          downloadMedia(videoUrl, reelBtn);
          lastDownloadedUrl = videoUrl;
          return;
        }

        extractAndDownloadMedia(reelBtn);
      });

      reelContainer.appendChild(reelBtn);
      attachedCount++;
    });

    // Gate scoped buttons to the visible card (scroll listener below)
    setupReelButtonVisibilityObserver();

    // Report whether scoped buttons exist (not just newly attached ones):
    // repeat runs attach nothing new, but the global button must stay hidden.
    const totalScoped = document.querySelectorAll(`.vertically-snappable .${REEL_BTN_CLASS}`).length;
    debugLog(`Attached ${attachedCount} reel download buttons (${totalScoped} total)`);
    return totalScoped > 0;
  };

  // Scroll listener gating scoped reel buttons to the most-visible card
  let reelScrollListener = null;
  let reelScrollContainer = null;
  let reelDomObserver = null;
  const resolveReelScrollContainer = () => {
    const sc = document.querySelector('.vscroller.vscroller-snap');
    if (sc && sc.isConnected) return sc;
    if (reelScrollContainer && reelScrollContainer.isConnected) return reelScrollContainer;
    return sc || document.scrollingElement;
  };
  const updateReelButtonVisibility = () => {
    reelScrollContainer = resolveReelScrollContainer();
    if (!reelScrollContainer) return;
    const containerRect = reelScrollContainer.getBoundingClientRect();
    let bestBtn = null;
    let bestEl = null;
    let bestRatio = 0;
    const items = [];
    document.querySelectorAll('.vertically-snappable').forEach(el => {
      const btn = el.querySelector(`.${REEL_BTN_CLASS}`);
      if (!btn) return;
      const elRect = el.getBoundingClientRect();
      const ratio = elRect.height > 0
        ? Math.max(0, Math.min(elRect.bottom, containerRect.bottom) - Math.max(elRect.top, containerRect.top)) / elRect.height
        : 0;
      items.push(btn);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestBtn = btn;
        bestEl = el;
      }
    });
    items.forEach(btn => {
      const show = btn === bestBtn && bestRatio > 0.5;
      btn.style.setProperty('display', show ? 'flex' : 'none', 'important');
    });
    // Autoplay the newly visible reel (card change only — never re-play the
    // same card, so an explicit user pause is respected until next swipe)
    if (bestEl && bestRatio > 0.5) ensureReelAutoplay(bestEl);
  };
  // Trusted user-pause guard: records capture-phase click/touchend gestures
  // (e.isTrusted only — never inferred from paused state) with the reel card
  // they hit. ensureReelAutoplay skips play on the same card while the pause
  // is fresh (<2s); any card change clears the guard. Clicks on our own
  // download buttons are not pauses and are ignored.
  let lastUserPauseAt = 0;
  let lastUserPauseCard = null;
  const USER_PAUSE_WINDOW_MS = 2000;
  const recordUserPauseGesture = (e) => {
    try {
      if (e && 'isTrusted' in e && e.isTrusted === false) return;
      const t = e && e.target;
      if (t && t.closest && (t.closest(`.${REEL_BTN_CLASS}`) || t.closest(`#${DOWNLOAD_BTN_ID}`))) return;
      lastUserPauseAt = Date.now();
      lastUserPauseCard = (t && t.closest) ? (t.closest('.vertically-snappable') || null) : null;
    } catch (err) {
      debugLog("User pause record error:", err && err.message);
    }
  };
  document.addEventListener('click', recordUserPauseGesture, true);
  document.addEventListener('touchend', recordUserPauseGesture, true);

  // Play the visible reel's video when the visible card changes.
  // Background: FB lazily attaches the stream to a card when it becomes
  // active, but that activation doesn't fire in this WebView — the new card's
  // <video> is left sourceless (networkState 3 / MEDIA_ERR_SRC_NOT_SUPPORTED)
  // so a bare play() rejects with NotSupportedError. As a fallback we assign
  // the card's own [data-video-url] (progressive mp4) before playing.
  // Programmatic play() is allowed (mediaPlaybackRequiresUserGesture=false);
  // rejections are swallowed so gating never breaks.
  // Card-change-only: the same card is never re-played, so an explicit user
  // pause is respected until the next swipe.
  let lastActiveReelCard = null;
  let lastActiveReelVideo = null;
  const isValidVideoUrl = (url) => !!url && !url.startsWith('blob:') &&
    (url.includes('fbcdn.net') || url.includes('.mp4') || url.startsWith('http'));
  const ensureReelAutoplay = (card) => {
    if (!card) return;
    try {
      const video = card.querySelector('video:not([hidden])');
      if (!video) return; // video not rendered yet — retry on a later run
      // Trusted user-pause guard: same card + fresh (<2s) skips play.
      // A different card always clears the guard (card change wins).
      if (lastUserPauseCard && card !== lastUserPauseCard) {
        lastUserPauseCard = null;
        lastUserPauseAt = 0;
      }
      if (lastUserPauseCard === card && (Date.now() - lastUserPauseAt) < USER_PAUSE_WINDOW_MS) {
        lastActiveReelCard = card;
        lastActiveReelVideo = video;
        return; // explicit user pause is fresh — never re-play the same card
      }
      if (!video.paused) {
        lastActiveReelCard = card;
        lastActiveReelVideo = video;
        return;
      }
      const sameCard = card === lastActiveReelCard;
      const sameVideo = video === lastActiveReelVideo;
      if (sameCard && sameVideo) return; // already attempted — respect user pause
      // Pause the previous reel (FB's own pause-on-leave doesn't run here,
      // so without this every swiped-past reel would keep decoding)
      if (lastActiveReelCard && lastActiveReelCard !== card && lastActiveReelCard.isConnected) {
        const prev = lastActiveReelCard.querySelector('video:not([hidden])');
        if (prev && !prev.paused) {
          try { prev.pause(); } catch (e) { /* ignore */ }
        }
      }
      // Sourceless video (FB never attached the stream): use the card's own
      // data-video-url as the source before playing
      if (!video.currentSrc && video.readyState === 0) {
        const srcEl = card.querySelector('[data-video-url]');
        const fallbackUrl = srcEl?.getAttribute('data-video-url') ||
                            card.getAttribute('data-video-url') || null;
        if (isValidVideoUrl(fallbackUrl)) {
          video.src = fallbackUrl;
          video.load();
        }
      }
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => debugLog("Reel autoplay deferred:", err?.name || err));
      }
      lastActiveReelCard = card;
      lastActiveReelVideo = video;
    } catch (e) {
      debugLog("Reel autoplay error:", e.message);
    }
  };
  const setupReelButtonVisibilityObserver = () => {
    if (reelScrollListener) {
      // Already set up — re-run gating for any newly attached buttons
      try { updateReelButtonVisibility(); } catch (e) {
        debugLog("Reel visibility re-check error:", e.message);
      }
      return;
    }

    // Find the Reels scroll container (vscroller)
    reelScrollContainer = resolveReelScrollContainer();
    if (!reelScrollContainer) return;

    // Update on scroll (container + window fallback) and on resize
    reelScrollListener = () => {
      try {
        updateReelButtonVisibility();
      } catch (e) {
        debugLog("Scroll visibility update error:", e.message);
      }
    };
    reelScrollContainer.addEventListener('scroll', reelScrollListener, { passive: true });
    window.addEventListener('scroll', reelScrollListener, { passive: true, capture: true });
    window.addEventListener('resize', reelScrollListener, { passive: true });

    // Gate immediately (synchronous) plus once more after layout settles
    try {
      updateReelButtonVisibility();
    } catch (e) {
      debugLog("Initial visibility check error:", e.message);
    }
    setTimeout(() => {
      try {
        updateReelButtonVisibility();
      } catch (e) {
        debugLog("Deferred visibility check error:", e.message);
      }
    }, 100);

    // Watch for lazily-loaded reel cards; gate them as soon as they appear
    reelDomObserver = new MutationObserver((mutations) => {
      let addedReel = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const targets = [];
          if (node.matches?.('.vertically-snappable')) targets.push(node);
          node.querySelectorAll?.('.vertically-snappable').forEach(el => targets.push(el));
          targets.forEach(el => {
            addedReel = true;
            // Only establish a positioning context on static containers
            if (window.getComputedStyle(el).position === 'static') {
              el.style.position = 'relative';
            }
          });
        });
      });
      if (addedReel) {
        try {
          updateReelButtonVisibility();
        } catch (e) {
          debugLog("Mutation visibility update error:", e.message);
        }
      }
    });
    reelDomObserver.observe(document.body, { childList: true, subtree: true });
  };

  // Resume autoplay when returning to foreground. Other scripts (e.g.
  // preserve_scroll's silenceMedia) pause all videos on hide with no resume
  // path; forgetting the active reel forces the next gating pass to
  // re-establish playback on the current card. Same-card user pauses made
  // during the stay are still respected — this only runs on foreground return.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    lastActiveReelCard = null;
    lastActiveReelVideo = null;
    lastUserPauseCard = null;
    lastUserPauseAt = 0;
    try {
      updateReelButtonVisibility();
    } catch (e) {
      debugLog("Foreground visibility update error:", e.message);
    }
  });

  // Show/hide download button based on context
  const updateButtonVisibility = () => {
    let btn = document.getElementById(DOWNLOAD_BTN_ID);
    if (!btn) btn = createDownloadButton();

    // Check if on Reels page / vertically-snappable containers are present
    const isReels = window.location.href.includes('/reel/') || document.querySelector('.vertically-snappable') !== null;
    if (isReels && !isFeed()) {
      const hasReelsAttached = updateReelDownloadButtons();
      // If we have scoped buttons inside vertically-snappable containers, hide the fixed button
      if (hasReelsAttached) {
        btn.classList.remove('visible');
        hideOpenAppButtons();
        return;
      }
    }

    if (isInStoryOrReelView() && !isFeed()) {
      const mediaElement = getCurrentMediaElement();

      // Always hide "Open in App" buttons
      hideOpenAppButtons();

      if (mediaElement) {
        currentContentContainer = findContentContainer(mediaElement);
        btn.classList.add("visible");
        return;
      }

      // Special case for highlighted stories
      const highlightedStoryContainer = document.querySelector(
        'div.x1ey2m1c.x9f619.xds687c.x17qophe.x10l6tqk.x13vifvy[role="presentation"]'
      );

      if (highlightedStoryContainer) {
        const mediaInHighlight = highlightedStoryContainer.querySelector(
          'video, img[src*="fbcdn"]'
        );

        if (mediaInHighlight && isElementVisible(mediaInHighlight)) {
          currentContentContainer = highlightedStoryContainer;
          btn.classList.add("visible");
          return;
        }
      }
    }

    // Hide button if not in relevant view
    btn.classList.remove("visible");
    currentContentContainer = null;
  };

  const hideOpenAppButtons = (root = document) => {
    // Find all div[role="button"] elements
    const buttons = root.querySelectorAll('div[role="button"]');

    buttons.forEach(button => {
      // Check if it contains div.fl.ac with a span containing the 󱥬 symbol
      const flAcDiv = button.querySelector('div.fl.ac');

      if (flAcDiv) {
        const span = flAcDiv.querySelector('span');
        if (span && span.textContent.includes('󱥬')) {
          button.style.display = 'none';
        }
      }
    });
  };

  // Main processing function
  const processPage = () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      updateButtonVisibility();
    } finally {
      isProcessing = false;
    }
  };

  // Initialize
  let observer = null;
  const init = () => {
    // Reset state
    currentContentContainer = null;
    lastDownloadedUrl = null;
    activeDownloads = 0;
    lastActiveReelCard = null;
    lastActiveReelVideo = null;
    lastUserPauseCard = null;
    lastUserPauseAt = 0;

    // Initial check
    processPage();

    // Set up DOM observer
    observer = new MutationObserver(mutations => {
      const hasRelevantChanges = mutations.some(
        mutation =>
          (mutation.type === "childList" && mutation.addedNodes.length > 0) ||
          (mutation.type === "attributes" &&
            (mutation.target.tagName === "VIDEO" ||
             mutation.target.tagName === "IMG"))
      );
      if (hasRelevantChanges) processPage();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "style", "class", "data-video-url"]
    });
  };

  // Cleanup on page unload / navigation
  const cleanupObservers = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (reelDomObserver) {
      reelDomObserver.disconnect();
      reelDomObserver = null;
    }
    if (reelScrollListener && reelScrollContainer?.removeEventListener) {
      reelScrollContainer.removeEventListener('scroll', reelScrollListener);
    }
    if (reelScrollListener) {
      window.removeEventListener('scroll', reelScrollListener, true);
      window.removeEventListener('resize', reelScrollListener);
      reelScrollListener = null;
    }
    reelScrollContainer = null;
    // Release the download semaphore so an interrupted fetch can't lock it
    activeDownloads = 0;
    // Forget the active reel so the next gating pass re-establishes autoplay
    lastActiveReelCard = null;
    lastActiveReelVideo = null;
    lastUserPauseCard = null;
    lastUserPauseAt = 0;
  };
  window.addEventListener('beforeunload', cleanupObservers);
  window.addEventListener('pagehide', cleanupObservers);

  // Start when document is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();