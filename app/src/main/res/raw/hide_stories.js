// Hide "story" container from feed.
(function() {
  const hideTargetElement = () => {
    const isDesktop = typeof isDesktopMode === 'function' && isDesktopMode();
    const storyContainer = isDesktop ? document.querySelector('.x193iq5w.xgmub6v.x1ceravr')
        : document.querySelector('[data-mcomponent="MContainer"][data-srat="43"]');

    if (storyContainer) storyContainer.style.display = 'none';
  };

  hideTargetElement();

  const observer = new MutationObserver(() => {
    hideTargetElement();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
