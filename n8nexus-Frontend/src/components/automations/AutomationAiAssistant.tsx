import { useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AutomationDraft } from "@/types/automation-draft";
import { TRIGGER_OPTIONS } from "@/types/automation-draft";

type Message = { role: "user" | "assistant"; content: string };

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm here to help you define this automation. Tell me what should kick it off, what success looks like, and which tools you use — I'll suggest how to fill out the form.",
};

function mockReply(input: string, draft: AutomationDraft): string {
  const q = input.toLowerCase();

  if (q.includes("trigger") || q.includes("start") || q.includes("when")) {
    return `Pick a **Trigger Type** that matches how work enters the flow. For example:
• **Form submitted** — website or Typeform leads
• **Email received** — inbox triage or approvals
• **Webhook** — app events from your stack
• **Scheduled (cron)** — recurring reports or reminders

You currently have: ${draft.triggerType ? TRIGGER_OPTIONS.find((t) => t.value === draft.triggerType)?.label : "none selected yet"}.`;
  }

  if (q.includes("rule") || q.includes("condition") || q.includes("approval")) {
    return `Use **Important Business Rules** for thresholds, approvers, and edge cases — e.g. "Invoices over $5k need manager approval" or "Only route EU leads to the EU queue." Be explicit; these map to workflow branches later.`;
  }

  if (q.includes("app") || q.includes("tool") || q.includes("integrat") || q.includes("slack") || q.includes("gmail")) {
    return `List every system in **Apps / Tools Involved** (comma-separated is fine): Gmail, Slack, QuickBooks, Google Sheets, HubSpot, etc. That helps pick the right n8n nodes when you hit **Generate**.`;
  }

  if (q.includes("outcome") || q.includes("success") || q.includes("finish") || q.includes("end")) {
    return `**Desired Outcome** should describe the happy path in one or two sentences: what files get created, who gets notified, and what record is updated. Example: "Create a draft invoice in QuickBooks and notify #finance in Slack."`;
  }

  if (q.includes("title") || q.includes("name")) {
    return `**Automation Title** should be short and specific — e.g. "Invoice Approval Workflow" or "Lead Router v3". The **Short Description** is one line on what the automation does day-to-day.`;
  }

  if (q.includes("generate") || q.includes("publish")) {
    return `**Generate** will build a draft spec and workflow from your form (API coming soon). **Publish** deploys an approved automation to your connected n8n instance. Fill the required fields first so generation has enough context.`;
  }

  const missing: string[] = [];
  if (!draft.title.trim()) missing.push("Automation Title");
  if (!draft.description.trim()) missing.push("Short Description");
  if (!draft.triggerType) missing.push("Trigger Type");
  if (!draft.desiredOutcome.trim()) missing.push("Desired Outcome");

  if (missing.length > 0) {
    return `To move forward, I'd fill in: ${missing.join(", ")}. Describe your process in your own words and I can help you phrase each field.`;
  }

  return `Your form looks solid. **Generate** will turn this into a process spec and n8n workflow. Add SLAs, error handling, or regional rules under **Important Business Rules** if needed.`;
}

function formatAssistantText(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-foreground font-medium">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[95%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary/20 text-foreground border border-primary/25"
            : "bg-background border border-border text-muted-foreground"
        }`}
      >
        {isUser ? msg.content : formatAssistantText(msg.content)}
      </div>
    </div>
  );
}

type Props = {
  draft: AutomationDraft;
};

export function AutomationAiAssistant({ draft }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const text = input.trim();
    if (!text || thinking) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setThinking(true);

    window.setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: mockReply(text, draft) }]);
      setThinking(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 500);
  };

  return (
    <Card className="flex flex-col h-full min-h-[520px] lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)] bg-surface border-border overflow-hidden">
      <div className="p-5 border-b border-border bg-gradient-to-br from-surface to-primary/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 border border-primary/30">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              AI Assistant
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Ask me anything about your automation</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="py-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Describe your process and I&apos;ll help you build the automation spec.
          </p>
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}
          {thinking && (
            <div className="flex gap-2 items-center text-xs text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              </span>
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-background/50 shrink-0">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about triggers, rules, tools…"
            className="bg-background text-sm"
            disabled={thinking}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || thinking}
            className="shrink-0 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

