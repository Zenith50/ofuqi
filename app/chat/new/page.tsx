"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Download, Globe2, Languages, LayoutTemplate } from "lucide-react";
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
  createTranslationCacheEntry,
  normalizeCvData,
  normalizeCvPatch,
  readFreshTranslationCache,
  type TranslationCacheEntry,
} from "@/lib/cv/validation";
import { createWorkspaceSessionFromProject, type WorkspaceSessionState } from "@/lib/cv/studioData";
import {
  buildWorkspaceHref,
  createStarterCvProject,
  convexRowToProject,
  resolveLegacyDraftRoute,
  resolveCvProjectTemplateKey,
  type DemoCvProject,
} from "@/lib/cv/projects";
import { deepMerge } from "@/lib/cv/workspace";

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
    [callback, delay]
  );
}

function isAssistantUpdate(value: unknown): value is { _ofuqi_action: "update"; data: unknown } {
  return (
    value !== null &&
    typeof value === "object" &&
    "_ofuqi_action" in value &&
    (value as { _ofuqi_action?: unknown })._ofuqi_action === "update" &&
    "data" in value
  );
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
  const [translationCache, setTranslationCache] = useState<TranslationCacheEntry | null>(null);
  const [previewMode, setPreviewMode] = useState<"source" | "translation">("source");
  const [composerValue, setComposerValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Export states
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormatChoice>("pdf");
  const [exportLanguage, setExportLanguage] = useState<ExportLanguageChoice>("active");
  const [isExporting, setIsExporting] = useState(false);
  const exportModalRef = useRef<HTMLElement | null>(null);
  const exportTriggerRef = useRef<HTMLElement | null>(null);

  // 4. Initialization Logic
  const createAttempted = useRef(false);
  const loadedProjectId = useRef<string | null>(null);

  // Capture locale at mount time for use in init logic without adding it as a dependency
  const initLocaleRef = useRef(locale);

  useEffect(() => {
    // A: If we are asking for a specific project, wait until Convex loads it
    if (urlProjectId) {
      if (rawProject && loadedProjectId.current !== rawProject._id) {
        loadedProjectId.current = rawProject._id;
        const mapped = convexRowToProject(rawProject);
        
        setProject(mapped);
        setSession(createWorkspaceSessionFromProject(mapped));
        const targetLanguage = mapped.variant.language === "en" ? "ar" : "en";
        const freshCache = readFreshTranslationCache(mapped.translationCache, mapped.variant, targetLanguage);
        setTranslationCache(freshCache ? createTranslationCacheEntry(mapped.variant, freshCache) : null);
        setNotice(getCopy(initLocaleRef.current).chat.loadedDraft.replace("{name}", mapped.variant.personal.fullName));
      } else if (rawProject === null && loadedProjectId.current === null && user) {
        // Project doesn't exist or not owned by user
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
      }).then((newId) => {
        router.replace(buildWorkspaceHref({ projectId: newId }));
      });
    }
  }, [urlProjectId, rawProject, user, selectedTemplateKey, requestedDraftLanguage, createProjectMutation, router]);

  // Composer setup
  const composer = useCharacterLimit({
    maxLength: 320,
    value: composerValue,
    onValueChange: setComposerValue,
  });
  const { characterCount, handleChange: handleComposerChange, maxLength, tone: composerTone } = composer;

  // 5. Autosave Implementation
  const debouncedSave = useDebounce(
    (projectId: Id<"cvProjects">, variant: CvData, sessionState: WorkspaceSessionState, newCache?: TranslationCacheEntry | null) => {
      setSaveStatus("saving");
      saveProjectStateMutation({
        projectId,
        variant: variant,
        conversation: {
          messages: sessionState.messages,
          historyItems: sessionState.historyItems,
        },
        translationCache: newCache ?? null,
      })
        .catch(() => console.error("Autosave failed"))
        .finally(() => {
          setTimeout(() => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          }, 500); // Artificial minimum delay so the "Saving..." flash is visible
        });
    },
    800
  );

  const [isStreaming, setIsStreaming] = useState(false);

  // Auto-scroll ref and effect for chat thread (Bug #4 fix)
  const threadRef = useRef<HTMLDivElement>(null);

  const messageCount = session?.messages.length ?? 0;
  const latestMessageBody = session?.messages[messageCount - 1]?.body ?? "";

  useEffect(() => {
    if (!exportOpen) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    exportTriggerRef.current = previousActiveElement;
    exportModalRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExporting) {
        setExportOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      exportTriggerRef.current?.focus();
      exportTriggerRef.current = null;
    };
  }, [exportOpen, isExporting]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || !session) return;
    const msgs = session.messages;
    if (!msgs || msgs.length === 0) return;
    // Only auto-scroll if user is near bottom (within 150px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [latestMessageBody, messageCount, session]);

  const applyInstruction = async (rawInstruction: string) => {
    if (!project || !session || isStreaming) return;
    
    const instruction = rawInstruction.trim();
    const draftLanguage = session.draftData.language;
    const draftCopy = getCopy(draftLanguage);

    if (!instruction) {
      setNotice(draftCopy.chat.emptyMessage);
      return;
    }

    setComposerValue("");
    setIsStreaming(true);

    const tempUserMessage = { role: "user" as const, body: instruction, language: session.draftData.language, timestamp: Date.now() };
    const messagesToSend = [...session.messages.map(m => ({ role: m.role, content: m.body })), { role: "user", content: instruction }];
    
    const tempSessionState = {
      ...session,
      messages: [...session.messages, tempUserMessage],
    };
    
    setSession((current) => current ? tempSessionState : current);

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

      if (!response.ok || !response.body) {
        let errStr = "Failed to connect to AI";
        try {
          const errBody = await response.json();
          if (errBody.error) errStr = errBody.error;
        } catch {}
        throw new Error(errStr);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantBody = "";
      
      const startAssistantMsg = { role: "assistant" as const, body: "", language: session.draftData.language, timestamp: Date.now() };
      
      setSession((current) => {
        if (!current) return current;
        return {
          ...tempSessionState,
          messages: [...tempSessionState.messages, startAssistantMsg]
        };
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantBody += decoder.decode(value, { stream: true });
        
        setSession((current) => {
          if (!current) return current;
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

      // Stream done - check for JSON patches
      let finalDraftData = tempSessionState.draftData;
      let finalHistoryItems = tempSessionState.historyItems;
      let cleanedAssistantBody = assistantBody;

      const jsonMatch = assistantBody.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
      if (jsonMatch) {
         try {
           const parsed = JSON.parse(jsonMatch[1]) as unknown;
           if (isAssistantUpdate(parsed)) {
              const patch = normalizeCvPatch(parsed.data);
              if (!patch) {
                throw new Error("Invalid AI draft update");
              }
              finalDraftData = normalizeCvData(deepMerge(finalDraftData as Record<string, unknown>, patch as Record<string, unknown>)) ?? finalDraftData;
              cleanedAssistantBody = assistantBody.replace(jsonMatch[0], "").trim();
              finalHistoryItems = [draftCopy.chat.status.latestAction, ...tempSessionState.historyItems];
              setTranslationCache(null);
              setPreviewMode("source");
              setNotice(draftCopy.chat.previewUpdated);
           }
         } catch {
           // Ignore malformed json
         }
      }

      setSession((current) => {
         if (!current) return current;
         const newMessages = [...current.messages];
         newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            body: cleanedAssistantBody
         };
         
         const finalSession = {
            ...current,
            messages: newMessages,
            draftData: finalDraftData,
            historyItems: finalHistoryItems
         };
         
         debouncedSave(project.id as Id<"cvProjects">, finalSession.draftData, finalSession, null);
         
         return finalSession;
      });

    } catch (e) {
      console.error(e);
      setNotice(e instanceof Error ? e.message : copy.chat.exportError);
    } finally {
      setIsStreaming(false);
    }
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
    if (!res.ok) throw new Error("Translation failed");
    const translatedData = normalizeCvData(await res.json());
    if (!translatedData) throw new Error("Translation failed");

    return { data: translatedData, cache: createTranslationCacheEntry(sourceData, translatedData) };
  };

  const handleExport = async () => {
    if (!project || !session) return;
    try {
      setIsExporting(true);
      setExportOpen(false);

      const activeLang = session.draftData.language;
      const exportJobs = buildExportJobs(exportFormat, exportLanguage, activeLang);
      
      for (let i = 0; i < exportJobs.length; i++) {
        const job = exportJobs[i];
        let dataToExport = session.draftData;
        
        if (job.language !== activeLang) {
          if (exportJobs.length > 1) {
             setNotice((copy.chat.exportingProgress as string)
              .replace("{lang}", copy.dashboard.languageNames[job.language])
              .replace("{current}", String(i + 1))
              .replace("{total}", String(exportJobs.length)) + ` (${copy.chat.translating})`);
          } else {
             setNotice(`Translating to ${copy.dashboard.languageNames[job.language]}...`);
          }
          const translated = await fetchCachedOrNewTranslation(session.draftData, job.language);
          dataToExport = translated.data;
          setTranslationCache(translated.cache);
          debouncedSave(project.id as Id<"cvProjects">, session.draftData, session, translated.cache);
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

      setNotice(copy.chat.exportSuccess);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      setNotice(copy.chat.exportError);
      setTimeout(() => setNotice(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const handlePreviewToggle = async (mode: "source" | "translation") => {
    if (!project || !session) return;
    
    setPreviewMode(mode);
    
    if (mode === "translation") {
      const sourceData = session.draftData;
      const targetLang = sourceData.language === "en" ? "ar" : "en";
      
      try {
        setIsTranslating(true);
        // Only translate if we don't have a valid cache, or if it got cleared by an edit
        if (!readFreshTranslationCache(translationCache, sourceData, targetLang)) {
          setNotice(copy.chat.translating);
          
          setNotice(copy.chat.translating);
          const translated = await fetchCachedOrNewTranslation(sourceData, targetLang);
          setTranslationCache(translated.cache);
          debouncedSave(project.id as Id<"cvProjects">, sourceData, session, translated.cache);
          
          setNotice(copy.chat.translationComplete);
          setTimeout(() => setNotice(null), 3000);
        }
      } catch (error) {
        console.error("Translation failed:", error);
        setNotice(copy.chat.translationFailed);
        setTimeout(() => setNotice(null), 3000);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // If loading, show shimmer
  if (!project || !session) {
    return (
      <div className="editor-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TextShimmer>{copy.common.loadingWorkspace ?? "Loading workspace..."}</TextShimmer>
      </div>
    );
  }

  const draftCopy = getCopy(session.draftData.language);
  const targetTranslationLanguage = session.draftData.language === "en" ? "ar" : "en";
  const cachedTranslation = readFreshTranslationCache(translationCache, session.draftData, targetTranslationLanguage);
  const displayData = previewMode === "translation" && cachedTranslation ? cachedTranslation : session.draftData;
  const previewLocale = getGeneratorLocale(displayData.language);
  const activeTemplateName = copy.dashboard.templateNames[project.shared.templateKey];
  
  const sessionCards = [
    { label: copy.chat.status.currentLanguage, value: draftCopy.meta.languageName, icon: Languages, tone: "draft" },
    { label: copy.chat.status.interfaceLanguage, value: copy.meta.languageName, icon: Globe2, tone: "interface" },
    { label: copy.chat.status.template, value: activeTemplateName, icon: LayoutTemplate, tone: "template" },
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
                <span className="locale-toggle-label">
                  {copy.chat.previewTranslationLabel.replace("{lang}", copy.dashboard.languageNames[targetTranslationLanguage])}
                </span>
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
                    if (!isStreaming) applyInstruction(composerValue);
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
            <motion.div
              className="export-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isExporting) setExportOpen(false);
              }}
            />
            <motion.aside
              ref={exportModalRef}
              className="export-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="export-dialog-title"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div className="export-drawer-content">
                <header className="export-header">
                  <h2 id="export-dialog-title">{copy.chat.exportTitle}</h2>
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
