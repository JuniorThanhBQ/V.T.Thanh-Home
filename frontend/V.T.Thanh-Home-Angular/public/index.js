(function () {
  const supportedLangs = ['en', 'de', 'fr', 'ja', 'zh'];
  const segments = window.location.pathname.split('/').filter(Boolean);
  const activeLang = segments.length > 0 && supportedLangs.includes(segments[0]) ? segments[0] : 'vi';

  document.documentElement.lang = activeLang;

  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'fetch';
  preloadLink.href = '/i18n/' + activeLang + '.json';
  preloadLink.crossOrigin = 'anonymous';
  document.head.appendChild(preloadLink);

  const baseUrl = 'https://vtthanh-home-angular.vercel.app';
  const cleanPath = segments.length > 0 && supportedLangs.includes(segments[0])
    ? '/' + segments.slice(1).join('/')
    : window.location.pathname;
  const normalizedPath = cleanPath === '/' ? '' : cleanPath;

  const canonicalLink = document.querySelector("link[rel='canonical']") || document.createElement('link');
  canonicalLink.rel = 'canonical';
  canonicalLink.href = activeLang === 'vi' ? baseUrl + normalizedPath + '/' : baseUrl + '/' + activeLang + normalizedPath + '/';
  if (!canonicalLink.parentNode) {
    document.head.appendChild(canonicalLink);
  }

  const allLangs = ['vi', 'en', 'de', 'fr', 'ja', 'zh'];
  allLangs.forEach(function (lang) {
    let altLink = document.querySelector("link[rel='alternate'][hreflang='" + lang + "']");
    if (!altLink) {
      altLink = document.createElement('link');
      altLink.rel = 'alternate';
      altLink.hreflang = lang;
      document.head.appendChild(altLink);
    }
    altLink.href = lang === 'vi' ? baseUrl + normalizedPath + '/' : baseUrl + '/' + lang + normalizedPath + '/';
  });
})();
