# Achievements page `PWA_Content__c` — CMS configuration

The Achievements page (`/achievements`) loads hero copy, stats, snapshot cards, highlights, awards, and press quotes from Salesforce `PWA_Content__c` records. If no records exist, the site uses the same built-in fallbacks as today.

Uses the same plain-text fields as the homepage (see [homepage-pwa-content-fields.md](./homepage-pwa-content-fields.md)):

| API name | Type | Use on Achievements page |
|----------|------|--------------------------|
| `Title_English__c` / `Title_Arabic__c` | Text | Headlines, card titles, award names, press source |
| `Subtitle_English__c` / `Subtitle_Arabic__c` | Text | Hero badge, section kickers |
| `Body_English__c` / `Body_Arabic__c` | Long Text | Descriptions, press quotes |
| `Content_URL__c` | URL | Optional card image |
| `Value_Number__c` | Number | Stat value or display order |
| `Suffix__c` | Text | Stat suffix (e.g. `+`) or icon slug override |
| `Meta_keywords__c` | Text | `inactive` to hide a card |
| `Location__c` | Text | Section slot (see below) |
| `Type__c` | Text | `Section`, `Stat`, or `Card` |
| `Name` | Text | **Stat/Card only**: stable slug (see tables) |

### Icon slugs (`Suffix__c` on cards)

Override the default icon with one of: `residential`, `commercial`, `investment`, `management`, `legacy`, `quality`, `vision`, `trophy`, `shield`, `award`, `sparkles`, `building`, `users`.

---

## Location slots

| Location__c | Type__c | Purpose |
|-------------|---------|---------|
| `Achievements Hero` | `Section` | Hero badge, title, subtitle |
| `Achievements Stats` | `Stat` | Counter metrics (4 records) |
| `Achievements Snapshot Header` | `Section` | Company snapshot kicker, title, subtitle |
| `Achievements Snapshot Cards` | `Card` | 4 capability cards |
| `Achievements Highlights` | `Card` | 3 highlight cards |
| `Achievements Awards Header` | `Section` | Awards section kicker + title |
| `Achievements Awards` | `Card` | 6 award/certification cards |
| `Achievements Press Header` | `Section` | Press section title (optional) |
| `Achievements Press` | `Card` | 3 press quote cards |

---

## 1. Hero

| Field | Value |
|-------|--------|
| **Name** | `Achievements Hero` (label only) |
| **Location__c** | `Achievements Hero` |
| **Type__c** | `Section` |
| **Subtitle_English__c** | `Our Achievements` |
| **Subtitle_Arabic__c** | `إنجازاتنا` |
| **Title_English__c** | `Our Achievements` |
| **Title_Arabic__c** | `إنجازاتنا` |
| **Body_English__c** | `Milestones that shaped our story and the recognition that reflects our commitment to quality and innovation.` |
| **Body_Arabic__c** | `محطات صنعت قصتنا، وتكريمات تعكس التزامنا بالجودة والابتكار.` |

---

## 2. Stats (counters)

Create **4** `Stat` records. **`Name` must match the slug exactly.**

| Name | Value_Number__c | Suffix__c | Title_English__c | Title_Arabic__c | Value_Number__c (order) |
|------|-----------------|-----------|------------------|-----------------|-------------------------|
| `years` | `35` | `+` | `Years of Excellence` | `سنوات من التميز` | `1` |
| `projects` | `120` | `+` | `Projects Delivered` | `مشاريع مُنجزة` | `2` |
| `units` | `30000` | `+` | `Units Delivered` | `وحدات مُسلّمة` | `3` |
| `families` | `25000` | `+` | `Families Served` | `عائلات سعيدة` | `4` |

Shared fields:

| Field | Value |
|-------|--------|
| **Location__c** | `Achievements Stats` |
| **Type__c** | `Stat` |

---

## 3. Company snapshot header

| Field | Value |
|-------|--------|
| **Location__c** | `Achievements Snapshot Header` |
| **Type__c** | `Section` |
| **Subtitle_English__c** | `Company Snapshot` |
| **Subtitle_Arabic__c** | `لمحة عن الشركة` |
| **Title_English__c** | `A legacy of development, built for today` |
| **Title_Arabic__c** | `إرث في التطوير… برؤية عصرية` |
| **Body_English__c** | `A modern extension of the Bin Saedan family legacy since 1934—focused on high-quality residential and commercial destinations, investment solutions, and long-term property care across Saudi Arabia.` |
| **Body_Arabic__c** | `امتداد حديث لإرث عائلة بن سعيدان منذ عام 1934—نركز على تطوير وجهات سكنية وتجارية عالية الجودة، وحلول استثمارية، وإدارة ممتلكات طويلة الأمد في مختلف مناطق المملكة.` |

---

## 4. Snapshot cards

