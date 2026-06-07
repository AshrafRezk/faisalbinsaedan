# Homepage `PWA_Content__c` — plain text fields (no JSON)

Add these **custom fields** on `PWA_Content__c` so marketing can type copy directly in Salesforce (no JSON in `Meta_keywords__c`).

| API name | Type | Label (suggested) |
|----------|------|-------------------|
| `Title_English__c` | Text (255) | Title (English) |
| `Title_Arabic__c` | Text (255) | Title (Arabic) |
| `Subtitle_English__c` | Text (255) | Subtitle (English) |
| `Subtitle_Arabic__c` | Text (255) | Subtitle (Arabic) |
| `Body_English__c` | Long Text Area | Body (English) |
| `Body_Arabic__c` | Long Text Area | Body (Arabic) |
| `Link_URL__c` | URL | Link URL |
| `Value_Number__c` | Number | Stat value |
| `Suffix__c` | Text (10) | Stat suffix (e.g. `+`) |

Existing fields still used:

| Field | Use |
|-------|-----|
| `Location__c` | Section slot (see table below) |
| `Type__c` | `Video`, `Section`, `Card`, or `Stat` |
| `Name` | **Card/Stat only**: must be `residential`, `commercial`, `drivethrough`, or `plaza`. For `Section` / `Video` records, Name can be any label (e.g. "Home Page Video") — it is not used for matching. |
| `Content_URL__c` | Video URL, image URL, or legacy stat number |
| `Aspect_Ratio__c` | Hero video ratio, e.g. `1:1` |
| `Meta_keywords__c` | Optional SEO keywords only — **not** used for homepage copy |

---

## Records to create

### 1. Hero video

| Field | Value |
|-------|--------|
| Location__c | `Homepage Hero Section` |
| Type__c | `Video` |
| Content_URL__c | Video URL |
| Aspect_Ratio__c | Optional `1:1` |

### 2. Hero copy

| Field | Value |
|-------|--------|
| Location__c | `Homepage Hero Section` |
| Type__c | `Section` |
| Title_English__c | `Shaping the Future` |
| Title_Arabic__c | `نشكل مستقبل` |
| Subtitle_English__c | `of Real Estate` |
| Subtitle_Arabic__c | `العقار` |
| Body_English__c | Hero paragraph (EN) |
| Body_Arabic__c | Hero paragraph (AR) |

### 3. Inspiring spaces

| Field | Value |
|-------|--------|
| Location__c | `Homepage Inspiring Spaces` |
| Type__c | `Section` |
| Content_URL__c | Building image URL |
| Title_English__c / Title_Arabic__c | Section headline |
| Body_English__c / Body_Arabic__c | Section text |

### 4. Stats header

| Field | Value |
|-------|--------|
| Location__c | `Homepage Stats Header` |
| Type__c | `Section` |
| Title_* / Body_* | Headline + paragraph |

### 5. Stats — Drive Through & Plaza

| Field | Drive Through | Plaza |
|-------|---------------|--------|
| Location__c | `Homepage Stats` | `Homepage Stats` |
| Type__c | `Stat` | `Stat` |
| **Name** | `drivethrough` | `plaza` |
| Value_Number__c | `32` | `11` |
| Suffix__c | `+` | `+` |
| Title_English__c | `Drive Through` | `Plaza` |
| Title_Arabic__c | Arabic label | Arabic label |

Units/Projects counts are still loaded from live data (not these records).

### 6. Our fields — section

| Field | Value |
|-------|--------|
| Location__c | `Homepage Our Fields` |
| Type__c | `Section` |
| Title_* | Section title |
| Subtitle_English__c | `Read More →` |
| Subtitle_Arabic__c | `اقرأ المزيد ←` |

### 7. Our fields — cards

| Field | Residential | Commercial |
|-------|-------------|------------|
| Location__c | `Homepage Our Fields` | `Homepage Our Fields` |
| Type__c | `Card` | `Card` |
| **Name** | `residential` | `commercial` |
| Content_URL__c | Image URL | Image URL |
| Title_* | Card title | Card title |
| Body_* | Card description | Card description |
| Link_URL__c | `/search?view=projects` | same |

### 8. About projects (title only)

| Field | Value |
|-------|--------|
| Location__c | `Homepage About Projects` |
| Type__c | `Section` |
| Title_English__c | `About` (line 1) — or put `About` + line break + `Our Projects` in Long Text if you use Body for EN |
| Title_Arabic__c | `عن مشاريعنا` |

For a two-line English title, use **Subtitle_English__c** = `Our Projects` with **Title_English__c** = `About`.

### 9. CMA block

| Field | Value |
|-------|--------|
| Location__c | `Homepage CMA` |
| Type__c | `Section` |
| Content_URL__c | Logo image |
| Body_* | Main paragraph |
| Subtitle_* | “Coming soon” teaser |
| Title_English__c / Title_Arabic__c | Button label (“View details”) |
| Link_URL__c | `/collaboration-coming-soon` |

### 10. Bottom CTA

| Field | Value |
|-------|--------|
| Location__c | `Homepage CTA` |
| Type__c | `Section` |
| Title_* | CTA headline |
| Body_* | CTA paragraph |
| Subtitle_* | Button label (“Register Your Interest”) |

---

If the new custom fields are not in the org yet, the app retries with legacy fields and falls back to built-in default copy.
