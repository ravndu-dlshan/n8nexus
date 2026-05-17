import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Rocket, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PublishResultPanel } from "@/components/chat/PublishResultPanel";
import { WorkflowOutputPanel } from "@/components/chat/WorkflowOutputPanel";
import { ApiError } from "@/lib/api/client";
import { streamSessionMessage } from "@/lib/api/chat";
import {
  deployWorkflow,
  generateWorkflow,
  syncWorkflowStatus,
  type WorkflowDeployResponse,
  type WorkflowStatus,
} from "@/lib/api/workflows";
import { asN8nWorkflow, type ChatMessage, type N8nWorkflow } from "@/types/chat";

const SUGGESTIONS = [
  "Automate invoice approval",
  "Create a lead follow-up workflow",
  "Set up employee onboarding automation",
  "Handle customer complaints and escalate urgent ones",
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm your N8Nexus AI assistant. Describe the business process you want to automate — for example lead capture, onboarding, or customer support — and I'll ask clarifying questions. When everything is confirmed, use **Generate Workflow** to download JSON or **Publish** to deploy to your n8n instance.",
};

export function ChatWorkspace() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [input, setInput] = useState("");
  const [ragMode, setRagMode] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);
  const [workflowSyncing, setWorkflowSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [workflow, setWorkflow] = useState<N8nWorkflow | null>(null);
  const [publishResult, setPublishResult] = useState<WorkflowDeployResponse | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const publishPanelRef = useRef<HTMLDivElement>(null);
  const workflowPanelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayMessages = messages.length > 0 ? messages : [];
  const hasChat = displayMessages.length > 0 || streaming || awaitingFirstToken;
  const busy = streaming || awaitingFirstToken || isGenerating || isPublishing;
  const readyToGenerate = workflowStatus?.ready ?? false;
  const missingFields =
    workflowStatus?.missing_fields.map((f) => workflowStatus.field_labels[f] ?? f) ?? [];

  const runWorkflowSync = (sid: string) => {
    setWorkflowSyncing(true);
    void syncWorkflowStatus(sid)
      .then((wf) => setWorkflowStatus(wf))
      .catch(() => {
        // Workflow panel can stay on last known state; chat reply is already shown.
      })
      .finally(() => setWorkflowSyncing(false));
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput("");
    setWorkflow(null);
    setPublishResult(null);

    const prev = messages;
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const withPlaceholder: ChatMessage[] = [
      ...prev,
      userMsg,
      { role: "assistant", content: "" },
    ];
    setMessages(withPlaceholder);
    setStreaming(true);
    setAwaitingFirstToken(true);

    let streamFailed = false;

    try {
      await streamSessionMessage(trimmed, sessionId ?? undefined, {
        onSession: (id) => {
          setSessionId(id);
        },
        onToken: (content) => {
          setAwaitingFirstToken(false);
          setMessages((current) => {
            if (current.length === 0) return current;
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role !== "assistant") return current;
            next[next.length - 1] = {
              role: "assistant",
              content: last.content + content,
            };
            return next;
          });
        },
        onDone: (id, reply) => {
          setSessionId(id);
          setMessages((current) => {
            if (current.length === 0) return current;
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { role: "assistant", content: reply };
            }
            return next;
          });
          runWorkflowSync(id);
        },
        onError: (detail) => {
          streamFailed = true;
          throw new ApiError(detail, 502);
        },
      });
    } catch (err) {
      setMessages(prev);
      if (!streamFailed) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not reach the API. Is the backend running on port 8000?";
        toast.error("Chat failed", { description: message });
      } else {
        const message = err instanceof ApiError ? err.message : "Chat stream failed.";
        toast.error("Chat failed", { description: message });
      }
    } finally {
      setStreaming(false);
      setAwaitingFirstToken(false);
    }
  };

  useEffect(() => {
    if (!hasChat) return;

    const scrollTo = (el: HTMLElement | null, block: ScrollLogicalPosition = "end") => {
      if (!el) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block });
        });
      });
    };

    if (publishResult) {
      scrollTo(publishPanelRef.current, "start");
      return;
    }
    if (workflow) {
      scrollTo(workflowPanelRef.current, "start");
      return;
    }
    scrollTo(bottomRef.current, "end");
  }, [messages, streaming, awaitingFirstToken, workflow, publishResult, hasChat]);

  useEffect(() => {
    if (!publishResult) return;
    const timer = window.setTimeout(() => {
      publishPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [publishResult]);

  const handleSend = () => {
    void sendMessage(input);
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
    void sendMessage(s);
  };

  const handleGenerate = async () => {
    if (!sessionId) {
      toast.message("Start a conversation first", {
        description: "Send at least one message before generating a workflow.",
      });
      return;
    }
    if (!workflowStatus?.ready) {
      toast.message("More details needed", {
        description: "Answer the assistant's questions until the workflow is ready.",
      });
      return;
    }

    setIsGenerating(true);
    setWorkflow(null);
    try {
      const result = await generateWorkflow(sessionId);
      setWorkflow(asN8nWorkflow(result.workflow));
      void queryClient.invalidateQueries({ queryKey: ["automations"] });
      if (result.automation_id) {
        toast.success("Workflow generated", {
          description: "Saved to Automations. Open the Automations tab to view it.",
        });
      } else {
        toast.success("Workflow generated", {
          description:
            typeof result.workflow.name === "string" ? result.workflow.name : "n8n JSON is ready",
        });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Generation failed.";
      toast.error("Generate failed", { description: message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!sessionId) {
      toast.message("Start a conversation first", {
        description: "Chat with the assistant before publishing to n8n.",
      });
      return;
    }
    if (!workflowStatus?.ready) {
      toast.message("Workflow not ready", {
        description: "Complete the chat so all required fields are collected.",
      });
      return;
    }

    setIsPublishing(true);
    setPublishResult(null);
    try {
      const res = await deployWorkflow(sessionId);
      setPublishResult(res);
      void queryClient.invalidateQueries({ queryKey: ["automations"] });
      if (res.success) {
        toast.success("Published to n8n", {
          description: res.automation_id
            ? "Updated in Automations with n8n IDs and webhook URLs."
            : "See workflow ID, webhook URLs, and links in the chat below.",
        });
      } else {
        toast.error("Publish incomplete", {
          description: "See error details in the chat below.",
        });
      }
      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: [
              `Published **${res.workflow_name ?? "workflow"}** to your n8n instance.`,
              res.n8n_workflow_id ? `Workflow ID: \`${res.n8n_workflow_id}\`` : null,
              "See the **publish details** card below for the hosted URL, webhook URLs, and editor link (open in n8n only when you want).",
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: res.chat_summary }]);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Publish failed.";
      toast.error("Publish failed", { description: message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRefinePrompt = () => {
    textareaRef.current?.focus();
    toast.message("Refine your prompt", {
      description: "Add more detail in the chat, then generate again.",
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden">
      <div ref={scrollRef} className={`flex-1 min-h-0 w-full ${hasChat ? "overflow-y-auto" : "overflow-hidden"}`}>
        {hasChat ? (
          <div className="max-w-3xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-5 space-y-4">
            {displayMessages.length === 0 && !streaming && !awaitingFirstToken && (
              <ChatBubble msg={WELCOME_MESSAGE} />
            )}
            {displayMessages.map((msg, i) => {
              if (
                msg.role === "assistant" &&
                !msg.content &&
                awaitingFirstToken &&
                i === displayMessages.length - 1
              ) {
                return null;
              }
              return (
                <ChatBubble
                  key={i}
                  msg={msg}
                  streaming={
                    streaming && i === displayMessages.length - 1 && msg.role === "assistant"
                  }
                />
              );
            })}
            {awaitingFirstToken && <ThinkingBubble />}
            {workflow && (
              <div ref={workflowPanelRef} className="scroll-mt-4">
                <WorkflowOutputPanel
                  workflow={workflow}
                  onRefinePrompt={handleRefinePrompt}
                  onDownload={() => toast.success("Workflow JSON downloaded")}
                  onCopy={() => toast.success("Copied n8n JSON to clipboard")}
                />
              </div>
            )}
            {publishResult && (
              <div ref={publishPanelRef} className="scroll-mt-4">
                <PublishResultPanel
                  result={publishResult}
                  onCopy={(label) => toast.success(`Copied ${label}`)}
                />
              </div>
            )}
            {workflowSyncing && (
              <div className="rounded-lg border border-border bg-surface/50 px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
                </span>
                Updating workflow status…
              </div>
            )}
            {missingFields.length > 0 && !workflow && workflowStatus?.template_id && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-muted-foreground">
                <span className="font-medium text-warning">Still needed: </span>
                {missingFields.join(", ")}
              </div>
            )}
            {workflowStatus?.ready && !workflow && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary">
                All details collected — generate JSON or publish to n8n.
              </div>
            )}
            <div ref={bottomRef} className="h-px" />
          </div>
        ) : (
          <div className="h-full min-h-0 flex items-center justify-center px-6 py-6">
            <WelcomePanel onSuggestion={handleSuggestion} />
          </div>
        )}
      </div>

      <Composer
        textareaRef={textareaRef}
        input={input}
        onInputChange={setInput}
        ragMode={ragMode}
        onRagModeChange={setRagMode}
        onSend={handleSend}
        onGenerate={() => void handleGenerate()}
        onPublish={() => void handlePublish()}
        disabled={busy}
        canSend={!!input.trim() && !busy}
        canGenerate={!!sessionId && readyToGenerate && !busy}
        canPublish={!!sessionId && readyToGenerate && !busy}
        isGenerating={isGenerating}
        isPublishing={isPublishing}
        readyToGenerate={readyToGenerate}
      />
    </div>
  );
}

function WelcomePanel({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="w-full max-w-xl flex flex-col items-center text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 border border-primary/30 shadow-glow-sm shrink-0">
        <Bot className="h-7 w-7 text-primary" />
      </div>
      <h1 className="mt-6 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        Welcome to <span className="text-gradient-primary">N8Nexus AI</span>
      </h1>
      <p className="mt-3 text-muted-foreground max-w-lg text-sm md:text-base leading-relaxed">
        Describe any business process in plain English and I&apos;ll convert it into a structured
        automation workflow ready for n8n.
      </p>
      <div className="mt-8 sm:mt-10 grid sm:grid-cols-2 gap-3 w-full">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="rounded-xl border border-border bg-surface px-4 py-3.5 text-left text-sm hover:border-primary/40 hover:bg-surface-elevated transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary mb-2" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ msg, streaming = false }: { msg: ChatMessage; streaming?: boolean }) {
  const isUser = msg.role === "user";
  const showStreamingCursor =
    streaming && !isUser && msg.content.length > 0;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary/20 text-foreground border border-primary/25"
            : "bg-surface border border-border text-muted-foreground"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-primary">
            <Bot className="h-3.5 w-3.5" />
            N8Nexus AI
          </div>
        )}
        {isUser ? (
          msg.content
        ) : (
          <>
            <AssistantText content={msg.content} />
            {showStreamingCursor && (
              <span className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-primary animate-pulse" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AssistantText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-foreground font-medium">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl px-4 py-3 bg-surface border border-border text-xs text-muted-foreground flex items-center gap-2">
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
        </span>
        Thinking…
      </div>
    </div>
  );
}

function Composer({
  textareaRef,
  input,
  onInputChange,
  ragMode,
  onRagModeChange,
  onSend,
  onGenerate,
  onPublish,
  disabled,
  canSend,
  canGenerate,
  canPublish,
  isGenerating,
  isPublishing,
  readyToGenerate,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  input: string;
  onInputChange: (v: string) => void;
  ragMode: boolean;
  onRagModeChange: (v: boolean) => void;
  onSend: () => void;
  onGenerate: () => void;
  onPublish: () => void;
  disabled: boolean;
  canSend: boolean;
  canGenerate: boolean;
  canPublish: boolean;
  isGenerating: boolean;
  isPublishing: boolean;
  readyToGenerate: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-background px-3 py-2 sm:px-4">
      <div className="max-w-3xl mx-auto rounded-lg border border-border bg-card p-2 sm:p-2.5 shadow-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex flex-col gap-2"
        >
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Describe the business process you want to automate…"
              rows={1}
              disabled={disabled}
              className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-lg border-border bg-background text-sm py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-1.5 lg:shrink-0">
              <Button
                type="submit"
                size="sm"
                disabled={!canSend}
                className="h-9 px-3 rounded-lg text-xs bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Send</span>
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canGenerate}
                onClick={onGenerate}
                className="h-9 px-3 rounded-lg text-xs bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                <Sparkles className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{isGenerating ? "Generating…" : "Generate"}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canPublish}
                onClick={onPublish}
                className="h-9 px-3 rounded-lg text-xs bg-background"
              >
                <Rocket className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{isPublishing ? "Publishing…" : "Publish"}</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-1.5">
            <div className="flex items-center gap-1.5">
              <Switch
                id="rag-mode-switch"
                checked={ragMode}
                onCheckedChange={onRagModeChange}
                aria-label="Toggle RAG mode"
                disabled={disabled}
                className="scale-90"
              />
              <Label
                htmlFor="rag-mode-switch"
                className="text-[11px] text-muted-foreground font-medium cursor-pointer"
              >
                RAG
              </Label>
              <Badge variant="secondary" className="h-5 text-[10px] px-1.5 font-medium">
                {ragMode ? "ON" : "OFF"}
              </Badge>
            </div>
            {readyToGenerate && (
              <Badge
                variant="outline"
                className="h-5 bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5"
              >
                Ready to generate
              </Badge>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
