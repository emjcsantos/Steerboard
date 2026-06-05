import { describe, expect, it } from "vitest";
import {
  createSourceInstallReadiness,
  type SourceInstallReadinessItemStatus
} from "./sourceInstallReadiness";

const readyManifest = {
  name: "current-manifest",
  scripts: {
    dev: "vite",
    build: "vite build",
    "desktop:dev": "vite --mode desktop",
    check: "npm run lint && npm run test",
    start: "vite preview"
  },
  dependencies: {
    react: "^18.0.0"
  },
  devDependencies: {
    vite: "^5.0.0"
  }
};

describe("source install readiness snapshot", () => {
  it("returns ready for a fully prepared manifest fixture", () => {
    const snapshot = createSourceInstallReadiness(readyManifest);

    expect(snapshot.label).toBe("Source install readiness (current-manifest)");
    expect(snapshot.state).toBe("ready");
    expect(snapshot.statusLabel).toBe("Ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.canRecommendSourceInstall).toBe(true);
    expect(snapshot.detail).toContain("Package manifest has source setup");
    expect(snapshot.safety).toContain(
      "No package manager, filesystem, process, signing, or network action is performed."
    );
    expect(snapshot.items).toHaveLength(5);
    expect(
      snapshot.items.every((item) => item.status === "ready")
    ).toBe(true);
    expect(snapshot.ariaLabel).toContain("Source setup scripts: ready");
    expect(snapshot.ariaLabel).toContain("Install hook safety: ready");
  });

  it("returns blocked when required scripts are missing", () => {
    const snapshot = createSourceInstallReadiness({
      scripts: {
        build: "vite build"
      }
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Blocked");
    expect(snapshot.readiness).toBe(50);
    expect(snapshot.canRecommendSourceInstall).toBe(false);
    expect(snapshot.items[0].status).toBe("blocked");
    expect(snapshot.items[1].status).toBe("blocked");
    expect(snapshot.items[2].status).toBe("ready");
    expect(snapshot.items[4].status).toBe("ready");
  });

  it("uses validation fallback when test and build are present", () => {
    const snapshot = createSourceInstallReadiness({
      scripts: {
        dev: "vite",
        build: "vite build",
        "desktop:dev": "vite --mode desktop",
        test: "vitest run"
      }
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(
      snapshot.items.find((item) => item.id === "source-install-readiness:validation-script")
        ?.status
    ).toBe("ready");
    expect(
      snapshot.items.find((item) => item.id === "source-install-readiness:validation-script")
        ?.detail
    ).toContain("Validation falls back");
  });

  it("returns blocked when unsafe install hooks are present", () => {
    const snapshot = createSourceInstallReadiness({
      scripts: {
        dev: "vite",
        build: "vite build",
        "desktop:dev": "vite --mode desktop",
        check: "npm run lint",
        preinstall: "echo not allowed"
      }
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.readiness).toBe(80);
    expect(snapshot.items[4].status).toBe("blocked");
    expect(snapshot.items[4].detail).toContain("Unsafe install-time hooks");
  });

  it("returns review when validation script is missing but build+test fallback is absent", () => {
    const snapshot = createSourceInstallReadiness({
      scripts: {
        dev: "vite",
        build: "vite build",
        "desktop:dev": "vite --mode desktop"
      }
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.statusLabel).toBe("Needs review");
    expect(snapshot.readiness).toBe(90);
    expect(snapshot.canRecommendSourceInstall).toBe(false);
    expect(snapshot.items[3].status).toBe("review");
  });

  it("returns blocked when desktop startup script is missing even if others are present", () => {
    const snapshot = createSourceInstallReadiness({
      scripts: {
        dev: "vite",
        build: "vite build",
        check: "npm run lint"
      }
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.readiness).toBe(80);
    expect(snapshot.items[1].status).toBe("blocked");
    expect(snapshot.items[1].detail).toContain("Missing desktop:dev");
  });

  it("keeps manifest input immutable", () => {
    const manifest = {
      scripts: {
        dev: "vite",
        build: "vite build",
        "desktop:dev": "vite --mode desktop",
        check: "npm run lint"
      }
    };
    const original = JSON.parse(JSON.stringify(manifest));

    createSourceInstallReadiness(manifest);

    expect(manifest).toEqual(original);
  });

  it("preserves the exact item order", () => {
    const snapshot = createSourceInstallReadiness(readyManifest);

    expect(snapshot.items.map((item) => item.label)).toEqual([
      "Source setup scripts",
      "Desktop startup script",
      "Production build script",
      "Validation script",
      "Install hook safety"
    ]);
  });

  it("includes item statuses in ariaLabel", () => {
    const snapshot = createSourceInstallReadiness({
      scripts: {
        dev: "vite",
        build: "vite build",
        "desktop:dev": "vite --mode desktop",
        check: "npm run lint",
        preinstall: "echo nope"
      }
    });

    for (const item of snapshot.items) {
      expect(snapshot.ariaLabel).toContain(`${item.label}: ${item.status}`);
    }
  });

  it("handles non-manifest fields as optional", () => {
    const ready: SourceInstallReadinessItemStatus = "ready";

    const snapshot = createSourceInstallReadiness({
      name: "optional-only",
      scripts: {
        dev: "vite",
        build: "vite build",
        "desktop:dev": "vite --mode desktop",
        check: "npm run lint"
      },
      private: true,
      dependencies: {},
      devDependencies: {}
    });

    expect(snapshot.label).toBe("Source install readiness (optional-only)");
    expect(snapshot.state).toBe("ready");
    expect(snapshot.items[0].status).toBe(ready);
    expect(snapshot.items[1].status).toBe(ready);
    expect(snapshot.items[2].status).toBe(ready);
    expect(snapshot.items[3].status).toBe(ready);
    expect(snapshot.items[4].status).toBe(ready);
  });
});
