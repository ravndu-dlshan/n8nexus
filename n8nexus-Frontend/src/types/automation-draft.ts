export type TriggerType =
  | "email"
  | "form"
  | "scheduled"
  | "webhook"
  | "manual"
  | "database";

export interface AutomationDraft {
  title: string;
  description: string;
  triggerType: TriggerType | "";
  desiredOutcome: string;
  businessRules: string;
  appsTools: string;
}

export const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: "email", label: "Email received" },
  { value: "form", label: "Form submitted" },
  { value: "scheduled", label: "Scheduled (cron)" },
  { value: "webhook", label: "Webhook" },
  { value: "manual", label: "Manual trigger" },
  { value: "database", label: "Database change" },
];

export const emptyAutomationDraft = (): AutomationDraft => ({
  title: "",
  description: "",
  triggerType: "",
  desiredOutcome: "",
  businessRules: "",
  appsTools: "",
});
