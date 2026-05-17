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

export const Route = createFileRoute("/signup")({
  beforeLoad: redirectIfAuthenticated,
  head: () => ({
    meta: [
      { title: "Create account — N8Nexus" },
      { name: "description", content: "Create your N8Nexus workspace and start automating." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { signUpWithEmail, isConfigured } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUpWithEmail(email, password, {
        firstName,
        lastName,
        workspaceName,
      });

      if (needsEmailConfirmation) {
        toast.success("Check your email to confirm your account.");
        navigate({ to: "/login" });
        return;
      }

      toast.success("Workspace created. Welcome to N8Nexus!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Free forever for solo builders. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {!isConfigured && <SupabaseConfigBanner />}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first">First name</Label>
              <Input
                id="first"
                placeholder="Ravindu"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                disabled={!isConfigured || loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last">Last name</Label>
              <Input
                id="last"
                placeholder="Dilshan"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                disabled={!isConfigured || loading}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws">Workspace name</Label>
            <Input
              id="ws"
              placeholder="Ravindu's workspace"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={!isConfigured || loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ravindu.dilshan@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={!isConfigured || loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={!isConfigured || loading}
            />
          </div>
          <Button
            type="submit"
            className="btn-get-started h-11 w-full rounded-full text-base font-medium shadow-none"
            disabled={!isConfigured || loading}
          >
            {loading ? "Creating…" : "Create workspace"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By signing up you agree to our{" "}
            <a className="underline" href="#">
              Terms
            </a>{" "}
            and{" "}
            <a className="underline" href="#">
              Privacy
            </a>
            .
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
