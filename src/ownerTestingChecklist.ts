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
  readonly catalogRefresh: OwnerTestingCatalogRefreshSummary;
}

export interface OwnerTestingCatalogRefreshSummary {
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

export type OwnerTestingCatalogRefreshChecklistItemId =
  (typeof OWNER_TESTING_CATALOG_REFRESH_ORDER)[number];

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
  "catalog-command-refresh",
  "catalog-skill-refresh",
  "catalog-plugin-refresh",
  "catalog-mcp-refresh",
  "catalog-automation-refresh",
  "catalog-personalization-refresh",
  "migration",
  "planning",
  "dispatch",
  "permissions",
  "reload",
  "recovery"
] as const;

export const OWNER_TESTING_CATALOG_REFRESH_ORDER = [
  "catalog-command-refresh",
  "catalog-skill-refresh",
  "catalog-plugin-refresh",
  "catalog-mcp-refresh",
  "catalog-automation-refresh",
  "catalog-personalization-refresh"
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
      "Validate owner slash-command routing for panel-scoped suggestions, and confirm app/global-only commands are blocked when used outside permitted scope.",
    checks:
      "Capture transcript evidence showing provider-route mapping for suggestions and explicit app/global-only command blocking, while keeping this check provider/model-agnostic."
  },
  {
    id: "catalogs",
    name: "Catalog Refreshes",
    focus:
      "Keep catalog refresh behavior deterministic across command, skill, plugin, MCP, automation, and personalization surfaces.",
    checks:
      "Refreshes should remain deterministic when payloads are valid, invalid, or missing."
  },
  {
    id: "catalog-command-refresh",
    name: "Command Refresh",
    focus:
      "Verify slash-command catalog refresh paths stay stable when content updates or payloads are malformed.",
    checks:
      "Command catalog refresh has deterministic ordering and safe fallback behavior under empty or invalid payloads."
  },
  {
    id: "catalog-skill-refresh",
    name: "Skill Refresh",
    focus:
      "Verify skill catalog refresh paths stay deterministic across provider-backed payload updates and malformed payloads.",
    checks:
      "Skill catalog refresh remains ordered, stable, and safe when fallback paths are required."
  },
  {
    id: "catalog-plugin-refresh",
    name: "Plugin Refresh",
    focus:
      "Verify plugin catalog refresh paths remain deterministic across valid, blocked, and unavailable payload shapes.",
    checks:
      "Plugin catalog refresh handles availability changes, fallbacks, and deterministic ordering without mutation."
  },
  {
    id: "catalog-mcp-refresh",
    name: "MCP Refresh",
    focus:
      "Verify MCP catalog refresh behavior is deterministic across provider-backed updates and unavailable catalog states.",
    checks:
      "MCP catalog refresh reports safe fallback states and keeps stable ordering through repeated refreshes."
  },
  {
    id: "catalog-automation-refresh",
    name: "Automation Refresh",
    focus:
      "Verify automation catalog refresh paths stay deterministic across payload changes and temporary unavailability.",
    checks:
      "Automation catalog refresh handles empty and unavailable payloads with safe defaults and predictable status."
  },
  {
    id: "catalog-personalization-refresh",
    name: "Personalization Refresh",
    focus:
      "Verify personalization catalog refresh behavior remains deterministic during updates and malformed payloads.",
    checks:
      "Personalization catalog refresh keeps deterministic ordering and safe fallback behavior consistently."
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

interface OwnerTestingChecklistStateCountItem {
  readonly state: OwnerTestingChecklistItem["state"];
  readonly id?: OwnerTestingChecklistItemId;
}

export function summarizeOwnerTestingChecklistItems(
  items: readonly OwnerTestingChecklistStateCountItem[]
): OwnerTestingChecklistSummary {
  const catalogRefreshItems: OwnerTestingChecklistStateCountItem[] = [];
  const stateOnlyItems: OwnerTestingChecklistItem["state"][] = [];

  for (const item of items) {
    if (item.id && isCatalogRefreshChecklistItemId(item.id)) {
      catalogRefreshItems.push(item);
    }
    stateOnlyItems.push(item.state);
  }

  let ready = 0;
  let review = 0;
  let blocked = 0;
  let waiting = 0;

  for (const itemState of stateOnlyItems) {
    switch (itemState) {
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
  const catalogRefreshSummary = summarizeCatalogRefreshOwnerTestingItems(
    catalogRefreshItems
  );
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
    statusLabel: STATE_LABEL[state],
    catalogRefresh: catalogRefreshSummary
  };
}

function summarizeCatalogRefreshOwnerTestingItems(
  items: readonly Pick<OwnerTestingChecklistItem, "state">[]
): OwnerTestingCatalogRefreshSummary {
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
    items.length === 0 ? 0 : items.reduce((acc, item) => acc + STATE_WEIGHT[item.state], 0);
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

function isCatalogRefreshChecklistItemId(
  id: string
): id is OwnerTestingCatalogRefreshChecklistItemId {
  return OWNER_TESTING_CATALOG_REFRESH_ORDER.includes(id as OwnerTestingCatalogRefreshChecklistItemId);
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
