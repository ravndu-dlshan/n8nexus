import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Menu, Twitter, X, Youtube } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#testimonials" },
] as const;

const FOOTER_LEGAL_LINKS = [
  { label: "Terms And Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
] as const;

const FOOTER_SOCIAL_LINKS = [
  { label: "Instagram", href: "https://n8n.io?utm_source=chatgpt.com", icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/@n8n-io?utm_source=chatgpt.com", icon: Youtube },
  { label: "Twitter", href: "https://twitter.com/n8n_io?utm_source=chatgpt.com", icon: Twitter },
  { label: "Facebook", href: "https://facebook.com/n8nio?utm_source=chatgpt.com", icon: Facebook },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/n8n?utm_source=chatgpt.com", icon: Linkedin },
] as const;

function NavLinks({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={className} aria-label="Main">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2.5 hover:bg-surface hover:text-foreground transition md:inline md:px-0 md:py-0 md:hover:bg-transparent"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-2 sm:px-4 sm:pt-3 md:px-6 md:pt-4">
      <div className="glass mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between gap-2 rounded-2xl px-3 sm:px-6">
        <Logo />

        <NavLinks className="hidden md:flex items-center gap-6 lg:gap-8 text-sm lg:text-base text-muted-foreground" />

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            asChild
            variant="ghost"
            className="hidden sm:inline-flex h-9 px-3 sm:px-4 text-sm font-medium"
          >
            <Link to="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="btn-get-started h-8 sm:h-9 rounded-full px-3 sm:px-5 text-xs sm:text-sm font-medium shadow-none"
          >
            <Link to="/signup">
              <span className="hidden min-[420px]:inline">Get started for free</span>
              <span className="min-[420px]:hidden">Get started</span>
            </Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 shrink-0"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] border-border bg-background p-0 flex flex-col">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <div className="flex items-center justify-between">
                  <Logo />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>
              <NavLinks
                className="flex flex-col gap-1 px-3 py-4 text-base text-muted-foreground"
                onNavigate={() => setMobileOpen(false)}
              />
              <div className="mt-auto border-t border-border p-4 flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full bg-surface sm:hidden">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="btn-get-started w-full shadow-none">
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    Get started for free
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Features", "Templates", "Pricing", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Resources", links: ["Docs", "API", "Community", "Support"] },
] as const;

export function MarketingFooter() {
  return (
    <div className="footer-shell">
      <footer className="footer-panel relative overflow-hidden">
        <img
          src="/footer-world-map.svg"
          alt=""
          aria-hidden
          className="footer-world-map pointer-events-none absolute inset-x-0 top-6 bottom-20 left-1/2 w-[min(150%,1280px)] max-w-none -translate-x-1/2 object-contain opacity-[0.34] sm:opacity-[0.38]"
        />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 page-x pt-10 pb-6 sm:pt-12 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-px w-8 shrink-0 bg-primary" aria-hidden />
              Ready to get started?
            </p>
            <Button
              asChild
              variant="outline"
              className="h-11 w-full sm:w-auto rounded-lg border-border/80 bg-background/60 px-6 text-xs font-semibold uppercase tracking-wider hover:bg-surface"
            >
              <Link to="/signup">Let&apos;s start together</Link>
            </Button>
          </div>
        </div>

        <section className="relative z-10 border-t border-border/30">
          <div className="relative mx-auto max-w-7xl page-x py-10 sm:py-14 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_1.6fr] lg:gap-16 xl:gap-24">
              <div className="max-w-md">
                <h2 className="text-xl font-display font-semibold leading-snug tracking-tight sm:text-2xl md:text-3xl">
                  Turn plain English into{" "}
                  <span className="text-gradient-primary">production-ready n8n workflows.</span>
                </h2>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
                {FOOTER_COLUMNS.map((col) => (
                  <div key={col.title}>
                    <p className="mb-3 sm:mb-4 text-sm font-semibold text-foreground">{col.title}</p>
                    <ul className="space-y-2 sm:space-y-2.5 text-sm text-muted-foreground">
                      {col.links.map((l) => (
                        <li key={l}>
                          <a href="#" className="transition hover:text-foreground">
                            {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto max-w-7xl page-x pb-8 sm:pb-10">
          <div className="flex flex-col gap-5 rounded-xl border border-border/50 bg-[oklch(0.14_0.012_250)] px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <nav
              className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:justify-start"
              aria-label="Legal"
            >
              <span>© 2026 N8Nexus. Built for the automation generation.</span>
              <span className="text-muted-foreground/40" aria-hidden>
                ·
              </span>
              {FOOTER_LEGAL_LINKS.map((link, i) => (
                <span key={link.label} className="inline-flex items-center gap-x-2">
                  {i > 0 && (
                    <span className="text-muted-foreground/40" aria-hidden>
                      ·
                    </span>
                  )}
                  <a href={link.href} className="transition hover:text-foreground">
                    {link.label}
                  </a>
                </span>
              ))}
            </nav>
            <div className="flex items-center justify-center gap-4 sm:gap-5 sm:justify-end">
              {FOOTER_SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-foreground/90 transition hover:text-primary"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}