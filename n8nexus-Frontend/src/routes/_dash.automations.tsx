import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_dash/automations")({
  component: AutomationsLayout,
});

function AutomationsLayout() {
  return <Outlet />;
}
