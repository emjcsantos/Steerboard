export type RuntimeWorkspaceMode = "read-only" | "read-write" | "isolated";

export type RuntimeTransport = "local-process" | "remote-endpoint" | "mock";

export type RuntimePermissionStatus = "enabled" | "review" | "blocked";

export interface RuntimePermissionState {
  permission: string;
  status: RuntimePermissionStatus;
}

export interface RuntimeProfile {
  id: string;
  label: string;
  adapterId: string;
  transport: RuntimeTransport;
  command: string;
  args: string[];
  workspaceMode: RuntimeWorkspaceMode;
  permissionState: RuntimePermissionState[];
  enabled: boolean;
  capabilities: string[];
  requiredPermissions: string[];
}

export type RuntimeReadinessState = "ready" | "review" | "blocked";

export interface RuntimeProfileReadiness {
  state: RuntimeReadinessState;
  readiness: number;
  reasons: string[];
  safety: string;
}

const LOCAL_PROCESS_TRANSPORT: RuntimeTransport = "local-process";
const PROFILE_EVALUATION_SAFETY = "No process execution is performed while evaluating this profile.";
const DEFAULT_PROFILE: Omit<RuntimeProfile, "id" | "adapterId"> = {
  label: "Runtime profile draft",
  transport: "local-process",
  command: "",
  args: [],
  workspaceMode: "read-only",
  permissionState: [],
  enabled: false,
  capabilities: [],
  requiredPermissions: [],
  // Intentionally conservative defaults so no process execution is implied.
};

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function dedupeStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      deduped.push(value);
    }
  }

  return deduped;
}

function cleanRequiredPermissions(requiredPermissions: readonly string[]): string[] {
  return dedupeStrings(requiredPermissions.map((permission) => permission.trim()).filter(hasText));
}

function permissionStatuses(profile: RuntimeProfile): Map<string, RuntimePermissionStatus> {
  const statuses = new Map<string, RuntimePermissionStatus>();

  for (const permission of profile.permissionState) {
    const permissionName = permission.permission.trim();
    if (!permissionName) {
      continue;
    }

    if (permission.status !== "enabled" && permission.status !== "blocked" && permission.status !== "review") {
      statuses.set(permissionName, "review");
      continue;
    }

    statuses.set(permissionName, permission.status);
  }

  return statuses;
}

function readinessReasons(profile: RuntimeProfile): {
  blocked: string[];
  review: string[];
} {
  const blocked: string[] = [];
  const review: string[] = [];

  if (!profile.enabled) {
    blocked.push("Profile execution is disabled.");
  }

  if (profile.transport === LOCAL_PROCESS_TRANSPORT && !hasText(profile.command)) {
    blocked.push("Local-process transport requires a command.");
  }

  const requiredPermissions = cleanRequiredPermissions(profile.requiredPermissions);
  const statuses = permissionStatuses(profile);

  for (const required of requiredPermissions) {
    const status = statuses.get(required);
    if (status === "enabled") {
      continue;
    }

    if (status === "blocked") {
      blocked.push(`Permission "${required}" is blocked.`);
      continue;
    }

    review.push(`Permission "${required}" requires review or approval.`);
  }

  return {
    blocked: dedupeStrings(blocked),
    review: dedupeStrings(review)
  };
}

export function createBlankRuntimeProfile(overrides: Partial<RuntimeProfile> = {}): RuntimeProfile {
  return {
    id: overrides.id ?? "runtime-profile-draft",
    adapterId: overrides.adapterId ?? "",
    label: overrides.label ?? DEFAULT_PROFILE.label,
    transport: (overrides.transport ?? DEFAULT_PROFILE.transport) as RuntimeTransport,
    command: overrides.command ?? DEFAULT_PROFILE.command,
    args: [...(overrides.args ?? DEFAULT_PROFILE.args)],
    workspaceMode: overrides.workspaceMode ?? DEFAULT_PROFILE.workspaceMode,
    permissionState: [...(overrides.permissionState ?? DEFAULT_PROFILE.permissionState)],
    enabled: overrides.enabled ?? DEFAULT_PROFILE.enabled,
    capabilities: [...(overrides.capabilities ?? DEFAULT_PROFILE.capabilities)],
    requiredPermissions: [...(overrides.requiredPermissions ?? DEFAULT_PROFILE.requiredPermissions)]
  };
}

export function evaluateRuntimeProfileReadiness(profile: RuntimeProfile): RuntimeProfileReadiness {
  const { blocked, review } = readinessReasons(profile);
  const reasons = dedupeStrings([...blocked, ...review]);

  if (blocked.length > 0) {
    return {
      state: "blocked",
      readiness: 0,
      reasons,
      safety: PROFILE_EVALUATION_SAFETY
    };
  }

  if (review.length > 0) {
    return {
      state: "review",
      readiness: 60,
      reasons,
      safety: PROFILE_EVALUATION_SAFETY
    };
  }

  return {
    state: "ready",
    readiness: 100,
    reasons: [],
    safety: PROFILE_EVALUATION_SAFETY
  };
}
