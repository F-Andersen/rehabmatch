# 06. API контракт RehabMatch MVP (REST `/api/v1`)

**Статус:** запропонований контракт для Cursor, не існуючий API; без відкритих токенів.

## 1. Convention

- JSON UTF-8, IDs UUID, ISO 8601 UTC timestamps, price в UAH/сеанс (number у JSON, Decimal у БД).
- Доступність: `[public]`, `[patient]`, `[specialist]`, `[admin]`; auth = opaque session cookie HTTP-only/SameSite, не JWT у localStorage.
- OK payload `{ "data": resource, "meta": optional }`; errors `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": optional } }`.
- HTTP: 200 GET/update, 201 create, 204 delete/logout, 400 invalid query, 401 unauthenticated, 403 forbidden, 404 missing/foreign resource, 409 conflict, 422 invalid pairwise matrix/CR, 429 rate-limit, 500 unexpected.
- Route method validation: all write methods Zod; pagination `page>=1`, `pageSize in [1,100]` default 10.
- Specialist public DTO includes id, fullName, photos, specializations, injuries, experienceYears, city, district, formats, pricePerSession, ratingAvg or null, ratingCount, inclusiveSpace, isDemo, services. Does not expose user email/phone unless product owner deliberately authorizes it.

## 2. Auth/Profile

| Method | Path | Role | Effect |
|---|---|---|---|
| POST | `/auth/register` | public | body `{fullName,email,password,role:"PATIENT"|"SPECIALIST"}`; admin not registrable |
| POST | `/auth/login` | public | `{email,password}` → cookie session, public user |
| POST | `/auth/logout` | authenticated | revoke current session + clear cookie |
| GET | `/auth/me` | authenticated | profile summary and role |
| PATCH | `/me` | authenticated | own permitted display profile fields |
| GET | `/me/search-requests` | patient | own search history |
| GET | `/me/appointment-requests` | patient | own requests |

Password reset via email is **out of scope** for MVP unless owner explicitly adds SMTP; don't draw deceptive working link. Provide clear support message or hide.

## 3. Catalog/Profiles

| Method | Path | Role | Effect |
|---|---|---|---|
| GET | `/catalog` | public | dictionaries: `specializations`, `injuryTypes`, `cities`, `districts`, `formats`, `criteria` |
| GET | `/specialists` | public | search query + filters + page/sort |
| GET | `/specialists/:id` | public | public approved+visible specialist profile |
| GET | `/specialists/:id/reviews` | public | only approved reviews |
| GET | `/specialist/me` | specialist | own draft/profile incl. verification |
| PUT | `/specialist/me` | specialist | update owned specialist data; verified becomes PENDING on material profile changes if configured |
| PUT | `/specialist/me/services` | specialist | replace owned service list, validated |

Example query: `/specialists?cityId=<uuid>&maxBudget=1200&injuryTypeId=<uuid>&formatId=<uuid>&sort=experience_desc&page=1&pageSize=10`. Query keys: `q`, `injuryTypeId`, `specializationId`, `cityId`, `districtId`, `maxBudget`, `formatId`, `inclusiveOnly`, `sort`, `page`, `pageSize`. `formatId` on catalog search = explicit filter; `formatStrict` for recommendation soft/hard logic is distinct.

## 4. Search Request + AHP + Recommendations

**Important:** calculation endpoint can preview weights without saving; creation of recommendation persists full snapshot and guards ownership.

| Method | Path | Role | Effect |
|---|---|---|---|
| POST | `/search-requests` | patient | create own search with filters/mode |
| GET | `/search-requests/:id` | patient owner | own search and weights/history |
| POST | `/ahp/calculate` | patient | validate matrix, return weights/CR, no persistence |
| POST | `/recommendations` | patient | compute, persist weights, matrix, output list, return recId |
| GET | `/recommendations/:id` | patient owner | persisted ranking and explanation |
| GET | `/recommendations` | patient | own saved recommendations paged |

POST `/search-requests` example:
```json
{
  "injuryTypeId": "<uuid-from-catalog>",
  "cityId": "<uuid-from-catalog>",
  "districtId": null,
  "formatId": "<uuid-from-catalog>",
  "maxBudget": 1500,
  "cityOnly": false,
  "inclusiveOnly": false,
  "formatStrict": false,
  "preferenceMode": "AHP_PAIRWISE"
}
```

`formatStrict` lives in `filtersSnapshot` in the database schema. Backend maps payload into that snapshot. `radiusKm` intentionally unimplemented.

