/**
 * Публічні контакти. Заповніть локально через VITE_CONTACT_* у .env (не комітити секрети).
 * Якщо значення порожні — UI показує інструкцію для власника проєкту.
 */
export const publicContact = {
  supportEmail: import.meta.env.VITE_CONTACT_EMAIL?.trim() || "",
  supportPhone: import.meta.env.VITE_CONTACT_PHONE?.trim() || "",
  officeNote: import.meta.env.VITE_CONTACT_OFFICE?.trim() || "",
};

export const hasConfiguredContact =
  Boolean(publicContact.supportEmail) ||
  Boolean(publicContact.supportPhone) ||
  Boolean(publicContact.officeNote);
