export type OrchestratorExecutionMode = "manual" | "continuous";

export interface OrchestratorExecutionPolicy {
  mode: OrchestratorExecutionMode;
  readinessApproved: boolean;
  permissionApproved: boolean;
}

export interface OrchestratorRunCycleLease {
  acquired: boolean;
  canExecuteRuntimeCommand: boolean;
  reason: "ready" | "already-running" | "continuous-gate-closed";
  release: () => void;
}

export interface OrchestratorRunCycleInput<TCommand, TEvents> {
  key: string;
  policy?: OrchestratorExecutionPolicy;
  executeNextCommand: () => Promise<TCommand>;
  processEvents: () => Promise<TEvents>;
}

export interface OrchestratorRunCycleResult<TCommand, TEvents> {
  status: "completed" | "already-running";
  commandResult?: TCommand;
  eventResult?: TEvents;
  runtimeCommandGated: boolean;
}

export const DEFAULT_ORCHESTRATOR_EXECUTION_POLICY: OrchestratorExecutionPolicy = {
  mode: "manual",
  readinessApproved: false,
  permissionApproved: false
};

export class OrchestratorRunController {
  private readonly activeKeys = new Set<string>();

  claim(
    key: string,
    policy: OrchestratorExecutionPolicy = DEFAULT_ORCHESTRATOR_EXECUTION_POLICY
  ): OrchestratorRunCycleLease {
    if (this.activeKeys.has(key)) {
      return {
        acquired: false,
        canExecuteRuntimeCommand: false,
        reason: "already-running",
        release: () => undefined
      };
    }
    this.activeKeys.add(key);
    const continuousGateClosed =
      policy.mode === "continuous" && (!policy.readinessApproved || !policy.permissionApproved);
    let released = false;
    return {
      acquired: true,
      canExecuteRuntimeCommand: !continuousGateClosed,
      reason: continuousGateClosed ? "continuous-gate-closed" : "ready",
      release: () => {
        if (released) return;
        released = true;
        this.activeKeys.delete(key);
      }
    };
  }

  async runCycle<TCommand, TEvents>(
    input: OrchestratorRunCycleInput<TCommand, TEvents>
  ): Promise<OrchestratorRunCycleResult<TCommand, TEvents>> {
    const lease = this.claim(input.key, input.policy);
    if (!lease.acquired) {
      return {
        status: "already-running",
        runtimeCommandGated: true
      };
    }
    try {
      const commandResult = lease.canExecuteRuntimeCommand
        ? await input.executeNextCommand()
        : undefined;
      const eventResult = await input.processEvents();
      return {
        status: "completed",
        commandResult,
        eventResult,
        runtimeCommandGated: !lease.canExecuteRuntimeCommand
      };
    } finally {
      lease.release();
    }
  }
}

export const orchestratorRunController = new OrchestratorRunController();
