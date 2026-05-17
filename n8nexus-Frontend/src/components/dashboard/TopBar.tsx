import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  getUserDisplayName,
  getUserInitials,
  getWorkspaceName,
  useAuth,
} from "@/contexts/auth-context";

export function TopBar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const workspaceName = getWorkspaceName(user);
  const workspaceInitial = workspaceName[0]?.toUpperCase() ?? "W";

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 border-b border-border bg-background/80 backdrop-blur min-w-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Hide sidebar (Ctrl+B)</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-surface gap-2">
            <span className="grid h-5 w-5 place-items-center rounded bg-gradient-primary text-[10px] font-bold text-primary-foreground">
              {workspaceInitial}
            </span>
            <span className="hidden sm:inline">{workspaceName}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2">
            <span className="grid h-5 w-5 place-items-center rounded bg-surface-elevated text-[10px] font-semibold">
              {workspaceInitial}
            </span>
            {workspaceName}
            <Check className="ml-auto h-3.5 w-3.5 text-primary" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Plus className="h-3.5 w-3.5 mr-2" /> New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden md:flex relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search automations, docs, integrations…"
          className="pl-9 bg-surface border-border h-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="relative h-10 w-10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications <Badge variant="outline" className="border-primary/30 text-primary">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { t: "Lead Router v3 was approved", s: "2m ago" },
              { t: "AI generated spec for Invoice Reminders", s: "1h ago" },
              { t: "Daniel commented on Customer Onboarding", s: "3h ago" },
            ].map((n) => (
              <DropdownMenuItem key={n.t} className="flex flex-col items-start gap-0.5 py-2.5">
                <span className="text-sm">{n.t}</span>
                <span className="text-[11px] text-muted-foreground">{n.s}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-full">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-surface-elevated text-sm font-medium">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
            {user?.email && (
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                {user.email}
              </DropdownMenuLabel>
            )}
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
