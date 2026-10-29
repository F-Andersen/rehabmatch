import { expect, it } from "vitest";
import { loadShowcaseProfiles, showcaseInjuryTypes } from "../prisma/showcase/profiles.js";

it("showcase offers affordable approved sports injury specialists in Kyiv", () => {
  const candidates = loadShowcaseProfiles().filter((row) =>
    row.specialization === "Спортивна реабілітація" &&
    showcaseInjuryTypes(row).includes("Спортивні травми") &&
    row.city === "Київ" && row.pricePerSessionUah <= 1500 &&
    row.verificationStatus === "APPROVED",
  );
  expect(candidates.length).toBeGreaterThan(0);
  for (const row of candidates) expect(showcaseInjuryTypes(row)).toContain(row.injuryType);
});
