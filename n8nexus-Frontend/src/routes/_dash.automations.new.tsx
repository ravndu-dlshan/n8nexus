import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AutomationAiAssistant } from "@/components/automations/AutomationAiAssistant";
import { NewAutomationForm } from "@/components/automations/NewAutomationForm";
import {
  emptyAutomationDraft,
  type AutomationDraft,
} from "@/types/automation-draft";

export const Route = createFileRoute("/_dash/automations/new")({
  head: () => ({
    meta: [
      { title: "New automation — N8Nexus" },
      {
        name: "description",
        content: "Define your automation and let AI help you build it.",
      },
    ],
  }),
  component: NewAutomationPage,
});

function NewAutomationPage() {
  const [draft, setDraft] = useState<AutomationDraft>(emptyAutomationDraft);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateDraft = (patch: Partial<AutomationDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      setIsGenerating(false);
      toast.success("Automation spec generated", {
        description: "Backend integration will save and open the workflow editor.",
      });
    }, 800);
  };

  const handlePublish = () => {
    toast.info("Publish queued", {
      description: "Connect your n8n instance in Settings to deploy for real.",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/automations" className="hover:text-foreground">
          Automations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">New automation</span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">New Automation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define your automation and let AI help you build it.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-6 items-start">
        <NewAutomationForm
          draft={draft}
          onChange={updateDraft}
          onGenerate={handleGenerate}
          onPublish={handlePublish}
          isGenerating={isGenerating}
        />
        <AutomationAiAssistant draft={draft} />
      </div>
    </div>
  );
}
