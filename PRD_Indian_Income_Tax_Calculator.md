# PRD: Indian Income Tax Calculator (Old vs New Regime)

**Target project path (local machine):** `/Users/nitinsubramanyar/codebasics/AIPro/First_Web_app`
**Document version:** 1.0
**Last updated:** August 2026
**Author:** Product owner (you) — for hand-off to an AI coding tool

---

## 1. Overview

A single-page web app that helps an individual Indian taxpayer estimate and compare their income tax liability under the **Old Tax Regime** and the **New Tax Regime** for **FY 2026-27 (AY 2027-28)**. The user answers a short series of guided questions about income and deductions, and the app calculates and displays a side-by-side comparison — entirely in the browser, with no data leaving the user's machine.

### 1.1 Goals
- Walk the user through data entry step by step (not one giant form).
- Calculate tax correctly under **both** regimes using current slabs, rebates, surcharge, and cess.
- Clearly show which regime is cheaper and by how much.
- Suggest simple, concrete ways the user could reduce their tax further next financial year, based on deductions they haven't fully used.
- 100% client-side computation — no backend, no network calls, no data storage outside the browser session.

### 1.2 Non-Goals (out of scope for v1)
- Filing returns or integrating with the Income Tax Department / e-filing portal.
- Handling business/professional income, capital gains, or presumptive taxation schemes.
- Multi-year comparison or historical FY slabs.
- User accounts, login, or saving data across sessions (unless explicitly added in a later phase — see Phase 6).
- Personalized financial/investment advice (e.g., which specific fund or insurance policy to buy) — the app can point out unused deduction *headroom*, but must not recommend specific financial products.

### 1.3 Target User
A single salaried individual (resident, ordinarily resident, below 60 years by default, with options for senior/super-senior citizen) who wants a quick, private, accurate estimate — not a chartered accountant needing statutory-grade precision for edge cases like capital gains or foreign income.

---

## 2. Tech Stack Recommendation

Keep it simple and dependency-light so an AI coding tool can build and a human can maintain it easily:

