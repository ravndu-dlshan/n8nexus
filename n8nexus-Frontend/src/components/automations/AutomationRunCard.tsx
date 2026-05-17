import { useState } from "react";
import { CheckCircle2, Loader2, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  runAutomation,
  type Automation,
  type AutomationRunResult,
} from "@/lib/api/automations";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

type Props = {
  automation: Automation;
};

function triggerLabel(trigger: string | null | undefined): string {
  switch (trigger) {
    case "webhook_test":
      return "Test webhook";
    case "webhook_production":
      return "Production webhook";
    default:
      return trigger ?? "Run";
  }
}

function previewJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AutomationRunCard({ automation }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AutomationRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isWebhookWorkflow = Boolean(
    automation.template_id?.startsWith("webhook"),
  );
  const canRun =
    automation.status === "deployed" &&
    Boolean(automation.n8n_workflow_id) &&
    isWebhookWorkflow;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runAutomation(automation.id);
      setResult(res);
      toast.success("Workflow executed", {
        description: res.summary ?? res.message,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Run failed";
      setError(message);
      toast.error("Could not run workflow", { description: message });
    } finally {
      setRunning(false);
    }
  };

  if (!canRun && automation.status !== "deployed") {
    return null;
  }

  const preview =
    result?.response_preview != null ? previewJson(result.response_preview) : "";

  return (
    <Card className="p-5 bg-surface border-border space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-primary font-mono">Test execution</p>
          <p className="text-sm text-muted-foreground">
            POST sample data to the workflow webhook URL and show the response.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void handleRun()}
          disabled={!canRun || running}
          className="shrink-0"
        >
          {running ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1.5" />
          )}
          {running ? "Running…" : "Run / Test workflow"}
        </Button>
      </div>

      {!canRun && automation.status === "deployed" && (
        <p className="text-sm text-muted-foreground">
          {!isWebhookWorkflow
            ? "Run / Test is available for webhook workflows only. Open manual workflows in n8n to execute."
            : "Missing n8n workflow ID. Publish again from Chat."}
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex gap-2 text-sm">
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Execution failed</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {result?.success && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-sm font-medium text-foreground">{result.message}</p>
            {result.trigger && (
              <Badge variant="outline" className="text-xs">
                {triggerLabel(result.trigger)}
              </Badge>
            )}
            {result.finished === false && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
                Still running
              </Badge>
            )}
          </div>
          {result.summary && (
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          )}
          {result.execution_id && (
            <p className="text-xs font-mono text-muted-foreground">
              Execution ID: {result.execution_id}
            </p>
          )}
          {preview ? (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                Response
              </p>
              <pre className="max-h-48 overflow-auto rounded-md border border-border bg-background p-3 text-[11px] font-mono text-foreground">
                {preview}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
