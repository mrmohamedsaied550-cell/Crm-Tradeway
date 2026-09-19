# بوابة نقطة التوزيع — مواصفة التشغيل والتجربة
**Distribution-Point Portal — Operating & UX Specification**

Trade Way × Uber motorcycle-ownership programme · Greater Cairo + Hurghada
Surface: tablet, RTL, Arabic (Egyptian dialect for anything the captain reads)
Status: v1 specification for client confirmation. Every invented rule is marked `[قرار مقترح]`.
Component vocabulary: `DESIGN-SYSTEM.md` §5 only. New components are justified in §11.

---

## 0. The three sentences this whole document defends

1. **The point executes; it never decides.** Nothing in this portal can change an acceptance decision, a programme term, a document rejection, or who a motorcycle belongs to. Every one of those is a read-only field with a `مقفول` affordance and an escalate path.
2. **There is exactly one visit.** Every state machine here is built for: captain arrives → verified → inspects → signs → rides away, or the visit stops and a human at Trade Way picks it up. There is no "sign now, collect later" branch anywhere. It must be deleted from the prototype (see §10).
3. **The handover record is contractual evidence, not a form.** Local-first, append-only, actor + timestamp + device on every entry, and it survives the tablet dying (§3.10).

---

## 1. The operating day

### 1.1 Roles present at a point
- `مشغّل` — showroom staff who runs handovers.
- `مدير النقطة` — showroom manager; witness, day-close signer, variance resolver.
- (Trade Way staff never log in here. They use the console.)

### 1.2 Before the first appointment — **P1 · فتح اليوم**

`P1` is a mandatory gate. `ابدأ التسليم` is disabled anywhere in the portal until `P1` is closed for today.

**(a) فحص الجهاز — device readiness.** Automatic, 4 checks, rendered as a §5.6 vertical timeline:
| Check | Pass rule | On fail |
|---|---|---|
| الكاميرا | rear camera returns a frame | hard block — `مفيش تسليم من غير كاميرا شغالة` |
| المساحة الفاضية | ≥ 2 GB free | hard block `[قرار مقترح]` (a handover produces ~14 photos + 4 signature canvases + ~14 scanned pages ≈ 90 MB) |
| البطارية | ≥ 60% or charger connected | warn only |
| المزامنة | 0 pending sessions from yesterday | hard block — yesterday must be flushed before today opens |

**(b) جرد المخزون — opening stock reconciliation.** The portal lists every unit the console says is physically at **this point**. It never shows another point's stock.

`[قرار مقترح]` Daily scope is not the whole yard — at 40–85 units per point, a full daily count is theatre and will be faked by week two. Daily scope is:
- **100% of units reserved for today's appointments** (`محجوز لميعاد`) — scan chassis barcode or type last 6.
- **A 10% rolling sample** of `متاح` stock, chosen by the server, rotating so every unit is sampled at least once a fortnight.
- **100% of everything** on Saturday open (`جرد كامل أسبوعي`).

Outcomes per unit: `مطابق` / `مش موجود` / `موجود ومش في الكشف`.
- Any variance on a unit **reserved for today** → the day cannot open until the manager records a reason and the portal emits `فرق جرد` to the console. The affected appointment is auto-flagged `الوحدة غير مؤكدة` on the queue.
- Variance on sampled `متاح` stock → day opens, variance filed, console notified. Does not block.

Component: §5.9 data table, one row per unit, status column as §5.1 pill, row action = `أكّد` / `بلّغ فرق`. A §5.7 metric strip above: `وحدات النهاردة`, `تم تأكيدها`, `فروقات`.

**(c) مواعيد النهاردة.** Read-only confirmation: count, capacity, and — the important one — **units booked for today that were not confirmed present in (b)**. These are surfaced as an attention §5.8 notice at the top of `P2` all day.

**(d) بدء الوردية.** Operator taps `افتح اليوم`. Emits `point.day_opened`. The manager is not required to be present to open; the manager **is** required to close (§1.4).

### 1.3 Between appointments — **P2 · مواعيد اليوم** (home screen)

`P2` is the portal's home. Everything else is reached from it. Its job is to answer, in under two seconds and from arm's length: *who is in front of me, who is late, what is stuck.*

Top row — a §5.7 metric strip, 5 tiles: `دلوقتي`, `المتبقي النهاردة`, `متأخر`, `حالات مفتوحة`, `بانتظار المزامنة`.

The list is one §5.9 data table, sorted by slot time, never paginated, grouped into three visually separated bands:
1. **دلوقتي والجاي** — slot within ±2 h.
2. **متأخر** — slot passed by 20–90 min. Attention pill.
3. **خلصت** — `تم التسليم`, `لم يحضر`, `مُعلّق`. Collapsed by default.

Row states and what the row's action button says:

| Appointment state | Pill (§5.1 tone) | Row action |
|---|---|---|
| `مجدول` | Informational — `لسه ما حانش` | `افتح الملف` |
| `مجدول` within 2 h | Informational — `جاهز للاستقبال` | `سجّل الحضور` |
| `تم الحضور` | Attention — `في الانتظار` | `ابدأ التسليم` |
| `جارٍ التنفيذ` | Attention — `جارٍ التنفيذ — خطوة ٤` | `كمّل` |
| `جارٍ التنفيذ` idle > 45 min | Critical — `متوقف` | `كمّل` |
| `مُعلّق — مرفوع للإدارة` | Critical — `مرفوع للإدارة` | `افتح الحالة` |
| `تم التسليم` | Positive — `تم التسليم` | `الإيصال` |
| `تم التسليم (غير متزامن)` | Attention — `بانتظار المزامنة` | `الإيصال` |
| `لم يحضر` | Neutral — `لم يحضر` | `افتح الملف` |

**Search** lives in the `P2` header as a single always-visible field (`.lat`, `inputmode="numeric"`) plus a `مسح كود` button — **not** as a separate card (see §10). It searches: mobile number, request number `TW-…`, ticket code. It searches **only this point's own files**; a captain booked elsewhere returns the wrong-point card (§4, E7), never a file.

**Late / no-show handling.** At slot +20 the row moves to `متأخر`. At slot +90 the portal surfaces `سجّل عدم حضور` on the row. It is not one tap: it opens **P9** and requires one logged contact attempt (`اتصلت — ما ردّش` / `اتصلت — قال هييجي` + new ETA / `الرقم مقفول`). No-show without a logged attempt is not possible. `[قرار مقترح]`

**Walk-ins** (§4, E8) go to **P10** and are logged as an enquiry. They are never served, and the portal cannot create an application.

**Concurrency rule.** `[قرار مقترح]` A point may have **one** `جارٍ التنفيذ` session per operator and at most **two** unsynced completed sessions. A third unsynced session blocks `ابدأ التسليم` with: `في تسليمتين لسه ما اترفعوش. استنى الشبكة ترجع قبل ما تبدأ تسليم جديد.`

### 1.4 Close of day — **P13 · إقفال اليوم**

Close is blocked while any session is `جارٍ التنفيذ`. Those must be completed or escalated first.

Close produces the **تقرير آخر اليوم** in four blocks:
1. **الأرقام الخمسة** (§9) for today, each a §5.7 metric tile with its threshold tick.
2. **الحركة** — delivered units (chassis + captain + operator + time), defects reported, escalations opened with their reference numbers, no-shows with their logged reasons, walk-ins.
3. **جرد الإقفال** — today's movements only: opening reserved count − delivered − returned-to-available = closing. A mismatch blocks close and opens a `فرق جرد` escalation.
4. **بكرة** — tomorrow's appointment count and whether every unit booked for tomorrow was confirmed present today. This is the single most useful line in the report and it is why close-of-day exists at all.

Sign-off: **the point manager**, with PIN re-auth. Emits `point.day_closed` with the manager as actor. If offline, close is `مقفول — بانتظار المزامنة` and the portal retries; the console shows the point as un-reconciled until it lands.

---

## 2. Screen inventory

Every screen. `who` = which role can reach it. `never` = the guardrail that defines it.

