export type CockpitPanelTone = "active" | "waiting" | "review" | "complete";

export interface CockpitPanelIdentity {
  projectLabel: string;
  roleLabel: string;
  runtimeLabel: string;
  ariaLabel: string;
  title: string;
  detail: string;
  tone: CockpitPanelTone;
}

export interface CockpitPanelIdentityInput {
  title?: string;
  role?: string;
  state?: string;
  runtime?: string;
  projectLabel?: string;
  projectName?: string;
  projectId?: string;
}

const TITLE_MAX_LENGTH = 48;
const LABEL_MAX_LENGTH = 28;

const STATE_TONES: Record<string, CockpitPanelTone> = {
  planning: "active",
  implementing: "active",
  validating: "active",
  blocked: "review",
  failed: "review",
  complete: "complete",
  idle: "waiting"
};

const ROLE_LABELS: Record<string, string> = {
  orchestrator: "Orchestrator",
  implementer: "Implementer",
  validator: "Validator",
  integration: "Integration"
};

function normalizeWhitespace(value: string): string {
  return value.replace(/[\\/]+/g, " ").replace(/\s+/g, " ").trim();
}

function coerceLabel(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const collapsed = normalizeWhitespace(value);

  if (collapsed.length === 0) {
    return fallback;
  }

  return collapsed;
}

function compactLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function toProjectLabel(input: CockpitPanelIdentityInput): string {
  const explicitLabel = coerceLabel(input.projectLabel, "");
  const byName = coerceLabel(input.projectName, "");
  const byId = coerceLabel(input.projectId, "");

  return compactLabel(coerceLabel(explicitLabel || byName || byId || "Unassigned project", "Unassigned project"), LABEL_MAX_LENGTH);
}

function toRoleLabel(input: CockpitPanelIdentityInput): string {
  const normalizedRole = coerceLabel(input.role, "").toLowerCase();

  return compactLabel(
    ROLE_LABELS[normalizedRole] ?? "Panel",
    LABEL_MAX_LENGTH
  );
}

function toRuntimeLabel(input: CockpitPanelIdentityInput): string {
  return compactLabel(
    coerceLabel(input.runtime, "Unknown runtime"),
    LABEL_MAX_LENGTH
  );
}

function toTitleLabel(input: CockpitPanelIdentityInput): string {
  return compactLabel(coerceLabel(input.title, "Untitled panel"), TITLE_MAX_LENGTH);
}

function toTone(input: CockpitPanelIdentityInput): CockpitPanelTone {
  const state = coerceLabel(input.state, "idle").toLowerCase();
  return STATE_TONES[state] ?? "waiting";
}

function toDetail(
  roleLabel: string,
  projectLabel: string,
  runtimeLabel: string,
  tone: CockpitPanelTone
): string {
  if (tone === "review") {
    return `${roleLabel} panel needs attention for ${projectLabel}.`;
  }

  return `${roleLabel} on ${runtimeLabel} for ${projectLabel}.`;
}

export function createCockpitPanelIdentity(input: CockpitPanelIdentityInput): CockpitPanelIdentity {
  const projectLabel = toProjectLabel(input);
  const roleLabel = toRoleLabel(input);
  const runtimeLabel = toRuntimeLabel(input);
  const title = toTitleLabel(input);
  const tone = toTone(input);

  return {
    projectLabel,
    roleLabel,
    runtimeLabel,
    ariaLabel: `${projectLabel} - ${roleLabel} - ${title} - ${runtimeLabel}`,
    title,
    detail: toDetail(roleLabel, projectLabel, runtimeLabel, tone),
    tone
  };
}
