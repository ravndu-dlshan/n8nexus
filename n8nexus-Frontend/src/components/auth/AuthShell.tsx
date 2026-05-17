import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-background">
      <div aria-hidden className="auth-split-divider hidden lg:block" />
      <div className="relative hidden lg:flex flex-col p-10 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/auth-space-robot.png)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/25"
        />
        <div aria-hidden className="absolute inset-0 bg-radial-glow opacity-60" />
        <div className="relative z-10">
          <Logo />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-center p-6 lg:hidden">
          <Logo />
          <Link to="/" className="text-sm text-muted-foreground">Back to site</Link>
        </div>
        <div className="flex-1 grid place-items-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full max-w-[min(100%,24rem)]">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8 [&_input]:h-11">{children}</div>
            {footer && <div className="mt-6 text-sm text-muted-foreground text-center">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
