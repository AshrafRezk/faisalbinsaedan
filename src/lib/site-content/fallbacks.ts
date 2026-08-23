import type { NavLabelKey, SiteContent } from './types'

const NAV_FALLBACKS: Record<NavLabelKey, { en: string; ar: string }> = {
  home: { en: 'Home', ar: 'الرئيسية' },
  search: { en: 'Search', ar: 'البحث' },
  aboutUs: { en: 'About', ar: 'من نحن' },
  achievements: { en: 'Achievements', ar: 'إنجازاتنا' },
  community: { en: 'Community', ar: 'مجتمعي' },
  contact: { en: 'Contact', ar: 'تواصل معنا' },
  support: { en: 'Support', ar: 'الدعم' },
  latestReleases: { en: 'Commercial', ar: 'المشاريع التجارية' },
  ourNews: { en: 'Blogs', ar: 'المدوّنة' },
  more: { en: 'More', ar: 'المزيد' },
  call: { en: 'Call', ar: 'اتصال' },
  commercial: { en: 'Commercial & Rental', ar: 'التجاري والتأجير' },
  residentialProjects: { en: 'Residential', ar: 'المشاريع السكنية' },
  residentialUnits: { en: 'Residential Units', ar: 'الوحدات السكنية' },
}

/** Default site copy when Salesforce has no matching PWA_Content__c records. */
export const SITE_CONTENT_FALLBACKS: SiteContent = {
  latestReleases: {
    title: { en: 'Commercial Projects', ar: 'المشاريع التجارية' },
    subtitle: {
      en: 'Explore our commercial developments across Saudi Arabia.',
      ar: 'استكشف مشاريعنا التجارية في مختلف مناطق المملكة.',
    },
  },
  contact: {
    title: { en: 'Contact Us', ar: 'تواصل معنا' },
    subtitle: {
      en: "We're here to help. Contact us for any inquiries or feedback",
      ar: 'نحن هنا لمساعدتك. تواصل معنا لأي استفسارات أو ملاحظات',
    },
  },
  commercial: {
    title: { en: 'Empower Your Business', ar: 'طوّر أعمالك' },
    subtitle: {
      en: 'Premium Commercial & Rental Spaces',
      ar: 'مساحات تجارية وعقارات تأجير متميزة',
    },
  },
  residentialProjects: {
    title: { en: 'Residential Projects', ar: 'المشاريع السكنية' },
    subtitle: {
      en: 'Explore our residential communities across Saudi Arabia.',
      ar: 'استكشف مجتمعاتنا السكنية في مختلف مناطق المملكة.',
    },
  },
  navigation: NAV_FALLBACKS,
}

export { NAV_FALLBACKS }
