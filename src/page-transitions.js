(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const finishEntry = () => {
    root.classList.remove('page-entering', 'page-leaving');
    root.classList.add('page-ready');
  };

  requestAnimationFrame(() => requestAnimationFrame(finishEntry));
  window.addEventListener('pageshow', finishEntry);

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    const cleanPath = destination.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
    if (cleanPath !== '/a-propos') return;
    if (reducedMotion.matches) return;

    event.preventDefault();
    root.classList.remove('page-ready');
    root.classList.add('page-leaving');
    window.setTimeout(() => window.location.assign(destination.href), 220);
  });

  // Les sections React n’existent pas encore au premier instant du chargement.
  // Ce repli vise uniquement les deux ancres publiques de l’accueil.
  const scrollToRequestedSection = () => {
    const id = window.location.hash.slice(1);
    if (id !== 'comment' && id !== 'pourquoi') return;
    let tries = 0;
    const seek = () => {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ block: 'start' });
        return;
      }
      if (tries++ < 60) requestAnimationFrame(seek);
    };
    seek();
  };
  window.addEventListener('pageshow', scrollToRequestedSection);
  window.addEventListener('hashchange', scrollToRequestedSection);
  scrollToRequestedSection();
})();
