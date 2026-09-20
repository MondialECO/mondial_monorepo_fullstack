# Phase 4 Capability Taxonomy & Alias Normalization

## Core Principle

Capability matching cannot rely on strict equality (`requiredSkill == profileSkill.Name`). The `ICapabilityMatcher` / `CapabilityMatcher` implements deterministic normalization:
- Trim whitespace
- Case-insensitive comparison
- Punctuation stripping (`Regex.Replace(input, @"[^\w\s\.\#\+\-]", "")`)
- Multi-token alias matching
- Technology-to-capability taxonomy lookup
- Proficiency level mapping (`Advanced` / `Comfortable` -> `Ready`, `Beginner` -> `Partial`, `null` -> `NeedsReview`)
- Default to `NeedsReview` when partial or ambiguous similarity exists (never falsely `Missing` or `Critical`)

## Canonical Taxonomy Groups & Aliases

### 1. Web / Software Development
- **Canonical Label**: `Web / Software Development`
- **Aliases & Technologies**:
  - `software development`, `web development`, `full-stack development`, `frontend development`
  - `backend development`, `software engineering`, `programming`, `coding`, `web developer`
  - `react`, `next.js`, `nextjs`, `vue`, `angular`, `node`, `nodejs`, `c#`, `.net`, `dotnet`
  - `asp.net`, `asp.net core`, `python`, `django`, `fastapi`, `java`, `spring`, `golang`, `php`
  - `laravel`, `wordpress`, `ruby`, `rails`, `sql`, `postgresql`, `mongodb`, `docker`, `kubernetes`
  - `aws`, `azure`, `gcp`, `cloud`, `devops`, `mobile development`, `react native`, `flutter`
  - `ios`, `android`, `swift`, `kotlin`, `api`, `rest api`, `graphql`, `typescript`, `javascript`

### 2. Product / UI Design
- **Canonical Label**: `Product / UI Design`
- **Aliases & Technologies**:
  - `ui design`, `ux design`, `ui/ux design`, `product design`, `web design`, `graphic design`
  - `figma`, `sketch`, `adobe xd`, `prototyping`, `wireframing`, `design system`, `user research`
  - `interaction design`, `visual design`, `photoshop`, `illustrator`

### 3. Paid Acquisition
- **Canonical Label**: `Paid Acquisition`
- **Aliases & Technologies**:
  - `paid acquisition`, `paid media`, `paid ads`, `performance marketing`, `facebook ads`
  - `meta ads`, `google ads`, `google adwords`, `ppc`, `sem`, `tiktok ads`, `media buying`
  - `growth marketing`

### 4. Organic Marketing & Content
- **Canonical Label**: `Organic Marketing & Content`
- **Aliases & Technologies**:
  - `seo`, `search engine optimization`, `content marketing`, `social media`, `social media marketing`
  - `copywriting`, `organic marketing`, `community management`, `email marketing`, `inbound marketing`
  - `blogging`, `public relations`, `pr`

### 5. Sales & Business Development
- **Canonical Label**: `Sales & Business Development`
- **Aliases & Technologies**:
  - `sales`, `b2b sales`, `b2c sales`, `business development`, `lead generation`, `outreach`
  - `cold calling`, `negotiation`, `account management`, `crm`, `customer acquisition`

### 6. Finance & Accounting
- **Canonical Label**: `Finance & Accounting`
- **Aliases & Technologies**:
  - `accounting`, `bookkeeping`, `financial modeling`, `corporate finance`, `budgeting`
  - `financial analysis`, `cash flow management`, `comptabilité`, `gestion financière`

### 7. Legal & Compliance
- **Canonical Label**: `Legal & Compliance`
- **Aliases & Technologies**:
  - `legal`, `contract law`, `compliance`, `gdpr`, `rgpd`, `intellectual property`, `ip law`
  - `regulatory compliance`, `droit`, `juridique`
