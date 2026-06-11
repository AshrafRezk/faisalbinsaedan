# About page `PWA_Content__c` — CMS configuration

The About Us page (`/about`) loads **Mission**, **Vision**, **Board Members**, and (optionally) **Company Values** from Salesforce `PWA_Content__c` records. If no records exist, the site uses the same built-in fallbacks as today.

Uses the same plain-text fields as the homepage (see [homepage-pwa-content-fields.md](./homepage-pwa-content-fields.md)):

| API name | Type | Use on About page |
|----------|------|-------------------|
| `Title_English__c` / `Title_Arabic__c` | Text | Section headline or value name |
| `Subtitle_English__c` / `Subtitle_Arabic__c` | Text | Board member job title |
| `Body_English__c` / `Body_Arabic__c` | Long Text | Vision text, mission bullets, bios, value details |
| `Content_URL__c` | URL | Photo / icon / optional section image |
| `Link_URL__c` | URL | LinkedIn profile |
| `Value_Number__c` | Number | Display order (tree position for board) |
| `Meta_keywords__c` | Text | `inactive` (hide board member), `featured` (highlight value), or Twitter/X URL |
| `Location__c` | Text | Section slot (see below) |
| `Type__c` | Text | `Section` or `Card` |
| `Name` | Text | **Board / Value cards only**: stable slug (see tables) |

---

## Location slots

| Location__c | Type__c | Purpose |
|-------------|---------|---------|
| `About Vision` | `Section` | Vision statement |
| `About Mission` | `Section` | Mission bullets |
| `About Board Members` | `Card` | One record per board member |
| `About Company Values` | `Card` | One record per company value (optional; not shown until records exist) |

---

## 1. Vision statement

| Field | Value |
|-------|--------|
| **Name** | `About Vision` (label only) |
| **Location__c** | `About Vision` |
| **Type__c** | `Section` |
| **Value_Number__c** | `1` |
| **Title_English__c** | `Our Vision` |
| **Title_Arabic__c** | `الرؤية` |
| **Body_English__c** | `To be a globally respected real estate investment and development leader—creating sustainable, innovative destinations that elevate communities across Saudi Arabia, grounded in a legacy that dates back to 1934.` |
| **Body_Arabic__c** | `أن نكون شركة رائدة عالميًا في الاستثمار والتطوير العقاري—نُنشئ وجهات مستدامة ومبتكرة ترتقي بالمجتمعات في المملكة، مستندين إلى إرث عائلة بن سعيدان الممتد منذ عام 1934.` |
| **Content_URL__c** | *(optional)* Vision graphic URL |

Use a blank line in `Body_*` to separate multiple paragraphs.

---

## 2. Mission statement

| Field | Value |
|-------|--------|
| **Name** | `About Mission` (label only) |
| **Location__c** | `About Mission` |
| **Type__c** | `Section` |
| **Value_Number__c** | `2` |
| **Title_English__c** | `Our Mission` |
| **Title_Arabic__c** | `الرسالة` |
| **Body_English__c** | One bullet per line (no leading `-` required): |
| | `Develop high-quality residential and commercial destinations, including branded communities such as Malfa and Nozol.` |
| | `Offer structured, well-governed investment opportunities through professionally managed real estate funds.` |
| | `Protect long-term value through end-to-end property management: maintenance, leasing, and customer care beyond delivery.` |
| | `Deliver with modern practices (e.g., BIM) to improve efficiency, reduce waste, and enhance design quality.` |
| | `Support Saudi Vision 2030 by contributing to homeownership growth and developing local talent.` |
| **Body_Arabic__c** | Matching Arabic bullets (one per line): |
| | `تطوير وجهات سكنية وتجارية عالية الجودة، بما يشمل مجتمعات بعلامات مثل «ملفا» و«نُزُل».` |
| | `تقديم فرص استثمارية منظمة عبر صناديق استثمار عقاري مُدارة باحتراف ضمن أعلى معايير الحوكمة والشفافية.` |
| | `الحفاظ على القيمة طويلة الأمد عبر إدارة ممتلكات متكاملة: صيانة، وتأجير، وخدمة عملاء بعد التسليم.` |
| | `التنفيذ بممارسات حديثة (مثل BIM) لرفع الكفاءة وتقليل الهدر وتحسين جودة التصميم.` |
| | `دعم مستهدفات رؤية السعودية 2030 عبر الإسهام في رفع التملك وتنمية الكفاءات الوطنية.` |
| **Content_URL__c** | *(optional)* Mission graphic URL |

