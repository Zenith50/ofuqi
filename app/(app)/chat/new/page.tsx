"use client";

import { memo, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { Download, FileText, MessageSquare, Send, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import CvPreview from "@/components/cv/CvPreview";
import { useDialogLifecycle } from "@/components/shell/useDialog";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import EmptyState from "@/components/ui/EmptyState";
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
    <div className="editor-shell">
      <section className="instrument instrument--status">
        <header className="instrument-head">
          <h1 className="instrument-title">{title}</h1>
        </header>
        <div className="instrument-well instrument-well--pad">
          <p className="instrument-note">{body}</p>
          {action ?? null}
        </div>
      </section>
    </div>
  );
}

function EditorLoading({ label, title }: { label: string; title: string }) {
  return (
    <div className="editor-shell editor-shell--loading" aria-busy="true">
      <div className="editor-layout">
        <section className="instrument">
          <header className="instrument-head">
            <h1 className="instrument-title">{title}</h1>
          </header>
          <div className="instrument-well instrument-well--pad">
            <p role="status">{label}</p>
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton skeleton-block" />
          </div>
        </section>
        <section className="instrument" aria-hidden="true">
          <header className="instrument-head">
            <span className="skeleton skeleton-line skeleton-line--short" />
          </header>
          <div className="instrument-well instrument-well--pad">
            <div className="skeleton skeleton-sheet" />
          </div>
        </section>
      </div>
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
  const saveLabel = saveStatus === "saving"
    ? copy.common.saving
    : saveStatus === "saved"
      ? copy.common.saved
      : copy.chat.saveFailed;

  return (
    <div className="editor-shell">
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

      <AnimatePresence>
        {notice ? (
          <motion.div
            key={notice}
            className={noticeRole === "alert" ? "alert alert--destructive" : "alert"}
            role={noticeRole}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: motionEase }}
          >
            <p className="alert-description">{notice}</p>
            <button type="button" className="button-small" onClick={() => setNotice(null)}>
              {copy.common.dismiss}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="editor-layout" data-pane={mobilePane}>
        <section
          id="workspace-panel-write"
          role="tabpanel"
          aria-labelledby="workspace-tab-write"
          className="instrument instrument--transcript"
        >
          <header className="instrument-head">
            <div className="instrument-head-copy">
              <p className="instrument-kicker">{copy.chat.threadLabel}</p>
              <h1 className="instrument-title">{copy.chat.conversationTitle}</h1>
            </div>
            <div className="instrument-head-tools">
              {saveStatus === "idle" ? null : (
                <span
                  className={saveStatus === "error" ? "badge badge--destructive" : "badge badge--outline"}
                  role={saveStatus === "error" ? "alert" : "status"}
                >
                  {saveLabel}
                </span>
              )}
              <span className="badge badge--outline">{messages.length}</span>
            </div>
          </header>

          <div className="instrument-well editor-thread" role="log" aria-live="polite" aria-relevant="additions" ref={threadRef}>
            <div className="marker" role="separator">
              <span>
                {copy.dashboard.languageNames[session.draftData.language]}
                {" · "}
                {copy.dashboard.templateNames[project.shared.templateKey]}
              </span>
            </div>
            {messages.length === 0 ? (
              <EmptyState
                icon={<MessageSquare size={18} aria-hidden="true" />}
                title={copy.chat.threadEmptyTitle}
                body={copy.chat.threadEmptyBody}
              />
            ) : messages.map((message, index) => {
              const isNewest = index === messages.length - 1;
              const label = message.role === "assistant"
                ? draftCopy.chat.mockConversation.assistantLabel
                : draftCopy.chat.mockConversation.userLabel;
              const body = message.seedKey
                ? draftCopy.chat.mockConversation[message.seedKey]
                : message.body;
              const mark = message.role === "assistant" ? copy.common.brandMark : label.slice(0, 1);

              return (
                <motion.article
                  key={`${message.role}-${index}`}
                  className={message.role === "user" ? "message message--user" : "message message--assistant"}
                  initial={isNewest && !reduced ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: motionEase }}
                >
                  <span className="message-avatar" aria-hidden="true">{mark}</span>
                  <div className="message-content">
                    <span className="message-label">{label}</span>
                    <div className={message.role === "user" ? "bubble bubble--user" : "bubble bubble--assistant"} dir={message.language === "ar" ? "rtl" : "ltr"}>
                      {body ? <p className="bubble-content">{body}</p> : null}
                      {isStreaming && isNewest && message.role === "assistant" ? (
                        body ? (
                          <span className="stream-line">
                            <span className="stream-dot" aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="text-shimmer">{copy.common.loadingWorkspace}</span>
                        )
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <footer className="instrument-foot">
            <div className="field">
              <p className="instrument-kicker" id="suggestion-label">{copy.chat.suggestionsLabel}</p>
              <div className="suggestion-group" role="group" aria-labelledby="suggestion-label">
                {copy.chat.quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="button-secondary"
                    onClick={() => void applyInstruction(action)}
                    disabled={isStreaming || isExporting}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="instrument-kicker" htmlFor="workspace-composer">{copy.chat.composerLabel}</label>
              <div className="input-group">
                <textarea
                  id="workspace-composer"
                  className="input-group-control"
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
                <div className="input-group-addon">
                  <div className={`editor-counter editor-counter--${composerTone}`}>
                    <div className="editor-counter-topline">
                      <span>{copy.chat.composerCounterLabel}</span>
                      <strong>{characterCount}/{maxLength}</strong>
                    </div>
                    <div className="editor-counter-track" aria-hidden="true">
                      <span style={{ transform: `scaleX(${Math.min(characterCount / maxLength, 1)})` }} />
                    </div>
                  </div>
                  <p id="composer-hint" className="composer-hint">{copy.chat.composerHint}</p>
                  <button
                    type="button"
                    className="button-primary editor-send-button"
                    onClick={() => void applyInstruction(composerValue)}
                    disabled={!composerValue.trim() || isExporting || isStreaming}
                  >
                    {copy.chat.send}
                    <Send size={16} strokeWidth={1.5} aria-hidden="true" data-icon="inline-end" />
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </section>

        <section
          id="workspace-panel-preview"
          role="tabpanel"
          aria-labelledby="workspace-tab-preview"
          className="instrument instrument--preview"
        >
          <header className="instrument-head">
            <div className="instrument-head-copy">
              <p className="instrument-kicker">{copy.chat.previewEyebrow}</p>
              <h2 className="instrument-title">{copy.chat.sections.previewTitle}</h2>
              <p className="instrument-note">{copy.chat.sections.previewSubtitle}</p>
            </div>
            <div className="instrument-head-tools">
              <span className="badge">{copy.dashboard.templateNames[project.shared.templateKey]}</span>
              <span className="badge badge--outline">{copy.dashboard.languageNames[displayData.language]}</span>
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
              <button type="button" className="button-primary" onClick={() => setExportOpen(true)}>
                <Download size={16} strokeWidth={1.5} aria-hidden="true" data-icon="inline-start" />
                {copy.chat.exportOpen}
              </button>
            </div>
          </header>
          {isTranslating ? (
            <p className="preview-status" role="status">
              <span className="text-shimmer">{copy.chat.translating}</span>
            </p>
          ) : null}
          <div className="instrument-well editor-preview-stage">
            {previewIsEmpty ? (
              <div className={`preview-plate preview-plate--${project.shared.templateKey}`}>
                <EmptyState
                  className="empty--on-paper"
                  icon={<FileText size={18} aria-hidden="true" />}
                  title={copy.chat.previewEmptyTitle}
                  body={copy.chat.previewEmptyBody}
                />
              </div>
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
          <motion.div key="export-dialog" className="dialog-overlay export-overlay">
            <motion.button
              type="button"
              className="dialog-scrim export-scrim"
              aria-label={copy.chat.closeExport}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: motionEase }}
              onClick={closeExport}
            />
            <motion.div
              ref={exportModalRef}
              className="dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="export-dialog-title"
              aria-describedby="export-dialog-description"
              tabIndex={-1}
              initial={reduced ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.22, ease: motionEase }}
            >
              <header className="dialog-header">
                <div>
                  <h2 id="export-dialog-title" className="dialog-title">{copy.chat.exportTitle}</h2>
                  <p id="export-dialog-description" className="dialog-description">{copy.chat.exportBody}</p>
                </div>
              </header>
              <div className="separator" />
              <div className="dialog-body">
                <fieldset className="field-set">
                  <legend className="field-legend">{copy.exportDialog.formatTitle}</legend>
                  <p className="field-description">{copy.chat.exportNotes.format}</p>
                  <SegmentedControl
                    ariaLabel={copy.chat.exportFormatLabel}
                    value={exportFormat === "docx" ? "docx" : "pdf"}
                    onChange={setExportFormat}
                    options={[
                      { value: "pdf", label: copy.exportDialog.formatPdf },
                      { value: "docx", label: copy.exportDialog.formatDocx },
                    ]}
                  />
                </fieldset>
                <fieldset className="field-set">
                  <legend className="field-legend">{copy.exportDialog.languageTitle}</legend>
                  <p className="field-description">{copy.chat.exportNotes.language}</p>
                  <SegmentedControl
                    ariaLabel={copy.chat.exportLanguageLabel}
                    value={exportLanguage}
                    onChange={setExportLanguage}
                    options={[
                      { value: "active", label: copy.exportDialog.languageActive },
                      { value: "both", label: copy.exportDialog.languageBoth },
                    ]}
                  />
                </fieldset>
              </div>
              <div className="separator" />
              <footer className="dialog-footer">
                <button type="button" className="button-secondary" onClick={closeExport} disabled={isExporting}>
                  {copy.common.cancel}
                </button>
                <button type="button" className="button-primary" onClick={() => void handleExport()} disabled={isExporting}>
                  {isExporting ? copy.common.loadingExport : copy.chat.exportConfirm}
                </button>
              </footer>
              <button type="button" className="app-icon-button dialog-close" onClick={closeExport} disabled={isExporting} aria-label={copy.chat.closeExport}>
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
