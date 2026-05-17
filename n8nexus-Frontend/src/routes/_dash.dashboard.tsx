import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  automationStatusLabel,
  automationTriggerLabel,
  listAutomations,
  type AutomationStatus,
} from "@/lib/api/automations";
import {
  getTimeGreeting,
  getUserFirstName,
  getWorkspaceName,
  useAuth,
} from "@/contexts/auth-context";
import {
  Activity, ArrowUpRight, Bot, CheckCircle2, Clock, FileText,
  GitBranch, LayoutTemplate, Plus, TrendingUp, Workflow, Zap,
} from "lucide-react";

export const Route = createFileRoute("/_dash/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — N8Nexus" }, { name: "description", content: "Your N8Nexus automation overview." }] }),
  component: Dashboard,
});

function buildStats(total: number, deployed: number) {
  return [
    { label: "Active automations", value: String(total), delta: total > 0 ? "live" : "—", icon: Workflow, color: "text-primary" },
    { label: "AI generations", value: "—", delta: "—", icon: Bot, color: "text-primary-glow" },
    { label: "Workflows deployed", value: String(deployed), delta: deployed > 0 ? "live" : "—", icon: CheckCircle2, color: "text-success" },
    { label: "Documents indexed", value: "—", delta: "—", icon: FileText, color: "text-info" },
  ];
}

const activity = [
  { who: "Maya", action: "approved", target: "Lead Router v3", time: "2m" },
  { who: "AI", action: "generated spec for", target: "Invoice Reminders", time: "1h" },
  { who: "Daniel", action: "commented on", target: "Customer Onboarding", time: "3h" },
  { who: "Priya", action: "deployed", target: "Churn Signals", time: "5h" },
  { who: "Maya", action: "uploaded", target: "ops-runbook.pdf", time: "1d" },
];

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

function Dashboard() {
  const { user } = useAuth();
  const firstName = getUserFirstName(user);
  const workspaceName = getWorkspaceName(user);

  const { data: automations, isLoading: automationsLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: listAutomations,
  });

  const recents = (automations ?? []).slice(0, 5);
  const deployedCount = (automations ?? []).filter((a) => a.status === "deployed").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Workspace · {workspaceName}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
            {getTimeGreeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening across your automations today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-surface"><Activity className="h-4 w-4 mr-1.5" /> Activity</Button>
          <Button asChild className="btn-get-started rounded-full px-6 font-medium shadow-none">
            <Link to="/automations/new"><Plus className="h-4 w-4 mr-1.5" /> New automation</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {buildStats(automations?.length ?? 0, deployedCount).map((s) => (
          <Card key={s.label} className="p-5 bg-surface border-border hover:border-primary/30 transition">
            <div className="flex items-center justify-between">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />{s.delta}</span>
            </div>
            <div className="mt-4 text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-surface border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-semibold">Recent automations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last updated workflows in your workspace</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/automations">View all <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
          </div>
          <div className="divide-y divide-border">
            {automationsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            ) : recents.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                <p>No workflows yet.</p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/chat">Create in chat</Link>
                </Button>
              </div>
            ) : (
              recents.map((r) => (
              <Link key={r.id} to="/automations/$id" params={{ id: r.id }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-elevated transition">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-background border border-border">
                  <Workflow className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{r.workflow_name}</p>
                    <Badge variant="outline" className={statusVariant(r.status)}>
                      {automationStatusLabel(r.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <Zap className="inline h-3 w-3 mr-1" />
                    {automationTriggerLabel(r.template_id)}
                    {r.template_title ? ` · ${r.template_title}` : null}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {r.updated_at
                    ? formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })
                    : "—"}
                </span>
              </Link>
            ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-surface border-border">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Activity feed</h2>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-5 space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-background border border-border text-[11px] font-semibold">
                    {a.who === "AI" ? <Bot className="h-3.5 w-3.5 text-primary" /> : a.who[0]}
                  </div>
                  <div className="flex-1 text-sm leading-snug">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium">{a.target}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.time} ago</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-surface to-primary/10 border-primary/30 p-5">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">Quick start with a template</h3>
            <p className="mt-1 text-xs text-muted-foreground">Browse 40+ ready-made automations.</p>
            <Button asChild size="sm" variant="outline" className="mt-4 bg-background"><Link to="/templates">Browse templates</Link></Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
