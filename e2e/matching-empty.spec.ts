import { expect, test } from "@playwright/test";
import { registerPatient, uniqueEmail } from "./helpers";

for (const mode of ["AHP", "WSM"] as const) {
  test(`${mode}: empty results explain filters and restore them for editing`, async ({ page }) => {
    test.slow();
    await registerPatient(page, uniqueEmail(`empty-${mode.toLowerCase()}`));
    await page.goto("/matching/new");
    const injury = page.getByLabel("Тип травми / захворювання", { exact: true });
    const specialization = page.getByLabel("Спеціалізація (необовʼязково)", { exact: true });
    const city = page.getByLabel("Місто", { exact: true });
    const district = page.getByLabel("Район", { exact: true });
    const format = page.getByLabel("Формат консультації", { exact: true });
    await injury.selectOption({ index: 1 });
    await specialization.selectOption({ index: 1 });
    await city.selectOption({ index: 1 });
    await district.selectOption({ index: 1 });
    await format.selectOption({ index: 1 });
    const selected = await Promise.all([injury, specialization, city, district, format].map((field) => field.inputValue()));
    await page.getByLabel("Максимальний бюджет (грн)", { exact: true }).fill("1");
    for (const name of ["Лише обране місто", "Інклюзивний простір", "Суворий фільтр формату"]) {
      await page.getByRole("checkbox", { name, exact: true }).check();
    }
    if (mode === "WSM") await page.getByRole("radio", { name: "Швидке налаштування (WSM)", exact: true }).check();
    await page.getByRole("button", { name: "Далі: критерії", exact: true }).click();
    if (mode === "AHP") {
      for (let i = 0; i < 10; i++) {
        await page.getByRole("button", { name: /Однакова важливість/ }).first().click();
        if (i < 9) await page.getByRole("button", { name: "Далі", exact: true }).click();
      }
      await page.getByRole("button", { name: "Попередній розрахунок", exact: true }).click();
    }
    await page.getByRole("button", { name: "Отримати рекомендації", exact: true }).click();
    await expect(page.getByRole("heading", { name: "За вашими фільтрами спеціалістів не знайдено", exact: true })).toBeVisible();
    await expect(page.getByText("До 1 грн за консультацію", { exact: true })).toBeVisible();
    await expect(page.getByText(/Зміна ваг критеріїв не розширить/)).toBeVisible();
    await page.getByRole("link", { name: "Змінити параметри", exact: true }).click();
    await page.reload(); // Restoration must survive refresh, not just router state.
    await expect(page.getByRole("heading", { name: "Персоналізований підбір", exact: true })).toBeVisible();
    for (const [index, field] of [injury, specialization, city, district, format].entries()) {
      await expect(field).toHaveValue(selected[index]);
    }
    await expect(page.getByLabel("Максимальний бюджет (грн)", { exact: true })).toHaveValue("1");
    for (const name of ["Лише обране місто", "Інклюзивний простір", "Суворий фільтр формату"]) {
      await expect(page.getByRole("checkbox", { name, exact: true })).toBeChecked();
    }
    await expect(page.getByRole("radio", { name: mode === "AHP" ? "Попарне порівняння (AHP)" : "Швидке налаштування (WSM)", exact: true })).toBeChecked();
  });
}
