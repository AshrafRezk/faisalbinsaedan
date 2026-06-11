import { boardMembers, type BoardMember } from '../about/content'
import type { AboutBoardMember, AboutCompanyValue, AboutPageContent } from './types'

const BOARD_TREE_ORDER: Record<string, number> = {
  tariq: 1,
  faisal: 2,
  osama: 3,
  alrashidi: 4,
  alfuraidi: 5,
}

const BOARD_SLUGS = ['tariq', 'faisal', 'osama', 'alrashidi', 'alfuraidi'] as const

function slugForMember(member: BoardMember): string | null {
  const image = member.image.toLowerCase()
  if (image.includes('tariq')) return 'tariq'
  if (image.includes('faisal')) return 'faisal'
  if (image.includes('osama') || image.includes('ussama') || image.includes('dawlty')) return 'osama'
  if (image.includes('rashid')) return 'alrashidi'
  if (image.includes('saleh') || image.includes('furaidi')) return 'alfuraidi'
  return null
}

function buildFallbackBoardMembers(): AboutBoardMember[] {
  const bySlug = new Map<string, AboutBoardMember>()

  for (const member of boardMembers) {
    const slug = slugForMember(member)
    if (!slug) continue

    bySlug.set(slug, {
      id: slug,
      name: { en: member.nameEn, ar: member.nameAr },
      title: { en: member.titleEn, ar: member.titleAr },
      description: { en: member.descriptionEn, ar: member.descriptionAr },
      imageUrl: member.image,
      displayOrder: BOARD_TREE_ORDER[slug],
      active: true,
    })
  }

  return BOARD_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (member): member is AboutBoardMember => Boolean(member)
  )
}

const visionEn = [
  'To be a globally respected real estate investment and development leader—creating sustainable, innovative destinations that elevate communities across Saudi Arabia, grounded in a legacy that dates back to 1934.',
]

const visionAr = [
  'أن نكون شركة رائدة عالميًا في الاستثمار والتطوير العقاري—نُنشئ وجهات مستدامة ومبتكرة ترتقي بالمجتمعات في المملكة، مستندين إلى إرث عائلة بن سعيدان الممتد منذ عام 1934.',
]

const missionEn = [
  'Develop high-quality residential and commercial destinations, including branded communities such as Malfa and Nozol.',
  'Offer structured, well-governed investment opportunities through professionally managed real estate funds.',
  'Protect long-term value through end-to-end property management: maintenance, leasing, and customer care beyond delivery.',
  'Deliver with modern practices (e.g., BIM) to improve efficiency, reduce waste, and enhance design quality.',
  'Support Saudi Vision 2030 by contributing to homeownership growth and developing local talent.',
]

const missionAr = [
  'تطوير وجهات سكنية وتجارية عالية الجودة، بما يشمل مجتمعات بعلامات مثل «ملفا» و«نُزُل».',
  'تقديم فرص استثمارية منظمة عبر صناديق استثمار عقاري مُدارة باحتراف ضمن أعلى معايير الحوكمة والشفافية.',
  'الحفاظ على القيمة طويلة الأمد عبر إدارة ممتلكات متكاملة: صيانة، وتأجير، وخدمة عملاء بعد التسليم.',
  'التنفيذ بممارسات حديثة (مثل BIM) لرفع الكفاءة وتقليل الهدر وتحسين جودة التصميم.',
  'دعم مستهدفات رؤية السعودية 2030 عبر الإسهام في رفع التملك وتنمية الكفاءات الوطنية.',
]

/** Default About page content when Salesforce has no matching PWA_Content__c records. */
export const ABOUT_PAGE_FALLBACKS: AboutPageContent = {
  vision: {
    title: { en: 'Our Vision', ar: 'الرؤية' },
    paragraphs: visionEn.map((en, index) => ({
      en,
      ar: visionAr[index] || en,
    })),
    displayOrder: 1,
  },
  mission: {
    title: { en: 'Our Mission', ar: 'الرسالة' },
    items: missionEn.map((en, index) => ({
      en,
      ar: missionAr[index] || en,
    })),
    displayOrder: 2,
  },
  boardMembers: buildFallbackBoardMembers(),
  companyValues: [] as AboutCompanyValue[],
}

export { BOARD_SLUGS, BOARD_TREE_ORDER }
