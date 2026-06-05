export type OwnerTestingReadinessState = "ready" | "review" | "blocked" | "waiting";

export interface OwnerTestingChecklistItem {
  readonly id: string;
  readonly name: string;
  readonly focus: string;
  readonly checks: string;
  readonly state: OwnerTestingReadinessState;
}

export interface OwnerTestingChecklistSummary {
  readonly total: number;
  readonly ready: number;
  readonly review: number;
  readonly blocked: number;
  readonly waiting: number;
  readonly readiness: number;
  readonly state: OwnerTestingReadinessState;
  readonly statusLabel: string;
}

export interface OwnerTestingChecklist {
  readonly id: string;
  readonly label: string;
  readonly version: string;
  readonly items: readonly OwnerTestingChecklistItem[];
  readonly summary: OwnerTestingChecklistSummary;
}

export type OwnerTestingChecklistItemId =
  (typeof OWNER_TESTING_CHECKLIST_ORDER)[number];

export type OwnerTestingChecklistOverrides = Partial<
  Record<OwnerTestingChecklistItemId, OwnerTestingReadinessState>
>;

type ChecklistTemplateItem = Omit<OwnerTestingChecklistItem, "state"> & {
  id: OwnerTestingChecklistItemId;
};

const STATE_WEIGHT: Record<OwnerTestingReadinessState, number> = {
  ready: 100,
  review: 60,
  waiting: 25,
  blocked: 0
};

const STATE_LABEL: Record<OwnerTestingReadinessState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

export const OWNER_TESTING_CHECKLIST_ID = "owner-testing-checklist-phase-9";
export const OWNER_TESTING_CHECKLIST_LABEL =
  "Phase 9 owner testing hardening checklist";
export const OWNER_TESTING_CHECKLIST_VERSION = "9.0.0";

export const OWNER_TESTING_CHECKLIST_ORDER = [
  "launch",
  "connect",
  "chat",
  "multi-panel",
  "controls",
  "slash-commands",
  "catalogs",
  "migration",
  "planning",
  "dispatch",
  "permissions",
  "reload",
  "recovery"
] as const;

const OWNER_TESTING_CHECKLIST_TEMPLATE: readonly ChecklistTemplateItem[] = [
  {
    id: "launch",
    name: "Launch",
    focus:
      "Start from a clean owner profile and confirm predictable app boot, local persistence boundaries, and workspace visibility.",
    checks:
      "Start path, configuration defaults, startup banners, and safety notices are stable before functional work begins."
  },
  {
    id: "connect",
    name: "Connect",
    focus:
      "Open provider/runtime/session connections through the same flow used by owners and confirm expected handoff messages.",
    checks:
      "Connection can be established and re-established without opaque errors or stale state."
  },
  {
    id: "chat",
    name: "Chat",
    focus:
      "Drive message exchange for owned sessions and verify per-panel conversation control paths remain isolated and recoverable.",
    checks:
      "Chat controls, interrupt signals, and message continuity are consistent across repeated runs."
  },
  {
    id: "multi-panel",
    name: "Multi-Panel",
    focus:
      "Load multiple panels and verify shared controls, panel focus, and status visibility stay coherent.",
    checks:
      "Panel switching, panel focus, and per-panel activity feed behavior are stable without crosstalk."
  },
  {
    id: "controls",
    name: "Controls",
    focus:
      "Use control affordances repeatedly and confirm deterministic behavior in pause, stop, resume, and re-route paths.",
    checks:
      "Critical controls are disabled, enabled, and actionable at the right times."
  },
  {
    id: "slash-commands",
    name: "Slash Commands",
    focus:
      "Execute documented slash commands and validate predictable command argument parsing and output formatting.",
    checks:
      "Unsupported commands are rejected with clear messaging instead of undefined behavior."
  },
  {
    id: "catalogs",
    name: "Catalogs",
    focus:
      "Validate command, plugin, and tool catalogs are discoverable with stable metadata and deterministic ordering.",
    checks:
      "Catalog contents remain ordered, stable, and filterable across multiple loads."
  },
  {
    id: "migration",
    name: "Migration",
    focus:
      "Check migration actions are staged, reversible where expected, and never skip verification steps.",
    checks:
      "Migration planning and execution are auditable and can be paused before irreversible actions."
  },
  {
    id: "planning",
    name: "Planning",
    focus:
      "Create and persist planning artifacts, then confirm versioned updates and evidence capture remain consistent.",
    checks:
      "Planning states round-trip correctly between create, edit, and publish-review flow."
  },
  {
    id: "dispatch",
    name: "Dispatch",
    focus:
      "Validate dispatch sequencing for owner workflows and verify failure/retry behavior on synthetic payloads.",
    checks:
      "Dispatch routing is deterministic and dispatch logs match intended route and lane."
  },
  {
    id: "permissions",
    name: "Permissions",
    focus:
      "Exercise permission prompts for sensitive actions and verify blocked vs approved branches are explicit.",
    checks:
      "No sensitive action can proceed without the expected approval or explicit owner confirmation."
  },
  {
    id: "reload",
    name: "Reload",
    focus:
      "Reload after partial work and verify unsaved owner context is preserved or explicitly queued.",
    checks:
      "Recovery guidance appears when reload changes panel/workflow continuity."
  },
  {
    id: "recovery",
    name: "Recovery",
    focus:
      "Run failure paths and verify recovery routes rehydrate ownership context without silent data loss.",
    checks:
      "Recovery states are visible and deterministic after stop, retry, and resumed runs."
  }
];

