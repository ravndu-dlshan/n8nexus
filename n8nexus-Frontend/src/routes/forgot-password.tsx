import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { SupabaseConfigBanner } from "@/components/auth/SupabaseConfigBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { redirectIfAuthenticated } from "@/lib/auth-guards";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: redirectIfAuthenticated,
  head: () => ({
    meta: [
      { title: "Reset password — N8Nexus" },
      { name: "description", content: "Reset your N8Nexus password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Check your email for a reset link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send you a secure link to reset your password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </>
      }
    >
      {!isConfigured && <SupabaseConfigBanner />}
      {sent ? (
        <p className="text-sm text-muted-foreground">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link
          shortly.
        </p>
      ) : (
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
          <Button
            type="submit"
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-sm"
            disabled={!isConfigured || loading}
          >
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
