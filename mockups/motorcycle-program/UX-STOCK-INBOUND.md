# الوارد وإدارة مخزون نقطة التوزيع — مواصفة
**Inbound & Point Stock Management — Specification**

Trade Way × Uber motorcycle-ownership programme · Greater Cairo + Hurghada
Surface: **phone only**, 375 px design width, RTL, Arabic (Egyptian dialect for anything read aloud)
Status: v1 for client confirmation. Every invented rule is marked `[قرار مقترح]`.
Extends — never contradicts — `UX-DISTRIBUTION-POINT.md`. Component vocabulary: `DESIGN-SYSTEM.md` §5 only; the one new component is justified in §10.

---

## 0. The four sentences this document defends

1. **The portal never creates sellable stock.** No action in this portal can write `متاح`. The point receives, counts, photographs, flags and hands over. Only the console — after licensing, or after a workshop pass — flips a unit to `متاح`. This is the inbound twin of "the point executes; it never decides".
2. **A motorcycle exists in the system before it exists at the point.** Every unit arrives against a numbered consignment (`إذن توريد`). A unit that arrives without one is not received; it is impounded as evidence.
3. **Arrival and licensing are two different events.** A unit can be physically present, fully counted, photographed and accepted, and still not be reservable, because it has no plate. Conflating the two is how a captain gets booked against a motorcycle that cannot legally leave the yard.
4. **Idle stock is the point's problem to surface and the console's problem to solve.** The point is told, in days, what is sitting still. It may request movement. It may never move a unit itself.

---

## 1. Actors

| Actor | Where | What they do in this document |
|---|---|---|
| `مسؤول المخزون` | console | Creates consignments, closes discrepancies, flips units to `متاح`, records licensing. |
| `مدير التشغيل` | console | Approves every inter-point transfer. Owns the escalation of persistent variance. |
| `الورشة` | console | Records inspection outcomes on returned units. |
| `الناقل` (transporter) | physical | Delivers. Signs on the point's phone. Never has a login. |
| `مدير النقطة` | portal | Opens and closes a receive session, signs a receipt, signs the weekly full count, requests stock, requests a transfer. |
| `مشغّل` | portal | Scans units, shoots condition photos, records odometer — inside a session the manager opened. |

`[قرار مقترح]` A receive session is **opened and closed by the manager only**; an operator may do the scanning inside it. A showroom that can receive 20 motorcycles unwitnessed is a showroom that can lose one.

---

## 2. Upstream — the consignment (`إذن توريد`)

### 2.1 What it is

A consignment is the only legal vehicle by which a unit changes location. It carries:

| Field | Owner | Rule |
|---|---|---|
| `رقم الإذن` | console | Format `CN-2026-0418`. Generated, never typed. |
| `النوع` | console | One of `توريد من مورّد` · `تحويل بين نقطتين` · `مرتجع` · `رجوع من الورشة`. |
| `المصدر` | console | Supplier name, or the sending point, or the workshop. |
| `الوجهة` | console | Exactly one destination point. A consignment never splits across two points. |
| `الوحدات` | console | A line per unit, keyed on the **full 17-character chassis**. Plate may be empty. |
| `الوصول المتوقع` | console | A date and a time window. |
| `الناقل` | console | Company name, driver name, driver mobile, vehicle plate. |
| `ملاحظات` | console | Free text, visible to the point. |

A consignment line is a chassis, not a quantity. `٢٠ موتوسيكل` is not a manifest; twenty chassis numbers is a manifest.

### 2.2 States before arrival

| State | Meaning | Who moves it here |
|---|---|---|
| `مسودة` | Being built in the console. Invisible to the point. | `مسؤول المخزون` |
| `مجدولة` | Published. The point can see it under `جاي`. Nothing has moved physically. | `مسؤول المخزون` |
| `في الطريق` | Dispatch confirmed. Units have left the source. | `مسؤول المخزون`, or the sending point manager on P20 for a transfer |
| `وصلت — جارٍ الاستلام` | A receive session is open at the destination. | `مدير النقطة` (destination) |
| `مستلمة كاملة` | Every line received, no discrepancy. Terminal. | destination, on closing the session |
| `مستلمة بفروقات` | Session closed with at least one open discrepancy. Terminal for the consignment; the discrepancy case lives on. | destination, on closing the session |
| `ملغاة` | Cancelled before any unit was received. Terminal. | `مسؤول المخزون` |

**Derived badge, not a state:** `متأخرة` appears on a `في الطريق` consignment at **dispatch + 48 hours** for a Cairo↔Cairo movement and at **dispatch + 96 hours** for anything involving Hurghada. `[قرار مقترح]` It raises `inbound.consignment_overdue` and shows on the point's `جاي` tab as an attention pill. It never changes the state.

### 2.3 Who creates, who cancels

- **Creates:** `مسؤول المخزون` in the console. A point manager may *request* stock (P22) — this creates a request item, never a consignment.
- **Cancels:** `مسؤول المخزون` only, and only while the consignment is `مسودة`, `مجدولة`, or `في الطريق` **with zero units received**.
- **Once one unit has been received, the consignment can never be cancelled.** It must be closed through the receive session, as `مستلمة كاملة` or `مستلمة بفروقات`. There is no path that makes a received motorcycle un-received. `[قرار مقترح]`
- **Editing a `في الطريق` manifest is forbidden.** A chassis loaded by mistake is handled at arrival as an unexpected unit (§3.4), not by quietly adding a line while the truck is moving. Adding a line to a manifest after dispatch is the single easiest way to launder a stolen unit into the fleet.

---

## 3. Arrival at the point

### 3.1 Opening the session — P18 / R1

The manager taps a consignment on **P17** and then `ابدأ الاستلام`. The portal requires, before any unit is scanned:

- Driver name and mobile, typed (`.lat`, `inputmode="numeric"` on the mobile).
- Transport vehicle plate, typed.
- One photo: the loaded truck with its tail open. Camera only; the gallery is not wired, exactly as in P4.3.
- `عدد الوحدات في الإذن` is displayed, not entered.

Opening emits `inbound.receive_started` and moves the consignment to `وصلت — جارٍ الاستلام`. **The day does not need to be open (P1) to receive a consignment** — trucks arrive at 06:30. `[قرار مقترح]`

Only one receive session may be open at a point at a time. A second consignment arriving mid-session queues; the portal blocks with E-45.

### 3.2 Scanning a unit — R2, the core screen

Per unit: `امسح الشاسيه بالكاميرا` (barcode / VIN sticker) with `اكتب الرقم بنفسي` as the fallback. Comparison ignores spaces, dashes and case; Arabic-Indic and Latin digits are normalised — identical to P4.4. Manual entry is permitted, written to the record as `إدخال يدوي`, and **more than 5 manual entries in one receive session raises a console flag.** `[قرار مقترح]`

Six possible outcomes, and only six:

| Scan result | Portal does | Unit lands |
|---|---|---|
| On this manifest, not yet scanned | Accepts. Opens the condition capture (R3) for that unit. | `وصلت — تحت فحص الوارد` |
| On this manifest, already scanned in this session | Blocks, E-41. No duplicate line is created. | unchanged |
| **Not on this manifest**, but on another open consignment | **Hard block.** Duplicate-consignment case (§3.6). | `موقوف — تحقيق` |
| **Not on this manifest**, exists in the registry, belongs elsewhere | **Hard block.** Cannot be accepted. Chassis photo mandatory. | `موقوف — تحقيق` |
| **Not on this manifest**, unknown to the registry entirely | **Hard block.** Chassis photo + note ≥ 20 chars mandatory. | `موقوف — وحدة غير مسجّلة` |
| On this manifest, but registry state reads `مُسلّم` | **Critical stop of the whole session.** Pages ops out of band, as E11 does. | `موقوف — تحقيق` |

In every blocked case the unit is **still physically present**. The portal records custody without granting stock: a blocked unit appears on P11 under `واقف`, is excluded from every count, every coverage calculation and every ageing clock, and can never be reserved.

