export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type N8nWorkflow = {
  name: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export function asN8nWorkflow(workflow: Record<string, unknown>): N8nWorkflow {
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  return {
    name: typeof workflow.name === "string" ? workflow.name : "Generated workflow",
    nodes: nodes as N8nWorkflow["nodes"],
    connections:
      workflow.connections && typeof workflow.connections === "object"
        ? (workflow.connections as Record<string, unknown>)
        : {},
    settings:
      workflow.settings && typeof workflow.settings === "object"
        ? (workflow.settings as Record<string, unknown>)
        : {},
  };
}
