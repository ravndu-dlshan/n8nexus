import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AutomationDraft, TriggerType } from "@/types/automation-draft";
import { TRIGGER_OPTIONS } from "@/types/automation-draft";
import { Rocket, Sparkles } from "lucide-react";

type Props = {
  draft: AutomationDraft;
  onChange: (patch: Partial<AutomationDraft>) => void;
  onGenerate: () => void;
  onPublish: () => void;
  isGenerating?: boolean;
};

export function NewAutomationForm({
  draft,
  onChange,
  onGenerate,
  onPublish,
  isGenerating = false,
}: Props) {
  const canGenerate =
    draft.title.trim() &&
    draft.description.trim() &&
    draft.triggerType &&
    draft.desiredOutcome.trim();

  return (
    <Card className="p-6 lg:p-8 bg-surface border-border">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }}
      >
        <Field
          id="title"
          label="Automation Title"
          required
        >
          <Input
            id="title"
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g., Invoice Approval Workflow"
            className="bg-background"
          />
        </Field>

        <Field
          id="description"
          label="Short Description"
          required
        >
          <Textarea
            id="description"
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Briefly describe what this automation should do…"
            rows={3}
            className="bg-background resize-none"
          />
        </Field>

        <Field id="trigger" label="Trigger Type" required>
          <Select
            value={draft.triggerType || undefined}
            onValueChange={(v) => onChange({ triggerType: v as TriggerType })}
          >
            <SelectTrigger id="trigger" className="bg-background">
              <SelectValue placeholder="Select how this automation starts" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          id="outcome"
          label="Desired Outcome"
          hint="What should happen when this automation completes successfully?"
          required
        >
          <Textarea
            id="outcome"
            value={draft.desiredOutcome}
            onChange={(e) => onChange({ desiredOutcome: e.target.value })}
            placeholder="e.g., Create a HubSpot contact, notify #sales in Slack, and send a welcome email."
            rows={4}
            className="bg-background resize-none"
          />
        </Field>

        <Field
          id="rules"
          label="Important Business Rules"
          hint="Any conditions, thresholds, or approval requirements…"
        >
          <Textarea
            id="rules"
            value={draft.businessRules}
            onChange={(e) => onChange({ businessRules: e.target.value })}
            placeholder="e.g., Invoices over $5,000 require manager approval. EU leads route to Daniel."
            rows={4}
            className="bg-background resize-none"
          />
        </Field>

        <Field
          id="apps"
          label="Apps / Tools Involved"
        >
          <Input
            id="apps"
            value={draft.appsTools}
            onChange={(e) => onChange({ appsTools: e.target.value })}
            placeholder="e.g., Gmail, Slack, QuickBooks, Google Sheets"
            className="bg-background"
          />
        </Field>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <Button
            type="submit"
            disabled={!canGenerate || isGenerating}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-sm flex-1 sm:flex-none"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {isGenerating ? "Generating…" : "Generate"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canGenerate}
            onClick={onPublish}
            className="bg-surface flex-1 sm:flex-none"
          >
            <Rocket className="h-4 w-4 mr-1.5" />
            Publish
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