**A manifest line that never arrives** is not actioned during scanning. It simply remains unscanned, and R4 catches it. There is no `مش موجودة` button per line during scanning — a button that marks a unit missing before the truck is empty will be tapped in error twenty times a week.

### 3.3 Condition on arrival — R3

Per accepted unit, four mandatory slotted capture tiles (§10, the `كاميرا بخانة محددة` component already justified in the portal spec §11.1):

`أمام` · `خلف` · `جنب` · `العداد ورقم الشاسيه`

Plus:
- **Odometer**, typed, km. Above **15 km** → `تنبيه` with a mandatory note. Above **80 km** → the unit is auto-flagged `تلف/تحفّظ` and cannot be accepted clean. `[قرار مقترح]` These are tighter than the handover thresholds (50 / 200) deliberately: km accumulated before arrival is transport km, and it is the supplier's or transporter's, not the captain's.
- **`فيه تلف؟`** — a §5.4 option-card pair, `سليمة` / `فيها تلف`. Default unselected; the step will not commit without a choice.
- If `فيها تلف`: two extra close-up photos, a note ≥ 20 characters, and a §5.4 pick of `خدش/دعك` · `كسر بلاستيك` · `تلف ميكانيكي` · `ناقص ملحقات` · `تلف نقل واضح`.

Missing accessories (helmet, keys, toolkit) are recorded here, not at handover. A unit that arrives with one key is a supplier discrepancy and must be caught on the truck.

**`استلام سريع` — the transporter will not wait.** `[قرار مقترح]` The manager taps `المندوب مش مستني` and confirms C-12. The session switches to chassis-scan-only: no condition photos, no odometer. The transporter signs the **count** (R5) and leaves. The units sit in `وصلت — تحت فحص الوارد` and:
- They are **not accepted**. They cannot be reserved, do not count as stock, and do not appear as available anywhere.
- The evidence window closes at **receipt + 4 hours**, or at day close, whichever comes first.
- Inside the window, P11 shows a persistent attention banner with the remaining time and a `كمّل صور الوصول` action.
- If the window lapses, the portal emits `inbound.evidence_window_lapsed`, the units stay frozen in `وصلت — تحت فحص الوارد`, and a console case `استلام ناقص الأدلة` opens against the point. The point can still complete the photos afterwards; the case records that it was late. Nothing unfreezes without the console.

This is the honest trade: the truck leaves on time, and the point does not get stock until the evidence exists.

### 3.4 Reconciliation — R4

A read-mostly summary, in four blocks, each collapsible, each with its count in the header:

1. **`اتستلمت سليمة`** — count only, collapsed.
2. **`وصلت بتلف`** — a card per unit with its damage thumbnail.
3. **`في الإذن وما وصلتش`** — every unscanned manifest line. Per line, one mandatory pick: `مش موجودة على العربية` / `المندوب قال هتوصل في شحنة تانية`. No free text here; free text goes in the case.
4. **`وصلت ومش في الإذن`** — the blocked units of §3.2, listed read-only with their reason.

If blocks 2, 3 or 4 are non-empty, closing the session **will** open a discrepancy case (§5). The manager cannot opt out, and cannot choose the category.

### 3.5 Closing — R5

- The full count is restated: `الإذن ٢٠ · اتستلم ١٨ · بتلف ١ · ناقص ٢ · زيادة ١`.
- **Transporter signature** on the `لوحة التوقيع` component (portal spec §11.2), captioned `توقيع مندوب النقل`, with his name printed beneath it. Same ≥ 2 strokes / ≥ 1.5 s rule.
- **Manager PIN re-auth.** The operator cannot close a receive session.
- Emits `inbound.consignment_closed`, plus `inbound.discrepancy_opened` when applicable.
- Produces `إيصال استلام شحنة` — a receipt screen with a reference, sendable by SMS to the transporter's number, and stored on P14.

If the phone is offline, everything above works; the session queues on P15 exactly like a handover, and the consignment shows `مقفولة — بانتظار المزامنة`.

### 3.6 Partial acceptance — the four named cases

**(a) 18 of 20 arrive.** The 18 are accepted normally. The 2 become `مفقودة — تحت البحث`. The consignment closes as `مستلمة بفروقات`. **One** case is opened for the consignment, listing both lines — not two cases. The point is never asked to wait for the missing units before accepting the present ones. Holding 18 motorcycles hostage to 2 missing ones is how a point ends up with a yard full of uncountable stock.

**(b) One arrives damaged.** It is received — custody is recorded — but it lands in `موقوف — تلف نقل`, not in `وصلت — تحت فحص الوارد`. It is frozen: never reservable, excluded from coverage, but **included in the physical count** on P21, because it is physically there. Its case is `تلف أثناء النقل` and it must carry the transporter's signature from R5; a damage claim without the transporter's signature on the receipt is not a claim. A `موقوف — تلف نقل` case still open at **day 7** escalates to `مدير التشغيل`. `[قرار مقترح]`

**(c) A chassis duplicated across two consignments.** The second scan is hard-blocked. The unit goes to `موقوف — تحقيق`, **both** consignments are flagged in the console, and the case is priority 1 with the same out-of-band page as E11. The point is shown only: `الوحدة دي مسجّلة في إذن تاني. وقفناها وبلّغنا الإدارة.` It is never told which other point or which other consignment — a chassis appearing twice is a fraud signal, and the person holding it does not get the map.

**(d) The transporter will not wait for a full count.** §3.3, `استلام سريع`. Note the asymmetry that makes it safe: the **count** is always done with the transporter present — that is what he signs — and only the **condition evidence** is deferred. A point may never defer the count itself.

---

## 4. What flips a unit to sellable

### 4.1 The two gates

A unit is reservable for an appointment only when **both** are true:

1. **Physical acceptance** — received on a closed consignment, four condition photos on file, odometer recorded, no open damage flag.
2. **Licensing** — plate number and licence issue date recorded in the console registry, licensed to Trade Way, with the licence document scanned.

Gate 1 is the point's work. Gate 2 is Trade Way's. Neither can be satisfied by the other.

### 4.2 The states this produces

| State | Physically at the point | Reservable | Counts toward coverage | Appears in the daily count (P1) |
|---|---|---|---|---|
| `في الطريق` | no | no | forecast line only | no |
| `وصلت — تحت فحص الوارد` | yes | **no** | no | yes, as `وارد` |
| `مستلمة — تحت الترخيص` | yes | **no** | no | yes |
| `متاح` | yes | **yes** | yes | yes (10% sample) |
| `مخصص مبدئيًا لتفعيل الحساب` | yes | **no** | no | yes |
| `محجوز لميعاد` | yes | held | no (already committed) | yes, 100% |
| everything `موقوف…` / `مرتجع…` | yes | **no** | no | yes |

**The rule, stated once:** *a unit may be reserved for an appointment only from `متاح`, and a unit reaches `متاح` only by a console write.* The portal has no control anywhere that produces `متاح`. `مستلمة — تحت الترخيص` → `متاح` is a console transition triggered by the plate being recorded.

### 4.3 Licensing ageing

A unit in `مستلمة — تحت الترخيص` is capital that is already paid for and cannot be sold. The point sees the clock even though it cannot act on it, because the point is the one being asked every morning why it has 30 motorcycles and no stock:

- **Day 10** since receipt → attention pill `تأخر ترخيص` on the unit card, and a count on the `واقف` tab.
- **Day 21** → critical pill, and `stock.licensing_overdue` fires to the console once per unit.

The point's only action is `اسأل عن الترخيص`, which appends a note to the console's licensing queue. It cannot chase, resolve, or reserve around it. `[قرار مقترح]`

---

## 5. The discrepancy case — its own flow

A discrepancy is not an escalation from a handover, and it must not land in the `حالات نقاط التوزيع` queue with the captain-facing SLA clocks. It has its own queue: **`فروقات المخزون`**.

### 5.1 Categories — fixed, chosen by the system, never by the point

