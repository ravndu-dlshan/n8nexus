import { apiRequest } from "./client";

export type WorkflowStatus = {
  template_id: string | null;
  template_title: string | null;
  fields: Record<string, string>;
  missing_fields: string[];
  field_labels: Record<string, string>;
  ready: boolean;
  templates_available: string[];
};

export type WorkflowGenerateResponse = {
  session_id: string;
  template_id: string;
  workflow: Record<string, unknown>;
  automation_id?: string | null;
};

export type WorkflowDeployResponse = {
  success: boolean;
  session_id: string;
  template_id: string | null;
  n8n_workflow_id: string | null;
  workflow_name: string | null;
  active: boolean | null;
  n8n_instance_url: string | null;
  editor_url: string | null;
  webhook_test_url: string | null;
  webhook_production_url: string | null;
  chat_summary: string;
  http_status?: number | null;
  automation_id?: string | null;
};

export type TemplateSummary = {
  id: string;
  title: string;
  description: string;
  demo_use_case: string;
  required_fields: string[];
};

export function getWorkflowStatus(sessionId: string) {
  return apiRequest<WorkflowStatus>(
    `/workflows/sessions/${encodeURIComponent(sessionId)}/status`,
  );
}

/** Runs workflow extraction in the background (decoupled from chat streaming). */
export function syncWorkflowStatus(sessionId: string) {
  return apiRequest<WorkflowStatus>(
    `/workflows/sessions/${encodeURIComponent(sessionId)}/sync`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function generateWorkflow(sessionId: string) {
  return apiRequest<WorkflowGenerateResponse>(
    `/workflows/sessions/${encodeURIComponent(sessionId)}/generate`,
    { method: "POST" },
    undefined,
    { requireAuth: true },
  );
}

export function deployWorkflow(sessionId: string) {
  return apiRequest<WorkflowDeployResponse>(
    `/workflows/sessions/${encodeURIComponent(sessionId)}/deploy`,
    { method: "POST" },
    undefined,
    { requireAuth: true },
  );
}

export function listWorkflowTemplates() {
  return apiRequest<TemplateSummary[]>("/workflows/templates");
}
