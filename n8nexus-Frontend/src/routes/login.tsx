import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { SupabaseConfigBanner } from "@/components/auth/SupabaseConfigBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { redirectIfAuthenticated } from "@/lib/auth-guards";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfAuthenticated,
  head: () => ({
    meta: [
      { title: "Sign in — N8Nexus" },
      { name: "description", content: "Sign in to your N8Nexus workspace." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { signInWithEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue building automations."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary font-medium">
            Sign up
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {!isConfigured && <SupabaseConfigBanner />}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={!isConfigured || loading}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary">
                Forgot?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={!isConfigured || loading}
            />
          </div>
          <Button
            type="submit"
            className="btn-get-started h-11 w-full rounded-full text-base font-medium shadow-none"
            disabled={!isConfigured || loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
