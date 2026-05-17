import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { useAuth } from "@/contexts/auth-context";

export function GoogleSignInButton() {
  const { signInWithGoogle, isConfigured } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign in failed.");
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full bg-surface"
      onClick={handleClick}
      disabled={!isConfigured || loading}
    >
      <GoogleIcon />
      {loading ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