POST `/ahp/calculate` example (for standard MVP 5 criteria: must include 10 pairs):
```json
{
  "mode": "AHP_PAIRWISE",
  "keys": ["EXPERIENCE", "PRICE", "RATING", "LOCATION", "FORMAT"],
  "comparisons": [
    {"criterionA":"EXPERIENCE", "criterionB":"PRICE", "value":3},
    {"criterionA":"EXPERIENCE", "criterionB":"RATING", "value":2},
    {"criterionA":"EXPERIENCE", "criterionB":"LOCATION", "value":4},
    {"criterionA":"EXPERIENCE", "criterionB":"FORMAT", "value":5},
    {"criterionA":"PRICE", "criterionB":"RATING", "value":0.5},
    {"criterionA":"PRICE", "criterionB":"LOCATION", "value":2},
    {"criterionA":"PRICE", "criterionB":"FORMAT", "value":3},
    {"criterionA":"RATING", "criterionB":"LOCATION", "value":3},
    {"criterionA":"RATING", "criterionB":"FORMAT", "value":4},
    {"criterionA":"LOCATION", "criterionB":"FORMAT", "value":2}
  ]
}
```

Responses: `{data:{weights:{EXPERIENCE:0.32,...}, lambdaMax:5.04, ci:0.01, cr:0.009, isConsistent:true}}`. **All numeric response values here are illustrative, not output of the example matrix**; algorithm must compute real values. For inconsistent input return HTTP 422 with `{error:{code:"AHP_INCONSISTENT",message:"Порівняння суперечливі",details:{cr:0.2,threshold:0.1}}}`; API MAY show preview weights even when CR unacceptable but MUST prohibit save as valid AHP rec.

POST `/recommendations`:
```json
{
  "searchRequestId": "<uuid-returned-by-POST-search-requests>",
  "mode": "AHP_PAIRWISE",
  "comparisons": ["<use the 10 objects from calculate example>"],
  "limit": 20
}
```
For `DIRECT_WSM`, supply `priorities: {EXPERIENCE:8,PRICE:6,RATING:7,LOCATION:5,FORMAT:3}` instead of `comparisons`. Server ignores client-provided weights/results and calculates them from validated inputs.

Success:
```json
{
  "data": {
    "id":"<uuid>",
    "mode":"AHP_PAIRWISE",
    "algorithmVersion":"ahp-gm-wsm-fixed-v1",
    "consistencyRatio":0.034,
    "weights":{"EXPERIENCE":0.30,"PRICE":0.20,"RATING":0.25,"LOCATION":0.15,"FORMAT":0.10},
    "items":[{
      "rankPosition":1,"specialistId":"<uuid>","matchScore":0.812,
      "factors":[{"key":"EXPERIENCE","weight":0.30,"normalizedValue":0.8,"contribution":0.24}],
      "explanation":["Високий досвід відповідає важливому для вас критерію"]
    }]
  }
}
```
This is a **schema illustration**, not actual algorithm output; real `factors` must contain all 5 criteria and contributions must total score within float tolerance. Weights must always be calculated rather than hard-coded.

## 5. Reviews, appointment requests

| Method | Path | Role | Effect |
|---|---|---|---|
| POST | `/specialists/:id/reviews` | patient | create/update own review (rating 1..5, comment bounded) → PENDING |
| GET | `/specialists/:id/reviews` | public | paginated approved reviews |
| POST | `/appointment-requests` | patient | `{specialistId, preferredAt, note?}` → REQUESTED |
| GET | `/specialist/appointment-requests` | specialist | only requests addressed to own specialist |
| PATCH | `/specialist/appointment-requests/:id/status` | specialist owner | ACCEPTED or DECLINED when REQUESTED |
| PATCH | `/me/appointment-requests/:id/cancel` | patient owner | CANCELLED when REQUESTED |

No booking collision prevention is claimed. Every successful mutation persists to PostgreSQL; rejection on invalid state with 409.

## 6. Admin

| Method | Path | Role | Effect |
|---|---|---|---|
| GET | `/admin/summary` | admin | metrics incl. users, pending specialists, pending reviews |
| GET | `/admin/users` | admin | filtered/paginated safe user DTO |
| PATCH | `/admin/users/:id/status` | admin | activate/deactivate |
| GET | `/admin/specialists` | admin | verification queue and all specialists |
| PATCH | `/admin/specialists/:id/verification` | admin | PENDING/APPROVED/REJECTED, verify if data complete |
| GET | `/admin/reviews` | admin | moderation queue |
| PATCH | `/admin/reviews/:id/status` | admin | approve/reject then recalculate aggregate rating transactionally |
| GET/POST/PATCH | `/admin/catalog/:type` | admin | dictionaries, `type` allowlist; deactivate referenced rather than destructive delete |
| GET/PATCH | `/admin/criteria` and `/admin/criteria/:id` | admin | manage descriptions/active flag (cannot break required 5 in current algorithm) |
| GET | `/admin/appointment-requests` | admin | audit and status overview |

## 7. OpenAPI

Cursor must convert this table/contract into actual OpenAPI 3.x JSON/YAML generated from routes/validators or maintained manually, and ensure it matches running API. Create `docs/api/openapi.yaml` during implementation. No invented Swagger output in this handoff.
