import { useState } from "react";

export type FaqItem = { id: string; question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-text hover:bg-surface-tint/60"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              {item.question}
              <span className="text-brand-600" aria-hidden>{open ? "−" : "+"}</span>
            </button>
            {open && (
              <p className="px-5 pb-4 text-sm leading-relaxed text-text-muted">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const homeFaqItems: FaqItem[] = [
  {
    id: "how-match",
    question: "Як працює персоналізований підбір?",
    answer:
      "Ви описуєте запит (тип травми, місто, бюджет, формат), задаєте пріоритети критеріїв через AHP або WSM. Система нормалізує дані спеціалістів із PostgreSQL і ранжує кандидатів за зваженою сумою. Результат зберігається в історії рекомендацій.",
  },
  {
    id: "score",
    question: "Що означає показник відповідності?",
    answer:
      "Це зважена сума нормалізованих оцінок за досвідом, ціною, рейтингом, локацією та форматом — не ймовірність успіху лікування. Він показує, наскільки профіль відповідає вашим пріоритетам.",
  },
  {
    id: "ahp",
    question: "Що таке AHP і навіщо CR?",
    answer:
      "AHP (Analytic Hierarchy Process) будує ваги з десяти попарних порівнянь критеріїв. Індекс узгодженості CR перевіряє, чи не суперечать відповіді одна одній. Якщо CR перевищує поріг 0,10, система просить уточнити порівняння.",
  },
  {
    id: "rating",
    question: "Як формуються рейтинги?",
    answer:
      "Пацієнти залишають відгуки після консультації. Відгук проходить модерацію адміністратором; після схвалення середній рейтинг перераховується автоматично.",
  },
  {
    id: "request",
    question: "Як надіслати заявку на консультацію?",
    answer:
      "Увійдіть як пацієнт, відкрийте профіль спеціаліста та заповніть форму з бажаною датою. Це запит на звʼязок із статусом (очікує, прийнято, відхилено), а не підтверджений медичний запис.",
  },
  {
    id: "moderation",
    question: "Як спеціаліст проходить модерацію?",
    answer:
      "Після реєстрації профіль має статус PENDING. Адміністратор перевіряє анкету та схвалює або відхиляє. Суттєві зміни після схвалення можуть знову перевести профіль на перевірку.",
  },
  {
    id: "medical",
    question: "Чи є рекомендація медичним висновком?",
    answer:
      "Ні. RehabMatch — навчальна інформаційна система порівняння фахівців за організаційними критеріями. Вона не ставить діагноз і не замінює консультацію лікаря.",
  },
];
