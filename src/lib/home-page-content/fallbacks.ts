import type { HomePageContent } from './types'

/** Default homepage content when Salesforce has no matching PWA_Content__c record. */
export const HOME_PAGE_FALLBACKS: HomePageContent = {
  hero: {
    titleLine1: { en: 'Shaping the Future', ar: 'نشكل مستقبل' },
    titleLine2: { en: 'of Real Estate', ar: 'العقار' },
    description: {
      en: 'We design and deliver developments that shape cities, support national progress, and create long-lasting value.',
      ar: 'نصمم وننفذ مشاريع تشكل المدن، وتدعم التقدم الوطني، وتخلق قيمة تدوم طويلاً.',
    },
    video: null,
    fallbackVideoUrl: '/herosectionfallback.mp4',
  },
  inspiringSpaces: {
    title: { en: 'Inspiring Spaces, Building Futures', ar: 'مساحات ملهمة، تبني المستقبل' },
    description: {
      en: 'Through structure, discipline, and strategic foresight, we transform potential into enduring, measurable value, supporting national progress and sustainable growth.',
      ar: 'من خلال التخطيط المنظم والرؤية الاستراتيجية الثاقبة، نحول الإمكانات إلى قيمة حقيقية ومستدامة، لندعم مسيرة التقدم الوطني والنمو المستمر.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop',
  },
  stats: {
    title: { en: 'Strong foundation and advanced innovations', ar: 'أساس متين وابتكارات متقدمة' },
    description: {
      en: 'At Faisal Bin Saedan, we strive to implement modern architectural styles and inspiring innovations with a strong foundation.',
      ar: 'نسعى في فيصل بن سعيدان إلى تطبيق أحدث الأساليب المعمارية والابتكارات الملهمة مستندين إلى أساس متين من الخبرة والجودة.',
    },
    staticStats: [
      {
        id: 'drivethrough',
        value: 32,
        suffix: '+',
        label: { en: 'Drive Through', ar: 'درايف ثرو' },
      },
      {
        id: 'plaza',
        value: 11,
        suffix: '+',
        label: { en: 'Plaza', ar: 'مجمعات بلازا' },
      },
    ],
  },
  ourFields: {
    title: { en: 'Our Fields', ar: 'مجالاتنا' },
    readMoreLabel: { en: 'Read More →', ar: 'اقرأ المزيد ←' },
    cards: [
      {
        id: 'residential',
        imageUrl:
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop',
        title: { en: 'Residential', ar: 'سكني' },
        description: {
          en: 'Faisal bin Saedan residential projects provide inspiring havens with sustainable environmental designs that meet all your basic and luxury needs, from internal protection and living services to stunning views, as they are designed to suit your distinctive lifestyle.',
          ar: 'توفر مشاريع فيصل بن سعيدان السكنية ملاذات ملهمة بتصاميم بيئية مستدامة تلبي جميع احتياجاتك الأساسية والفاخرة، صُممت لتناسب أسلوب حياتك المميز.',
        },
        link: '/search?view=projects',
      },
      {
        id: 'commercial',
        imageUrl: 'https://faisal-binsaedan.com/wp-content/uploads/2024/07/manar-1.webp',
        title: { en: 'Commercial', ar: 'تجاري' },
        description: {
          en: 'Our carefully selected commercial buildings inspire you to pursue your entrepreneurial dreams, as we provide the ideal starting point for whatever your business growth may be, from retail and entertainment venues to modern office space.',
          ar: 'تلهمك مبانينا التجارية المختارة بعناية لتحقيق أحلامك الريادية، حيث نوفر نقطة الانطلاق المثالية لنمو أعمالك، من مساحات التجزئة والترفيه إلى المساحات المكتبية الحديثة.',
        },
        link: '/search?view=projects',
      },
    ],
  },
  aboutProjects: {
    title: { en: 'About\nOur Projects', ar: 'عن مشاريعنا' },
  },
  cma: {
    imageUrl: '/Capital-Market-Authority-01.png',
    description: {
      en: 'Faisal bin Saedan Investment and Real Estate Development Company operates in accordance with approved regulatory frameworks and in coordination with the Saudi Capital Market Authority to develop and manage investment opportunities. This includes structuring and launching real estate funds in line with the highest standards of governance and compliance, thereby enhancing transparency and safeguarding investors’ interests.',
      ar: 'تعمل شركة فيصل بن سعيدان للاستثمار والتطوير العقاري وفق أطر تنظيمية معتمدة وبالتنسيق مع هيئة السوق المالية السعودية، لتطوير وإدارة الفرص الاستثمارية، بما يشمل هيكلة وإطلاق الصناديق العقارية وفق أعلى معايير الحوكمة والامتثال، بما يعزز الشفافية ويحمي مصالح المستثمرين',
    },
    teaser: {
      en: 'Additional collaboration initiatives with the Saudi Capital Market Authority are coming soon.',
      ar: 'مبادرات تعاون إضافية مع هيئة السوق المالية — قريباً',
    },
    ctaLabel: { en: 'View details', ar: 'عرض التفاصيل' },
    ctaLink: '/collaboration-coming-soon',
  },
  cta: {
    title: { en: 'Looking for Your Dream Home?', ar: 'هل تبحث عن منزل أحلامك؟' },
    description: {
      en: 'Register your interest now and our team will contact you to help you choose the right unit',
      ar: 'سجل اهتمامك الآن وسيتواصل معك فريقنا لمساعدتك في اختيار الوحدة المناسبة',
    },
    buttonLabel: { en: 'Register Your Interest', ar: 'سجل اهتمامك الآن' },
  },
}
