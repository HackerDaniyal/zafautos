# Design System Inspired by Zaf Autos Japan

## 1. Visual Theme & Atmosphere

Zaf Autos Japan's identity is built on a single image: a car emerging out of total darkness, caught mid-motion under one hard light. The brand lives in that frame — black background, a white racing silhouette, and one red hit that tells you exactly where to look. This isn't a friendly neighborhood dealership look. It's imported, inspected, graded, and shipped — the visual language of JDM auction culture, tuner garages, and night meets, translated into a website.

The page defaults to near-black (`#0A0A0A`), not because it's trendy, but because it's the only backdrop that makes chrome, glass, and paint actually look expensive. Onto that black, white carries almost everything — headlines, body copy, line art — and Signal Red is spent like ammunition: prices, one CTA per screen, a status badge. The chequered-flag mark and the sharp two-line car silhouette from the logo aren't just a badge in the corner — they're a motif that repeats through hairline dividers, corner accents, and section breaks.

Typography is condensed and uppercase at the top of the scale — display headlines feel stamped onto a number plate — then drops into a clean grotesque for anything the visitor actually has to read closely (specs, prices, WhatsApp replies, listing descriptions). The result should feel like flipping through an auction sheet at night: serious, slightly clinical, but with just enough red heat to feel alive.

**Key Characteristics:**
- Near-black (`#0A0A0A`) dominant surfaces, white for structure and text, red spent as a single accent
- Condensed, bold, uppercase display type (Oswald / Bebas Neue) paired with a clean grotesque body font (Inter / Poppins)
- Signal Red (`#E5231B`) reserved exclusively for price, primary CTA, and status/urgency badges
- Chequered-flag motif used as a literal texture for hairline dividers and section breaks, not just in the logo lockup
- Sharp car-silhouette line art as a recurring background/section-break graphic, always monochrome
- Low, near-zero border-radius on primary actions and price tags — small radius (6–8px) permitted on content cards for a slightly more approachable, sales-facing feel than a hyper-luxury brand
- Studio-lit, single-source-highlight car photography — never flat daylight lot shots
- Grid built for listings first (car cards, specs, filters) — this is a functional auction/import business site, not a pure brand film

## 2. Color Palette & Roles

### Primary
- **Race Black** (`#0A0A0A`): Dominant background — page canvas, header, footer, hero. The void the car emerges from
- **Pure White** (`#FFFFFF`): Primary text on dark surfaces, logo rendering, nav labels, line-art strokes
- **Signal Red** (`#E5231B`): The one accent color — price figures, the single primary CTA per view ("Enquire", "Reserve", "View details"), live/urgent status badges ("Auction closing")

### Secondary & Accent
- **Deep Red** (`#9E1913`): Hover/pressed state for red buttons and price hover — darkens the red to signal interaction without losing warmth
- **Ember** (`#FF5A45`): Lighter red variant used sparingly for inline highlight text or a "new listing" tag — never for large fills
- **Chrome Silver** (`#B8B8B8`): Icon strokes, dividers, secondary badges (mileage, grade, year) — the "metal" neutral
- **Link Blue** (`#4A90D9`): Reserved strictly for hyperlink hover states in body copy (T&Cs, blog content) — never touches the car-listing UI

### Surface & Background
- **Race Black** (`#0A0A0A`): Page background, hero, header, footer
- **Carbon** (`#1A1A1A`): Elevated surface — the primary "card" color for listings, spec panels, forms sitting above black
- **Deep Carbon** (`#141414`): Subtle surface variant for image placeholders and nested panels inside cards
- **Overlay Black** (`rgba(0,0,0,0.72)`): Modal backdrops, image lightbox dimming
- **Paper White** (`#F7F7F5`): The one light surface — used only for printable documents (invoices, spec sheets) and light-mode email templates
- **Mist** (`#EAEAEA`): Light-mode secondary surface, matching Paper White contexts

