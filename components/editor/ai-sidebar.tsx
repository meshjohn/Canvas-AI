"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
import {
  Bot,
  X,
  Send,
  FileText,
  Download,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEventListener,
  useUpdateMyPresence,
  useFeedMessages,
  useCreateFeed,
  useCreateFeedMessage,
  useSelf,
  useStorage,
} from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  AiStatusFeedMessageSchema,
  ChatFeedMessageSchema,
} from "@/types/tasks";
import { cn } from "@/lib/utils";

const FEED_ID = "ai-status-feed";
const CHAT_FEED_ID = "ai-chat";

const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "TIMED_OUT",
  "INTERRUPTED",
  "SYSTEM_ERROR",
  "INVALID_PAYLOAD",
  "EXPIRED",
  "ABORTED",
] as const;

// Non-terminal states that indicate an issue
const STUCK_STATUSES = ["PENDING_VERSION", "PENDING_ENVIRONMENT"] as const;

interface SpecItem {
  id: string;
  filePath: string;
  createdAt: string;
}

function getFilename(filePath: string): string {
  const clean = filePath.split("?")[0];
  return clean.split("/").at(-1) ?? "spec.md";
}

function formatSpecDate(date: string): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RunTrackerProps {
  runId: string;
  publicToken: string;
  onTerminal: (status: string, output: unknown) => void;
}

