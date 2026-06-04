import { describe, expect, it } from "vitest";
import {
  getFallbackDesktopRuntimeBridgeStatus,
  loadDesktopRuntimeBridgeStatus
} from "./desktopRuntimeBridge";

describe("desktop runtime bridge status", () => {
  it("returns safe browser fallback without invoking desktop APIs", async () => {
    await expect(loadDesktopRuntimeBridgeStatus()).resolves.toEqual({
      id: "desktop-runtime-bridge",
      label: "Desktop runtime bridge",
      state: "unavailable",
      processExecutionAvailable: false,
      workspaceAccessAvailable: false,
      detail: "Desktop bridge is unavailable in browser preview.",
      safety: "No process execution, filesystem access, or network action was performed.",
      source: "browser"
    });
  });

  it("normalizes injected desktop bridge status", async () => {
    await expect(
      loadDesktopRuntimeBridgeStatus(async () => ({
        id: "desktop-runtime-bridge",
        label: "Desktop runtime bridge",
        state: "locked",
        processExecutionAvailable: false,
        workspaceAccessAvailable: false,
        detail: "Desktop bridge is reachable; runtime execution is not enabled.",
        safety: "No process execution, filesystem access, or network action was performed."
      }))
    ).resolves.toEqual({
      id: "desktop-runtime-bridge",
      label: "Desktop runtime bridge",
      state: "locked",
      processExecutionAvailable: false,
      workspaceAccessAvailable: false,
      detail: "Desktop bridge is reachable; runtime execution is not enabled.",
      safety: "No process execution, filesystem access, or network action was performed.",
      source: "desktop"
    });
  });

  it("repairs malformed desktop bridge status into safe defaults", async () => {
    await expect(
      loadDesktopRuntimeBridgeStatus(async () => ({
        id: "",
        state: "unknown",
        processExecutionAvailable: true,
        workspaceAccessAvailable: true
      }))
    ).resolves.toMatchObject({
      id: "desktop-runtime-bridge",
      label: "Desktop runtime bridge",
      state: "unavailable",
      processExecutionAvailable: false,
      workspaceAccessAvailable: false,
      source: "desktop"
    });
  });

  it("preserves explicit readiness only when the desktop bridge reports ready", async () => {
    await expect(
      loadDesktopRuntimeBridgeStatus(async () => ({
        state: "ready",
        processExecutionAvailable: true,
        workspaceAccessAvailable: true,
        detail: "Desktop bridge is ready.",
        safety: "Approved bridge status only."
      }))
    ).resolves.toMatchObject({
      state: "ready",
      processExecutionAvailable: true,
      workspaceAccessAvailable: true,
      source: "desktop"
    });
  });

  it("returns error status when desktop status load fails", async () => {
    await expect(
      loadDesktopRuntimeBridgeStatus(async () => {
        throw new Error("bridge unavailable");
      })
    ).resolves.toMatchObject({
      state: "error",
      processExecutionAvailable: false,
      workspaceAccessAvailable: false,
      detail: "Desktop bridge status could not be loaded.",
      source: "desktop"
    });
  });

  it("returns a defensive fallback copy", () => {
    const first = getFallbackDesktopRuntimeBridgeStatus();
    const second = getFallbackDesktopRuntimeBridgeStatus();

    first.detail = "Changed";

    expect(second.detail).toBe("Desktop bridge is unavailable in browser preview.");
  });
});
