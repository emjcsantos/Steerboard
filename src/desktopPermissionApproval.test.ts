import { describe, expect, it } from "vitest";
import {
  getFallbackDesktopPermissionApprovalStatus,
  loadDesktopPermissionApprovalStatus
} from "./desktopPermissionApproval";

describe("desktop permission approval status", () => {
  it("returns safe browser fallback without invoking desktop APIs", async () => {
    await expect(loadDesktopPermissionApprovalStatus()).resolves.toEqual({
      id: "desktop-permission-approval",
      label: "Desktop permission approval",
      state: "unavailable",
      approvalCommandAvailable: false,
      permissionGranted: false,
      detail: "Desktop permission approval is unavailable in browser preview.",
      safety: "No process execution, filesystem access, or network action was performed.",
      source: "browser"
    });
  });

  it("normalizes injected locked desktop approval status", async () => {
    await expect(
      loadDesktopPermissionApprovalStatus(async () => ({
        id: "desktop-permission-approval",
        label: "Desktop permission approval",
        state: "locked",
        approvalCommandAvailable: false,
        permissionGranted: false,
        detail: "Desktop permission approval is reachable but locked.",
        safety: "No process execution, filesystem access, or network action was performed."
      }))
    ).resolves.toEqual({
      id: "desktop-permission-approval",
      label: "Desktop permission approval",
      state: "locked",
      approvalCommandAvailable: false,
      permissionGranted: false,
      detail: "Desktop permission approval is reachable but locked.",
      safety: "No process execution, filesystem access, or network action was performed.",
      source: "desktop"
    });
  });

  it("repairs malformed approval status into safe defaults", async () => {
    await expect(
      loadDesktopPermissionApprovalStatus(async () => ({
        id: "",
        label: "",
        state: "unknown",
        approvalCommandAvailable: true,
        permissionGranted: true
      }))
    ).resolves.toMatchObject({
      id: "desktop-permission-approval",
      label: "Desktop permission approval",
      state: "unavailable",
      approvalCommandAvailable: false,
      permissionGranted: false,
      source: "desktop"
    });
  });

  it("preserves ready only when approval command and permission grant are ready", async () => {
    await expect(
      loadDesktopPermissionApprovalStatus(async () => ({
        state: "ready",
        approvalCommandAvailable: true,
        permissionGranted: true,
        detail: "Desktop permission approval is ready.",
        safety: "Approved status only."
      }))
    ).resolves.toMatchObject({
      state: "ready",
      approvalCommandAvailable: true,
      permissionGranted: true,
      source: "desktop"
    });
  });

  it("does not grant permission when approval command is ready but grant is false", async () => {
    await expect(
      loadDesktopPermissionApprovalStatus(async () => ({
        state: "ready",
        approvalCommandAvailable: true,
        permissionGranted: false,
        detail: "Desktop permission approval can be requested.",
        safety: "Status only."
      }))
    ).resolves.toMatchObject({
      state: "ready",
      approvalCommandAvailable: true,
      permissionGranted: false,
      source: "desktop"
    });
  });

  it("returns error status when desktop status load fails", async () => {
    await expect(
      loadDesktopPermissionApprovalStatus(async () => {
        throw new Error("approval unavailable");
      })
    ).resolves.toMatchObject({
      state: "error",
      approvalCommandAvailable: false,
      permissionGranted: false,
      detail: "Desktop permission approval status could not be loaded.",
      source: "desktop"
    });
  });

  it("returns a defensive fallback copy", () => {
    const first = getFallbackDesktopPermissionApprovalStatus();
    const second = getFallbackDesktopPermissionApprovalStatus();

    first.detail = "Changed";

    expect(second.detail).toBe("Desktop permission approval is unavailable in browser preview.");
  });
});
