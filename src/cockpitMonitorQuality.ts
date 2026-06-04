import type { RuntimeStreamSnapshot } from "./runtimeStream";

export interface CockpitMonitorQualityMetric {
  label: string;
  value: string;
  tone: "accepted" | "review" | "blocked" | "neutral";
}

export interface CockpitMonitorQuality {
  label: string;
  detail: string;
  tone: "waiting" | "clean" | "review" | "blocked";
  readinessLabel: string;
  metrics: CockpitMonitorQualityMetric[];
}

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : 0;
}

function safeReadiness(value: number): number {
  const sanitized = sanitizeCount(value);
  return Math.max(0, Math.min(100, sanitized));
}

function buildMetrics(snapshot: RuntimeStreamSnapshot): CockpitMonitorQualityMetric[] {
  const accepted = sanitizeCount(snapshot.accepted);
  const review = sanitizeCount(snapshot.review);
  const blocked = sanitizeCount(snapshot.blocked);

  return [
    { label: "Accepted", value: `${accepted}`, tone: "accepted" },
    { label: "Review", value: `${review}`, tone: "review" },
    { label: "Blocked", value: `${blocked}`, tone: "blocked" }
  ];
}

export function createCockpitMonitorQuality(
  snapshot: RuntimeStreamSnapshot
): CockpitMonitorQuality {
  const emitted = sanitizeCount(snapshot.emitted);
  const review = sanitizeCount(snapshot.review);
  const blocked = sanitizeCount(snapshot.blocked);
  const readinessLabel = `${safeReadiness(snapshot.readiness)}%`;

  const metrics = buildMetrics(snapshot);

  if (emitted <= 0) {
    return {
      label: "No quality signal",
      detail: "Quality appears after local events are emitted.",
      tone: "waiting",
      readinessLabel,
      metrics
    };
  }

  if (snapshot.state === "blocked" || blocked > 0) {
    return {
      label: "Blocked events",
      detail: "Blocked local events need operator review.",
      tone: "blocked",
      readinessLabel,
      metrics
    };
  }

  if (review > 0) {
    return {
      label: "Review needed",
      detail: "Some local events are waiting for review.",
      tone: "review",
      readinessLabel,
      metrics
    };
  }

  return {
    label: "Clean stream",
    detail: "All emitted local events are accepted.",
    tone: "clean",
    readinessLabel,
    metrics
  };
}
