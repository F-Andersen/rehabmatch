type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">{title}</h1>
      <p className="mt-3 max-w-2xl text-text-muted">{description}</p>
      <p className="mt-4 text-sm text-text-muted">
        Ця сторінка створена на етапі M1A як маршрут-заглушка. Функціонал буде додано в
        наступних milestone.
      </p>
    </section>
  );
}