---

## 3. Board members

Create **5** `Card` records. **`Name` must match the slug exactly** (used to merge with the site layout).

### Tree layout (`Value_Number__c`)

| Order | Row on page | Slug (`Name`) |
|-------|-------------|---------------|
| `1` | Top left | `tariq` |
| `2` | Top center | `faisal` |
| `3` | Top right | `osama` |
| `4` | Bottom left | `alrashidi` |
| `5` | Bottom right | `alfuraidi` |

Shared fields for every board record:

| Field | Value |
|-------|--------|
| **Location__c** | `About Board Members` |
| **Type__c** | `Card` |

### 3a. Tariq Bin Saedan — Chairman

| Field | Value |
|-------|--------|
| **Name** | `tariq` |
| **Value_Number__c** | `1` |
| **Title_English__c** | `Tariq Bin Saedan` |
| **Title_Arabic__c** | `طارق بن سعيدان` |
| **Subtitle_English__c** | `Chairman of the Board` |
| **Subtitle_Arabic__c** | `رئيس مجلس الإدارة` |
| **Body_English__c** | `Brings 25+ years in real estate investment management and business development, with a strategic outlook and strong capability to transform opportunities into high-value projects.` |
| **Body_Arabic__c** | `يتمتع بخبرة تتجاوز 25 عاماً في إدارة الاستثمارات العقارية وتطوير الأعمال، ويتميز برؤية استراتيجية شاملة وقدرة عالية على تحويل الفرص الاستثمارية إلى مشاريع ذات قيمة مضافة.` |
| **Content_URL__c** | Public URL to portrait (upload `Tariq Bin Saedan.png` to Salesforce Files) |
| **Link_URL__c** | *(optional)* LinkedIn URL |
| **Meta_keywords__c** | *(optional)* Twitter/X URL — or `inactive` to hide this member |

### 3b. Faisal Abdullah Bin Saedan — CEO

| Field | Value |
|-------|--------|
| **Name** | `faisal` |
| **Value_Number__c** | `2` |
| **Title_English__c** | `Faisal Abdullah Bin Saedan` |
| **Title_Arabic__c** | `فيصل عبدالله بن سعيدان` |
| **Subtitle_English__c** | `Group CEO - Vice Chairman` |
| **Subtitle_Arabic__c** | `الرئيس التنفيذي للمجموعة - نائب رئيس مجلس الإدارة` |
| **Body_English__c** | `Executive leader and founder of real estate and investment companies with broad experience in management and real estate development, and a track record of leadership roles across boards and investment funds.` |
| **Body_Arabic__c** | `رئيس تنفيذي ومؤسس لشركات عقارية واستثمارية، يتمتع بخبرة واسعة في الإدارة والتطوير العقاري، وشغل مناصب قيادية في عدة جهات وشارك في مجالس إدارات وصناديق استثمارية.` |
| **Content_URL__c** | Public URL to `Faisal Bin Saedan.png` |

### 3c. Osama Yousif Al-Dawtali

| Field | Value |
|-------|--------|
| **Name** | `osama` |
| **Value_Number__c** | `3` |
| **Title_English__c** | `Osama Yousif Al-Dawtali` |
| **Title_Arabic__c** | `أسامة يوسف الدولتلي` |
| **Subtitle_English__c** | `Chairman, Investment Committee - Chief Development Officer` |
| **Subtitle_Arabic__c** | `رئيس لجنة الاستثمار - الرئيس التنفيذي للتطوير` |
| **Body_English__c** | `Seasoned leader in real estate development and project management who has led major strategic initiatives that strengthened the company portfolio, backed by over 25 years of execution experience.` |
| **Body_Arabic__c** | `يمتلك خبرة واسعة في التطوير العقاري وإدارة المشاريع، وقاد مشاريع استراتيجية كبرى أسهمت في تعزيز محفظة الشركة بخبرة تنفيذية تتجاوز 25 عاماً.` |
| **Content_URL__c** | Public URL to `Ussama Al-dawlty.png` |

### 3d. Abdulaziz Awjan Al-Rashidi

