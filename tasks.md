# Tasks — Indian Income Tax Calculator (PRD-driven, atomic & phased)

Purpose: Convert the PRD into an actionable, phased list of atomic tasks with explicit dependencies so engineering and PM can pick, assign, and schedule work.

How to read
- IDs: Task IDs are unique (T1, T2...).
- Dependencies: list of task IDs that must complete before this task starts.
- Estimate: rough implementation time in hours (team to refine).

---

## Phase 0 — Discovery & PRD confirmation
- T1: Confirm scope & target user flows from PRD — list edge cases (senior, super-senior, exclusions). Dependencies: [] — 3h
- T2: Finalize input model & validation rules — fields, caps (80C, 80D, 24b, 80CCD(1B), 80CCD(2), HRA). Dependencies: [T1] — 3h
- T3: Define acceptance criteria & test cases (calculation engine). Dependencies: [T1,T2] — 2h

## Phase 1 — Project skeleton & infra
- T4: Create repo skeleton, README, license, basic index.html. Dependencies: [T2] — 2h
- T5: Choose stack and dev scripts (vanilla JS or lightweight React) and add `npm` scripts. Dependencies: [T4] — 2h
- T6: Add lint/prettier config and minimal CI (build+test). Dependencies: [T5] — 4h

## Phase 2 — Calculation engine (pure functions + tests)
Goal: engine is fully testable without UI.
- T7: Define `calculateTax` interface and types (inputs/outputs) per PRD signature. Dependencies: [T2] — 2h
- T8: Implement New Regime calculation: slabs, ₹75,000 standard deduction, 87A rebate + marginal relief, surcharge rules, 4% cess. Dependencies: [T7] — 8h
- T9: Implement Old Regime calculation: age-based slabs, ₹50,000 standard deduction, 80C/80D/HRA/home loan interest/80CCD rules, rebate at ₹5L, surcharge + cess. Dependencies: [T7] — 10h
- T10: Implement shared utilities: slab application helper, marginal relief helper, surcharge calc, clamp/cap helpers. Dependencies: [T7] — 4h
- T11: Unit tests for engine covering PRD test cases (edge and high-income surcharge tiers, rebate edges, marginal relief). Dependencies: [T8,T9,T10] — 6h

## Phase 3 — Wizard UI (step-by-step inputs)
Goal: wire inputs, navigation, progress indicator; validation only (no calculations yet).
- T12: Basic wizard shell: progress indicator, Back/Next flow, state container. Dependencies: [T5] — 4h
- T13: Step 1 — Basic Info: FY, age category, resident note. Dependencies: [T12] — 2h
- T14: Step 2 — Income details: gross salary, other income. Dependencies: [T12] — 3h
- T15: Step 3 — Deductions inputs: 80C, 80D, HRA, home loan interest, 80CCD(1B), employer 80CCD(2), other deductions. Implement caps/inline warnings. Dependencies: [T12,T2] — 6h
- T16: Step 4 — Regime preference toggle and explanatory copy. Dependencies: [T12] — 2h
- T17: Step 5 — Review screen: summary of inputs with Edit links. Dependencies: [T12-T16] — 3h

## Phase 4 — Wire calculation & Results
- T18: Hook Review → Calculate to `calculateTax` and return `RegimeResult` objects. Dependencies: [T11,T17] — 3h
- T19: Results screen — side-by-side table per PRD, effective rate, savings callout, disclaimer. Dependencies: [T18] — 4h
- T20: Implement detailed breakdown view (line-by-line) and per-regime notes about non-applicable deductions. Dependencies: [T19,T11] — 4h

## Phase 5 — Tax-saving suggestions & headroom logic
- T21: Implement headroom function for caps (80C, 80D, 80CCD(1B), home loan interest). Dependencies: [T2,T11] — 3h
- T22: Display suggestions on Results screen with regime-aware rules (only show suggestions relevant to recommended regime, with disclaimers). Dependencies: [T19,T21] — 3h

## Phase 6 — Validation, accessibility & QA
- T23: Form validation rules (no negatives, clamp caps or show warnings). Dependencies: [T15] — 3h
- T24: Accessibility pass: labels, keyboard nav, contrast checks. Dependencies: [T12-T20] — 4h
- T25: Visual regression & snapshot tests for key components/pages. Dependencies: [T12-T20] — 6h

## Phase 7 — Performance, privacy & release readiness
- T26: Add local privacy notice & footer copy confirming no network calls. Dependencies: [T4] — 1h
- T27: Optional: opt-in `localStorage` save/restore (must be opt-in + clear). Dependencies: [T39] — 4h
- T28: End-to-end tests (happy + edge flows) using Playwright/Cypress. Dependencies: [T11,T19] — 8h
- T29: Prepare staging build and release checklist. Dependencies: [T6,T28] — 3h

## Phase 8 — Documentation & handover
- T30: User-facing docs & FAQ: scope, disclaimers, how-to. Dependencies: [T19,T22] — 3h
- T31: Developer docs: engine API, test commands, slab config location. Dependencies: [T7-T11] — 3h

---

Notes & assumptions
- FY 2026-27 slabs and caps are hardcoded for v1 (externalize later if desired).
- App is client-side only; no analytics by default.
- Employer 80CCD(2) is treated as user-entered capped value (PRD simplification).

If you want this exported as GitHub Issues, CSV, or auto-created issues in a project board, tell me which target and I will prepare it.

End of file.
