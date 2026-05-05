# The Light of Life — Design System

**The Light of Life (말씀의빛)** is a B2B Christian psychological-counseling service, an official partner of **CTS 기독교TV**. It serves churches and members of the church (성도) by combining biblically-grounded pastoral counseling with clinical psychometric assessments.

> **Headline:** 말씀으로 치유하는 마음
> **Subhead:** 성경적 상담과 임상 심리검사가 만나는 곳

This system is the visual + verbal toolkit for that product: the colors, type, voice, and components used across the website, partner church portal, and counselor-facing tools.

## Sources & provenance

This design system was built **from a written brief only** — no codebase, Figma file, or existing asset library was attached. Decisions documented below are first-pass interpretations of:

- Brand colors specified in brief: Deep Navy `#0F2044`, Gold `#C9A227`, Purple `#6B21A8`
- Positioning: B2B, churches & members, Christian psychological counseling
- Required hero content: scripture-card, two CTAs, three trust indicators
- Tone direction: "professional and authoritative, not amateurish"

If real source materials exist (CTS partner brand guide, prior counseling-platform UI, Korean Christian publishing references) please attach them so this can be revised against them rather than generated.

---

## Index

| File / folder | Purpose |
|---|---|
| `README.md` | This file. Brand context, content + visual foundations, iconography. |
| `SKILL.md` | Skill manifest — lets agents reuse this system. |
| `colors_and_type.css` | All color tokens, type scale, spacing, radii, shadows, motion. |
| `assets/` | Logos, marks, scripture-card ornament, partner badges. |
| `preview/` | Cards rendered in the Design System tab. Not for production. |
| `ui_kits/landing/` | Hi-fi recreation of the marketing landing page (hero + components). |

---

## Brand context

### Who it serves
- **Primary buyer:** church staff (pastor, 교역자, 사모, 부서장) sourcing care for congregants
- **End user:** the 성도 — a churchgoer carrying a difficult emotional or spiritual burden, often hesitant to use secular therapy
- **Counselor:** licensed Christian psychological counselor working through the platform

### What it does
1. Surfaces a vetted directory of Christian counselors
2. Offers free, validated screening tools (PHQ-9, GAD-7) plus 8 paid assessments
3. Includes a "biblical AI counselor" — first-line, scripturally framed conversational support
4. Sells bulk church-level subscriptions

### Why it must feel authoritative
The audience is skeptical of two things at once: (a) secular psychology that ignores faith, and (b) "Christian" services that lack clinical credibility. The visual system has to telegraph **both** — clinical seriousness *and* doctrinal trust — without leaning into kitsch (no doves, no praying-hands stock photos, no soft-purple gradients).

---

## CONTENT FUNDAMENTALS

### Voice
- **Reverent, not casual.** This is care work that touches faith. Avoid cheerleading, exclamation marks, hype phrasing.
- **Clinically literate.** Use proper instrument names (PHQ-9, GAD-7, MMPI-2-RF, MBTI, TCI). Don't dumb them down for laypeople — explain *briefly*, then trust them.
- **Pastorally warm.** When addressing the 성도 directly, soften: "혼자 견디지 않으셔도 괜찮습니다" rather than "Get help today!"
- **Institutional when speaking to churches.** "교회 단위 도입", "교역자 케어 프로그램".

### Person & address
- Korean honorific level: **하십시오체 / 합니다체** for marketing copy and church-facing material. Never 반말.
- English mirrors that register: prefer "for churches and the people they shepherd" over "for you and your team."
- Use "성도" (saints / members) rather than "users" or "customers" when speaking of the people receiving care.
- The product refers to itself as 말씀의빛 / The Light of Life, not "we" in marketing copy unless quoting a person.

### Casing & punctuation
- Headlines: **Sentence case** in English; Korean uses no terminal period in display headlines.
- Eyebrows / labels: **UPPERCASE** with wide letter-spacing (0.18em). English only — Korean labels stay in normal case.
- Numerals: tabular figures, hyphenated instrument names exact (PHQ-9 not PHQ9).
- Em dash for asides; never `--`. Korean prefers · (middle dot) for short lists: "교회 · 성도 · 상담사".

