# FairPact Design Language — "Paper & Ink"

This document is the reference for anyone building UI in FairPact. If you add a page or
component, follow it. If you need something it does not cover, extend this document in the same
PR so it stays the single source of truth.

**Implementation:** tokens live in `frontend/src/app/globals.css` (CSS variables) and
`frontend/tailwind.config.ts` (semantic Tailwind names). Brand assets live in
`frontend/src/components/brand/logo.tsx`, `frontend/src/app/icon.svg` and
`frontend/src/app/apple-icon.tsx`.

---

## 1. Principles

FairPact helps people read contracts before they sign them. Users often arrive anxious, and
sometimes on a phone in the middle of a negotiation. The interface should feel like a careful
lawyer's desk, not a marketing site.

| Principle     | What it means in practice                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Calm**      | Low-chroma neutrals and one quiet accent. Saturated colour is kept for risk. Motion only orients the user and never decorates.   |
| **Credible**  | Editorial serif headings and generous whitespace. Every claim is tied to a source (court signature, register). No hype, no glow. |
| **Clear**     | One primary action per view. Reading text set at a comfortable measure. Risk shown with colour, icon shape and words.            |
| **Inclusive** | WCAG 2.2 AA is the floor. The UI is safe for colour-vision deficiency, astigmatism, reduced-motion users, keyboard and touch.    |

---

## 2. Research foundations

These are the findings behind the decisions below. Several of them come from practitioner
literature rather than peer-reviewed studies, so the evidence strength is noted where it matters.

