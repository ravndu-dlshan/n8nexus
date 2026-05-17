import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  automationStatusLabel,
  automationTriggerLabel,
  listAutomations,
  type Automation,
  type AutomationStatus,
} from "@/lib/api/automations";
import { ApiError } from "@/lib/api/client";
import { MessagesSquare, Plus, Search, Workflow, Zap } from "lucide-react";

export const Route = createFileRoute("/_dash/automations/")({
  head: () => ({
    meta: [
      { title: "Automations — N8Nexus" },
      { name: "description", content: "All your automations in one place." },
    ],
  }),
  component: AutomationsList,
});

type TabFilter = "all" | "deployed" | "generated" | "deploy_failed";

function statusVariant(status: AutomationStatus) {
  switch (status) {
    case "deployed":
      return "bg-success/15 text-success border-success/30";
    case "deploy_failed":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function matchesTab(item: Automation, tab: TabFilter) {
  if (tab === "all") return true;
  return item.status === tab;
}

function AutomationsList() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["automations"],
    queryFn: listAutomations,
    refetchOnWindowFocus: true,
  });

  const items = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((item) => {
      if (!matchesTab(item, tab)) return false;
      if (!q) return true;
      const haystack = [item.workflow_name, item.template_title, item.template_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, search, tab]);

  const deployedCount = (data ?? []).filter((a) => a.status === "deployed").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Automations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${data?.length ?? 0} workflow${(data?.length ?? 0) === 1 ? "" : "s"} · ${deployedCount} deployed`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-sm">
            <Link to="/chat">
              <MessagesSquare className="h-4 w-4 mr-1.5" /> Create in chat
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-surface">
            <Link to="/automations/new">
              <Plus className="h-4 w-4 mr-1.5" /> New automation
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations…"
            className="pl-9 bg-surface"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)} className="w-full min-w-0">
          <TabsList className="bg-surface w-full max-w-full justify-start overflow-x-auto flex-nowrap [&>button]:shrink-0">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="deployed">Deployed</TabsTrigger>
            <TabsTrigger value="generated">Generated</TabsTrigger>
            <TabsTrigger value="deploy_failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isError && (
        <Card className="p-5 bg-destructive/10 border-destructive/30 text-sm">
          <p className="font-medium text-destructive">Could not load automations</p>
          <p className="mt-1 text-muted-foreground">
            {error instanceof ApiError ? error.message : "Check that the API is running and you are signed in."}
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      )}

      <Card className="bg-surface border-border overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border font-mono">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Trigger</div>
          <div className="col-span-3 text-right">Updated</div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Workflow className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">No automations yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Generate a workflow in Chat while signed in, then return here to see it listed.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/chat">Go to chat</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <Link
                key={item.id}
                to="/automations/$id"
                params={{ id: item.id }}
                className="grid grid-cols-12 items-center px-5 py-4 hover:bg-surface-elevated transition"
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-background border border-border shrink-0">
                    <Workflow className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.workflow_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.template_title ?? item.template_id ?? "Workflow"}
                      {item.status === "deployed" && item.n8n_workflow_id
                        ? ` · n8n ${item.n8n_workflow_id}`
                        : null}
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className={statusVariant(item.status)}>
                    {automationStatusLabel(item.status)}
                  </Badge>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3 shrink-0" />
                  <span className="truncate">{automationTriggerLabel(item.template_id)}</span>
                </div>
                <div className="col-span-3 text-xs text-muted-foreground text-right">
                  {item.updated_at
                    ? formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })
                    : "—"}
                  {isFetching ? " · syncing" : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}