import type { WorkerModelProfile } from "./orchestratorWorkerDispatch";

export type OrchestratorModelRole = "worker" | "validator" | "orchestrator";

export interface OrchestratorResolvedModelRouting {
  worker?: WorkerModelProfile;
  validator?: WorkerModelProfile;
  orchestrator?: WorkerModelProfile;
  missingRoles: OrchestratorModelRole[];
}

function copyProfile(profile: WorkerModelProfile): WorkerModelProfile {
  return {
    ...profile,
    capabilities: { ...profile.capabilities }
  };
}

export function resolveOrchestratorModelRouting(input: {
  profiles?: readonly WorkerModelProfile[];
  workerProfileId?: string;
  requireSupportProfiles?: boolean;
  fallbackWorkerProfile?: WorkerModelProfile;
}): OrchestratorResolvedModelRouting {
  const profiles = input.profiles ?? [];
  const explicitWorker = input.workerProfileId
    ? profiles.find((profile) => profile.id === input.workerProfileId && profile.role === "worker")
    : undefined;
  const worker = explicitWorker ?? (
    input.workerProfileId
      ? undefined
      : profiles.find((profile) => profile.role === "worker") ?? input.fallbackWorkerProfile
  );
  const validator = profiles.find((profile) => profile.role === "validator");
  const orchestrator = profiles.find((profile) => profile.role === "orchestrator");
  const missingRoles: OrchestratorModelRole[] = [];
  if (!worker) missingRoles.push("worker");
  if (input.requireSupportProfiles && !validator) missingRoles.push("validator");
  if (input.requireSupportProfiles && !orchestrator) missingRoles.push("orchestrator");
  return {
    worker: worker ? copyProfile(worker) : undefined,
    validator: validator ? copyProfile(validator) : undefined,
    orchestrator: orchestrator ? copyProfile(orchestrator) : undefined,
    missingRoles
  };
}
