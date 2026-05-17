import { apiRequest } from "./client";

export type AutomationStatus = "generated" | "deployed" | "deploy_failed";

export type Automation = {
  id: string;
  user_id: string;
  session_id: string;
  template_id: string | null;
  template_title: string | null;
  workflow_name: string;
  workflow_json: Record<string, unknown>;
  fields: Record<string, string>;
  status: AutomationStatus;
  n8n_workflow_id: string | null;
  n8n_instance_url: string | null;
  editor_url: string | null;
  webhook_path: string | null;
  webhook_test_url: string | null;
  webhook_production_url: string | null;
  active: boolean | null;
  deploy_error: string | null;
  created_at: string | null;
  updated_at: string | null;
  deployed_at: string | null;
};

export function listAutomations() {
  return apiRequest<Automation[]>("/automations");
}

export function getAutomation(id: string) {
  return apiRequest<Automation>(`/automations/${encodeURIComponent(id)}`);
}

export function getAutomationBySession(sessionId: string) {
  return apiRequest<Automation>(
    `/automations/by-session/${encodeURIComponent(sessionId)}`,
  );
}

export type AutomationRunResult = {
  success: boolean;
  message: string;
  trigger?: string | null;
  execution_id?: string | null;
  finished?: boolean | null;
  summary?: string | null;
  response_preview?: unknown;
  http_status?: number | null;
};

export function runAutomation(id: string) {
  return apiRequest<AutomationRunResult>(
    `/automations/${encodeURIComponent(id)}/run`,
    { method: "POST" },
    180_000,
  );
}

export function automationStatusLabel(status: AutomationStatus): string {
  switch (status) {
    case "deployed":
      return "Deployed";
    case "deploy_failed":
      return "Deploy failed";
    default:
      return "Generated";
  }
}

export function automationTriggerLabel(templateId: string | null): string {
  if (!templateId) return "—";
  if (templateId.startsWith("webhook")) return "Webhook";
  if (templateId.startsWith("manual")) return "Manual";
  return templateId;
}