| ID | Screen | Job (one line) | Who | Must never let the operator… |
|---|---|---|---|---|
| **P0** | `الدخول` | Device-bound login: point code + user + PIN, OTP on first bind. | both | …log in on an unbound device without a manager-approved bind. |
| **P1** | `فتح اليوم` | Device check, opening stock reconciliation, today's readiness. | both | …open the day with an unresolved variance on a unit booked today. |
| **P2** | `مواعيد اليوم` | Home: today's queue + search + counters. **Replaces `S_pqueue`.** | both | …see any appointment or file that is not this point's. |
| **P3** | `كارت الكابتن` *(sheet)* | Pre-handover readiness: who, which unit, what's required, what's missing. | both | …edit any field on it; every value is read-only. |
| **P4** | `تنفيذ التسليم` | The step runner — one step at a time, full-bleed. **Replaces `S_handover`.** | operator | …skip a step, reorder steps, or reach `أكّد التسليم` from here. |
| **P4.1–P4.8** | step views | The eight steps (§3). Each is a view inside P4, not a separate route. | operator | …see the next step's content before the current one commits. |
| **P5** | `مراجعة وتأكيد` *(sheet)* | Final summary + the single irreversible confirm, behind PIN re-auth. | operator | …confirm with any step incomplete or any required upload missing. |
| **P6** | `إيصال التسليم` | Post-handover receipt: reference, unit, time, what the captain left with. | both | …edit or re-open a completed handover. Ever. |
| **P7** | `أوقف وارفع الحالة` *(sheet)* | The one escalation mechanism (§5). | operator | …resolve, close, or categorise the outcome of a case. |
| **P8** | `الحالات المفتوحة` | This point's open escalations, their reference numbers and SLA clocks. | both | …change a case's status; read + add a note only. |
| **P9** | `تسجيل عدم الحضور` *(sheet)* | No-show with a mandatory logged contact attempt. | operator | …mark a no-show before slot +90, or without a contact attempt. |
| **P10** | `زائر بدون ميعاد` *(sheet)* | Log an unbooked visitor as an enquiry. | operator | …create an application, a booking, or a handover from it. |
| **P11** | `مخزون النقطة` | Read-only view of this point's units and their states. | both | …change a unit's state, reassign it, or see another point's stock. |
| **P12** | `بلاغ عطل وحدة` *(sheet)* | Report a defect found at inspection or in the yard. | operator | …choose the replacement unit. The console assigns. |
| **P13** | `إقفال اليوم` | Day close, closing count, end-of-day report, manager sign-off. | manager signs | …close with a session still `جارٍ التنفيذ` or a count mismatch. |
| **P14** | `سجل النقطة` | Append-only activity log for this point: actor, action, timestamp. | manager | …delete, edit, or filter out their own entries. |
| **P15** | `قائمة المزامنة` | What is waiting to upload, its age, and retry. | both | …delete a pending item. Only retry. |
| **P16** | `مستخدمو النقطة` | Add/suspend operators, bind/unbind devices. | manager | …grant a permission the manager does not hold, or create a manager. |
| **G1** | `شريط عدم الاتصال` *(global)* | A persistent bar when offline: what still works, what is queued. | both | …disappear. It is not dismissible. |

Sixteen screens, four of them sheets. That is the whole portal.

---

## 3. The handover — state machine

### 3.1 The states

**Appointment:** `مجدول` → `تم الحضور` → `جارٍ التنفيذ` → one of `تم التسليم` · `تم التسليم (غير متزامن)` · `مُعلّق — مرفوع للإدارة` · `لم يحضر` · `أُلغي`.
`مُعلّق` resolves from the console to `مُعاد جدولته` or `أُلغي`, or back to `جارٍ التنفيذ` when the console unlocks the same session (§5).

**Unit:** `متاح` → `محجوز لميعاد` → `تحت التسليم` → `مُسلّم`. Side exits: `مرتجع — تحت الفحص` (defect), `موقوف — تحقيق` (identity/duplicate-handover conflict), `تحت الترخيص`.

**Session:** a handover session is created on `ابدأ التسليم`, carries a `session_id`, the operator, the device id, and an append-only journal of step commits. It is never deleted; it is completed, abandoned (`مُعلّق`), or expired.

### 3.2 The runner's rules

- **One step on screen at a time**, full-bleed. A thin §5.5 stepper rail at the top shows `الخطوة ٤ من ٨`. The checklist-as-sidebar is cut (§10).
- **A step commits or it does not.** Tapping `كمّل` writes the step's payload to the local journal, syncs if online, and only then renders the next step. Back is possible only to *view* a committed step, never to alter it; changing a committed value requires `أوقف التسليم وارفع الحالة`.
- **Two failure grades, and only two.** `مانع` (blocks — the step will not commit, and the only routes forward are fixing the input or escalating) and `تنبيه` (warns — commits, but the warning text is written into the record and shown in the console).
- **Every commit writes:** `step`, payload, `operator_id`, `device_id`, `at` (device clock + server clock on sync, both stored), coarse geo `[قرار مقترح]`, and `app_version`.

### 3.3 P4.1 · مطابقة الهوية

**Captured.** Captain's national ID number (14 digits, typed from the card, `.lat` + `inputmode="numeric"`); ID expiry date; driving-licence number and expiry; operator attestation checkbox `شفت البطاقة الأصلية في إيدي`.

**Validated.**
- The file's NID is shown **masked to the last 4 digits only** until the operator has typed all 14. This is deliberate: an operator who can read the number off the screen will type the screen, not the card. Reveal-after-entry makes it a real comparison.
- Egyptian NID structural check (century digit, embedded birth date, governorate code) runs client-side before the server compare — it catches a fat-fingered digit without a round trip.
- Exact match against the file → pass. **3 failed attempts → the step locks and auto-opens P7** with category `الهوية غير مطابقة`.
- Arabic name is compared by the operator visually (the file name is shown in full); a `الاسم مختلف شوية` control raises a `تنبيه` with a mandatory note — a transliteration or a missing grandfather's name is normal in Egypt and must not become a blocker.
- ID expiry **in the past** → `مانع` (E3).
- ID expiry **within 30 days** → `تنبيه`, written to the record and pushed to the console as a follow-up.
- Driving licence expired → `مانع` `[قرار مقترح]` — a captain cannot legally ride away.

**Written.** `identity_check`: match true/false, attempts, ID expiry, licence number + expiry, name-variance note, attestation, actor, timestamp.

**On failure the operator sees.** A §5.3 invalid field plus a critical §5.8 notice: `الرقم القومي اللي دخلته مش مطابق للملف. راجع البطاقة الأصلية وجرّب تاني. فاضل محاولتين.`

### 3.4 P4.2 · حضور الضامن ومطابقة مستنداته

**Captured.** `الضامن حاضر` (yes/no — an option-card pair, §5.4); guarantor's NID typed; guarantor's relationship to the captain (read from file, confirmed); a photo of the guarantor holding his ID; guarantor phone confirmation.

**Validated.**
- `الضامن حاضر = لا` → `مانع`, immediate E1 branch. There is **no operator override and no manager override.** The only way a handover proceeds without a guarantor is a console-side flag set **before** the appointment.
- Guarantor NID must match the file exactly → mismatch is `مانع` (E2). This is the substitution attack and it gets no fuzzy tolerance.
- `[قرار مقترح]` **Guarantor phone verification**: the portal sends a 6-digit code to the guarantor's number **on file** and the guarantor reads it aloud; the operator types it. This proves the guarantor in the room controls the number Trade Way will call when things go wrong. Failure is `تنبيه`, not `مانع` — an Egyptian guarantor may genuinely have changed his number — and it raises a `طلب تحديث رقم الضامن` in the console, which the portal may **request** but not apply.

**Written.** `guarantor_check`: present, NID match, photo ref, OTP result, phone-change request ref, actor, timestamp.

**On failure.** `بيانات الضامن مش مطابقة للمسجّل في الملف. تغيير الضامن قرار من تريد واي، مش من المعرض.`

### 3.5 P4.3 · صورة الكابتن ببطاقته

**Captured.** One photo, rear camera only. **Gallery upload is disabled** — the file picker is not wired. This is the cheapest anti-fraud control in the whole flow and it costs nothing.

