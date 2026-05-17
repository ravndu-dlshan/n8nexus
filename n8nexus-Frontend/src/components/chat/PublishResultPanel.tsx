import { Check, Copy, ExternalLink, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkflowDeployResponse } from "@/lib/api/workflows";

type Props = {
  result: WorkflowDeployResponse;
  onCopy?: (label: string) => void;
};

function CopyRow({
  label,
  value,
  mono = true,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: (label: string) => void;
}) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    onCopy?.(label);
  };

  return (
    <div className="rounded-lg border border-border bg-background/80 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <div className="flex items-start gap-2">
        <p
          className={`flex-1 text-xs break-all ${mono ? "font-mono text-foreground" : "text-foreground"}`}
        >
          {value}
        </p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          aria-label={`Copy ${label}`}
          onClick={() => void handleCopy()}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function PublishResultPanel({ result, onCopy }: Props) {
  const failed = !result.success;

  return (
    <div
      className={`rounded-xl border overflow-hidden shadow-glow-sm ${
        failed ? "border-destructive/40 bg-destructive/5" : "border-success/40 bg-surface"
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        {failed ? (
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {failed ? "Publish failed" : "Published to n8n"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {failed
              ? "Details are below. Fix the issue and try Publish again."
              : "Your workflow is on your n8n instance. Copy URLs below or open the editor when you are ready."}
          </p>
          {!failed && result.active !== null && (
            <Badge
              variant="outline"
              className={`mt-2 text-[10px] ${
                result.active
                  ? "border-success/40 text-success"
                  : "border-warning/40 text-warning"
              }`}
            >
              {result.active ? "Active" : "Inactive — activate in n8n for production webhooks"}
            </Badge>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {result.n8n_instance_url && (
          <CopyRow label="n8n hosted URL" value={result.n8n_instance_url} onCopy={onCopy} />
        )}
        {result.n8n_workflow_id && (
          <CopyRow label="Workflow ID" value={result.n8n_workflow_id} onCopy={onCopy} />
        )}
        {result.workflow_name && (
          <CopyRow label="Workflow name" value={result.workflow_name} mono={false} onCopy={onCopy} />
        )}
        {result.webhook_test_url && (
          <CopyRow label="Webhook test URL" value={result.webhook_test_url} onCopy={onCopy} />
        )}
        {result.webhook_production_url && (
          <CopyRow
            label="Webhook production URL"
            value={result.webhook_production_url}
            onCopy={onCopy}
          />
        )}
        {result.editor_url && (
          <CopyRow label="Editor URL" value={result.editor_url} onCopy={onCopy} />
        )}

        {result.editor_url && !failed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs bg-background"
            onClick={() => window.open(result.editor_url!, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open workflow in n8n
          </Button>
        )}

        {result.webhook_production_url && !failed && (
          <p className="text-[11px] text-muted-foreground pt-1">
            Test with POST + JSON body. Use the test URL while listening in the editor; use
            production after you activate the workflow.
          </p>
        )}
      </div>
    </div>
  );
}
