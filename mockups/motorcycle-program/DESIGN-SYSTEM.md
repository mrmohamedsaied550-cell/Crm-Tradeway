# Trade Way — Motorcycle Ownership Program
## Design system specification — direction: "Trust & Utility"

Scope: the single-page RTL prototype at `mockups/motorcycle-program/index.html` (applicant site ×8, admin console ×7, distribution portal ×2, plus prototype chrome). Every hex below is final. Copy them verbatim.

---

## 0. The one-paragraph rationale

Three greens are now fixed by the brand asset: `#62AE46` (leaf), `#528D41` (shadow stripes), and black wordmark. `#62AE46` is yellow-leaning (H104) and light (L48%) — it has no weight of its own, so everything around it has to supply the weight. That drives three decisions: **neutrals lean cool, not warm** (a warm ground sits in the green's own hue neighbourhood and drags it to olive; a faintly blue-grey paper is near-opposite on the wheel, so the green reads clean while the ground still reads as paper); **the accent is a deep indigo** (H228, 125° from the mark — far enough not to vibrate, dark enough that the light green never has to compete with it); and **warm is reserved entirely for the prototype chrome**, the one surface in the build that must not read as product. The rejected version's failure was a green-tinted grey under a mid-green accent — every surface in the same hue family as the logo, so nothing had anywhere to stand. This system puts zero green in the UI chrome and lets the mark be the only green object on the page.

---

## 1. Palette

### 1.1 Hue bias, stated

| Family | Hue | Sat | Why |
|---|---|---|---|
| Light neutrals | ~228° (blue) | 6–22% | Near-opposite the logo's H104, so the mark stays saturated; also the exact inverse of the rejected green-tinted grey. |
| Dark neutrals | ~222° (blue) | 20–30% | Same axis as light, so the two themes are one system; reads as ink, not as soot. |
| Accent | 228.5° | 49% | Same hue as the neutrals, pushed to full chroma — the accent is the neutral turned up, which is why it never looks bolted on. |
| Prototype chrome | 26° (warm graphite) | 9% | The only warm family. Warmth = scaffolding, by rule. |
| Positive | 167° (emerald-teal) | 75% | Deliberately **not** derived from the logo green — see §1.5. |

No pure grey (`#808080`, `#F5F5F5`, `#111111`) appears anywhere.

### 1.2 The token block

```css
:root{
  /* ---- neutral ground ---- */
  --ground:            #F1F2F6;
  --surface:           #FFFFFF;
  --surface-sunken:    #E4E6EC;
  --hairline:          #DDDFE6;
  --border-strong:     #868C9A;

  /* ---- text ---- */
  --text:              #14171F;
  --text-2:            #4B5160;
  --text-3:            #666C7B;   /* also the placeholder colour */
  --text-disabled:     #9AA0AD;   /* disabled controls only — WCAG-exempt */

  /* ---- accent (deep indigo) ---- */
  --accent:            #26346F;
  --accent-hover:      #1A2553;
  --accent-subtle:     #E6E9F4;
  --accent-border:     #9FABD0;   /* decorative edge on subtle fills */
  --accent-edge:       #26346F;   /* state-carrying edge (selected, focus) */
  --accent-ink:        #22306A;   /* text on --accent-subtle */
  --on-accent:         #FFFFFF;

  /* ---- semantic: positive ---- */
  --pos-fill:          #DFEEE9;
  --pos-border:        #94C3B6;
  --pos-edge:          #3A8974;
  --pos-ink:           #0E6250;

  /* ---- semantic: attention ---- */
  --att-fill:          #F9EEDB;
  --att-border:        #D6B375;
  --att-edge:          #A3762A;
  --att-ink:           #7A5214;

  /* ---- semantic: critical ---- */
  --crit-fill:         #FBE7E3;
  --crit-border:       #E3A79B;
  --crit-edge:         #C25243;
  --crit-ink:          #9E2E20;

  /* ---- semantic: informational ---- */
  --info-fill:         #E1EDF6;
  --info-border:       #98B9D4;
  --info-edge:         #3A80AE;
  --info-ink:          #1A5A88;

  /* ---- brand greens: logo artwork ONLY, identical in both themes ---- */
  --brand-green:       #62AE46;
  --brand-green-deep:  #528D41;

  /* ---- prototype chrome (warm graphite — scaffolding, not product) ---- */
  --chrome:            #2B2724;
  --chrome-raised:     #38332F;
  --chrome-line:       #4A443E;
  --chrome-text:       #EEE9E2;
  --chrome-dim:        #A79F95;
  --chrome-sel:        #EAE4D9;
  --chrome-sel-ink:    #241F1C;

  /* ---- admin sidebar (cool indigo ink) ---- */
  --side:              #151B2B;
  --side-raised:       #202940;
  --side-line:         #2D3648;
  --side-text:         #E5E8F0;
  --side-dim:          #98A1B7;
  --side-rail:         #8AA6E8;

  /* ---- table zebra ---- */
  --row-alt:           #F7F8FA;

  /* ---- radii ---- */
  --r-xs: 6px; --r-sm: 10px; --r-md: 14px; --r-lg: 20px;
  --r-pill: 999px; --r-device: 36px;

  /* ---- elevation (four users only — see §4.3) ---- */
  --shadow-sticky:  0 -1px 0 var(--hairline), 0 -14px 28px -22px rgba(20,23,31,.30);
  --shadow-overlay: 0 2px 6px rgba(20,23,31,.08), 0 26px 52px -26px rgba(20,23,31,.38);
  --shadow-device:  0 4px 10px rgba(20,23,31,.06), 0 40px 72px -36px rgba(20,23,31,.45);
}

@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --ground:            #0F1219;
    --surface:           #161A23;
    --surface-sunken:    #0A0D13;
    --hairline:          #252B37;
    --border-strong:     #646C82;

    --text:              #E6E9F0;
    --text-2:            #A4AAB9;
    --text-3:            #868D9E;
    --text-disabled:     #6B7285;

    --accent:            #8FA8E8;
    --accent-hover:      #A9BEF2;
    --accent-subtle:     #1A2340;
    --accent-border:     #414F80;
    --accent-edge:       #5E76B8;
    --accent-ink:        #B8C8F3;
    --on-accent:         #0B0F1C;

    --pos-fill:          #10271F;  --pos-border:  #2F5E4E;
    --pos-edge:          #3E8A73;  --pos-ink:     #63C4A6;

    --att-fill:          #2A2113;  --att-border:  #6B5427;
    --att-edge:          #96762F;  --att-ink:     #E0AE5C;

    --crit-fill:         #2D1613;  --crit-border: #7A3A31;
    --crit-edge:         #A75246;  --crit-ink:    #F08A7A;

    --info-fill:         #0F2130;  --info-border: #2B5070;
    --info-edge:         #3B759C;  --info-ink:    #74B4DE;

    --brand-green:       #62AE46;  /* unchanged, by brand rule */
    --brand-green-deep:  #528D41;  /* unchanged, by brand rule */

    --chrome:            #1B1815;
    --chrome-raised:     #262220;
    --chrome-line:       #3A3530;
    --chrome-text:       #EEE9E2;
    --chrome-dim:        #9D958B;
    --chrome-sel:        #DBD4C7;
    --chrome-sel-ink:    #1B1815;

    --side:              #0B0F1A;
    --side-raised:       #151C2C;
    --side-line:         #222A3B;
    --side-text:         #E5E8F0;
    --side-dim:          #8E97AD;
    --side-rail:         #8FA8E8;

    --row-alt:           #1A1F29;

    --shadow-sticky:  0 -1px 0 var(--hairline), 0 -14px 28px -20px rgba(0,0,0,.65);
    --shadow-overlay: 0 2px 6px rgba(0,0,0,.50), 0 26px 52px -24px rgba(0,0,0,.75);
    --shadow-device:  0 4px 10px rgba(0,0,0,.45), 0 40px 72px -34px rgba(0,0,0,.80);
  }
}

:root[data-theme="dark"]{
  --ground:            #0F1219;
  --surface:           #161A23;
  --surface-sunken:    #0A0D13;
  --hairline:          #252B37;
  --border-strong:     #646C82;

  --text:              #E6E9F0;
  --text-2:            #A4AAB9;
  --text-3:            #868D9E;
  --text-disabled:     #6B7285;

  --accent:            #8FA8E8;
  --accent-hover:      #A9BEF2;
  --accent-subtle:     #1A2340;
  --accent-border:     #414F80;
  --accent-edge:       #5E76B8;
  --accent-ink:        #B8C8F3;
  --on-accent:         #0B0F1C;

  --pos-fill:          #10271F;  --pos-border:  #2F5E4E;
  --pos-edge:          #3E8A73;  --pos-ink:     #63C4A6;

  --att-fill:          #2A2113;  --att-border:  #6B5427;
  --att-edge:          #96762F;  --att-ink:     #E0AE5C;

  --crit-fill:         #2D1613;  --crit-border: #7A3A31;
  --crit-edge:         #A75246;  --crit-ink:    #F08A7A;

  --info-fill:         #0F2130;  --info-border: #2B5070;
  --info-edge:         #3B759C;  --info-ink:    #74B4DE;

  --brand-green:       #62AE46;
  --brand-green-deep:  #528D41;

  --chrome:            #1B1815;
  --chrome-raised:     #262220;
  --chrome-line:       #3A3530;
  --chrome-text:       #EEE9E2;
  --chrome-dim:        #9D958B;
  --chrome-sel:        #DBD4C7;
  --chrome-sel-ink:    #1B1815;

  --side:              #0B0F1A;
  --side-raised:       #151C2C;
  --side-line:         #222A3B;
  --side-text:         #E5E8F0;
  --side-dim:          #8E97AD;
  --side-rail:         #8FA8E8;

  --row-alt:           #1A1F29;

  --shadow-sticky:  0 -1px 0 var(--hairline), 0 -14px 28px -20px rgba(0,0,0,.65);
  --shadow-overlay: 0 2px 6px rgba(0,0,0,.50), 0 26px 52px -24px rgba(0,0,0,.75);
  --shadow-device:  0 4px 10px rgba(0,0,0,.45), 0 40px 72px -34px rgba(0,0,0,.80);
}
```

Every token is declared in the bare `:root` before either override block. `body { background: var(--ground); color: var(--text); }` — explicit, never transparent. Radii and shadows are declared once, in `:root` only (the dark blocks redefine the shadows because the rgba base changes; the radii do not).

### 1.3 Contrast — measured, both themes

Body text target ≥ 4.5:1. Large text (≥ 18.66px @600, or ≥ 24px) and non-text indicators target ≥ 3:1.

**Light**

| Pair | Ratio | Passes |
|---|---|---|
| `--text` on `--ground` | 16.02 | body |
| `--text` on `--surface` | 17.92 | body |
| `--text-2` on `--ground` | 7.10 | body |
| `--text-2` on `--surface` | 7.94 | body |
| `--text-3` on `--ground` | 4.70 | body |
| `--text-3` on `--surface` | 5.26 | body |
| `--text-3` on `--surface-sunken` | 4.21 | large / captions ≥ 13px @600 only |
| `--accent` on `--surface` | 11.65 | body |
| `--accent` on `--ground` | 10.41 | body |
| `--on-accent` on `--accent` | 11.65 | body |
| `--on-accent` on `--accent-hover` | 14.65 | body |
| `--accent-ink` on `--accent-subtle` | 10.20 | body |
| `--border-strong` on `--surface` | 3.37 | indicator |
| `--border-strong` on `--ground` | 3.01 | indicator |
| `--accent-edge` on `--surface` | 11.65 | indicator |
| `--pos-ink` on `--pos-fill` | 6.09 | body |
| `--pos-ink` on `--surface` | 7.29 | body |
| `--pos-edge` on `--surface` | 4.19 | indicator |
| `--att-ink` on `--att-fill` | 6.00 | body |
| `--att-ink` on `--surface` | 6.90 | body |
| `--att-edge` on `--surface` | 4.05 | indicator |
| `--crit-ink` on `--crit-fill` | 6.16 | body |
| `--crit-ink` on `--surface` | 7.33 | body |
| `--crit-edge` on `--surface` | 4.58 | indicator |
| `--info-ink` on `--info-fill` | 6.17 | body |
| `--info-ink` on `--surface` | 7.34 | body |
| `--info-edge` on `--surface` | 4.30 | indicator |
| `--text` on `--row-alt` | 16.86 | body |
| `--text-3` on table-header `#F4F5F8` | 4.82 | body |
| `--chrome-text` on `--chrome` | 12.26 | body |
| `--chrome-dim` on `--chrome` | 5.67 | body |
| `--chrome-dim` on `--chrome-raised` | 4.78 | body |
| `--chrome-sel-ink` on `--chrome-sel` | 12.89 | body |
| `--side-text` on `--side` | 14.00 | body |
| `--side-dim` on `--side` | 6.63 | body |
| `--side-text` on `--side-raised` | 11.79 | body |
| `--side-rail` on `--side` | 7.11 | indicator |

**Dark**

| Pair | Ratio | Passes |
|---|---|---|
| `--text` on `--ground` | 15.42 | body |
| `--text` on `--surface` | 14.33 | body |
| `--text-2` on `--ground` | 8.06 | body |
| `--text-2` on `--surface` | 7.49 | body |
| `--text-3` on `--ground` | 5.64 | body |
| `--text-3` on `--surface` | 5.24 | body |
| `--text-3` on `--surface-sunken` | 5.85 | body |
| `--accent` on `--ground` | 7.97 | body |
| `--accent` on `--surface` | 7.41 | body |
| `--on-accent` on `--accent` | 8.13 | body |
| `--on-accent` on `--accent-hover` | 10.31 | body |
| `--accent-ink` on `--accent-subtle` | 9.27 | body |
| `--border-strong` on `--surface` | 3.32 | indicator |
| `--border-strong` on `--ground` | 3.58 | indicator |
| `--accent-edge` on `--surface` | 3.95 | indicator |
| `--pos-ink` on `--pos-fill` | 7.49 | body |
| `--pos-ink` on `--surface` | 8.27 | body |
| `--pos-edge` on `--surface` | 4.22 | indicator |
| `--att-ink` on `--att-fill` | 7.83 | body |
| `--att-ink` on `--surface` | 8.60 | body |
| `--att-edge` on `--surface` | 4.09 | indicator |
| `--crit-ink` on `--crit-fill` | 6.98 | body |
| `--crit-ink` on `--surface` | 7.15 | body |
| `--crit-edge` on `--surface` | 3.27 | indicator |
| `--info-ink` on `--info-fill` | 7.28 | body |
| `--info-ink` on `--surface` | 7.73 | body |
| `--info-edge` on `--surface` | 3.49 | indicator |
| `--text` on `--row-alt` | 13.58 | body |
| `--text-3` on table-header `#1B2029` | 4.92 | body |
| `--chrome-text` on `--chrome` | 14.64 | body |
| `--chrome-dim` on `--chrome` | 5.98 | body |
| `--chrome-sel-ink` on `--chrome-sel` | 12.00 | body |
| `--side-text` on `--side` | 15.61 | body |
| `--side-dim` on `--side` | 6.54 | body |

**Logo greens on every ground they are allowed to touch** (logotypes are exempt from WCAG 1.4.3 / 1.4.11; listed for completeness and to justify the light-ground edge rule in §2.5):

| Pair | Ratio |
|---|---|
| `#62AE46` on `#FFFFFF` | 2.74 |
| `#62AE46` on `#F1F2F6` | 2.45 |
| `#62AE46` on `--chrome #2B2724` | 5.40 |
| `#62AE46` on `--side #151B2B` | 6.26 |
| `#62AE46` on dark `--ground #0F1219` | 6.84 |
| `#62AE46` on dark `--surface #161A23` | 6.35 |
| `#528D41` on `#FFFFFF` | 4.00 |
| `#528D41` on dark `--ground` | 4.68 |

**Explicitly decorative, not indicators** (they never carry state on their own; the tone is always also carried by an ink-coloured icon and an Arabic word): `--hairline` (1.33 light / 1.23 dark on surface), `--chrome-line` (1.54), `--side-line` (1.42), and the four `--*-border` fill edges (1.96–2.42). Any border that *is* the only signal of state — a selected option card, an invalid input, a focus ring — uses the matching `--*-edge` or `--accent-edge` token, all of which clear 3:1.

`--text-disabled` at 2.10 on `--surface-sunken` is intentional and exempt: it appears only on `disabled` controls.

### 1.4 What may use which

- `--accent` appears on: primary buttons, links, the selected tab underline, the active stepper bar, the focus ring, the admin sidebar rail, the selected option-card edge. **Nowhere else.** If a screen looks like it needs more indigo, it needs better hierarchy instead.
- The four semantic families appear on: status pills, notices, table status cells, compliance meters, timeline dots. They are never used as decoration and never as a button fill except `--crit-*` for the destructive button.
- `--brand-green` / `--brand-green-deep` appear **only inside the logo SVG**. No pill, meter, chart, button, icon or border may use them.

### 1.5 Positive vs. the logo green — the deliberate split

**Chosen: distinguish, not derive.** `--pos-ink #0E6250` is H167 / S75% / L22%. The logo green is H104 / S43% / L48%. That is 63° of hue, 32 points of saturation and 26 points of lightness apart — emerald-teal versus leaf. A "تم التسليم" pill will never read as a piece of the logo that fell off, which is the exact failure mode a derived green (something like `#4E9B3A`) would produce every time a success pill lands in the same row as the header lockup. The two never meet as near-twins because the logo green is the only leaf green on the page.

---

## 2. How the green logo coexists

### 2.1 The asset, fixed

| Part | Value |
|---|---|
| Diamond fill | `#62AE46` |
| Monogram T/W inside the diamond | `#FFFFFF` |
| Five bright motion stripes | `#62AE46` |
| Three shadow motion stripes | `#528D41` |
| Two-line wordmark TRADE / WAY | `currentColor` |

The greens are absolute in both themes. Never re-tint, never lighten for dark mode, never apply `opacity`, never put a white or coloured plate behind the mark.

### 2.2 The wordmark's `currentColor` in each slot

| Slot | Set `color:` to | Ratio |
|---|---|---|
| Applicant header, light | `var(--text)` `#14171F` | 17.92 |
| Applicant header, dark | `var(--text)` `#E6E9F0` | 14.33 |
| Prototype chrome bar (both themes) | `var(--chrome-text)` `#EEE9E2` | 12.26 / 14.64 |
| Admin sidebar (both themes) | `var(--side-text)` `#E5E8F0` | 14.00 / 15.61 |
| Contract / document preview | `var(--text)` | 17.92 |

The `<svg>` root carries `color: …` and the wordmark paths use `fill="currentColor"`; the greens stay hard-coded in the path fills so they survive every theme.

### 2.3 Clear space

Let **D** = the rendered height of the diamond.

- Clear space on all four sides = **0.5 × D, minimum 12px**.
- Nothing enters it: not the Uber lockup, not a pill, not a divider, not a border, not the accent, not a container edge.
- The Uber co-brand sits **outside** the clear space, separated by a 1px `--hairline` vertical rule with 12px inline padding on each side. Its wordmark takes `var(--text)`. The two marks never sit on a shared coloured fill.

### 2.4 Minimum sizes and which asset goes where

| Context | Asset | Size |
|---|---|---|
| Full lockup (stripes + diamond + wordmark) | complete SVG | **min 28px overall height** (D = 24px). Below that the eight 2px stripes alias into a smear on a 1× 720p Android screen. |
| Applicant header, 28–34px slot | **Diamond only.** No stripes, no wordmark. | D = 30px, `--r-xs` optical corner rounding on the diamond tips |
| Admin sidebar header | Diamond only + Arabic name as live text | D = 26px |
| Prototype chrome bar | Diamond only + live text `تريد واي` | D = 22px |
| Favicon / app icon, 32px | Diamond only, monogram redrawn at ≥ 2px stroke | 32 × 32 |
| Favicon, 16px | Solid `#62AE46` diamond with a single white counter; **drop the monogram entirely** | 16 × 16 |

So: **yes, the diamond alone is the right asset for the 28–34px header slot and for the favicon.** The stripes are a horizontal-motion device that needs ≥ 40px of lockup height to read as motion rather than as noise, and at favicon sizes they merge into a green block. Next to the diamond, the company name is always **live text** (Cairo 600, `--text`), never a rasterised wordmark — it stays legible at any zoom and takes the theme colour for free.

(The Artifact `icon` publish parameter is a generic word such as `motorcycle` — it is not the brand mark and is unrelated to this.)

### 2.5 What the green needs beside it

`#62AE46` is light and yellow-leaning, so it washes out against anything that is itself warm, light, or green-adjacent. The rules:

- **Allowed grounds:** `--surface`, `--ground`, `--chrome`, `--side`, and their dark counterparts. That is the complete list.
- **Forbidden grounds:** any warm cream or sand; any tinted-green surface; any mid-tone grey between L35% and L65% (the diamond disappears into it); any gradient.
- **Light-ground edge rule:** on `--surface` (2.74) and `--ground` (2.45) the diamond gets a **1px inner stroke of `#528D41`** to hold its silhouette. On `--chrome` (5.40), `--side` (6.26) and dark `--ground` (6.84) no stroke — the green already carries.
- **May the accent touch it? No.** `--accent #26346F` never enters the clear space and never fills the area directly behind or adjacent to the mark. At close range, H104 against H228 at these saturations produces a hard complementary edge that makes the green look acid — the opposite of "official". Keep a neutral between them; the header's own `--surface` does that job.
- **On the dark chrome bar:** greens unchanged, wordmark `--chrome-text`, no stroke, no plate. Do **not** reach for the classic bad fix of a white rounded chip behind the logo — the warm graphite is dark enough that the leaf green reads at 5.40:1, better than it does on white.

---

## 3. Type

### 3.1 The three faces

| Role | Face | Arabic coverage | Why |
|---|---|---|---|
| Display | **Noto Kufi Arabic** 600 / 700 | Yes — a Kufi Arabic design, Latin included | Squared, flat-terminal, institutional. It is the letterform of Egyptian government signage and official notices, which is precisely the register a captain needs to believe the contract. Used for six or seven words per screen, never for running text. |
| UI / body | **Cairo** 400 / 500 / 600 / 700 | Yes — Arabic-first, full Latin | The most robustly hinted Arabic screen face on Google Fonts, with a large x-height equivalent and open counters: it survives a cheap 720p LCD in direct sun, which is the actual reading condition. Continuous 200–1000 weight axis gives real 500 and 600, which Almarai and Tajawal do not have. |
| Figures / IDs | **IBM Plex Sans Arabic** 400 / 500 / 600 | Yes — Arabic + Latin + **Arabic-Indic digits** | The one candidate whose Latin *and* Arabic-Indic digits are even-width, with unambiguous `0/O`, `1/l`, and clearly distinct `١`/`٧`. Plate numbers, chassis codes and national IDs get read aloud over the phone at a showroom counter, so digit ambiguity is a real operational cost. Retained from the previous build **strictly** in this narrow role. |

Rubik, Inter and Space Grotesk are out — no Arabic coverage, and the last two are the default AI-design faces.

### 3.2 The `<link>`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Noto+Kufi+Arabic:wght@600;700&display=swap">
```

Fallback stacks, always declared:

```css
--font-display: "Noto Kufi Arabic", "Segoe UI", Tahoma, system-ui, sans-serif;
--font-ui:      "Cairo", "Segoe UI", Tahoma, system-ui, sans-serif;
--font-figure:  "IBM Plex Sans Arabic", "Segoe UI", Tahoma, ui-monospace, monospace;
```

### 3.3 The scale — seven steps

| # | Token | px | line-height | weight | face | Used for |
|---|---|---|---|---|---|---|
| 1 | `--t-d1` | 28 | 1.40 | 700 | display | The applicant hero headline. **One per screen, and only on the program page and the acceptance screen.** |
| 2 | `--t-d2` | 22 | 1.45 | 700 | display | Screen titles: verification, each form step's title, admin page title, sheet title, portal queue title. |
| 3 | `--t-t1` | 18 | 1.55 | 600 | ui | Card titles and section headings inside a screen. |
| 4 | `--t-t2` | 16 | 1.60 | 600 | ui | Sub-headings, admin top-bar title, option-card label, notice title, modal body heading. |
| 5 | `--t-b1` | 15 | 1.75 | 400 | ui | Applicant body copy. Max measure **38 Arabic characters** per line (Arabic runs ~1.7× denser than Latin, so 65 Latin characters ≈ 38 Arabic). |
| 6 | `--t-b2` | 13 | 1.70 | 400 | ui | Admin and portal body, table cells, helper text, timeline descriptions, secondary copy. Weight 500 when it is a table cell's primary value. |
| 7 | `--t-c1` | 11.5 | 1.55 | 600 | ui | Eyebrows, table column headers, pill labels, field hints, chrome tab labels. |

Figure sizes (face: `--font-figure`, `font-variant-numeric: tabular-nums`):

- `--t-fig-l` — 22px / 1.20 / 600 — metric-tile values, OTP boxes (28px there), the big program numbers in the fact grid.
- `--t-fig-s` — 13px / 1.50 / 500 — IDs, plates, chassis, timestamps, amounts inside tables.

`h1`–`h4` get `text-wrap: balance`. Body copy gets `text-wrap: pretty`.

### 3.4 Letter-spacing — the Arabic rule

```css
:root, body, h1, h2, h3, h4, p, td, th, label, button, input, select {
  letter-spacing: 0;          /* non-negotiable for Arabic */
}
```

**Arabic is never letter-spaced. Not positive, not negative, not on headings, not on eyebrows, not "just a little".** Arabic is cursive; tracking breaks the joins between letters, and on Android's Arabic shaping it frequently renders as visibly disconnected glyphs — to a low-trust reader that looks like a broken or fake document. Note this also kills the usual trick of letter-spacing the `--t-c1` eyebrow: Arabic eyebrows are differentiated by **colour (`--text-3`), weight (600) and size (11.5px)** only.

The single exception, Latin uppercase labels — `UBER`, `VIN`, `KYC`, `CSV`, `OTP`, `PDF`, plate prefixes:

```css
.lat-caps{
  direction: ltr;
  unicode-bidi: isolate;
  font-family: var(--font-figure);
  text-transform: uppercase;
  letter-spacing: .07em;
  font-weight: 600;
  font-size: 11.5px;
}
```

`unicode-bidi: isolate` is mandatory — without it a Latin acronym at the end of an Arabic sentence drags adjacent punctuation to the wrong side.

### 3.5 Numerals — the mixed-script rule

The page genuinely contains both systems, so the rule is by **role**, not by preference:

**Arabic-Indic (`٠١٢٣٤٥٦٧٨٩`)** — everything the captain reads as language:
- the operating matrix: `٨ ساعات أونلاين`, `٢٦ يوم في الشهر`, `٦٠٪ قبول`, `٢٪ إلغاء`
- step counters: `الخطوة ٣ من ٥`
- counts, durations, ordinals, program term in months
- the percent sign is the Arabic `٪` (U+066A) and the separator is the Arabic comma `،`

**Latin (`0123456789`)** — everything that is a code, a record, or an operator's working data:
- phone numbers, national ID, application reference
- plate number, chassis/VIN, engine number (these are **stamped in Latin on the physical motorcycle** — showing them in Arabic-Indic makes them uncheckable against the vehicle, which is a correctness bug, not a style choice)
- amounts in EGP, timestamps, dates in the admin and portal
- **every digit in the admin console, the distribution portal, and the prototype chrome, without exception** — ops staff scan and sort these, and mixed digit systems destroy column scanning

**Never mix the two systems inside one text run.** If captain-facing copy has to quote a plate, the plate is wrapped and the surrounding numbers stay Arabic-Indic:

```html
<p>موتوسيكلك رقم <span class="lat">ن ط ر 4821</span> جاهز خلال ٣ أيام.</p>
```

```css
.lat{
  direction: ltr;
  unicode-bidi: isolate;
  font-family: var(--font-figure);
  font-variant-numeric: tabular-nums;
}
.fig{                                  /* Arabic-Indic figures that align in a column */
  font-family: var(--font-figure);
  font-variant-numeric: tabular-nums;
}
```

Write the actual codepoints. Do **not** try to switch digit systems with `font-feature-settings` or a `lang` attribute — support is inconsistent across the Android WebViews this prototype is shown on, and a silent failure here shows a captain the wrong-looking number. `tabular-nums` applies to IBM Plex Sans Arabic's Arabic-Indic digits as well as its Latin ones, so both column types align.

---

## 4. Surface and elevation

### 4.1 When something is a card, a block, a table, or a rule

| Form | Use it when | Never |
|---|---|---|
| **Card** — `--surface`, 1px `--hairline`, `--r-md`, 16px padding | The content is a discrete object with its own state or its own action: an application summary, a document to upload, an appointment, a recovery case, a compliance month. | For a paragraph. A card around prose says "this is a thing you act on" and then offers nothing to do. |
| **Plain block** — no border, no fill, sits directly on `--ground`, separated by 24px gap | Narrative: the program explanation, the eligibility text, the FAQ intro, the "what happens next" copy. These are read once, top to bottom. | For anything with a status. |
| **Table** — see §5.9 | ≥ 3 records × ≥ 3 attributes that are compared across rows. | In the applicant site at all — a phone never gets a table. Card lists in the admin are also wrong; ops staff compare rows. |
| **Rule** — 1px `--hairline`, full bleed of its container | Dividing two parts of the *same* object: the header of a card from its body, one timeline entry from the next. | Between two cards. The 12px gap already separates them; a rule on top double-states it. |

### 4.2 Radii

| Token | px | Applied to |
|---|---|---|
| `--r-xs` | 6 | Chips, tags, small buttons, the inner track of a meter, icon tiles |
| `--r-sm` | 10 | Text inputs, selects, standard buttons, metric tiles, admin cards, the table container |
| `--r-md` | 14 | Applicant cards, option cards, notices, document rows |
| `--r-lg` | 20 | Sheets and modals (top two corners only for a bottom sheet), the admin console frame |
| `--r-pill` | 999 | Status pills, avatars, the chrome's tab group, progress tracks |
| `--r-device` | 36 | The phone frame only |

A control never mixes radii with its container: an input at `--r-sm` inside a card at `--r-md` is correct; nesting two `--r-md` boxes is not.

### 4.3 Elevation — exactly four users

Shadow means "this is physically in front of the page". Four things qualify:

1. **The phone frame** — `--shadow-device`. It is a device resting on the stage.
2. **Sheets and modals** — `--shadow-overlay`, over a scrim `rgba(15,18,25,.45)` light / `rgba(0,0,0,.62)` dark.
3. **Select menus and popovers** — `--shadow-overlay`.
4. **The sticky bottom action bar and the sticky app header** — `--shadow-sticky` only, directional, so the shadow reads as "content is passing underneath" rather than "this is a floating card".

**Everything else has zero shadow.** Cards, metric tiles, tables, notices, option cards, the admin console frame, the sidebar, the chrome bar: `--surface` plus a 1px `--hairline` and nothing more. This is the single most important rule in this section — the previous build put `--shadow` on `.card`, `.desk` and `.metric`, which flattened the hierarchy by making every block claim the same altitude.

In dark mode, shadows carry almost no information (dark on dark). Separation there comes from the **surface step**: `--surface-sunken #0A0D13` → `--ground #0F1219` → `--surface #161A23` → `--surface-raised` (use `--accent-subtle` for selected rows). Keep the hairline in dark mode; it does the work the shadow does in light.

---

## 5. Components

Unless stated, transitions are `150ms ease` on `background-color`, `border-color`, `color` only — never on `transform` or `box-shadow`, and all of it inside `@media (prefers-reduced-motion: no-preference)`.

**Global focus ring**, one definition, everywhere:

```css
:focus-visible{
  outline: 2px solid var(--accent-edge);
  outline-offset: 2px;
  border-radius: var(--r-xs);
}
```

On `--chrome` and `--side` the ring switches to `--chrome-text` / `--side-rail` respectively, since indigo on indigo-ink would vanish.

**Minimum touch target: 44 × 44px** on every applicant-site control. Captains use these on the street, one-handed, sometimes with gloves.

### 5.1 Status pill

```
display:inline-flex; align-items:center; gap:6px;
padding: 3px 10px;  border-radius: var(--r-pill);
font: 600 11.5px/1.55 var(--font-ui);  white-space: nowrap;
border: 1px solid <family>-border;  background: <family>-fill;  color: <family>-ink;
::before  → 6px circle, background: currentColor, flex:0 0 auto
```

| Tone | fill | border | ink |
|---|---|---|---|
| Positive — `مُعتمد`, `تم التسليم`, `ملتزم` | `--pos-fill` | `--pos-border` | `--pos-ink` |
| Attention — `تحت المراجعة`, `ناقص مستند`, `إنذار` | `--att-fill` | `--att-border` | `--att-ink` |
| Critical — `مرفوض`, `متعثر`, `حالة استرداد` | `--crit-fill` | `--crit-border` | `--crit-ink` |
| Informational — `مُقدَّم`, `في انتظار الموعد` | `--info-fill` | `--info-border` | `--info-ink` |
| Neutral — `مسودة`, `مؤرشف` | `--surface-sunken` | `--hairline` | `--text-2` |

The dot plus the Arabic word are both required — state is never colour-only.

### 5.2 Buttons

All: `display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid transparent; font: 600 15px/1 var(--font-ui); cursor:pointer;`

| Variant | Rest | Hover | Active | Disabled |
|---|---|---|---|---|
| **Primary** | `background:var(--accent); color:var(--on-accent); padding:13px 20px; border-radius:var(--r-sm)` | `background:var(--accent-hover)` | `background:var(--accent-hover); border-color:var(--accent-hover)` | `background:var(--surface-sunken); color:var(--text-disabled); cursor:not-allowed` |
| **Secondary** | `background:var(--surface); color:var(--text); border-color:var(--border-strong); padding:12px 19px; border-radius:var(--r-sm)` | `background:var(--surface-sunken)` | `border-color:var(--text-2)` | `color:var(--text-disabled); border-color:var(--hairline)` |
| **Tertiary** | `background:transparent; color:var(--accent); padding:10px 12px; border-radius:var(--r-xs); text-underline-offset:4px` | `background:var(--accent-subtle)` | `color:var(--accent-hover)` | `color:var(--text-disabled)` |
| **Destructive** | `background:var(--crit-fill); color:var(--crit-ink); border-color:var(--crit-edge); padding:12px 19px; border-radius:var(--r-sm)` | `background:var(--crit-fill); border-color:var(--crit-ink)` | `background:var(--crit-ink); color:var(--surface)` | as secondary disabled |

Small size (admin table row actions): `padding: 7px 12px; font-size: 13px; border-radius: var(--r-xs);` — 32px tall, allowed **only** in the admin and portal, never on the applicant site.

Destructive is a soft fill, not a solid red block: in the admin console, `رفض الطلب` and `فتح حالة استرداد` sit in the same row as ordinary actions, and a solid red button there reads as an alarm rather than a choice.

Primary button labels are verbs and say the outcome: `قدّم الطلب`, `احجز موعد الاستلام`, `أرسل الكود`. Never `متابعة` on a screen where something irreversible happens.

### 5.3 Text input and select

```
width:100%;
background: var(--surface);
border: 1px solid var(--border-strong);       /* 3.37:1 — the boundary is an indicator */
border-radius: var(--r-sm);
padding: 12px 14px;
font: 400 15px/1.5 var(--font-ui);
color: var(--text);
```

| State | Change |
|---|---|
| Placeholder | `color: var(--text-3)` (5.26:1 — placeholders are text and must pass) |
| Hover | `border-color: var(--text-2)` |
| Focus | `border-color: var(--accent-edge)` + the global focus ring |
| Invalid | `border-color: var(--crit-edge); background: var(--crit-fill)` + a message below in `--crit-ink` at 11.5px, prefixed by a critical icon |
| Disabled | `background: var(--surface-sunken); color: var(--text-disabled); border-color: var(--hairline)` |
| Read-only (admin, locked after submission) | `background: var(--surface-sunken); border-color: var(--hairline); color: var(--text)` |

Label: 13px / 600 / `--text`, 6px above. Hint: 11.5px / 400 / `--text-3`, 6px below. Error replaces the hint, never stacks with it.

Fields that take Latin codes — phone, national ID, plate, chassis — get `.lat` on the `<input>` (`direction:ltr; unicode-bidi:isolate; text-align:start`) plus `inputmode="numeric"` so a cheap Android raises the number pad. The label above stays RTL Arabic.

Select: same box, `appearance:none`, with a 10px chevron drawn as an inline SVG in `--text-3` inset **16px from the inline-start** (RTL: the left edge).

Every control gets a stable `id`.

### 5.4 Option card (radio / checkbox tile)

```
display:flex; align-items:flex-start; gap:12px;
background: var(--surface);
border: 1px solid var(--hairline);
border-radius: var(--r-md);
padding: 14px 16px;
min-height: 56px;
cursor: pointer;
```

- Title: 16px / 600 / `--text`. Sub-line: 12px / 400 / `--text-3`, on its own row.
- Hover: `border-color: var(--border-strong)`.
- **Selected: `border: 1.5px solid var(--accent-edge); background: var(--accent-subtle); color: var(--accent-ink)`** — the edge is `--accent-edge` (11.65:1 light / 3.95:1 dark), so selection clears 3:1 as a non-text indicator on its own, before the radio dot is counted.
- Focus: global ring, outside the border.
- The native `<input>` stays in the DOM with `accent-color: var(--accent)`, sized 20px, aligned to the title's first line (`margin-block-start: 3px`).
- Stacked vertically at phone width with a 8px gap; the inline variant only in the admin, `flex: 1 1 140px`.

### 5.5 Stepper (5-step application form)

Horizontal, scrollable, no circles-with-numbers.

```
container: display:flex; gap:6px; overflow-x:auto; padding-block-end:2px;
step:      flex:1 1 0; min-width:62px; display:flex; flex-direction:column; gap:6px; text-align:start;
bar:       height:4px; border-radius:var(--r-pill);
label:     11.5px/1.45, 2 lines max
```

| State | bar | label |
|---|---|---|
| Done | `background: var(--accent)` | `color: var(--text-2)`, weight 400 |
| Current | `background: var(--accent)` + a 4px `--accent` dot above the label | `color: var(--text)`, weight 600 |
| Upcoming | `background: var(--hairline)` | `color: var(--text-3)`, weight 400 |

Above the bars, always: `الخطوة ٣ من ٥` at 11.5px / 600 / `--text-3`. Done and current share a bar colour deliberately — the bar shows *progress made*, the dot and the weight show *where you are*. Colour alone never distinguishes done from current.

### 5.6 Vertical timeline (request tracking, message log)

```
li:  display:grid; grid-template-columns:22px 1fr; gap:12px; padding-block-end:18px; position:relative;
connector: ::before, inset-inline-start:10px, top:22px, bottom:0, width:2px
dot: 20px, border-radius:50%, border:2px solid, display:grid, place-items:center
```

| State | dot | connector above it | title |
|---|---|---|---|
| Done | `background:var(--accent); border-color:var(--accent);` white check at 11px | `background: var(--accent)` | `--text`, 600 |
| Current | `background:var(--surface); border-color:var(--accent-edge);` + `box-shadow: 0 0 0 4px var(--accent-subtle)` | `background: var(--hairline)` | `--text`, 600 |
| Upcoming | `background:var(--surface); border-color:var(--hairline)` | `background: var(--hairline)` | `--text-3`, 400 |
| Blocked / action needed | `background:var(--att-fill); border-color:var(--att-edge);` `!` glyph in `--att-ink` | `background: var(--hairline)` | `--att-ink`, 600 |

Title 13px / 600. Description 13px / 400 / `--text-2`. Timestamp on its own line, `.lat` + `--t-fig-s`, `--text-3`. The `box-shadow` on the current dot is a ring, not elevation — it is the one permitted exception to §4.3.

### 5.7 Metric tile (admin KPIs, compliance meters)

```
background: var(--surface);
border: 1px solid var(--hairline);
border-radius: var(--r-sm);
padding: 14px;
display:flex; flex-direction:column; gap:4px;
no shadow
```

- Caption above the number: 11.5px / 600 / `--text-3`.
- Value: `--t-fig-l` (22px / 600 / `--font-figure` / `tabular-nums`) in `--text`. The unit or suffix (`٪`, `يوم`, `جنيه`) at 13px / 500 / `--text-3`, baseline-aligned.
- Delta, when there is one: 12px / 600, `--pos-ink` or `--crit-ink`, with a 8px triangle glyph. Never with a background.
- Meter track below, when the metric has a threshold: `height:6px; border-radius:var(--r-pill); background:var(--surface-sunken);` fill in `--pos-edge` (meeting target), `--att-edge` (within 10% of the floor), `--crit-edge` (below the floor). The threshold gets a 2px `--border-strong` tick at its position — a meter without a marked threshold is a decoration.
- Big-number tiles appear on the ops dashboard and the compliance page only. The applicant's fact grid uses the same figure style but as a 2×2 bordered grid, not as tiles.

### 5.8 Notices / callouts

```
display:flex; gap:12px; align-items:flex-start;
border-radius: var(--r-md);
border: 1px solid <family>-border;
background: <family>-fill;
padding: 14px 16px;
no shadow
```

- Icon: 18px inline SVG, 1.5px stroke, in `<family>-ink`, on its own 20px grid, `flex:0 0 auto`.
- Title: 16px / 600 / `<family>-ink`. Body: 13px / 1.7 / `<family>-ink`. Do not drop the body to `--text-2` — a two-colour callout looks like a rendering error.
- The four tones, and what each one is for in this product:

| Tone | Use | Example copy |
|---|---|---|
| Informational | Explaining a rule the captain has not broken | `التسليم بيتم من نقطة التوزيع اللي اخترتها فقط.` |
| Positive | Confirming an irreversible good thing | `تم اعتماد طلبك. الموتوسيكل محجوز باسمك.` |
| Attention | Something the captain must do, with a deadline | `ناقص صورة بطاقة الضامن. عندك ٤٨ ساعة.` |
| Critical | Something already lost or at risk of loss | `الشهر ده تحت الحد. تكرارها يوقف البرنامج.` |

A notice never has a close button on the applicant site — a captain who dismisses the compliance warning still owes the compliance.

### 5.9 Data table (admin, portal)

Container: `overflow-x: auto; border: 1px solid var(--hairline); border-radius: var(--r-sm); background: var(--surface);`
Table: `width:100%; border-collapse: collapse; font-size: 13px; min-width: 680px;` — the `min-width` lives on the `<table>`, never on the container, so the page body never scrolls sideways.

| Part | Spec |
|---|---|
| Header cell | `background:#F4F5F8` light / `#1B2029` dark; `color:var(--text-3)`; 11.5px / 600; `padding: 10px 14px`; `text-align: start`; `white-space: nowrap`; `border-block-end: 1px solid var(--hairline)`; sticky (`position:sticky; top:0; z-index:2`) |
| Body cell | `padding: 12px 14px`; `border-block-end: 1px solid var(--hairline)`; `vertical-align: middle`; last row `border-block-end: 0` |
| Primary cell (name, ref) | 13px / 600 / `--text` |
| Figure cells (ref, plate, date, amount) | `.lat` + `--t-fig-s`, `tabular-nums`, `--text-2` |
| Row hover | `background: var(--row-alt)` |
| Row selected | `background: var(--accent-subtle)` + a 2px `--accent-edge` inline-start inset rail |
| **Zebra** | **No.** Hairlines already delimit rows; zebra plus hairlines plus hover gives three competing row signals. Zebra is permitted only on the 8-step handover checklist in the portal, where there are no hairlines. |
| Status column | a §5.1 pill, never a bare coloured word |
| Row action | small tertiary button, revealed at `opacity:.55` at rest and `1` on row hover/focus-within — present in the DOM at all times for keyboard users |
| Empty state | one row spanning all columns, 13px `--text-3`, centred, with a single tertiary action |

Sortable header: the column label plus a 10px chevron in `--text-3`, `--text` when active. Sort direction is announced with `aria-sort`.

### 5.10 Sticky bottom action bar (applicant)

```
position: sticky; bottom: 0; z-index: 20;
background: var(--surface);
border-block-start: 1px solid var(--hairline);
box-shadow: var(--shadow-sticky);
padding-inline: 16px;
padding-block: 12px;
padding-block-end: calc(12px + env(safe-area-inset-bottom, 0px));
display: flex; gap: 10px;
```

One primary, at most one secondary. The primary takes `flex: 1`. No backdrop blur — it costs frames on the cheap Android devices this is for, and a translucent bar over Arabic text reduces legibility in sunlight. When there is a cost or a commitment above the button, restate it in the bar at 11.5px / `--text-3` (`بدون مقدم — بدون أقساط`) so the captain never taps a commitment they cannot see.

### 5.11 Sheet / modal

- Scrim: `rgba(15,18,25,.45)` light, `rgba(0,0,0,.62)` dark. No blur.
- Phone (bottom sheet): `background: var(--surface); border-radius: var(--r-lg) var(--r-lg) 0 0; box-shadow: var(--shadow-overlay); padding: 20px 18px calc(18px + env(safe-area-inset-bottom, 0px)); max-height: 82%;` with a 36 × 4px `--hairline` grab handle at `--r-pill`, centred, 12px from the top.
- Desktop (admin dialog): `max-width: 520px; border-radius: var(--r-lg); padding: 24px;` centred.
- Title `--t-d2`. Close button 40 × 40px, tertiary, at the inline-end of the title row.
- Focus moves to the sheet on open and returns to the trigger on close; `Esc` closes; body scroll locks.

### 5.12 Phone frame

```
width: min(430px, 100%);
background: var(--ground);
border: 9px solid var(--chrome);       /* warm graphite = scaffolding, matching the prototype bar */
border-radius: var(--r-device);
box-shadow: var(--shadow-device);
overflow: hidden;
```

- Status strip inside the top bezel: `background: var(--chrome); color: var(--chrome-dim); font: 500 11px var(--font-figure); padding: 2px 20px 7px;` showing a plausible `9:41` and battery — Latin digits, because it is device chrome, not product copy.
- Scroll area: `max-height: 76vh; overflow-y: auto; overscroll-behavior: contain; background: var(--ground);`
- **Below 620px viewport the frame disappears entirely**: `border: 0; border-radius: 0; box-shadow: none; width: 100%; max-height: none;` and the status strip is hidden. A phone showing a picture of a phone is the wrong image; at that width the prototype simply *is* the phone.
- The frame is deliberately in the chrome family, not the product family — it is scaffolding around the design, not part of it.

### 5.13 Admin sidebar

```
width: 216px;
background: var(--side);
padding-block: 16px;
padding-inline: 10px;
display: flex; flex-direction: column; gap: 2px;
no shadow, no border
```

- Identity block at the top: diamond mark (D = 26px) + `تريد واي` in 13px / 600 / `--side-text` + role line `غرفة العمليات` in 11.5px / `--side-dim`. Divided from the nav by 1px `--side-line`, 12px below.
- Nav item: `padding: 9px 11px; border-radius: var(--r-xs); font: 500 13px var(--font-ui); color: var(--side-dim); display:flex; gap:10px; align-items:center;` with a 18px inline SVG icon.
- Hover: `color: var(--side-text)`.
- Active: `background: var(--side-raised); color: var(--side-text); box-shadow: inset 2px 0 0 var(--side-rail);` — in RTL the rail must be on the **inline-start** edge, so use `inset 2px 0 0` under `direction: rtl` (this puts it on the right, which is correct) and verify visually.
- Badge (pending count): `--att-fill` / `--att-ink` pill at 11px, pushed to the inline-end with `margin-inline-start: auto`, Latin digits.
- Below 860px the sidebar becomes a horizontal scrolling strip: `flex-direction: row; overflow-x: auto; gap: 4px; padding: 8px;` identity block hidden, items `white-space: nowrap`.

### 5.14 Prototype chrome bar

This must read as scaffolding at a glance. Three devices do that, and they are used nowhere else in the system: **the warm graphite family**, **Latin-first labelling**, and **zero accent colour**.

```
position: sticky; top: env(safe-area-inset-top, 0px); z-index: 60;
background: var(--chrome);
border-block-end: 1px solid var(--chrome-line);
color: var(--chrome-text);
inner: max-width:1280px; margin-inline:auto;
       padding-inline:16px; padding-block:10px;
       display:flex; align-items:center; gap:14px; flex-wrap:wrap;
```

- Left (inline-start): diamond mark D = 22px + `تريد واي` 13px/600 `--chrome-text` + a `--chrome-dim` 11px sub-line `نموذج تفاعلي — ليس نظاماً حياً`.
- Portal tabs: a `--r-pill` group, `background: var(--chrome-raised); border: 1px solid var(--chrome-line); padding: 3px;` — each tab `padding: 7px 15px; border-radius: var(--r-pill); font: 600 12.5px; color: var(--chrome-dim);`. **Selected tab: `background: var(--chrome-sel); color: var(--chrome-sel-ink)`** (12.89:1) — a warm bone fill, explicitly *not* `--accent`. This is what keeps the chrome from being mistaken for product UI.
- Screen index, a second sticky row at `top: calc(env(safe-area-inset-top, 0px) + 54px)`, `background: var(--chrome-raised); border-block-end: 1px solid var(--chrome-line);` items `padding: 6px 12px; border-radius: var(--r-xs); font-size: 12.5px; color: var(--chrome-dim);` current item `background: var(--chrome); color: var(--chrome-text); border: 1px solid var(--chrome-line);`.
- The index number before each screen name: `--font-figure`, 10.5px, `--chrome-dim`, Latin digits, e.g. `A3`, `B5`, `C1` — portal letter plus screen number. This is real information (which of the 17 screens you are on), which is what earns it the numbering.
- Focus ring inside the chrome switches to `--chrome-text`.
- The chrome bar never uses `--accent`, never uses the semantic families, and never uses a brand green.

---

## 6. Three things to avoid in this build

**1. One radius and one shadow stamped on every block.**
The rejected build gave `.card`, `.desk`, `.metric` and `.phone` the same `--shadow` and near-identical rounding, so a KPI tile, a form card and a whole desktop application frame all claimed the same altitude and the same degree of "object-ness". On a compliance screen where one number is a problem and five are fine, uniform elevation means nothing reads first.
**Instead:** elevation belongs to exactly four elements (§4.3) — the phone frame, overlays, popovers, and the sticky bar's directional shadow. Everything else is `--surface` + 1px `--hairline`. Hierarchy comes from the surface step (`--surface-sunken` → `--ground` → `--surface` → `--accent-subtle`), from the six-step radius scale used by role, and from type weight. And the accent rail appears in exactly one place in the whole system — the active admin sidebar item — so that when you see it, it means something.

**2. Emoji as status markers and section icons.**
This is an Egyptian financial-commitment flow. A captain is being asked to sign a contract and produce a guarantor; a 🎉 next to `تم اعتماد طلبك` or a ⚠️ next to a compliance breach makes an official document look like a promo push notification, and emoji render differently on every cheap Android build, so the meaning is not even stable.
**Instead:** status is a §5.1 pill — a 6px `currentColor` dot, an Arabic word, a semantic fill and border. Icons are inline SVG on a single 20px grid at 1.5px stroke, coloured from the semantic ink token, so they inherit the theme and never surprise you at 3am on a Redmi.

**3. A centred, gradient-washed 100vh hero.**
The current program page opens with a radial-gradient-plus-linear-gradient hero in the brand green with a decorative stripe motif — the AI-design default (gradient hero, centred text, decorative glow), and it actively hurts here: gradients band badly on 6-bit phone panels, they wash out completely in direct sunlight, and centred Arabic breaks the left-edge scan that RTL readers use.
**Instead:** the hero is a flat `--ground` block, about 240px tall, sized to its own content and fully visible in the first frame. `text-align: start` on everything — RTL text aligns to the right edge and stays there, headline, body, facts and button all sharing one edge. The headline is `--t-d1` in Noto Kufi Arabic at 700, and the only "graphic" is the four-cell fact grid — `٨ ساعات`, `٢٦ يوم`, `٦٠٪ قبول`, `٢٪ إلغاء` — a 2×2 grid of `--surface` cells separated by 1px `--hairline` gaps, figures in `--t-fig-l`. The real numbers of the operating matrix are the most persuasive thing on the page; they do not need a gradient behind them.

---

## 7. Implementation rules carried from the Artifact page contract

- Author as `.html`. No `<!DOCTYPE>`, `<html>`, `<head>` or `<body>` tags — the skeleton is added at publish time. Keep `:root`'s safe-area padding; set `direction: rtl; lang="ar"` on the outermost wrapper the file controls.
- `<title>` within the first 8KB, a name of two to four words, no appended explainer. `تمليك موتوسيكلات تريد واي` works. The explanation goes in the publish `description`.
- Google Fonts is the only permitted font host; the `<link>` in §3.2 is the only external stylesheet. Every face carries the fallback stack in §3.2.
- One side gutter, set once: `padding-inline: 16px` on the stage wrapper, with vertical space via `padding-block` — never a `padding` shorthand that would zero the sides.
- Sticky page headers use `top: env(safe-area-inset-top, 0px)`. A bar pinned to the bottom stays at `0` and adds `env(safe-area-inset-bottom, 0px)` to its own padding.
- `body { background: var(--ground); color: var(--text); }` explicitly. No colour is ever defined only inside a media query or a `[data-theme]` block.
- Tables, the screen index and the stepper each get their own `overflow-x: auto` container; nothing else may exceed the viewport, and no element gets a `min-width` wider than the screen.
- `font-variant-numeric: tabular-nums` on every column of digits.
- `:focus-visible` is always visible; `@media (prefers-reduced-motion: reduce) { *{ animation:none !important; transition:none !important } }`.
- Every form control has a stable `id`, and every screen opens in a realistic filled state — a captain part-way through step 3, a queue with four appointments, a compliance month at ٥٨٪ — never an empty shell.