**Validated.** ≥ 1280px on the long edge (`مانع` if the device cannot produce it — that device fails P1 anyway); at least one face detected (`تنبيه` if none — do not block on a model's opinion in bad forecourt light); Laplacian blur score below threshold → `تنبيه` with a `صوّر تاني` action. The operator can accept a warned photo; the record keeps the warning.

**Written.** `identity_photo`: asset ref, checks, actor, timestamp. (Merged into P4.1 in the reduced 6-step flow, §10.)

### 3.6 P4.4 · مطابقة الوحدة — chassis / engine / plate

The most consequential step. This is where the wrong motorcycle is caught.

**Captured.** Chassis (VIN, 17 chars) — scanned from the frame sticker by camera, with typed fallback; engine number, typed; plate, typed; a photo of the stamped chassis on the frame (not the sticker) `[قرار مقترح]`; a photo of the plate.

**Validated.**
- File values are masked to the last 5 characters until entry is complete — same reveal-after-entry rule as P4.1.
- Comparison ignores spaces, dashes and case. Arabic-Indic and Latin digits are normalised.
- **All three must match.** One mismatch is `مانع`.
- **The scanned unit's state is checked, not just its number:**
  - state = `محجوز لميعاد` **for this appointment** → pass.
  - state = `متاح` or reserved for someone else → `مانع`, E5. The portal offers `اطلب تبديل الوحدة` — a **request** to the console, never a swap. `[قرار مقترح]` The console can approve in-session; the portal polls every 20 s and, on approval, re-opens P4.4 against the new unit with a positive notice.
  - state = `مُسلّم` → **critical stop of the whole session**, E11.
  - state = `مرتجع — تحت الفحص` / `تحت الترخيص` → `مانع`, E4-adjacent.
- Typed fallback instead of scan is permitted but writes `إدخال يدوي` on the record, and **three manual entries in one day at a point** raises a console flag. `[قرار مقترح]` Manual entry does not require a manager PIN — a torn sticker is common and a PIN wall here will produce a shared PIN.

**Written.** `unit_verification`: typed values, scan-vs-manual, match result per field, unit state at check, photo refs, actor, timestamp. On pass, unit → `تحت التسليم`.

**On failure.** `رقم الشاسيه مش مطابق للوحدة المخصصة في الملف. ما تكملش — ارفع الحالة للإدارة.`

### 3.7 P4.5 · الفحص وصور الحالة

**Captured.**
- **8 photos** `[قرار مقترح]`, each a named slot with a framing guide overlay: `أمام`, `خلف`, `جنب يمين`, `جنب شمال`, `العداد`, `رقم الشاسيه`, `الخوذة`, `الملحقات والشنطة`.
- Odometer reading in km (typed, `.lat`).
- Fuel level — three option cards (§5.4): `فاضي` / `ربع` / `نص فأكتر`.
- **A 10-item functional checklist**, each `سليم` / `فيه عيب`: `الفرامل`, `النور الأمامي`, `النور الخلفي والفرامل`, `الإشارات`, `الكلاكس`, `المرايات`, `الكاوتش الأمامي`, `الكاوتش الخلفي`, `التشغيل والبطارية`, `الاستاند والقفل`.

**Validated.**
- All 8 slots filled → `مانع` otherwise. Blur → `تنبيه`.
- **Any item marked `فيه عيب` → `مانع`**, and the only forward route is P12 (defect report). The operator is not asked whether the defect is serious; that judgement is not theirs.
- Odometer > 50 km → `تنبيه` with a mandatory note. Odometer > 200 km → `مانع` + auto-escalate `[قرار مقترح]` — a unit with 200 km on it is not the unit the contract describes.
- Fuel `فاضي` → `تنبيه` only. It is a hospitality failure, not a contractual one.

**Written.** `inspection`: photo refs, odometer, fuel, the 10 results, notes, actor, timestamp. The full photo set is attached to the `محضر التسليم` document and becomes the baseline for any later damage claim.

**Shown to the captain.** The tablet is turned to the captain and the inspection summary is displayed before signing; the signature at P4.6 covers it. The screen carries a line in his dialect: `بص على الفحص ده كويس قبل ما تمضي — ده اللي هنرجعله لو حصلت مشكلة بعدين.`

### 3.8 P4.6 · التوقيع

Four documents, signed in this fixed order: `اتفاق المشاركة` → `جدول الالتزامات` → `إقرار الضامن` (guarantor signs) → `محضر تسليم الموتوسيكل` (captain + operator as witness).

**Captured per document.** Document version id and content hash; a scroll-to-end event (the document view will not enable the agree control until the captain has reached the end — scroll position is tracked and written); the `قرأت ووافقت` tap; the signature canvas image plus stroke count and total stroke time.

**Validated.**
- Order is fixed; no document can be reached before the previous one is signed.
- Signature requires ≥ 2 strokes and ≥ 1.5 s of drawing `[قرار مقترح]` — this rejects the tap-blob that a rushed operator produces when he signs on the captain's behalf.
- `إقرار الضامن` is signed by the guarantor on the same device, immediately after a re-confirmation of who is holding it.
- No document may be signed by a person other than its named signer. The portal has no "sign on behalf" control at all — that is the point.
- Refusal of a term (E6) is a first-class control inside this step: `الكابتن معترض على بند`. Not an error — an outcome.

**Written.** Per document: version, hash, scroll-completed, agreed-at, signature asset, stroke metrics, signer role, actor, timestamp.

**If it fails.** Any documents already signed in this session are marked `مُلغى — التسليم ما اكتملش` and are never usable. A partially signed contract must not exist.

### 3.9 P4.7 · رفع الورق الموقّع

**Captured.** A photo of every signed page. The portal knows the exact page count per document `[قرار مقترح: 4 / 2 / 1 / 2 pages]` and shows named slots — not a free-for-all uploader.

**Validated.** Exact page count per document (`مانع`); readability heuristic (resolution + edge detection) → `تنبيه`; each page tagged to its document automatically by slot.

**Written.** `signed_scans`: asset refs per document per page, actor, timestamp.

**Offline.** See §3.11. Scans queue locally and the handover can still complete.

### 3.10 P4.8 · تدريب السلامة والاستخدام + تسليم الملحقات

**Captured.** A 5-point script, each tapped as read: `الصيانة الدورية ومواعيدها`, `مراكز الخدمة المعتمدة`, `إزاي تبلّغ عن عطل`, `الخوذة والقيادة الآمنة`, `إن الرخصة باسم تريد واي ويعني إيه`. Plus handover of physical items: `مفتاحين`, `خوذة` (serial if present `[قرار مقترح]`), `ملف الورق ونسخة العقد`, `كارت مراكز الخدمة`.

**Validated.** All 10 checkboxes → `مانع` otherwise. Then the captain taps a single `فهمت` on the tablet, which is itself a recorded, timestamped act.

**Written.** `training`: items, captain acknowledgement, accessory handover, actor, timestamp.

### 3.11 P5 · مراجعة وتأكيد — the irreversible act

Opens as a §5.11 sheet. Shows: captain, unit (chassis / engine / plate), guarantor, the 8 step commits with their timestamps, any `تنبيه` raised, and the documents with their page counts.

`أكّد التسليم` is the **only** place the handover completes. It requires operator PIN re-auth `[قرار مقترح]`. It is disabled if any step is uncommitted or any page slot is empty. Below the disabled button, one line states the reason — not a notice block (§10).

On confirm: unit → `مُسلّم`; appointment → `تم التسليم`; the captain's applicant site flips from "track a request" to "track a commitment"; document copies become visible in his account; the receipt (P6) is generated with a reference number.

### 3.12 Offline behaviour — what happens when the tablet drops mid-step

**Architecture.** The portal is local-first. Each step commit is written to an encrypted local journal (IndexedDB) with a monotonic sequence number and a device-key signature, then pushed. Photos are stored locally at capture and uploaded by a background worker. **Nothing in the flow waits on the network except the three server compares** (NID, guarantor OTP, unit state), which are cached at `ابدأ التسليم` — the appointment, the file's NID hash, and the assigned unit's identifiers are all pulled into the session at start, precisely so that an offline handover can still be verified.

**What still works offline.** Every step. Identity and unit comparison run against the cached session payload. Guarantor OTP does not work offline → it degrades to `تنبيه` with `مافيش شبكة — التحقق من رقم الضامن هيتم بعدين` written into the record.

**What happens at the moment of the drop.** The global `G1` bar appears (not dismissible): `مافيش إنترنت. كمّل عادي — كل حاجة بتتحفظ على الجهاز وهترفع لوحدها أول ما الشبكة ترجع.` The current step is unaffected. Nothing is lost, because the last committed step is already on disk.

**Completing offline.** Permitted. The captain is physically taking the motorcycle; a spinner cannot stop him. The handover completes locally, the unit is marked `مُسلّم` locally, and the appointment lands in **`تم التسليم (غير متزامن)`**. The console shows it as provisional. The cap of two unsynced sessions (§1.3) stops a point from accumulating unverifiable handovers. `[قرار مقترح — needs commercial sign-off, §12]`

**If the tablet dies entirely.** Committed-and-synced steps are on the server. Committed-but-unsynced steps and their evidence are on the dead device.
- **Same device recovers within 12 h, same operator:** `P2` shows `كمّل` on the row and the session resumes at the exact step it stopped at. Nothing is redone.
- **Device unrecoverable:** the session is locked. The point taps `أوقف وارفع الحالة`; the console releases the lock; a new session starts on another device **from the last server-synced step**. Every step after that point is redone and the console record marks them `أُعيدت الخطوة` with the reason. This is honest: evidence that never reached a server does not exist.
- **Signatures completed but never synced, device unrecoverable:** the documents must be re-signed. There is no path where Trade Way holds a contract it cannot produce. Escalation category `إعادة توقيع`.

---

## 4. The exception catalogue

Grades: `مانع` blocks the step; `إيقاف كامل` stops the whole session.

---

### E1 · الكابتن حضر من غير الضامن

**Where:** P4.2. **Grade:** `مانع` → `إيقاف كامل` if the guarantor cannot arrive within the slot.
**Portal does:** blocks P4.2. Offers exactly two actions: `الضامن في الطريق — استنى` (parks the session, keeps the slot, 45-minute timer `[قرار مقترح]`) and `أوقف التسليم وارفع الحالة`. No override control exists for either role.
**Blocks:** everything after identity.
**Notified:** booking desk (`التخصيص والمواعيد`) + the captain's case owner. Push + the console's point-cases queue.
**Lands:** appointment `مُعلّق — الضامن غير حاضر`. Unit stays `محجوز لميعاد` with a hold to **23:59 today**, then auto-released to `متاح` `[قرار مقترح]`.
**Arabic shown:**
> **الضامن لازم يحضر بنفسه**
> من غير الضامن وبطاقته الأصلية ما نقدرش نمضي العقد النهارده. المعرض ما يقدرش يستثني الشرط ده. هنحجزلك ميعاد تاني وهيوصلك برسالة.

---

### E2 · بطاقة الضامن مش مطابقة للملف

**Where:** P4.2. **Grade:** `إيقاف كامل`.
**Portal does:** blocks, captures the presented guarantor's NID and photo as evidence, auto-opens P7 pre-filled with category `ضامن مختلف`. The operator cannot choose a different category.
**Blocks:** everything. No retry loop — a mismatched guarantor is not a typo.
**Notified:** document reviewer + case owner + ops manager. Marked `مراجعة` priority.
**Lands:** appointment `مُعلّق — مرفوع للإدارة`. Unit `محجوز لميعاد`, hold 72 h `[قرار مقترح]`.
**Arabic shown:**
> **بيانات الضامن مش مطابقة**
> الضامن المسجّل في ملفك شخص تاني. تغيير الضامن قرار من تريد واي مش من المعرض. رفعنا الحالة، ورقم المتابعة مع الموظف — هيتم التواصل معاك خلال ٤٨ ساعة.

---

### E3 · بطاقة الكابتن منتهية

**Where:** P4.1. **Grade:** `إيقاف كامل`.
**Portal does:** blocks at the expiry field the moment a past date is entered. Offers only P7, category `هوية منتهية`.
**Blocks:** everything.
**Notified:** document reviewer + booking desk.
**Lands:** appointment `مُعلّق — مستند منتهي`. Unit released to `متاح` at end of day — the captain's return needs a document renewal, which is measured in weeks, not hours. `[قرار مقترح]`
**Arabic shown:**
> **البطاقة منتهية**
> ما ينفعش نمضي عقد ببطاقة منتهية. جدّد البطاقة وكلّمنا على نفس الرقم، وهنحجزلك ميعاد جديد من غير ما تبدأ من الأول.

---

### E4 · عيب في الوحدة اتكشف في الفحص

**Where:** P4.5. **Grade:** `إيقاف كامل`.
**Portal does:** the moment any item is marked `فيه عيب`, P4.5 locks and routes to **P12**, pre-filled with the failed items, requiring at least one photo of the defect and a note. On submit, the session ends.
**Blocks:** signature and everything after. Critically, the operator **cannot pick a replacement unit** — P12 has no unit selector. The console assigns.
**Notified:** stock owner + allocation desk. The point manager sees it on P8.
**Lands:** unit → `مرتجع — تحت الفحص` (frozen, not bookable). Appointment → `مُعلّق — بانتظار وحدة بديلة`.
**Arabic shown to the captain:**
> **فيه ملاحظة فنية في الموتوسيكل ده**
> ما ينفعش نسلّمه بالحالة دي — ده لصالحك. هنجهّزلك وحدة تانية وهنبلّغك بالميعاد خلال ٤٨ ساعة، ومش هتدفع ولا تتأخر بسبب ده.

---

### E5 · الشاسيه اللي على الأرض مش مطابق للملف

**Where:** P4.4. **Grade:** `مانع`, convertible.
**Portal does:** blocks. Shows which of chassis/engine/plate mismatched. Offers `صوّر الشاسيه واطلب تبديل الوحدة` — a **request** carrying the scanned number, the photo, and the assigned number. The session parks in `مُعلّق — طلب تبديل وحدة` and polls. If the console approves within the session, P4.4 re-opens against the new unit and the handover continues with a positive notice: `الإدارة وافقت على الوحدة البديلة. كمّل عادي.` If it is not approved within 30 minutes, the session escalates.
**Blocks:** inspection and everything after.
**Notified:** stock owner (immediately) + allocation desk.
**Lands:** the scanned unit → `موقوف — تحقيق` if it is not in this point's book at all; otherwise it stays as it is. The assigned unit stays `محجوز لميعاد`.
**Arabic shown:**
> **رقم الشاسيه مش مطابق**
> الموتوسيكل اللي قدامنا مش الوحدة المسجّلة باسمك. وقفنا الخطوة ورفعنا الحالة للإدارة. استنى معانا دقايق — غالبًا هنجهّزلك وحدة من نفس الموديل النهارده.

---

### E6 · الكابتن رفض بند في العقد على الترابيزة

**Where:** P4.6. **Grade:** `إيقاف كامل`.
**Portal does:** `الكابتن معترض على بند` opens a sheet: pick the document, pick the clause from the document's clause list (not free text alone), add a mandatory note ≥ 20 characters, optional 60-second voice note `[قرار مقترح]`. On submit, **every document already signed in this session is voided** (`مُلغى — التسليم ما اكتملش`) and the session ends. The operator is never offered "explain the clause and continue" — he is not authorised to interpret the contract.
**Blocks:** everything.
**Notified:** contracting team + legal + case owner. This is the one category that always reaches a named Trade Way contracting owner, not a queue.
**Lands:** appointment `مُعلّق — اعتراض على بند`. Unit hold 72 h `[قرار مقترح]`, then `متاح`.
**Arabic shown:**
> **سجّلنا اعتراضك**
> المعرض ما يقدرش يغيّر ولا يشرح أي بند في العقد. سجّلنا اعتراضك بالنص، وفريق تريد واي هيتواصل معاك خلال ٤٨ ساعة. مفيش أي ورقة اتمضت النهارده.

---

### E7 · الكابتن جه في يوم غلط أو نقطة غلط

**Where:** P2 search. **Grade:** informational, not an error.
**Portal does:**
- *Wrong day, right point:* shows a read-only card with the real date and time. Early arrival **up to 2 h before the slot** is allowed and simply checks in `[قرار مقترح]`. Anything earlier, or a different day, cannot start. Action offered: `بلّغ مكتب المواعيد`.
- *Wrong point:* the portal shows the correct point's **name and address only** — never that point's files, stock, or schedule. Action: `بلّغ مكتب المواعيد` (which creates a reschedule request; the point cannot reschedule).
**Blocks:** starting a handover.
**Notified:** booking desk, only if the operator taps.
**Lands:** appointment unchanged (`مجدول`). Nothing is written except a `استفسار نقطة` if the operator notifies.
**Arabic shown (wrong day):**
> **ميعادك مش النهارده**
> ميعادك يوم الأحد ٢٠ سبتمبر الساعة ١١:٣٠ في نفس النقطة. ما نقدرش نسلّم قبل الميعاد. تعالى في ميعادك ومعاك بطاقتك والضامن.

**Arabic shown (wrong point):**
> **ميعادك في نقطة تانية**
> التسليم بيتم من النقطة اللي اخترتها بس: النصر موتورز — المعادي. تحب نبلّغ مكتب المواعيد يغيّرهالك؟

---

### E8 · زائر بدون حجز

**Where:** P2 search returns nothing. **Grade:** not a handover at all.
**Portal does:** offers exactly one action, `سجّل زائر بدون ميعاد` (P10), capturing: name, mobile, last 4 of NID, and reason from a short list (`مرشّح من أوبر ومش عارف يحجز` / `بيسأل عن البرنامج` / `عنده طلب متأخر` / `حاجة تانية`). It creates a `استفسار نقطة` in the console and nothing else. There is no "create an application" button anywhere in this portal.
**Blocks:** everything.
**Notified:** the intake/enquiries queue in the console.
**Lands:** no appointment, no unit movement.
**Arabic shown:**
> **مفيش ميعاد مسجّل بالرقم ده**
> المعرض ما يقدرش يسجّل طلب جديد ولا يحجز ميعاد. سجّلنا رقمك وفريق تريد واي هيكلمك. لو مرشّح من أوبر، التقديم بيتم من اللينك اللي وصلك.

---

### E9 · الكابتن مش قادر يمضي (أمّي أو مصاب)

**Where:** P4.6. **Grade:** two different outcomes, and they must not be confused.

**(a) أمّي — cannot read/write.** `[قرار مقترح — needs legal sign-off, §12]`
**Portal does:** the operator taps `الكابتن مش بيعرف يقرا`, which requires **point-manager PIN**. The document view switches to `قراءة مسموعة`: a fixed, scripted summary in Egyptian dialect appears in large type; the operator reads it aloud while the device records audio; at the end the captain states his agreement aloud on the same recording. The captain then applies a thumbprint **on the paper document** (not on glass — a glass thumbprint is not a print, it is a smudge) and the operator photographs it into the page slot. The point manager signs `محضر التسليم` as a named witness.
**Blocks:** nothing if completed; the manager PIN and the audio recording are both `مانع` if missing.
**Lands:** handover completes, flagged `توقيع ببصمة — بشاهد` on the record. The console shows it in a dedicated review list.
**Arabic shown:**
> **هنقرالك العقد بصوت عالي**
> هنقرالك كل البنود ونسجّل القراءة، وهتبصم بدل التوقيع، ومدير المعرض هيمضي كشاهد. لو في أي حاجة مش مفهومة قول دلوقتي — بعد التوقيع بيبقى ملزم.

**(b) مصاب / مش قادر جسديًا مؤقتًا.**
**Portal does:** no path. `إيقاف كامل` and reschedule.
**Notified:** booking desk.
**Lands:** appointment `مُعلّق — إعادة جدولة`. Unit held 72 h.
**Arabic shown:**
> **هنأجّل التسليم**
> ما ينفعش حد يمضي نيابة عنك. هنأجّل الميعاد لحد ما تقدر تمضي وتسوق بنفسك، والموتوسيكل محجوز باسمك.

---

### E10 · شخص تاني بيستلم بالنيابة عن الكابتن

**Where:** P2 check-in or P4.1. **Grade:** `إيقاف كامل`, absolute.
**Portal does:** blocks at the first identity mismatch. The portal has **no control for a proxy, a توكيل, or a relative** — not for the operator, not for the manager. A power of attorney presented at the counter is not actionable at the counter. `[قرار مقترح: a notarised توكيل is accepted only when Trade Way has approved it in advance and it appears on the captain's file before the appointment. The portal then shows the authorised person's name and NID on P3 and matches against that instead.]`
**Blocks:** everything.
**Notified:** case owner + ops manager. Flagged, because repeated proxy attempts on one file are a fraud signal.
**Lands:** appointment `مُعلّق — محاولة استلام بالنيابة`. Unit `محجوز لميعاد`, hold 72 h.
**Arabic shown:**
> **التسليم للكابتن نفسه بس**
> ما ينفعش حد يستلم نيابة عنه، حتى لو معاه توكيل. لازم يحضر بنفسه ببطاقته الأصلية ومعاه الضامن.

---

### E11 · الموتوسيكل اتسلّم لحد تاني بالغلط

**Where:** P4.4, when the unit's state reads `مُسلّم`. **Grade:** `إيقاف كامل`, priority 1.
**Portal does:** stops the entire session immediately — not the step. Freezes the unit. Pulls the prior handover record into the escalation automatically: the date, the operator, the point, and the receiving captain's reference (name **masked** — the operator has no right to another captain's identity). Emits a P1 escalation without asking the operator to categorise it.
**Blocks:** everything, permanently for this unit until the console clears it.
**Notified:** point manager (in-app, loud) + Trade Way ops manager + programme lead, by push **and** SMS `[قرار مقترح]`. This is the only exception that pages a human out of band.
**Lands:** unit → `موقوف — تحقيق`. Appointment → `مُعلّق — تحقيق`. Both the prior handover and this appointment appear linked in the console.
**Arabic shown to the captain:**
> **فيه لبس في تسجيل الوحدة**
> أوقفنا التسليم دلوقتي لحد ما الإدارة تراجع. ده خطأ عندنا ومش ليك أي دخل فيه ومش هيأثر على دورك. هنكلمك خلال ٢٤ ساعة بميعاد جديد.

