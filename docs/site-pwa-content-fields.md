# Site-wide `PWA_Content__c` — CMS configuration

Configurable copy for **Latest Releases**, **Contact Us**, **Commercial & Rental** page headers, and **navigation bar labels** across the header, footer, and mobile bottom nav.

Uses the same plain-text fields as the homepage (see [homepage-pwa-content-fields.md](./homepage-pwa-content-fields.md)):

| API name | Type | Use |
|----------|------|-----|
| `Title_English__c` / `Title_Arabic__c` | Text | Page title or nav label |
| `Body_English__c` / `Body_Arabic__c` | Long Text | Page subtitle / description |
| `Location__c` | Text | Section slot |
| `Type__c` | Text | `Section` or `Card` |
| `Name` | Text | **Nav cards only**: stable slug (see table) |

---

## Location slots

| Location__c | Type__c | Purpose |
|-------------|---------|---------|
| `Site Latest Releases` | `Section` | Latest Releases page title + subtitle |
| `Site Contact` | `Section` | Contact page title + subtitle |
| `Site Commercial Rental` | `Section` | Commercial page hero title + subtitle |
| `Site Navigation` | `Card` | One record per nav label |

---

## 1. Latest Releases (title & subtitle)

| Field | Value |
|-------|--------|
| **Name** | `Site Latest Releases` (label only) |
| **Location__c** | `Site Latest Releases` |
| **Type__c** | `Section` |
| **Title_English__c** | `Latest Releases` |
| **Title_Arabic__c** | `أحدث إصداراتنا` |
| **Body_English__c** | `Explore our portfolio of residential and commercial developments across Saudi Arabia.` |
| **Body_Arabic__c** | `استكشف محفظتنا من المشاريع السكنية والتجارية في مختلف مناطق المملكة.` |

The page kicker (small label above the title) uses the **Latest Releases** nav label — see section 4.

---

## 2. Contact Us (title & subtitle)

| Field | Value |
|-------|--------|
| **Name** | `Site Contact` (label only) |
| **Location__c** | `Site Contact` |
| **Type__c** | `Section` |
| **Title_English__c** | `Contact Us` |
| **Title_Arabic__c** | `تواصل معنا` |
| **Body_English__c** | `We're here to help. Contact us for any inquiries or feedback` |
| **Body_Arabic__c** | `نحن هنا لمساعدتك. تواصل معنا لأي استفسارات أو ملاحظات` |

---

## 3. Commercial & Rental (title & subtitle)

Controls the **hero headline** on `/commercial-rental` (main title + subtitle). Form copy and description paragraph remain in i18n.

| Field | Value |
|-------|--------|
| **Name** | `Site Commercial Rental` (label only) |
| **Location__c** | `Site Commercial Rental` |
| **Type__c** | `Section` |
| **Title_English__c** | `Empower Your Business` |
| **Title_Arabic__c** | `طوّر أعمالك` |
| **Body_English__c** | `Premium Commercial & Rental Spaces` |
| **Body_Arabic__c** | `مساحات تجارية وعقارات تأجير متميزة` |

---

## 4. Navigation bar labels

Create **12** `Card` records. **`Name` must match the slug exactly** — used in the header, footer, and mobile nav.

Shared fields for every nav record:

| Field | Value |
|-------|--------|
| **Location__c** | `Site Navigation` |
| **Type__c** | `Card` |

| Name (slug) | Title_English__c | Title_Arabic__c | Where it appears |
|-------------|------------------|-----------------|------------------|
| `home` | Home | الرئيسية | Header, footer, bottom nav |
| `search` | Search | البحث | Footer, bottom nav |
| `aboutUs` | About Us | من نحن | Header, footer, bottom nav (more menu) |
| `achievements` | Our Achievements | إنجازاتنا | Header, footer, bottom nav |
| `community` | My Community | مجتمعي | Header (more), footer, bottom nav |
| `contact` | Contact Us | تواصل معنا | Header button, footer, bottom nav |
| `support` | Support | الدعم | Header more menu → Contact page |
| `latestReleases` | Latest Releases | احدث اصداراتنا | Header more menu, Latest Releases kicker |
| `ourNews` | Our News | اخبارنا | Header, footer, bottom nav |
| `more` | More | المزيد | Header dropdown, bottom nav |
| `call` | Call | اتصال | Bottom nav more menu |
| `commercial` | Commercial & Rental | التجاري والتأجير | Header main nav |

---

## Record count summary

| Section | Records |
|---------|---------|
| Latest Releases | 1 |
| Contact Us | 1 |
| Commercial & Rental | 1 |
| Navigation labels | 12 |
| **Total** | **15** |

---

## Verification

1. Create the records above in Salesforce.
2. Check navigation labels in the desktop header, mobile bottom nav, and footer.
3. Open `/latest-releases`, `/contact`, and `/commercial-rental` — hero copy should match current text.
4. Edit `Title_English__c` on a nav card and refresh (cache clears after ~5 minutes).