### What we *don't* say
- ❌ "Heal yourself" / "Find your best self" — wrong theology of self
- ❌ "Therapy made easy" / "Mental health, simplified" — flattens the work
- ❌ Emoji in product copy. None.
- ❌ "Faith-based" used adjectivally — say "biblical" or "성경적".
- ❌ Marketing exclamation marks. The system has zero `!` in its copy.

### Examples (from the brief, expanded into voice)
- ✅ "말씀으로 치유하는 마음"
- ✅ "성경적 상담과 임상 심리검사가 만나는 곳"
- ✅ "8종의 전문 심리검사로 마음의 지도를 그립니다."
- ✅ "PHQ-9 · GAD-7 무료 검사 — 시작은 부담 없이."
- ✅ "교회 단위 도입 문의" (not "Talk to sales")
- ✅ "혼자 견디지 않으셔도 괜찮습니다."

---

## VISUAL FOUNDATIONS

### Color
- **Deep Navy (`#0F2044`)** is the ground — used full-bleed in the hero and as primary text color. It signals seriousness, night-watch, the steady authority of a sanctuary at evening.
- **Gold (`#C9A227`)** is sacred highlight only. It marks the primary CTA, scripture-card ornaments, the seal/wordmark, dividers between sections of scripture. Never used for body text. Never used as a background fill at >5% area.
- **Purple (`#6B21A8`)** is the supporting accent, drawn from episcopal/Lenten purple. Used for category tags, secondary information, the AI-counselor moniker. Never adjacent to gold without navy mediating between them.
- Neutrals lean **warm parchment** (`#FBF9F4`) for light surfaces — this distinguishes the system from generic SaaS cold-white and references devotional book pages.
- **No gradients on hero backgrounds.** Solid navy. A vignette / radial darkening at the corners is allowed, very subtle.
- Do not introduce new accent colors. Purple-and-gold-and-navy is the entire palette; everything else is neutral.

### Typography
- **Display: Cormorant Garamond + Noto Serif KR.** Both have sturdy humanist serifs evoking ecclesiastical print. Korean headlines use Noto Serif KR weight 500–600 with `-0.025em` tracking and `keep-all` word-break.
- **Body / UI: Inter.** Neutral grotesque for chrome, forms, data. Tabular figures on for any number.
- **Scripture: italic Cormorant.** Always italic, always with a gold reference label below in caps, e.g. `— PSALM 23:1`.
- Headlines are **medium weight (500)**, not bold. Bold serif at display size reads as a megachurch billboard; medium reads as a published volume.

### Spacing & rhythm
- 4px base unit. Token scale `s-1`…`s-32`.
- Section padding on landing surfaces: `s-20` (80px) vertical desktop, `s-12` (48px) mobile.
- Generous left rail / column margins — never edge-to-edge content on desktop; max content width 1200px with 24px gutter.

### Backgrounds & motifs
- **Navy hero** with a subtle paper-grain SVG noise overlay (~3% opacity) for depth without busyness.
- A **gold hairline rule** (1px, 30% opacity) is the system's signature divider — used between scripture and reference, between hero columns, around the scripture card.
- A small **cross-glyph ornament** (✦-style four-pointed star, not a literal crucifix) appears as decoration on scripture cards. Subtle.
- **No stock imagery of hands, candles, or sunsets.** If photography is used, it's architectural — sanctuary interiors, books on a desk, abstract light through stained glass — desaturated, slight warm grade.
- No repeating illustration patterns. No hand-drawn doodles.

