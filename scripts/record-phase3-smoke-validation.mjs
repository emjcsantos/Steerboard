import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const command = "npm.cmd run smoke:phase3";
const artifactPath = resolve("local_private", "phase3-command-validation-record.json");
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

function createRecord(result) {
  const createdAt = new Date().toISOString();
  const counts = parseCounts(`${result.stdout}\n${result.stderr}`);
  const status = result.code === 0 && counts.failed === 0 && counts.passed >= 3 ? "passed" : "failed";

  return {
    id: `phase3-command-validation:${createdAt}`,
    createdAt,
    command,
    status,
    passedTestCount: counts.passed,
    failedTestCount: counts.failed,
    detail:
      status === "passed"
        ? "Phase 3 CLI smoke validation passed locally via npm.cmd run smoke:phase3; desktop UI proof rows still require persisted desktop evidence."
        : "Phase 3 CLI smoke validation failed locally; rerun after resolving the smoke command output."
  };
}

const result = await runCargoSmoke();
const record = createRecord(result);

await mkdir(dirname(artifactPath), { recursive: true });
await writeFile(artifactPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

console.log(`\nPhase 3 CLI smoke validation artifact written to ${artifactPath}`);

process.exitCode = result.code;