---

### E12 · التابلت مات في نص التسليم

**Where:** anywhere in P4. **Grade:** recoverable.
**Portal does:** nothing at the moment of death — the last committed step is already on disk. On restart, `P2` shows the row as `جارٍ التنفيذ — متوقف` with `كمّل`. Recovery rules are in §3.12: same device + same operator + within 12 h resumes exactly; a dead device requires a console unlock and a redo from the last synced step; unsynced signatures mean re-signing.
**Blocks:** starting a *different* handover while one is `متوقف` on the same device.
**Notified:** nobody automatically. If the resume does not happen within 45 minutes, the console's point-health view flags it.
**Lands:** appointment `جارٍ التنفيذ` (stalled). Unit `تحت التسليم`.
**Arabic shown on resume:**
> **التسليم ده متوقف عند خطوة الفحص**
> كل اللي اتسجّل محفوظ. تقدر تكمّل من نفس الخطوة.

**And to the captain, while the operator reboots:**
> **ثانية واحدة، الجهاز بيقفل ويفتح**
> ما ضاعش أي حاجة. هنكمّل من نفس الخطوة.

---

### E13 · رخصة القيادة منتهية `[قرار مقترح]`

**Where:** P4.1. **Grade:** `إيقاف كامل`.
**Portal does:** blocks. Category `رخصة قيادة منتهية`.
**Lands:** appointment `مُعلّق — مستند منتهي`. Unit released end of day.
**Arabic shown:**
> **رخصة القيادة منتهية**
> ما ينفعش تستلم موتوسيكل برخصة منتهية — ده مخالفة عليك وعلينا. جدّدها وكلّمنا نحجزلك ميعاد.