### Animation
- **Slow, dignified.** Default duration 200–320ms, easing `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out). Never spring/bounce.
- Hero text fades + rises 8px on load (`dur-4`, 520ms, staggered 80ms per element).
- Scripture card has a gentle gold-rule draw-in on first reveal (~600ms).
- No looping animations. No parallax on text.

### Hover & press states
- **Buttons:** primary (gold) darkens to `--brand-gold-600` on hover; outline (navy) fills navy at 6% on hover. Press: scale to 0.98, no color change. Focus ring: 2px gold at 4px offset.
- **Links:** color shift to `--brand-purple-700`; underline already present.
- **Cards:** elevation moves from `--sh-2` to `--sh-3` on hover, translate-Y -2px, 200ms.

### Borders, radii, shadows
- **Borders:** hairlines at `rgba(15,32,68,0.10)` — almost imperceptible. Heavier `0.18` only on form fields.
- **Radii:** restrained. Cards `--r-xl` (14px). Buttons `--r-md` (6px). Pills `--r-pill`. Avoid `--r-2xl` except on imagery.
- **Shadows:** four-step elevation, all cool-navy-tinted (no warm grey shadows). The `--sh-gold` glow is reserved for the primary CTA on dark backgrounds only.
- A signature treatment: **inset gold hairline** on scripture cards — `inset 0 0 0 1px rgba(201,162,39,0.45)` — replaces a heavy border.

### Layout rules
- Fixed top header, 72px desktop / 56px mobile, navy with hairline bottom border on dark.
- Hero is a 7/5 column split desktop (text 7, scripture card 5). Stacks on mobile.
- Trust-indicator row is full-width below hero, on a paper background, separated by a 1px gold hairline rule above.
- No floating chat bubbles. No cookie banners shown in design.

### Transparency & blur
- Used sparingly. The header gains `backdrop-filter: blur(12px)` and `rgba(15,32,68,0.72)` background only when scrolled past the hero.
- The scripture-card ornament uses a soft 8% gold-fill behind the glyph; that's the only "translucent fill" in the system.

### Imagery grade
- Cool-warm crossed: shadows lean cool navy, highlights warm parchment. Never fully cool, never fully warm.
- B&W is acceptable for portraits of counselors with a 5% warm tone added.
- Slight grain (1.5%) on full-bleed photos to keep them from looking "stock."

### Cards
- Background: `--white` on paper, or `--brand-navy-800` on dark hero.
- Border: hairline `--border-1` on light, `--border-on-dark-1` on dark.
- Radius: 14px (`--r-xl`).
- Shadow: `--sh-2` resting, `--sh-3` hover.
- Padding: 32px desktop, 24px mobile.
- Scripture cards add `--sh-inset-gold` and a centered ✦ ornament at the top.

---

## ICONOGRAPHY

No source codebase or icon font was provided, so this system uses **inline SVG icons authored in-house** at the lightest weight that still reads as authoritative — **1.5px stroke**, rounded line caps, on a 24×24 grid. They are simple geometric pictograms (shield-with-check, book-open, chart-line, sparkle-cross) that do not pretend to be photographic.

- A small **library of 8 SVGs** lives in `assets/icons/` covering: assessment, counselor, AI-chat, church, security, scripture, screening, scheduling.
- Stroke width is constant across the set.
- **No emoji anywhere in product or marketing surfaces.** This is a non-negotiable voice rule.
- **No unicode characters as icons** (no ⛪ ✝ 📖). The single exception is the ✦ four-pointed-star ornament used purely decoratively on scripture cards.
- **Logo:** a serif wordmark "The Light of Life" + Korean "말씀의빛" set in Noto Serif KR, with a small gold ✦ between them. Provided in SVG. The CTS partner badge sits adjacent in the header as `Official Partner of CTS`.

> **Substitution flag:** if a real CTS partner badge artwork or a licensed Christian-counseling iconography set exists, swap them in and update this section. The current icons are first-pass.

---

## What's missing / asks for the user

1. **No source UI was provided.** This system was generated from the brand brief. If there is an existing site, partner brand guide, or Figma — please attach.
2. **No CTS official partner artwork.** The badge in the header is a typographic placeholder.
3. **Fonts are Google Fonts substitutes.** If licensed Korean serifs (Sandoll, AG, RixSans) are preferred, attach the files and we'll wire them into `fonts/`.
4. **Photography is omitted.** No stock or commissioned photography is included; all imagery is typographic + iconographic.
