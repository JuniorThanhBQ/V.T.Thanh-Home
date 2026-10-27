export const AVATAR_URLS = {
  light: '/canva/light-removebg-preview_n3wmaa.png',
  dark: '/canva/J-removebg-preview_gi2ejq.png',
  dark_en_fr_de_es_kr: '/canva/J_2_baq8tz-removebg-preview_xtywqk.png',
  light_en_fr_de_es_kr: '/canva/J_3_sg4gr7-removebg-preview_jp08vt.png',
  light_ja: '/canva/J__11_-removebg-preview_e9xrlv.png',
  dark_ja: '/canva/J_1_h64aqs-removebg-preview_gglohn.png',
  light_zh: '/canva/J_5_nbtgpw-removebg-preview_biprgh.png',
  dark_zh: '/canva/J_7_ovshvk-removebg-preview_rxh1vr.png',
  light_ru: '/canva/J_10_eh7utx-removebg-preview_bnjtf1.png',
  dark_ru: '/canva/J_8_c9exvw-removebg-preview_yh5i2q.png',
  avatar: '/canva/avatar_tcodag.jpg',
  ouhcmc: `/canva/ou-hcmc_giwmtx.png`,
  gmail: `/canva/google_mail_gmail_logo_icon_159346-removebg-preview_eiwzkp.png`,
  github: `/canva/github_logo_icon_229278_zurvhq.webp`,
  linkedin: `/canva/linkedin-logo-linkedin-symbol-linkedin-icon-free-free-vector-removebg-preview_rjzexl.png`,
  cv_picture_one: `/canva/1788869795561_tzooyq.png`,
  cv_picture_two: `/canva/1788869795561_zviovw.png`,
  contact_page_background: `/canva/Chibi_cagv9g.jpg`,
  erm_project_banner: `/canva/Orange_and_Cream_Illustrative_Learning_English_Presentation_mwjyen.png`,
  sport_field_project_banner: `/canva/Purple_Red_and_White_Illustrated_Sports_Presentation_xevkzf.png`,
  ai_indicator_project_banner: `/canva/AIWritingIndicator_1_zb1c9k.png`,
  mbms_project_banner: `/canva/Blue_and_White_Illustration_Medical_Health_Care_Presentation_1_vawbdq.png`,
  about_badge: `/canva/tweenframe-com__slideshow_4_wemzxw.webp`,
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