---

### E14 · الوحدة المحجوزة مش موجودة في الجرد

**Where:** P1 (day open) or P4.4. **Grade:** `مانع` at the appointment level.
**Portal does:** flags the appointment `الوحدة غير مؤكدة` on P2 from the start of the day, so the discovery happens at 9 a.m. and not with the captain standing there. `ابدأ التسليم` is disabled on that row.
**Notified:** stock owner + allocation desk, at day open.
**Lands:** appointment `مُعلّق — بانتظار وحدة بديلة` when the slot arrives unresolved.
**Arabic shown to the operator:** `الوحدة المخصصة للميعاد ده مش متأكدة في الجرد. بلّغ الإدارة قبل ما الكابتن يوصل.`

---

## 5. Stop-and-escalate — the single mechanism

There is one escalation control in the entire portal: **`أوقف التسليم وارفع الحالة`** (destructive variant, §5.2). It is present in the P4 header on every step and inside P3. Nothing else escalates, and no exception has its own private channel.

**What it captures.**
| Field | Rule |
|---|---|
| `التصنيف` | One of a fixed list of 11 (see below). Some exceptions pre-fill it and lock it (E2, E4, E11). |
| `الوصف` | Free text, minimum 20 characters. The placeholder is `اكتب اللي حصل بالظبط` — not "notes". |
| `صور` | Up to 4, camera only. Mandatory for E4, E5, E11. |
| `صوت` | Optional, ≤ 60 s. `[قرار مقترح]` — a noisy forecourt argument is faster to record than to type. |
| `الكابتن لسه موجود؟` | Yes/no. This is what determines the SLA clock. |
| Automatic | session id, step reached, every committed step, the unit, the operator, the device, the timestamps, the last 3 validation failures. |

The operator is **not** asked what should happen next. He describes; Trade Way decides.

**Fixed categories.** `الهوية غير مطابقة` · `هوية أو رخصة منتهية` · `الضامن غير حاضر` · `ضامن مختلف` · `عيب في الوحدة` · `عدم تطابق الشاسيه` · `طلب تبديل وحدة` · `اعتراض على بند` · `محاولة استلام بالنيابة` · `وحدة مُسلّمة مسبقًا` · `مشكلة في الجهاز أو الشبكة`.

**Where it lands.** A new **`حالات نقاط التوزيع`** queue in the admin console, surfaced on the ops dashboard (`لوحة التشغيل`) as a count tile and on the `نقاط التوزيع` table as a per-point column. Each case carries an SLA:
- Captain still present → **15 minutes** to first response `[قرار مقترح]`. These sit at the top, with a live clock.
- Captain has left → **24 hours**.
- E11 → immediate page, no queue.

**What the captain is told.** A reference number in the form `ESC-2026-0417`, shown on screen and sent by SMS to his number on file, plus the plain promise attached to the category (24 h / 48 h). The operator reads him the line from the copy deck (§8, C-ESC-1); he does not improvise.

**How the appointment resumes.** The console resolves a case with exactly one of four outcomes, and each maps to a portal behaviour:
| Console outcome | Portal effect |
|---|---|
| `استكمل نفس الميعاد` | The session unlocks at the blocked step. P2 shows the row as `الإدارة وافقت — كمّل`, with a positive §5.8 notice naming who approved and when. |
| `ابدأ من جديد بوحدة بديلة` | The old session closes as `مُلغى`; a new session is created against the new unit; the portal starts at P4.4. Identity and guarantor steps are **not** redone within the same day `[قرار مقترح]`. |
| `أعد الجدولة` | Appointment → `مُعاد جدولته` with a new date; the unit hold is set per §4; the row leaves today's queue. |
| `أغلق الطلب` | Appointment → `أُلغي`; the unit returns to `متاح`; the point sees only `اتقفلت من الإدارة` and no reason — a rejection reason is not the showroom's business. |

The point can never resolve, re-categorise, or close a case. On P8 it can read the case, see its clock, and add a note.

---

## 6. The boundary with the admin console

### 6.1 Events the portal emits

| Event | What changes in the console |
|---|---|
| `point.day_opened` | Point marked open for the day; opening stock snapshot recorded; device-check result stored. |
| `stock.count_recorded` | Per-unit confirmation stored; variances opened as `فرق جرد` items on the stock view. |
| `appointment.checked_in` | Appointment → `تم الحضور`; arrival time recorded against the slot (feeds punctuality). |
| `handover.session_started` | Appointment → `جارٍ التنفيذ`; unit → `تحت التسليم`; session appears live on the ops dashboard. |
| `handover.step_committed` | Step, payload, actor, device, timestamps appended to the handover record; live progress on the ops dashboard. |
| `handover.validation_failed` | Failure counter on the appointment; 3 failures on identity or unit raise a flag. |
| `handover.warning_raised` | `تنبيه` written to the record and surfaced in the profile's decision log. |
| `handover.completed` | Unit → `مُسلّم`; appointment → `تم التسليم`; captain's site flips to commitment tracking; documents released to his account; compliance clock starts. |
| `handover.completed_offline` | As above, but flagged `غير متزامن` until evidence lands; the point is marked un-reconciled. |
| `handover.evidence_synced` | Clears the `غير متزامن` flag once every asset has landed. |
| `unit.defect_reported` | Unit → `مرتجع — تحت الفحص`; a stock/workshop task opens; allocation is asked for a replacement. |
| `unit.swap_requested` | A request item on the allocation desk; **no state change until a human approves**. |
| `appointment.no_show` | Appointment → `لم يحضر`; contact attempt logged; rebooking task opens; unit hold set. |
| `walkin.logged` | A `استفسار نقطة` in the intake queue. Creates nothing else. |
| `escalation.opened` | A case in `حالات نقاط التوزيع` with its SLA clock. |
| `escalation.note_added` | Appended to the case thread, attributed to the point. |
| `profile.update_requested` | A **pending request** on the profile (phone, address, guarantor phone). Never applied automatically. |
| `point.day_closed` | Point marked reconciled; end-of-day report stored; the five numbers land on the point's row. |