function RunTracker({ runId, publicToken, onTerminal }: RunTrackerProps) {
  const { run, error } = useRealtimeRun(runId, { accessToken: publicToken });
  const firedRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    console.log(
      "[RunTracker] Status update - run:",
      run?.id,
      "status:",
      run?.status,
      "error:",
      error,
    );
  }, [run?.status, run?.id, error]);

  useEffect(() => {
    if (!run || firedRef.current) {
      console.log(
        "[RunTracker] Skipping - run exists:",
        !!run,
        "already fired:",
        firedRef.current,
      );
      return;
    }

    // Check if stuck in non-terminal state for too long (30 seconds)
    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    if (
      (STUCK_STATUSES as readonly string[]).includes(run.status) &&
      elapsedSeconds > 30
    ) {
      console.warn(
        "[RunTracker] Run stuck in",
        run.status,
        "for",
        elapsedSeconds,
        "seconds - timing out",
      );
      firedRef.current = true;
      onTerminal("FAILED", { error: `Run stuck in ${run.status} state` });
      return;
    }

    if (!(TERMINAL_STATUSES as readonly string[]).includes(run.status)) {
      console.log(
        "[RunTracker] Not terminal yet:",
        run.status,
        `(${elapsedSeconds.toFixed(1)}s)`,
      );
      return;
    }
    console.log(
      "[RunTracker] Terminal status reached:",
      run.status,
      "output:",
      run.output,
    );
    firedRef.current = true;
    onTerminal(run.status, run.output);
  }, [run?.status, run?.id, onTerminal]);

  return null;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  projectId: string;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AiSidebar({
  isOpen,
  onClose,
  roomId,
  projectId,
}: AiSidebarProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Spec state
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<SpecItem | null>(null);
  const [specContent, setSpecContent] = useState<string | null>(null);
  const [specContentLoading, setSpecContentLoading] = useState(false);
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [isSpecGenerating, setIsSpecGenerating] = useState(false);
  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null);
  const [specError, setSpecError] = useState<string | null>(null);

  // Canvas storage for spec generation context
  // useStorage immutably serializes LiveMap as a plain readonly object, so use Object.values
  const nodesArray = useStorage((root) => {
    const m = root.flow?.nodes;
    return m ? Object.values(m) : [];
  });
  const edgesArray = useStorage((root) => {
    const m = root.flow?.edges;
    return m ? Object.values(m) : [];
  });

  const self = useSelf();
  const updateMyPresence = useUpdateMyPresence();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const { messages: feedMessages } = useFeedMessages(FEED_ID);
  const { messages: chatFeedMessages } = useFeedMessages(CHAT_FEED_ID);

  // Ensure both feeds exist on mount
  useEffect(() => {
    createFeed(FEED_ID).catch(() => {});
    createFeed(CHAT_FEED_ID).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSpecs = useCallback(() => {
    setSpecsLoading(true);
    fetch(`/api/projects/${projectId}/specs`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) =>
        setSpecs(Array.isArray(data) ? (data as SpecItem[]) : []),
      )
      .catch(() => setSpecs([]))
      .finally(() => setSpecsLoading(false));
  }, [projectId]);

  // Fetch specs when sidebar opens
  useEffect(() => {
    if (!isOpen) return;
    fetchSpecs();
  }, [isOpen, fetchSpecs]);

  const handleSpecRunTerminal = useCallback(
    (status: string) => {
      console.log("[Spec] Run terminal status:", status);
      setIsSpecGenerating(false);
      setSpecRunId(null);
      setSpecPublicToken(null);
      setSpecError(null);
      if (status === "COMPLETED") {
        console.log("[Spec] Spec generation completed, fetching specs...");
        fetchSpecs();
      } else if (status !== "COMPLETED") {
        console.warn("[Spec] Spec generation failed with status:", status);
        setSpecError(`Spec generation failed: ${status}`);
      }
    },
    [fetchSpecs],
  );

  const handleRunTerminal = useCallback(
    (status: string, output: unknown) => {
      const isSuccess = status === "COMPLETED";
      const typedOutput = output as { summary?: string } | undefined;
      const content = isSuccess
        ? (typedOutput?.summary ?? "Design applied to canvas.")
        : "Ghost AI encountered an error. Please try again.";

      createFeedMessage(CHAT_FEED_ID, {
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      createFeedMessage(FEED_ID, {
        text: content,
        status: isSuccess ? "complete" : "error",
      }).catch(() => {});

      setIsLoading(false);
      setStatusText("");
      setRunId(null);
      setPublicToken(null);
      updateMyPresence({ thinking: false });
    },
    [createFeedMessage, updateMyPresence],
  );

  // Latest validated feed message for the status strip fallback
  const latestFeedMessage = (() => {
    if (!feedMessages?.length) return null;
    const sorted = [...feedMessages].sort((a, b) => b.createdAt - a.createdAt);
    const msgData = sorted[0].data ?? sorted[0];
    const parsed = AiStatusFeedMessageSchema.safeParse(msgData);
    return parsed.success ? parsed.data : null;
  })();

  // Validated chat messages from the ai-chat feed, in chronological order
  const validatedChatMessages = (chatFeedMessages ?? [])
    .map((msg) => {
      const msgData = msg.data ?? msg;
      const parsed = ChatFeedMessageSchema.safeParse(msgData);
      if (!parsed.success) return null;
      return { id: msg.id, createdAt: msg.createdAt, ...parsed.data };
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
    .sort((a, b) => a.createdAt - b.createdAt);

  const handleGenerateSpec = useCallback(async () => {
    if (isSpecGenerating) return;
    setIsSpecGenerating(true);
    setSpecError(null);

    const nodes = nodesArray ?? [];
    const edges = edgesArray ?? [];
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log("[Spec] Starting spec generation...", {
      roomId,
      nodes: nodes.length,
      edges: edges.length,
      chatMessages: chatHistory.length,
    });

    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory, nodes, edges }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API failed: ${res.status} ${errorText}`);
      }
      const data = (await res.json()) as { runId: string };
      console.log("[Spec] Got runId:", data.runId);

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: data.runId }),
      });
      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Token failed: ${tokenRes.status} ${errorText}`);
      }
      const tokenData = (await tokenRes.json()) as { token: string };
      console.log("[Spec] Got token, monitoring run...");

      setSpecRunId(data.runId);
      setSpecPublicToken(tokenData.token);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Spec] Error:", errorMsg);
      setSpecError(errorMsg);
      setIsSpecGenerating(false);
    }
  }, [isSpecGenerating, roomId, nodesArray, edgesArray, validatedChatMessages]);

  // Receive broadcast status events for real-time strip text
  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return;
    setStatusText(event.message);
  });

  // Scroll both tabs to bottom when messages update
  useEffect(() => {
    // Find the scrollable viewport inside ScrollArea
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
    if (chatScrollRef.current) {
      const viewport = chatScrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [validatedChatMessages.length]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const ta = e.target;
      ta.style.height = "72px";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    },
    [],
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);
    updateMyPresence({ thinking: true });

    if (textareaRef.current) {
      textareaRef.current.style.height = "72px";
    }

    // Push user message to shared ai-chat feed
    createFeedMessage(CHAT_FEED_ID, {
      sender: self?.info?.name ?? "Unknown",
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    // Write initial status to ai-status-feed
    createFeedMessage(FEED_ID, {
      text: "Ghost AI is analyzing your request…",
      status: "start",
    }).catch(() => {});

    setStatusText("Ghost AI is analyzing your request…");

    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId }),
      });

      if (!designRes.ok) throw new Error("Design request failed");

      const { runId: newRunId } = (await designRes.json()) as { runId: string };

      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });

      if (!tokenRes.ok) throw new Error("Token request failed");

      const { token } = (await tokenRes.json()) as { token: string };

      setRunId(newRunId);
      setPublicToken(token);
    } catch {
      createFeedMessage(CHAT_FEED_ID, {
        sender: "Ghost AI",
        role: "assistant",
        content: "Failed to reach Ghost AI. Please try again.",
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      createFeedMessage(FEED_ID, {
        text: "Ghost AI encountered an error.",
        status: "error",
      }).catch(() => {});

      setIsLoading(false);
      setStatusText("");
      updateMyPresence({ thinking: false });
    }
  }, [
    input,
    isLoading,
    roomId,
    projectId,
    updateMyPresence,
    createFeedMessage,
    self,
  ]);

  const handleCancelRun = useCallback(async () => {
    if (!runId) return;
    try {
      await fetch("/api/ai/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      setIsLoading(false);
      setStatusText("Canceled by user");
      setRunId(null);
      setPublicToken(null);
      updateMyPresence({ thinking: false });
      
      createFeedMessage(CHAT_FEED_ID, {
        sender: "Ghost AI",
        role: "assistant",
        content: "Generation canceled.",
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  }, [runId, updateMyPresence, createFeedMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleChip = useCallback((chip: string) => {
    setInput(chip);
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      textareaRef.current.focus();
    }
  }, []);

  const handleChatInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setChatInput(e.target.value);
      const ta = e.target;
      ta.style.height = "72px";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    },
    [],
  );

  const handleChatSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatError(null);

    try {
      await createFeedMessage(CHAT_FEED_ID, {
        sender: self?.info?.name ?? "Unknown",
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      });
      setChatInput("");
      if (chatTextareaRef.current) {
        chatTextareaRef.current.style.height = "72px";
      }
    } catch {
      setChatError("Failed to send message. Please try again.");
    }
  }, [chatInput, createFeedMessage, self]);

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
      }
    },
    [handleChatSend],
  );

  const handleSpecClick = useCallback(
    async (spec: SpecItem) => {
      setSelectedSpec(spec);
      setSpecContent(null);
      setSpecContentLoading(true);
      setSpecModalOpen(true);

      try {
        const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}`);
        if (!res.ok) throw new Error("Failed to fetch spec");
        const text = await res.text();
        setSpecContent(text);
      } catch {
        setSpecContent(null);
      } finally {
        setSpecContentLoading(false);
      }
    },
    [projectId],
  );

  const handleSpecDownload = useCallback(
    (specId: string) => {
      const a = document.createElement("a");
      a.href = `/api/projects/${projectId}/specs/${specId}/download`;
      a.download = `spec-${specId}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [projectId],
  );

  const handleModalClose = useCallback(() => {
    setSpecModalOpen(false);
    setSelectedSpec(null);
    setSpecContent(null);
  }, []);

  const activeStatusText =
    statusText || (isLoading ? (latestFeedMessage?.text ?? "") : "");

  return (
    <>
      {runId && publicToken && (
        <RunTracker
          runId={runId}
          publicToken={publicToken}
          onTerminal={handleRunTerminal}
        />
      )}
      {specRunId && specPublicToken && (
        <RunTracker
          runId={specRunId}
          publicToken={specPublicToken}
          onTerminal={handleSpecRunTerminal}
        />
      )}

      {/* Spec preview modal */}
      <Dialog
        open={specModalOpen}
        onOpenChange={(open) => {
          if (!open) handleModalClose();
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-xl sm:max-w-2xl border-border-default bg-bg-surface w-[calc(100%-1rem)]"
        >
          <DialogHeader>
            <DialogTitle className="pr-4 sm:pr-6 text-xs sm:text-sm font-medium text-text-primary truncate">
              {selectedSpec
                ? getFilename(selectedSpec.filePath)
                : "Spec Preview"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] sm:max-h-[60vh] rounded-lg sm:rounded-xl border border-border-subtle bg-bg-elevated">
            <div className="p-2 sm:p-4">
              {specContentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : specContent ? (
                <div
                  className={cn(
                    "text-xs sm:text-sm text-text-secondary leading-relaxed",
                    "[&_h1]:text-sm sm:[&_h1]:text-base [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mb-2 sm:[&_h1]:mb-3 [&_h1]:mt-0",
                    "[&_h2]:text-xs sm:[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mb-1.5 sm:[&_h2]:mb-2 [&_h2]:mt-2 sm:[&_h2]:mt-4",
                    "[&_h3]:text-[11px] sm:[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-text-secondary [&_h3]:mb-1 sm:[&_h3]:mb-1.5 [&_h3]:mt-2 sm:[&_h3]:mt-3",
                    "[&_p]:mb-1.5 sm:[&_p]:mb-2 [&_p]:leading-relaxed",
                    "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-1.5 sm:[&_ul]:mb-2",
                    "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-1.5 sm:[&_ol]:mb-2",
                    "[&_li]:mb-0.5 sm:[&_li]:mb-1",
                    "[&_code]:font-mono [&_code]:text-[10px] sm:[&_code]:text-xs [&_code]:bg-bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent-ai-text",
                    "[&_pre]:bg-bg-subtle [&_pre]:p-2 sm:[&_pre]:p-3 [&_pre]:rounded-lg sm:[&_pre]:rounded-xl [&_pre]:mb-2 [&_pre]:overflow-x-auto",
                    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                    "[&_strong]:font-semibold [&_strong]:text-text-primary",
                    "[&_blockquote]:border-l-2 [&_blockquote]:border-border-subtle [&_blockquote]:pl-2 sm:[&_blockquote]:pl-3 [&_blockquote]:text-text-muted [&_blockquote]:italic",
                  )}
                >
                  <ReactMarkdown>{specContent}</ReactMarkdown>
                </div>
              ) : (
                <p className="py-8 text-center text-[10px] sm:text-xs text-text-muted">
                  Failed to load spec content.
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end border-t border-border-default pt-2 sm:pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                selectedSpec && handleSpecDownload(selectedSpec.id)
              }
              className="h-7 sm:h-8 gap-1 sm:gap-1.5 rounded-lg border-border-subtle px-2 sm:px-3 text-[11px] sm:text-xs text-text-secondary hover:border-border-default hover:text-text-primary touch-target"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-bg-base/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-12 sm:inset-y-14 right-2 sm:right-3 top-14 sm:top-14 z-40 flex w-[calc(100%-1rem)] sm:w-96 flex-col rounded-2xl sm:rounded-3xl border border-border-subtle bg-bg-surface/85 backdrop-blur-2xl transition-all duration-300 shadow-[0_0_50px_-12px_rgba(0,0,0,0.85)] shadow-accent-ai/3 overflow-hidden",
          isOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+0.5rem)] sm:translate-x-[calc(100%+1rem)] opacity-0 pointer-events-none",
        )}
      >
        {/* Neon Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-ai/40 to-accent-ai opacity-90 z-10" />

        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 border-b border-border-default/60 px-3 sm:px-5 py-3 sm:py-4 relative">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15 shadow-[0_0_12px_rgba(100,87,249,0.15)] relative overflow-hidden group">
            <Bot className="h-4.5 w-4.5 text-accent-ai-text group-hover:scale-110 transition-transform" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold tracking-wider text-text-primary uppercase flex items-center gap-1.5">
              <span>AI Workspace</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent-ai shadow-[0_0_6px_var(--color-accent-ai)] animate-pulse" />
            </p>
            <p className="text-[10px] sm:text-xs text-text-muted">Collaborate with Ghost AI</p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1 rounded-full bg-accent-ai/15 px-2.5 py-0.5 text-[9px] sm:text-[10px] text-accent-ai-text border border-accent-ai/20 shadow-[0_0_8px_rgba(100,87,249,0.1)]">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              <span className="hidden sm:inline font-medium">Thinking</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary touch-target cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="architect"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <TabsList className="mx-2 sm:mx-4 mt-2 sm:mt-3 h-auto shrink-0 rounded-xl bg-bg-subtle/50 p-1 border border-border-default/45">
            <TabsTrigger
              value="architect"
              className="flex-1 rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 data-[state=active]:bg-bg-surface data-[state=active]:text-accent-ai-text data-[state=active]:shadow-sm cursor-pointer"
            >
              <span className="hidden sm:inline">AI Architect</span>
              <span className="sm:hidden">Architect</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex-1 rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 data-[state=active]:bg-bg-surface data-[state=active]:text-accent-ai-text data-[state=active]:shadow-sm cursor-pointer"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 data-[state=active]:bg-bg-surface data-[state=active]:text-accent-ai-text data-[state=active]:shadow-sm cursor-pointer"
            >
              Specs
            </TabsTrigger>
          </TabsList>

          {/* AI Architect Tab */}
          <TabsContent
            value="architect"
            className="min-h-0 flex-1 overflow-hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-hidden" ref={scrollRef}>
                <ScrollArea className="h-full">
                  <div className="px-4 pt-3 pb-2">
                    {validatedChatMessages.length === 0 ? (
                      <div className="flex flex-col items-center gap-6 py-10 text-center relative overflow-hidden px-4">
                        <div className="absolute inset-0 bg-radial from-accent-ai/5 to-transparent pointer-events-none opacity-50 blur-xl" />
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-ai/10 border border-accent-ai/20 shadow-[0_0_20px_rgba(100,87,249,0.15)] relative z-10" style={{ animation: "subtleFloat 3s ease-in-out infinite" }}>
                          <Bot className="h-7 w-7 text-accent-ai-text" />
                        </div>
                        <div className="relative z-10">
                          <p className="text-sm font-semibold tracking-wide text-text-primary uppercase">
                            AI Architect
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-text-muted max-w-[240px]">
                            Describe your system, and I'll generate the nodes and edges on the canvas.
                          </p>
                        </div>
                        <div className="flex w-full flex-col gap-2 relative z-10">
                          {STARTER_CHIPS.map((chip) => (
                            <button
                              key={chip}
                              onClick={() => handleChip(chip)}
                              className="w-full rounded-full bg-bg-surface border border-border-default/80 px-4 py-2 text-left text-xs text-accent-ai-text transition-all duration-300 hover:border-accent-ai/40 hover:bg-accent-ai/5 hover:text-white cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 pb-2">
                        {validatedChatMessages.map((msg) =>
                          msg.role === "assistant" ? (
                            <div
                              key={msg.id}
                              className="flex justify-start gap-2.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                            >
                              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-ai/15 shadow-[0_0_8px_rgba(100,87,249,0.1)] border border-accent-ai/10">
                                <Bot className="h-3 w-3 text-accent-ai-text animate-pulse" />
                              </div>
                              <div className={cn(
                                "max-w-[85%] rounded-2xl rounded-tl-none border border-accent-ai/15 bg-accent-ai/5 backdrop-blur-sm px-4 py-2.5 text-sm text-text-primary leading-relaxed shadow-[0_2px_12px_rgba(0,0,0,0.2)] select-text",
                                "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:font-mono [&_code]:text-accent-ai-text [&_code]:bg-bg-subtle/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-bg-subtle/60 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border-default/40 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:text-text-primary [&_pre_code]:bg-transparent [&_pre_code]:p-0"
                              )}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          ) : (
                            <div key={msg.id} className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                              <div
                                className="max-w-[85%] rounded-2xl rounded-tr-none px-4 py-2.5 text-sm font-medium text-bg-base bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_2px_10px_rgba(52,211,153,0.15)] leading-relaxed select-text"
                              >
                                {msg.content}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Status strip — only visible while a run is active */}
              {isLoading && activeStatusText && (
                <div className="mx-3 mb-2 flex items-center justify-between rounded-xl border border-accent-ai/25 bg-accent-ai/10 backdrop-blur-md px-3.5 py-2.5 text-xs text-accent-ai-text shadow-[0_0_12px_rgba(100,87,249,0.1)] relative overflow-hidden animate-in fade-in-0 duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-ai/5 via-transparent to-transparent animate-pulse" />
                  <div className="flex items-center gap-2.5 relative z-10 min-w-0">
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent-ai-text" />
                    <span className="truncate font-medium">{activeStatusText}</span>
                  </div>
                  {runId && (
                    <button
                      onClick={handleCancelRun}
                      className="ml-2 shrink-0 rounded px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer relative z-10"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}

              {/* Input area */}
              <div className="shrink-0 border-t border-border-default/60 p-2 sm:p-3 bg-bg-surface/50 backdrop-blur-sm">
                <div className="flex flex-col gap-2 rounded-xl sm:rounded-2xl border border-border-default/80 bg-bg-elevated p-2 focus-within:border-accent-ai/50 focus-within:ring-1 focus-within:ring-accent-ai/20 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your system…"
                    disabled={isLoading}
                    style={{ height: "72px", maxHeight: "160px" }}
                    className="resize-none overflow-y-auto border-0 bg-transparent p-1 sm:p-2 text-xs sm:text-sm text-text-primary shadow-none placeholder:text-text-faint/80 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-border-default/40 pt-1.5 mt-0.5">
                    <span className="text-[9px] sm:text-[10px] text-text-faint hidden sm:inline select-none">
                      Shift+Enter for newline
                    </span>
                    <Button
                      size="sm"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="h-8 sm:h-7.5 gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-4 text-xs font-semibold text-bg-base hover:opacity-90 disabled:opacity-30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md bg-gradient-to-r from-accent-ai-text to-accent-ai hover:shadow-[0_2px_8px_rgba(100,87,249,0.2)]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">{isLoading ? "Thinking…" : "Send"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-hidden" ref={chatScrollRef}>
                <ScrollArea className="h-full">
                  <div className="px-4 pt-3 pb-2">
                    {validatedChatMessages.length === 0 ? (
                      <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-subtle border border-border-default/60">
                          <MessageSquare className="h-5 w-5 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold tracking-wider text-text-primary uppercase">
                            Room Chat
                          </p>
                          <p className="mt-1.5 text-xs text-text-muted max-w-[200px] leading-relaxed">
                            No messages yet. Start the conversation with collaborators!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5 pb-2">
                        {validatedChatMessages.map((msg) => {
                          const isMe =
                            msg.role === "user" &&
                            msg.sender === self?.info?.name;
                          const isAI = msg.role === "assistant";
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex flex-col gap-0.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                                isMe ? "items-end" : "items-start",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 text-[10px] text-text-faint font-medium",
                                  isMe && "flex-row-reverse",
                                )}
                              >
                                <span className={cn("font-medium", isMe ? "text-accent-primary" : isAI ? "text-accent-ai-text" : "text-text-muted")}>
                                  {isAI ? "Ghost AI" : msg.sender}
                                </span>
                                <span>{formatTime(msg.createdAt)}</span>
                              </div>
                              <div
                                className={cn(
                                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed select-text",
                                  isMe
                                    ? "rounded-tr-none font-medium text-bg-base bg-gradient-to-br from-accent-primary to-accent-primary/80 shadow-[0_2px_8px_rgba(0,200,212,0.15)]"
                                    : isAI
                                      ? "rounded-tl-none border border-accent-ai/15 bg-accent-ai/5 backdrop-blur-sm text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                                      : "rounded-tl-none border border-border-default/80 bg-bg-elevated/80 text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
                                  isAI && "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:font-mono [&_code]:text-accent-ai-text [&_code]:bg-bg-subtle/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-bg-subtle/60 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border-default/40 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:text-text-primary [&_pre_code]:bg-transparent [&_pre_code]:p-0"
                                )}
                              >
                                {isAI ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Error state */}
              {chatError && (
                <div className="mx-3 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {chatError}
                </div>
              )}

              {/* Input area */}
              <div className="shrink-0 border-t border-border-default/60 p-2 sm:p-3 bg-bg-surface/50 backdrop-blur-sm">
                <div className="flex flex-col gap-2 rounded-xl sm:rounded-2xl border border-border-default/80 bg-bg-elevated p-2 focus-within:border-accent-ai/50 focus-within:ring-1 focus-within:ring-accent-ai/20 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                  <Textarea
                    ref={chatTextareaRef}
                    value={chatInput}
                    onChange={handleChatInputChange}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Send a message…"
                    style={{ height: "72px", maxHeight: "160px" }}
                    className="resize-none overflow-y-auto border-0 bg-transparent p-1 sm:p-2 text-xs sm:text-sm text-text-primary shadow-none placeholder:text-text-faint/80 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-border-default/40 pt-1.5 mt-0.5">
                    <span className="text-[9px] sm:text-[10px] text-text-faint hidden sm:inline select-none">
                      Shift+Enter for newline
                    </span>
                    <Button
                      size="sm"
                      onClick={handleChatSend}
                      disabled={!chatInput.trim()}
                      className="h-8 sm:h-7.5 gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-4 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md bg-accent-ai hover:bg-accent-ai/90 hover:shadow-[0_2px_8px_rgba(100,87,249,0.2)]"
                    >
                      <Send className="h-3 w-3" />
                      <span className="hidden sm:inline">Send</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Specs Tab */}
          <TabsContent value="specs" className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full flex-col gap-2 sm:gap-3 p-2 sm:p-4">
              <Button
                onClick={() => {
                  console.log(
                    "[Specs] Generate clicked, isSpecGenerating:",
                    isSpecGenerating,
                    "specRunId:",
                    specRunId,
                  );
                  handleGenerateSpec();
                }}
                disabled={isSpecGenerating || !!specRunId}
                className="w-full rounded-xl bg-gradient-to-r from-accent-ai to-accent-ai/80 text-white font-semibold hover:opacity-90 disabled:opacity-50 shadow-[0_4px_12px_rgba(100,87,249,0.15)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-xs sm:text-sm h-10 shrink-0"
              >
                {isSpecGenerating ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 animate-spin" />
                    Generating Spec…
                  </>
                ) : specRunId ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 animate-spin" />
                    Monitoring Run…
                  </>
                ) : (
                  "Generate Specification"
                )}
              </Button>

              {specRunId && !isSpecGenerating && (
                <div className="flex items-center justify-between rounded-lg border border-accent-ai/30 bg-accent-ai/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-accent-ai-text shrink-0 animate-in fade-in-0 duration-300">
                  <span className="font-semibold">Run: {specRunId.slice(-8)}</span>
                  <button
                    onClick={() => {
                      setSpecRunId(null);
                      setSpecPublicToken(null);
                      console.log("[Specs] Reset run state");
                    }}
                    className="text-accent-ai-text hover:text-accent-ai font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {specError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-red-400 shrink-0 animate-in fade-in-0 duration-300">
                  <div className="flex-1">
                    <p className="font-bold">Error:</p>
                    <p className="mt-0.5 leading-relaxed">{specError}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSpecError(null);
                      setIsSpecGenerating(false);
                      setSpecRunId(null);
                      setSpecPublicToken(null);
                      console.log("[Specs] Reset error state");
                    }}
                    className="shrink-0 text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {specsLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : specs.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                  <FileText className="h-8 w-8 text-text-faint" />
                  <p className="text-[10px] sm:text-xs text-text-muted leading-relaxed">
                    No specifications generated yet. Click the button above to start!
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-1">
                  <div className="flex flex-col gap-2 pb-2">
                    {specs.map((spec) => (
                      <div
                        key={spec.id}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border-default/80 bg-bg-elevated/50 hover:bg-bg-subtle/50 px-3 py-2.5 transition-all duration-200 hover:border-accent-ai/30 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_12px_rgba(100,87,249,0.05)] touch-target relative overflow-hidden"
                        onClick={() => handleSpecClick(spec)}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-subtle border border-border-default/60 group-hover:border-accent-ai/30 group-hover:bg-accent-ai/10 transition-colors">
                          <FileText className="h-4 w-4 text-text-muted group-hover:text-accent-ai-text transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-text-primary group-hover:text-accent-ai-text transition-colors">
                            {getFilename(spec.filePath)}
                          </p>
                          <p className="text-[10px] text-text-faint mt-0.5">
                            {formatSpecDate(spec.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpecDownload(spec.id);
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-faint opacity-0 group-hover:opacity-100 transition-all hover:bg-bg-subtle hover:text-text-primary touch-target cursor-pointer scale-90 hover:scale-100"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}
