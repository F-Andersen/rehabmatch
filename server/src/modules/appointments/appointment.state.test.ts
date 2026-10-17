import { AppointmentRequestStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { AppError } from "../../lib/http-errors.js";
import {
  assertPatientCancelTransition,
  assertSpecialistStatusTransition,
} from "./appointment.state.js";

describe("appointment state machine", () => {
  it("allows specialist ACCEPTED/DECLINED from REQUESTED", () => {
    expect(() =>
      assertSpecialistStatusTransition(
        AppointmentRequestStatus.REQUESTED,
        AppointmentRequestStatus.ACCEPTED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSpecialistStatusTransition(
        AppointmentRequestStatus.REQUESTED,
        AppointmentRequestStatus.DECLINED,
      ),
    ).not.toThrow();
  });

  it("rejects specialist transition from terminal state", () => {
    expect(() =>
      assertSpecialistStatusTransition(
        AppointmentRequestStatus.ACCEPTED,
        AppointmentRequestStatus.DECLINED,
      ),
    ).toThrow(AppError);
  });

  it("allows patient cancel only from REQUESTED", () => {
    expect(() => assertPatientCancelTransition(AppointmentRequestStatus.REQUESTED)).not.toThrow();
    expect(() => assertPatientCancelTransition(AppointmentRequestStatus.ACCEPTED)).toThrow(AppError);
  });
});
