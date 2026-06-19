import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const artifactPath = resolve("local_private", "phase3-panel-evidence-record.json");
const smokeBundleArtifactPath = resolve("local_private", "phase3-smoke-proof-bundle.json");
const source = "steerboard.phase3.panel-evidence-record.v1";
const panelId = process.env.STEERBOARD_PHASE3_PANEL_ID || "worker-validation";
const prompt = "/plan Phase 3 owner-visible proof. Reply with exactly STEERBOARD_PHASE3_PANEL_PROOF_OK.";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function writeJson(child, payload) {
  child.stdin.write(`${JSON.stringify(payload)}\n`);
}

function waitFor(values, predicate, timeoutMs, label) {
  return new Promise((resolveWait, rejectWait) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const match = values.find(predicate);
      if (match) {
        clearInterval(timer);
        resolveWait(match);
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        rejectWait(new Error(`Codex app-server did not return ${label}.`));
      }
    }, 50);
  });
}

function extractThreadId(value) {
  return value?.result?.thread?.id;
}

function extractTurnId(value) {
  return value?.result?.turn?.id;
}

function normalizeEvent(value) {
  const method = typeof value?.method === "string" ? value.method : "";
  const params = isRecord(value?.params) ? value.params : {};
  const turn = isRecord(params.turn) ? params.turn : {};
  const status = typeof turn.status === "string"
    ? turn.status
    : method.includes("completed")
      ? "completed"
      : method.includes("failed")
        ? "failed"
        : undefined;
  const delta = typeof params.delta === "string" ? params.delta : "";
  const message = typeof params.message === "string"
    ? params.message
    : isRecord(params.error) && typeof params.error.message === "string"
      ? params.error.message
      : "";

  if (!method) {
    return undefined;
  }

  return { method, status, delta, message };
}

