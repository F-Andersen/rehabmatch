# RehabMatch — instructions for Cursor Agent

Goal: deliver a **working, local, demonstrable MVP** of the rehab specialist matching system described in `docs/01-PRODUCT-REQUIREMENTS.md`. Prefer Ukrainian for user-visible copy and status reports. Code and identifiers in English.

## Required reading before making edits
1. `README.md`
2. `docs/10-SOURCE-MAPPING-AND-DECISIONS.md`
3. `docs/01-PRODUCT-REQUIREMENTS.md`
4. `docs/04-AHP-ALGORITHM.md`
5. `docs/08-IMPLEMENTATION-PLAN.md`
6. Read relevant design screenshot(s) under `design/reference/` and related architecture/API/data doc per task.

## Non-negotiable
- Build real end-to-end functionality. No TODO-only endpoints, no static JSON used as a fake production recommendation, no success toast for unpersisted actions, no dead buttons.
- Implement **AHP-derived criteria weights + weighted scoring**, explicitly labeled hybrid AHP+WSM, plus separate **direct-weights WSM baseline**. Do NOT call direct sliders classical AHP. Implement CR calculation for pairwise mode.
- Use the proposed stack React+Vite+TS, Express+TS, PostgreSQL, Prisma. Confirm current stable dependency compatibility before locking versions. Do not silently switch to Next.js, Supabase, Firebase, MongoDB, a neural network, or AI APIs.
- Apply role permissions on the server, not only by hiding UI controls.
- Do not invent verified clinicians or put real patient data in seeds. Every seeded specialist is a fictional demo profile with demo badge.
- Keep secrets out of Git. Validate inputs, hash passwords, use secure HTTP-only session cookies, limit abuse, maintain authorization checks.
- No diagnosis, clinical recommendations, treatment efficacy claims or suggestions derived from self-reported diagnoses.
- Booking MVP = **appointment request** with status, NOT confirmed calendar slot; UI wording must reflect that.
- Read design screenshots before implementing matching screens. Fit at least desktop and mobile, accessible labels and keyboard behavior.
- Run actual tests, typecheck/build, migrations and seeds. Do not claim success until commands pass. If unable, explicitly report error and remaining work.
- Do not modify source DOCX or PNGs. Modify spec only with a documented decision in `docs/10-SOURCE-MAPPING-AND-DECISIONS.md`.
- Work in milestones. First propose a plan and inspect the workspace. Implement one milestone at a time, present changed files, terminal commands/results, screenshots where possible, and ask to proceed with next milestone.
