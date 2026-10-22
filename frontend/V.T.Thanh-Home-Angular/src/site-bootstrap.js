(function () {
  const supportedLangs = ['en', 'de', 'fr', 'ja', 'zh', 'es', 'ru', 'kr'];
  const allLangs = ['vi'].concat(supportedLangs);
  function storedValue(key, allowed) {
    try {
      const value = window.localStorage.getItem(key);
      return allowed.includes(value) ? value : null;
    } catch {
      return null;
    }
  }

  let theme = storedValue('app_theme', ['light', 'dark']);
  if (!theme) {
    try {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      theme = 'light';
    }
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;

  if (window.location.pathname === '/') {
    let preferredLang = storedValue('app_language', allLangs);
    if (!preferredLang) {
      const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
      for (const language of languages) {
        const base = language.toLowerCase().split(/[-_]/)[0];
        const normalized = base === 'ko' ? 'kr' : base;
        if (allLangs.includes(normalized)) {
          preferredLang = normalized;
          break;
        }
      }
    }
    if (preferredLang && preferredLang !== 'vi') {
      window.history.replaceState(
        window.history.state,
        '',
        '/' + preferredLang + window.location.search + window.location.hash,
      );
    }
  }

  const segments = window.location.pathname.split('/').filter(Boolean);
  const activeLang =
    segments.length > 0 && supportedLangs.includes(segments[0]) ? segments[0] : 'vi';

  document.documentElement.lang = activeLang === 'kr' ? 'ko' : activeLang;

  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'fetch';
  preloadLink.href = '/i18n/' + activeLang + '.json';
  preloadLink.crossOrigin = 'anonymous';
  document.head.appendChild(preloadLink);

  const baseUrl = 'https://vtthanh-home-angular.vercel.app';
  const cleanPath =
    segments.length > 0 && supportedLangs.includes(segments[0])
      ? '/' + segments.slice(1).join('/')
      : window.location.pathname;
  const normalizedPath = cleanPath.replace(/\/+$/, '');

  const canonicalLink =
    document.querySelector("link[rel='canonical']") || document.createElement('link');
  canonicalLink.rel = 'canonical';
  canonicalLink.href =
    activeLang === 'vi'
      ? baseUrl + (normalizedPath || '/')
      : baseUrl + '/' + activeLang + normalizedPath;
  if (!canonicalLink.parentNode) {
    document.head.appendChild(canonicalLink);
  }

  allLangs.forEach(function (lang) {
    const hreflang = lang === 'kr' ? 'ko' : lang;
    let altLink = document.querySelector("link[rel='alternate'][hreflang='" + hreflang + "']");
    if (!altLink) {
      altLink = document.createElement('link');
      altLink.rel = 'alternate';
      altLink.hreflang = hreflang;
      document.head.appendChild(altLink);
    }
    altLink.href =
      lang === 'vi' ? baseUrl + (normalizedPath || '/') : baseUrl + '/' + lang + normalizedPath;
  });
})();
