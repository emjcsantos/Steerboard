import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const commandArtifactPath = resolve("local_private", "phase3-command-validation-record.json");
const smokeBundleArtifactPath = resolve("local_private", "phase3-smoke-proof-bundle.json");
const expectedCommand = "npm.cmd run smoke:phase3";
const expectedSource = "steerboard.phase3.smoke-record.v1";
const proofKeys = [
  "liveControlSmoke",
  "activeTurnInterruptSmoke",
  "activeTurnSteerSmoke"
];

function fail(message) {
  console.error(`Phase 3 smoke validation artifact check failed: ${message}`);
  process.exitCode = 1;
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRecord(value, label) {
  if (!isRecord(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value;
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is missing`);
  }
}

function verifyCommandArtifact(record) {
  assertRecord(record, "command validation artifact");

  if (record.source === expectedSource) {
    throw new Error("command validation artifact should not be the smoke bundle envelope");
  }
  if (record.command !== expectedCommand) {
    throw new Error(`command validation command mismatch: ${record.command}`);
  }
  if (record.status !== "passed") {
    throw new Error(`command validation status is ${record.status}`);
  }
  if (record.passedTestCount < 3 || record.failedTestCount !== 0) {
    throw new Error("command validation test counts do not prove the three smoke rows passed");
  }

  const smokeBundle = assertRecord(record.smokeBundle, "command validation smokeBundle");
  if (smokeBundle.source !== expectedSource) {
    throw new Error("command validation smokeBundle source mismatch");
  }
  assertNonEmptyString(smokeBundle.runId, "command validation smokeBundle runId");
  if (smokeBundle.artifactPath !== "local_private/phase3-smoke-proof-bundle.json") {
    throw new Error("command validation smokeBundle artifactPath mismatch");
  }

  const fingerprints = assertRecord(
    smokeBundle.rowFingerprints,
    "command validation smokeBundle rowFingerprints"
  );
  for (const key of proofKeys) {
    assertNonEmptyString(fingerprints[key], `command validation ${key} fingerprint`);
  }
}

function verifySmokeBundleArtifact(envelope) {
  assertRecord(envelope, "smoke proof bundle artifact");

  if (envelope.source !== expectedSource) {
    throw new Error("smoke proof bundle source mismatch");
  }
  if (envelope.command !== expectedCommand) {
    throw new Error(`smoke proof bundle command mismatch: ${envelope.command}`);
  }
  if (envelope.passedTestCount < 3 || envelope.failedTestCount !== 0) {
    throw new Error("smoke proof bundle test counts do not prove the three smoke rows passed");
  }

  const fingerprints = assertRecord(envelope.rowFingerprints, "smoke proof rowFingerprints");
  const bundle = assertRecord(envelope.bundle, "smoke proof bundle");
  let desktopExecutedRows = 0;

  for (const key of proofKeys) {
    assertNonEmptyString(fingerprints[key], `smoke proof ${key} fingerprint`);
    const proof = assertRecord(bundle[key], `smoke proof ${key}`);
    if (proof.source === "desktop" && proof.executed === true) {
      desktopExecutedRows += 1;
    }
  }

  if (desktopExecutedRows !== proofKeys.length) {
    throw new Error(
      `expected ${proofKeys.length} desktop-executed proof rows, found ${desktopExecutedRows}`
    );
  }
}

try {
  const commandArtifact = await readJson(commandArtifactPath);
  const smokeBundleArtifact = await readJson(smokeBundleArtifactPath);

  verifyCommandArtifact(commandArtifact);
  verifySmokeBundleArtifact(smokeBundleArtifact);

  console.log("Phase 3 smoke validation artifacts are ready for Owner Testing load/import.");
  console.log(`Command validation: ${commandArtifactPath}`);
  console.log(`Smoke proof bundle: ${smokeBundleArtifactPath}`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
