# Project Nearby Locations — Admin Console (`Nearby_Location__c`)

Curated places shown under **Location** on the project details page. Managed in Salesforce Admin Console as a related list on each `Project__c` record. The website does **not** auto-detect places from OpenStreetMap.

If a project has no active nearby locations, the section is hidden.

---

## Object setup

Create custom object **`Nearby_Location__c`** with **Master-Detail** to **`Project__c`** (label: Nearby Locations).

| API name | Type | Label (suggested) | Use |
|----------|------|-------------------|-----|
| `Project__c` | Master-Detail (`Project__c`) | Project | Parent project |
| `Name_English__c` | Text (255) | Name (English) | Place name shown in EN |
| `Name_Arabic__c` | Text (255) | Name (Arabic) | Place name shown in AR |
| `Category__c` | Picklist | Category | Icon key (see values below) |
| `Minutes__c` | Number | Minutes | Drive time shown in the UI (**required**) |
| `Sort_Order__c` | Number | Sort Order | Display order (lowest first) |
| `Is_Active__c` | Checkbox (default `true`) | Active | Uncheck to hide without deleting |

### Currently optional in org

Your org has **`Minutes__c`** — drive times load once the site uses the `withMinutes` query tier.

Still optional (add when needed):

1. **`Sort_Order__c`** — Number — display order (lowest first)  
2. **`Is_Active__c`** — Checkbox, default checked — hide without deleting  

If a record has no value in **`Minutes__c`**, the site shows “—” and “NEAR / من” instead of minutes.

### `Category__c` picklist values

Use these exact API values (they map to icons on the site):

- `Airport`
- `Train Station`
- `Hospital`
- `University`
- `School`
- `Library`
- `Mall`
- `Bank`
- `Port`
- `Chamber of Commerce`

---

## Admin workflow

1. Open a **Project** in Salesforce.
2. Related list **Nearby Locations** → **New**.
3. Fill English/Arabic name, category, minutes, sort order.
4. Leave **Active** checked.
5. Save. The project page shows the item on the next load.

---

## Example records

| Name (EN) | Name (AR) | Category | Minutes | Sort |
|-----------|-----------|----------|---------|------|
| King Khalid International Airport | مطار الملك خالد الدولي | `Airport` | `25` | `1` |
| Riyadh Park Mall | الرياض بارك | `Mall` | `12` | `2` |
| King Saud University | جامعة الملك سعود | `University` | `18` | `3` |

---

## Website query

```soql
SELECT Id, Name_English__c, Name_Arabic__c, Category__c, Minutes__c, Sort_Order__c
FROM Nearby_Location__c
WHERE Project__c = '{projectId}' AND Is_Active__c = true
ORDER BY Sort_Order__c ASC NULLS LAST, CreatedDate ASC
```
