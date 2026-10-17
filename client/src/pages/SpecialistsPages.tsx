import { PlaceholderPage } from "../components/PlaceholderPage";
import { useParams } from "react-router-dom";

export function SpecialistsListPage() {
  return (
    <PlaceholderPage
      title="Пошук спеціалістів"
      description="Каталог із фільтрами та пагінацією буде реалізований на етапі M3."
    />
  );
}

export function SpecialistDetailPage() {
  const { id } = useParams();

  return (
    <PlaceholderPage
      title="Профіль спеціаліста"
      description={`Детальна сторінка спеціаліста (ID: ${id ?? "—"}) буде додана пізніше.`}
    />
  );
}
