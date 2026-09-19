# Trade Way × Uber — Admin Console Data-Visualisation Spec
**Direction:** Trust & Utility. RTL, Arabic. No chart library. Hand-authored CSS + inline SVG.
**Surfaces this spec is validated against:** light page `#F7F5F2` / light card `#FDFCFA`; dark page `#0F1113` / dark card `#171A1D`.

---

## 0. Rules that apply to every mark on this page

### 0.1 RTL — the one thing that breaks charts

Two different mechanisms, and they must not be mixed:

**CSS marks (bars, meters, stacks).** The container carries `direction: rtl`. A block child then starts at the **right** edge and grows **leftward** — no maths needed. Corner radii use logical properties only: in RTL, `inline-start` = right (the baseline) and `inline-end` = left (the data end). So every bar is:

```css
.bar-fill{
  border-start-start-radius:0; border-end-start-radius:0;   /* right = baseline, square */
  border-start-end-radius:4px; border-end-end-radius:4px;   /* left  = data end, rounded */
}
```
Absolute positioning inside an RTL track uses `inset-inline-start: <pct>` to measure **from the right edge**.

**SVG marks.** `dir`/`direction` on an `<svg>` does **not** mirror the coordinate system. The x-axis stays left-to-right. Every RTL flip is authored in the maths: with a plot spanning `x = xL … xR`, a bar of value `v` on max `M` is `x = xR − (v/M)·W`, `width = (v/M)·W`, rounded cap on the **left**. A time axis is `x(i) = xR − i·step`, so index 0 (oldest) sits at the right and the newest at the left.

**SVG text.** Every `<text>` that carries Arabic gets `direction="rtl"`. Under `direction="rtl"`, `text-anchor="start"` pins the text's **right** edge to `x` and `text-anchor="end"` pins its **left** edge. Right-align a label with `text-anchor="start"`; left-align with `text-anchor="end"`. This is inverted from the LTR habit and is the single most common bug in RTL SVG.

**Every drawn SVG shape carries an explicit `fill`** (`fill="none"` on strokes-only paths). No shape relies on the UA default.

### 0.2 Number and label formatting (Arabic)

| Content | Digits | Rule |
|---|---|---|
| Quantities, counts, percentages, hours, days | **Arabic-Indic** `٠١٢٣٤٥٦٧٨٩` | `Intl.NumberFormat('ar-EG')` |
| Captain ID, contract no., chassis/VIN, plate number, phone, ISO dates | **Latin** | never converted; wrapped `<bdi dir="ltr">` |

- **Thousands separator:** U+066C `٬` — `1,000 → ١٬٠٠٠`, `3,120 → ٣٬١٢٠`.
- **Decimal separator:** U+066B `٫` — `7.2 → ٧٫٢`, `41.8 → ٤١٫٨`.
- **Percent:** U+066A `٪` **leading the digits** — `68% → ٪٦٨`, `3.1% → ٪٣٫١`. Egyptian financial-document convention; emit it explicitly, do **not** rely on `style:'percent'`, which appends the sign:
  ```js
  const n  = v => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:1}).format(v);
  const pc = v => '٪' + n(v);              // ٪٤١٫٨
  const frac = (a,b) => `${n(a)} / ${n(b)}`;  // ٣٥٢ / ٦٠٠  (NBSP round the slash)
  ```
- **Mixed runs** (a plate inside an Arabic sentence) wrap in `<bdi>`. Any element that mixes Arabic labels with Latin IDs gets `unicode-bidi: isolate`.
- Decimals: 1 place for hours/percentages, 0 for counts. Never 2.
- `font-variant-numeric: tabular-nums` **only** in table columns, axis ticks and legend counts. Stat-tile values and the hero figure use proportional figures.
- Typeface for every number, including the hero figure: the page's Arabic UI sans (`"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif`). No display or serif face on any figure.

### 0.3 Universal mark specs (from the skill, fixed)

