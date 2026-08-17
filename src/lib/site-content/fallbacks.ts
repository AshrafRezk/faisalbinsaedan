import type { NavLabelKey, SiteContent } from './types'

const NAV_FALLBACKS: Record<NavLabelKey, { en: string; ar: string }> = {
  home: { en: 'Home', ar: 'الرئيسية' },
  search: { en: 'Search', ar: 'البحث' },
  aboutUs: { en: 'About Us', ar: 'من نحن' },
  achievements: { en: 'Our Achievements', ar: 'إنجازاتنا' },
  community: { en: 'My Community', ar: 'مجتمعي' },
  contact: { en: 'Contact Us', ar: 'تواصل معنا' },
  support: { en: 'Support', ar: 'الدعم' },
  latestReleases: { en: 'Latest Releases', ar: 'احدث اصداراتنا' },
  ourNews: { en: 'Blogs', ar: 'المدوّنة' },
  more: { en: 'More', ar: 'المزيد' },
  call: { en: 'Call', ar: 'اتصال' },
  commercial: { en: 'Commercial & Rental', ar: 'التجاري والتأجير' },
  residentialUnits: { en: 'Residential Units', ar: 'الوحدات السكنية' },
}

/** Default site copy when Salesforce has no matching PWA_Content__c records. */
export const SITE_CONTENT_FALLBACKS: SiteContent = {
  latestReleases: {
    title: { en: 'Latest Releases', ar: 'أحدث إصداراتنا' },
    subtitle: {
      en: 'Explore our portfolio of residential and commercial developments across Saudi Arabia.',
      ar: 'استكشف محفظتنا من المشاريع السكنية والتجارية في مختلف مناطق المملكة.',
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
  navigation: NAV_FALLBACKS,
}

export { NAV_FALLBACKS }
