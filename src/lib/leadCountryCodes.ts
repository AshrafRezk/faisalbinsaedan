/** GCC / common country codes for lead phone entry (value matches Salesforce Mobile_Country__c). */
export const LEAD_COUNTRY_CODES = [
  { value: '+966', dial: '966', labelEn: 'Saudi Arabia', labelAr: 'السعودية' },
  { value: '+971', dial: '971', labelEn: 'UAE', labelAr: 'الإمارات' },
  { value: '+965', dial: '965', labelEn: 'Kuwait', labelAr: 'الكويت' },
  { value: '+973', dial: '973', labelEn: 'Bahrain', labelAr: 'البحرين' },
  { value: '+974', dial: '974', labelEn: 'Qatar', labelAr: 'قطر' },
  { value: '+968', dial: '968', labelEn: 'Oman', labelAr: 'عُمان' },
] as const

export const DEFAULT_LEAD_COUNTRY_CODE = '+966'

export function countryCodeLabel(
  code: (typeof LEAD_COUNTRY_CODES)[number],
  isAr: boolean
): string {
  const name = isAr ? code.labelAr : code.labelEn
  return `${code.value} (${name})`
}
