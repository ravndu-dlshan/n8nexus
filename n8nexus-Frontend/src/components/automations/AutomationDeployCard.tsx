import { format } from "date-fns";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Automation } from "@/lib/api/automations";
import { toast } from "sonner";

type Props = {
  automation: Automation;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success(`Copied ${label}`);
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</p>
      <div className="flex items-start gap-2">
        <p className="flex-1 text-xs font-mono break-all text-foreground">{value}</p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={() => void copy()}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function AutomationDeployCard({ automation }: Props) {
  const hasDeployData =
    automation.n8n_workflow_id ||
    automation.editor_url ||
    automation.webhook_test_url ||
    automation.webhook_production_url;

  if (automation.status === "generated" && !hasDeployData) {
    return (
      <Card className="p-4 bg-surface border-border text-sm text-muted-foreground">
        Not published to n8n yet. Use <strong className="text-foreground">Publish</strong> in Chat to
        save workflow ID and webhook URLs here.
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-surface border-border space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-primary font-mono">n8n deployment</p>
        <div className="flex flex-wrap gap-2">
          {automation.active != null && (
            <Badge variant="outline" className={automation.active ? "text-success border-success/30" : ""}>
              {automation.active ? "Active in n8n" : "Inactive"}
            </Badge>
          )}
          {automation.deployed_at && (
            <Badge variant="outline" className="text-muted-foreground">
              Deployed {format(new Date(automation.deployed_at), "MMM d, yyyy · HH:mm")}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {automation.n8n_workflow_id && (
          <CopyRow label="Workflow ID" value={automation.n8n_workflow_id} />
        )}
        {automation.webhook_path && <CopyRow label="Webhook path" value={automation.webhook_path} />}
        {automation.webhook_test_url && (
          <CopyRow label="Test webhook URL" value={automation.webhook_test_url} />
        )}
        {automation.webhook_production_url && (
          <CopyRow label="Production webhook URL" value={automation.webhook_production_url} />
        )}
        {automation.n8n_instance_url && (
          <CopyRow label="n8n instance" value={automation.n8n_instance_url} />
        )}
        {automation.editor_url && <CopyRow label="Editor URL" value={automation.editor_url} />}
      </div>

      {automation.editor_url && (
        <Button asChild variant="outline" size="sm" className="bg-background">
          <a href={automation.editor_url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open workflow in n8n
          </a>
        </Button>
      )}
    </Card>
  );
}
