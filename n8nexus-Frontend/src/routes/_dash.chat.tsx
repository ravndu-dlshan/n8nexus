import { createFileRoute } from "@tanstack/react-router";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

export const Route = createFileRoute("/_dash/chat")({
  head: () => ({
    meta: [
      { title: "Chat Workspace — N8Nexus" },
      {
        name: "description",
        content:
          "Describe business processes in plain English and convert them into n8n-ready automation workflows.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <ChatWorkspace />
    </div>
  );
}