### 6.2 Fields the console owns — the portal may only read

| Field | Why the portal cannot touch it |
|---|---|
| Acceptance decision and its reason | A programme decision. The point sees `مقبول` and nothing else. |
| Screening score / priority rating | Internal. Not shown at all. |
| Programme terms — 12-month term, ownership matrix, hours/days/acceptance/cancellation targets | Commercial. Read-only display in the contract view. |
| Document approval status and rejection reasons | Reviewer's decision. The portal shows `مُعتمد` / `ناقص`; it can never approve or un-reject. |
| Unit ↔ captain assignment | Allocation's decision. The portal verifies the assignment; it does not make it. |
| Unit master data — chassis, engine, plate, model, year | Registry. The portal compares against it. |
| Appointment date, time, and point | Booking's. The portal can request a change, not make one. |
| Guarantor identity of record | The portal can request an update to the phone; nothing else. |
| Contract document versions and clause text | Legal. Version-pinned and hashed. |
| Compliance data and recovery cases | Not visible to the point at all. |
| Other points' stock, appointments, files, performance | Not visible. Not fetchable. Enforced server-side by point scope on every request, not by hiding UI. |
| Captain's full national ID number | Masked to last 4 until typed (§3.3), never displayed in full afterwards. |
| Escalation status, category after lock, and resolution | Trade Way's. Read + note only. |

### 6.3 What the portal **may write** — the complete list

1. Day-open record: device-check results, opening stock confirmations and variances.
2. Check-in: arrival timestamp and attendance.
3. Handover session: creation, step commits, validation results, warnings, abandonment.
4. Identity check result (match, attempts, ID expiry, licence number + expiry, name-variance note, operator attestation).
5. Guarantor check result (presence, match, photo, OTP result).
6. Identity photo (captain + ID).
7. Unit verification: typed chassis / engine / plate, scan-vs-manual, per-field match, unit state at check, chassis and plate photos.
8. Inspection: 8 condition photos, odometer, fuel level, 10 functional results, notes.
9. Signature artefacts: per document — version id, content hash, scroll-completed, agreement tap, signature image, stroke metrics, signer role.
10. Scans of every signed page, slotted per document.
11. Training acknowledgement and accessory handover (keys, helmet, folder, service card).
12. Handover completion — the only write that flips a unit to `مُسلّم`.
13. Defect report (the only write that flips a unit to `مرتجع — تحت الفحص`).
14. No-show mark plus the logged contact attempt.
15. Walk-in enquiry record.
16. Escalation case: open, plus notes. **Never** resolve, re-categorise, or close.
17. Unit-swap **request**.
18. Profile-update **requests** (captain phone/address, guarantor phone).
19. Day-close record: closing count, the five numbers, manager sign-off.
20. Point user administration within the point (manager only): add/suspend operator, bind/unbind device.

Anything not on this list, the portal reads.

---

## 7. Permissions

### 7.1 Roles
- **`مشغّل` — operator.** Runs the day. Executes handovers. Cannot sign off the day, cannot witness a thumbprint signature, cannot administer users.
- **`مدير النقطة` — point manager.** Everything the operator can do, plus: resolve stock variances, witness the E9(a) thumbprint path, sign off day close, administer point users and device binds, view the point log.
- `[قرار مقترح]` There is no third role. An auditor reads from the console, not from here.

### 7.2 Matrix

| Action | مشغّل | مدير النقطة | Never, for either |
|---|:---:|:---:|---|
| Log in on a bound device | ✔ | ✔ | |
| Bind a new device | ✖ | ✔ | |
| Open the day | ✔ | ✔ | |
| Confirm a stock unit | ✔ | ✔ | |
| Resolve a stock variance | ✖ | ✔ | |
| View today's queue / search this point's files | ✔ | ✔ | |
| View another point's anything | ✖ | ✖ | ✖ |
| Check a captain in | ✔ | ✔ | |
| Start a handover | ✔ | ✔ | |
| Commit a handover step | ✔ | ✔ | |
| Re-open or edit a committed step | ✖ | ✖ | ✖ |
| Skip or reorder a step | ✖ | ✖ | ✖ |
| Override a `مانع` | ✖ | ✖ | ✖ |
| Manual chassis entry (scan failed) | ✔ (flagged) | ✔ (flagged) | |
| Witness the thumbprint path (E9a) | ✖ | ✔ | |
| Confirm a handover (PIN re-auth) | ✔ | ✔ | |
| Edit or reverse a completed handover | ✖ | ✖ | ✖ |
| Mark a no-show (after logged attempt) | ✔ | ✔ | |
| Log a walk-in | ✔ | ✔ | |
| Report a unit defect | ✔ | ✔ | |
| Choose a replacement unit | ✖ | ✖ | ✖ |
| Open an escalation | ✔ | ✔ | |
| Add a note to a case | ✔ | ✔ | |
| Resolve / close / re-categorise a case | ✖ | ✖ | ✖ |
| Change an acceptance decision | ✖ | ✖ | ✖ |
| Change any programme term | ✖ | ✖ | ✖ |
| Approve or un-reject a document | ✖ | ✖ | ✖ |
| Reassign a unit to another captain | ✖ | ✖ | ✖ |
| Reschedule an appointment | ✖ (request) | ✖ (request) | ✖ |
| Apply a profile change | ✖ (request) | ✖ (request) | ✖ |
| Close the day / sign the report | ✖ | ✔ | |
| View the point activity log | ✖ | ✔ | |
| Add / suspend a point operator | ✖ | ✔ | |
| Create another manager | ✖ | ✖ | ✖ (console only) |
| Retry a sync item | ✔ | ✔ | |
| Delete a sync item | ✖ | ✖ | ✖ |

---

## 8. Copy deck — Egyptian Arabic

Rule: **buttons say the outcome, never `متابعة` or `تأكيد` alone.** Anything the captain might read over the operator's shoulder is in dialect, short, and never blames him.

### 8.1 Buttons

| ID | Context | Label |
|---|---|---|
| B-01 | P1 | `ابدأ جرد النهارده` |
| B-02 | P1, per unit | `الوحدة موجودة` / `مش موجودة` |
| B-03 | P1 | `افتح اليوم وابدأ الشغل` |
| B-04 | P2 search | `دوّر` · `امسح كود التذكرة` |
| B-05 | P2 row | `سجّل الحضور` |
| B-06 | P2 row | `ابدأ التسليم` |
| B-07 | P2 row | `كمّل التسليم` |
| B-08 | P2 row | `افتح الملف` · `افتح الحالة` · `اطبع الإيصال` |
| B-09 | P2 row, late | `سجّل عدم حضور` |
| B-10 | P2 empty search | `سجّل زائر بدون ميعاد` |
| B-11 | P4, every step | `أوقف التسليم وارفع الحالة` |
| B-12 | P4.1 | `طابق البطاقة` |
| B-13 | P4.2 | `الضامن حاضر` / `الضامن مش حاضر` |
| B-14 | P4.2 | `ابعت كود للضامن` · `أكّد الضامن` |
| B-15 | P4.3 / P4.5 | `افتح الكاميرا وصوّر` · `صوّر تاني` |
| B-16 | P4.4 | `امسح الشاسيه بالكاميرا` · `اكتب الرقم بنفسي` |
| B-17 | P4.4 | `طابق الوحدة` |
| B-18 | P4.4 fail | `صوّر الشاسيه واطلب تبديل الوحدة` |
| B-19 | P4.5 | `خلّص الفحص` |
| B-20 | P4.5 defect | `بلّغ عن العيب` |
| B-21 | P4.6 | `اقرا العقد للآخر` · `قرأت ووافقت` · `امضي هنا` · `امسح التوقيع` |
| B-22 | P4.6 | `الكابتن معترض على بند` |
| B-23 | P4.6 | `الكابتن مش بيعرف يقرا` |
| B-24 | P4.7 | `صوّر الصفحة` · `صوّر تاني` |
| B-25 | P4.8 | `سلّمت الخوذة والمفاتيح` · `الكابتن فهم` |
| B-26 | P5 | `راجع وأكّد` |
| B-27 | P5, final | `أكّد التسليم نهائيًا` |
| B-28 | P5 | `ارجع للخطوات` |
| B-29 | P6 | `ابعت الإيصال برسالة` · `اطبع` · `ارجع للمواعيد` |
| B-30 | P7 | `ارفع الحالة للإدارة` · `ارجع من غير ما ترفع` |
| B-31 | P9 | `أكّد إنه ما حضرش` |
| B-32 | P13 | `أقفل اليوم` · `أكّد الإقفال بالـ PIN` |
| B-33 | P15 | `جرّب ترفع تاني` |
| B-34 | E7 | `بلّغ مكتب المواعيد` |

### 8.2 Confirmations (destructive or irreversible)

