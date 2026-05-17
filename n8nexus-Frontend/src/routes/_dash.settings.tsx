import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Copy, Eye, EyeOff, Plug, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_dash/settings")({
  head: () => ({ meta: [{ title: "Settings — N8Nexus" }, { name: "description", content: "Workspace, billing, API keys, and n8n integration." }] }),
  component: Settings,
});

function Settings() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your workspace, billing, integrations, and team.</p>
      </div>

      <Tabs defaultValue="workspace">
        <TabsList className="bg-surface w-full max-w-full justify-start overflow-x-auto flex-nowrap [&>button]:shrink-0">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api">API keys</TabsTrigger>
          <TabsTrigger value="n8n">n8n integration</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-5"><Workspace /></TabsContent>
        <TabsContent value="billing" className="mt-5"><Billing /></TabsContent>
        <TabsContent value="api" className="mt-5"><ApiKeys /></TabsContent>
        <TabsContent value="n8n" className="mt-5"><N8n /></TabsContent>
        <TabsContent value="team" className="mt-5"><Team /></TabsContent>
      </Tabs>
    </div>
  );
}

function Workspace() {
  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <SectionTitle title="Workspace details" desc="How your workspace appears across N8Nexus." />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Workspace name</Label>
          <Input defaultValue="Acme Ops" className="bg-background" />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input defaultValue="acme-ops" className="bg-background font-mono" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
        <div>
          <p className="text-sm font-medium">Auto-improve workflows with AI</p>
          <p className="text-xs text-muted-foreground mt-0.5">Suggest weekly improvements based on run data.</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex justify-end"><Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">Save changes</Button></div>
    </Card>
  );
}

function Billing() {
  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-surface to-primary/10 border-primary/30 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Badge variant="outline" className="border-primary/30 text-primary">Current plan</Badge>
            <h3 className="mt-2 text-2xl font-bold">Pro · $49/mo</h3>
            <p className="text-sm text-muted-foreground mt-1">Renews April 12, 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-background">Manage plan</Button>
          </div>
        </div>
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          {[
            { l: "AI generations", v: "1,284 / 5,000" },
            { l: "Active automations", v: "24 / ∞" },
            { l: "Documents indexed", v: "63 / 500" },
          ].map((m) => (
            <div key={m.l} className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">{m.l}</p>
              <p className="mt-1 font-semibold">{m.v}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="bg-surface border-border p-6">
        <SectionTitle title="Payment method" desc="Used for monthly billing." />
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
          <div className="grid h-10 w-14 place-items-center rounded bg-surface-elevated text-xs font-semibold">VISA</div>
          <div className="flex-1">
            <p className="text-sm">•••• •••• •••• 4242</p>
            <p className="text-xs text-muted-foreground">Expires 09/27</p>
          </div>
          <Button variant="outline" size="sm" className="bg-background">Update</Button>
        </div>
      </Card>
    </div>
  );
}

function ApiKeys() {
  const [show, setShow] = useState(false);
  const keys = [
    { name: "Production", key: "n8x_live_5f2a••••••••••••8c91", created: "Mar 1, 2026", lastUsed: "2 min ago" },
    { name: "Staging", key: "n8x_test_a1b2••••••••••••0d77", created: "Feb 14, 2026", lastUsed: "3 days ago" },
  ];
  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-start justify-between">
        <SectionTitle title="API keys" desc="Use these to call the N8Nexus API from your own systems." />
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4 mr-1.5" /> Create key</Button>
      </div>
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.name} className="rounded-lg border border-border bg-background p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{k.name}</p>
                <Badge variant="outline" className="text-[10px]">last used {k.lastUsed}</Badge>
              </div>
              <p className="mt-1 text-xs font-mono text-muted-foreground">{show ? k.key.replace(/•/g, "x") : k.key}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setShow(!show)}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            <Button size="icon" variant="ghost"><Copy className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function N8n() {
  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <SectionTitle title="n8n integration" desc="Push generated workflows directly to your n8n instance." />
      <div className="rounded-lg border border-success/30 bg-success/10 p-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-background border border-border">
          <Plug className="h-4 w-4 text-success" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium flex items-center gap-2">Connected to n8n Cloud <Check className="h-3.5 w-3.5 text-success" /></p>
          <p className="text-xs text-muted-foreground">acme.n8n.cloud · 24 workflows synced</p>
        </div>
        <Button variant="outline" size="sm" className="bg-background">Reconnect</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>n8n instance URL</Label>
          <Input defaultValue="https://acme.n8n.cloud" className="bg-background font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label>API token</Label>
          <Input type="password" defaultValue="••••••••••••••••" className="bg-background font-mono text-sm" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
        <div>
          <p className="text-sm font-medium">Auto-deploy on approval</p>
          <p className="text-xs text-muted-foreground mt-0.5">Push workflows to n8n the moment they're approved.</p>
        </div>
        <Switch defaultChecked />
      </div>
    </Card>
  );
}

function Team() {
  const members = [
    { name: "Maya Chen", email: "maya@acme.com", role: "Owner" },
    { name: "Daniel Ortiz", email: "daniel@acme.com", role: "Admin" },
    { name: "Priya Raman", email: "priya@acme.com", role: "Editor" },
    { name: "Sam Park", email: "sam@acme.com", role: "Viewer" },
  ];
  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-start justify-between">
        <SectionTitle title="Team members" desc="Invite your team to collaborate on automations." />
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4 mr-1.5" /> Invite</Button>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-background">
        {members.map((m) => (
          <div key={m.email} className="flex items-center gap-3 px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-elevated text-sm font-semibold">
              {m.name.split(" ").map((s) => s[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <Badge variant="outline" className="bg-surface">{m.role}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}
