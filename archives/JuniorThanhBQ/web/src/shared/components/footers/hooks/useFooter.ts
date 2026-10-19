import { useTranslation } from 'react-i18next'

interface FooterLink {
  label: string
  href: string
  isExternal?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

export function useFooter() {
  const { t } = useTranslation()

  const sections: FooterSection[] = [
    {
      title: t('footer.about'),
      links: [
        { label: t('footer.about_me'), href: '/developer' },
        { label: t('footer.journey'), href: '/developer#journey' },
        { label: t('footer.contact_lbl'), href: '/contact' }
      ]
    },
    {
      title: t('footer.projects'),
      links: [
        { label: t('footer.projects_lbl'), href: '/project' },
        { label: t('footer.experience'), href: '/developer#experience' },
        { label: t('footer.resume'), href: '#' }
      ]
    },
    {
      title: t('footer.specialization'),
      links: [
        { label: t('footer.genai_engineer'), href: 'https://myengineeringpath.dev/genai-engineer/', isExternal: true },
        { label: t('footer.software_engineer'), href: 'https://roadmap.sh/full-stack', isExternal: true }
      ]
    },
    {
      title: t('footer.socials'),
      links: [
        { label: 'GitHub', href: 'https://github.com/JuniorThanhBQ', isExternal: true },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/juniorthanh09/', isExternal: true }
      ]
    }
  ]

  return {
    t,
    sections
  }
}
