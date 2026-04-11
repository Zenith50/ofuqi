import { getCopy, type AppLocale } from "@/lib/app/content";
import { cloneCvData, type WorkspaceInstructionResult } from "@/lib/cv/workspace";
import { getDemoCv, type CvData } from "@/lib/cv/demoData";
import type { DemoCvProject } from "@/lib/cv/projects";

type WorkspaceSeedMessageKey = "welcome" | "userExample" | "followUp";

export type WorkspaceMessage = {
  role: "assistant" | "user";
  body: string;
  language: AppLocale;
  seedKey?: WorkspaceSeedMessageKey;
};

export type WorkspaceSessionState = {
  draftData: CvData;
  messages: WorkspaceMessage[];
  historyItems: string[];
  latestAction: string;
};

export function createInitialMessages(locale: AppLocale): WorkspaceMessage[] {
  const copy = getCopy(locale);

  return [
    {
      role: "assistant",
      body: copy.chat.mockConversation.welcome,
      language: locale,
    }
  ];
}

export function createInitialWorkspaceSession(locale: AppLocale): WorkspaceSessionState {
  return createWorkspaceSessionFromData(cloneCvData(getDemoCv(locale)));
}

export function createWorkspaceSessionFromData(data: CvData): WorkspaceSessionState {
  const locale = data.language;
  const copy = getCopy(locale);

  return {
    draftData: cloneCvData(data),
    messages: createInitialMessages(locale),
    historyItems: [],
    latestAction: copy.chat.status.noAction,
  };
}

export function createWorkspaceSessionFromProject(project: DemoCvProject): WorkspaceSessionState {
  const data = project.variant;
  const locale = data.language;
  const conv = project.conversation;

  return {
    draftData: cloneCvData(data),
    messages: conv.messages.length > 0 ? conv.messages : createInitialMessages(locale),
    historyItems: conv.historyItems || [],
    latestAction: conv.historyItems?.[0] || getCopy(locale).chat.status.noAction,
  };
}

export function appendInstructionToSession(
  session: WorkspaceSessionState,
  locale: AppLocale,
  instruction: string,
  result: WorkspaceInstructionResult,
): WorkspaceSessionState {
  return {
    draftData: result.nextData,
    messages: [
      ...session.messages,
      {
        role: "user",
        body: instruction,
        language: locale,
      },
      {
        role: "assistant",
        body: result.assistantReply,
        language: locale,
      },
    ],
    historyItems: [instruction, ...session.historyItems].slice(0, 8),
    latestAction: instruction,
  };
}
