# 04. Формальна специфікація рекомендаційного алгоритму

## 0. Важливе наукове розмежування

У звітах обрано **метод аналізу ієрархій (МАІ/AHP)**. Макет А.4 містить слайдери ваг, що самі по собі **не є попарними порівняннями Сааті**. Для чесної реалізації MVP передбачено:

- **`AHP_PAIRWISE` (основний академічний режим):** попарні порівняння критеріїв → обчислення AHP-ваг → тест узгодженості CR → оцінка спеціалістів зваженою сумою нормалізованих атрибутів. Називати `AHP-weighted scoring` або `гібрид AHP+WSM`, **не стверджувати**, що виконано повний AHP з попарним порівнянням усіх альтернатив.
- **`DIRECT_WSM` (спрощений режим):** п'ять слайдерів зі значеннями 1–9 → нормалізація ваг до 1 → та сама функція оцінювання. Називати WSM / пряме задання ваг, не AHP.

Перевага: GUI близький до дизайну, наявна контрольована математика, експериментально можна порівнювати два способи отримання ваг.

## 1. Критерії та відмінність hard filters / soft preferences

Fixed ordered criterion keys: `EXPERIENCE`, `PRICE`, `RATING`, `LOCATION`, `FORMAT` (той самий порядок у API та тестах).

Hard-фільтри: тільки APPROVED+visible specialists; відповідність `injuryTypeId` (компетенція, не медична рекомендація); `pricePerSession <= maxBudget`; `inclusiveSpace=true`, якщо потрібна інклюзивність; `cityId`, якщо `cityOnly=true`; `formatId`, якщо `formatStrict=true`. Опційні `cityOnly` і `formatStrict` знаходяться у `filtersSnapshot`, а не в окремих полях для formatStrict. Інші уподобання не повинні видаляти кандидатів.

Soft scoring: досвід, ціна, рейтинг, місце та відповідність формату. За strict-фільтрами відповідна ознака може бути константною; UI повідомляє про це, а для порівняння чутливості краще використовувати нестрогий сценарій.

## 2. AHP попарні порівняння

Для п'яти критеріїв треба n(n−1)/2 = 10 незалежних оцінок. Доступні значення шкали: `1,2,3,4,5,6,7,8,9` і обернені `1/2,...,1/9`, з короткою словесною шкалою Сааті (1 рівні, 3 помірно важливіший, 5 суттєво, 7 дуже сильно, 9 надзвичайно; парні — проміжні).

Input: список `{criterionA, criterionB, value}` у фіксованому лексикографічному порядку за ключами. Backend формує `A` (n×n): `A[i][i]=1`, `A[i][j]=value`, `A[j][i]=1/value`. Reject: відсутні/дубльовані пари, неактивні критерії, zero, NaN, Infinity, від'ємні, некоректні Saaty-values, однакові `criterionA=B`, значення out-of-range.

### Ваги (geometric mean estimator)

`g_i = (product_j A[i][j])^(1/n)`  
`w_i = g_i / sum(g_k)`; `sum(w_i)≈1`, усі `w_i>0`.

### Перевірка узгодженості

`lambdaMax ≈ (1/n) * sum_i ((A*w)_i / w_i)`

`CI = max(0, (lambdaMax-n)/(n-1))` (для n≥3); `CR=CI/RI[n]`.

RI (Saaty): n=3 → 0.58; n=4 → 0.90; n=5 → 1.12. Для n=1/2 CR=0 або не застосовується. В MVP n=5 фіксоване. `CR <= 0.10` — accept; інакше validation error `AHP_INCONSISTENT` із CR та порадою переглянути вибір; НЕ приховано міняти оцінки користувача.

**Еталонний unit test:** `fixtures/ahp-reference.json` 3×3; geometric-mean weights приблизно `[0.258285, 0.636986, 0.104729]`, `lambdaMax≈3.038511`, `CR≈0.033199`. Допуск ваг `1e-5` і CR `1e-4`. Хибну помилку узгодженості при матриці повністю одиниць заборонено.

## 3. Прямі ваги WSM

