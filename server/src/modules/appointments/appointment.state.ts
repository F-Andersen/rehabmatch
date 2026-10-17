import { AppointmentRequestStatus } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";

const TERMINAL: AppointmentRequestStatus[] = [
  AppointmentRequestStatus.ACCEPTED,
  AppointmentRequestStatus.DECLINED,
  AppointmentRequestStatus.CANCELLED,
];

export function assertSpecialistStatusTransition(
  current: AppointmentRequestStatus,
  next: AppointmentRequestStatus,
): void {
  if (TERMINAL.includes(current)) {
    throw new AppError(409, "INVALID_STATE", "Заявку вже оброблено");
  }
  if (current !== AppointmentRequestStatus.REQUESTED) {
    throw new AppError(409, "INVALID_STATE", "Недопустимий перехід статусу");
  }
  if (
    next !== AppointmentRequestStatus.ACCEPTED &&
    next !== AppointmentRequestStatus.DECLINED
  ) {
    throw new AppError(409, "INVALID_STATE", "Спеціаліст може лише прийняти або відхилити заявку");
  }
}

export function assertPatientCancelTransition(current: AppointmentRequestStatus): void {
  if (current !== AppointmentRequestStatus.REQUESTED) {
    throw new AppError(409, "INVALID_STATE", "Скасувати можна лише заявку в статусі REQUESTED");
  }
}
