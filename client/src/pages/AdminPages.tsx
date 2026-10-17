import { PlaceholderPage } from "../components/PlaceholderPage";

function adminPlaceholder(title: string) {
  return function AdminSectionPage() {
    return (
      <PlaceholderPage
        title={title}
        description="Адміністративна панель буде реалізована на етапах M3 та M6–M7."
      />
    );
  };
}

export const AdminHomePage = adminPlaceholder("Панель адміністратора");
export const AdminUsersPage = adminPlaceholder("Користувачі");
export const AdminSpecialistsPage = adminPlaceholder("Спеціалісти");
export const AdminReviewsPage = adminPlaceholder("Відгуки");
export const AdminDictionariesPage = adminPlaceholder("Довідники");
export const AdminCriteriaPage = adminPlaceholder("Критерії");
export const AdminRequestsPage = adminPlaceholder("Заявки");