Input: five integer values [1..9]. Normalization `w_i=p_i / Σp_i`, сума 1; всі >0, 0 / null / NaN reject. `consistencyRatio=null`, без удавання, що це AHP. Показ відсотків може мати похибку округлення; відобразити 100% сумарно шляхом корекції останньої displayed частки або округляти до 1 знака і виводити ≈100%.

## 4. Детермінована нормалізація характеристик

**Усі діапазони нижче — запропоновані MVP-константи, НЕ з оригінальних DOCX.** Винести у `server/src/algorithms/config.ts`; при зміні версіонувати алгоритм.

`clamp(x) = min(1, max(0, x))`.

- `EXPERIENCE`: `u = clamp(experienceYears / 20)`; досвід 0–20+ років.
- `PRICE`: `u = clamp((3000 - pricePerSession) / (3000 - 300))`; базова шкала 300–3000 грн/сеанс. Ціна <= budget — обов'язкова вимога, але низька ціна підвищує soft score.
- `RATING`: якщо `ratingCount>=1` та `ratingAvg` 1..5: `u=clamp((ratingAvg-1)/4)`; інакше `u=0.5`, позначення «не вистачає відгуків». Не вигадувати оцінку 5.0.
- `LOCATION`: за обраного міста/району: той самий район → 1.0, те саме місто (інший район/не вказаний) → 0.7, інше місто → 0.2. Якщо місто не обрано → 0.5 незалежно від кандидата. **Не називати ці оцінки реальними кілометрами.**
- `FORMAT`: за обраного `formatId`: підтримує → 1.0, не підтримує → 0.0; якщо формат не вказаний → 0.5. Якщо `formatStrict=true`, невідповідні відсікаються до scoring.

Ці **фіксовані діапазони** не залежать від інших кандидатів, щоб додавання нового спеціаліста не змінювало нормалізовані значення вже наявних. Якщо ціну чи рейтинг відсутні — чітка політика: ціна required у профілі; rating — fallback 0.5. Всі значення мають бути скінченними та у [0,1].

## 5. Score і explanation

Для спеціаліста i: `S_i = Σ_{j=1..5} w_j*u_ij`. Очікуємо `[0,1]` з урахуванням float epsilon. Сортувати `S_i DESC`, далі `ratingCount DESC` і `specialist.id ASC` — детерміновано. При показі `matchScore` до 3 знаків (в БД зберігати full precision).

Output per item:
```
{
  rankPosition: 1,
  matchScore: 0.812,
  factors: [
    {key:"EXPERIENCE", weight:0.25, normalizedValue:0.80, contribution:0.20, description:"16 років досвіду"},
    ...
  ],
  explanation: ["Досвід має високу вагу у ваших критеріях", "Вартість у межах бюджету"]
}
```

Фактори в explanation мають бути механічно виведені з реальних `weight`, `u`, `price`, `city`, `reviewCount`; ніяких LLM або вигаданих тверджень. Не використовувати фрази «найкраще лікування», «підходить для вашого діагнозу», «успішність 81.2%».

## 6. Функціональні сигнатури (для реалізації, не прив'язані до фреймворку)

- `buildReciprocalMatrix(keys, comparisons): number[][]`
- `calculateAHP(matrix): {weights, lambdaMax, ci, cr}`
- `calculateDirectWeights(values): number[]`
- `normalizeSpecialist(specialist, filters): Record<CriterionKey, number>`
- `scoreSpecialist(specialist, weights, filters): {score,factors}`
- `rankSpecialists(specialists, weights, filters): RankedItem[]`
- `buildExplanation(scoreBreakdown): string[]`

No database IO inside pure math functions. Store algorithm version `ahp-gm-wsm-fixed-v1`.

## 7. Unit tests мінімум

5×5 all ones → weights 0.2, CR 0; consistent pairwise matrix from a priority vector → CR≈0; inverted reciprocal value; highly inconsistent Saaty cycle → CR>0.10; all direct weights 1 → 0.2; experience, price, rating, location, format edge cases; count zero rating; hard budget filter; no candidates; stable ties; privacy: user cannot read another user's recommendation; run twice same inputs → same ranking.
