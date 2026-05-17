import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Search, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_dash/documents")({
  head: () => ({ meta: [{ title: "Documents — N8Nexus" }, { name: "description", content: "Manage the documents grounding your automations." }] }),
  component: Documents,
});

const docs = [
  { name: "acme-sales-sop.pdf", size: "1.2 MB", added: "Mar 04", status: "indexed", linked: 3 },
  { name: "lead-scoring-rubric.md", size: "12 KB", added: "Mar 04", status: "indexed", linked: 5 },
  { name: "hubspot-mapping.csv", size: "4 KB", added: "Mar 03", status: "processing", linked: 2 },
  { name: "support-playbook.pdf", size: "2.4 MB", added: "Feb 28", status: "indexed", linked: 1 },
  { name: "ops-runbook.pdf", size: "856 KB", added: "Feb 22", status: "indexed", linked: 4 },
  { name: "nps-categories.md", size: "3 KB", added: "Feb 19", status: "indexed", linked: 2 },
];

function Documents() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">{docs.length} documents indexed · 4.5 MB used</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-sm">
          <Upload className="h-4 w-4 mr-1.5" /> Upload documents
        </Button>
      </div>

      <Card className="bg-surface border-2 border-dashed border-border p-10 text-center hover:border-primary/40 transition">
        <Upload className="h-7 w-7 mx-auto text-primary" />
        <p className="mt-3 text-sm">Drag PDFs, Markdown, CSVs here — or <span className="text-primary font-medium">browse</span></p>
        <p className="text-xs text-muted-foreground mt-1">Up to 50MB per file. Indexed in seconds.</p>
      </Card>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search documents…" className="pl-9 bg-surface" />
      </div>

      <Card className="bg-surface border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border font-mono">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Linked</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="hidden md:block divide-y divide-border">
          {docs.map((d) => (
            <div key={d.name} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-surface-elevated transition">
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-background border border-border">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">Added {d.added}</p>
                </div>
              </div>
              <div className="col-span-2 text-sm font-mono text-muted-foreground">{d.size}</div>
              <div className="col-span-2">
                <Badge variant="outline" className={d.status === "indexed" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>
                  {d.status}
                </Badge>
              </div>
              <div className="col-span-2 text-sm">{d.linked} automation{d.linked === 1 ? "" : "s"}</div>
              <div className="col-span-1 flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7"><RefreshCw className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>

        <div className="md:hidden divide-y divide-border">
          {docs.map((d) => (
            <div key={`${d.name}-m`} className="flex items-start gap-3 p-4 hover:bg-surface-elevated transition">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-background border border-border">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Added {d.added} · {d.size}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={d.status === "indexed" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>
                    {d.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{d.linked} linked</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8"><RefreshCw className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
