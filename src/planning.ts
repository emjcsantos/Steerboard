export type PlanningDeployMode = "dry-run" | "staged" | "full";

export type PlanningRiskLevel = "low" | "medium" | "high";

export interface PlanningDraft {
  title: string;
  objective: string;
  targetProjectId: string;
  scope: string[];
  fileAreas: string[];
  acceptanceCriteria: string[];
  validationPlan: string[];
  risk: PlanningRiskLevel;
  rollbackNote: string;
  deployMode: PlanningDeployMode;
}

export type PlanningDraftRequiredField =
  | "title"
  | "objective"
  | "targetProjectId"
  | "scope"
  | "acceptanceCriteria"
  | "validationPlan"
  | "rollbackNote";

export interface PlanningReadiness {
  readiness: number;
  missingFieldIds: PlanningDraftRequiredField[];
}

const defaultPlanningDraft: PlanningDraft = {
  title: "",
  objective: "",
  targetProjectId: "",
  scope: [],
  fileAreas: [],
  acceptanceCriteria: [],
  validationPlan: [],
  risk: "medium",
  rollbackNote: "",
  deployMode: "dry-run"
};

const validDeployModes: readonly PlanningDeployMode[] = ["dry-run", "staged", "full"];
const validRiskLevels: readonly PlanningRiskLevel[] = ["low", "medium", "high"];
const requiredPlanningFields: PlanningDraftRequiredField[] = [
  "title",
  "objective",
  "targetProjectId",
  "scope",
  "acceptanceCriteria",
  "validationPlan",
  "rollbackNote"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? fallback : normalized;
}

function normalizeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeDeployMode(value: unknown): PlanningDeployMode {
  return validDeployModes.includes(value as PlanningDeployMode) ? (value as PlanningDeployMode) : defaultPlanningDraft.deployMode;
}

function normalizeRisk(value: unknown): PlanningRiskLevel {
  return validRiskLevels.includes(value as PlanningRiskLevel) ? (value as PlanningRiskLevel) : defaultPlanningDraft.risk;
}

export function normalizePlanningDraft(draft: unknown): PlanningDraft {
  if (!isRecord(draft)) {
    return { ...defaultPlanningDraft };
  }

  return {
    title: normalizeText(draft.title, defaultPlanningDraft.title),
    objective: normalizeText(draft.objective, defaultPlanningDraft.objective),
    targetProjectId: normalizeText(draft.targetProjectId, defaultPlanningDraft.targetProjectId),
    scope: normalizeTextList(draft.scope),
    fileAreas: normalizeTextList(draft.fileAreas),
    acceptanceCriteria: normalizeTextList(draft.acceptanceCriteria),
    validationPlan: normalizeTextList(draft.validationPlan),
    risk: normalizeRisk(draft.risk),
    rollbackNote: normalizeText(draft.rollbackNote, defaultPlanningDraft.rollbackNote),
    deployMode: normalizeDeployMode(draft.deployMode)
  };
}

export function evaluatePlanningReadiness(draft: unknown): PlanningReadiness {
  const normalized = normalizePlanningDraft(draft);

  const missingFieldIds = requiredPlanningFields.filter((field): boolean => {
    if (field === "scope" || field === "acceptanceCriteria" || field === "validationPlan") {
      return normalized[field].length === 0;
    }

    return normalizeText(normalized[field], "").length === 0;
  });

  const readiness = Math.round((1 - missingFieldIds.length / requiredPlanningFields.length) * 100);

  return {
    readiness,
    missingFieldIds
  };
}

export function canDeployPlanningDraft(draft: unknown): boolean {
  return evaluatePlanningReadiness(draft).readiness === 100;
}
