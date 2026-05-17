import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Workflow, Plus, MessagesSquare, Building2, LayoutTemplate, FileText,
  Activity, Settings,
} from "lucide-react";
import { listAutomations } from "@/lib/api/automations";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/Logo";

const main = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "New automation", url: "/automations/new", icon: Plus, highlight: true },
  { title: "Chat Workspace", url: "/chat", icon: MessagesSquare },
  { title: "Business Profile", url: "/business-profile", icon: Building2 },
  { title: "Automations", url: "/automations", icon: Workflow },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Activity", url: "/activity", icon: Activity },
];

const footer = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { data: automations } = useQuery({
    queryKey: ["automations"],
    queryFn: listAutomations,
  });
  const recentAutomations = (automations ?? []).slice(0, 3);
  const isActive = (url: string) => {
    if (url === "/dashboard") return path === url;
    if (url === "/automations") return path === "/automations" || path === "/automations/";
    if (url === "/automations/new") return path === "/automations/new";
    if (url === "/chat") return path === "/chat" || path.startsWith("/chat/");
    if (url === "/business-profile") return path === "/business-profile";
    return path.startsWith(url);
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarRail />
      <SidebarHeader className="h-16 px-3 flex justify-center border-b border-sidebar-border">
        <Logo withText={!collapsed} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className={`h-4 w-4 ${item.highlight ? "text-primary" : ""}`} />
                      {!collapsed && (
                        <span className={item.highlight ? "text-primary font-medium" : ""}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && recentAutomations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentAutomations.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <Link
                        to="/automations/$id"
                        params={{ id: item.id }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        <span className="truncate">{item.workflow_name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {footer.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
