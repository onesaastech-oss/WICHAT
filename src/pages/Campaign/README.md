# Campaign Builder Data Flow

This document explains how data moves through the campaign builder experience, from the moment a user selects contacts to the point where template variables are mapped for sending a WhatsApp campaign.

---

## High-Level Overview

| Step | Component | Responsibility | Key Data Passed Up |
|------|-----------|----------------|--------------------|
| 1 | `CampaignBuilder` | Owns all shared state, renders each step | `selectedContacts`, `selectedContactDetails`, `selectedTemplate`, `variableValues`, `excelHeaders`, etc. |
| 2 | `AudienceSelector` | Presents audience source options (contacts, Excel, etc.) | Forwards callbacks to the active audience sub-component |
| 3 | `ContactsSelector` | Fetches contacts from the API, handles selection, maintains local cache | Updates campaign-level state with selected IDs and full contact records |
| 4 | `TemplateSelector` | Opens template modal, normalises template payload, handles variable mapping | Updates `selectedTemplate`, `variableValues`, and tracks auto-fill sources |
| 5 | `WhatsAppPreview` / `CampaignSummary` | Shows live preview and action controls | Read-only view of campaign state |

All shared state is centralised in `src/pages/Campaign/Campaign.js` (`CampaignBuilder`). Child components receive a copy of the current state plus setter callbacks so updates are always pushed back to the same owner.

---

## Detailed Flow

### 1. CampaignBuilder (Parent State Manager)

- Declares React state hooks for:
  - `selectedContacts`: `string[]` of contact IDs chosen in the audience step.
  - `selectedContactDetails`: full contact objects keyed by ID, used for auto-filling template variables.
  - `selectedTemplate`: the normalised template chosen from the modal.
  - `variableValues`: key/value map for each template placeholder (e.g. `var_1` → `"John"`).
  - Excel-related data (`excelHeaders`, `excelContacts`, `excelMapping`) for uploads.
- Passes state + setters to child components:
  - `AudienceSelector` receives both contact ID setters and Excel helpers.
  - `TemplateSelector` receives `selectedContactDetails` (for mapping) and Excel headers.
  - `CampaignSummary` and `WhatsAppPreview` consume state directly to present the current configuration.

> File reference: `CampaignBuilder` in `src/pages/Campaign/Campaign.js`

---

### 2. Audience Selection Flow

#### `AudienceSelector`
- Presents four audience source buttons (“From Contacts”, “Upload Excel”, “Google Sheet”, “Contact Groups”).
- Based on `audienceType`, renders the matching sub-component.
- Simply forwards the parent’s setter callbacks, so sub-components can mutate top-level state without re-implementing the logic.

#### `ContactsSelector`
- Loads auth tokens from `localStorage` or `sessionStorage`.
- Debounces search input and fetches real contacts by calling `POST https://api.w1chat.com/contact/contact-list` with encrypted payload:
  ```json
  { "project_id": "...", "page_no": 1, "query": "" }
  ```
- Maintains:
  - `contacts`: current result set (merged across pages).
  - `contactsMap`: fast lookup by `contact_id` for building full detail arrays.
- When a user toggles a contact:
  1. Updates `selectedContacts` (ID array) via parent setter.
  2. Rebuilds `selectedContactDetails` by mapping IDs through `contactsMap`.
- Supports “Select All”, pagination (“Load More”), and search.

---

### 3. Template Selection & Variable Mapping

#### `TemplateSelector`
- Loads tokens for opening the chat template modal (`ChatTemplateModal`).
- When a template is chosen:
  1. Normalises the API response into a clean `campaignTemplate` object (id, name, language, category, etc.).
  2. Extracts template variables by scanning header/body placeholders (`{{1}}`, `{{2}}`...).
  3. Resets `variableValues` for every variable and clears previous auto-fill sources.
- Variable form features:
  - Manual entry in text inputs (tracked as `type: 'manual'`).
  - Dropdown of auto-fill options (only shown if there are contact fields or Excel headers).
    - **Contact fields**: derived from the first selected contact (`name`, `number`). When chosen, the sample value is stored in `variableValues` and marked as `type: 'contact'`.
    - **Excel headers**: pulled from `excelHeaders`. Selecting one stores the header name and marks the source as `type: 'excel'`.
  - React effect keeps contact-based auto-fill values in sync. If the first contact changes, mapped variables re-populate automatically.

#### `ChatTemplateModal`
- Handles:
  - Loading templates via `POST https://api.w1chat.com/template/template-list`.
  - Search/filter, pagination, and selection.
  - Returns the raw template payload back to `TemplateSelector` via `onTemplateSelect`.

---

### 4. Preview & Summary

- `WhatsAppPreview` receives `selectedTemplate` + `variableValues` and renders a live mock of the WhatsApp message.
- `CampaignSummary` evaluates readiness via utility helpers:
  - Audience: must have at least one contact, mapped Excel columns, or group selections depending on the chosen type.
  - Template: all required variables must have a non-empty value.
  - Only when both are true does the “Launch Campaign” button become enabled.

---

## Key Utility Helpers

- `campaignHelpers.js` contains:
  - `canProceed(...)`: verifies the minimal data needed to move between steps or launch.
  - `getAudienceSummary(...)`: human-readable status for the summary card.

---

## Sequence Summary

```
User selects contacts  →  ContactsSelector updates IDs + details in CampaignBuilder
↓
User proceeds to template tab → TemplateSelector opens modal, user picks template
↓
TemplateSelector normalises template, resets variableValues, exposes auto-fill options
↓
User maps variables (manually, contact field, or Excel column)
↓
WhatsAppPreview + CampaignSummary read shared state and display final status
↓
Launch command can send payload when both audience and template requirements are satisfied
```

This centralised flow keeps data synchronised, predictable, and ready for integrating final send/launch actions.

