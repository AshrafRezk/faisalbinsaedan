import type { AchievementsCard, AchievementsPageContent, AchievementsPressItem, AchievementsStat } from './types'

const STATS: AchievementsStat[] = [
  {
    id: 'years',
    value: 35,
    suffix: '+',
    label: { en: 'Years of Excellence', ar: 'سنوات من التميز' },
    displayOrder: 1,
  },
  {
    id: 'projects',
    value: 120,
    suffix: '+',
    label: { en: 'Projects Delivered', ar: 'مشاريع مُنجزة' },
    displayOrder: 2,
  },
  {
    id: 'units',
    value: 30000,
    suffix: '+',
    label: { en: 'Units Delivered', ar: 'وحدات مُسلّمة' },
    displayOrder: 3,
  },
  {
    id: 'families',
    value: 25000,
    suffix: '+',
    label: { en: 'Families Served', ar: 'عائلات سعيدة' },
    displayOrder: 4,
  },
]

const SNAPSHOT_CARDS: AchievementsCard[] = [
  {
    id: 'residential',
    icon: 'residential',
    title: { en: 'Residential Communities', ar: 'مجتمعات سكنية' },
    description: {
      en: 'Malfa and Nozol developments—villas, modern complexes, and semi-gated neighborhoods designed for everyday living.',
      ar: 'تطويرات «ملفا» و«نُزُل»—فلل ومجمعات حديثة وأحياء شبه مغلقة مصممة لحياة يومية أفضل.',
    },
    displayOrder: 1,
  },
  {
    id: 'commercial',
    icon: 'commercial',
    title: { en: 'Commercial Destinations', ar: 'وجهات تجارية' },
    description: {
      en: 'Plazas and office assets in strategic locations, built to support thriving business districts.',
      ar: 'مجمعات وأصول مكتبية في مواقع استراتيجية تدعم نمو الأعمال وتكامل المدن.',
    },
    displayOrder: 2,
  },
  {
    id: 'investment',
    icon: 'investment',
    title: { en: 'Investment Solutions', ar: 'حلول استثمارية' },
    description: {
      en: 'Professionally managed real estate funds that offer structured opportunities for individuals and institutions.',
      ar: 'صناديق استثمار عقاري مُدارة باحتراف توفر فرصًا منظمة للأفراد والمؤسسات.',
    },
    displayOrder: 3,
  },
  {
    id: 'management',
    icon: 'management',
    title: { en: 'Property Management', ar: 'إدارة العقارات' },
    description: {
      en: 'Long-term maintenance, leasing, and customer support to protect asset value beyond delivery.',
      ar: 'صيانة وتأجير وخدمة عملاء طويلة الأمد للحفاظ على قيمة الأصول بعد التسليم.',
    },
    displayOrder: 4,
  },
]

const HIGHLIGHTS: AchievementsCard[] = [
  {
    id: 'legacy',
    icon: 'legacy',
    title: { en: 'Heritage & Land Bank', ar: 'إرث وثقة' },
    description: {
      en: 'Decades of trust and a strategic portfolio that supports sustainable urban growth.',
      ar: 'خبرة ممتدة ومحفظة استراتيجية تدعم نموًا عمرانيًا مستدامًا.',
    },
    displayOrder: 1,
  },
  {
    id: 'quality',
    icon: 'quality',
    title: { en: 'Modern Delivery', ar: 'تنفيذ حديث' },
    description: {
      en: 'Using advanced practices like BIM to improve efficiency, reduce waste, and elevate design quality.',
      ar: 'تطبيق ممارسات متقدمة مثل BIM لرفع الكفاءة وتقليل الهدر وتحسين الجودة.',
    },
    displayOrder: 2,
  },
  {
    id: 'vision',
    icon: 'vision',
    title: { en: 'Vision 2030 Alignment', ar: 'توافق مع رؤية 2030' },
    description: {
      en: 'Contributing to homeownership growth and workforce development through nationally aligned initiatives.',
      ar: 'مساهمة في رفع التملك وتنمية الكوادر عبر مبادرات وطنية متوائمة مع الرؤية.',
    },
    displayOrder: 3,
  },
]

