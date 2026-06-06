import {
  createProjectManagementChatReply,
  repairProjectManagementTasks,
  type ProjectManagementChatMessage,
  type ProjectManagementTask
} from "./projectManagementHierarchy";

export const PROJECT_MANAGEMENT_TASKS_STORAGE_KEY = "steerboard.projectManagement.tasks";
export const PROJECT_MANAGEMENT_CHAT_STORAGE_KEY = "steerboard.projectManagement.chat";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/(?:[A-Za-z]:)?[\\/][^\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeChatMessage(value: unknown, index: number): ProjectManagementChatMessage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const role = value.role === "user" || value.role === "assistant" ? value.role : undefined;

  if (!role) {
    return undefined;
  }

  return {
    id: normalizeText(value.id, `pm-chat-${index + 1}`),
    role,
    text: normalizeText(value.text, createProjectManagementChatReply("")),
    createdAt: normalizeText(value.createdAt, new Date(0).toISOString())
  };
}

export function parseStoredProjectManagementTasks(serialized: string | null): ProjectManagementTask[] {
  if (!serialized) {
    return repairProjectManagementTasks(undefined);
  }

  try {
    return repairProjectManagementTasks(JSON.parse(serialized));
  } catch {
    return repairProjectManagementTasks(undefined);
  }
}

export function parseStoredProjectManagementChat(serialized: string | null): ProjectManagementChatMessage[] {
  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((message, index) => normalizeChatMessage(message, index))
      .filter((message): message is ProjectManagementChatMessage => Boolean(message))
      .slice(-40);
  } catch {
    return [];
  }
}

export function loadProjectManagementTasks(): ProjectManagementTask[] {
  if (typeof window === "undefined") {
    return repairProjectManagementTasks(undefined);
  }

  return parseStoredProjectManagementTasks(
    window.localStorage.getItem(PROJECT_MANAGEMENT_TASKS_STORAGE_KEY)
  );
}

export function saveProjectManagementTasks(tasks: readonly ProjectManagementTask[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROJECT_MANAGEMENT_TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

export function loadProjectManagementChat(): ProjectManagementChatMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredProjectManagementChat(
    window.localStorage.getItem(PROJECT_MANAGEMENT_CHAT_STORAGE_KEY)
  );
}

export function saveProjectManagementChat(messages: readonly ProjectManagementChatMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROJECT_MANAGEMENT_CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
}
