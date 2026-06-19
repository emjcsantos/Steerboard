import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const command = "npm.cmd run smoke:phase3";
const smokeBundleSource = "steerboard.phase3.smoke-record.v1";
const artifactPath = resolve("local_private", "phase3-command-validation-record.json");
const smokeBundleArtifactPath = resolve("local_private", "phase3-smoke-proof-bundle.json");
const proofKeys = [
  "liveControlSmoke",
  "activeTurnInterruptSmoke",
  "activeTurnSteerSmoke"
];
const cargoBin = process.platform === "win32" ? "cargo.exe" : "cargo";
const cargoArgs = [
  "test",
  "phase3_live_desktop_smoke",
  "--manifest-path",
  "src-tauri/Cargo.toml",
  "--",
  "--ignored",
  "--test-threads=1"
];

function runCargoSmoke() {
  return new Promise((resolveRun) => {
    const child = spawn(cargoBin, cargoArgs, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        STEERBOARD_PHASE3_SMOKE_PROOF_BUNDLE_PATH: smokeBundleArtifactPath
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on("close", (code) => {
      resolveRun({ code: code ?? 1, stdout, stderr });
    });
  });
}

function parseCounts(output) {
  const matches = [...output.matchAll(/test result:\s+\w+\.\s+(\d+)\s+passed;\s+(\d+)\s+failed/g)];

  return matches.reduce(
    (counts, match) => ({
      passed: counts.passed + Number(match[1]),
      failed: counts.failed + Number(match[2])
    }),
    { passed: 0, failed: 0 }
  );
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function shortHash(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function proofWithoutStorageProof(value) {
  if (!isRecord(value)) {
    return value;
  }

  const copy = { ...value };
  delete copy.phase3StorageProof;
  return copy;
}

function proofFingerprint(value) {
  return `phase3-smoke-proof-${shortHash(stableJson(proofWithoutStorageProof(value)))}`;
}

function desktopExecutedRow(value) {
  return isRecord(value) && value.source === "desktop" && value.executed === true;
}

function desktopReadyRow(value) {
  return (
    desktopExecutedRow(value) &&
    value.ok === true &&
    value.failed !== true &&
    value.unsupported !== true
  );
}

async function createSmokeBundleEnvelope(createdAt, counts) {
  const parsed = JSON.parse(await readFile(smokeBundleArtifactPath, "utf8"));
  if (!isRecord(parsed)) {
    throw new Error("Phase 3 smoke proof bundle is not an object.");
  }

  const bundle = isRecord(parsed.bundle) ? parsed.bundle : parsed;
  const proofs = {
    liveControlSmoke: bundle.liveControlSmoke,
    activeTurnInterruptSmoke: bundle.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: bundle.activeTurnSteerSmoke
  };
  const desktopExecutedRows = Object.values(proofs).filter(desktopExecutedRow).length;
  const desktopReadyRows = Object.values(proofs).filter(desktopReadyRow).length;

  if (desktopExecutedRows === 0) {
    throw new Error("Phase 3 smoke proof bundle has no desktop-executed proof rows.");
  }
  if (desktopReadyRows !== proofKeys.length) {
    throw new Error(
      `expected ${proofKeys.length} ready desktop proof rows, found ${desktopReadyRows}`
    );
  }

  return {
    source: smokeBundleSource,
    command,
    createdAt,
    runId: `phase3-smoke-record:${createdAt}`,
    passedTestCount: counts.passed,
    failedTestCount: counts.failed,
    rowFingerprints: {
      liveControlSmoke: proofFingerprint(proofs.liveControlSmoke),
      activeTurnInterruptSmoke: proofFingerprint(proofs.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: proofFingerprint(proofs.activeTurnSteerSmoke)
    },
    bundle: proofs
  };
}

function createRecord(result, createdAt, counts, smokeBundleEnvelope, smokeBundleError) {
  const status =
    result.code === 0 &&
    counts.failed === 0 &&
    counts.passed >= 3 &&
    Boolean(smokeBundleEnvelope)
      ? "passed"
      : "failed";

  return {
    id: `phase3-command-validation:${createdAt}`,
    createdAt,
    command,
    status,
    passedTestCount: counts.passed,
    failedTestCount: counts.failed,
    smokeBundle: smokeBundleEnvelope
      ? {
          source: smokeBundleEnvelope.source,
          runId: smokeBundleEnvelope.runId,
          artifactPath: "local_private/phase3-smoke-proof-bundle.json",
          rowFingerprints: smokeBundleEnvelope.rowFingerprints
        }
      : {
          source: smokeBundleSource,
          artifactPath: "local_private/phase3-smoke-proof-bundle.json",
          error: smokeBundleError?.message ?? "Phase 3 smoke proof bundle was not verified."
        },
    detail:
      status === "passed"
        ? "Phase 3 CLI smoke validation passed locally via npm.cmd run smoke:phase3; desktop UI proof rows still require persisted desktop evidence."
        : `Phase 3 CLI smoke validation failed locally; ${
            smokeBundleError
              ? "the desktop smoke proof bundle could not be provenance-wrapped."
              : "rerun after resolving the smoke command output."
          }`
  };
}

await mkdir(dirname(artifactPath), { recursive: true });
await unlink(smokeBundleArtifactPath).catch(() => undefined);

const result = await runCargoSmoke();
const createdAt = new Date().toISOString();
const counts = parseCounts(`${result.stdout}\n${result.stderr}`);
let smokeBundleEnvelope;
let smokeBundleError;

try {
  smokeBundleEnvelope = await createSmokeBundleEnvelope(createdAt, counts);
  await writeFile(smokeBundleArtifactPath, `${JSON.stringify(smokeBundleEnvelope, null, 2)}\n`, "utf8");
} catch (error) {
  smokeBundleError = error instanceof Error ? error : new Error(String(error));
  await unlink(smokeBundleArtifactPath).catch(() => undefined);
}

const record = createRecord(result, createdAt, counts, smokeBundleEnvelope, smokeBundleError);

await writeFile(artifactPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

console.log(`\nPhase 3 CLI smoke validation artifact written to ${artifactPath}`);
if (smokeBundleEnvelope) {
  console.log(`Phase 3 desktop smoke proof bundle artifact written to ${smokeBundleArtifactPath}`);
} else {
  console.log(
    `Phase 3 desktop smoke proof bundle artifact was not written: ${
      smokeBundleError?.message ?? "smoke proof bundle was not ready"
    }`
  );
}

process.exitCode = result.code === 0 && record.status === "passed" ? 0 : 1;
