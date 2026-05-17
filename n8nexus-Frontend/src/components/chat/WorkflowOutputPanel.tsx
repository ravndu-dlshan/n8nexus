import { Check, Copy, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { N8nWorkflow } from "@/types/chat";

type Props = {
  workflow: N8nWorkflow;
  generationMode?: string;
  onRefinePrompt: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
};

export function WorkflowOutputPanel({
  workflow,
  generationMode = "Standard",
  onRefinePrompt,
  onCopy,
  onDownload,
}: Props) {
  const json = JSON.stringify(workflow, null, 2);
  const downloadFilename = `${workflow.name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "n8n-workflow"}.json`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    onCopy?.();
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFilename;
    anchor.click();
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-surface overflow-hidden shadow-glow-sm">
      <div className="p-4 bg-gradient-to-br from-surface to-primary/5">
        <p className="text-xs text-muted-foreground">
          Great, I generated an n8n workflow draft for{" "}
          <span className="font-medium text-foreground">&quot;{workflow.name}&quot;</span>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="border-primary/30 text-primary">
            {workflow.nodes.length} workflow node{workflow.nodes.length === 1 ? "" : "s"} generated
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            Generation mode: {generationMode}
          </Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          JSON is ready to copy, download, or import into n8n.
        </p>
      </div>

      <div className="px-4 py-3 border-t border-border bg-background/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">n8n JSON Output</p>
          <Badge variant="outline" className="bg-success/15 text-success border-success/30 text-[10px]">
            <Check className="h-3 w-3 mr-1" />
            Generated
          </Badge>
        </div>
        <pre className="max-h-[320px] overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] font-mono leading-relaxed text-muted-foreground">
          {json}
        </pre>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-background text-xs"
            onClick={onRefinePrompt}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Refine Prompt
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-background text-xs"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download JSON
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-background text-xs"
            onClick={() => void handleCopy()}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy n8n JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