`ناقص في الشحنة` · `تلف أثناء النقل` · `وحدة زيادة مش في الإذن` · `وحدة غير مسجّلة` · `شاسيه مكرر` · `فرق جرد` · `فرق جرد متكرر` · `استلام ناقص الأدلة`

### 5.2 Evidence captured automatically

Consignment number, the manifest line, every scan with its timestamp and scan-vs-manual flag, the condition photos, the damage photos and note, the truck photo, the driver's name / mobile / vehicle plate, the transporter's signature, the manager who closed the session, the device id, and the coarse geo of the point.

The manager adds nothing except the R4 per-line pick and, optionally, a ≤ 60-second voice note.

### 5.3 Who is notified

| Category | Notified, immediately | Grade |
|---|---|---|
| `ناقص في الشحنة` | `مسؤول المخزون` + the source (supplier contact or the sending point's manager) | attention |
| `تلف أثناء النقل` | `مسؤول المخزون` + the transport contract owner | attention |
| `وحدة زيادة مش في الإذن` | `مسؤول المخزون` | attention |
| `وحدة غير مسجّلة` | `مسؤول المخزون` + `مدير التشغيل` | critical |
| `شاسيه مكرر` | `مدير التشغيل` + programme lead, push **and** SMS | priority 1, out of band |
| `فرق جرد متكرر` | `مدير التشغيل` | critical |
| `استلام ناقص الأدلة` | `مسؤول المخزون` | attention |

### 5.4 What the point sees while it is open

On **P11**, a `محتاج ردّ` tab carries a count badge. Each open discrepancy is one card: category pill, unit or count, age in days with a `.lat` figure, and the last console note. The point may add a note and attach up to 4 camera photos. It may not close, re-categorise, or reopen. The affected units keep their frozen state and show `موقوف — في فرق مفتوح` on their unit card, with the case reference.

### 5.5 How it closes

Only from the console, with exactly one outcome per unit, each of which maps to a portal-visible result:

| Console outcome | Portal effect |
|---|---|
| `اتلاقت — استلمها` | The unit reappears in the open receive flow as a single-unit receipt (P18 with a one-line manifest). |
| `اتشطبت على المورّد` | Unit → `مشطوبة`. Leaves the point's stock. A positive notice names the reference. |
| `تحويلها للورشة` | Unit → `خارج الخدمة — في الورشة`. The point arranges nothing; an outbound transfer consignment is created for it. |
| `سجّلناها للنقطة` | The extra / unregistered unit is registered against this point and enters `مستلمة — تحت الترخيص`. |
| `مسؤولية النقطة` | Unit → `مشطوبة` and a financial item is raised against the point in the console. Portal shows only `اتقفلت من الإدارة` and the reference; the amount is never shown in the portal. |

---

## 6. Transfers between points

### 6.1 Approval

- A point may **request** — either direction: `اطلب وحدات` (I need stock) or `اطلب سحب وحدات` (take this idle stock off me), both on **P22**.
- `مسؤول المخزون` creates the transfer consignment.
- **`مدير التشغيل` approves every transfer, without exception.** `[قرار مقترح]` No unit-count threshold, no auto-approval. Six points and a 1,000-unit batch do not generate enough transfers to justify an approval tier, and a tier is what gets abused at 3,000.
- Neither point manager approves anything. The sending manager confirms **dispatch** (a physical act); the receiving manager confirms **receipt** (a physical act).

### 6.2 The outbound leg — P20

Mirror of the receive runner, three steps:

1. **`طابق المندوب`** — driver name, mobile, vehicle plate, truck photo. Same as R1.
2. **`امسح الوحدات اللي بتطلع`** — each unit scanned off. A unit that is not on the transfer order is hard-blocked (E-47). A unit in `محجوز لميعاد` is hard-blocked (E-48) — the console must release the reservation first; a showroom cannot ship a motorcycle a captain is booked against tomorrow. Four condition photos per unit, same slots as R3, because the sender's photos are the baseline for any damage claim against the transporter.
3. **`توقيع المندوب`** — transporter signature + sending-manager PIN.

On close, `transfer.dispatch_confirmed` fires and every scanned unit moves to `في الطريق`.

### 6.3 How an in-transit unit is counted

**It belongs to neither point.** `[قرار مقترح]` Precisely:

- It **leaves the sender's stock at the dispatch scan**, not at approval and not at receipt. The sender's yard and the sender's numbers must agree the moment the motorcycle rolls onto the truck; a unit that is both "gone" and "mine" is the unit that goes missing.
- It is **not in the receiver's stock** until the receive session closes. It is shown to the receiver on the `جاي` tab with an ETA, and it feeds a **separate** forecast line, `التغطية مع الوارد`, never `متاح`.
- At network level it sits in a `في الطريق` bucket owned by `مسؤول المخزون`, which is exactly where a late consignment must be visible.
- **Custody and risk sit with the transporter** between the two signatures. That is what the two signatures are for, and it is the reason the outbound leg photographs every unit.

A transfer that goes overdue (§2.2 thresholds) raises the case against the **transport contract**, not against either point.

### 6.4 The inbound leg

Identical to §3, with two differences: the consignment type is `تحويل بين نقطتين`, and a discrepancy is notified to the sending point's manager as well as `مسؤول المخزون`. The sending point sees its own dispatch photos alongside the receiving point's arrival photos in the console — this is the whole reason both legs photograph.

---

## 7. Returns into the point

### 7.1 What a return is

Four sources, and they are not interchangeable:

| Source | Console creates | Unit arrives as |
|---|---|---|
| `استرداد` — repossessed from a captain | `إذن مرتجع` type `استرداد` | `مرتجع — تحت الفحص` |
| `عطل` — defect reported at handover (P12), unit never left | no consignment — the unit never moved | `مرتجع — تحت الفحص` (already set by `unit.defect_reported`) |
| `رجوع من الورشة` | consignment type `رجوع من الورشة` | `مرتجع — تحت الفحص` |
| `إلغاء بعد الحجز` — appointment cancelled, unit untouched | no consignment | console returns it to `متاح` directly |

A repossessed unit **always** arrives on a consignment, even when it is driven in by a Trade Way recovery agent, because the chain of custody on a repossession is the thing most likely to be disputed.

### 7.2 The inspection it needs

The receive flow is P18 with one extra mandatory step inserted between R3 and R4, **only for `استرداد` and `رجوع من الورشة`**:

**R3b · `فحص المرتجع`**
- The same **10-item functional checklist** as the handover inspection (P4.5), each `سليم` / `فيه عيب` — reusing it means the return is measured against the exact baseline the captain signed.
- **8 photos**, the same named slots as P4.5, not the 4 arrival slots. A return is compared photo-for-photo against the handover set; four photos cannot be compared against eight.
- Odometer, typed. The delta against the handover reading is computed and displayed, read-only.
- `الملحقات الراجعة` — checkboxes: `مفتاحين` · `خوذة` · `ملف الورق` · `كارت مراكز الخدمة`. Anything missing is written to the case, and missing accessories on a repossession are a financial item the console raises.
- Damage note ≥ 20 characters, mandatory, regardless of the checklist result.

### 7.3 How it re-enters stock, and whether it can be re-allocated

- On close, the unit stays `مرتجع — تحت الفحص`. **The portal has no control that moves it forward.**
- The console routes it: `خارج الخدمة — في الورشة`, or `مشطوبة`, or — only after a recorded workshop pass and a licence check — `متاح`.
- **A returned unit that re-enters `متاح` is permanently flagged `وحدة مستعملة`** with its returned odometer reading stored. `[قرار مقترح]` The flag rides with the unit for the rest of its life. It is shown on the unit card in the portal and on the captain card (P3) at the next handover, so the operator at P4.4 knows what he is handing over. Whether a used unit may be offered on programme terms written for a new one is a contractual question — §12.
- Ageing while it waits: **day 5** → attention on the `واقف` tab; **day 14** → critical and `stock.return_inspection_overdue`. A returned motorcycle sitting uninspected for two weeks is a total loss accruing quietly.

---

## 8. The unit state diagram, in words

### 8.1 Every state

| # | State | Where the unit is | Reservable |
|---|---|---|---|
| 1 | `مسجّلة — لم تصل` | supplier / not yet dispatched | no |
| 2 | `في الطريق` | on a truck | no |
| 3 | `وصلت — تحت فحص الوارد` | at the point, mid-receipt or missing evidence | no |
| 4 | `مستلمة — تحت الترخيص` | at the point, accepted, no plate | no |
| 5 | `متاح` | at the point, licensed | **yes** |
| 6 | `مخصص مبدئيًا لتفعيل الحساب` | at the point | no |
| 7 | `محجوز لميعاد` | at the point, held for one appointment | held |
| 8 | `تحت التسليم` | at the point, live handover session | no |
| 9 | `مُسلّم` | with the captain | no |
| 10 | `مرتجع — تحت الفحص` | at the point, awaiting a verdict | no |
| 11 | `خارج الخدمة — في الورشة` | workshop | no |
| 12 | `موقوف — تلف نقل` | at the point, frozen | no |
| 13 | `موقوف — تحقيق` | at the point, frozen | no |
| 14 | `موقوف — وحدة غير مسجّلة` | at the point, frozen, not in the registry | no |
| 15 | `مفقودة — تحت البحث` | unknown | no |
| 16 | `مشطوبة` | out of the fleet. Terminal. | no |

### 8.2 Every transition, and who triggers it

| From → To | Trigger | Actor |
|---|---|---|
| 1 → 2 | Dispatch confirmed on a supplier consignment | `مسؤول المخزون` (console) |
| 5 / 4 → 2 | Outbound transfer dispatch scan (P20) | sending `مدير النقطة` (portal) |
| 11 → 2 | Workshop return dispatched | `مسؤول المخزون` |
| 9 → 2 | Repossession collected | `مسؤول المخزون` |
| 2 → 3 | Chassis scanned and matched on the manifest (R2) | `مشغّل` / `مدير النقطة` (portal) |
| 3 → 4 | Receive session closed with full evidence (R5) | `مدير النقطة` (portal) |
| 3 → 3 | `استلام سريع` evidence window lapses — stays, case opens | system |
| 4 → 5 | Plate + licence recorded | `مسؤول المخزون` (console) |
| 5 → 6 | Provisional assignment for Uber account activation | allocation desk (console) |
| 6 → 5 | Provisional assignment released | allocation desk (console) |
| 5 → 7 | Appointment booked | booking desk (console) |
| 6 → 7 | Appointment booked for the same captain | booking desk (console) |
| 7 → 5 | Reservation released — no-show, hold expiry, case closed `أغلق الطلب` | console, or the portal's `appointment.no_show` |
| 7 → 8 | `ابدأ التسليم`, unit verification passed (P4.4) | `مشغّل` (portal) |
| 8 → 9 | `أكّد التسليم نهائيًا` (P5) | `مشغّل` (portal) |
| 8 → 10 | Defect found at inspection (P12) | `مشغّل` (portal) |
| 5 / 7 → 10 | Defect found in the yard (P12) | `مشغّل` (portal) |
| 9 → 10 | Repossessed or returned unit received (R3b) | `مدير النقطة` (portal) |
| 10 → 5 | Workshop pass + licence check; sets `وحدة مستعملة` | `الورشة` + `مسؤول المخزون` (console) |
| 10 → 11 | Repair required | `مسؤول المخزون` (console) |
| 10 / 11 / 12 / 13 / 14 → 16 | Written off | `مدير التشغيل` (console) |
| 11 → 4 | Repaired, returned to a point, awaiting re-licensing | receive flow + console |
| 3 → 12 | Damage flagged at arrival (R3) | `مدير النقطة` (portal) |
| 2 / 3 → 13 | Duplicate chassis, wrong-owner scan, or registry says `مُسلّم` | system, on the portal's scan |
| — → 14 | Unknown chassis scanned at arrival | `مدير النقطة` (portal) |
| 12 / 13 / 14 → 4 | Discrepancy closed clean | `مسؤول المخزون` (console) |
| 2 → 15 | Manifest line unscanned at session close (R4) | system |
| 15 → 3 | Unit later located and received on a one-line consignment | console then portal |
| any at-point state → 13 | Variance on two consecutive counts (§9.6) | system |

### 8.3 Forbidden transitions — enumerated

1. **Anything → `متاح` from the portal.** No exception. The portal has no control that produces sellable stock.
2. **`في الطريق` → `متاح`**, or `في الطريق` → `محجوز لميعاد`. In-transit stock is never reservable, by anyone, including the console.
3. **`وصلت — تحت فحص الوارد` → `محجوز لميعاد`.** Evidence before booking.
4. **`مستلمة — تحت الترخيص` → `محجوز لميعاد`.** No plate, no appointment. This is the single rule that stops a captain being booked against a motorcycle that cannot leave the yard.
5. **`مُسلّم` → anything, from the portal.** A delivered unit re-enters only through a console-created return order.
6. **`موقوف — *` → anything, from the portal.** Only the console unfreezes.
7. **`مفقودة — تحت البحث` → `متاح` directly.** A found unit is physically received first.
8. **Any state → a different point**, from the portal, except through P20's dispatch scan against an approved transfer.
9. **`محجوز لميعاد` → `في الطريق`.** A reserved unit cannot be shipped; the console releases the reservation first.
10. **`مرتجع — تحت الفحص` → `متاح` from the portal.** The showroom does not clear its own returns.
11. **`تحت التسليم` → `متاح`** without either a completed handover or a defect report. An abandoned session is resolved by the console, never by silently returning the unit to stock.
12. **`مشطوبة` → anything.** Terminal, in every direction.

---

## 9. Point stock management, on a 375 px phone

The manager's question is four words wide: *what do I have, what is coming, what is stuck, what do I owe an answer on.* The information architecture is those four words, in that order.

### 9.1 P11 · مخزون النقطة — rebuilt

**Header (sticky, 56 px).** Point name, a `.lat` total `٥٢ وحدة`, and a §5.3 search field with `مسح كود` — searching plate or the **last 6 of the chassis**, nothing else.

**Coverage strip.** Two §5.7 metric tiles, side by side at 375 px (the existing `.kpi` grid already collapses to 2 columns below 760 px):

- `متاح دلوقتي` — value, and the meter with its threshold tick at 5 days of coverage.
- `التغطية` — value in days, `.lat`, `--font-figure`. Sub-line: `الطلب ٣.٢ ميعاد/يوم`.

**Segmented tabs** (§10, one new component), four, sticky under the header, each with its count:

| Tab | Contains | Sorted by |
|---|---|---|
| `عندي` | `متاح`, `مخصص مبدئيًا`, `محجوز لميعاد`, `تحت التسليم` | grouped, then ageing descending |
| `جاي` | `في الطريق` consignments, plus `وصلت — تحت فحص الوارد` | ETA ascending |
| `واقف` | `مستلمة — تحت الترخيص`, `مرتجع — تحت الفحص`, all `موقوف — *`, `مفقودة` | days stuck, descending |
| `محتاج ردّ` | Open discrepancies, the `استلام سريع` evidence window, unacknowledged ageing alerts | age descending |

`محتاج ردّ` carries an attention badge when non-empty. It is the tab the manager is judged on.

**Grouping inside `عندي`.** Three bands with the `.band` divider already in the prototype: `محجوز لميعاد` first (today's work), then `متاح`, then `مخصص مبدئيًا`. Never a flat list — a flat list of 52 units sorted by plate is a phone book.

**Filters.** A single row of §5.1-geometry chips under the tabs, scrollable horizontally, multi-select: `راكدة` · `تحت الترخيص` · `فيها تلف` · `موديل ٢٠٢٦` · `بدون لوحة`. Four to six chips, never a filter sheet — a filter sheet on a forecourt is a filter nobody uses.

**Sort.** One control, a tertiary button reading the current sort: `مرتّب بالأقدم`. Tapping cycles three values: `الأقدم` → `اللوحة` → `الحالة`. No sort sheet, no column headers, because there are no columns.

**The row is a card, not a table row.** The `.acard` pattern already in the prototype, at 375 px:

```
┌──────────────────────────────┐
│ ق ن ٤٣٠١          [راكدة ٢٨] │   plate 17/600 · state pill
│ LHJ4K2…7D11                  │   chassis, .lat, --text-3, 12.5px
│ متاح · هوندا CG ١٢٥ · ٢٠٢٦   │   one line, 13px, --text-2
│ في المخزون من ٢٢ أغسطس       │   ageing line, --text-3
└──────────────────────────────┘
```

Whole card is the tap target (≥ 88 px tall). No row actions on the card — actions live in the detail sheet, because a destructive-looking button next to a unit the point cannot touch teaches the wrong lesson every time it is seen.

**No table anywhere in this portal.** §5.9's `min-width: 680px` cannot be honoured at 375 px without horizontal scroll, and horizontal scroll on a stock list is how a manager misses a column. The table is replaced by cards on every stock view, and the `wide-only` table branch currently in P1 and P11 is deleted.

### 9.2 P11.1 · كارت الوحدة — the detail sheet

A §5.11 bottom sheet, `max-height: 82%`, opened from any card.

1. **Head** — plate at `--t-d2`, state pill, `وحدة مستعملة` pill when flagged.
2. **الهوية** — a `dl` at 2 columns: chassis (full, `.lat`, long-press to copy), engine number, model, year, colour, plate, licence expiry. All read-only, rendered with the §5.3 read-only treatment so the lock is visible, not implied.
3. **الرحلة** — a §5.6 vertical timeline: `اتسجّلت` → `اتشحنت CN-2026-0418` → `اتستلمت ٢٢ أغسطس` → `اترخّصت` → `بقت متاحة` → and for a returned unit, the return. Every entry has actor + timestamp. This is the single most useful block on the screen and it is why the receive flow records so much.
4. **صور الوصول** — the four arrival photos as thumbnails, tappable to full screen. For a returned unit, the eight return photos and a `قارن بصور التسليم` control that puts handover and return photos side by side.
5. **الارتباط** — `محجوزة لـ` with the captain's name and slot, or `مش مرتبطة بحد`. Read-only, always.
6. **الإجراءات** — at most three tertiary buttons, and every one of them is a request: `بلّغ عن عطل` (P12) · `اسأل عن الترخيص` · `اطلب سحب الوحدة` (P22). No state control. No reassignment. Nothing that writes a unit state except the defect report, which is already in §6.3 item 13.

### 9.3 Ageing

**The clock.** Starts at the timestamp the unit entered `متاح`. It **does not reset** when a reservation is made and later released. `[قرار مقترح]` A unit booked three times and released three times has been idle the whole time, and resetting the clock on each booking is exactly how idle stock hides.

**Thresholds for `متاح` and unreserved:**

| Day | Signal | Where |
|---|---|---|
| 21 | Attention pill `راكدة ٢١ يوم` on the card; counted on the `واقف` tab badge | portal |
| 45 | Critical pill; `stock.unit_aged` fires once; the console opens an `اقتراح تحريك مخزون` task | portal + console |

**Thresholds for the other stuck states:** `مستلمة — تحت الترخيص` at day 10 / day 21 (§4.3). `مرتجع — تحت الفحص` at day 5 / day 14 (§7.3). `موقوف — تلف نقل` at day 7 (§3.6b).

**Surfacing.** Not a report. Three places, in descending order of how much a manager will actually see them:
1. The `واقف` tab badge on P11, visible from the home screen's bottom nav.
2. A §5.8 attention notice at the top of the `عندي` tab: `٦ وحدات راكدة أكتر من ٢١ يوم — تقدر تطلب من الإدارة تحرّكها.` with a `اطلب سحب وحدات` action.
3. One line in the P13 end-of-day report, under `الحركة`: `راكد فوق ٤٥ يوم: ٢`.

An ageing alert can be acknowledged once per unit per 14 days (`stock.ageing_acknowledged`), which mutes the notice but never the pill. The pill is a fact; the notice is a nag, and a nag that cannot be silenced gets silenced by being ignored.

### 9.4 Low stock and over stock, against the pipeline

Never against a fixed number. `مخزون متاح ٤` means nothing; `فاضل يومين شغل` means something.

```
الطلب اليومي  = confirmed appointments at this point over the next 14 days ÷ 14,
                floored at 0.5 so a point with no bookings does not divide by zero
التغطية       = عدد `متاح` ÷ الطلب اليومي,  in days, one decimal
التغطية مع الوارد = (عدد `متاح` + units `في الطريق` with an ETA inside 7 days) ÷ الطلب اليومي
```

| Signal | Rule | Tone |
|---|---|---|
| `هينفد` | `التغطية` < 2 days, **or** any confirmed appointment inside 7 days has no unit reserved | critical |
| `مخزون منخفض` | `التغطية` < 5 days | attention |
| `مخزون مظبوط` | otherwise | positive |
| `مخزون زايد` | `التغطية` > 30 days **and** `متاح` ≥ 25 units | attention |

`[قرار مقترح]` on all four. The `مخزون زايد` rule carries the unit floor deliberately: a Hurghada point with 6 available units and one booking a week is at 42 days of coverage and is not over-stocked; it is small.

The meter on the `التغطية` tile fills `--pos-edge` above 5 days, `--att-edge` below 5, `--crit-edge` below 2, with the threshold tick at 5. When `التغطية مع الوارد` differs from `التغطية`, a second, hollow tick marks it, with the sub-line `مع الوارد: ٨.٢ يوم`.

`هينفد` puts a critical §5.8 notice at the top of the `عندي` tab with one action: `اطلب وحدات` (P22). `مخزون زايد` puts an attention notice with `اطلب سحب وحدات`.

### 9.5 What the point may write — extending §6.3

§6.3 items 1–20 stand unchanged. Added:

21. **Receive session:** open, the driver and vehicle details, the truck photo, close.
22. **Per-unit arrival scan:** the chassis, scan-vs-manual, the match result against the manifest, and the timestamp.
23. **Arrival condition:** four slotted photos, odometer at arrival, the damage flag, damage type, damage photos and note.
24. **Return inspection (R3b):** the 10 functional results, eight photos, odometer at return, returned accessories, the mandatory note.
25. **Reconciliation picks at R4** — per unscanned manifest line, one of two fixed reasons.
26. **Transporter signature and the receive receipt**, plus the closing manager's PIN attestation.
27. **Outbound dispatch (P20):** the scan-off of each unit on an approved transfer, its condition photos, and the transporter signature.
28. **Weekly full count (P21):** per-unit `مطابق` / `مش موجود` / `موجود ومش في الكشف`, plus the manager's sign-off.
29. **Notes and up to 4 camera photos on an open discrepancy case.** Never a resolution, never a category.
30. **Requests, which change nothing until a human approves:** `اطلب وحدات`, `اطلب سحب وحدات`, `اسأل عن الترخيص`, `كمّل صور الوصول`.

And, stated as a prohibition so it cannot be read the other way — the portal may **never** write: a `متاح` state, a plate or licence record, a unit↔captain assignment, a unit's location, a manifest line, a discrepancy resolution, another point's anything. The guardrail in §2 of the portal spec — *a showroom must never reassign a unit to a different captain or change a programme decision* — is untouched by everything above: nothing added here takes a unit from one captain and gives it to another, and nothing added here has an opinion about a programme decision.

### 9.6 Physical-vs-system reconciliation beyond the daily count

The daily count (§1.2b of the portal spec) is unchanged: 100% of today's reserved units, a 10% rolling sample of `متاح`.

**P21 · الجرد الكامل الأسبوعي.** Saturday, at day open, blocking: the day cannot open on a Saturday until the full count is closed. `[قرار مقترح]`

- Scope: **every unit the console says is physically at this point**, in every at-point state, including frozen ones. A frozen unit is still a motorcycle in a yard.
- Method: scan or type the last 6, one at a time. A progress line `٣٨ من ٥٢`, a §5.5 stepper rail is wrong here — it is a count, not a sequence; use a filled progress bar with the two figures beside it.
- The list below is ordered **unscanned first**. Scanned units drop to a collapsed `اتأكدت` group. At 52 units on a 375 px screen, the only thing that matters is what is left.
- `موجود ومش في الكشف` is a first-class outcome, not an error, and it opens the same flow as §3.2's unknown-unit case.
- Close requires the manager's PIN and emits `stock.full_count_recorded`.

**Escalation of persistent variance:**

| Occurrence | Consequence |
|---|---|
| 1st count with a variance on a unit | `فرق جرد` case. Unit keeps its state. Day opens. |
| **2nd consecutive count** with a variance on the **same unit** | Unit → `موقوف — تحقيق`, frozen. Case upgraded to `فرق جرد متكرر`. `مدير التشغيل` notified. `[قرار مقترح]` |
| A point holding **3 or more** units frozen for variance | The console blocks new consignments to that point until they clear, and a physical audit visit is raised. The portal shows the point a critical notice naming the count. `[قرار مقترح]` |

"Consecutive" means two counts of any kind — daily sample or weekly full — in which that unit was in scope. A unit that is missing on Saturday and missing again on Monday's reserved-unit check is a unit that is gone.

### 9.7 The 375 px layout, per view

Global: a single column, 16 px side gutter, 12 px vertical rhythm, every tap target ≥ 48 px (the portal CSS already enforces `min-height:48px` below 760 px), all figures `.lat` + `--font-figure` + `tabular-nums`. `G1` stays pinned at the top. **No horizontal scroll on any page, ever** — which is precisely what deleting the §5.9 tables buys.

| View | Layout at 375 px |
|---|---|
| **P11** `مخزون النقطة` | Sticky header (56) → 2 metric tiles side by side → sticky segmented tabs (44) → chip row, horizontally scrollable → sort button → card list. Bottom nav (§9.8) pinned. |
| **P11.1** `كارت الوحدة` | Bottom sheet, 82% max height, grab handle, internal scroll. Photos as a 2-column thumbnail grid. Actions in a §5.10 sticky bar inside the sheet. |
| **P17** `الوارد والشحنات` | Two collapsed sections, `في الطريق` then `خلصت`. One card per consignment: number, source, ETA, `٢٠ وحدة`, state pill, overdue pill. Card tap opens it; a single full-width primary `ابدأ الاستلام` at the bottom of an open card. |
| **P18/R1** `طابق المندوب` | Full-bleed, one field per row, camera tile at 4:3 full width. Sticky bottom bar: `كمّل`. |
| **P18/R2** `امسح الوحدات` | The scan button is the screen: a 160 px-tall camera tile, full width, at the top. Under it, the running count as one line at `--t-d2`: `٧ من ٢٠`. Under that, the scanned list, newest first, each row 56 px: chassis tail + a positive check. Manifest lines not yet scanned are **not** listed here — they are R4's job. |
| **P18/R3** `حالة الوصول` | Per unit, full-bleed: plate as the title, 4 capture tiles in a 2×2 grid at 4:3, odometer field, the `سليمة`/`فيها تلف` option-card pair stacked vertically. Sticky bar: `الوحدة اللي بعدها`. |
| **P18/R3b** `فحص المرتجع` | The 10 checklist items as full-width rows, each with a 2-option segmented `سليم`/`فيه عيب` at 44 px — never a toggle, because a toggle has a default and this must not. Then the 8-slot photo grid, 2 columns. |
| **P18/R4** `الفروقات` | Four collapsible sections, counts in the headers, sections 2–4 expanded by default and section 1 collapsed. Per missing line, the two reason picks as stacked option cards. |
| **P18/R5** `توقيع المندوب` | The count restated as a `dl`. Signature canvas ≥ 280 px tall — at 375 px portrait this is the full width, which is why it works on a phone at all. Then the PIN pad, reusing `.pinpad`. |
| **P19** `فروقات الشحنة` | Bottom sheet from a `محتاج ردّ` card: category pill, age, the evidence as thumbnails, the console thread as a §5.6 timeline, a note field, `ابعت الملاحظة`. |
| **P20** `تحويل صادر` | Identical geometry to P18, three steps instead of five, and an attention notice at R1: `الوحدات دي هتطلع من مخزونك دلوقتي.` |
| **P21** `الجرد الكامل` | Progress bar + `٣٨ من ٥٢` pinned under the header. Scan tile. Then the unscanned list, one 64 px row per unit: plate, chassis tail, and a single `موجودة` button; `مش موجودة` is a tertiary link under it, not a second equal button. |
| **P22** `اطلب وحدات` | Bottom sheet. A §5.4 option-card pair `محتاج وحدات` / `عندي وحدات زايدة`, a stepper-free numeric field, a reason pick, a note. One primary: `ابعت الطلب`. |

### 9.8 Navigation

The portal is phone-only, so the stock world needs a permanent way in. A 5-item bottom bar, 56 px + safe-area, present on P2, P8, P11, P15 and P17: `المواعيد` · `المخزون` · `الوارد` · `الحالات` · `المزيد`. `المخزون` and `الوارد` carry attention badges from the `محتاج ردّ` and overdue-consignment counts.

---

## 10. Components

Everything above is built from `DESIGN-SYSTEM.md` §5 and the three components already justified in the portal spec §11 (`كاميرا بخانة محددة`, `لوحة التوقيع`, `شريط الحالة العام`). Two additions:

1. **`مبدّل أقسام` — sticky segmented tab bar. New.** Four mutually exclusive views, each carrying a count, at 375 px, above a list that scrolls beneath it. §5.9's table header cannot carry views; §5.4's option cards are 56 px tall each and would consume the screen; the chip row is multi-select by convention and reusing it for exclusive choice teaches two meanings for one shape. Built entirely from existing tokens: the container is `--surface-sunken` at `--r-pill` with 3 px padding, each segment `--r-pill`, 44 px tall, inactive `--text-3`, **active `background: var(--surface); color: var(--text); border: 1px solid var(--hairline)`** — a raised-out-of-the-groove treatment, explicitly **not** `--accent`, so it never competes with the primary action on the screen. The count rides as a `--font-figure` suffix at 11.5 px. `aria-role="tablist"`. Sticky at `top: 56px`.
2. **`عدّاد جرد` — count progress bar. A variant, not a component.** §5.7's meter track and fill, pulled out of the tile and run full-width with the two figures beside it. No new tokens, no new geometry.

Explicitly **removed** from the portal: the §5.9 data table. It survives in the admin console, where there is a desktop and there are columns. In a phone-only portal it is a horizontal scrollbar wearing a table's clothes.

---

## 11. Boundary events — additions to §6.1

| Event | What changes in the console |
|---|---|
| `inbound.receive_started` | Consignment → `وصلت — جارٍ الاستلام`; driver, vehicle plate and truck photo stored; the point shows as receiving on the ops dashboard. |
| `inbound.unit_received` | Unit → `وصلت — تحت فحص الوارد`; the manifest line is ticked with scan-vs-manual, actor, device and timestamp. |
| `inbound.unit_condition_recorded` | Four arrival photos, odometer and the damage flag attached to the unit; the arrival baseline is set for any future claim. |
| `inbound.unit_damaged` | Unit → `موقوف — تلف نقل`; a `تلف أثناء النقل` case opens against the transport contract; the unit is excluded from coverage. |
| `inbound.unknown_unit_scanned` | Unit → `موقوف — وحدة غير مسجّلة` (or `موقوف — تحقيق` when it belongs elsewhere); a case opens; nothing enters stock. |
| `inbound.duplicate_chassis_detected` | Both consignments flagged; unit → `موقوف — تحقيق`; priority-1 page to `مدير التشغيل` and the programme lead, push **and** SMS. |
| `inbound.fast_receipt_started` | Consignment marked `استلام سريع`; the 4-hour evidence window opens and is shown as a clock on the console's stock view. |
| `inbound.evidence_window_lapsed` | Units stay frozen in `وصلت — تحت فحص الوارد`; an `استلام ناقص الأدلة` case opens against the point. |
| `inbound.consignment_closed` | Consignment → `مستلمة كاملة` or `مستلمة بفروقات`; accepted units → `مستلمة — تحت الترخيص`; unscanned lines → `مفقودة — تحت البحث`; the receive receipt is stored. |
| `inbound.discrepancy_opened` | One case in the new `فروقات المخزون` queue, with its category, its lines and all evidence. Never auto-resolves. |
| `inbound.discrepancy_note_added` | Appended to the case thread, attributed to the point, with any attached photos. |
| `inbound.consignment_overdue` | Derived, server-side: a `في الطريق` consignment past its transit threshold is flagged and the transport owner notified. |
| `transfer.requested` | A stock request item (`محتاج وحدات` or `عندي وحدات زايدة`) on `مسؤول المخزون`'s desk. **Creates no consignment.** |
| `transfer.dispatch_confirmed` | Units → `في الطريق` and leave the sending point's stock immediately; dispatch photos and the transporter signature stored; the receiving point's `جاي` tab updates. |
| `stock.full_count_recorded` | The weekly count stored per unit; variances opened as `فرق جرد`; the point's `دقة الجرد` number recomputed. |
| `stock.variance_escalated` | Second consecutive variance on one unit → unit frozen `موقوف — تحقيق`, case upgraded to `فرق جرد متكرر`, `مدير التشغيل` notified. |
| `stock.unit_aged` | Fires once at day 45 of unreserved `متاح`; opens an `اقتراح تحريك مخزون` task on the allocation desk. |
| `stock.licensing_overdue` | Fires once at day 21 in `مستلمة — تحت الترخيص`; appends to the licensing queue with the unit and its receipt date. |
| `stock.return_inspection_overdue` | Fires once at day 14 in `مرتجع — تحت الفحص`; notifies the workshop owner. |
| `stock.ageing_acknowledged` | Mutes the ageing notice for that unit for 14 days. Records who acknowledged. Changes no state. |
| `stock.info_requested` | The `اسأل عن الترخيص` / `كمّل صور الوصول` chase — a note on the relevant console queue. Changes no state. |
| `return.unit_received` | Unit → `مرتجع — تحت الفحص`; the 10 functional results, 8 photos, return odometer and accessory list attached; the odometer delta against the handover reading computed. |

Every one of these obeys the §6.2 rule: **no event emitted by the portal moves a unit to `متاح`, changes a unit↔captain assignment, or resolves a case.**

---

## 12. Copy deck — Egyptian Arabic

Continuing the numbering in §8 of the portal spec. Buttons say the outcome.

### 12.1 Buttons

| ID | Context | Label |
|---|---|---|
| B-40 | P17 | `ابدأ استلام الشحنة` |
| B-41 | P17 | `شوف تفاصيل الإذن` |
| B-42 | P18/R1 | `صوّر العربية باللي عليها` · `كمّل للمسح` |
| B-43 | P18/R2 | `امسح الشاسيه` · `اكتب الرقم بنفسي` |
| B-44 | P18/R2 | `خلصت المسح` |
| B-45 | P18/R3 | `الوحدة سليمة` · `الوحدة فيها تلف` |
| B-46 | P18/R3 | `الوحدة اللي بعدها` |
| B-47 | P18/R3 | `المندوب مش مستني — استلام سريع` |
| B-48 | P18/R4 | `مش موجودة على العربية` · `هتوصل في شحنة تانية` |
| B-49 | P18/R5 | `المندوب يمضي هنا` · `امسح التوقيع` |
| B-50 | P18/R5 | `أقفل الاستلام بالـ PIN` |
| B-51 | receipt | `ابعت الإيصال للمندوب` · `ارجع للوارد` |
| B-52 | P11 banner | `كمّل صور الوصول` |
| B-53 | P11.1 | `اسأل عن الترخيص` |
| B-54 | P11.1 / P22 | `اطلب سحب الوحدة` |
| B-55 | P11 notice | `اطلب وحدات` |
| B-56 | P22 | `محتاج وحدات` · `عندي وحدات زايدة` · `ابعت الطلب` |
| B-57 | P19 | `ابعت الملاحظة للإدارة` · `ضيف صورة` |
| B-58 | P20/R1 | `الوحدات دي هتطلع دلوقتي` |
| B-59 | P20/R2 | `امسح الوحدة اللي طالعة` |
| B-60 | P20/R3 | `أكّد الخروج بالـ PIN` |
| B-61 | P21 | `ابدأ الجرد الكامل` · `موجودة` · `مش موجودة` |
| B-62 | P21 | `أقفل الجرد وامضِ` |
| B-63 | P11 | `مرتّب بالأقدم` (cycles) |
| B-64 | P11 | `فهمت — ما تفكرنيش تاني` (ageing acknowledge) |

### 12.2 Confirmations

| ID | Trigger | Copy |
|---|---|---|
| C-10 | `أقفل الاستلام بالـ PIN` | **`تقفل الاستلام؟`** — `بعد الإقفال ما ينفعش تضيف ولا تشيل وحدة من الإذن ده. أي ناقص أو تلف هيتفتحله فرق مع الإدارة.` → `أقفل الاستلام` / `ارجع أراجع` |
| C-11 | `الوحدة فيها تلف` | **`تسجّل إن الوحدة فيها تلف؟`** — `الوحدة هتتجمّد وما تقدرش تتحجز لحد ما الإدارة تخلص الفرق. لازم صورتين قريبين ووصف للتلف.` → `سجّل التلف` / `راجع تاني` |
| C-12 | `المندوب مش مستني` | **`تستلم استلام سريع؟`** — `هتعد الوحدات بس دلوقتي والمندوب يمضي ويمشي. الوحدات مش هتدخل المخزون غير لما تصوّرها، وعندك ٤ ساعات. بعد كده بتتقفل وبتتفتح حالة عليك.` → `استلام سريع` / `هستنى وأصوّر` |
| C-13 | `أكّد الخروج بالـ PIN` (P20) | **`تطلّع ٦ وحدات من مخزونك؟`** — `الوحدات دي هتخرج من مخزونك دلوقتي وتبقى في عهدة الناقل لحد ما النقطة التانية تستلمها.` → `أكّد الخروج` / `ارجع` |
| C-14 | `مش موجودة` (P21) | **`تسجّلها مش موجودة؟`** — `دوّر عليها كويس الأول. لو سجّلتها ناقصة مرتين ورا بعض، الوحدة هتتجمّد وهتروح للتحقيق.` → `سجّلها ناقصة` / `هدوّر تاني` |
| C-15 | `أقفل الجرد وامضِ` | **`تقفل الجرد الكامل؟`** — `الرقم ده هو جرد النقطة الرسمي للأسبوع وبيتمضي باسمك.` → `أقفل وامضِ` / `لسه` |

### 12.3 Errors and blocks

| ID | Where | Copy |
|---|---|---|
| E-40 | R2 | `الشاسيه ده مش في الإذن ده. ما تستلمهوش — صوّره وسجّله زيادة.` |
| E-41 | R2 | `الوحدة دي اتمسحت في الاستلام ده قبل كده.` |
| E-42 | R2 | `الوحدة دي مسجّلة في إذن تاني. وقفناها وبلّغنا الإدارة.` |
| E-43 | R2 | `الوحدة دي مش مسجّلة عندنا خالص. صوّر رقم الشاسيه واكتب اللي حصل — ما تدخلهاش المخزون.` |
| E-44 | R2 | `الوحدة دي مسجّلة إنها اتسلّمت لكابتن قبل كده. وقفنا الاستلام كله وبلّغنا الإدارة فورًا.` |
| E-45 | P17 | `في شحنة لسه بتستلمها. اقفلها الأول قبل ما تبدأ شحنة تانية.` |
| E-46 | R3 | `ناقص صورتين من صور الوصول. الوحدة مش هتدخل المخزون من غيرهم.` |
| E-47 | P20/R2 | `الوحدة دي مش في إذن التحويل. ما تطلّعهاش.` |
| E-48 | P20/R2 | `الوحدة دي محجوزة لميعاد. الإدارة لازم تفك الحجز الأول.` |
| E-49 | R5 | `لازم المندوب يمضي قبل ما تقفل الاستلام.` |
| E-50 | R5 | `الإقفال بيمضيه مدير النقطة. المشغّل ما يقدرش يقفل استلام.` |
| E-51 | P1, Saturday | `النهارده السبت — لازم تخلّص الجرد الكامل قبل ما تفتح اليوم.` |
| E-52 | P11.1 | `عداد الوصول أعلى من المسموح للوحدة الجديدة. سجّلها بتحفّظ وبلّغ الإدارة.` |
| E-53 | P11 | `مخزونك مجمّد: ٣ وحدات في فرق جرد متكرر. مفيش شحنات جديدة لحد ما الإدارة تقفلهم.` |
| E-54 | P18 offline | `مفيش شبكة. كمّل الاستلام عادي — هيترفع لوحده أول ما الشبكة ترجع.` |

### 12.4 Notices

| ID | Tone | Copy |
|---|---|---|
| N-20 | Attention, P11 | `٦ وحدات راكدة أكتر من ٢١ يوم. تقدر تطلب من الإدارة تحرّكها.` |
| N-21 | Critical, P11 | `فاضلك أقل من يومين شغل. اطلب وحدات دلوقتي قبل ما المواعيد تقف.` |
| N-22 | Attention, P11 | `مخزونك أكتر من احتياجك بكتير. تقدر تطلب من الإدارة تسحب جزء منه.` |
| N-23 | Attention, P11 | `٤ وحدات مستنية صور الوصول. فاضل ساعتين و١٨ دقيقة.` |
| N-24 | Informational, P11 | `المعرض ما يقدرش يخلّي وحدة «متاحة». ده بيحصل من الإدارة بعد ما الرخصة واللوحة يتسجّلوا.` |
| N-25 | Attention, P11 | `٣ وحدات مستنية الترخيص من أكتر من ١٠ أيام.` |
| N-26 | Positive, R5 | `تم استلام الشحنة. الوحدات دخلت تحت الترخيص، وهتبقى متاحة بعد ما الإدارة تسجّل اللوحات.` |
| N-27 | Attention, R5 | `الاستلام اتقفل بفروقات. رقم المتابعة DSC-2026-0091 — الإدارة هتراجع.` |
| N-28 | Informational, P17 | `الوحدة اللي في الطريق مش في مخزونك لسه. بتظهرلك هنا علشان تعرف الجاي إمتى بس.` |
| N-29 | Attention, P17 | `الشحنة CN-2026-0418 متأخرة عن ميعادها. بلّغنا الإدارة أوتوماتيك.` |
| N-30 | Critical, P11.1 | `الوحدة دي موقوفة في فرق مفتوح رقم DSC-2026-0091. ما تحجزهاش وما تسلّمهاش.` |

### 12.5 Empty states

| ID | Where | Copy |
|---|---|---|
| S-01 | P17, `في الطريق` فاضي | **`مفيش شحنات في الطريق`** — `أول ما الإدارة تبعت شحنة لنقطتك هتظهرلك هنا بميعاد وصولها.` |
| S-02 | P11, `عندي` فاضي | **`مفيش وحدات في مخزونك`** — `اطلب وحدات من الإدارة علشان تقدر تستقبل مواعيد.` → `اطلب وحدات` |
| S-03 | P11, `واقف` فاضي | **`مفيش حاجة واقفة`** — `كل وحداتك إما متاحة أو محجوزة. ده أحسن وضع.` |
| S-04 | P11, `محتاج ردّ` فاضي | **`مفيش حاجة مستنياك`** — `مفيش فروقات مفتوحة ولا صور ناقصة.` |
| S-05 | P11 search | **`مفيش وحدة بالرقم ده في نقطتك`** — `دوّر باللوحة أو بآخر ٦ أرقام من الشاسيه. مخزون النقط التانية ما بيظهرش هنا.` |
| S-06 | P21 | **`الجرد الكامل خلص`** — `٥٢ وحدة اتأكدت، مفيش فروقات. الإقفال محتاج توقيعك.` |
| S-07 | P19 | **`مفيش فروقات مفتوحة`** — `آخر فرق اتقفل يوم ١٢ سبتمبر.` |

### 12.6 What the manager reads to the transporter

| ID | Moment | Script |
|---|---|---|
| C-TR-1 | Before signing | `أنا عدّيت ١٨ وحدة من ٢٠ والاتنين الباقيين مش على العربية. هتمضي على العدد ده وهيوصلك إيصال برسالة على رقمك.` |
| C-TR-2 | Damage found | `في وحدة فيها تلف وأنا صوّرتها قدامك. ده مش اتهام لحد — ده تسجيل حالة، والإدارة هي اللي بتراجع مع شركة النقل.` |
| C-TR-3 | `استلام سريع` | `تمام، هعد الوحدات بس دلوقتي عشان تمشي. التصوير هعمله بعدين وده مسؤوليتي مش مسؤوليتك.` |

---

## 13. يحتاج قرار

Continuing the numbering in §12 of the portal spec.

15. **مين بيتحمّل العجز في الشحنة؟** When 2 of 20 never arrive, whose loss is it — the supplier's, the transporter's, or Trade Way's — and at what point does it become the receiving point's? §5.5's `مسؤولية النقطة` outcome exists in the design but its trigger is a contractual question. Until it is answered, the point cannot be told what it is exposed to, and a point that does not know its exposure counts carelessly.
16. **شروط عقد النقل.** Does the transporter's signature on a phone canvas bind his company to a shortage or damage claim? If not, the receive receipt needs a paper counterpart signed in duplicate, and R5 gains a scan step — the same inversion §12.1 of the portal spec describes for the handover contract.
17. **الوحدة المستعملة في البرنامج.** May a repossessed unit be re-allocated to a new captain on terms written for a new motorcycle? If yes, what must be disclosed to the second captain and where — the applicant site, the captain card, or the contract? This spec flags the unit permanently and shows the flag at P4.4; whether that is sufficient disclosure is legal's call.
18. **حد الكيلومترات عند الوصول.** Proposed: warn above 15 km, flag above 80 km. What does the supply contract call "new", and who pays for a unit delivered with 300 km on it?
19. **مدة الترخيص المقبولة.** Proposed: attention at 10 days, critical at 21. At 1,000 units this is an operational annoyance; at 3,000 it is the programme's main bottleneck. Finance and the licensing agent must agree a target before the point is shown a clock it cannot influence.
20. **نافذة الاستلام السريع.** Proposed: 4 hours. Shorter is safer and will be missed; longer is unenforceable. Ops must confirm, and must confirm that a lapsed window opens a case against the point rather than simply expiring quietly.
21. **قفل الشحنات على نقطة عندها فروقات متكررة.** Proposed: 3 frozen units blocks new consignments to that point. This is a commercial sanction on a partner showroom and it belongs in the point contract, not in a portal's config.
22. **تأمين الوحدات في الطريق.** This spec puts custody with the transporter between the two signatures. Is there an insurance policy that agrees, and does it cover Cairo↔Hurghada road transport specifically?
23. **جرد كامل أسبوعي يوم السبت.** Saturday open is a blocking gate for a count of up to 85 units. At 6 points that is 6 Saturday mornings a week of counting. Confirm the day, and confirm that a point may not open for business until it is done.
24. **حفظ صور الوصول.** Arrival and return photo sets are the evidence base for supplier, transporter and captain claims. Retention period under قانون حماية البيانات الشخصية ١٥١ لسنة ٢٠٢٠ — and note that a return photo set includes the captain's use of the unit, which is his data, not the supplier's.

---

*End of specification.*