Bars ≤ 24px thick · 4px rounded data end, square baseline · lines 2px round join/cap · markers r ≥ 4 with a 2px surface ring · area washes at 10% opacity · gridlines and axes are **solid** 1px hairlines, never dashed · a **2px surface-coloured gap** separates touching fills (never a stroke) · legend present whenever ≥ 2 fills carry meaning · text never wears a data colour (exception: a label set *inside* a fill, where ink is picked by the fill's luminance) · hit targets ≥ 24px, interactive rows ≥ 44px · no number on every data point.

---

## 1. KPI row — أرقام الدفعة (6 tiles)

### Mark and why
`choosing-a-form.md`: *"A handful of headline numbers → KPI row of stat tiles."* So: stat tiles, not a grouped bar chart. The opinionated part is what each tile earns beyond the number.

**The rule:** a tile gets a **share meter** only when its denominator is the batch of ١٬٠٠٠ *and* that share is the thing being managed. A tile whose real denominator is another tile gets a **text sub-ratio**, not a meter — an 8.9% meter fill reads as "almost nothing" and would understate a real risk. A tile that measures a *flow* gets a **delta**, not a share.

| # | Tile | Kind | Treatment | Value shown |
|---|---|---|---|---|
| 1 | دراجات الدفعة | anchor / denominator | **hero figure, nothing else.** A meter of 100% of itself is noise. | ١٬٠٠٠ |
| 2 | تم التسليم | **rate of the whole** | share meter + `٪٤١٫٨` + delta `+٣٤ عن الأسبوع الماضي` | ٤١٨ |
| 3 | متاح بالنقاط | **rate of the whole** | share meter + `٪١٩٫٨` | ١٩٨ |
| 4 | محجوز بمواعيد | **flow** | delta only: `+١٤ هذا الأسبوع`. 62/1000 is a meaningless denominator; acceleration is the signal. | ٦٢ |
| 5 | حالات متعثرة | **count, sub-denominator** | text sub-ratio `٪٨٫٩ من المُسلَّم` + attention dot | ٣٧ |
| 6 | تحت الاسترداد | **count, sub-denominator** | text sub-ratio `٪٢٤٫٣ من المتعثرة` + critical dot | ٩ |

**Sparklines: zero, in all six tiles.** Only one of these six has a meaningful 8-week series, and that trend already has a home (§2, §6). Six sparklines would be exactly the decoration the row suffers from today.

### Geometry
- Row: `display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:12px`. → 3 cols ≤ 1100px → 2 cols ≤ 640px. At 360px: 2 cols × 152px.
- Tile: `padding:14px 14px 12px`; `border-radius:12px`; `border:1px solid var(--line)`; `background:var(--surface-1)`; **no shadow**; `min-height:104px` on all six so the row composes as one object.
- Eyebrow: 11.5px / 1.3, weight 600, `letter-spacing:.02em`, `--ink-muted`.
- Value: 30px, weight 650, `--ink-primary`, `line-height:1.05`, `margin-block-start:6px`, proportional figures.
- Tile 1 value: **38px** — the row's single hero figure. Exactly one per view.
- Sub-line / delta: 12px, `--ink-secondary`, `margin-block-start:4px`.
- Status dot: 8px circle + 2px `--surface-1` ring (12px visual), `margin-inline-start:6px`, baseline-aligned with the eyebrow.
- Meter: `block-size:6px; border-radius:3px; margin-block-start:10px`, full tile width.
- Whole tile is the hit target (`min-height:104px` ≫ 44px). Focus: `outline:2px solid var(--info-mark); outline-offset:2px`.

### Colour by role
| Element | Light | Dark | Contrast vs card |
|---|---|---|---|
| Meter track | `--track` `#EDE8DF` | `#22262A` | 1.19 / 1.15 (furniture) |
| Meter fill — تم التسليم | `--pos-mark` `#0F8047` | `#3AAD74` | **4.88 / 6.16** |
| Meter fill — متاح بالنقاط | `--ramp-4` `#35509A` | `#7B92D6` | **7.41 / 5.76** |
| Dot — متعثرة | `--att-mark` `#C48610` | `#C88410` | 3.03 / 5.63 |
| Dot — تحت الاسترداد | `--crit-mark` `#962019` | `#C04046` | 8.14 / 3.38 |
| Delta text (up-is-good) | `--pos-ink` `#0B6A3B` | `#57C68D` | 6.52 / 8.21 |

### Technique (CSS, no SVG)
```html
<div class="meter" role="img" aria-label="تم تسليم ٤١٨ من ١٬٠٠٠ دراجة — ٪٤١٫٨">
  <i style="inline-size:41.8%"></i>
</div>
```
```css
.meter{direction:rtl;block-size:6px;border-radius:3px;background:var(--track);overflow:hidden}
.meter > i{display:block;block-size:100%;background:var(--pos-mark);
  border-start-start-radius:0;border-end-start-radius:0;      /* right = baseline */
  border-start-end-radius:3px;border-end-end-radius:3px}      /* left  = data end */
```
The track's own 3px radius + `overflow:hidden` rounds the baseline end. Radius is 3px (half thickness) because the 4px data-end rule applies to bars ≥ 8px.

### Empty / edge states
- **Count is zero:** value renders `٠`; the `<i>` fill element is **omitted entirely** (not `width:0`, which leaves a 3px radius artefact); the bare track shows with `aria-label="لا توجد حالات"`.
- **Value not yet reported** (distinct from zero): value renders `—` in `--ink-muted` at the same 30px; sub-line reads `لم تُحدَّث بعد`; the meter block is removed and its 16px replaced by `margin-block-start:16px` on the sub-line so tile height stays 104px.
- **Share > 100%** (data error): fill clamps to 100%, the true percentage still prints, and the sub-line gains `تحقَّق من البيانات` in `--crit-ink`.

### Accessibility
Each tile is an `<a>`/`<button>` with `aria-label` = "`<eyebrow>`: `<value>`" plus the share or delta spelled out. The meter is `role="img"` with the full sentence; screen readers never receive a bare percentage. At **360px** the row is a 2-column grid; meters and deltas survive (they are 6px and one line), only the tile padding drops to 12px.

---

## 2. Conversion funnel — مسار التحويل (6 stages)

Data: ترشيحات أوبر ٣٬١٢٠ → طلبات بدأت ٢٬٢٨٤ → طلبات مكتملة ١٬٨٤٢ → قبول مبدئي ١٬١٩٧ → ملف جاهز للتسليم ٧٠٢ → تم التسليم ٤١٨.

### Mark and why
Funnel stages are **ordinal** (`color-formula.md`: *"If swapping the category order would change the meaning — funnel stages, tiers — it is ordinal"*), so one hue with monotone lightness steps, never six identity hues.

A single absolute bar chart cannot tell the story: the largest *absolute* loss is stage 1→2 (−٨٣٦), while the worst *step* is stage 4→5. So the figure is **one `<figure>`, two panels, sharing six rows** — the remedy `anti-patterns.md` names for two measures of different scale (two charts, never two y-scales on one plot):

- **Panel A (right, the first-read position in RTL):** absolute survivors, right-anchored bars on a shared `0 … 3,120` scale, ordinal ramp. Shows the real shrink.
- **Panel B (left):** **step retention**, all bars on a shared `0 … 100%` scale. Because every row is normalised to its own predecessor, the **shortest bar is the worst step, readable without a single number**. That is the requirement, satisfied geometrically.

Retention values: `٪٧٣٫٢ · ٪٨٠٫٦ · ٪٦٥٫٠ · ٪٥٨٫٦ · ٪٥٩٫٥`. Row 4 (قبول مبدئي → ملف جاهز) is the shortest.

### The percentage baseline: **% of previous stage**
Panel A's bar length already *is* % of top (bar ÷ top bar), so printing % of top on every row double-encodes what the geometry shows. What panel A cannot show is where the leak is — a stage that loses 41% of a small pool looks smaller than one that loses 27% of a big pool. **% of previous is the diagnostic and the only per-row percentage.** % of top appears exactly once, as a caption under the last row: `التحويل الكلي: ٪١٣٫٤ من الترشيحات`.

### Geometry
- Row grid (`direction:rtl`): `grid-template-columns:[labels] 152px [panelA] minmax(0,1fr) [gap] 16px [panelB] 132px`.
- Row height **36px**; 6 rows = 216px plot. Container height is **not fixed** — it grows to include the 28px axis band (`anti-patterns.md`: a fixed height that excludes the axis band creates a nested scrollbar).
- Bar thickness **18px** (≤24px cap), vertically centred → 9px air above and below, so adjacent rows are separated by 18px of surface, far beyond the 2px minimum.
- Bar radius: **4px** on the left (data) end, **0** on the right (baseline).
- Panel A x-maths: `left = W_A × (1 − v/3120)`, `width = W_A × v/3120`, anchored to the panel's right edge.
- Panel B x-maths: `width = 132 × retention`; min bar 58.6% → 77px.
- Stage labels: 12.5px `--ink-secondary`, max 2 lines, `text-wrap:balance`.
- Direct labels — panel A: the count at the bar's **left tip, outside the bar**, 8px clear, 12.5px `tabular-nums` `--ink-primary`. Panel B: the retention **inside** the bar at its left end, 11.5px, ink picked by fill luminance — placed inside only because all five bars measure ≥ 77px and the text measures ≈ 34px; measure before placing, and if it fails, move outside.
- Axis: one hairline at each panel's right edge, `--axis`, 1px solid. Panel A ticks `٠ · ١٬٥٠٠ · ٣٬٠٠٠`; panel B ticks `٪٠ · ٪٥٠ · ٪١٠٠`. 11px `--ink-muted`. **No interior gridlines** — direct labels come before gridlines.
- Hit target: each row is a `<button>` spanning the full figure width, 36px tall, with `::after{position:absolute;inset-block:-4px;inset-inline:0}` to reach 44px.

### Emphasising the worst step — four redundant channels
1. Panel B bar for row 4 is `--att-mark`; the other four are `--ramp-4`.
2. A full-figure-width row wash behind row 4: `background: color-mix(in srgb, var(--att-mark) 8%, transparent)`.
3. An 11px inline-SVG triangle glyph in `--att-ink` at the row's right edge.
4. The words `أكبر تسرُّب` beside the glyph, 11.5px `--att-ink`.

Never colour alone.

### Colour by role
| Role | Light | Dark | Contrast vs card |
|---|---|---|---|
| Panel A stage 1 (ordinal 1) | `#A0AFD8` | `#3C4E86` | 2.13 / 2.18 — relief: every bar direct-labelled + table view |
| Panel A stage 2 (ordinal 2) | `#7C8EC8` | `#4C63A4` | 3.12 / 3.02 |
| Panel A stage 3 (ordinal 3) | `#5670B2` | `#6079BE` | 4.70 / 4.14 |
| Panel A stages 4–6 (ordinal 4) | `#35509A` | `#7B92D6` | 7.41 / 5.76 |
| Panel B normal | `#35509A` | `#7B92D6` | 7.41 / 5.76 |
| Panel B worst step | `#C48610` | `#C88410` | 3.03 / 5.63 |
| Row wash | `color-mix(--att-mark 8%, transparent)` | same | decorative |
| Axis / ticks | `--axis` / `--ink-muted` | `--axis` / `--ink-muted` | — |

The ordinal ramp is validated with `--ordinal` (see §7): monotone PASS, ΔL ≥ 0.06 PASS, light-end 2.13:1 ≥ 2.0 PASS, hue spread 4° PASS, both modes.

### Technique — CSS, not SVG
Every mark is an axis-aligned rectangle, so SVG buys nothing and costs correct Arabic text layout. Build panel rows as flex containers with `direction:rtl` and fills as block children sized in `%`. The only SVG is the 11px warning triangle:
```html
<svg viewBox="0 0 12 11" width="11" height="11" aria-hidden="true">
  <path d="M6 0 L12 11 H0 Z" fill="var(--att-ink)"/>
</svg>
```

### Empty / edge states
- **Stage count 0:** bar omitted; a 2px × 18px `--axis` stub sits on the baseline so the row is not blank; label `٠`.
- **Retention > 100%** (late nominations landing in a downstream stage): panel B bar clamps at 100%, the true value still prints, and the row's label column gains `تحقَّق من البيانات` in `--crit-ink`.
- **A stage with no data at all** (not zero): both bars omitted, both label cells `—` in `--ink-muted`, and the retention for the *following* stage is computed against the last stage that has data, with the caption `محسوبة من المرحلة ٣` in `--ink-muted` 10.5px.

### Accessibility
`<figure role="group" aria-labelledby="funnel-title">` wrapping the two panels plus a `عرض كجدول` toggle (`el.hidden`) revealing a `<table>`: المرحلة / العدد / ٪ من المرحلة السابقة / ٪ من الترشيحات. Bars are `aria-hidden`; each row `<button>` carries the full sentence: `المقبولون مبدئياً: ١٬١٩٧ — ٪٦٥٫٠ من المرحلة السابقة، ٪٣٨٫٤ من الترشيحات`.

**At 360px:** the panels stack. Panel A keeps its 6 rows (labels move above each bar at 11.5px, row height 48px, bar 16px) with only two ticks (`٠ · ٣٬١٢٠`). Panel B follows as its own block under the heading `نسبة الانتقال من المرحلة السابقة`, 5 rows × 32px, bars 14px. The worst-step emphasis survives in both blocks.

---

## 3. Compliance gauge, per captain — مؤشرات الالتزام

Four measures, **two polarities**:

| المؤشر | القيمة | الهدف | الأفضل |
|---|---|---|---|
| ساعات الاتصال / اليوم | ٧٫٢ | ٨ | أعلى |
| أيام التشغيل / الشهر | ٢٤ | ٢٦ | أعلى |
| نسبة القبول | ٪٦٨ | ≥ ٪٦٠ | أعلى |
| نسبة الإلغاء | ٪٣٫١ | ≤ ٪٢ | **أقل** |

### The mark: a target-centred deviation bar on a signed compliance index

This is the piece that must work without the reader remembering which way is good. The solution is not a colour convention — it is **normalising polarity out of the data before it reaches the mark**:

```js
// d > 0 ALWAYS means "on the good side of target", whatever the measure's polarity
const d = higherIsBetter ? (value - target) / target
                         : (target - value) / target;
```

Every measure then plots on **one diverging axis whose centre is the target**. The reader learns one rule, once: **longer to the left = better.** It matches every other bar on this page (which all grow leftward with the RTL reading flow), so falling short reads as sliding *backwards*, against the reading direction. Polarity never enters the reader's head.

Sample values: hours `d = −0.100` · days `d = −0.0769` · acceptance `d = +0.1333` · cancellation `d = −0.550` (clamps).

Per `color-formula.md`, a diverging encoding is two opposite hues plus a **neutral gray midpoint** — the target tick is `--axis` gray, never a hue. Because green↔red is the weakest CVD pair, **direction is the primary channel and colour is secondary**; polarity is legible in full monochrome.

### Geometry — table-row variant
- Row height **44px** (meets touch minimum). Deviation cell **168px × 28px**.
- **Target tick:** `1px` wide, `18px` tall, `--axis`, at the cell's exact centre. The only vertical rule in the cell.
- **Minor ticks at ±10%:** `1px × 6px`, `--grid`, at ±16.8px from centre. These mark "short but within tolerance".
- **Bar thickness 14px**, vertically centred (7px air top and bottom).
- **Scale ±50%** maps to ±84px → **1% = 1.68px**. Beyond ±50% the bar clamps at 84px and its far end becomes a **6px chevron notch** instead of a rounded cap — "off scale", not "exactly 50%".
- **Radius 4px on the data end** (the end away from the tick), **0 at the tick end**, so every bar reads as growing *out of* the target.
- **Good arm grows left** from the tick; **shortfall arm grows right**.
- **Exactly at target (|d| < 0.01): no bar.** Instead a `14 × 14` rounded square (`rx=4`) in `--pos-mark`, centred on the tick. This is the critical edge case — a zero-length bar would be indistinguishable from missing data. At-target is a *shape*, not an absence.
- Direct label lives in the **adjacent table cell**, not on the mark: `٧٫٢ / ٨` · `٢٤ / ٢٦` · `٪٦٨ / ≥ ٪٦٠` · `٪٣٫١ / ≤ ٪٢`, 12.5px `tabular-nums`. The deviation percentage is **not** printed per row (that is the "number on every point" anti-pattern) — it lives in the tooltip and the detail card.
- **Status glyph** at the bar's data end, 11px, inside the cell, plus the Arabic status word in the status column:
  - `✓` `--pos-ink` · `تحقَّق`
  - `!` `--att-ink` · `قريب من الحد` (shortfall within ±10%)
  - `✕` `--crit-ink` · `لم يتحقَّق` (shortfall beyond −10%)
- **No "higher is better" arrow in the row.** The normalisation makes it unnecessary; adding it would reintroduce the thing the design removed. Polarity is stated in words in the detail card only.

### Geometry — detail-card variant
Same mark, scaled up. One block per measure, four blocks, `gap:12px`, card `padding:16px`.
- Measure name 13px `--ink-secondary` (right-aligned). Value 22px weight 650 `--ink-primary` beneath.
- Bar **320px × 20px**; tick `1px × 28px`; ±50% = 160px → **1% = 3.2px**; ±10% minor ticks at 32px.
- Axis labelled in **words, not signed percentages** — right end `دون الهدف`, centre `الهدف`, left end `فوق الهدف`, 10.5px `--ink-muted`. Signed percentages would require the reader to decide whether `−٪١٠` is bad.
- One plain sentence under each bar, 12px `--ink-secondary` — the polarity-free explanation:
  - `أقل من الهدف بـ ٠٫٨ ساعة`
  - `أقل من الهدف بيومين`
  - `أعلى من الحد الأدنى بـ ٨ نقاط مئوية`
  - `أعلى من الحد المسموح بـ ١٫١ نقطة مئوية`
- `الأفضل: أعلى` / `الأفضل: أقل` appears here as a 10.5px `--ink-muted` chip — the single place polarity is ever named.

### Colour by role
| Role | Light | Dark | Contrast vs card |
|---|---|---|---|
| Good arm / at-target square | `--pos-mark` `#0F8047` | `#3AAD74` | **4.88 / 6.16** |
| Shortfall within ±10% | `--att-mark` `#C48610` | `#C88410` | **3.03 / 5.63** |
| Shortfall beyond −10% | `--crit-mark` `#962019` | `#C04046` | **8.14 / 3.38** |
| Target tick (neutral midpoint) | `--axis` `#CFC8BB` | `#373B40` | 1.62 / 1.55 |
| ±10% minor ticks | `--grid` `#E7E2D9` | `#262A2E` | 1.26 / 1.21 |
| Glyph + status word inks | `--pos-ink` / `--att-ink` / `--crit-ink` | as §7 | all ≥ 6.5 / ≥ 6.5 |
| No-data / blocked strip | `--track` `#EDE8DF` | `#22262A` | furniture |

Validated all-pairs (§7): light CVD ΔE **8.3** PASS, normal-vision **21.8** PASS; dark CVD **9.4** PASS, normal-vision **17.2** PASS; all four ≥ 3:1 in both modes.

### Technique — inline SVG (the clamp chevron earns it)
```html
<svg viewBox="0 0 180 28" width="180" height="28"
     preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true" focusable="false">
  <!-- plot spans x = 6 … 174 (168 wide); target tick at x = 90; 6px bleed each side for the chevron -->
  <rect x="73.2" y="11" width="1" height="6"  fill="var(--grid)"/>   <!-- +10% (good side)      -->
  <rect x="106.8" y="11" width="1" height="6" fill="var(--grid)"/>   <!-- −10% (shortfall side) -->
  <rect x="89.5"  y="5"  width="1" height="18" fill="var(--axis)"/>  <!-- target, neutral gray  -->
  <!-- GOOD arm, rounded cap on the LEFT: L = min(|d|,0.5) × 168 -->
  <path d="M90 7 H{90-L+4} A4 4 0 0 0 {90-L} 11 V17 A4 4 0 0 0 {90-L+4} 21 H90 Z"
        fill="var(--pos-mark)"/>
  <!-- SHORTFALL arm, rounded cap on the RIGHT -->
  <path d="M90 7 H{90+L-4} A4 4 0 0 1 {90+L} 11 V17 A4 4 0 0 1 {90+L-4} 21 H90 Z"
        fill="var(--att-mark)"/>
  <!-- CLAMPED (|d| > 0.5), chevron instead of a cap; shown on the shortfall side -->
  <path d="M90 7 H168 L174 14 L168 21 H90 Z" fill="var(--crit-mark)"/>
  <!-- EXACTLY AT TARGET -->
  <rect x="83" y="7" width="14" height="14" rx="4" fill="var(--pos-mark)"/>
</svg>
```
No `stroke` anywhere; every shape has an explicit `fill`. The viewBox's 6px side bleed exists so a clamped chevron is never cut off. All text lives in sibling HTML cells, so the viewBox needs no label room.

Card variant: `viewBox="0 0 332 32"`, plot `x = 6 … 326`, tick at `x = 166`, bar `y = 6 … 26`, ±50% = 160px, chevron 8px.

### "No data this week" state
Absence must be visually **different in shape** from at-target, not just in colour:
- Deviation cell renders **only the target tick**, plus `لا توجد بيانات` 12px `--ink-muted` immediately to the tick's left. No bar, no glyph, no status colour.
- Value cell: `—` in `--ink-muted`.
- Status column: `لم تُسجَّل` on an `--inactive-wash` chip with `--inactive-ink` text (4.77 / 4.68).
- Detail card: the block keeps its name and shows a full-width `--track` strip (320 × 20, `rx:4`) with no fill, plus `آخر قراءة: الأسبوع ٣١ — ٦٫٩ ساعة` in `--ink-muted`.
- `aria-label`: `ساعات الاتصال اليومية: لا توجد قراءات هذا الأسبوع`.

### "Account blocked" state
The account being suspended is the critical fact; **the four measures are not failed, they are not applicable.** Painting four red bars would assert something false, so:
- All four rows switch to the inactive treatment: tick + a full-cell `168 × 14` `--track` strip, no fill, no glyph, values in `--ink-muted` (still 4.33:1). The measures are **never** rendered red.
- A banner above the table carries the critical state, alone:
  - `min-height:40px`, `border-radius:10px`, `padding:10px 14px`, `background:var(--crit-wash)`, `border:1px solid color-mix(in srgb, var(--crit-mark) 28%, transparent)`.
  - 16px lock glyph in `--crit-ink` + `الحساب موقوف لدى أوبر — المؤشرات غير سارية منذ 2026-08-30` (ISO date in Latin, `<bdi dir="ltr">`) 13px `--crit-ink` (9.03 / 6.56).
  - A `تفاصيل الإيقاف` text button, `--crit-ink`, underline offset 3px.
- Table gets `aria-describedby` pointing at the banner. Do **not** use `opacity` on the table — it degrades text contrast below the measured values.

### Accessibility
The row **is** the table, so no separate table view is needed. Each deviation `<td>` holds the bar (`aria-hidden="true"`) plus a `.sr-only` span with the whole sentence:
`ساعات الاتصال اليومية: ٧٫٢ ساعة مقابل هدف ٨ ساعات — أقل من الهدف بنسبة ٪١٠. الحالة: قريب من الحد.`
Keyboard focus on the row shows the same tooltip as hover.

**At 360px:** the row becomes two lines, height 64px. Line 1: measure name (right) + `٧٫٢ / ٨` (left). Line 2: the deviation bar at 116px (tick at 58px, 1% = 1.16px, ±10% ticks at 11.6px) + glyph + the full status word — the word is never truncated to a glyph. The detail-card bar drops to `viewBox="0 0 240 28"` with ±50% = 112px.

---

## 4. City delivery progress — تقدُّم التسليم حسب المدينة

القاهرة الكبرى ٣٥٢ / ٦٠٠ = `٪٥٨٫٧` · الغردقة ٦٦ / ١٥٠ = `٪٤٤٫٠` · programme average ٤١٨ / ٧٥٠ = `٪٥٥٫٧`.

### Mark and why
`choosing-a-form.md`: *"A single ratio against a limit → Meter (same-ramp track)."* Two rows, two meters — not a bar chart, because the two cities have different denominators and the comparable quantity is the **share**, not the count. A shared count axis would make Hurghada look like a rounding error when its real story is that it is 12 points behind on its own target.

To keep the two rows comparable without a count axis, both meters carry a **programme-average benchmark rule** at `٪٥٥٫٧`.

### Geometry
- Row: `display:grid; direction:rtl; grid-template-columns:[name] 120px [meter] minmax(0,1fr) [value] 96px; gap:12px; align-items:center; min-height:44px`. Two rows, `gap:10px`.
- Meter: `block-size:10px; border-radius:5px; background:var(--track); position:relative; overflow:hidden; direction:rtl`.
- Fill: block child, `inline-size:58.7%`, radius 5px on the inline-end (left) corners, 0 on the inline-start (right) corners; the track's radius rounds the baseline end.
- Benchmark rule: `position:absolute; inset-inline-start:55.73%; inset-block:-3px; inline-size:1px; background:var(--ink-muted)` → 16px tall, straddling the 10px meter by 3px each side. Drawn above fill and track. In RTL, `inset-inline-start` measures from the **right** edge, which is the baseline — correct by construction.
- Benchmark label **once**, above the first row only: `متوسط البرنامج ٪٥٥٫٧`, 10.5px `--ink-muted` (label selectively).
- Name cell: 13px weight 600 `--ink-primary`.
- Value cell: `٪٥٨٫٧` 14px weight 600 `--ink-primary`; `٣٥٢ / ٦٠٠` 11.5px `--ink-muted` `tabular-nums` beneath.
- The whole row is a link into the city view; 44px min height satisfies touch.

### Colour by role
| Role | Light | Dark | Contrast vs card |
|---|---|---|---|
| Both fills | `--ramp-4` `#35509A` | `#7B92D6` | 7.41 / 5.76 |
| Track | `--track` `#EDE8DF` | `#22262A` | furniture |
| Benchmark rule | `--ink-muted` `#7E776A` | `#8A8377` | 4.33 / 4.65 |

**Both cities take the same hue.** City is a *nominal* category: colouring the faster city greener would be the "value-ramp on nominal categories" anti-pattern — it re-encodes bar length as hue and burns the identity channel on information the length already carries. Meter length alone carries the comparison.

### Technique
Pure CSS; no SVG. `direction:rtl` on the track makes the fill grow from the right with zero maths.

### Empty / edge states
- **٠ delivered:** no fill element; bare track; value `٪٠` / `٠ / ١٥٠`; row keeps full height.
- **Delivered ≥ target:** fill clamps to 100%; the value cell replaces the percentage with a `✓` in `--pos-ink` + the word `اكتمل`, and the true fraction stays beneath.
- **Target = 0** (city opened, nothing allocated): meter replaced by a flat 10px `--track` strip; value cell reads `لم تُخصَّص كمية` in `--ink-muted` 12px; no benchmark rule (there is no scale to place it on).
- **More than 6 cities** (future): this stops being a two-row meter block and becomes a sorted horizontal bar chart of share, with the count as the direct label — noted so nobody grows the meter list past 6.

### Accessibility
`role="img"` per row: `القاهرة الكبرى: تم تسليم ٣٥٢ من ٦٠٠ — ٪٥٨٫٧، مقابل متوسط برنامج ٪٥٥٫٧`.

**At 360px:** the row stacks to 68px — line 1 name + `٪٥٨٫٧`; line 2 the meter, full width; line 3 `٣٥٢ / ٦٠٠`. The benchmark rule and its single label survive.

---

## 5. Inventory status breakdown — حالة المخزون

Six mutually exclusive states: متاح ١٩٨ · مخصص مبدئياً ٣١ · محجوز بموعد ٦٢ · تحت الترخيص ٧٤ · مُسلَّم ٤١٨ · مرتجع/تحت الفحص ٩. **These sum to ٧٩٢, not ١٬٠٠٠.**

### Scale decision (do this before the colour)
Scale the bar to **١٬٠٠٠**, not to ٧٩٢, and render the missing ٢٠٨ as a seventh `--track`-filled segment labelled `لم تُستلَم من المورِّد`. Scaling to 792 would silently redefine the denominator that §1 uses, and a dashboard whose numbers disagree with each other is worse than one with an extra grey segment. The `--track` segment is chart furniture, not a seventh categorical slot, so the sequence stays at six.

### Mark and why
`choosing-a-form.md`: *"Part-to-whole → stacked bar (go horizontal for many / long-named categories)."* Arabic state names are long → **one horizontal stacked bar**, not tiles (which destroy the part-to-whole) and not a table alone (though a table twin ships).

### Colour logic for states that are "neither good nor bad" — the central call
Swapping محجوز and مُسلَّم changes the meaning: these are **positions in a lifecycle, not identities**. Per `color-formula.md`, that makes them **ordinal**, so the neutral states take **lightness, not hue**:

| Segment | State | Encoding | Light | Dark |
|---|---|---|---|---|
| 1 | متاح بالنقاط · ١٩٨ | ordinal step 1 | `#A0AFD8` | `#3C4E86` |
| 2 | مخصص مبدئياً · ٣١ | ordinal step 2 | `#7C8EC8` | `#4C63A4` |
| 3 | محجوز بموعد · ٦٢ | ordinal step 3 | `#5670B2` | `#6079BE` |
| 4 | تحت الترخيص · ٧٤ | ordinal step 4 | `#35509A` | `#7B92D6` |
| 5 | مُسلَّم · ٤١٨ | **status: positive** | `#0F8047` | `#3AAD74` |
| 6 | مرتجع / تحت الفحص · ٩ | **status: attention** | `#C48610` | `#C88410` |
| — | لم تُستلَم · ٢٠٨ | furniture | `--track` `#EDE8DF` | `#22262A` |

Only the two states that carry a value judgement get a hue, and those hues are **status tokens**, correctly — `color-formula.md`'s collision rule: *"when a series means good/bad it wears status tokens."* Delivered is the one outcome the programme exists to produce; returned/under-inspection is the one exception state. Everything in between is progress, and progress is encoded as darkness. The result: "how much of the bar is green" is the programme's score, at a glance.

**Validation:** the ramp is validated with `--ordinal` (PASS both modes). The two hue boundaries are validated as categorical adjacent pairs: `#35509A ↔ #0F8047` CVD ΔE **20.2** / normal **22.5**; `#0F8047 ↔ #C48610` CVD ΔE **9.2** / normal **21.8** (light); dark `#7B92D6 ↔ #3AAD74` CVD **15.0** / normal **19.8**, `#3AAD74 ↔ #C88410` CVD **9.4** / normal **18.6**. All PASS. Running all six through the *categorical* validator FAILs by design (a ramp spans the lightness band and drops under the chroma floor) — expected, documented, not "fixed".

### Geometry
- Bar container: `block-size:28px; border-radius:6px; overflow:hidden; direction:rtl; display:flex; gap:2px` — the **2px flex gap in the surface colour is the separator**; never a stroke or border around segments.
- Segments: `flex:0 0 calc(<pct>% - 2px)` for the first six, `flex:1 1 auto` on لم تُستلَم so rounding lands in the grey. Segment radius **0**; the container's 6px rounds the two outer ends.
- **Minimum segment width 6px** (`min-inline-size:6px`), overflow absorbed from the largest segment. At 360px the bar is ~328px and مرتجع (0.9%) would be 3px — below the gap width and invisible. This is a deliberate, disclosed distortion of sub-1% segments; the caption says `الشرائح الأقل من ٪١ مُكبَّرة لتظل مرئية` and the table carries exact values.
- Legend: **mandatory** (six meaningful fills). `display:flex; flex-wrap:wrap; gap:10px 16px; margin-block-start:12px; direction:rtl`, lifecycle order. Each item: `10 × 10` swatch `border-radius:3px` with an explicit `background`, + label 12px `--ink-secondary` + count 12px `--ink-primary` `tabular-nums`.
- Inline labels: **measure first, place only if the text fits with ≥ 8px padding both sides.** At a 900px bar, مُسلَّم (376px), متاح (178px) and لم تُستلَم (187px) fit and get their counts inline; the other four (3.1% / 6.2% / 7.4% / 0.9%) do not and get **no** inline label — carried by the legend, the tooltip and the table. Never `overflow:hidden` on segment text.
- In-fill ink is picked by fill luminance: `#FDFCFA` on `#0F8047`, `--ink-primary` on `#A0AFD8`, `--ink-muted` on `--track`.
- Hit target: each segment is a `<button>` with `::after{position:absolute;inset-block:-8px;inset-inline:-9px}` → ≥ 24px wide and 44px tall regardless of segment size.
- Hover/focus: the segment lifts via `filter:brightness(1.08)` (light) / `brightness(1.14)` (dark) — no outline stroke, which would add data-weight ink.

### Technique
Pure CSS flex. No SVG. The 2px gap is `gap`, the rounded ends are the container's radius, the direction is `direction:rtl`.

### Empty / edge states
- **State count 0:** segment **omitted entirely** — never rendered as a 6px sliver, which would lie. Its legend item stays, swatch set to `--track`, label and count in `--inactive-ink`, count `٠`.
- **All units in one state:** single segment; container radius rounds both ends; legend still lists all six with zeros.
- **Counts exceed ١٬٠٠٠** (double-counted unit): the bar renders to its true total and a `--crit-wash` caption appears — `الإجمالي ١٬٠١٤ يتجاوز حجم الدفعة — تحقَّق من البيانات` in `--crit-ink`. Never silently normalise to 100%.

### Accessibility
A `عرض كجدول` toggle (`el.hidden`) reveals a `<table>`: الحالة / العدد / ٪ من الدفعة, with a `<tfoot>` الإجمالي ١٬٠٠٠ / ٪١٠٠. When the table shows, the bar is `aria-hidden="true"`; otherwise the container is `role="img"` with the top three states named. Each segment button's `aria-label`: `تحت الترخيص: ٧٤ دراجة — ٪٧٫٤ من الدفعة`.

**At 360px:** the bar stays (it is the point) at `block-size:24px`; all inline labels disappear (measure: nothing fits); the legend becomes a **2-column grid** with counts right-aligned, and it becomes the primary readout.

---

## 6. Weekly compliance trend — اتجاه ساعات الاتصال (8 weeks)

Series (الأسبوع ٢٥ → ٣٢): `٦٫٤ · ٦٫٩ · ٧٫١ · ٧٫٨ · ٨٫٢ · ٧٫٦ · ٧٫٠ · ٧٫٢`. Target `٨`.

### Mark and why
*"Trend over time → line; area for a single series."* One series, so **no legend box** — the title names it. The target is a **reference line**, not a second series, so it never takes a series colour.

### Geometry
- `viewBox="0 0 220 64"`, rendered `style="inline-size:100%; max-inline-size:280px; block-size:auto"`, `preserveAspectRatio="xMidYMid meet"`. Never `preserveAspectRatio="none"` — it would distort the 2px stroke.
- **Plot band:** `x = 12 … 208` (196 wide), `y = 10 … 46` (36 tall). The 12px side margins hold the end-dot (r 4 + 2px ring = 12px visual); the 10px top band holds the target label; the 18px bottom band (y 46 → 64) holds the week ticks. **The viewBox includes every outermost label** — nothing can clip.
- **y scale** domain `6.0 … 8.6`: `y(v) = 46 − (v − 6.0) / 2.6 × 36`. Target ٨ → `y = 18.3`. Min ٦٫٤ → `y = 40.5`. Max ٨٫٢ → `y = 15.5`.
- **x scale, RTL:** `x(i) = 208 − i × 28` → `208, 180, 152, 124, 96, 68, 40, 12`. Index 0 (الأسبوع ٢٥, oldest) is at the **right**; the newest week is at the **left**. This is the mirror of a Latin sparkline and is the whole RTL treatment for this mark.
- **Line:** `<polyline fill="none" stroke="var(--ramp-3)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` — 2px stays 2px at any render size.
- **Area wash:** the same points closed down to `y=46`, `fill="var(--ramp-4)" fill-opacity="0.10" stroke="none"` — a wash, never a saturated block.
- **Target reference line:** `<line x1="12" y1="18.3" x2="208" y2="18.3" stroke="var(--axis)" stroke-width="1"/>` — **solid**, never dashed. It is the only horizontal rule in the plot, and it is directly labelled, so it cannot be mistaken for a gridline.
- **Target label:** `<text x="208" y="14" direction="rtl" text-anchor="start" font-size="9.5" fill="var(--ink-muted)">الهدف ٨</text>`. Under `direction="rtl"`, `text-anchor="start"` pins the text's **right** edge to x=208 — right-aligned. (`text-anchor="end" x="12"` is the left-aligned form.)
- **Dots — two only,** never one per point:
  - Newest week: `<circle cx="12" cy="40.2" r="4" fill="var(--ramp-4)" stroke="var(--surface-1)" stroke-width="2"/>` — the 2px surface ring.
  - The one week that beat target (الأسبوع ٢٩, ٨٫٢): same geometry, `fill="var(--pos-mark)"` — the extreme, worth marking.
  - Each dot gets a sibling `<circle r="12" fill="transparent">` as a 24px hit area.
- **Week ticks, two only:** `الأسبوع ٢٥` at `x=208, y=58` (`text-anchor="start"`), `الأسبوع ٣٢` at `x=12, y=58` (`text-anchor="end"`), 9.5px `--ink-muted`.
- **Value label in HTML, not SVG** (avoids SVG text metrics and bidi entirely): `٧٫٢ ساعة` 13px weight 600 `--ink-primary`, `هذا الأسبوع` 11px `--ink-muted` beneath, sitting to the sparkline's right.
- Block: 88px tall, `padding:12px`, no border — it lives inside the §3 detail card.

### Colour by role
| Role | Light | Dark | Contrast vs card |
|---|---|---|---|
| Line | `--ramp-3` `#5670B2` | `#6079BE` | 4.70 / 4.14 |
| Area wash | `--ramp-4` @ 10% | `#7B92D6` @ 10% | wash |
| End dot (newest) | `--ramp-4` `#35509A` | `#7B92D6` | 7.41 / 5.76 |
| Above-target dot | `--pos-mark` `#0F8047` | `#3AAD74` | 4.88 / 6.16 |
| Dot ring | `--surface-1` `#FDFCFA` | `#171A1D` | — |
| Target line | `--axis` `#CFC8BB` | `#373B40` | 1.62 / 1.55 |
| Tick + target text | `--ink-muted` `#7E776A` | `#8A8377` | 4.33 / 4.65 |

### Empty / edge states
- **Fewer than 2 weeks:** no polyline, no wash. Render the target line plus `تحتاج أسبوعين على الأقل لعرض الاتجاه`, 11.5px `--ink-muted`, centred in the plot band. A single week renders the end-dot alone.
- **Gaps inside the series:** **break the line.** Render one `<polyline>` per contiguous run; at each missing week's x, draw a `3 × 3` `--ink-muted` square on `y=46`. Never interpolate across a gap — a straight line through a missing week asserts data that does not exist.
- **A value outside the domain** (> 8.6 or < 6.0): the domain expands to `[min − 0.3, max + 0.3]` rounded to 0.5, and the target line moves with it. The domain is never hard-coded at render time.

### Accessibility
```html
<figure role="img" aria-label="ساعات الاتصال الأسبوعية لآخر ٨ أسابيع: من ٦٫٤ في الأسبوع ٢٥ إلى ٧٫٢ في الأسبوع ٣٢.
الهدف ٨ ساعات؛ تم تجاوزه في أسبوع واحد فقط (الأسبوع ٢٩، ٨٫٢ ساعة).">
```
plus a `.sr-only` 8-row `<table>` (الأسبوع / الساعات / مقابل الهدف). Crosshair + tooltip on hover **and** keyboard focus, snapping to the nearest week; the tooltip never gates a value that the table does not also carry.

**At 360px:** the SVG scales to ~240px on the same viewBox; the two week ticks sit at the extremes and cannot collide; the target label stays; the above-target dot loses nothing (it has no label). **Below 320px** the SVG is swapped (`el.hidden`) for one sentence: `٧٫٢ ساعة هذا الأسبوع، مقابل ٦٫٤ قبل ٨ أسابيع — الهدف ٨`.

---

## 7. The token block — semantic + categorical

Validated with `scripts/validate_palette.js` against **this page's own surfaces**, not the skill's defaults.

### Validator results (verbatim)

```
node validate_palette.js "#0F8047,#C48610,#962019,#35509A" --mode light --surface "#FDFCFA" --pairs all
  [PASS] Lightness band        all 4 inside L 0.43–0.77
  [PASS] Chroma floor          all 4 >= 0.1
  [PASS] CVD separation        worst all-pairs #962019↔#0F8047 ΔE 8.3 (deutan) · tritan 9.3
  [PASS] Normal-vision floor   worst all-pairs #C48610↔#0F8047 ΔE 21.8 (normal)
  [PASS] Contrast vs surface   all 4 >= 3:1
  → ALL CHECKS PASS

node validate_palette.js "#3AAD74,#C88410,#C04046,#7189D6" --mode dark --surface "#171A1D" --pairs all
  [PASS] Lightness band        all 4 inside L 0.48–0.67
  [PASS] Chroma floor          all 4 >= 0.1
  [PASS] CVD separation        worst all-pairs #C88410↔#3AAD74 ΔE 9.4 (deutan) · tritan 6.3
  [PASS] Normal-vision floor   worst all-pairs #C04046↔#C88410 ΔE 17.2 (normal)
  [PASS] Contrast vs surface   all 4 >= 3:1
  → ALL CHECKS PASS

node validate_palette.js "#A0AFD8,#7C8EC8,#5670B2,#35509A" --ordinal --mode light --surface "#FDFCFA"
  [PASS] monotone · [PASS] ΔL >= 0.06 · [PASS] light-end 2.13:1 · [PASS] single hue (4°)  → ALL CHECKS PASS

node validate_palette.js "#3C4E86,#4C63A4,#6079BE,#7B92D6" --ordinal --mode dark --surface "#171A1D"
  [PASS] monotone · [PASS] ΔL >= 0.06 · [PASS] light-end 2.18:1 · [PASS] single hue (1°)  → ALL CHECKS PASS

hue boundaries of the inventory sequence, categorical adjacent:
  light #35509A↔#0F8047  CVD 20.2 / normal 22.5   → PASS
  light #0F8047↔#C48610  CVD  9.2 / normal 21.8   → PASS
  dark  #7B92D6↔#3AAD74  CVD 15.0 / normal 19.8   → PASS
  dark  #3AAD74↔#C88410  CVD  9.4 / normal 18.6   → PASS
```

Running the **full six-colour** inventory sequence through the *categorical* validator FAILs by design — a one-hue ramp spans the lightness band and drops under the chroma floor. That is the expected result described in `color-formula.md` § Scope; the correct gates are the two runs above (ordinal for the ramp, categorical for the hue boundaries), and both pass in both modes.

`--pairs all` was used throughout because these colours appear as vertically stacked table rows, chips and legend swatches, where any two can sit side by side. All-pairs is the stricter test.

### The CSS

```css
:root{
  color-scheme: light;

  /* --- surfaces & chrome (warm hue-biased neutrals) --- */
  --page:           #F7F5F2;   /* page plane                      */
  --surface-1:      #FDFCFA;   /* card / chart surface            */
  --track:          #EDE8DF;   /* unfilled meter & bar tracks     */
  --line:           #E2DCD2;   /* hairline card border   1.33:1   */
  --grid:           #E7E2D9;   /* minor ticks            1.26:1   */
  --axis:           #CFC8BB;   /* axis & target tick     1.62:1   */

  /* --- ink --- */
  --ink-primary:    #1A1713;   /* 17.42:1 */
  --ink-secondary:  #4C463D;   /*  9.10:1 */
  --ink-muted:      #7E776A;   /*  4.33:1 */

  /* --- semantic: MARK step (fills, bars, meters, dots) — all >= 3:1 --- */
  --pos-mark:       #0F8047;   /* positive              4.88:1 */
  --att-mark:       #C48610;   /* attention             3.03:1 */
  --crit-mark:      #962019;   /* critical              8.14:1 */
  --info-mark:      #35509A;   /* neutral-informational 7.41:1 */
  --inactive-mark:  #8C857A;   /* inactive              3.56:1 */

  /* --- semantic: INK step (chip text, glyphs, delta text) — all >= 4.5:1 --- */
  --pos-ink:        #0B6A3B;   /*  6.52:1 */
  --att-ink:        #7A5406;   /*  6.61:1 */
  --crit-ink:       #8A1D16;   /*  9.03:1 */
  --info-ink:       #2C4483;   /*  9.06:1 */
  --inactive-ink:   #6E675D;   /*  5.45:1 */

  /* --- semantic: WASH step (chip & banner backgrounds) --- */
  --pos-wash:       #E5F0E8;   /* --pos-ink on it       5.72:1 */
  --att-wash:       #F6EEDE;   /* --att-ink on it       5.88:1 */
  --crit-wash:      #F4E8E6;   /* --crit-ink on it      7.73:1 */
  --info-wash:      #EBEDF1;   /* --info-ink on it      7.92:1 */
  --inactive-wash:  #EEEDE9;   /* --inactive-ink on it  4.77:1 */

  /* --- categorical sequence of 6, inventory states (lifecycle order) --- */
  --inv-1: #A0AFD8;  /* متاح بالنقاط        ordinal 1   2.13:1 */
  --inv-2: #7C8EC8;  /* مخصص مبدئياً        ordinal 2   3.12:1 */
  --inv-3: #5670B2;  /* محجوز بموعد         ordinal 3   4.70:1 */
  --inv-4: #35509A;  /* تحت الترخيص         ordinal 4   7.41:1 */
  --inv-5: #0F8047;  /* مُسلَّم               = --pos-mark   */
  --inv-6: #C48610;  /* مرتجع / تحت الفحص    = --att-mark   */
  /* not a slot — furniture: لم تُستلَم uses --track */

  /* aliases used by the funnel's ordinal ramp */
  --ramp-1: var(--inv-1); --ramp-2: var(--inv-2);
  --ramp-3: var(--inv-3); --ramp-4: var(--inv-4);
}

/* dark: same six hue families, re-stepped for the dark surface and
   re-validated as a set — never an automatic inversion. The ordinal
   ramp's anchor flips: on dark, step 1 is the DARKEST.              */
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    color-scheme: dark;
    --page:#0F1113; --surface-1:#171A1D; --track:#22262A;
    --line:#2A2E33; --grid:#262A2E; --axis:#373B40;
    --ink-primary:#F3F0EA; --ink-secondary:#B6AFA3; --ink-muted:#8A8377;
    --pos-mark:#3AAD74;  --att-mark:#C88410;  --crit-mark:#C04046;
    --info-mark:#7189D6; --inactive-mark:#79726A;
    --pos-ink:#57C68D;   --att-ink:#E0A63C;   --crit-ink:#EB8076;
    --info-ink:#96A9E5;  --inactive-ink:#9A9288;
    --pos-wash:#1D322B;  --att-wash:#372D1B;  --crit-wash:#352124;
    --info-wash:#252C3B; --inactive-wash:#292A2B;
    --inv-1:#3C4E86; --inv-2:#4C63A4; --inv-3:#6079BE; --inv-4:#7B92D6;
    --inv-5:#3AAD74; --inv-6:#C88410;
  }
}
:root[data-theme="dark"]{
  color-scheme: dark;
  --page:#0F1113; --surface-1:#171A1D; --track:#22262A;
  --line:#2A2E33; --grid:#262A2E; --axis:#373B40;
  --ink-primary:#F3F0EA; --ink-secondary:#B6AFA3; --ink-muted:#8A8377;
  --pos-mark:#3AAD74;  --att-mark:#C88410;  --crit-mark:#C04046;
  --info-mark:#7189D6; --inactive-mark:#79726A;
  --pos-ink:#57C68D;   --att-ink:#E0A63C;   --crit-ink:#EB8076;
  --info-ink:#96A9E5;  --inactive-ink:#9A9288;
  --pos-wash:#1D322B;  --att-wash:#372D1B;  --crit-wash:#352124;
  --info-wash:#252C3B; --inactive-wash:#292A2B;
  --inv-1:#3C4E86; --inv-2:#4C63A4; --inv-3:#6079BE; --inv-4:#7B92D6;
  --inv-5:#3AAD74; --inv-6:#C88410;
}
```

**Dark-mode contrast, measured** (vs card `#171A1D`): pos-mark 6.16 · att-mark 5.63 · crit-mark 3.38 · info-mark 5.20 · inactive-mark 3.68 · pos-ink 8.21 · att-ink 8.06 · crit-ink 6.56 · info-ink 7.57 · inactive-ink 5.69 · ink-primary 15.36 · ink-secondary 8.03 · ink-muted 4.65 · inv-1 2.18 (relief required) · inv-2 3.02 · inv-3 4.14 · inv-4 5.76.

### Rules that come with these tokens

1. **Status colours are reserved.** `--pos-* / --att-* / --crit-*` never stand in for "series 4". The only place a status token also serves as a chart fill is inventory segments 5 and 6, where the state genuinely *means* delivered/returned — the collision rule permits exactly that.
2. **Every status carries an icon and a word**, never colour alone: `✓ تحقَّق` · `! قريب من الحد` · `✕ لم يتحقَّق` · `⊘ موقوف` · `— لم تُسجَّل`.
3. **Green stays scarce.** `--pos-mark` appears on exactly three marks in the whole console — the delivered KPI meter, the delivered inventory segment, and the good arm of the compliance gauge — plus the logo. Nowhere else. That scarcity is what makes it mean something.
4. **Text never wears a mark colour.** Values, axis text and legends take `--ink-*`. Where a status colour must appear in text (a chip, a delta, a banner), it takes the **ink** step, not the mark step. The one exception is a label set inside a coloured fill, where ink is picked by the fill's luminance.
5. **`--info-mark` is the accent**, and it is the *only* hue that may appear without semantic meaning. It is the deep serious note the direction asks for; the whole ordinal ramp is its family.
6. **`--inactive-mark` sits below the chroma floor on purpose** — it reads as grey, which is exactly its job (de-emphasis / "Other"). It is chart furniture, outside the categorical checks; its contrast is measured as text instead (5.45 / 5.69 for the ink step).
7. **Never generate a seventh inventory colour.** A seventh state folds into `أخرى` with `--inactive-mark`, or the bar becomes a table.
8. **No dual-axis charts anywhere.** §2's two panels are two plots side by side, each with its own labelled scale — never two scales on one plot.
9. **Texture** (45° / 135° hand-drawn lines, tone-on-tone, ordered on value scales) is defined but **off by default** — it turns on only under `forced-colors`, print, or the console's accessibility setting.
10. Every chart on this page ships a **table twin** and a hover/focus tooltip. Tooltips enhance; they never gate a value.
