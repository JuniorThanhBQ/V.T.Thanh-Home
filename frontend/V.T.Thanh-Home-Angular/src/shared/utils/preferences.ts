export type ThemeMode = 'light' | 'dark';
export type SupportedLang = 'vi' | 'en' | 'zh' | 'ja' | 'fr' | 'de' | 'es' | 'ru' | 'kr';

export const THEME_STORAGE_KEY = 'app_theme';
const LANGUAGE_STORAGE_KEY = 'app_language';
const SUPPORTED_LANGUAGES: readonly SupportedLang[] = [
  'vi',
  'en',
  'zh',
  'ja',
  'fr',
  'de',
  'es',
  'ru',
  'kr',
];

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function isSupportedLanguage(value: unknown): value is SupportedLang {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as SupportedLang);
}

function readStoredValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readThemePreference(): ThemeMode | null {
  const value = readStoredValue(THEME_STORAGE_KEY);
  return isThemeMode(value) ? value : null;
}

function readLanguagePreference(): SupportedLang | null {
  const value = readStoredValue(LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(value) ? value : null;
}

export function saveThemePreference(value: ThemeMode): void {
  if (!isThemeMode(value)) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    return;
  }
}

export function saveLanguagePreference(value: SupportedLang): void {
  if (!isSupportedLanguage(value)) return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  } catch {
    return;
  }
}

function preferredBrowserLanguage(): SupportedLang {
  if (typeof navigator === 'undefined') return 'vi';
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    const normalized = base === 'ko' ? 'kr' : base;
    if (isSupportedLanguage(normalized)) return normalized;
  }
  return 'vi';
}

export function languageFromPath(pathname: string): SupportedLang {
  const first = pathname.split('/').filter(Boolean)[0];
  return isSupportedLanguage(first) && first !== 'vi' ? first : 'vi';
}

export function initialLanguage(pathname: string): SupportedLang {
  return pathname === '/' || pathname === ''
    ? (readLanguagePreference() ?? preferredBrowserLanguage())
    : languageFromPath(pathname);
}

export function updateLanguageMetadata(document: Document, pathname: string): void {
  const language = languageFromPath(pathname);
  document.documentElement.lang = language === 'kr' ? 'ko' : language;
  const segments = pathname.split('/').filter(Boolean);
  if (isSupportedLanguage(segments[0]) && segments[0] !== 'vi') segments.shift();
  const suffix = segments.length ? '/' + segments.join('/') : '';
  const baseUrl = 'https://www.juniorthanh.id.vn';
  const pageUrl = (lang: SupportedLang): string =>
    baseUrl + (lang === 'vi' ? suffix || '/' : '/' + lang + suffix);
  const canonical =
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ??
    document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = pageUrl(language);
  if (!canonical.parentNode) document.head.appendChild(canonical);
  for (const lang of SUPPORTED_LANGUAGES) {
    const hreflang = lang === 'kr' ? 'ko' : lang;
    const alternate =
      document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`) ??
      document.createElement('link');
    alternate.rel = 'alternate';
    alternate.hreflang = hreflang;
    alternate.href = pageUrl(lang);
    if (!alternate.parentNode) document.head.appendChild(alternate);
  }
}
