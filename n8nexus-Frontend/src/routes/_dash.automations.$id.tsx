import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  automationStatusLabel,
  automationTriggerLabel,
  getAutomation,
} from "@/lib/api/automations";
import { ApiError } from "@/lib/api/client";
import { AutomationDeployCard } from "@/components/automations/AutomationDeployCard";
import { AutomationRunCard } from "@/components/automations/AutomationRunCard";
import { ChevronRight, Download, ExternalLink, Workflow, Zap } from "lucide-react";

export const Route = createFileRoute("/_dash/automations/$id")({
  head: () => ({
    meta: [{ title: "Automation — N8Nexus" }, { name: "description", content: "Automation details." }],
  }),
  component: AutomationDetail,
});

function AutomationDetail() {
  const { id } = Route.useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["automations", id],
    queryFn: () => getAutomation(id),
  });

  if (id === "new") return null;

  const json =
    data?.workflow_json != null ? JSON.stringify(data.workflow_json, null, 2) : "";

  const handleDownload = () => {
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(data?.workflow_name ?? "workflow").replace(/[^\w.-]+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/automations" className="hover:text-foreground">
          Automations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate">{data?.workflow_name ?? "…"}</span>
      </div>

      {isLoading && (
        <Card className="p-6 bg-surface border-border space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-48 w-full" />
        </Card>
      )}

      {isError && (
        <Card className="p-6 bg-destructive/10 border-destructive/30 text-sm">
          <p className="font-medium text-destructive">Could not load automation</p>
          <p className="mt-1 text-muted-foreground">
            {error instanceof ApiError ? error.message : "Unknown error"}
          </p>
        </Card>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">{data.workflow_name}</h1>
                <Badge variant="outline">{automationStatusLabel(data.status)}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.template_title ?? data.template_id ?? "Workflow"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-primary" />
                  {automationTriggerLabel(data.template_id)}
                </span>
                {data.n8n_workflow_id ? (
                  <>
                    <span>·</span>
                    <span className="font-mono">n8n ID: {data.n8n_workflow_id}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="bg-surface" onClick={handleDownload} disabled={!json}>
                <Download className="h-4 w-4 mr-1.5" /> Download JSON
              </Button>
              {data.editor_url ? (
                <Button asChild variant="outline" className="bg-surface">
                  <a href={data.editor_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Open in n8n
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {data.deploy_error ? (
            <Card className="p-4 bg-destructive/10 border-destructive/30 text-sm text-destructive">
              {data.deploy_error}
            </Card>
          ) : null}

          <AutomationDeployCard automation={data} />

          <AutomationRunCard automation={data} />

          <Card className="bg-surface border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">n8n workflow JSON</p>
            </div>
            <pre className="max-h-[480px] overflow-auto p-4 text-[11px] font-mono leading-relaxed text-muted-foreground">
              {json || "{}"}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
}
