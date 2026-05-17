import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SupabaseConfigBanner() {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Supabase not configured</AlertTitle>
      <AlertDescription>
        Add <code className="text-xs">VITE_SUPABASE_URL</code> and{" "}
        <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to your{" "}
        <code className="text-xs">.env</code> file, then restart the dev server.
      </AlertDescription>
    </Alert>
  );
}