| Name | Order | Title (EN) | Title (AR) | Body (EN) | Body (AR) |
|------|-------|------------|------------|-----------|-----------|
| `residential` | `1` | Residential Communities | مجتمعات سكنية | Malfa and Nozol developments—villas, modern complexes, and semi-gated neighborhoods designed for everyday living. | تطويرات «ملفا» و«نُزُل»—فلل ومجمعات حديثة وأحياء شبه مغلقة مصممة لحياة يومية أفضل. |
| `commercial` | `2` | Commercial Destinations | وجهات تجارية | Plazas and office assets in strategic locations, built to support thriving business districts. | مجمعات وأصول مكتبية في مواقع استراتيجية تدعم نمو الأعمال وتكامل المدن. |
| `investment` | `3` | Investment Solutions | حلول استثمارية | Professionally managed real estate funds that offer structured opportunities for individuals and institutions. | صناديق استثمار عقاري مُدارة باحتراف توفر فرصًا منظمة للأفراد والمؤسسات. |
| `management` | `4` | Property Management | إدارة العقارات | Long-term maintenance, leasing, and customer support to protect asset value beyond delivery. | صيانة وتأجير وخدمة عملاء طويلة الأمد للحفاظ على قيمة الأصول بعد التسليم. |

Shared: **Location__c** = `Achievements Snapshot Cards`, **Type__c** = `Card`.

---

## 5. Highlights

| Name | Order | Title (EN) | Title (AR) | Body (EN) | Body (AR) |
|------|-------|------------|------------|-----------|-----------|
| `legacy` | `1` | Heritage & Land Bank | إرث وثقة | Decades of trust and a strategic portfolio that supports sustainable urban growth. | خبرة ممتدة ومحفظة استراتيجية تدعم نموًا عمرانيًا مستدامًا. |
| `quality` | `2` | Modern Delivery | تنفيذ حديث | Using advanced practices like BIM to improve efficiency, reduce waste, and elevate design quality. | تطبيق ممارسات متقدمة مثل BIM لرفع الكفاءة وتقليل الهدر وتحسين الجودة. |
| `vision` | `3` | Vision 2030 Alignment | توافق مع رؤية 2030 | Contributing to homeownership growth and workforce development through nationally aligned initiatives. | مساهمة في رفع التملك وتنمية الكوادر عبر مبادرات وطنية متوائمة مع الرؤية. |

Shared: **Location__c** = `Achievements Highlights`, **Type__c** = `Card`.

---

## 6. Awards header

| Field | Value |
|-------|--------|
| **Location__c** | `Achievements Awards Header` |
| **Type__c** | `Section` |
| **Subtitle_English__c** | `Recognition` |
| **Subtitle_Arabic__c** | `التقدير` |
| **Title_English__c** | `Awards & Certifications` |
| **Title_Arabic__c** | `الجوائز والشهادات` |

---

## 7. Awards cards

| Name | Order | Title (EN) | Title (AR) | Body (EN) | Body (AR) | Icon (`Suffix__c`) |
|------|-------|------------|------------|-----------|-----------|---------------------|
| `best-developer` | `1` | Best Real Estate Developer | أفضل مطور عقاري | Saudi Real Estate Awards 2023 | جائزة العقارات السعودية 2023 | `trophy` |
| `iso-9001` | `2` | ISO 9001 Certified | شهادة ISO 9001 | Quality Management Systems | نظام إدارة الجودة | `shield` |
| `cma-approved` | `3` | CMA Approved | هيئة السوق المالية | Approved real estate fund partner | شريك معتمد لإدارة الصناديق العقارية | `award` |
| `design-excellence` | `4` | Design Excellence | التميز في التصميم | Gulf Architecture Award 2022 | جائزة العمارة الخليجية 2022 | `sparkles` |
| `urban-sustainability` | `5` | Urban Sustainability | الاستدامة الحضرية | Vision 2030 Recognition | تقدير رؤية 2030 | `building` |
| `customer-choice` | `6` | Customer Choice | خيار العملاء | 5 consecutive years | 5 سنوات متتالية | `users` |

Shared: **Location__c** = `Achievements Awards`, **Type__c** = `Card`.

---

## 8. Press

### Header (optional)

| Field | Value |
|-------|--------|
| **Location__c** | `Achievements Press Header` |
| **Type__c** | `Section` |
| **Title_English__c** | `What the Press Says` |
| **Title_Arabic__c** | `ماذا تقول الصحافة` |

### Quote cards

| Name | Order | Title (EN/AR) = source | Body (EN) | Body (AR) |
|------|-------|------------------------|-----------|-----------|
| `arab-news` | `1` | Arab News | One of the Kingdom's most distinguished developers, blending quality with innovation. | أحد أبرز المطورين في المملكة، يجمع بين الجودة والابتكار. |
| `saudi-gazette` | `2` | Saudi Gazette | A benchmark for building integrated residential communities. | مرجع في بناء المجتمعات السكنية المتكاملة. |
| `argaam` | `3` | Argaam | Their commitment to sustainability sets a new standard. | التزامهم بمعايير الاستدامة يضع معيارًا جديدًا. |

Shared: **Location__c** = `Achievements Press`, **Type__c** = `Card`.

**Hide a card:** set `Meta_keywords__c` = `inactive`.

---

## Record count summary

| Section | Records |
|---------|---------|
| Hero | 1 |
| Stats | 4 |
| Snapshot header | 1 |
| Snapshot cards | 4 |
| Highlights | 3 |
| Awards header | 1 |
| Awards | 6 |
| Press header | 1 (optional) |
| Press quotes | 3 |
| **Total** | **24** (23 without press header) |

---

## Verification

1. Create the records above in Salesforce.
2. Open `/achievements` — content should match the current page.
3. Edit a stat `Value_Number__c` and refresh (cache clears after ~5 minutes).
4. Set an award card to `inactive` and confirm it disappears.
