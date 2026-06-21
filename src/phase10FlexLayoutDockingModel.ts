import type { IJsonModel, IJsonTabSetNode } from "flexlayout-react";
import type { SessionSummary } from "./fixtures";

export const phase10FlexLayoutPackageName = "flexlayout-react";
export const phase10FlexLayoutRepositoryName = "caplin/FlexLayout";
export const phase10FlexLayoutExpectedLicense = "MIT";

const MAX_DOCKED_TABSETS = 4;

function buildDockedTabset(session: SessionSummary, index: number, weight: number): IJsonTabSetNode {
  return {
    id: `phase10-dock-tabset-${index + 1}`,
    type: "tabset",
    weight,
    children: [
      {
        id: `phase10-dock-tab-${session.id}`,
        type: "tab",
        name: session.title,
        component: "arena-session",
        enableClose: false,
        enableDrag: true,
        helpText: `${session.role} / ${session.state}`,
        config: {
          sessionId: session.id,
          projectId: session.projectId,
          branch: session.branch
        }
      }
    ]
  };
}

export function buildPhase10FlexLayoutDockingModel(
  sessions: readonly SessionSummary[]
): IJsonModel {
  const dockedSessions = sessions.slice(0, MAX_DOCKED_TABSETS);
  const weight = dockedSessions.length > 0 ? Math.round(100 / dockedSessions.length) : 100;

  return {
    global: {
      rootOrientationVertical: false,
      tabEnableClose: false,
      tabEnableDrag: true,
      tabEnablePopout: false,
      tabEnableRenderOnDemand: false,
      tabSetEnableDrop: true,
      tabSetEnableMaximize: true,
      tabSetMinHeight: 190,
      tabSetMinWidth: 260
    },
    borders: [],
    layout: {
      id: "phase10-flexlayout-arena-root",
      type: "row",
      weight: 100,
      children:
        dockedSessions.length > 0
          ? dockedSessions.map((session, index) => buildDockedTabset(session, index, weight))
          : [
              {
                id: "phase10-dock-tabset-empty",
                type: "tabset",
                weight: 100,
                children: [
                  {
                    id: "phase10-dock-tab-empty",
                    type: "tab",
                    name: "No Arena panels",
                    component: "empty",
                    enableClose: false,
                    enableDrag: false
                  }
                ]
              }
            ]
    }
  };
}

export function summarizePhase10FlexLayoutDockingModel(model: IJsonModel): string {
  const tabsetCount = model.layout.children?.length ?? 0;
  const tabCount =
    model.layout.children?.reduce((total, child) => {
      if ("children" in child && Array.isArray(child.children)) {
        return total + child.children.length;
      }

      return total;
    }, 0) ?? 0;

  return (
    `FlexLayout docking model: package=${phase10FlexLayoutPackageName} ` +
    `repository=${phase10FlexLayoutRepositoryName} license=${phase10FlexLayoutExpectedLicense} ` +
    `tabsets=${tabsetCount} tabs=${tabCount} fallback=custom-adaptive-grid-preserved`
  );
}