1. **Contrast thresholds (WCAG 2.2).**
   - Body text must reach **4.5:1** against its background.
   - Large text (≥24px, or ≥18.66px bold) must reach **3:1**.
   - Meaningful non-text UI must reach **3:1**: input borders, focus rings, icons that carry meaning.
   - Touch targets must be at least **24×24px** at AA, and 44×44px is recommended.
   - APCA (the WCAG 3 draft method) is a useful second opinion, especially in dark mode, but it is
     not yet normative.
   - Sources: [W3C — What's new in WCAG 2.2](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/),
     [WebAIM — Contrast](https://webaim.org/articles/contrast/).
2. **Perceptual colour spaces.** OKLCH changes lightness evenly across hues, which HSL does not.
   That makes it the right space for _generating_ tonal ramps and matching light and dark themes.
   OKLCH lightness does **not** predict WCAG contrast, though, so every pair is still measured
   (see §3.4).
   Sources: [Evil Martians — OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl),
   [UX Collective — OKLCH explained](https://uxdesign.cc/oklch-explained-for-designers-dc6af4433611).
3. **Colour-vision deficiency.**
   - About **8% of men** of European descent (and about 0.4% of women) have red–green
     deficiency. Rates are lower but still substantial in other populations.
   - Meaning must never depend on colour alone (WCAG 1.4.1). Pair colour with shape and text, and
     separate hues by lightness as well.
   - Sources: [Birch 2012, JOSA A (PubMed)](https://pubmed.ncbi.nlm.nih.gov/22472762/).
4. **Dark mode and astigmatism.**
   - Pure white on pure black causes _halation_, where glyphs appear to glow or bleed. A large
     share of people have some astigmatism; estimates vary widely and are mostly secondary.
   - The practical consensus is a dark blue-grey surface rather than `#000`, off-white text rather
     than `#FFF`, and accents desaturated and lightened for dark backgrounds.
   - Sources: [Smashing Magazine — Inclusive dark mode](https://smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/).
5. **Line length.** Body text reads best at roughly **50–75 characters per line**, with 66 as a
   common target. Very long lines (>100ch) clearly tire readers. The evidence for a precise
   optimum is mixed, but the evidence against long lines is solid.
   Sources: [Baymard — Line length](https://baymard.com/blog/line-length-readability),
   [Wikipedia — Line length](https://en.wikipedia.org/wiki/Line_length).
6. **Motion and the vestibular system.** Large or continuous motion can cause nausea and
   dizziness for people with vestibular disorders. Honour `prefers-reduced-motion` by _removing_
   non-essential motion; slowing it down is not enough. Keep micro-interactions short, roughly
   100–300ms.
   Sources: [web.dev — Animation and motion](https://web.dev/learn/accessibility/motion),
   [MDN — prefers-reduced-motion](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

Further physiological background that informs the choices below:

- **Glare in light mode.** Pure white `#FFF` at full screen brightness is the brightest thing in
  most rooms. A warm, slightly dimmed "paper" (`L≈97.5%`) reduces glare while keeping contrast
  well above AA.
- **Warm vs. cool.** Warm neutrals feel like paper and calm the page. The accent is a cool ink
  navy, which reads as trustworthy and stays clearly distinct from the warm risk hues
  (crimson, ochre).
- **Chromostereopsis.** Saturated red and blue placed next to each other appear to sit at
  different depths and "vibrate". FairPact keeps chroma low everywhere except risk colours, and
  never puts saturated red text on saturated blue.

---

## 3. Colour

### 3.1 How tokens work

- Values are **authored in OKLCH** and shipped as **HSL triplets** in CSS variables. This keeps
  Tailwind opacity modifiers working, e.g. `bg-primary/10`.
- Each variable in `globals.css` has its OKLCH source and hex value in a comment.
- **Use semantic names only.** Raw palette classes (`slate-*`, `indigo-*`, `red-*`, `bg-white`,
  `text-white` …) are forbidden in components. Check with:

  ```bash
  grep -rnE "(slate|indigo|rose|emerald|amber|red|green|gray|blue)-[0-9]|bg-white|text-white" frontend/src
  ```

- Dark mode is the `.dark` class (next-themes, default `system`). Never write `dark:` overrides
  for colours. If a colour needs to differ in dark mode, it belongs in a token.

### 3.2 Palette

| Token                 | Role                                         | Light (OKLCH → hex)         | Dark (OKLCH → hex)          |
| --------------------- | -------------------------------------------- | --------------------------- | --------------------------- |
| `background`          | Page                                         | 97.5% 0.006 85 → `#F9F6F2`  | 19.5% 0.012 255 → `#11151A` |
| `card`                | Raised surfaces (cards, panes, inputs)       | 99.3% 0.003 85 → `#FEFDFA`  | 22.8% 0.014 255 → `#181D23` |
| `muted` / `secondary` | Bands, wells, segmented controls             | 94.8% 0.008 80 → `#F1EDE8`  | 27% 0.016 255 → `#21272E`   |
| `accent`              | Hover wash for ghost/outline controls        | 94% 0.014 255 → `#E5ECF5`   | 28.5% 0.025 255 → `#222B36` |
| `foreground`          | Primary text ("ink")                         | 25.5% 0.025 260 → `#1C232F` | 92.5% 0.008 85 → `#E9E6E0`  |
| `muted-foreground`    | Secondary text, captions, eyebrows           | 50% 0.02 260 → `#5D646F`    | 73% 0.015 255 → `#A2A8B1`   |
| `border`              | Decorative dividers and card edges           | 89.5% 0.01 80 → `#E0DCD5`   | 31.5% 0.016 255 → `#2C323A` |
| `input`               | Borders of controls that must be seen (≥3:1) | 64% 0.015 260 → `#878C96`   | 52% 0.02 255 → `#616A75`    |
| `primary`             | Brand / main action ("ink navy")             | 40% 0.085 255 → `#254974`   | 79% 0.075 250 → `#96BFE9`   |
| `primary-foreground`  | Text on primary                              | 98.5% 0.005 85 → `#FCFAF6`  | 20% 0.02 255 → `#10171F`    |
| `ring`                | Focus ring                                   | 50% 0.11 255 → `#3464A0`    | 72% 0.10 250 → `#73A9E1`    |
| `destructive`         | Errors, destructive actions                  | 50% 0.17 25 → `#B02A2D`     | 70% 0.14 25 → `#E97871`     |
| `success`             | Confirmations (admin TP, checks)             | 48% 0.09 155 → `#2C6C47`    | 76% 0.10 155 → `#7BC495`    |

**Accent budget:**

- `primary` is the only brand colour.
- Use it for the main CTA, links, the logo, and selected states.
- Never use it for large background fills; tints of `primary/[0.06–0.10]` are fine.
- One solid primary button per view.

### 3.3 Risk colours

Risk is the one place where saturated colour is allowed. Each level has three tokens and a
**fixed icon and label**.

| Level  | Hue     | Text / stripe (`risk-*`)   | Tint (`risk-*-tint`)  | Border (`risk-*-border`) | Icon (lucide)   | Label   | Highlight underline |
| ------ | ------- | -------------------------- | --------------------- | ------------------------ | --------------- | ------- | ------------------- |
| High   | Crimson | `#A82D2E` / dark `#F38D85` | `#FFECEA` / `#321C1A` | `#F3C4BF` / `#6A3633`    | `AlertOctagon`  | Wysokie | solid               |
| Medium | Ochre   | `#8A5619` / dark `#E3BA74` | `#FCF1DC` / `#2C2213` | `#E9CD9D` / `#604920`    | `AlertTriangle` | Średnie | dashed              |
| Low    | Teal    | `#216970` / dark `#88C7CE` | `#E6F4F6` / `#112729` | `#B3D9DD` / `#225054`    | `Info`          | Niskie  | dotted              |

Rules:

- **Low risk is teal, not green.** Green would read as "safe", which is misleading for a flagged
  clause. It would also be confused with red by deuteranopes.
- Always render risk with `<RiskBadge>`, `<RiskScore>`, `<RiskCounts>` or `riskMeta` from
  `components/ui/risk-badge.tsx`. They carry the icon, label and literal class names.
- **Never build class names with template strings** (`` `risk-${level}` ``). Tailwind cannot see
  them and they get purged. Use `riskMeta[level].badge`, `.highlight`, `.text` or `.dot`.
- Highlights in contract text use the tint as background plus an underline whose _style_ differs
  per level. This means they survive greyscale and every type of CVD.

### 3.4 Measured contrast (WCAG 2.x ratios)

| Pair                            | Light | Dark  | Requirement |
| ------------------------------- | ----- | ----- | ----------- |
| foreground on background        | 14.67 | 14.65 | 4.5         |
| foreground on card              | 15.46 | 13.60 | 4.5         |
| foreground on muted             | 13.55 | 12.07 | 4.5         |
| muted-foreground on background  | 5.58  | 7.65  | 4.5         |
| muted-foreground on card        | 5.88  | 7.10  | 4.5         |
| muted-foreground on muted       | 5.15  | 6.30  | 4.5         |
| primary-foreground on primary   | 8.84  | 9.41  | 4.5         |
| primary (link) on card          | 9.04  | 8.82  | 4.5         |
| input border on card            | 3.30  | 3.08  | 3.0         |
| ring on card                    | 5.90  | 6.88  | 3.0         |
| destructive on card             | 6.42  | 5.97  | 4.5         |
| success on card                 | 6.13  | 8.23  | 4.5         |
| risk-high on risk-high-tint     | 5.97  | 6.81  | 4.5         |
| risk-medium on risk-medium-tint | 5.51  | 8.55  | 4.5         |
| risk-low on risk-low-tint       | 5.63  | 8.28  | 4.5         |

Dark-mode text sits at about 14:1 rather than the maximum 21:1. This is deliberate, to reduce
halation.

`border` is decorative and intentionally low contrast.

`input` reaches 3:1 **only at full strength**. Opacity modifiers dilute it, and the composited
values over `card` are:

| Variant           | Light | Dark | Allowed for                                                                                        |
| ----------------- | ----- | ---- | -------------------------------------------------------------------------------------------------- |
| `border-input`    | 3.30  | 3.08 | **Text inputs, textareas, selects, checkboxes**. Their edge is the only cue.                       |
| `border-input/60` | 1.92  | 1.92 | Outline buttons, the support link. Already identified by their text label (1.4.11 does not apply). |
| `border-input/50` | 1.70  | 1.71 | Dashed drop zone, inactive step markers. Identified by icon and text.                              |
| `border-input/40` | 1.52  | 1.51 | Inactive filter pills, which are labelled.                                                         |

Rule: if a control is recognisable _only_ by its border, use `border-input` with no opacity.

**Changing a colour:** edit the OKLCH value, convert it to sRGB/HSL, and re-measure every pair
above in both modes. Then update `globals.css` and this table in the same PR. A pair below its
requirement does not ship.

---

## 4. Typography

| Role                        | Family                            | Notes                                                                                  |
| --------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| Display & headings (h1, h2) | **Source Serif 4** (`font-serif`) | Optical-size axis enabled. Weight 600. Slight negative tracking. `text-wrap: balance`. |
| Contract text (reader)      | **Source Serif 4**                | 16px / 1.75 line height, max `68ch` (`max-w-prose`).                                   |
| UI, body, h3–h5             | **Inter** (`font-sans`)           | High x-height for small sizes; tabular figures available.                              |

- Both fonts load through `next/font/google` with `latin-ext`. Polish diacritics
  (ą ć ę ł ń ó ś ź ż) are mandatory, so never drop the subset.
- h1/h2 are serif by default (base layer). h3–h5 are sans semibold. Card titles are serif.

**Scale** (1.25 ratio, base 16px):

| Token / class     | Size    | Use                                                          |
| ----------------- | ------- | ------------------------------------------------------------ |
| `text-xs`         | 12px    | Meta, badges, eyebrows (uppercase, +0.08em)                  |
| `text-sm`         | 14px    | Secondary UI, captions, dense lists                          |
| `text-base`       | 16px    | Body, contract text, inputs (never smaller on mobile inputs) |
| `text-lg`         | 18px    | Lead paragraphs, h3                                          |
| `text-xl`/`2xl`   | 20/24px | Card titles, page titles on mobile                           |
| `text-display-sm` | 32px    | Section headings (h2)                                        |
| `text-display-md` | 40px    | Section headings on desktop, page h1                         |
| `text-display-lg` | 50px    | Home hero (60px on `lg`)                                     |

Rules:

- Body copy uses `max-w-prose` (68ch). Never run paragraph text across a full desktop container.
- Numbers that update or are compared use `tabular-nums`.
- The `.eyebrow` utility is the only uppercase style. Do not uppercase headings or buttons.
- Emphasis is weight 500 in `text-foreground`, or the serif _italic_ in headlines (sparingly,
  once per page). No gradient text.

---

## 5. Layout, spacing & elevation

- **Grid:** 4px base unit. Spacing comes from the Tailwind scale (1 = 4px), mostly in steps of
  8px. Section rhythm is `py-20 md:py-28`. Card padding is `p-5 sm:p-6`.
- **Container:** max 1280px. Gutters are 16px on mobile, 24px from `sm` and 32px from `lg`. No
  page may scroll horizontally at 375px.
- **Breakpoints:** mobile-first. Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).
  Side-by-side analysis starts at `md`; below that it is a tabbed view.
- **Viewport-relative heights** use `dvh`, not `vh`, so mobile browser chrome doesn't clip panes.
- **Radius:** `--radius` is 10px.
  - `rounded-xl` (14px): cards and panes
  - `rounded-lg` (10px): wells and drop zones
  - `rounded-md` (8px): buttons and inputs
  - `rounded-full`: pills, badges, filter chips
- **Elevation:**
  - Light mode uses soft, ink-tinted shadows: `shadow-xs` (resting card), `shadow-md`
    (hover/selected), `shadow-lg` (one hero object per page).
  - Dark mode relies on _lighter surfaces_ (`background` → `card` → `muted`), because shadows are
    nearly invisible on dark backgrounds.
  - Never stack more than two elevation levels.
- **Separation:** prefer hairline borders and spacing over boxes inside boxes. Use
  `divide-y`/`divide-x` for grouped stats.

---

## 6. Components

| Component            | Rules                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**           | Variants `default` (primary), `outline`, `secondary`, `ghost`, `link`, `destructive`. Heights 36 / 40 / 48px. Icon gap 8px. Trailing arrow nudges 2px on hover; nothing scales. Loading state shows a spinner plus `loadingText`. |
| **Link as button**   | Never nest `<button>` inside `<a>`. Use `<Link className={buttonVariants({...})}>`.                                                                                                                                               |
| **Card**             | `Card` / `AnimatedCard`: `rounded-xl border bg-card shadow-xs`. Add `interactive` only when the whole card is clickable.                                                                                                          |
| **Inputs**           | Height 40px, `border-input` (full strength, see §3.4), `bg-card`, and a visible label above (placeholders are not labels). 16px text on mobile so iOS doesn't zoom.                                                               |
| **Focus**            | Global `:focus-visible` gives a 2px `ring` outline with 2px offset. Never remove it without a visible replacement.                                                                                                                |
| **Risk badge**       | Pill with tint, border, icon and label (see §3.3).                                                                                                                                                                                |
| **Clause card**      | 4px left stripe in the level colour, badge, confidence % (`tabular-nums`) and serif excerpt. Expanded details use `eyebrow` section labels.                                                                                       |
| **Filters / tabs**   | Pills (`rounded-full`, `h-8`) with `aria-pressed`, or a segmented control with `role="tablist"` / `aria-selected`.                                                                                                                |
| **FAQ / disclosure** | Native `<details>/<summary>`, with a chevron that rotates 180°.                                                                                                                                                                   |
| **Status messages**  | `role="status"` + `aria-live="polite"` for progress. `role="alert"` for errors.                                                                                                                                                   |

### Icons

- Use [lucide-react](https://lucide.dev) only.
- 16px inline with text and 20px in icon tiles. Use stroke width 1.75 in tiles and the default
  of 2 inline.
- Decorative icons get `aria-hidden`. Icon-only buttons need an `aria-label`.
- Icon tiles (`IconContainer`) are `primary/[0.08]` on a 40px rounded-lg square. Do not use
  colourful multi-hue icon sets.

---

## 7. Motion

Motion exists to **orient**: content arriving, a panel expanding, a selection moving. It never
decorates.

| Use                      | Duration                           | Easing                                  |
| ------------------------ | ---------------------------------- | --------------------------------------- |
| Hover / colour change    | 120–180ms (`duration-fast`/`base`) | `ease-calm` `cubic-bezier(.22,1,.36,1)` |
| Expand / collapse        | 220ms                              | `ease-calm`                             |
| Content reveal on scroll | 400–500ms, ≤12px travel, once      | `ease-calm`                             |

Forbidden:

- Infinite or looping animations, except a spinner while work is in progress.
- Bounce, shake, rotate or "pulse" on icons.
- Scaling cards, buttons or logos on hover.
- Parallax, and animated gradients or blobs.

Reduced motion is handled in two places:

- `MotionConfig reducedMotion="user"` in `Providers` covers Framer Motion.
- A global `prefers-reduced-motion` rule in `globals.css` covers CSS transitions and animations.
  Smooth scrolling is only enabled when the user has no motion preference.

---

## 8. Logo & favicon

- **Concept:** a contract page (the _pact_) carrying an equals sign (the _fair_). It is
  geometric and drawn on a 32-unit grid with 2-unit strokes, so it reads at 16px.
- **Mark:** `<LogoMark>` uses `currentColor` and normally appears as `text-primary`.
  **Lockup:** `<Logo>` is the mark plus "FairPact" in Source Serif 4 semibold.
- **Favicon:** `src/app/icon.svg` is a filled navy tile with a paper page and navy bars. It has
  its own background, so it works on light and dark browser chrome (Safari ignores
  `prefers-color-scheme` inside SVG favicons).
- **Apple touch icon:** `src/app/apple-icon.tsx` (180×180 PNG, generated at request time on the
  edge runtime).
- **Theme colour:** set in `layout.tsx` → `viewport.themeColor` and matches `background` in
  each mode.
- **Clear space:** at least the width of the page fold (≈¼ of the mark) on every side.
  Minimum size 16px.
- **Don't:**
  - recolour the mark outside `primary` or `foreground`
  - add gradients or shadows
  - rotate it, or animate it on hover
  - put it on a busy background

---

## 9. Voice (UI copy)

- Polish, second person ("Prześlij", "Sprawdź"), calm and factual.
- Prefer "zapisy do wyjaśnienia" over alarmist wording. Risk labels are _Wysokie / Średnie /
  Niskie_.
- Every results view carries the disclaimer: the tool is informational and is not legal advice.
- Use typographic characters: the ellipsis "…", the en dash "–" for ranges, and a thin or normal
  space as the thousands separator (`toLocaleString("pl-PL")`).

---

## 10. Pre-merge checklist

- [ ] No raw palette classes (`grep` from §3.1 is empty).
- [ ] No `dark:` colour overrides; new colours added as tokens, measured, and documented in §3.
- [ ] Risk shown with colour **and** icon **and** label.
- [ ] Every interactive element is reachable by keyboard with a visible focus ring. Icon buttons
      have `aria-label`.
- [ ] Touch targets: 40px tall for primary controls (buttons, inputs, tabs). Secondary controls
      (filter pills, expand toggles) may be 32px. Never below WCAG 2.2's 24px minimum.
- [ ] Text inputs use full-strength `border-input` (no opacity modifier).
- [ ] Saturated colour only for risk/status. Brand and decorative icons use `primary` or
      `muted-foreground`.
- [ ] Checked at 375px and ≥1280px, in light **and** dark mode. No horizontal scroll.
- [ ] Body text ≤ 68ch per line.
- [ ] No looping or decorative motion. Tested with "reduce motion" enabled.
- [ ] `npm run lint`, `npm run type-check`, `npm run build` and `npx prettier --check` pass.
