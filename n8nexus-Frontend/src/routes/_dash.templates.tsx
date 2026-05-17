import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listWorkflowTemplates } from "@/lib/api/workflows";
import { ApiError } from "@/lib/api/client";
import { Boxes, MessagesSquare, Play, Search, Webhook } from "lucide-react";

export const Route = createFileRoute("/_dash/templates")({
  head: () => ({
    meta: [
      { title: "Templates — N8Nexus" },
      { name: "description", content: "Production-ready automation templates." },
    ],
  }),
  component: Templates,
});

type Filter = "all" | "manual" | "webhook";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "manual", label: "Manual" },
  { id: "webhook", label: "Webhook" },
];

function templateIcon(id: string) {
  return id.startsWith("webhook") ? Webhook : Play;
}

function templateCategory(id: string) {
  return id.startsWith("webhook") ? "Webhook" : "Manual";
}

function Templates() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: listWorkflowTemplates,
  });

  const items = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((t) => {
      if (filter === "manual" && !t.id.startsWith("manual")) return false;
      if (filter === "webhook" && !t.id.startsWith("webhook")) return false;
      if (!q) return true;
      const haystack = [t.id, t.title, t.description, t.demo_use_case].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [data, search, filter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Loading templates…"
            : `${data?.length ?? 0} workflow template${(data?.length ?? 0) === 1 ? "" : "s"} from the API`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates…"
            className="pl-9 bg-surface"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Badge
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              className={
                filter === f.id
                  ? "bg-primary text-primary-foreground cursor-pointer"
                  : "bg-surface cursor-pointer hover:bg-surface-elevated"
              }
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      </div>

      {isError && (
        <Card className="p-5 bg-destructive/10 border-destructive/30 text-sm">
          <p className="font-medium text-destructive">Could not load templates</p>
          <p className="mt-1 text-muted-foreground">
            {error instanceof ApiError
              ? error.message
              : "Check that the API on port 8000 is running."}
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 bg-surface border-border">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <Skeleton className="mt-4 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
              </Card>
            ))
          : items.length === 0
            ? (
                <Card className="sm:col-span-2 lg:col-span-3 p-8 text-center bg-surface border-border">
                  <p className="text-sm font-medium">No templates match your search</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a different filter or clear the search box.
                  </p>
                </Card>
              )
            : items.map((t) => {
                const Icon = templateIcon(t.id);
                return (
                  <Card
                    key={t.id}
                    className="p-5 bg-surface border-border hover:border-primary/40 transition group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        {t.id}
                      </Badge>
                    </div>
                    <h3 className="mt-4 font-semibold">{t.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {t.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.demo_use_case}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Boxes className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {templateCategory(t.id)} · {t.required_fields.length} field
                          {t.required_fields.length === 1 ? "" : "s"}
                        </span>
                      </span>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-background shrink-0 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Link to="/chat">
                          <MessagesSquare className="h-3.5 w-3.5 mr-1" />
                          Use in chat
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
      </div>
    </div>
  );
}
