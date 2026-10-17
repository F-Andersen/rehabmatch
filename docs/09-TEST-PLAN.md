# 09. План перевірки та демонстрації

## Рівні

- **Unit (Vitest):** AHP, WSM, normalized criteria, score contributions, deterministic ranking, state transitions.
- **Integration (Supertest+test DB):** auth/roles, catalog filters, search persist, rec persist, reviews moderation, requests.
- **E2E (Playwright):** user workflows and visual/interaction smoke on desktop/mobile.
- **Performance:** repeatable local benchmark with 500 synthetic specialist rows; report hardware, dataset size, p50/p95, no invented numbers.

## Перевірки алгоритму

| ID | Input/Action | Expected |
|---|---|---|
| AH-01 | 3×3 fixture `fixtures/ahp-reference.json` | weights ~ 0.258285, 0.636986, 0.104729; CR ~ 0.033199 |
| AH-02 | 5×5 ones | all weights 0.2, CR 0 |
| AH-03 | 5×5 with inconsistent A>B, B>C, C>A | `CR>0.1`, reject saving rec |
| AH-04 | 5×5 values with zero/NaN/negative | validation error, no save |
| AH-05 | Missing pair / repeated pair | 422, no guessed value |
| WS-01 | direct values [1,1,1,1,1] | all weights 0.2, `CR=null` |
| WS-02 | [9,1,1,1,1] | first weight 9/13, sum exactly ~1 |
| WS-03 | all zero / >9 | reject |
| SC-01 | experience 20+ years | norm 1.0 |
| SC-02 | 300 UAH vs 3000 UAH | respective PRICE norm 1 and 0 |
| SC-03 | zero approved reviews | rating norm 0.5 and badge no reviews |
| SC-04 | non-matching city | location 0.2 unless cityOnly filter excludes |
| SC-05 | incompatible format, formatStrict=false | norm 0; strict=true -> excluded |
| SC-06 | budget below all prices | no candidates, no false fallback |
| SC-07 | identical records and weights | stable deterministic ranking |
| SC-08 | rec factors sum | `abs(Σcontributions − matchScore) < 1e-9` |
| SC-09 | score range | all scores between 0 and 1 |

## Ролі і безпека

| ID | Scenario | Expected |
|---|---|---|
| AUTH-01 | user registers with PATIENT | password hashed, PATIENT role |
| AUTH-02 | body role ADMIN | reject registration |
| AUTH-03 | unauthenticated POST to private route | 401 |
| AUTH-04 | patient asks other patient's recommendation | 403/404 no data |
| AUTH-05 | specialist PATCH another specialist profile | 403/404 no mutation |
| AUTH-06 | pending specialist GET by public id | 404 |
| AUTH-07 | session revoked on logout | subsequent /auth/me 401 |
| AUTH-08 | invalid body/SQLi-looking strings | 400/422 or escaped output, no DB compromise |
| AUTH-09 | HTTP cookie flags and allowed CORS origin | configuration meets security spec |
| REV-01 | PENDING review submitted | doesn't affect aggregate |
| REV-02 | admin approves review | aggregate rating recomputed |
| REQ-01 | Patient requests consultation | state REQUESTED |
| REQ-02 | Specialist accepts own request | ACCEPTED |
| REQ-03 | Stranger changes status | forbidden |
| REQ-04 | Past preferredAt | reject |

## Browser E2E

- **E2E-01:** Home → register patient → catalog → specialist profile → create request → see REQUESTED.
- **E2E-02:** Specialist register → submit profile → verify not visible → admin approves → public catalog reflects change.
- **E2E-03:** Patient → matching form → 10 AHP pairwise inputs → CR pass → rec cards and explanations → save history.
- **E2E-04:** Patient → inconsistent comparisons → actionable validation message, no recommendation saved.
- **E2E-05:** Patient → direct sliders WSM → different weights and candidate order, correct mode badge.
- **E2E-06:** Patient → review → admin approves → new rating visible.
- **E2E-07:** Responsive 375×812 and 1440×900; no horizontal body overflow, navigation and modal usable by keyboard.

## Академічні сценарії

Prepare 3 demo search requests using fictional records, export the computed five weights, CR, top-five scoring contribution table, latency and the mode. Compare AHP_PAIRWISE vs DIRECT_WSM with identical eligible specialist set; when weights are identical expect same ranking (sanity check), when weights differ observe direction of change. Discuss limitations (fixed normalization ranges, synthetic data, no treatment outcome prediction), not fabricated benefits.