| Field | Value |
|-------|--------|
| **Name** | `alrashidi` |
| **Value_Number__c** | `4` |
| **Title_English__c** | `Abdulaziz Awjan Al-Rashidi` |
| **Title_Arabic__c** | `عبدالعزيز عوجان الرشيدي` |
| **Subtitle_English__c** | `Board Member` |
| **Subtitle_Arabic__c** | `عضو مجلس الإدارة` |
| **Body_English__c** | `Board member with more than 25 years in financial and investment strategy leadership, driving large-scale project financing and capital-efficiency initiatives for sustainable growth.` |
| **Body_Arabic__c** | `يمتلك خبرة تتجاوز 25 عاماً في قيادة الاستراتيجيات المالية والاستثمارية، وقاد عمليات تمويل لمشاريع كبيرة وأسهم في تعزيز كفاءة رأس المال وتحقيق نمو مستدام للمجموعة.` |
| **Content_URL__c** | Public URL to `Abd El Aziz Al Rashidy.png` |

### 3e. Abdulaziz Al-Furaidi

| Field | Value |
|-------|--------|
| **Name** | `alfuraidi` |
| **Value_Number__c** | `5` |
| **Title_English__c** | `Abdulaziz Al-Furaidi` |
| **Title_Arabic__c** | `عبدالعزيز الفريدي` |
| **Subtitle_English__c** | `Board Member` |
| **Subtitle_Arabic__c** | `عضو مجلس الإدارة` |
| **Body_English__c** | `Executive leader with 21+ years in mega projects and strategic operations, known for building high-performance teams and turning complex challenges into growth opportunities.` |
| **Body_Arabic__c** | `قيادي تنفيذي بخبرة تتجاوز 21 عاماً في إدارة المشاريع الكبرى والعمليات الاستراتيجية، مع قدرة متميزة على بناء فرق عالية الأداء وتحويل التحديات إلى فرص نمو.` |
| **Content_URL__c** | Public URL to `Abd-el Aziz Saleh.png` |

**Inactive members:** set `Meta_keywords__c` = `inactive` (the site hides them but keeps fallbacks for other slots).

**Photos:** Upload board portraits as Salesforce Files, then paste the public CDN URL into `Content_URL__c`. Until URLs are set, bundled site images are used as fallbacks.

---

## 4. Company values (optional)

The About page does **not** render a values section today. Records are stored for future use or other channels. When you add values, create `Card` records:

| Field | Example |
|-------|---------|
| **Location__c** | `About Company Values` |
| **Type__c** | `Card` |
| **Name** | Stable slug, e.g. `integrity`, `innovation` |
| **Title_English__c** / **Title_Arabic__c** | Value name |
| **Body_English__c** / **Body_Arabic__c** | Value description |
| **Content_URL__c** | Icon or image URL |
| **Value_Number__c** | Display order (`1`, `2`, `3`, …) |
| **Meta_keywords__c** | `featured` to mark a highlighted value |

---

## Checklist (maps to CMS requirements)

### Mission statement
- [x] Mission text content → `Title_English__c` / `Title_Arabic__c`
- [x] Mission description/paragraphs → `Body_English__c` / `Body_Arabic__c` (one line per bullet)
- [x] Mission image/graphic → `Content_URL__c` (optional)
- [x] Display order → `Value_Number__c`

### Vision statement
- [x] Vision text content → `Title_English__c` / `Title_Arabic__c`
- [x] Vision description/paragraphs → `Body_English__c` / `Body_Arabic__c`
- [x] Vision image/graphic → `Content_URL__c` (optional)
- [x] Display order → `Value_Number__c`

### Company values
- [x] Value name → `Title_*`
- [x] Value description → `Body_*`
- [x] Icon/image URL → `Content_URL__c`
- [x] Display order → `Value_Number__c`
- [x] Featured → `Meta_keywords__c` = `featured`

### Board members
- [x] Member name → `Title_*`
- [x] Title/position → `Subtitle_*`
- [x] Bio → `Body_*`
- [x] Photo URL → `Content_URL__c`
- [x] Active/inactive → `Meta_keywords__c` = `inactive` to hide
- [x] Display order / tree position → `Value_Number__c` (1–3 top row, 4–5 bottom row)
- [x] LinkedIn → `Link_URL__c`
- [x] Twitter/X → `Meta_keywords__c` (when not `inactive`)

---

## Verification

1. Create the records above in Salesforce.
2. Open `/about` — content should match current copy.
3. Edit `Body_English__c` on the Vision record and refresh (cache clears after ~5 minutes, or hard-refresh).
4. Set a board member to `inactive` and confirm they disappear from the org chart.
