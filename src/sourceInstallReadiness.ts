export type SourceInstallReadinessState = "ready" | "review" | "blocked";
export type SourceInstallReadinessItemStatus = "ready" | "review" | "blocked";

export interface SourceInstallManifest {
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface SourceInstallReadinessItem {
  id: string;
  label: string;
  status: SourceInstallReadinessItemStatus;
  detail: string;
}

export interface SourceInstallReadinessSnapshot {
  label: string;
  state: SourceInstallReadinessState;
  statusLabel: string;
  readiness: number;
  canRecommendSourceInstall: boolean;
  detail: string;
  safety: string;
  items: SourceInstallReadinessItem[];
  ariaLabel: string;
}

const READY: SourceInstallReadinessItemStatus = "ready";
const REVIEW: SourceInstallReadinessItemStatus = "review";
const BLOCKED: SourceInstallReadinessItemStatus = "blocked";
const READY_LABEL = "Source install readiness";
const SNAPSHOT_ID = "source-install-readiness";
const READY_READINESS_POINT = 20;
const REVIEW_READINESS_POINT = 10;
const BLOCKED_READINESS_POINT = 0;
const PREVIEW_SAFETY =
  "No package manager, filesystem, process, signing, or network action is performed.";

function hasScripts(manifest: SourceInstallManifest): Record<string, boolean> {
  const scripts = manifest.scripts ?? {};
  return {
    dev: Object.prototype.hasOwnProperty.call(scripts, "dev"),
    build: Object.prototype.hasOwnProperty.call(scripts, "build"),
    desktopDev: Object.prototype.hasOwnProperty.call(scripts, "desktop:dev"),
    check: Object.prototype.hasOwnProperty.call(scripts, "check"),
    test: Object.prototype.hasOwnProperty.call(scripts, "test")
  };
}

function itemReadiness(
  status: SourceInstallReadinessItemStatus
): number {
  if (status === READY) {
    return READY_READINESS_POINT;
  }
  if (status === REVIEW) {
    return REVIEW_READINESS_POINT;
  }
  return BLOCKED_READINESS_POINT;
}

function buildStatusLabel(state: SourceInstallReadinessState): string {
  if (state === "ready") {
    return "Ready";
  }
  if (state === "blocked") {
    return "Blocked";
  }
  return "Needs review";
}

function buildSnapshotDetail(state: SourceInstallReadinessState): string {
  if (state === "ready") {
    return "Package manifest has source setup, startup, build, validation, and safe install scripts.";
  }
  if (state === "review") {
    return "Package manifest is mostly ready for source install with items needing review.";
  }
  return "Package manifest is blocked from source install by missing setup/build scripts or unsafe hooks.";
}

function summarizeAriaLabel(
  state: SourceInstallReadinessState,
  items: SourceInstallReadinessItem[]
): string {
  const statusText = items
    .map((item) => `${item.label}: ${item.status}`)
    .join(", ");
  return `${READY_LABEL} ${state}: ${statusText}`;
}

export function createSourceInstallReadiness(
  manifest: SourceInstallManifest = {}
): SourceInstallReadinessSnapshot {
  const scripts = hasScripts(manifest);
  const containsUnsafeHook =
    Object.prototype.hasOwnProperty.call(manifest.scripts ?? {}, "preinstall") ||
    Object.prototype.hasOwnProperty.call(manifest.scripts ?? {}, "install") ||
    Object.prototype.hasOwnProperty.call(manifest.scripts ?? {}, "postinstall") ||
    Object.prototype.hasOwnProperty.call(manifest.scripts ?? {}, "prepare");

  const sourceSetupScriptsStatus: SourceInstallReadinessItemStatus =
    scripts.dev ? READY : BLOCKED;

  const desktopStartupStatus: SourceInstallReadinessItemStatus =
    scripts.desktopDev ? READY : BLOCKED;

  const productionBuildStatus: SourceInstallReadinessItemStatus =
    scripts.build ? READY : BLOCKED;

  const validationStatus: SourceInstallReadinessItemStatus = scripts.check
    ? READY
    : scripts.build && scripts.test
      ? READY
      : REVIEW;

  const installHookSafetyStatus: SourceInstallReadinessItemStatus = containsUnsafeHook
    ? BLOCKED
    : READY;

  const items: SourceInstallReadinessItem[] = [
    {
      id: `${SNAPSHOT_ID}:source-setup-scripts`,
      label: "Source setup scripts",
      status: sourceSetupScriptsStatus,
      detail: scripts.dev
        ? "A dev script is present in manifest scripts."
        : "Missing dev script in manifest."
    },
    {
      id: `${SNAPSHOT_ID}:desktop-startup-script`,
      label: "Desktop startup script",
      status: desktopStartupStatus,
      detail: scripts.desktopDev
        ? "desktop:dev script is present in manifest scripts."
        : "Missing desktop:dev script in manifest."
    },
    {
      id: `${SNAPSHOT_ID}:production-build-script`,
      label: "Production build script",
      status: productionBuildStatus,
      detail: scripts.build
        ? "Build script is present in manifest scripts."
        : "Missing build script in manifest."
    },
    {
      id: `${SNAPSHOT_ID}:validation-script`,
      label: "Validation script",
      status: validationStatus,
      detail:
        scripts.check
          ? "check script is present in manifest scripts."
          : scripts.build && scripts.test
            ? "Validation falls back to test/build script pair."
            : "Missing check script; include check or both test and build scripts."
    },
    {
      id: `${SNAPSHOT_ID}:install-hook-safety`,
      label: "Install hook safety",
      status: installHookSafetyStatus,
      detail: containsUnsafeHook
        ? "Unsafe install-time hooks are present."
        : "No preinstall, install, postinstall, or prepare hooks are present."
    }
  ];

  const hasBlockedRequiredScript = (
    sourceSetupScriptsStatus === BLOCKED ||
    desktopStartupStatus === BLOCKED ||
    productionBuildStatus === BLOCKED
  );
  const hasBlockedItems = hasBlockedRequiredScript || installHookSafetyStatus === BLOCKED;
  const state: SourceInstallReadinessState = hasBlockedItems
    ? "blocked"
    : items.some((item) => item.status === REVIEW)
      ? "review"
      : "ready";

  const readiness = items.reduce(
    (acc, item) => acc + itemReadiness(item.status),
    0
  );
  const ariaLabel = summarizeAriaLabel(state, items);

  return {
    label: `${READY_LABEL}${manifest.name ? ` (${manifest.name})` : ""}`,
    state,
    statusLabel: buildStatusLabel(state),
    readiness: Math.trunc(Math.max(0, Math.min(100, readiness))),
    canRecommendSourceInstall: state === "ready",
    detail: buildSnapshotDetail(state),
    safety: PREVIEW_SAFETY,
    items,
    ariaLabel
  };
}