### Neutrals & Text
- **Pure White** (`#FFFFFF`): Primary text/headlines on dark surfaces
- **Smoke** (`#E4E4E2`): Secondary text on dark surfaces — slightly softer than pure white, used for sub-headlines
- **Ash** (`#9A9A9A`): Muted text — timestamps, "listed 3 days ago", helper copy
- **Steel** (`#6E6E6E`): Disabled text, placeholder text in dark inputs
- **Graphite** (`#3D3D3D`): Body text on Paper White surfaces (invoices, printed docs)
- **Iron** (`#2A2A2A`): Borders and hairlines on dark surfaces — barely visible, structural only

### Semantic
- **Available Green** (`#3BA55D`): "In stock" / "Available" status only
- **Sold Gray** (`#5A5A5A`): "Sold" status badge — deliberately desaturated, the opposite energy of Signal Red
- **Auction Amber** (`#D89A2E`): "Bidding open" / time-sensitive status

### Gradient System
- No decorative gradients. The only permitted gradient is a single, subtle top-to-bottom darkening (`#0A0A0A` → `rgba(0,0,0,0.85)`) behind hero text to guarantee legibility over a car photo — never used on buttons, cards, or badges
- Depth is achieved through surface layering: `#0A0A0A` → `#141414` → `#1A1A1A` → `#2A2A2A`

## 3. Typography Rules

### Font Family
- **Display**: `Oswald` (or `Bebas Neue` for maximum poster impact on hero-only moments) — condensed, bold, uppercase. Mirrors the tight, tall lettering in the wordmark
- **Body / UI**: `Inter` — regular and medium weights only. Carries specs, descriptions, forms, and anything client-facing that needs to be read quickly and trusted
- **No italics anywhere** — the brand is direct, not stylized

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|-----------------|-------|
| Hero Display | 72px | 700 | 0.95 | 0.5px | Oswald, uppercase, hero headline only |
| Section Title | 40px | 700 | 1.05 | 0.5px | Oswald, uppercase |
| Sub-section | 28px | 700 | 1.15 | 0.3px | Oswald, uppercase |
| Card Title | 18px | 700 | 1.2 | 0.3px | Oswald, uppercase — listing model names |
| Price | 22px | 700 | 1.0 | normal | Oswald, Signal Red, never uppercase-stretched beyond digits |
| Body Large | 17px | 400 | 1.6 | normal | Inter, intro paragraphs |
| Body / UI | 15px | 400/500 | 1.6 | normal | Inter, default paragraph and form text |
| Button | 14px | 500 | 1.0 | 0.4px | Inter, uppercase, medium weight |
| Spec Label | 12px | 500 | 1.4 | 0.6px | Inter, uppercase — "MILEAGE", "GRADE", "YEAR" |
| Caption / Meta | 12px | 400 | 1.4 | normal | Inter, Ash color — timestamps, IDs |

### Principles
- **Display type is always uppercase**; body and specs are sentence case except for spec labels, which stay uppercase and small — this is the one place all-caps is functional, not decorative
- **Condensed display, generous body**: the contrast between tight headlines and relaxed 1.6 line-height body copy keeps the site from feeling claustrophobic despite the dark canvas
- **Price never competes with the headline font** — always Oswald bold but never larger than a card title, and always red so the eye finds it instantly on any listing
- **One weight jump only**: 400 for reading, 700 for shouting. No 500/600 in headlines, no light weights anywhere — this keeps the type system as disciplined as the two-color palette

## 4. Component Stylings

### Buttons
Primary actions use a **tiny radius (6px)** — sharp enough to feel automotive, soft enough to feel approachable for a business people are messaging on WhatsApp.

**Signal Red CTA** — the one primary action per screen:
- Default: bg `#E5231B`, text `#FFFFFF`, padding 14px 28px, fontSize 14px, fontWeight 500, uppercase, borderRadius 6px, no border
- Hover: bg `#9E1913`
- Used for: "Enquire now", "Reserve this car", "View details"