- **Frontend only**, no backend/server. Plain **HTML + CSS + vanilla JavaScript**, or a lightweight single-file **React app** (creator's choice) — either is acceptable as long as it runs fully client-side.
- No external API calls. No analytics, no telemetry.
- No database. State lives in memory (JS variables/React state) for the session; optionally `localStorage` for "remember my inputs" (see Phase 6 — must be opt-in and clearly disclosed).
- Should run by simply opening `index.html` in a browser or via a trivial local dev server (e.g., `npm run dev` if a bundler is used) — no cloud deployment required for v1.

---

## 3. Functional Requirements

### 3.1 Step-by-Step Input Flow
The app must **not** show a single long form. Instead, present a wizard-style flow, one logical group of questions per screen/step, with **Back** and **Next** navigation and a visible progress indicator (e.g., "Step 2 of 5").

**Step 1 — Basic Info**
- Financial Year (default & only option for v1: FY 2026-27 / AY 2027-28)
- Age category: `Below 60` / `60–79 (Senior Citizen)` / `80+ (Super Senior Citizen)`
  *(Note: age category affects Old Regime slabs only; New Regime slabs are the same for all ages.)*
- Residential status assumption: fixed as "Resident Individual" for v1 (state this assumption on screen).

**Step 2 — Income Details**
- Gross annual salary / income from salary (₹)
- Any other taxable income (e.g., interest income, rental income) (₹) — optional, single combined field for v1
- (Explicitly exclude: capital gains, business income, lottery/crypto income — show a note that these are out of scope and taxed at special rates not covered by this tool)

**Step 3 — Deductions (relevant mainly to Old Regime)**
Ask for each, with a short helper description and ₹0 default:
- Standard Deduction — auto-applied, not user-entered (₹75,000 under New Regime, ₹50,000 under Old Regime for FY 2026-27) — show as informational, not editable
- Section 80C (PPF, ELSS, life insurance, etc.) — cap ₹1,50,000
- Section 80D (health insurance premiums) — cap depends on age; use ₹25,000 (self/family, non-senior) / ₹50,000 (self/family, senior citizen) as default caps, editable
- HRA exemption amount (if user knows/has calculated it) — free numeric entry with a tooltip explaining it's only valid under Old Regime
- Home loan interest (Section 24b, self-occupied, cap ₹2,00,000) — Old Regime only
- NPS additional contribution under 80CCD(1B) — cap ₹50,000
- Employer's NPS contribution under 80CCD(2) — allowed under **both** regimes (cap 14% of basic salary for New Regime, 10% for Old Regime) — optional field
- Other Chapter VI-A deductions (80TTA/80TTB, 80E, 80G, etc.) — single "other deductions" catch-all numeric field with a disclaimer that it's a simplification

Clearly label which deductions apply to which regime (most are Old-Regime-only; the app should still let the user enter them once and apply them correctly per regime automatically — don't make the user re-enter data per regime).

**Step 4 — Regime Preference**
- Radio/toggle: "I want to see both regimes compared" (default, recommended) / "I already know I'll use Old Regime" / "I already know I'll use New Regime"
- This only affects which result is emphasized in the summary — the app should **always calculate both** for comparison purposes.

**Step 5 — Review & Calculate**
- Show a compact review of everything entered, with an "Edit" link back to each step.
- A "Calculate" button that triggers the computation and takes the user to the Results screen.

### 3.2 Tax Calculation Engine

Implement as a **pure function module**, separate from the UI, so it can be unit tested independently. Suggested function signature (language-agnostic):

```
calculateTax(input: {
  age_category: 'below60' | '60to79' | '80plus',
  gross_income: number,
  other_income: number,
  deductions: {
    section_80C: number,
    section_80D: number,
    hra_exemption: number,
    home_loan_interest: number,
    nps_80ccd1b: number,
    nps_80ccd2: number,
    other_deductions: number
  }
}) -> {
  old_regime: RegimeResult,
  new_regime: RegimeResult,
  recommended: 'old' | 'new',
  savings_amount: number
}
```

Where `RegimeResult` includes: gross total income, total deductions applied, taxable income, tax before cess/surcharge, surcharge, cess, rebate applied, **final tax payable**, and effective tax rate.

#### 3.2.1 New Tax Regime — FY 2026-27 Slabs (all ages, resident individuals)

| Taxable Income Slab | Rate |
|---|---|
| ₹0 – ₹4,00,000 | Nil |
| ₹4,00,001 – ₹8,00,000 | 5% |
| ₹8,00,001 – ₹12,00,000 | 10% |
| ₹12,00,001 – ₹16,00,000 | 15% |
| ₹16,00,001 – ₹20,00,000 | 20% |
| ₹20,00,001 – ₹24,00,000 | 25% |
| Above ₹24,00,000 | 30% |

- **Standard deduction:** ₹75,000 (flat, from gross salary income).
- **Section 87A rebate:** If taxable income ≤ ₹12,00,000, rebate reduces tax to **zero** (rebate capped at ₹60,000 of computed tax). Apply **marginal relief** just above ₹12,00,000 so the tax increase never exceeds the amount of income above ₹12,00,000 (standard marginal relief formula — implement and unit test this carefully, it's a common source of bugs).
- **Deductions allowed:** Standard deduction + Employer NPS contribution under 80CCD(2) only. All other deductions entered by the user (80C, 80D, HRA, home loan interest, 80CCD(1B), "other") must be **excluded** from the New Regime calculation, and the UI should clearly show this in the results ("Not applicable under New Regime").
- **Surcharge:** 10% (income > ₹50L), 15% (> ₹1Cr), 25% (> ₹2Cr). Surcharge is capped at 25% under the New Regime (no 37% slab). Apply marginal relief on surcharge thresholds too.
- **Cess:** 4% Health & Education Cess on (tax + surcharge).

#### 3.2.2 Old Tax Regime — FY 2026-27 Slabs

*Below 60 years:*
| Taxable Income Slab | Rate |
|---|---|
| ₹0 – ₹2,50,000 | Nil |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

*60–79 years (Senior Citizen):* same as above except **Nil slab extends to ₹3,00,000**.

*80+ years (Super Senior Citizen):* same as above except **Nil slab extends to ₹5,00,000**.

- **Standard deduction:** ₹50,000 (flat, from gross salary income).
- **Section 87A rebate:** If taxable income ≤ ₹5,00,000, rebate up to ₹12,500 makes tax zero. No rebate above ₹5,00,000 (no marginal relief needed here since it's a hard cliff — implement as-is, this is correct per current law).
- **Deductions allowed:** All of Standard deduction, 80C (cap ₹1,50,000), 80D (age-based cap), HRA exemption (as entered), Home loan interest u/s 24b (cap ₹2,00,000), 80CCD(1B) (cap ₹50,000), Employer NPS 80CCD(2) (cap 10% of basic — since we don't collect basic salary separately in v1, treat the user's entered value as already correctly capped, and show a disclaimer), and "other deductions" as entered.
- **Surcharge:** 10% (> ₹50L), 15% (> ₹1Cr), 25% (> ₹2Cr), **37% (> ₹5Cr)**. Apply marginal relief.
- **Cess:** 4% Health & Education Cess on (tax + surcharge).

#### 3.2.3 Calculation Notes / Assumptions to Display to the User
The results screen must show a visible disclaimer, e.g.:
> "This is an estimate based on FY 2026-27 slabs for a resident individual with salary/other income only. It does not account for capital gains, business income, or every possible deduction. Please verify with a tax professional or the official Income Tax Department calculator before filing."

### 3.3 Results / Summary Screen
Must clearly show, side by side (table or two cards):

| | Old Regime | New Regime |
|---|---|---|
| Gross Total Income | ₹X | ₹X |
| Total Deductions | ₹X | ₹X |
| Taxable Income | ₹X | ₹X |
| Tax before Cess | ₹X | ₹X |
| Surcharge | ₹X | ₹X |
| Health & Education Cess (4%) | ₹X | ₹X |
| **Total Tax Payable** | **₹X** | **₹X** |
| Effective Tax Rate | X% | X% |

Below the table:
- A prominent callout: **"You save ₹[amount] by choosing the [Old/New] Regime"** (or "Both regimes result in the same tax" if equal).
- A simple bar chart or visual comparison of the two totals (nice-to-have, not blocking).
- A "Start Over" / "Edit Inputs" button.

### 3.4 Tax-Saving Suggestions for Next Financial Year

Below the comparison table, add a **"Ways to save more next year"** section. This is informational only — headroom pointers, not personalized financial advice or product recommendations.

Logic (pure function, separate from the regime calculation engine, taking the same deduction inputs):
- For each capped deduction the user entered a value for, check if they're under the statutory cap and show the **remaining headroom**:
  - Section 80C: if used < ₹1,50,000 → "You have ₹X of unused 80C limit (e.g., PPF, ELSS, life insurance premiums, 5-year tax-saving FDs)."
  - Section 80D: if used < age-based cap → "You have ₹X of unused 80D limit for health insurance premiums."
  - Section 80CCD(1B) (NPS): if used < ₹50,000 → "You have ₹X of unused NPS (80CCD(1B)) limit."
  - Home loan interest (24b): if used < ₹2,00,000 and > ₹0 → "You have ₹X of unused home loan interest deduction headroom."
- If the user entered **zero** for a deduction category entirely, show it as a suggestion to explore rather than a "headroom remaining" figure (e.g., "You haven't claimed any 80D deduction — health insurance premiums for yourself/family may qualify.").
- Only show suggestions relevant to **whichever regime the user's result favors** (or both, if New Regime is recommended, show only the 80CCD(2)-employer-NPS angle, since most Chapter VI-A deductions don't apply there — otherwise the suggestions would be misleading).
- If the New Regime is recommended, include a note that most Chapter VI-A deductions (80C, 80D, HRA, etc.) won't reduce tax under that regime, so "topping up" those only helps if they plan to switch to the Old Regime next year — avoid suggesting the user max out deductions that won't actually help them.
- Each suggestion should state the **category and remaining ₹ headroom only** — no product names, fund names, or insurers.
- Add the same disclaimer tone as the rest of the app: these are estimates based on limits current for FY 2026-27; confirm with a tax professional before acting.

**Explicitly out of scope for this feature:** recommending specific investment products, predicting next year's income or slabs, or calculating a "projected" next-FY tax figure — v1 only surfaces *unused deduction headroom* against the current inputs.

---

## 4. Non-Functional Requirements

- **Privacy:** No network requests of any kind after page load. No cookies, no analytics, no external form submissions. State this explicitly in the UI (e.g., a small footer note: "All calculations happen locally in your browser. Nothing is sent anywhere.").
- **Responsiveness:** Usable on both desktop and mobile browsers.
- **Accessibility:** Basic keyboard navigability for the wizard; labeled form inputs; sufficient color contrast.
- **Performance:** Instant calculation (client-side, no meaningful load).
- **Input validation:** Reject negative numbers; cap deduction fields at their statutory limits with inline warnings if the user enters more than the cap (auto-clamp or show error — implementer's choice, but must not silently miscalculate).
- **Browser support:** Latest Chrome, Firefox, Safari, Edge.

---

## 5. Build Phases

Build and verify each phase before moving to the next. Each phase should be independently runnable/demoable.

### Phase 0 — Project Setup
- Initialize project structure at `/Users/nitinsubramanyar/codebasics/AIPro/First_Web_app`.
- Choose stack (plain HTML/CSS/JS recommended for simplicity, or React if preferred).
- Set up a basic `index.html` that runs locally with zero build step, or a minimal dev server if using a framework.
- **Acceptance criteria:** Blank page loads locally in a browser with a title like "Indian Income Tax Calculator".

### Phase 1 — Calculation Engine (build and test first, no UI yet)
- Implement the pure calculation functions described in Section 3.2 for both regimes.
- Include the FY 2026-27 slabs, standard deductions, rebate + marginal relief logic, surcharge + marginal relief, and cess.
- Write a set of test cases (can be simple `console.log` assertions or a lightweight test runner) covering:
  - Income below all taxable thresholds (zero tax both regimes)
  - Income exactly at ₹12,00,000 taxable (New Regime rebate edge case)
  - Income just above ₹12,00,000 (marginal relief check)
  - Income exactly at ₹5,00,000 taxable (Old Regime rebate edge case)
  - High income triggering each surcharge slab (₹50L, ₹1Cr, ₹2Cr, ₹5Cr for Old Regime)
  - Senior citizen and super senior citizen slab variants
  - A case where Old Regime wins and a case where New Regime wins
- **Acceptance criteria:** All test cases produce correct, hand-verified results. No UI required yet — this can be validated via console output or a simple test page.

### Phase 2 — Step-by-Step Input Wizard (UI, no calculation wired up yet)
- Build the 5-step wizard UI described in Section 3.1: Basic Info → Income → Deductions → Regime Preference → Review.
- Implement Back/Next navigation, progress indicator, and input validation (no negative numbers, capped deduction fields with inline warnings).
- Store all inputs in in-memory app state.
- **Acceptance criteria:** User can click through all 5 steps, enter data, go back and edit previous steps without losing data, and reach a Review screen showing everything they entered.

### Phase 3 — Wire Up Calculation + Results Screen
- Connect the Review screen's "Calculate" button to the Phase 1 engine.
- Build the Results screen per Section 3.3: side-by-side comparison table, savings callout, disclaimer text.
- **Acceptance criteria:** Entering realistic sample data (e.g., ₹12,00,000 salary, ₹1,50,000 in 80C, ₹25,000 in 80D) produces a correct, correctly-labeled comparison, and the "you save ₹X by choosing Y regime" message is accurate.

### Phase 4 — Tax-Saving Suggestions
- Implement the headroom-calculation logic from Section 3.4 as its own pure function, taking the same deduction inputs used by the calculation engine.
- Add the "Ways to save more next year" section to the Results screen, wired to whichever regime is recommended.
- Test cases: user with 80C fully maxed (no suggestion for that category), user with 80C at ₹0 (explore-this-category suggestion), user recommended New Regime (only employer-NPS-angle suggestion shown, with the "won't help under New Regime" note for the rest).
- **Acceptance criteria:** Suggestions shown are accurate against the caps in Section 3.2, never suggest a specific financial product, and correctly suppress irrelevant Old-Regime-only suggestions when New Regime is the recommended outcome.

### Phase 5 — Polish & Edge Cases
- Add the visual comparison chart (nice-to-have).
- Improve responsive/mobile layout.
- Add accessibility pass (labels, tab order, contrast).
- Add the privacy disclaimer footer.
- Handle edge cases: all-zero inputs, extremely high income, user entering deductions that exceed statutory caps.
- **Acceptance criteria:** App feels complete and trustworthy; no console errors; works on mobile viewport widths; all edge cases from Phase 1's test list are reflected correctly in the UI too.

### Phase 6 — Optional Enhancements (only if you want to go further)
- Opt-in `localStorage` "save my inputs" toggle (must be clearly disclosed, off by default, with a "Clear saved data" button).
- Downloadable/printable PDF or text summary of the results.
- Support for multiple income heads (e.g., separate rental income with standard 30% deduction).
- A settings/admin panel to update slabs for future financial years without code changes (e.g., a config JSON file for slabs, so next year's budget changes are a data edit, not a code rewrite).

---

## 6. Open Assumptions to Confirm Before/During Build

1. Only resident individuals below/above 60/80 are supported — NRIs, HUFs, and firms are out of scope.
2. Only salary + "other income" (interest/rental, taxed at slab rate) are supported — capital gains, lottery, crypto, and business income are explicitly excluded and flagged to the user.
3. Employer NPS contribution (80CCD(2)) cap is applied on the number the user enters directly, since the app does not separately collect "basic salary" in v1 — this is a simplification worth flagging in the UI.
4. FY 2026-27 slabs are hardcoded for v1 (per Phase 6, consider externalizing to a config file so future years are easy to update, since slabs can change with each Union Budget).

---

## 7. Handoff Notes for the AI Coding Tool

- Build phases **in order** — do not skip the calculation engine tests in Phase 1, since correctness here is the entire point of the app.
- Keep the calculation logic and the UI cleanly separated (pure functions in one file/module, UI in another) so the tax logic can be tested and updated independently of the interface.
- Do not add any backend, API calls, or external data fetching — this must remain a fully offline, client-side tool.
- When in doubt about a tax rule not covered explicitly in this PRD, prefer the simpler/more conservative implementation and add a visible disclaimer rather than silently guessing.
