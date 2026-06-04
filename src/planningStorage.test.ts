import { describe, expect, it } from "vitest";
import { parseStoredPlanningDrafts } from "./planningStorage";
import type { PlanningDraft } from "./planning";

const fallbackDrafts: PlanningDraft[] = [
  {
    title: "Fallback draft",
    objective: "Keep a usable draft when saved state is invalid.",
    targetProjectId: "website-refresh",
    scope: ["Fallback scope"],
    fileAreas: [],
    acceptanceCriteria: ["Fallback acceptance"],
    validationPlan: ["npm run test"],
    risk: "medium",
    rollbackNote: "Discard the saved state.",
    deployMode: "dry-run"
  }
];

describe("planning draft storage", () => {
  it("falls back when saved draft state is missing or malformed", () => {
    expect(parseStoredPlanningDrafts(null, fallbackDrafts)).toEqual(fallbackDrafts);
    expect(parseStoredPlanningDrafts("{", fallbackDrafts)).toEqual(fallbackDrafts);
    expect(parseStoredPlanningDrafts("{}", fallbackDrafts)).toEqual(fallbackDrafts);
    expect(parseStoredPlanningDrafts("[]", fallbackDrafts)).toEqual(fallbackDrafts);
  });

  it("normalizes saved drafts before returning them", () => {
    expect(
      parseStoredPlanningDrafts(
        JSON.stringify([
          {
            title: "  Saved draft  ",
            objective: " Keep user content ",
            targetProjectId: " website-refresh ",
            scope: [" One ", ""],
            fileAreas: [" src/App.tsx "],
            acceptanceCriteria: [" Accepted "],
            validationPlan: [" npm run build "],
            risk: "unknown",
            rollbackNote: " Revert local draft ",
            deployMode: "unsupported"
          }
        ]),
        fallbackDrafts
      )
    ).toEqual([
      {
        title: "Saved draft",
        objective: "Keep user content",
        targetProjectId: "website-refresh",
        scope: ["One"],
        fileAreas: ["src/App.tsx"],
        acceptanceCriteria: ["Accepted"],
        validationPlan: ["npm run build"],
        risk: "medium",
        rollbackNote: "Revert local draft",
        deployMode: "dry-run"
      }
    ]);
  });
});
