(function () {
  const supportedLangs = ['en', 'de', 'fr', 'ja', 'zh', 'es', 'ru', 'kr'];
  const allLangs = ['vi'].concat(supportedLangs);
  const segments = window.location.pathname.split('/').filter(Boolean);
  const activeLang =
    segments.length > 0 && supportedLangs.includes(segments[0]) ? segments[0] : 'vi';

  document.documentElement.lang = activeLang === 'kr' ? 'ko' : activeLang;

  const baseUrl = 'https://www.juniorthanh.id.vn';
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
