import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DispatchReviewRecordCard } from "./App";
import { buildDispatchPackage } from "./dispatch";
import {
  buildCurrentDispatchReviewEvidenceFingerprint,
  createDispatchReviewRecord
} from "./dispatchReviewRecord";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { PlanningDraft } from "./planning";
import { createMockRunFromDispatchPackage } from "./run";

const project = {
  id: "phase-7-visible-project",
  name: "Phase 7 Visible Project"
};

const draft: PlanningDraft = {
  title: "Visible Phase 7 Dispatch",
  objective: "Prove local dispatch review is visible before live worker spawning.",
  targetProjectId: project.id,
  scope: ["Role panels", "Handoff packets", "Validation gates", "No live worker spawning"],
  fileAreas: ["src/phase7PlanningDispatchVisible.test.tsx"],
  acceptanceCriteria: [
    "Dispatch review card renders role coverage.",
    "Live worker execution remains locked."
  ],
  validationPlan: ["npm.cmd run test:phase7:owner-visible"],
  risk: "medium",
  rollbackNote: "Remove the local dispatch review proof.",
  deployMode: "staged"
};

function buildVisibleDispatchRecord() {
  const createdAt = "2026-06-18T08:35:00.000Z";
  const dispatchPackage = buildDispatchPackage(draft, project, {
    createdAt,
    idSeed: "phase-7-visible",
    status: "ready"
  });
  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    createdAt,
    idSeed: "phase-7-visible-run",
    status: "queued"
  });
  const rolePanelPlan = createDispatchRolePanelPlan(dispatchPackage, run);
  const record = createDispatchReviewRecord(dispatchPackage, rolePanelPlan, run, {
    createdAt
  });

  return { record, run };
}

describe("phase 7 planning dispatch visible proof", () => {
  it("renders dispatch review depth, ownership, traceability, blocker, fingerprint, and no-live-worker evidence", () => {
    const { record, run } = buildVisibleDispatchRecord();
    const html = renderToStaticMarkup(<DispatchReviewRecordCard record={record} run={run} />);
    const currentFingerprint = buildCurrentDispatchReviewEvidenceFingerprint(record, run);

    expect(html).toContain("Dispatch review");
    expect(html).toContain("Orch 1");
    expect(html).toContain("Impl 1");
    expect(html).toContain("Val 1");
    expect(html).toContain("Int 1");
    expect(html).toContain("Role coverage");
    expect(html).toContain("Attempt limits");
    expect(html).toContain("Handoff tasks");
    expect(html).toContain("Roles");
    expect(html).toContain("Tasks");
    expect(html).toContain("Gates");
    expect(html).toContain("Handoff packet integrity");
    expect(html).toContain("All four role packets carry owners");
    expect(html).toContain("Validation gates");
    expect(html).toContain("Review evidence freshness");
    expect(html).toContain(currentFingerprint);
    expect(html).toContain("Live worker lock");
    expect(html).toContain("do not launch");
    expect(html).toContain("records=1 open=0");
    expect(html).toContain("roles=4/4");
    expect(html).toContain("execution=locked");
    expect(html).toContain("Integration ownership");
    expect(html).toContain("Integration owner");
    expect(html).toContain("Final validation owner");
    expect(html).toContain("Commit, push, and reporting owner");
    expect(html).toContain("Review traceability");
    expect(html).toContain("Closure boundary");
    expect(html).toContain("Main Codex");
    expect(html).toContain("push approval");
    expect(html).toContain("items=5/5 open=0 ready=5");
    expect(html).toContain("traceabilityLinks=5/5");
    expect(html).toContain("Phase 7 dispatch traceability");
    expect(html).toContain("Remaining goal link");
    expect(html).toContain("PM row coverage");
    expect(html).toContain("Dispatch review depth");
    expect(html).toContain("Integration ownership depth");
    expect(html).toContain("Live-worker lock");
    expect(html).toContain("PM");
    expect(html).toContain("Locks");
    expect(html).toContain("Open");
    expect(html).toContain("pmLinks=10/10");
    expect(html).toContain("liveWorkerLocks=2/2");
    expect(html).toContain("Phase 7 dispatch blocker priority");
    expect(html).toContain("Remaining goal link");
    expect(html).toContain("Ready");
    expect(html).toContain("Status");
    expect(html).toContain("open=0 dispatchReviewAddressable=0");
    expect(html).toContain("trust=ready");
    expect(html).toContain("No open Phase 7 dispatch blocker");
    expect(html).toContain("Dispatch artifact verification");
    expect(html).toContain("Phase 7 dispatch artifact verification");
    expect(html).toContain("artifactVerification=ready");
    expect(html).toContain("fingerprint=");
    expect(html).toContain("match=ready");
    expect(html).toContain("local metadata only");
  });

  it("keeps stale dispatch evidence visibly in review", () => {
    const { record, run } = buildVisibleDispatchRecord();
    const staleRun = {
      ...run,
      status: "complete" as const,
      tasks: run.tasks.map((task) => ({ ...task, status: "accepted" as const }))
    };
    const html = renderToStaticMarkup(<DispatchReviewRecordCard record={record} run={staleRun} />);

    expect(html).toContain("Review evidence freshness");
    expect(html).toContain("does not match current run fingerprint");
    expect(html).toContain("Refresh or restage the dispatch review record");
    expect(html).toContain("Dispatch artifact verification");
    expect(html).toContain("artifactVerification=review");
    expect(html).toContain("Phase 7 dispatch review artifact still has open review-depth or integration-ownership rows");
    expect(html).toContain("Reviewable");
  });

  it("shows degraded Phase 7 dispatch blockers as visible owner-review text", () => {
    const { record, run } = buildVisibleDispatchRecord();
    const degradedRecord = {
      ...record,
      roleCounts: {
        orchestrator: 0,
        implementer: 0,
        validator: 0,
        integration: 0
      },
      maxAttemptLimit: 4,
      validationGateCount: 0,
      noRuntimeExecutionNote: "Runtime worker launch requested."
    };
    const html = renderToStaticMarkup(
      <DispatchReviewRecordCard record={degradedRecord} run={run} />
    );

    expect(html).toContain("Role coverage");
    expect(html).toContain("0/4 role lanes are represented");
    expect(html).toContain("Attempt limits");
    expect(html).toContain("Maximum visible attempt limit is 4");
    expect(html).toContain("Review retry limits before live worker spawning is considered");
    expect(html).toContain("Validation gates");
    expect(html).toContain("0 validation gates are attached");
    expect(html).toContain("Live worker lock");
    expect(html).toContain("Restore the local metadata-only no-runtime-execution note");
    expect(html).toContain("Phase 7 dispatch blocker priority");
    expect(html).toContain("Dispatch artifact verification");
    expect(html).toContain("artifactVerification=blocked");
    expect(html).toContain("execution=unlocked");
    expect(html).toContain("dispatch-review addressable");
  });
});