| ID | Trigger | Copy |
|---|---|---|
| C-01 | `أكّد التسليم نهائيًا` | **`أكّد التسليم؟`** — `بعد ما تأكّد، الموتوسيكل يبقى مُسلّم رسميًا للكابتن وما ينفعش ترجع في الخطوة دي من المعرض. اتأكد إن كل الورق اتمضى واترفع.` → `أكّد التسليم نهائيًا` / `مش دلوقتي` |
| C-02 | `أوقف التسليم وارفع الحالة` | **`هتوقف التسليم؟`** — `التسليم هيقف والإدارة هتراجع الحالة. الورق اللي اتمضى في الجلسة دي هيتلغي وما ينفعش يتستعمل تاني.` → `أوقف وارفع` / `كمّل التسليم` |
| C-03 | `سجّل عدم حضور` | **`تسجّله إنه ما حضرش؟`** — `لازم تكون اتصلت بيه الأول. ده هيلغي ميعاد النهارده ويرجّع الموتوسيكل للمخزون.` → `أكّد إنه ما حضرش` / `استنى شوية كمان` |
| C-04 | `بلّغ عن العيب` | **`تبلّغ عن عيب في الوحدة؟`** — `الوحدة هتتوقف عن التسليم لحد ما الورشة تفحصها، والتسليم النهارده هيتأجل.` → `بلّغ عن العيب` / `راجع الفحص تاني` |
| C-05 | `الكابتن معترض على بند` | **`تسجّل اعتراض على بند؟`** — `التسليم هيقف، وأي ورق اتمضى هيتلغي. مفيش حد في المعرض يقدر يعدّل أو يشرح البند.` → `سجّل الاعتراض` / `ارجع` |
| C-06 | `أقفل اليوم` | **`تقفل اليوم؟`** — `مش هتقدر تبدأ تسليم جديد بعد الإقفال. راجع إن كل المواعيد اتقفلت وكل الحاجة اترفعت.` → `أقفل اليوم` / `لسه` |
| C-07 | `الكابتن مش بيعرف يقرا` | **`تفتح مسار القراءة المسموعة؟`** — `محتاج مدير المعرض يدخل الـ PIN، وهنسجّل صوت القراءة، والكابتن هيبصم، والمدير هيمضي كشاهد.` → `افتح المسار` / `ارجع` |

### 8.3 Errors and blocks

| ID | Where | Copy |
|---|---|---|
| E-01 | P4.1 | `الرقم القومي مش مطابق للملف. راجع البطاقة الأصلية وجرّب تاني. فاضل ٢ محاولات.` |
| E-02 | P4.1 | `خلصت المحاولات. التسليم اتوقف ولازم يترفع للإدارة.` |
| E-03 | P4.1 | `البطاقة منتهية. ما ينفعش نمضي عقد ببطاقة منتهية.` |
| E-04 | P4.1 | `رخصة القيادة منتهية. ما ينفعش تستلم موتوسيكل برخصة منتهية.` |
| E-05 | P4.1 warn | `الاسم مختلف شوية عن الملف. اكتب الفرق بالظبط قبل ما تكمّل.` |
| E-06 | P4.2 | `الضامن لازم يحضر بنفسه ببطاقته الأصلية. مفيش استثناء من المعرض.` |
| E-07 | P4.2 | `بيانات الضامن مش مطابقة للملف. تغيير الضامن قرار من تريد واي.` |
| E-08 | P4.2 warn | `الكود ما وصلش لرقم الضامن. كمّل وهنراجع الرقم بعدين.` |
| E-09 | P4.3 | `لازم صورة واحدة على الأقل للكابتن وهو ماسك بطاقته.` |
| E-10 | P4.3 warn | `الصورة مش واضحة. يفضل تصوّرها تاني.` |
| E-11 | P4.4 | `رقم الشاسيه مش مطابق. ما تكملش وارفع الحالة.` |
| E-12 | P4.4 | `رقم الموتور مش مطابق للوحدة المخصصة.` |
| E-13 | P4.4 | `اللوحة مش مطابقة للوحدة المخصصة.` |
| E-14 | P4.4 | `الوحدة دي محجوزة لكابتن تاني. ما ينفعش تتسلّم هنا.` |
| E-15 | P4.4 | `الوحدة دي مسجّلة إنها اتسلّمت قبل كده. وقفنا التسليم وبلّغنا الإدارة فورًا.` |
| E-16 | P4.5 | `ناقص ٣ صور من صور الحالة. كمّلهم قبل ما تقفل الفحص.` |
| E-17 | P4.5 | `فيه بند متعلّم عليه «فيه عيب». لازم تبلّغ عن العيب — ما ينفعش تكمّل التسليم.` |
| E-18 | P4.5 warn | `العداد أعلى من المتوقع. اكتب السبب.` |
| E-19 | P4.5 | `العداد أعلى من الحد المسموح للوحدة الجديدة. التسليم اتوقف.` |
| E-20 | P4.6 | `لازم الكابتن يوصل لآخر المستند قبل ما يوافق.` |
| E-21 | P4.6 | `التوقيع مش واضح. خلّي الكابتن يمضي تاني.` |
| E-22 | P4.6 | `إقرار الضامن بيمضيه الضامن نفسه. سلّمه الجهاز.` |
| E-23 | P4.7 | `ناقص صفحتين من اتفاق المشاركة. صوّر كل صفحة موقّعة.` |
| E-24 | P5 disabled | `فاضل: صور الحالة، ورفع الورق الموقّع.` |
| E-25 | P2 | `مفيش ميعاد مسجّل بالرقم ده في النقطة دي.` |
| E-26 | P2 | `ميعادك مش النهارده. ميعادك يوم ٢٠ سبتمبر الساعة ١١:٣٠.` |
| E-27 | P2 | `ميعادك في نقطة تانية: النصر موتورز — المعادي.` |
| E-28 | P2 | `في تسليمتين لسه ما اترفعوش. استنى الشبكة ترجع قبل ما تبدأ تسليم جديد.` |
| E-29 | P1 | `الوحدة المخصصة لميعاد النهارده مش موجودة في الجرد. بلّغ الإدارة قبل ما الكابتن يوصل.` |
| E-30 | P13 | `فيه تسليم لسه جارٍ. اقفله أو ارفعه للإدارة قبل ما تقفل اليوم.` |
| E-31 | P0 | `الجهاز ده مش مربوط بالنقطة. مدير المعرض لازم يربطه.` |

### 8.4 Notices (§5.8) and status lines

| ID | Tone | Copy |
|---|---|---|
| N-01 | Informational, P3 | `التسليم بيتم في زيارة واحدة: مطابقة، فحص، توقيع، واستلام في نفس اليوم. مفيش «امضي دلوقتي واستلم بعدين».` |
| N-02 | Informational, P3 | `المعرض بينفّذ التسليم بس. ما يقدرش يغيّر قرار قبول، ولا شرط في العقد، ولا يخصص الموتوسيكل لحد تاني.` |
| N-03 | Attention, G1 offline | `مافيش إنترنت. كمّل عادي — كل حاجة بتتحفظ على الجهاز وهترفع لوحدها أول ما الشبكة ترجع.` |
| N-04 | Attention, P2 | `٣ مواعيد النهارده وحداتها مش مؤكدة في الجرد. بلّغ الإدارة دلوقتي.` |
| N-05 | Positive, P6 | `تم التسليم. الموتوسيكل بقى مسجّل باسم الكابتن في البرنامج، ونسخة الورق ظهرت في حسابه.` |
| N-06 | Attention, P6 | `التسليم اتسجّل على الجهاز ولسه بيترفع. متقفلش التابلت لحد ما يخلص.` |
| N-07 | Positive, P4.4 after approval | `الإدارة وافقت على الوحدة البديلة. كمّل التسليم عادي.` |
| N-08 | Critical, P4 | `التسليم متوقف. الإدارة بتراجع الحالة رقم ESC-2026-0417.` |
| N-09 | Informational, P4.5 shown to captain | `بص على الفحص ده كويس قبل ما تمضي — ده اللي هنرجعله لو حصلت مشكلة بعدين.` |
| N-10 | Attention, P4.6 | `اقرا البنود للكابتن بصوت عالي لو طلب. متقولش رأيك في أي بند.` |

### 8.5 What the operator reads to the captain

| ID | Moment | Script |
|---|---|---|
| C-ESC-1 | Any escalation | `أنا وقفت التسليم ورفعت الحالة لتريد واي. رقم المتابعة بتاعك ESC-2026-0417 وهيوصلك برسالة. هيكلموك خلال ٤٨ ساعة. أنا في المعرض ما ليش قرار في الموضوع ده.` |
| C-ESC-2 | Captain still present, waiting | `الإدارة بتراجع دلوقتي. استنى معايا ١٥ دقيقة ولو ما ردّوش هنحجزلك ميعاد تاني في نفس الأسبوع.` |
| C-HOLD-1 | Unit held | `الموتوسيكل محجوز باسمك ٧٢ ساعة. مش هيتاخد من حد تاني.` |
| C-DONE-1 | After confirm | `خلاص، الموتوسيكل بقى باسمك في البرنامج. نسخة العقد في حسابك على الموقع. لو حصل أي عطل بلّغ من التطبيق مش من المعرض.` |

---

## 9. Measurement — the five numbers