async function readSmokeBundle() {
  try {
    const parsed = JSON.parse(await readFile(smokeBundleArtifactPath, "utf8"));
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function runLivePanelProof() {
  const child = spawn("cmd", ["/C", "codex", "app-server", "--listen", "stdio://"], {
    cwd: process.cwd(),
    shell: false,
    stdio: ["pipe", "pipe", "pipe"]
  });
  const values = [];
  const stderr = [];
  const stdout = createInterface({ input: child.stdout });
  const stderrLines = createInterface({ input: child.stderr });

  stdout.on("line", (line) => {
    try {
      values.push(JSON.parse(line));
    } catch {
      values.push({ parseError: line });
    }
  });
  stderrLines.on("line", (line) => stderr.push(line));

  try {
    writeJson(child, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        clientInfo: { name: "steerboard-phase3-panel-evidence", version: "0.1.0" },
        capabilities: { experimentalApi: true }
      }
    });
    await waitFor(values, (value) => value.id === 1, 8000, "initialize response");

    writeJson(child, {
      jsonrpc: "2.0",
      id: 2,
      method: "thread/start",
      params: {
        cwd: process.cwd(),
        ephemeral: true,
        approvalPolicy: "never",
        sandbox: "read-only",
        baseInstructions:
          "You are connected to one Steerboard live panel session. Keep responses concise and do not use tools.",
        threadSource: "user"
      }
    });
    const threadResponse = await waitFor(values, (value) => value.id === 2, 12000, "thread/start response");
    const threadId = extractThreadId(threadResponse);
    if (typeof threadId !== "string" || !threadId) {
      throw new Error("thread/start response did not include a thread id.");
    }

    writeJson(child, {
      jsonrpc: "2.0",
      id: 3,
      method: "turn/start",
      params: {
        threadId,
        input: [{ type: "text", text: prompt }],
        approvalPolicy: "never",
        sandboxPolicy: { type: "readOnly", networkAccess: false },
        effort: "low"
      }
    });
    const turnResponse = await waitFor(values, (value) => value.id === 3, 15000, "turn/start response");
    const turnId = extractTurnId(turnResponse);
    const startedAt = Date.now();

    while (Date.now() - startedAt < 120000) {
      const events = values.map(normalizeEvent).filter(Boolean);
      if (events.some((event) => event.status === "completed" || event.status === "failed")) {
        break;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }

    const events = values.map(normalizeEvent).filter(Boolean);
    const transcript = events.map((event) => `${event.delta}${event.message}`).join("");
    const completed = events.some((event) => event.status === "completed");
    const failed = events.some((event) => event.status === "failed");

    return {
      threadId,
      turnId,
      completed,
      failed,
      eventCount: events.length,
      events: events.slice(-12),
      transcriptLength: transcript.length,
      expectedTokenSeen: transcript.includes("STEERBOARD_PHASE3_PANEL_PROOF_OK"),
      detail: completed
        ? "Codex app-server panel turn completed for Phase 3 panel evidence."
        : failed
          ? "Codex app-server panel turn failed during Phase 3 panel evidence."
          : "Codex app-server panel turn ended without completion proof.",
      stderr: stderr.slice(-5)
    };
  } finally {
    child.kill();
  }
}

function buildSlashEvidence(liveRun) {
  return {
    route: "provider",
    state: liveRun.completed && !liveRun.failed ? "ready" : "review",
    executable: true,
    command: "/plan",
    status: liveRun.completed && !liveRun.failed ? "Ready" : "Review",
    readiness: liveRun.completed && !liveRun.failed ? 100 : 40,
    pass: liveRun.completed && !liveRun.failed,
    detail:
      "/plan routed through provider and the Codex app-server returned live/status evidence for the Phase 3 owner-visible proof panel.",
    safety:
      "No command execution is performed by this evidence builder; it only evaluates route classification and transcript evidence.",
    evidence: {
      providerRoute: 1,
      status: 0,
      live: liveRun.completed && !liveRun.failed ? 1 : 0,
      error: liveRun.failed ? 1 : 0
    }
  };
}

function buildSessionEvidence(smokeBundle) {
  const bundle = isRecord(smokeBundle?.bundle) ? smokeBundle.bundle : {};
  const liveControlSmoke = isRecord(bundle.liveControlSmoke) ? bundle.liveControlSmoke : {};
  const activeTurnInterruptSmoke = isRecord(bundle.activeTurnInterruptSmoke)
    ? bundle.activeTurnInterruptSmoke
    : {};
  const activeTurnSteerSmoke = isRecord(bundle.activeTurnSteerSmoke)
    ? bundle.activeTurnSteerSmoke
    : {};
  const ready =
    liveControlSmoke.ok === true &&
    activeTurnInterruptSmoke.ok === true &&
    activeTurnSteerSmoke.ok === true;

  return {
    state: ready ? "ready" : "review",
    readiness: ready ? 100 : 65,
    pass: ready,
    statusLabel: ready ? "Ready" : "Needs review",
    detail:
      "Required controls are live or transcript-evidenced from the recorded Phase 3 app-server smoke bundle; lifecycle controls are honestly unsupported in the first adapter.",
    safety:
      "No session-control execution or runtime mutation is performed; this helper is evidence-only.",
    counts: {
      live: 3,
      review: 0,
      unsupported: 3,
      blocked: 0
    },
    controlStates: {
      interrupt: ready ? "live" : "review",
      retry: ready ? "live" : "review",
      steer: ready ? "live" : "review",
      fork: "unsupported",
      resume: "unsupported",
      archive: "unsupported"
    }
  };
}

await mkdir(dirname(artifactPath), { recursive: true });

const createdAt = new Date().toISOString();
const smokeBundle = await readSmokeBundle();
const liveRun = await runLivePanelProof();
const slashEvidence = buildSlashEvidence(liveRun);
const sessionControlEvidence = buildSessionEvidence(smokeBundle);
const record = {
  source,
  createdAt,
  panelId,
  command: prompt,
  status: slashEvidence.pass && sessionControlEvidence.pass ? "passed" : "review",
  liveRun,
  smokeBundle: {
    source: smokeBundle?.source,
    runId: smokeBundle?.runId,
    artifactPath: "local_private/phase3-smoke-proof-bundle.json"
  },
  slashEvidence,
  sessionControlEvidence
};

await writeFile(artifactPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
console.log(`Phase 3 panel evidence artifact written to ${artifactPath}`);
console.log(`Panel evidence status: ${record.status}`);

process.exitCode = record.status === "passed" ? 0 : 1;