**Outline Ghost** — secondary action on dark surfaces:
- Default: bg transparent, text `#FFFFFF`, border 1px solid `#B8B8B8`, padding 14px 28px, borderRadius 6px
- Hover: border `#FFFFFF`, bg `rgba(255,255,255,0.06)`
- Used for: "See full spec sheet", "Compare", secondary nav actions

**White Filled** — used sparingly on hero sections over photography:
- Default: bg `#FFFFFF`, text `#0A0A0A`, borderRadius 6px
- Used for: hero CTA when red would clash with red-heavy car photography

**Status Badge** (not clickable):
- Available: bg `rgba(59,165,93,0.15)`, text `#3BA55D`, borderRadius 4px, padding 4px 10px, uppercase 11px
- Sold: bg `rgba(90,90,90,0.2)`, text `#9A9A9A`
- Auction open: bg `rgba(216,154,46,0.15)`, text `#D89A2E`

### Cards & Containers
- Background: `#1A1A1A` on the black canvas
- Border: 1px solid `#2A2A2A` — just enough to separate cards without a visible shadow
- Border-radius: 10px on listing cards, 6px on nested elements (image thumbnails inside a card)
- Image area: `#141414` placeholder background before load, always 16:10 aspect ratio for consistency across a grid
- Price sits bottom-left in red, primary CTA sits bottom-right, spec row (mileage · year · grade) sits directly under the title in Ash gray

### Inputs & Forms
- Background: `#1A1A1A`, border 1px solid `#2A2A2A`, text `#FFFFFF`, placeholder `#6E6E6E`
- Focus: border `#E5231B`, no glow/shadow — a color change only, consistent with the brand's "no glow" discipline
- Radius: 6px, matching buttons

### Navigation
- **Desktop**: Logo left (chequered flag + wordmark), horizontal nav center/right (Inventory, Import process, Contact), single red "Enquire" button far right
- **Background**: `#0A0A0A`, sticky, 1px bottom border in `#1A1A1A` once scrolled — no border at the very top of the page
- **Mobile**: Hamburger right, logo left, nav collapses to a full-black overlay panel

### Image Treatment
- Hero: full-width car photography, single dramatic highlight, dark vignette at edges to protect text legibility
- Listing thumbnails: consistent 16:10 crop, neutral studio background preferred over lot photography
- No flat, evenly-lit "used car lot" photography — if a client sends daylight photos, plan to re-shoot or heavily grade them toward the dark studio look before they go live

### Distinctive Components
- **Chequered hairline divider**: a thin repeating black/white check pattern, 4px tall, used to break sections instead of a plain line
- **Spec strip**: a horizontal row of small uppercase labels (MILEAGE / YEAR / GRADE / ENGINE) with Ash labels and White values, used under every car title
- **Auction countdown**: monospace-style number treatment in Auction Amber for time-sensitive listings

## 5. Layout Principles

### Spacing System
- **Base unit**: 8px
- **Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Card padding**: 16px
- **Section padding**: 64px vertical / 24px horizontal (desktop), 40px / 16px (mobile)

### Grid & Container
- **Max width**: 1280px
- **Listing grid**: 3 columns desktop, 2 tablet, 1 mobile — 24px gap
- **Hero**: full-bleed, breaks out of the container edge to edge

### Whitespace Philosophy
Black is the resting state, not empty space. Every section gets generous vertical padding (64px+) so cards, prices, and headlines read as deliberate exhibits rather than a cramped listings feed. The darkness does the same job pure white space does in a light system — it gives each car room to be the only thing in the frame.

### Border Radius Scale
| Value | Context |
|-------|---------|
| 4px | Status badges |
| 6px | Buttons, inputs, nested thumbnails |
| 10px | Listing cards, content panels |
| 0px | Chequered divider, hairlines, price tag underline |

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Level 0 | `#0A0A0A` flat | Page background |
| Level 1 | `#1A1A1A` | Cards, panels, form fields |
| Level 2 | `#2A2A2A` border only | Card outlines, dividers |
| Level 3 | `rgba(0,0,0,0.72)` | Modal backdrop, lightbox |

