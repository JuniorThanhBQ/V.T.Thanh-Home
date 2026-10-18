export const AVATAR_URLS = {
  light:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1787038092/light-removebg-preview_n3wmaa.png',
  dark: 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1787040789/J-removebg-preview_gi2ejq.png',
  dark_en_fr_de_es_kr:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792326866/J_2_baq8tz-removebg-preview_xtywqk.png',
  light_en_fr_de_es_kr:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792326913/J_3_sg4gr7-removebg-preview_jp08vt.png',
  light_ja:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792327528/J__11_-removebg-preview_e9xrlv.png',
  dark_ja:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792326807/J_1_h64aqs-removebg-preview_gglohn.png',
  light_zh:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792326969/J_5_nbtgpw-removebg-preview_biprgh.png',
  dark_zh:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792327011/J_7_ovshvk-removebg-preview_rxh1vr.png',
  light_ru:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792327096/J_10_eh7utx-removebg-preview_bnjtf1.png',
  dark_ru:
    'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792327042/J_8_c9exvw-removebg-preview_yh5i2q.png',
  avatar: 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1787042717/avatar_tcodag.jpg',
  ouhcmc: `https://res.cloudinary.com/dfolk8pz2/image/upload/v1785162818/ou-hcmc_giwmtx.png`,
  gmail: `https://res.cloudinary.com/dfolk8pz2/image/upload/v1787048651/google_mail_gmail_logo_icon_159346-removebg-preview_eiwzkp.png`,
  github: `https://res.cloudinary.com/dfolk8pz2/image/upload/v1785219389/github_logo_icon_229278_zurvhq.webp`,
  linkedin: `https://res.cloudinary.com/dfolk8pz2/image/upload/v1787048698/linkedin-logo-linkedin-symbol-linkedin-icon-free-free-vector-removebg-preview_rjzexl.png`,
  cv_picture_one: `https://res.cloudinary.com/dfolk8pz2/image/upload/v1789540027/1788869795561_tzooyq.png`,
  cv_picture_two: `https://res.cloudinary.com/dfolk8pz2/image/upload/v1789540034/1788869795561_zviovw.png`,
  contact_page_background: `https://res.cloudinary.com/dfolk8pz2/image/upload/v1791453900/Chibi_cagv9g.jpg`,
};

export function getDynamicLogo(lang: string, theme: 'light' | 'dark'): string {
  const isLight = theme === 'light';
  switch (lang) {
    case 'ja':
      return isLight ? AVATAR_URLS.light_ja : AVATAR_URLS.dark_ja;
    case 'zh':
      return isLight ? AVATAR_URLS.light_zh : AVATAR_URLS.dark_zh;
    case 'ru':
      return isLight ? AVATAR_URLS.light_ru : AVATAR_URLS.dark_ru;
    case 'en':
    case 'fr':
    case 'de':
    case 'es':
    case 'kr':
      return isLight ? AVATAR_URLS.light_en_fr_de_es_kr : AVATAR_URLS.dark_en_fr_de_es_kr;
    case 'vi':
    default:
      return isLight ? AVATAR_URLS.light : AVATAR_URLS.dark;
  }
}
