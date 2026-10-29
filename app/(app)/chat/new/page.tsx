"use client";

import { memo, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { Download, FileText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import CvPreview from "@/components/cv/CvPreview";
import { useDialogLifecycle } from "@/components/shell/useDialog";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import EmptyState from "@/components/ui/EmptyState";
import HoverActionButton from "@/components/ui/HoverActionButton";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { getCopy, type AppLocale } from "@/lib/app/content";
import { buildExportJobs, type ExportFormatChoice, type ExportLanguageChoice } from "@/lib/cv/export";
import { downloadCv } from "@/lib/cv/downloadClient";
import { getGeneratorLocale, type CvData } from "@/lib/cv/demoData";
import { useCharacterLimit } from "@/lib/hooks/useCharacterLimit";
import {
  createTranslationCacheEntry,
  normalizeCvData,
  normalizeCvPatch,
  readFreshTranslationCache,
  type TranslationCacheEntry,
} from "@/lib/cv/validation";
import { createWorkspaceSessionFromProject, type WorkspaceSessionState } from "@/lib/cv/studioData";
import {
  buildWorkspaceHref,
  convexRowToProject,
  createStarterCvProject,
  resolveCvProjectTemplateKey,
  resolveLegacyDraftRoute,
  type DemoCvProject,
} from "@/lib/cv/projects";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";
import { deepMerge } from "@/lib/cv/workspace";
import { motionEase } from "@/lib/ui/motion";

function useDebounce<T extends (...args: never[]) => void>(callback: T, delay: number) {
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
    [callback, delay],
  );
}

function readAssistantPayload(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isAssistantUpdate(value: unknown): value is { _ofuqi_action: "update"; data: unknown } {
  return (
    value !== null
    && typeof value === "object"
    && "_ofuqi_action" in value
    && (value as { _ofuqi_action?: unknown })._ofuqi_action === "update"
    && "data" in value
  );
}

const WorkspacePreview = memo(function WorkspacePreview({
  data,
  templateKey,
  veiled,
}: {
  data: CvData;
  templateKey: CvProjectTemplateKey;
  veiled: boolean;
}) {
  return (
    <div className={veiled ? "preview-stage-sheet is-veiled" : "preview-stage-sheet"}>
      <CvPreview data={data} previewLocale={getGeneratorLocale(data.language)} templateKey={templateKey} />
    </div>
  );
});

function EditorStatus({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="editor-status">
      <h1>{title}</h1>
      <p>{body}</p>
      {action ?? null}
    </div>
  );
}

function EditorLoading({ label, title }: { label: string; title: string }) {
  return (
    <div className="editor-shell editor-shell--loading" aria-busy="true">
      <h1>{title}</h1>
      <p role="status">{label}</p>
      <div className="editor-skeleton" />
    </div>
  );
}

function EditorLoadingFallback() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  return <EditorLoading label={copy.chat.loadingEditor} title={copy.chat.headerTitle} />;
}

export default function NewChatPage() {
  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <NewChatPageContent />
    </Suspense>
  );
}

function NewChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion();
  const user = useQuery(api.users.current);
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  const legacyDraftRoute = resolveLegacyDraftRoute(searchParams.get("draft"));
  const urlProjectId = searchParams.get("project") ?? legacyDraftRoute?.projectId ?? null;
  const requestedDraftLanguage = searchParams.get("lang") ?? legacyDraftRoute?.language ?? null;
  const templateParam = searchParams.get("template");
  const selectedTemplateKey = resolveCvProjectTemplateKey(templateParam) ?? "ats";

  const rawProject = useQuery(
    api.projects.getProject,
    urlProjectId ? { projectId: urlProjectId as Id<"cvProjects"> } : "skip",
  );
  const createProjectMutation = useMutation(api.projects.createProject);
  const saveProjectStateMutation = useMutation(api.projects.saveProjectState);

  const [project, setProject] = useState<DemoCvProject | null>(null);
  const [session, setSession] = useState<WorkspaceSessionState | null>(null);
  const [translationCache, setTranslationCache] = useState<TranslationCacheEntry | null>(null);
  const [previewMode, setPreviewMode] = useState<"source" | "translation">("source");
  const [composerValue, setComposerValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeRole, setNoticeRole] = useState<"status" | "alert">("status");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isTranslating, setIsTranslating] = useState(false);
  const [bootError, setBootError] = useState<"create" | null>(null);
  const [mobilePane, setMobilePane] = useState<"write" | "preview">("write");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormatChoice>("pdf");
  const [exportLanguage, setExportLanguage] = useState<ExportLanguageChoice>("active");
  const [isExporting, setIsExporting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const exportModalRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const wasStreamingRef = useRef(false);
  const createAttempted = useRef(false);
  const loadedProjectId = useRef<string | null>(null);
  const initLocaleRef = useRef(locale);

  const showNotice = useCallback((message: string, role: "status" | "alert" = "status") => {
    setNotice(message);
    setNoticeRole(role);
  }, []);

  const closeExport = () => {
    if (!isExporting) {
      setExportOpen(false);
    }
  };

  useDialogLifecycle(exportOpen, exportModalRef, closeExport);

  useEffect(() => {
    if (urlProjectId) {
      if (rawProject && loadedProjectId.current !== rawProject._id) {
        loadedProjectId.current = rawProject._id;
        const mapped = convexRowToProject(rawProject);
        // Convex delivers the saved project outside this render. The editor copies it in once.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- external query result, not derived state
        setProject(mapped);
        setSession(createWorkspaceSessionFromProject(mapped));
        const targetLanguage = mapped.variant.language === "en" ? "ar" : "en";
        const freshCache = readFreshTranslationCache(mapped.translationCache, mapped.variant, targetLanguage);
        setTranslationCache(freshCache ? createTranslationCacheEntry(mapped.variant, freshCache) : null);
        const openedName = mapped.variant.personal.fullName.trim();
        const openedCopy = getCopy(initLocaleRef.current);
        setNotice(
          openedName
            ? openedCopy.chat.loadedDraft.replace("{name}", openedName)
            : openedCopy.chat.previewEmptyTitle,
        );
        setNoticeRole("status");
      }
      return;
    }

    if (!createAttempted.current && user) {
      createAttempted.current = true;
      const starterProject = createStarterCvProject(selectedTemplateKey, initLocaleRef.current);
      createProjectMutation({
        templateKey: starterProject.shared.templateKey,
        defaultLanguage: starterProject.shared.defaultLanguage,
        availableLanguages: starterProject.shared.availableLanguages,
        variant: starterProject.variant,
        conversation: { messages: [], historyItems: [] },
      })
        .then((newId) => {
          router.replace(buildWorkspaceHref({ projectId: newId }));
        })
        .catch(() => {
          setBootError("create");
        });
    }
  }, [urlProjectId, rawProject, user, selectedTemplateKey, requestedDraftLanguage, createProjectMutation, router]);

  const composer = useCharacterLimit({
    maxLength: 320,
    value: composerValue,
    onValueChange: setComposerValue,
  });
  const { characterCount, handleChange: handleComposerChange, maxLength, tone: composerTone } = composer;

  const debouncedSave = useDebounce(
    (projectId: Id<"cvProjects">, variant: CvData, sessionState: WorkspaceSessionState, newCache?: TranslationCacheEntry | null) => {
      setSaveStatus("saving");
      saveProjectStateMutation({
        projectId,
        variant,
        conversation: {
          messages: sessionState.messages,
          historyItems: sessionState.historyItems,
        },
        translationCache: newCache ?? null,
      })
        .then(() => {
          setSaveStatus("saved");
          window.setTimeout(() => {
            setSaveStatus((current) => (current === "saved" ? "idle" : current));
          }, 2000);
        })
        .catch(() => {
          setSaveStatus("error");
        });
    },
    800,
  );

  const messageCount = session?.messages.length ?? 0;
  const latestMessageBody = session?.messages[messageCount - 1]?.body ?? "";

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread || !session || messageCount === 0) {
      wasStreamingRef.current = isStreaming;
      return;
    }

    const isNearBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 150;
    const justFinished = wasStreamingRef.current && !isStreaming;
    if (isNearBottom) {
      const behavior = !reduced && justFinished ? "smooth" : "auto";
      thread.scrollTo({ top: thread.scrollHeight, behavior });
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, latestMessageBody, messageCount, reduced, session]);

  const applyInstruction = async (rawInstruction: string) => {
    if (!project || !session || isStreaming) {
      return;
    }

    const instruction = rawInstruction.trim();
    const draftLanguage = session.draftData.language;
    const draftCopy = getCopy(draftLanguage);

    if (!instruction) {
      showNotice(draftCopy.chat.emptyMessage, "alert");
      return;
    }

    setComposerValue("");
    setIsStreaming(true);

    const tempUserMessage = {
      role: "user" as const,
      body: instruction,
      language: session.draftData.language,
    };
    const messagesToSend = [
      ...session.messages.map((message) => ({ role: message.role, content: message.body })),
      { role: "user", content: instruction },
    ];
    const tempSessionState = {
      ...session,
      messages: [...session.messages, tempUserMessage],
    };

    setSession((current) => (current ? tempSessionState : current));

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messagesToSend,
        language: session.draftData.language,
        cvStateJson: tempSessionState.draftData,
      }),
    }).catch(() => null);

    if (!response || !response.ok || !response.body) {
      showNotice(copy.chat.chatError, "alert");
      setIsStreaming(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const startAssistantMsg = {
      role: "assistant" as const,
      body: "",
      language: session.draftData.language,
    };

    setSession((current) => {
      if (!current) {
        return current;
      }

      return {
        ...tempSessionState,
        messages: [...tempSessionState.messages, startAssistantMsg],
      };
    });

    const readAssistantBody = async (body: string): Promise<string> => {
      const { done, value } = await reader.read();
      if (done) {
        return body;
      }

      const nextBody = body + decoder.decode(value, { stream: true });
      setSession((current) => {
        if (!current) {
          return current;
        }

        const newMessages = [...current.messages];
        const lastMessage = newMessages[newMessages.length - 1];
        if (!lastMessage) {
          return current;
        }

        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          body: nextBody,
        };

        return {
          ...current,
          messages: newMessages,
        };
      });

      return readAssistantBody(nextBody);
    };

    const assistantBody = await readAssistantBody("").catch(() => "");
    let finalDraftData = tempSessionState.draftData;
    let finalHistoryItems = tempSessionState.historyItems;
    let cleanedAssistantBody = assistantBody;
    const jsonMatch = assistantBody.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);

    if (jsonMatch) {
      const parsed = readAssistantPayload(jsonMatch[1] ?? "");
      if (isAssistantUpdate(parsed)) {
        const patch = normalizeCvPatch(parsed.data);
        const mergedDraft = patch
          ? normalizeCvData(deepMerge(finalDraftData as Record<string, unknown>, patch as Record<string, unknown>))
          : null;
        if (mergedDraft) {
          finalDraftData = mergedDraft;
          cleanedAssistantBody = assistantBody.replace(jsonMatch[0], "").trim();
          finalHistoryItems = [draftCopy.chat.status.latestAction, ...tempSessionState.historyItems];
          setTranslationCache(null);
          setPreviewMode("source");
          showNotice(draftCopy.chat.previewUpdated);
        }
      }
    }

    setSession((current) => {
      if (!current) {
        return current;
      }

      const newMessages = [...current.messages];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage) {
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          body: cleanedAssistantBody,
        };
      }

      const finalSession = {
        ...current,
        messages: newMessages,
        draftData: finalDraftData,
        historyItems: finalHistoryItems,
      };

      debouncedSave(project.id as Id<"cvProjects">, finalSession.draftData, finalSession, null);
      return finalSession;
    });
    setIsStreaming(false);
  };

  const fetchCachedOrNewTranslation = async (sourceData: CvData, targetLang: AppLocale) => {
    const cachedData = readFreshTranslationCache(translationCache, sourceData, targetLang);
    if (cachedData) {
      return { data: cachedData, cache: translationCache };
    }

    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData: sourceData, targetLanguage: targetLang }),
    });
    if (!res.ok) {
      throw new Error(copy.chat.translationFailed);
    }

    const translatedData = normalizeCvData(await res.json());
    if (!translatedData) {
      throw new Error(copy.chat.translationFailed);
    }

    return { data: translatedData, cache: createTranslationCacheEntry(sourceData, translatedData) };
  };

  const handleExport = async () => {
    if (!project || !session) {
      return;
    }

    setIsExporting(true);
    setExportOpen(false);

    const activeLang = session.draftData.language;
    const exportJobs = buildExportJobs(exportFormat, exportLanguage, activeLang);
    let failed = false;

    for (let index = 0; index < exportJobs.length; index += 1) {
      const job = exportJobs[index];
      if (!job) {
        continue;
      }

      let dataToExport = session.draftData;
      if (job.language !== activeLang) {
        showNotice(
          exportJobs.length > 1
            ? `${copy.chat.exportingProgress
              .replace("{lang}", copy.dashboard.languageNames[job.language])
              .replace("{current}", String(index + 1))
              .replace("{total}", String(exportJobs.length))} (${copy.chat.translating})`
            : copy.chat.previewTranslationLabel.replace("{lang}", copy.dashboard.languageNames[job.language]),
        );
        const translated = await fetchCachedOrNewTranslation(session.draftData, job.language).catch(() => null);
        if (!translated) {
          failed = true;
          break;
        }
        dataToExport = translated.data;
        setTranslationCache(translated.cache);
        debouncedSave(project.id as Id<"cvProjects">, session.draftData, session, translated.cache);
      } else if (exportJobs.length > 1) {
        showNotice(
          copy.chat.exportingProgress
            .replace("{lang}", copy.dashboard.languageNames[job.language])
            .replace("{current}", String(index + 1))
            .replace("{total}", String(exportJobs.length)),
        );
      } else {
        showNotice(copy.common.loadingExport);
      }

      const downloaded = await downloadCv(dataToExport, job.format, project.shared.templateKey)
        .then(() => true)
        .catch(() => false);
      if (!downloaded) {
        failed = true;
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 800));
    }

    if (failed) {
      showNotice(copy.chat.exportError, "alert");
    } else {
      showNotice(copy.chat.exportSuccess);
    }
    setIsExporting(false);
  };

  const handlePreviewToggle = async (mode: "source" | "translation") => {
    if (!project || !session) {
      return;
    }

    setPreviewMode(mode);
    if (mode !== "translation") {
      return;
    }

    const sourceData = session.draftData;
    const targetLang = sourceData.language === "en" ? "ar" : "en";
    if (readFreshTranslationCache(translationCache, sourceData, targetLang)) {
      return;
    }

    setIsTranslating(true);
    showNotice(copy.chat.translating);
    const translated = await fetchCachedOrNewTranslation(sourceData, targetLang).catch(() => null);
    if (!translated) {
      showNotice(copy.chat.translationFailed, "alert");
      setPreviewMode("source");
    } else {
      setTranslationCache(translated.cache);
      debouncedSave(project.id as Id<"cvProjects">, sourceData, session, translated.cache);
      showNotice(copy.chat.translationComplete);
    }
    setIsTranslating(false);
  };

  const retryCreate = () => {
    const starterProject = createStarterCvProject(selectedTemplateKey, initLocaleRef.current);
    setBootError(null);
    createProjectMutation({
      templateKey: starterProject.shared.templateKey,
      defaultLanguage: starterProject.shared.defaultLanguage,
      availableLanguages: starterProject.shared.availableLanguages,
      variant: starterProject.variant,
      conversation: { messages: [], historyItems: [] },
    })
      .then((newId) => {
        router.replace(buildWorkspaceHref({ projectId: newId }));
      })
      .catch(() => {
        setBootError("create");
      });
  };

  const projectMissing = Boolean(urlProjectId) && rawProject === null && Boolean(user) && !project;

  if (bootError === "create") {
    return (
      <EditorStatus
        title={copy.chat.headerTitle}
        body={copy.chat.createFailed}
        action={(
          <button type="button" className="button-primary" onClick={retryCreate}>
            {copy.common.retry}
          </button>
        )}
      />
    );
  }

  if (projectMissing) {
    return (
      <EditorStatus
        title={copy.chat.projectNotFoundTitle}
        body={copy.chat.projectNotFoundBody}
        action={(
          <a className="button-primary" href="/dashboard">
            {copy.common.backToDashboard}
          </a>
        )}
      />
    );
  }

  if (!project || !session) {
    return <EditorLoading label={copy.chat.loadingEditor} title={copy.chat.headerTitle} />;
  }

  const draftCopy = getCopy(session.draftData.language);
  const targetTranslationLanguage = session.draftData.language === "en" ? "ar" : "en";
  const cachedTranslation = readFreshTranslationCache(translationCache, session.draftData, targetTranslationLanguage);
  const displayData = previewMode === "translation" && cachedTranslation ? cachedTranslation : session.draftData;
  const previewIsEmpty = !displayData.personal.fullName.trim()
    && !displayData.summary.trim()
    && displayData.experience.length === 0
    && displayData.education.length === 0
    && displayData.skills.length === 0;
  const messages = session.messages;

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <h1>{copy.chat.conversationTitle}</h1>
        {saveStatus === "idle" ? null : (
          <p className={`editor-save-status editor-save-status--${saveStatus}`} role={saveStatus === "error" ? "alert" : "status"}>
            {saveStatus === "saving" ? copy.common.saving : saveStatus === "saved" ? copy.common.saved : copy.chat.saveFailed}
          </p>
        )}
      </div>

      <AnimatePresence>
        {notice ? (
          <motion.div
            key={notice}
            className={noticeRole === "alert" ? "inline-notice inline-notice--alert" : "inline-notice"}
            role={noticeRole}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: motionEase }}
          >
            <p>{notice}</p>
            <button type="button" className="button-small" onClick={() => setNotice(null)}>
              {copy.common.dismiss}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="editor-pane-tabs" role="tablist" aria-label={copy.chat.paneTabsLabel}>
        <button
          type="button"
          role="tab"
          id="workspace-tab-write"
          aria-controls="workspace-panel-write"
          aria-selected={mobilePane === "write"}
          className={mobilePane === "write" ? "active" : undefined}
          onClick={() => setMobilePane("write")}
        >
          {copy.chat.writeTab}
        </button>
        <button
          type="button"
          role="tab"
          id="workspace-tab-preview"
          aria-controls="workspace-panel-preview"
          aria-selected={mobilePane === "preview"}
          className={mobilePane === "preview" ? "active" : undefined}
          onClick={() => setMobilePane("preview")}
        >
          {copy.chat.previewTab}
        </button>
      </div>

      <div className="editor-layout" data-pane={mobilePane}>
        <section
          id="workspace-panel-write"
          role="tabpanel"
          aria-labelledby="workspace-tab-write"
          className="editor-conversation-panel"
        >
          <div className="editor-thread" role="log" aria-live="polite" aria-relevant="additions" ref={threadRef}>
            {messages.map((message, index) => {
              const isNewest = index === messages.length - 1;
              const label = message.role === "assistant"
                ? draftCopy.chat.mockConversation.assistantLabel
                : draftCopy.chat.mockConversation.userLabel;
              const body = message.seedKey
                ? draftCopy.chat.mockConversation[message.seedKey]
                : message.body;

              const article = (
                <>
                  <span className="message-label">{label}</span>
                  <div className={`message-bubble ${message.role}`} dir={message.language === "ar" ? "rtl" : "ltr"}>
                    {body ? body : null}
                    {isStreaming && isNewest && message.role === "assistant" ? (
                      <span className="stream-line">
                        <span className="stream-dot" aria-hidden="true" />
                        {body ? null : <span className="sr-only">{copy.common.loadingWorkspace}</span>}
                      </span>
                    ) : null}
                  </div>
                </>
              );

              if (isNewest && !reduced) {
                return (
                  <motion.article
                    key={`${message.role}-${index}`}
                    className={`editor-message ${message.role === "user" ? "user" : "assistant"}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: motionEase }}
                  >
                    {article}
                  </motion.article>
                );
              }

              return (
                <article
                  key={`${message.role}-${index}`}
                  className={`editor-message ${message.role === "user" ? "user" : "assistant"}`}
                >
                  {article}
                </article>
              );
            })}
          </div>

          <div className="editor-composer">
            <div className="editor-chip-row">
              {copy.chat.quickActions.map((action) => (
                <button key={action} type="button" className="editor-chip-button" onClick={() => void applyInstruction(action)}>
                  {action}
                </button>
              ))}
            </div>
            <div className="editor-input-shell">
              <label htmlFor="workspace-composer">{copy.chat.composerLabel}</label>
              <textarea
                id="workspace-composer"
                className="chat-input editor-textarea"
                placeholder={copy.chat.composerPlaceholder}
                value={composerValue}
                onChange={handleComposerChange}
                aria-describedby="composer-hint"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!isStreaming) {
                      void applyInstruction(composerValue);
                    }
                  }
                }}
                rows={3}
              />
              <div className="editor-composer-footer">
                <div className={`editor-counter editor-counter--${composerTone}`}>
                  <div className="editor-counter-topline">
                    <span>{copy.chat.composerCounterLabel}</span>
                    <strong>{characterCount}/{maxLength}</strong>
                  </div>
                  <div className="editor-counter-track" aria-hidden="true">
                    <span style={{ transform: `scaleX(${Math.min(characterCount / maxLength, 1)})` }} />
                  </div>
                </div>
                <HoverActionButton
                  onClick={() => void applyInstruction(composerValue)}
                  disabled={!composerValue.trim() || isExporting || isStreaming}
                  className="editor-send-button"
                >
                  {copy.chat.send}
                </HoverActionButton>
              </div>
            </div>
            <p id="composer-hint" className="chat-composer-hint">{copy.chat.composerHint}</p>
          </div>
        </section>

        <section
          id="workspace-panel-preview"
          role="tabpanel"
          aria-labelledby="workspace-tab-preview"
          className="editor-preview-panel"
        >
          <div className="editor-pane-head">
            <div>
              <p className="workspace-label">{copy.chat.previewEyebrow}</p>
              <h2 className="editor-pane-title">{copy.chat.sections.previewTitle}</h2>
            </div>
            <SegmentedControl
              compact
              ariaLabel={copy.chat.previewGroupLabel}
              value={previewMode}
              onChange={(mode) => void handlePreviewToggle(mode)}
              options={[
                { value: "source", label: copy.chat.previewOriginal },
                { value: "translation", label: copy.chat.previewTranslation, disabled: isTranslating },
              ]}
            />
            <button type="button" className="button-primary export-trigger" onClick={() => setExportOpen(true)}>
              <Download size={16} strokeWidth={1.5} aria-hidden="true" />
              {copy.chat.exportOpen}
            </button>
          </div>
          {isTranslating ? <p className="preview-status" role="status">{copy.chat.translating}</p> : null}
          <div className="editor-preview-stage">
            {previewIsEmpty && previewMode === "source" ? (
              <EmptyState
                icon={<FileText size={18} aria-hidden="true" />}
                title={copy.chat.previewEmptyTitle}
                body={copy.chat.previewEmptyBody}
              />
            ) : (
              <WorkspacePreview
                data={displayData}
                templateKey={project.shared.templateKey}
                veiled={isTranslating}
              />
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {exportOpen ? (
          <motion.div key="export-dialog" className="export-overlay">
            <motion.button
              type="button"
              className="export-scrim"
              aria-label={copy.chat.closeExport}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: motionEase }}
              onClick={closeExport}
            />
            <motion.div
              ref={exportModalRef}
              className="export-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="export-dialog-title"
              tabIndex={-1}
              initial={reduced ? false : { opacity: 0, transform: "scale(0.96)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{ opacity: 0, transform: "scale(0.96)", transition: reduced ? { duration: 0 } : { duration: 0.16, ease: motionEase } }}
              transition={reduced ? { duration: 0 } : { duration: 0.25, ease: motionEase }}
            >
              <header className="export-header">
                <h2 id="export-dialog-title">{copy.chat.exportTitle}</h2>
                <p className="muted-copy">{copy.chat.exportBody}</p>
              </header>
              <section className="export-group">
                <h3>{copy.exportDialog.formatTitle}</h3>
                <SegmentedControl
                  ariaLabel={copy.chat.exportFormatLabel}
                  value={exportFormat === "docx" ? "docx" : "pdf"}
                  onChange={setExportFormat}
                  options={[
                    { value: "pdf", label: copy.exportDialog.formatPdf },
                    { value: "docx", label: copy.exportDialog.formatDocx },
                  ]}
                />
              </section>
              <section className="export-group">
                <h3>{copy.exportDialog.languageTitle}</h3>
                <SegmentedControl
                  ariaLabel={copy.chat.exportLanguageLabel}
                  value={exportLanguage}
                  onChange={setExportLanguage}
                  options={[
                    { value: "active", label: copy.exportDialog.languageActive },
                    { value: "both", label: copy.exportDialog.languageBoth },
                  ]}
                />
              </section>
              <div className="export-footer">
                <button type="button" className="button-secondary" onClick={closeExport} disabled={isExporting}>
                  {copy.common.cancel}
                </button>
                <button type="button" className="button-primary export-trigger" onClick={() => void handleExport()} disabled={isExporting}>
                  {isExporting ? copy.common.loadingExport : copy.chat.exportConfirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