export function resolveOwnerTestingChecklistState(
  counts: Pick<OwnerTestingChecklistSummary, "blocked" | "review" | "waiting">
): OwnerTestingReadinessState {
  if (counts.blocked > 0) {
    return "blocked";
  }

  if (counts.review > 0) {
    return "review";
  }

  if (counts.waiting > 0) {
    return "waiting";
  }

  return "ready";
}

export function summarizeOwnerTestingChecklistItems(
  items: readonly Pick<OwnerTestingChecklistItem, "state">[]
): OwnerTestingChecklistSummary {
  let ready = 0;
  let review = 0;
  let blocked = 0;
  let waiting = 0;

  for (const item of items) {
    switch (item.state) {
      case "ready":
        ready += 1;
        break;
      case "review":
        review += 1;
        break;
      case "blocked":
        blocked += 1;
        break;
      case "waiting":
        waiting += 1;
        break;
      default:
        waiting += 1;
        break;
    }
  }

  const total = items.length;
  const weightedTotal =
    items.length === 0
      ? 0
      : items.reduce((acc, item) => acc + STATE_WEIGHT[item.state], 0);
  const readiness = total === 0 ? 0 : Math.round(weightedTotal / total);
  const state = resolveOwnerTestingChecklistState({ blocked, review, waiting });

  return {
    total,
    ready,
    review,
    blocked,
    waiting,
    readiness,
    state,
    statusLabel: STATE_LABEL[state]
  };
}

function stateForItem(
  overrides: OwnerTestingChecklistOverrides,
  id: OwnerTestingChecklistItemId
): OwnerTestingReadinessState {
  return overrides[id] ?? "waiting";
}

export function buildOwnerTestingChecklist(
  overrides: OwnerTestingChecklistOverrides = {}
): OwnerTestingChecklist {
  const items = OWNER_TESTING_CHECKLIST_TEMPLATE.map((template) => ({
    ...template,
    state: stateForItem(overrides, template.id)
  }));

  const summary = summarizeOwnerTestingChecklistItems(items);
  return {
    id: OWNER_TESTING_CHECKLIST_ID,
    label: OWNER_TESTING_CHECKLIST_LABEL,
    version: OWNER_TESTING_CHECKLIST_VERSION,
    items,
    summary
  };
}