| # | Number | Definition | Target `[قرار مقترح]` | Where shown |
|---|---|---|---|---|
| 1 | **نسبة الإتمام من أول مرة** | completed handovers ÷ appointments where the captain attended | ≥ 90% | P13 end-of-day tile · P2 manager strip · console `نقاط التوزيع` column · ops dashboard |
| 2 | **متوسط زمن التسليم** | median (check-in → confirm), excluding escalated sessions | ≤ 45 min | P13 tile with threshold tick · console point row · ops dashboard |
| 3 | **نسبة عدم الحضور** | no-shows ÷ scheduled appointments, 7-day rolling | ≤ 12% | P13 tile · console point row · booking desk |
| 4 | **حالات مرفوعة لكل ١٠٠ تسليم** | escalations ÷ handovers × 100, split by category | ≤ 8 | P13 tile · P8 header · console point row (the split is console-only) |
| 5 | **دقة الجرد** | units matching the book at day open ÷ units counted | 100% | P1 header · P13 tile · console stock view |

Number 4's category split is the one that actually diagnoses a point: many `عيب في الوحدة` means a logistics problem, many `الضامن غير حاضر` means a booking-communication problem, and many `الهوية غير مطابقة` at one point means something that needs a visit.

`[قرار مقترح]` Number 2's target of 45 minutes contradicts the current prototype's `التسليم عملية ٩٠ دقيقة` line in `S_points`. At ~50 handovers/day across 6 points that is 8–9 per point per day; at 90 minutes each that needs two parallel bays per point all day. The target and the capacity model must be reconciled — see §12.

---

## 10. What I would cut from the current prototype

1. **The standalone search card at the top of `S_pqueue`.** Two competing cards at the top of a tablet screen, and the day's list — the actual object of work — is pushed below the fold. **Merge** search into the `P2` header as a persistent field + scan button.
2. **The result card that repeats the table row** (`الموتوسيكل المخصص / الغرض / الضامن` grid). It duplicates data that belongs in the captain card. **Merge** into `P3`, opened from a row.
3. **`توقيع فقط` as a purpose.** It appears in `S_pqueue` (`عبد الله شعبان — توقيع فقط`) and in `S_alloc` (`تسليم خلال ٧ أيام`). The client removed the sign-now-collect-later path. It must be deleted from both screens, from the purpose enum, and from the booking flow. Leaving it in the prototype guarantees someone builds it.
4. **`مخصص مبدئيًا لتفعيل الحساب` appearing as a bookable state.** It is legitimate as a stock state (Uber account activation needs unit data) but a unit in that state must never be reservable for an appointment, and the portal must never show it as available.
5. **The split layout of `S_handover`** — checklist on one side, current step on the other. On a forecourt tablet it shrinks the camera viewfinder and the signature canvas, which are the two controls that must be biggest, and a permanently visible list of eight steps invites the operator to work out of order. **Replace** with one step full-bleed plus a thin §5.5 stepper rail.
6. **The "الورق الموقّع" card rendered at step 3.** Showing four empty upload slots five steps before they are relevant is noise. **Move** it to appear only at `P4.7`.
7. **The `notice n-warn` explaining "مفيش تأكيد تسليم قبل الورق".** That is designer-to-client prose sitting in an operator's screen. **Replace** with one line under the disabled button naming what is still missing (E-24). A notice that explains a disabled button is a disabled button that failed to explain itself.
8. **`أكّد التسليم` living in the page header, beside the stop button.** The single irreversible contractual action must not sit one thumb-slip from `أوقف التسليم`. **Move** it into `P5` behind the summary and PIN re-auth — and give the header the escalate button alone.
9. **Merge two of the eight steps.** `صورة الكابتن ببطاقته` belongs inside `مطابقة الهوية` — it is the evidence *for* that check, captured in the same breath while the card is in the operator's hand. And `رفع الورق الموقّع` belongs inside `التوقيع` — sign a page, photograph it, next page; making them separate steps means the operator collects four signed documents into a pile and then re-sorts them, which is where pages go missing. **Eight steps become six**, and the flow gets shorter without losing a single control. `[قرار مقترح]`
10. **`الطاقة ١٠` as a bare number on `S_pqueue`.** An operator does not need the point's configured capacity; he needs `فاضل ٣ مواعيد`. **Replace** with remaining slots.
11. **The point tab showing the Trade Way lockup and a point pill and nothing else.** The `pointShell` header is the most valuable strip on the screen and it currently carries a date. **Replace** its contents with: point name, operator name, day-open status, offline indicator, pending-sync count, open-cases count.

---

## 11. New components — and why the existing vocabulary did not cover them

Everything in this spec is built from `DESIGN-SYSTEM.md` §5 except three. Each is justified, and each reuses existing tokens rather than introducing new ones.

1. **`كاميرا بخانة محددة` — slotted capture tile.** The §5.4 option card and the §5.9 table both fail here: the operator needs a named target (`جنب يمين`), a live framing guide, and a captured-thumbnail state, all at a ≥ 120px tap target he can hit without looking. Built as an option-card body with a 4:3 media area; selected state borrows `--accent-edge` / `--accent-subtle` unchanged. Used in P4.3, P4.5, P4.7.
2. **`لوحة التوقيع` — signature canvas.** Nothing in §5 draws. It is a `--surface` area with a `--border-strong` frame, a `--hairline` baseline, a `--r-md` radius, `امسح التوقيع` as a tertiary button, and a caption naming the signer. It must be at least 280px tall in landscape — this is the one place where a component's minimum size is a legal requirement and not a taste.
3. **`شريط الحالة العام` — the offline/sync bar (`G1`).** A §5.8 notice is dismissible-shaped and flows with content; this must be pinned, persistent, and never dismissible. It is closest to §5.10's sticky bar, inverted to the top, in the attention family. Proposed as a variant of §5.10 rather than a new component.

Everything else: §5.1 pills for all states, §5.2 buttons (destructive for escalate, primary for step commit, tertiary for row actions), §5.3 inputs with `.lat` on every code field, §5.4 option cards for fuel level and guarantor presence, §5.5 stepper for the handover rail, §5.6 timeline for the device check and the escalation thread, §5.7 metric tiles for the five numbers, §5.8 notices for the four tones, §5.9 tables for the queue and the stock, §5.11 sheets for P3/P5/P7/P9/P10/P12.

---

## 12. يحتاج قرار — commercial and legal decisions this spec depends on

Each of these changes the design materially. None of them can be decided by a designer.

1. **حجية التوقيع الإلكتروني.** Is a finger signature on a tablet enforceable for this contract under قانون التوقيع الإلكتروني ١٥ لسنة ٢٠٠٤ and ITIDA accreditation? If **no**, then the wet-ink paper is the contract and the tablet signature is only corroborating evidence — which inverts P4.6/P4.7: the scan becomes the legal artefact and the canvas becomes optional. The whole signature step's design depends on this answer and it should be answered first.
2. **مسار الكابتن الأمّي (E9a).** Is audio-recorded reading + thumbprint on paper + a named witness from the *showroom* sufficient? Or does an illiterate signatory require الشهر العقاري / a notary? If it requires a notary, illiterate captains cannot be served at a distribution point at all and need a separate path. Given the target population, this is not an edge case — estimate the share before designing around it.
3. **التوكيل.** Is a notarised power of attorney ever acceptable for collection? This spec says never at the counter, and only with prior Trade Way approval visible on the file. Confirm.
4. **الضامن — هل فيه حالة بدون ضامن؟** This spec treats the guarantor as absolute and un-overridable. If Uber-nominated captains above a trip threshold can be exempted, say so now — it is a server-side flag, not a portal control, and it must never become a point-level decision.
5. **مدة حجز الوحدة بعد توقف التسليم.** Proposed: 72 h for objections/proxy/guarantor-mismatch, end-of-day for expired documents, indefinite freeze for defects and investigations. Idle stock at 3,000 units has a real cost; finance owns this number.
6. **التسليم بدون شبكة.** Is Trade Way willing to let a motorcycle leave the forecourt with signatures and scans not yet on a server? This spec says yes, capped at two unsynced sessions per point. If the answer is no, the portal needs a hard online gate at P5 and the points need guaranteed connectivity — which is a procurement decision, not a design one.
7. **زمن التسليم المستهدف.** 45 minutes (this spec) vs 90 minutes (current prototype). At 50 handovers/day this is the difference between 6 points and 12 bays. Decide before point contracts are signed.
8. **حد العداد.** Proposed: warn above 50 km, block above 200 km. What does "new" mean in the contract, and who eats a unit that was test-ridden?
9. **الصفة القانونية للمعرض.** Is the showroom Trade Way's agent for signing purposes? Who is the named witness on `محضر التسليم` — the operator, or must it be the point manager? This spec has the operator witness by default and the manager witness only on the thumbprint path.
10. **رخصة القيادة المنتهية كمانع.** Confirmed as a hard block here. Also: is there a minimum remaining validity (this spec proposes none, only non-expired)?
11. **المسؤولية في حالة E11** (unit already recorded as handed over). Who bears the loss, and what is the point's exposure? This determines whether E11 pages the point manager or bypasses him entirely.
12. **حماية البيانات.** Retention period for condition photos, identity photos, signature images and audio recordings under قانون حماية البيانات الشخصية ١٥١ لسنة ٢٠٢٠; and the consent notice the captain must be shown before the first photo at P4.3. The portal currently has no such notice and it needs one.
13. **التحقق من رقم الضامن بكود.** Proposed as a warning-only OTP. Confirm that a guarantor with a changed number should not block a handover.
14. **عدد صفحات كل مستند.** P4.7 enforces exact page counts (proposed 4 / 2 / 1 / 2). Legal must fix the page count per document version, and the portal must be told when a version changes.

---

*End of specification.*
