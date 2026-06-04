import {
  createBlankRuntimeProfile,
  evaluateRuntimeProfileReadiness,
  type RuntimeProfile
} from "./runtimeProfile";

export const runtimeProfiles: RuntimeProfile[] = [
  {
    ...createBlankRuntimeProfile(),
    id: "runtime-profile-local-draft",
    label: "Local process draft",
    adapterId: "developer-tooling",
    transport: "local-process",
    workspaceMode: "read-only",
    enabled: false
  },
  {
    ...createBlankRuntimeProfile(),
    id: "runtime-profile-remote-review",
    label: "Remote endpoint review",
    adapterId: "billing-workflow",
    transport: "remote-endpoint",
    workspaceMode: "read-write",
    enabled: true,
    requiredPermissions: ["network_access"]
  },
  {
    ...createBlankRuntimeProfile(),
    id: "runtime-profile-mock-preview",
    label: "Mock preview profile",
    adapterId: "website-refresh",
    transport: "mock",
    workspaceMode: "isolated",
    enabled: true,
    capabilities: ["tasks", "sessions"]
  }
];

export type RuntimeProfileCatalogSummary = {
  total: number;
  ready: number;
  review: number;
  blocked: number;
  readiness: number;
};

export function summarizeRuntimeProfiles(profiles: RuntimeProfile[]): RuntimeProfileCatalogSummary {
  let ready = 0;
  let review = 0;
  let blocked = 0;

  for (const profile of profiles) {
    const readiness = evaluateRuntimeProfileReadiness(profile);
    if (readiness.state === "ready") {
      ready += 1;
      continue;
    }

    if (readiness.state === "review") {
      review += 1;
      continue;
    }

    blocked += 1;
  }

  const total = profiles.length;
  const readiness = total > 0 ? Math.round((ready / total) * 100) : 0;

  return { total, ready, review, blocked, readiness };
}

export function selectRuntimeProfileForAdapter(
  profiles: RuntimeProfile[],
  adapterId: string
): RuntimeProfile | undefined {
  const match = profiles.find((profile) => profile.adapterId === adapterId);
  if (match) {
    return match;
  }

  return profiles[0];
}
