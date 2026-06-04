import type { RuntimeStreamSnapshot } from "./runtimeStream";

export interface CockpitMonitorHealth {
  stateLabel: string;
  detail: string;
  tone: "waiting" | "ready" | "live" | "paused" | "blocked" | "complete";
  pulseLabel: string;
}

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : 0;
}

export function createCockpitMonitorHealth(
  snapshot: RuntimeStreamSnapshot
): CockpitMonitorHealth {
  const emitted = sanitizeCount(snapshot.emitted);
  const total = sanitizeCount(snapshot.total);
  const blockedCount = sanitizeCount(snapshot.blocked);
  const pulseLabel = `${emitted}/${total}`;

  if (snapshot.state === "blocked" || blockedCount > 0) {
    return {
      stateLabel: "Blocked",
      detail: "Local adapter review is blocking the stream.",
      tone: "blocked",
      pulseLabel
    };
  }

  if (snapshot.state === "paused") {
    return {
      stateLabel: "Paused",
      detail: "Stream is paused.",
      tone: "paused",
      pulseLabel
    };
  }

  if (snapshot.state === "complete") {
    return {
      stateLabel: "Complete",
      detail: "All queued events emitted.",
      tone: "complete",
      pulseLabel
    };
  }

  if (snapshot.state === "streaming") {
    return {
      stateLabel: "Live",
      detail: "Emitting local events now.",
      tone: "live",
      pulseLabel
    };
  }

  if (snapshot.state === "idle") {
    if (total === 0 && emitted === 0) {
      return {
        stateLabel: "Waiting",
        detail: "Select or stage a local run.",
        tone: "waiting",
        pulseLabel
      };
    }

    return {
      stateLabel: "Ready",
      detail: "Attach and start the local stream.",
      tone: "ready",
      pulseLabel
    };
  }

  return {
    stateLabel: "Waiting",
    detail: "Select or stage a local run.",
    tone: "waiting",
    pulseLabel
  };
}