const AWARDS: AchievementsCard[] = [
  {
    id: 'best-developer',
    icon: 'trophy',
    title: { en: 'Best Real Estate Developer', ar: 'أفضل مطور عقاري' },
    description: {
      en: 'Saudi Real Estate Awards 2023',
      ar: 'جائزة العقارات السعودية 2023',
    },
    displayOrder: 1,
  },
  {
    id: 'iso-9001',
    icon: 'shield',
    title: { en: 'ISO 9001 Certified', ar: 'شهادة ISO 9001' },
    description: {
      en: 'Quality Management Systems',
      ar: 'نظام إدارة الجودة',
    },
    displayOrder: 2,
  },
  {
    id: 'cma-approved',
    icon: 'award',
    title: { en: 'CMA Approved', ar: 'هيئة السوق المالية' },
    description: {
      en: 'Approved real estate fund partner',
      ar: 'شريك معتمد لإدارة الصناديق العقارية',
    },
    displayOrder: 3,
  },
  {
    id: 'design-excellence',
    icon: 'sparkles',
    title: { en: 'Design Excellence', ar: 'التميز في التصميم' },
    description: {
      en: 'Gulf Architecture Award 2022',
      ar: 'جائزة العمارة الخليجية 2022',
    },
    displayOrder: 4,
  },
  {
    id: 'urban-sustainability',
    icon: 'building',
    title: { en: 'Urban Sustainability', ar: 'الاستدامة الحضرية' },
    description: {
      en: 'Vision 2030 Recognition',
      ar: 'تقدير رؤية 2030',
    },
    displayOrder: 5,
  },
  {
    id: 'customer-choice',
    icon: 'users',
    title: { en: 'Customer Choice', ar: 'خيار العملاء' },
    description: {
      en: '5 consecutive years',
      ar: '5 سنوات متتالية',
    },
    displayOrder: 6,
  },
]

const PRESS: AchievementsPressItem[] = [
  {
    id: 'arab-news',
    quote: {
      en: "One of the Kingdom's most distinguished developers, blending quality with innovation.",
      ar: 'أحد أبرز المطورين في المملكة، يجمع بين الجودة والابتكار.',
    },
    source: { en: 'Arab News', ar: 'Arab News' },
    displayOrder: 1,
  },
  {
    id: 'saudi-gazette',
    quote: {
      en: 'A benchmark for building integrated residential communities.',
      ar: 'مرجع في بناء المجتمعات السكنية المتكاملة.',
    },
    source: { en: 'Saudi Gazette', ar: 'Saudi Gazette' },
    displayOrder: 2,
  },
  {
    id: 'argaam',
    quote: {
      en: 'Their commitment to sustainability sets a new standard.',
      ar: 'التزامهم بمعايير الاستدامة يضع معيارًا جديدًا.',
    },
    source: { en: 'Argaam', ar: 'Argaam' },
    displayOrder: 3,
  },
]

/** Default Achievements page content when Salesforce has no matching PWA_Content__c records. */
export const ACHIEVEMENTS_PAGE_FALLBACKS: AchievementsPageContent = {
  hero: {
    badge: { en: 'Our Achievements', ar: 'إنجازاتنا' },
    title: { en: 'Our Achievements', ar: 'إنجازاتنا' },
    subtitle: {
      en: 'Milestones that shaped our story and the recognition that reflects our commitment to quality and innovation.',
      ar: 'محطات صنعت قصتنا، وتكريمات تعكس التزامنا بالجودة والابتكار.',
    },
  },
  stats: STATS,
  snapshot: {
    kicker: { en: 'Company Snapshot', ar: 'لمحة عن الشركة' },
    title: { en: 'A legacy of development, built for today', ar: 'إرث في التطوير… برؤية عصرية' },
    subtitle: {
      en: 'A modern extension of the Bin Saedan family legacy since 1934—focused on high-quality residential and commercial destinations, investment solutions, and long-term property care across Saudi Arabia.',
      ar: 'امتداد حديث لإرث عائلة بن سعيدان منذ عام 1934—نركز على تطوير وجهات سكنية وتجارية عالية الجودة، وحلول استثمارية، وإدارة ممتلكات طويلة الأمد في مختلف مناطق المملكة.',
    },
    cards: SNAPSHOT_CARDS,
    highlights: HIGHLIGHTS,
  },
  awards: {
    kicker: { en: 'Recognition', ar: 'التقدير' },
    title: { en: 'Awards & Certifications', ar: 'الجوائز والشهادات' },
    items: AWARDS,
  },
  press: {
    title: { en: 'What the Press Says', ar: 'ماذا تقول الصحافة' },
    items: PRESS,
  },
}

export {
  STATS as ACHIEVEMENTS_STAT_FALLBACKS,
  SNAPSHOT_CARDS,
  HIGHLIGHTS,
  AWARDS as ACHIEVEMENTS_AWARD_FALLBACKS,
  PRESS as ACHIEVEMENTS_PRESS_FALLBACKS,
}
