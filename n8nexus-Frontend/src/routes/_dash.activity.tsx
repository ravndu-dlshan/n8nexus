import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle2, GitBranch, MessageSquare, Upload, Workflow, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_dash/activity")({
  head: () => ({ meta: [{ title: "Activity — N8Nexus" }, { name: "description", content: "Workspace activity log." }] }),
  component: Activity,
});

const groups = [
  {
    label: "Today",
    items: [
      { icon: CheckCircle2, color: "text-success", who: "Maya Chen", action: "approved", target: "Lead Router v3", time: "2m ago" },
      { icon: Bot, color: "text-primary", who: "AI", action: "generated process spec for", target: "Invoice Reminders", time: "1h ago" },
      { icon: MessageSquare, color: "text-info", who: "Daniel Ortiz", action: "commented on", target: "Customer Onboarding", time: "3h ago" },
    ],
  },
  {
    label: "Yesterday",
    items: [
      { icon: Workflow, color: "text-primary", who: "Priya Raman", action: "deployed", target: "Churn Signals", time: "5h ago" },
      { icon: Upload, color: "text-warning", who: "Maya Chen", action: "uploaded", target: "ops-runbook.pdf", time: "1d ago" },
      { icon: GitBranch, color: "text-info", who: "Daniel Ortiz", action: "created version v3.1 of", target: "Lead Router", time: "1d ago" },
      { icon: AlertTriangle, color: "text-destructive", who: "System", action: "alert: 3 failed runs in", target: "NPS Follow-up", time: "1d ago" },
    ],
  },
  {
    label: "Earlier this week",
    items: [
      { icon: Bot, color: "text-primary", who: "AI", action: "improved prompt for", target: "Support Triage", time: "3d ago" },
      { icon: Workflow, color: "text-primary", who: "Maya Chen", action: "created", target: "Support Triage", time: "3d ago" },
    ],
  },
];

function Activity() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything happening across Acme Ops.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [&>*]:shrink-0">
        {["All", "Workflows", "AI", "Comments", "Deploys"].map((f, i) => (
          <Badge key={f} variant={i === 0 ? "default" : "outline"} className={i === 0 ? "bg-primary text-primary-foreground" : "bg-surface cursor-pointer"}>
            {f}
          </Badge>
        ))}
      </div>

      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">{g.label}</p>
          <Card className="bg-surface border-border">
            <div className="divide-y divide-border">
              {g.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-background border border-border">
                    <it.icon className={`h-4 w-4 ${it.color}`} />
                  </div>
                  <p className="text-sm flex-1">
                    <span className="font-medium">{it.who}</span>{" "}
                    <span className="text-muted-foreground">{it.action}</span>{" "}
                    <span className="font-medium">{it.target}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{it.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