### Shadow Philosophy
No drop shadows — on a near-black canvas they're invisible anyway. Elevation is communicated purely through surface lightening (`#0A0A0A` → `#1A1A1A` → `#2A2A2A`) and a 1px border, the same "darkness gradient" logic as the reference system this is modeled on.

## 7. Do's and Don'ts

### Do
- Keep the background at `#0A0A0A` — never substitute a lighter charcoal as the default canvas
- Spend Signal Red on exactly one thing per screen: price, or the primary CTA, or a status badge — never all three fighting for attention
- Set all display headlines in uppercase condensed type; keep specs and body sentence case
- Use the chequered motif as a functional divider, not just a logo decoration
- Light car photography with one dramatic highlight, matching the logo's single-headlight treatment
- Use small radii (6–10px) — enough to feel modern and clickable, not so much it feels soft or generic

### Don't
- Introduce a second accent color competing with red — silver and ash are structural, not decorative
- Use daylight, flat-lit "car lot" photography anywhere on the site
- Let price text appear in any color other than Signal Red
- Add glows, gradients-as-decoration, or drop shadows — depth comes from surface layering only
- Mix in lowercase display headlines — uppercase is the brand's voice at that scale
- Overuse the outline-ghost button — one primary red action per view, everything else stays secondary

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|--------------|
| Mobile | <576px | Single column listings, stacked nav, hero text 32px |
| Tablet | 576–1024px | 2-column listing grid, hero text 48px |
| Desktop | 1024–1280px | 3-column grid, full nav, hero text 64px |
| Wide | >1280px | Content capped at 1280px, hero text 72px |

### Touch Targets
- Primary CTA buttons: 44px+ height with 14px vertical padding
- Nav items and filter chips: 40px+ minimum tap area

### Collapsing Strategy
- Nav collapses to hamburger under 1024px
- Listing grid: 3 → 2 → 1 columns
- Hero display type scales 72px → 48px → 32px
- Spec strip wraps to two rows on mobile instead of clipping

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: "Race Black (#0A0A0A)"
- Card surface: "Carbon (#1A1A1A)"
- Primary accent / price / CTA: "Signal Red (#E5231B)"
- Heading text: "Pure White (#FFFFFF)"
- Muted text: "Ash (#9A9A9A)"
- Border: "Iron (#2A2A2A)"

### Example Component Prompts
- "Create a hero section on Race Black (#0A0A0A) with a full-width studio car photo, a dark bottom-to-top gradient overlay, and the headline 'IMPORTED. INSPECTED. READY.' in Oswald uppercase 72px bold white text, with a Signal Red (#E5231B) 'View inventory' button below at 6px radius"
- "Design a listing card on Carbon (#1A1A1A) with 10px radius, a 16:10 image placeholder in Deep Carbon (#141414), an Oswald uppercase title, an Ash-colored spec row (mileage · year · grade), a Signal Red price bottom-left, and an outline-ghost 'View details' button bottom-right"
- "Build a sticky nav on Race Black with the chequered-flag logo left, centered links in white Inter medium, and one Signal Red 'Enquire' button right"
- "Create a status badge system: green pill for Available, gray pill for Sold, amber pill for Auction open, all 4px radius, uppercase 11px text"
- "Design a chequered hairline divider — a thin repeating black/white check pattern, 4px tall, used between page sections instead of a plain border"

### Iteration Guide
1. Change one component at a time — the palette is deliberately narrow (black, white, red, plus two neutrals), so any new color should be questioned before it's added
2. Reference exact hex values from this document when prompting — there are only about 6 active colors in the whole system
3. Describe the feel alongside the measurement — "a car pulling out of total darkness" communicates the mood better than "background: #0A0A0A"
4. Uppercase condensed type is the default at display sizes — if a headline isn't shouting, check whether it should be
