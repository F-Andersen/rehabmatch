import { PlaceholderPage } from "../components/PlaceholderPage";

export function PatientDashboardPage() {
  return (
    <PlaceholderPage title="Кабінет пацієнта" description="Особистий кабінет пацієнта — майбутній етап." />
  );
}

export function MatchingNewPage() {
  return (
    <PlaceholderPage
      title="Новий підбір"
      description="Форма параметрів пошуку та збереження SearchRequest — етап M5."
    />
  );
}

export function MatchingCriteriaPage() {
  return (
    <PlaceholderPage
      title="Критерії підбору"
      description="AHP pairwise та WSM слайдери — етап M4–M5."
    />
  );
}

export function MatchingResultsPage() {
  return (
    <PlaceholderPage
      title="Результати підбору"
      description="Ранжовані рекомендації — етап M5."
    />
  );
}

export function RecommendationsHistoryPage() {
  return (
    <PlaceholderPage title="Історія рекомендацій" description="Збережені рекомендації — етап M5." />
  );
}

export function MyRequestsPage() {
  return (
    <PlaceholderPage title="Мої заявки" description="Заявки на консультацію — етап M6." />
  );
}

export function SettingsPage() {
  return <PlaceholderPage title="Налаштування" description="Налаштування профілю — майбутній етап." />;
}
