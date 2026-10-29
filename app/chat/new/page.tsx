"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Download, Globe2, Languages, LayoutTemplate, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import CvPreview from "@/components/cv/CvPreview";
import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
import TextShimmer from "@/components/ui/TextShimmer";
import { buildExportJobs, type ExportFormatChoice, type ExportLanguageChoice } from "@/lib/cv/export";
import { useCharacterLimit } from "@/lib/hooks/useCharacterLimit";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy, type AppLocale } from "@/lib/app/content";
import { downloadCv } from "@/lib/cv/downloadClient";
import { getGeneratorLocale, type CvData } from "@/lib/cv/demoData";
import {
  appendInstructionToSession,
  createWorkspaceSessionFromProject,
  type WorkspaceSessionState,
} from "@/lib/cv/studioData";
import {
  buildWorkspaceHref,
  createStarterCvProject,
  convexRowToProject,
  getProjectVariant,
  resolveLegacyDraftRoute,
  resolveProjectLanguage,
  resolveCvProjectTemplateKey,
  type DemoCvProject,
} from "@/lib/cv/projects";
import { applyWorkspaceInstruction, deepMerge } from "@/lib/cv/workspace";

function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<number | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

type FencedJsonBlock = {
  json: string;
  start: number;
  end: number;
};

function autosaveFailureNotice(locale: AppLocale): string {
  return locale === "ar"
    ? "تعذر حفظ المسودة. حاول مرة أخرى."
    : "Could not save this draft. Please try again.";
}

function createProjectFailureNotice(locale: AppLocale): string {
  return locale === "ar"
    ? "تعذر إنشاء المسودة. ستعود إلى لوحة التحكم."
    : "Could not create this draft. Returning to the dashboard.";
}

function summarizeWorkspaceAction(assistantText: string, instruction: string): string {
  const summary = assistantText.replace(/\s+/g, " ").trim();
  return summary || instruction.trim();
}

function isCvUpdatePayload(
  value: unknown,
): value is { _ofuqi_action: "update"; data: Record<string, unknown> } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as { _ofuqi_action?: unknown; data?: unknown };
  return (
    record._ofuqi_action === "update" &&
    !!record.data &&
    typeof record.data === "object" &&
    !Array.isArray(record.data)
  );
}

/** Brace-balanced object scan so nested CV patches are not cut at the first `}`. */
function extractBalancedJsonObject(source: string, fromIndex: number): { json: string; end: number } | null {
  const start = source.indexOf("{", fromIndex);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "\"") inString = false;
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return { json: source.slice(start, index + 1), end: index + 1 };
      }
    }
  }

  return null;
}

function extractLastFencedJsonObject(source: string): FencedJsonBlock | null {
  const opener = /```(?:json)?/gi;
  let match: RegExpExecArray | null = opener.exec(source);
  let found: FencedJsonBlock | null = null;

  while (match) {
    const extracted = extractBalancedJsonObject(source, match.index + match[0].length);
    if (extracted) {
      const closer = /^\s*```/.exec(source.slice(extracted.end));
      if (closer) {
        found = {
          json: extracted.json,
          start: match.index,
          end: extracted.end + closer[0].length,
        };
      }
    }
    match = opener.exec(source);
  }

  return found;
}

export default function NewChatPage() {
  return (
    <Suspense fallback={
      <div className="editor-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TextShimmer>Loading editor...</TextShimmer>
      </div>
    }>
      <NewChatPageContent />
    </Suspense>
  );
}

function NewChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useQuery(api.users.current);
  const { signOut } = useAuthActions();
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  // 1. Resolve starting intents from URL
  const legacyDraftRoute = resolveLegacyDraftRoute(searchParams.get("draft"));
  const urlProjectId = searchParams.get("project") ?? legacyDraftRoute?.projectId ?? null;
  const requestedDraftLanguage = searchParams.get("lang") ?? legacyDraftRoute?.language ?? null;
  const templateParam = searchParams.get("template");
  const selectedTemplateKey = resolveCvProjectTemplateKey(templateParam) ?? "ats";

  // 2. Setup Convex queries and mutations
  const rawProject = useQuery(
    api.projects.getProject,
    urlProjectId ? { projectId: urlProjectId as Id<"cvProjects"> } : "skip"
  );
  const createProjectMutation = useMutation(api.projects.createProject);
  const saveProjectStateMutation = useMutation(api.projects.saveProjectState);

  // 3. Local React State
  const [project, setProject] = useState<DemoCvProject | null>(null);
  const [session, setSession] = useState<WorkspaceSessionState | null>(null);
  const [translationCache, setTranslationCache] = useState<any>(null); // Stores the cached translation
  const [previewMode, setPreviewMode] = useState<"source" | "translation">("source");
  const [composerValue, setComposerValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Export states
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormatChoice>("pdf");
  const [exportLanguage, setExportLanguage] = useState<ExportLanguageChoice>("active");
  const [isExporting, setIsExporting] = useState(false);
  const [trackedUrlProjectId, setTrackedUrlProjectId] = useState<string | null>(urlProjectId);

  // 4. Initialization Logic
  const createAttempted = useRef(false);
  const isMountedRef = useRef(true);
  const saveAttemptRef = useRef(0);
  const isStreamingRef = useRef(false);
  const workspaceEpochRef = useRef(0);
  const threadStickRef = useRef(true);
  const threadMessageCountRef = useRef(0);
  const threadAdjustingScrollRef = useRef(false);

  // Capture locale at mount time for use in init logic without adding it as a dependency
  const initLocaleRef = useRef(locale);

  const loadedConvexId =
    urlProjectId && rawProject && String(rawProject._id) === urlProjectId ? String(rawProject._id) : null;
  const urlProjectChanged = trackedUrlProjectId !== urlProjectId;
  const shouldAdoptLoadedProject = Boolean(loadedConvexId && project?.id !== loadedConvexId);

  // Adopt or drop the draft during render so a previous CV cannot paint or be saved.
  if (urlProjectChanged || shouldAdoptLoadedProject) {
    if (urlProjectChanged) setTrackedUrlProjectId(urlProjectId);
    workspaceEpochRef.current += 1;
    saveAttemptRef.current += 1;
    isStreamingRef.current = false;
    threadStickRef.current = true;
    threadMessageCountRef.current = 0;
    setPreviewMode("source");
    setComposerValue("");
    setSaveStatus("idle");
    setIsStreaming(false);
    setIsTranslating(false);
    setIsExporting(false);
    setExportOpen(false);

    if (shouldAdoptLoadedProject && rawProject) {
      const mapped = convexRowToProject(rawProject);
      setProject(mapped);
      setSession(createWorkspaceSessionFromProject(mapped));
      setTranslationCache(mapped.translationCache || null);
      setNotice(
        getCopy(initLocaleRef.current).chat.loadedDraft.replace("{name}", mapped.variant.personal.fullName),
      );
    } else {
      setProject(null);
      setSession(null);
      setTranslationCache(null);
      setNotice(null);
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // A: If we are asking for a specific project, wait until Convex loads it.
    // The draft itself is copied during render; this effect only leaves missing projects.
    if (urlProjectId) {
      if (rawProject === null && user) {
        router.replace("/dashboard");
      }
      return;
    }

    // B: We are starting from a template. We need to create it in Convex, get the ID, and redirect
    // Guard: wait for user to be fully loaded (not just resolved). `user` must be truthy (not null/undefined).
    if (!urlProjectId && !createAttempted.current && user) {
      createAttempted.current = true;
      const starterProject = createStarterCvProject(selectedTemplateKey, initLocaleRef.current);
      
      createProjectMutation({
        templateKey: starterProject.shared.templateKey,
        defaultLanguage: starterProject.shared.defaultLanguage,
        availableLanguages: starterProject.shared.availableLanguages,
        variant: starterProject.variant,
        conversation: { messages: [], historyItems: [] }, // Initially empty, will populate on first edit
      })
        .then((newId) => {
          if (!isMountedRef.current) return;
          router.replace(buildWorkspaceHref({ projectId: newId }));
        })
        .catch((error: unknown) => {
          console.error("Create project failed", error);
          if (!isMountedRef.current) return;
          createAttempted.current = false;
          const failedNotice = createProjectFailureNotice(initLocaleRef.current);
          setNotice(failedNotice);
          window.setTimeout(() => {
            if (!isMountedRef.current) return;
            setNotice((current) => (current === failedNotice ? null : current));
          }, 4000);
          router.replace("/dashboard");
        });
    }
  }, [urlProjectId, rawProject, user, selectedTemplateKey, requestedDraftLanguage, createProjectMutation, router]);

  // Composer setup
  const composer = useCharacterLimit({
    maxLength: 320,
    value: composerValue,
    onValueChange: setComposerValue,
  });
  const { characterCount, handleChange: handleComposerChange, maxLength, setValue: setComposerValueLimit, tone: composerTone } = composer;

  // 5. Autosave Implementation
  const debouncedSave = useDebounce(
    (
      projectId: Id<"cvProjects">,
      variant: any,
      sessionState: WorkspaceSessionState,
      epoch: number,
      newCache?: any,
    ) => {
      const stillCurrent = workspaceEpochRef.current === epoch;
      let attemptId = saveAttemptRef.current;
      if (stillCurrent) {
        attemptId = saveAttemptRef.current + 1;
        saveAttemptRef.current = attemptId;
        setSaveStatus("saving");
      }
      saveProjectStateMutation({
        projectId,
        variant: variant,
        conversation: {
          messages: sessionState.messages,
          historyItems: sessionState.historyItems,
        },
        translationCache: newCache,
      })
        .then(() => {
          if (!stillCurrent) return;
          window.setTimeout(() => {
            if (saveAttemptRef.current !== attemptId) return;
            setSaveStatus("saved");
            window.setTimeout(() => {
              if (saveAttemptRef.current !== attemptId) return;
              setSaveStatus("idle");
            }, 2000);
          }, 500); // Artificial minimum delay so the "Saving..." flash is visible
        })
        .catch((error: unknown) => {
          console.error("Autosave failed", error);
          if (!stillCurrent || saveAttemptRef.current !== attemptId) return;
          setSaveStatus("idle");
          const saveFailedNotice = autosaveFailureNotice(locale);
          setNotice(saveFailedNotice);
          window.setTimeout(() => {
            setNotice((current) => (current === saveFailedNotice ? null : current));
          }, 4000);
        });
    },
    800
  );

  const translationDraftWatchRef = useRef<{ projectId: string; draft: CvData } | null>(null);

  useEffect(() => {
    if (!project || !session) return;
    const draft = session.draftData;
    const previous = translationDraftWatchRef.current;
    translationDraftWatchRef.current = { projectId: project.id, draft };
    if (!previous || previous.projectId !== project.id) return;
    if (previous.draft !== draft) {
      setTranslationCache(null);
    }
  }, [project, session]);

  // Follow the thread only for a new message, or while the user is already pinned to the bottom.
  const threadRef = useRef<HTMLDivElement>(null);
  const threadMessageCount = session?.messages.length ?? 0;
  const threadLastMessageBody =
    threadMessageCount > 0 ? (session?.messages[threadMessageCount - 1]?.body ?? "") : "";

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;

    let userActive = false;
    const markWheelOrTouch = () => {
      userActive = true;
      queueMicrotask(() => {
        if (!el.matches(":active")) userActive = false;
      });
    };
    const markPointerDown = () => {
      userActive = true;
    };
    const markPointerUp = () => {
      userActive = false;
    };
    const onScroll = () => {
      if (threadAdjustingScrollRef.current || !userActive) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      threadStickRef.current = distanceFromBottom < 150;
    };

    el.addEventListener("wheel", markWheelOrTouch, { passive: true });
    el.addEventListener("touchmove", markWheelOrTouch, { passive: true });
    el.addEventListener("pointerdown", markPointerDown);
    el.addEventListener("pointerup", markPointerUp);
    el.addEventListener("pointercancel", markPointerUp);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", markWheelOrTouch);
      el.removeEventListener("touchmove", markWheelOrTouch);
      el.removeEventListener("pointerdown", markPointerDown);
      el.removeEventListener("pointerup", markPointerUp);
      el.removeEventListener("pointercancel", markPointerUp);
      el.removeEventListener("scroll", onScroll);
    };
  }, [project?.id]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || threadMessageCount === 0) return;

    const isNewMessage = threadMessageCount !== threadMessageCountRef.current;
    threadMessageCountRef.current = threadMessageCount;
    if (!isNewMessage && !threadStickRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      const node = threadRef.current;
      if (!node) return;
      if (!isNewMessage && !threadStickRef.current) return;
      if (isNewMessage) threadStickRef.current = true;
      threadAdjustingScrollRef.current = true;
      node.scrollTo({
        top: node.scrollHeight,
        behavior: isStreaming ? "auto" : "smooth",
      });
      threadAdjustingScrollRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [threadMessageCount, threadLastMessageBody, isStreaming, project?.id]);

  const applyInstruction = async (rawInstruction: string) => {
    if (!project || !session || isStreamingRef.current) return;
    if (urlProjectId && project.id !== urlProjectId) return;

    const instruction = rawInstruction.trim();
    const draftLanguage = session.draftData.language;
    const draftCopy = getCopy(draftLanguage);

    if (!instruction) {
      setNotice(draftCopy.chat.emptyMessage);
      return;
    }

    const epoch = workspaceEpochRef.current;
    const projectId = project.id as Id<"cvProjects">;
    isStreamingRef.current = true;
    setComposerValue("");
    setIsStreaming(true);

    const tempUserMessage = { role: "user" as const, body: instruction, language: session.draftData.language, timestamp: Date.now() };
    const messagesToSend = [...session.messages.map(m => ({ role: m.role, content: m.body })), { role: "user", content: instruction }];
    
    const tempSessionState = {
      ...session,
      messages: [...session.messages, tempUserMessage],
    };
    
    setSession((current) => {
      if (!current || workspaceEpochRef.current !== epoch) return current;
      return tempSessionState;
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          language: session.draftData.language,
          cvStateJson: tempSessionState.draftData,
        }),
      });

      if (workspaceEpochRef.current !== epoch) return;

      if (!response.ok || !response.body) {
        let errStr = copy.chat.aiConnectionFailed;
        try {
          const errBody = await response.json();
          if (errBody.error) errStr = errBody.error;
        } catch(e) {}
        throw new Error(errStr);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantBody = "";
      
      const startAssistantMsg = { role: "assistant" as const, body: "", language: session.draftData.language, timestamp: Date.now() };
      
      setSession((current) => {
        if (!current || workspaceEpochRef.current !== epoch) return current;
        return {
          ...tempSessionState,
          messages: [...tempSessionState.messages, startAssistantMsg]
        };
      });

      while (true) {
        if (workspaceEpochRef.current !== epoch) {
          await reader.cancel().catch(() => undefined);
          return;
        }
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantBody += decoder.decode(value, { stream: true });
        if (workspaceEpochRef.current !== epoch) {
          await reader.cancel().catch(() => undefined);
          return;
        }
        
        setSession((current) => {
          if (!current || workspaceEpochRef.current !== epoch) return current;
          const newMessages = [...current.messages];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            body: assistantBody
          };
          return {
            ...current,
            messages: newMessages
          };
        });
      }

      if (workspaceEpochRef.current !== epoch) return;

      // Stream done - check for JSON patches
      let finalDraftData = tempSessionState.draftData;
      let finalHistoryItems = tempSessionState.historyItems;
      let cleanedAssistantBody = assistantBody;
      let latestAction = tempSessionState.latestAction;

      const fencedJson = extractLastFencedJsonObject(assistantBody);
      if (fencedJson) {
         try {
           const parsed: unknown = JSON.parse(fencedJson.json);
           if (isCvUpdatePayload(parsed)) {
              finalDraftData = deepMerge(finalDraftData, parsed.data);
              cleanedAssistantBody = `${assistantBody.slice(0, fencedJson.start)}${assistantBody.slice(fencedJson.end)}`.trim();
              latestAction = summarizeWorkspaceAction(cleanedAssistantBody, instruction);
              finalHistoryItems = [latestAction, ...tempSessionState.historyItems].slice(0, 8);
              setNotice(draftCopy.chat.previewUpdated);
              setTranslationCache(null);
           }
         } catch {
           // Ignore malformed json
         }
      }

      if (workspaceEpochRef.current !== epoch) return;

      const draftChanged = finalDraftData !== tempSessionState.draftData;

      setSession((current) => {
         if (!current || workspaceEpochRef.current !== epoch) return current;
         const newMessages = [...current.messages];
         newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            body: cleanedAssistantBody
         };

         const finalSession = {
            ...current,
            messages: newMessages,
            draftData: finalDraftData,
            historyItems: finalHistoryItems,
            latestAction,
         };

         debouncedSave(
           projectId,
           finalSession.draftData,
           finalSession,
           epoch,
           draftChanged ? null : undefined,
         );

         return finalSession;
      });

    } catch (error: unknown) {
      console.error(error);
      if (workspaceEpochRef.current !== epoch) return;
      const message = error instanceof Error ? error.message : "";
      setNotice(message || copy.chat.exportError);
    } finally {
      if (workspaceEpochRef.current === epoch) {
        isStreamingRef.current = false;
        setIsStreaming(false);
      }
    }
  };

  const fetchCachedOrNewTranslation = async (sourceData: CvData, targetLang: AppLocale) => {
    if (translationCache && translationCache.language === targetLang) {
      return translationCache;
    }
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData: sourceData, targetLanguage: targetLang }),
    });
    if (!res.ok) throw new Error(copy.chat.translationFailed);
    const translatedData = await res.json();
    return translatedData as CvData;
  };

  const handleExport = async () => {
    if (!project || !session) return;
    if (urlProjectId && project.id !== urlProjectId) return;
    const epoch = workspaceEpochRef.current;
    const projectId = project.id as Id<"cvProjects">;
    const sourceData = session.draftData;
    const savedSession = session;
    try {
      setIsExporting(true);
      setExportOpen(false);

      const activeLang = sourceData.language;
      const exportJobs = buildExportJobs(exportFormat, exportLanguage, activeLang);
      
      for (let i = 0; i < exportJobs.length; i++) {
        if (workspaceEpochRef.current !== epoch) return;
        const job = exportJobs[i];
        let dataToExport = sourceData;
        
        if (job.language !== activeLang) {
          if (exportJobs.length > 1) {
             setNotice((copy.chat.exportingProgress as string)
              .replace("{lang}", copy.dashboard.languageNames[job.language])
              .replace("{current}", String(i + 1))
              .replace("{total}", String(exportJobs.length)) + ` (${copy.chat.translating})`);
          } else {
             setNotice(copy.chat.translatingTo.replace("{lang}", copy.dashboard.languageNames[job.language]));
          }
          dataToExport = await fetchCachedOrNewTranslation(sourceData, job.language);
          if (workspaceEpochRef.current !== epoch) return;
          setTranslationCache(dataToExport);
          debouncedSave(projectId, sourceData, savedSession, epoch, dataToExport);
        } else {
          if (exportJobs.length > 1) {
            const langName = copy.dashboard.languageNames[job.language];
            const progressMsg = (copy.chat.exportingProgress as string)
              .replace("{lang}", langName)
              .replace("{current}", String(i + 1))
              .replace("{total}", String(exportJobs.length));
            setNotice(progressMsg);
          } else {
            setNotice(copy.common.loadingExport);
          }
        }
        await downloadCv(dataToExport, job.format, project.shared.templateKey);
        await new Promise((resolve) => window.setTimeout(resolve, 800)); // Delay for toast sequencing
      }

      if (workspaceEpochRef.current !== epoch) return;
      setNotice(copy.chat.exportSuccess);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      if (workspaceEpochRef.current !== epoch) return;
      setNotice(copy.chat.exportError);
      setTimeout(() => setNotice(null), 3000);
    } finally {
      if (workspaceEpochRef.current === epoch) setIsExporting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const handlePreviewToggle = async (mode: "source" | "translation") => {
    if (!project || !session) return;
    if (urlProjectId && project.id !== urlProjectId) return;

    const epoch = workspaceEpochRef.current;
    const projectId = project.id as Id<"cvProjects">;
    const sourceData = session.draftData;
    const savedSession = session;
    
    setPreviewMode(mode);
    
    if (mode === "translation") {
      const targetLang = sourceData.language === "en" ? "ar" : "en";
      
      try {
        setIsTranslating(true);
        // Only translate if we don't have a valid cache, or if it got cleared by an edit
        if (!translationCache || translationCache.language !== targetLang) {
          setNotice(copy.chat.translating);
          
          const translatedData = await fetchCachedOrNewTranslation(sourceData, targetLang);
          if (workspaceEpochRef.current !== epoch) return;
          setTranslationCache(translatedData);
          debouncedSave(projectId, sourceData, savedSession, epoch, translatedData);
          
          setNotice(copy.chat.translationSuccess);
          setTimeout(() => setNotice(null), 3000);
        }
      } catch (error) {
        console.error("Translation failed:", error);
        if (workspaceEpochRef.current !== epoch) return;
        setNotice(copy.chat.translationFailed);
        setTimeout(() => setNotice(null), 3000);
      } finally {
        if (workspaceEpochRef.current === epoch) setIsTranslating(false);
      }
    }
  };

  // If loading, show shimmer
  if (!project || !session) {
    return (
      <div className="editor-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        {notice ? <div className="inline-notice library-inline-notice editor-inline-notice">{notice}</div> : null}
        <TextShimmer>{copy.common.loadingWorkspace ?? "Loading workspace..."}</TextShimmer>
      </div>
    );
  }

  const draftCopy = getCopy(session.draftData.language);
  const displayData = previewMode === "translation" && translationCache ? translationCache : session.draftData;
  const previewLocale = getGeneratorLocale(displayData.language);
  const activeTemplateName = copy.dashboard.templateNames[project.shared.templateKey];
  
  const sessionCards = [
    { label: copy.chat.status.currentLanguage, value: draftCopy.meta.languageName, icon: Languages, tone: "draft" },
    { label: copy.chat.status.interfaceLanguage, value: copy.meta.languageName, icon: Globe2, tone: "interface" },
    { label: copy.chat.status.template, value: activeTemplateName, icon: LayoutTemplate, tone: "template" },
  ];
  const previewCards = [
    { label: copy.chat.status.latestAction, value: session.historyItems[0] ?? copy.chat.status.noAction, icon: Sparkles, tone: "activity" },
    { label: copy.chat.status.template, value: activeTemplateName, icon: LayoutTemplate, tone: "template" },
    { label: copy.chat.status.previewState, value: copy.chat.previewDesignNote, icon: Globe2, tone: "preview" },
  ];

  return (
    <div className="editor-shell motion-page-enter">
      <header className="editor-topbar motion-slide-up">
        <div className="editor-brand">
          <span className="editor-brand-mark">{copy.common.brandMark}</span>
          <div className="editor-brand-copy">
            <strong className="editor-brand-title">{copy.common.brandTitle}</strong>
            <h1>{copy.chat.headerTitle}</h1>
          </div>
        </div>

        <div className="editor-topbar-actions">
          <AnimatePresence mode="wait">
            {saveStatus !== "idle" && (
              <motion.span
                key={saveStatus}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="muted-copy"
                style={{ marginRight: '1rem', fontSize: '0.85rem' }}
              >
                {saveStatus === "saving" ? copy.common.saving : copy.common.saved}
              </motion.span>
            )}
          </AnimatePresence>
          <LocaleToggle label={copy.chat.interfaceLanguageLabel} compact />
          <Link href="/dashboard" className="button-secondary">
            {copy.common.backToDashboard}
          </Link>
          <button type="button" className="button-secondary" onClick={() => void handleSignOut()}>
            {copy.common.signOut}
          </button>
        </div>
      </header>

      <main className="editor-layout">
        <section className="editor-conversation-panel motion-slide-up motion-delay-1">
          <div className="editor-pane-head">
            <div className="editor-pane-head-copy">
              <p className="workspace-label">{copy.chat.threadLabel}</p>
              <h2 className="editor-pane-title">{copy.chat.conversationTitle}</h2>
              <p className="muted-copy editor-pane-subtitle">
                {copy.chat.conversationBody} <strong>{user?.email ?? copy.dashboard.accountLabel}</strong>
              </p>
              <p className="editor-language-note">{copy.chat.draftLanguageBody}</p>
            </div>

            <div className="editor-pane-tools">
              <div className="editor-language-control locale-toggle locale-toggle--compact">
                <span className="locale-toggle-label">{session.draftData.language === "en" ? copy.chat.translateToAr : copy.chat.translateToEn}</span>
                <div className="locale-toggle-buttons" role="group" aria-label={copy.chat.previewEyebrow}>
                  <button
                    type="button"
                    className={previewMode === "source" ? "active" : undefined}
                    onClick={() => handlePreviewToggle("source")}
                  >
                    {copy.chat.previewOriginal}
                  </button>
                  <button
                    type="button"
                    className={previewMode === "translation" ? "active" : undefined}
                    onClick={() => handlePreviewToggle("translation")}
                    disabled={isTranslating}
                  >
                    {copy.chat.previewTranslation}
                  </button>
                </div>
              </div>

              <div className="editor-pane-badges">
                <span className="library-language-badge">
                  <Languages size={14} />
                  {draftCopy.meta.languageName}
                </span>
                <button type="button" className="editor-ghost-button" onClick={() => setExportOpen(true)}>
                  <Download size={14} />
                  {copy.chat.exportOpen}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {notice ? (
              <motion.div
                key={notice}
                className="inline-notice library-inline-notice editor-inline-notice"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {isExporting ? <TextShimmer>{notice}</TextShimmer> : notice}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="editor-session-strip">
            {sessionCards.map((card) => {
              const Icon = card.icon;

              return (
                <motion.div
                  key={`${card.label}-${card.value}`}
                  className={`editor-session-card editor-session-card--${card.tone}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="editor-session-card-icon">
                    <Icon size={14} />
                  </div>
                  <div className="editor-session-card-copy">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="editor-thread" role="log" aria-live="polite" ref={threadRef}>
            <AnimatePresence initial={false}>
              {session.messages.map((message, index) => (
                <motion.article
                  key={`${message.role}-${message.language}-${index}`}
                  className={`editor-message ${message.role === "user" ? "user" : "assistant"}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="message-label">
                    {message.role === "assistant" ? draftCopy.chat.mockConversation.assistantLabel : draftCopy.chat.mockConversation.userLabel}
                  </span>
                  <div className={`message-bubble ${message.role}`}>
                    {message.seedKey ? draftCopy.chat.mockConversation[message.seedKey] : (message.body || (isStreaming && index === session.messages.length - 1 ? <TextShimmer>{draftCopy.common.loadingWorkspace}</TextShimmer> : ""))}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          <div className="editor-composer">
            <div className="editor-chip-row">
              {copy.chat.quickActions.map((action) => (
                <button key={action} type="button" className="editor-chip-button" onClick={() => applyInstruction(action)}>
                  {action}
                </button>
              ))}
            </div>

            <div className="editor-input-shell">
              <textarea
                className="chat-input editor-textarea"
                placeholder={copy.chat.composerPlaceholder}
                value={composerValue}
                onChange={handleComposerChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!isStreamingRef.current) applyInstruction(composerValue);
                  }
                }}
                rows={3}
              />

              <div className="editor-composer-footer">
                <div className={`editor-counter editor-counter--${composerTone}`}>
                  <div className="editor-counter-topline">
                    <span>{copy.chat.composerCounterLabel}</span>
                    <strong>
                      {characterCount}/{maxLength}
                    </strong>
                  </div>
                  <div className="editor-counter-track" aria-hidden="true">
                    <span style={{ width: `${Math.min((characterCount / maxLength) * 100, 100)}%` }} />
                  </div>
                </div>

                <HoverActionButton
                  onClick={() => applyInstruction(composerValue)}
                  disabled={!composerValue.trim() || isExporting || isStreaming}
                  className="editor-send-button"
                >
                  {copy.chat.send}
                </HoverActionButton>
              </div>
            </div>

            <p className="chat-composer-hint">{copy.chat.composerHint}</p>
          </div>
        </section>

        <section className="editor-preview-panel motion-slide-up motion-delay-2">
          <div className="editor-pane-head editor-pane-head--preview">
            <div>
              <p className="workspace-label">{copy.chat.previewEyebrow}</p>
              <h2 className="editor-pane-title">{copy.chat.sections.previewTitle}</h2>
              <p className="muted-copy editor-pane-subtitle">{copy.chat.sections.previewSubtitle}</p>
            </div>

            <div className="editor-pane-badges">
              <span className="library-language-badge">
                <Globe2 size={14} />
                {draftCopy.meta.languageName}
              </span>
              <HoverActionButton variant="secondary" onClick={() => setExportOpen(true)}>
                {copy.chat.exportOpen}
              </HoverActionButton>
            </div>
          </div>

          <div className="editor-preview-stage">
            {isTranslating ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <TextShimmer>{copy.chat.translating}</TextShimmer>
              </div>
            ) : (
              <CvPreview
                data={displayData}
                previewLocale={previewLocale}
                templateKey={project.shared.templateKey}
              />
            )}
          </div>
        </section>
      </main>

      {/* Export Drawer logic remains identical, just wired to actual project metadata */}
      <AnimatePresence>
        {exportOpen && (
          <>
            <motion.aside
              className="export-modal"
              initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div className="export-drawer-content">
                <header className="export-header">
                  <h2>{copy.chat.exportTitle}</h2>
                  <p className="muted-copy">{copy.chat.exportBody}</p>
                </header>
                
                <section className="export-group">
                  <h3>{copy.exportDialog.formatTitle}</h3>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={`segmented-button ${exportFormat === "pdf" ? "active" : ""}`}
                      onClick={() => setExportFormat("pdf")}
                    >
                      {exportFormat === "pdf" && <motion.div layoutId="formatActive" className="segmented-active" />}
                      <span className="segmented-label">{copy.exportDialog.formatPdf}</span>
                    </button>
                    <button
                      type="button"
                      className={`segmented-button ${exportFormat === "docx" ? "active" : ""}`}
                      onClick={() => setExportFormat("docx")}
                    >
                      {exportFormat === "docx" && <motion.div layoutId="formatActive" className="segmented-active" />}
                      <span className="segmented-label">{copy.exportDialog.formatDocx}</span>
                    </button>
                  </div>
                </section>

                <section className="export-group">
                  <h3>{copy.exportDialog.languageTitle}</h3>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={`segmented-button ${exportLanguage === "active" ? "active" : ""}`}
                      onClick={() => setExportLanguage("active")}
                    >
                      {exportLanguage === "active" && <motion.div layoutId="langActive" className="segmented-active" />}
                      <span className="segmented-label">{copy.exportDialog.languageActive}</span>
                    </button>
                    <button
                      type="button"
                      className={`segmented-button ${exportLanguage === "both" ? "active" : ""}`}
                      onClick={() => setExportLanguage("both")}
                    >
                      {exportLanguage === "both" && <motion.div layoutId="langActive" className="segmented-active" />}
                      <span className="segmented-label">{copy.exportDialog.languageBoth}</span>
                    </button>
                  </div>
                </section>
              </div>

              <div className="export-footer">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setExportOpen(false)}
                  disabled={isExporting}
                >
                  {copy.common.cancel}
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => void handleExport()}
                  disabled={isExporting}
                >
                  {isExporting ? copy.common.loadingExport : copy.chat.exportConfirm}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
