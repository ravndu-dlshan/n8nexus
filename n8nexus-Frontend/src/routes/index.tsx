import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/MarketingNav";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Wand2, Workflow, FileText, Zap,
  GitBranch, Shield, Check, Star, Bot, Boxes,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "N8Nexus — AI workflow builder for n8n" },
      { name: "description", content: "Upload docs, describe a process in plain English, and generate ready-to-deploy n8n automations in minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <WorkflowPreview />
      <Testimonials />
      <Pricing />
      <CTA />
      <MarketingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative min-h-[min(88vh,800px)] sm:min-h-[min(92vh,880px)] lg:min-h-[min(92vh,960px)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hero-bg" />
        <div className="relative z-10 mx-auto max-w-7xl page-x pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <ScrollReveal variant="fade-up" duration={800}>
              <h1 className="text-[clamp(2rem,6vw,4.5rem)] leading-[1.08] font-bold tracking-tight max-w-4xl mx-auto">
                Describe a process.<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Ship an <span className="text-gradient-primary">n8n workflow.</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={120} duration={800}>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
                N8Nexus turns your SOPs, PDFs, and plain-English descriptions into structured
                process specs and production-ready n8n automations — no drag-and-drop required.
              </p>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={220} duration={800}>
              <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md sm:max-w-none mx-auto sm:mx-0">
                <Button asChild size="lg" className="btn-get-started h-11 sm:h-12 w-full sm:w-auto rounded-full px-8 sm:px-10 text-base font-medium shadow-none">
                  <Link to="/signup">Get started for free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 sm:h-12 w-full sm:w-auto px-6 bg-surface/50 backdrop-blur">
                  <Link to="/dashboard">View live demo</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl page-x pb-12 sm:pb-16 lg:pb-20">
        <ScrollReveal variant="scale" delay={180} duration={900} rootMargin="0px 0px -5% 0px">
          <HeroCard />
        </ScrollReveal>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="mt-8 sm:mt-12 lg:mt-16 mx-auto max-w-5xl">
      <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur p-2 shadow-card glow-ring">
        <div className="rounded-xl bg-background overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
            </div>
            <div className="ml-1 sm:ml-3 font-mono text-[10px] sm:text-xs text-muted-foreground truncate min-w-0">n8nexus.app/automations/lead-router</div>
          </div>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-0 min-h-[280px] sm:min-h-[360px]">
            <div className="border-b md:border-b-0 md:border-r border-border p-4 sm:p-5 space-y-3">
              <p className="text-xs font-mono uppercase text-primary tracking-widest">Prompt</p>
              <p className="text-sm leading-relaxed">
                "When a new lead submits the website form, score it with our rubric,
                add to HubSpot, post to <span className="text-primary">#sales-leads</span>,
                and email a tailored intro within 5 minutes."
              </p>
              <div className="pt-3 space-y-2">
                {["acme-sales-sop.pdf", "lead-scoring-rubric.md"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs rounded-md border border-border bg-surface px-3 py-2">
                    <FileText className="h-3.5 w-3.5 text-primary" /> {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-grid">
              <div className="space-y-3">
                {[
                  { icon: Zap, label: "Webhook · Form Trigger", color: "text-primary" },
                  { icon: Bot, label: "AI · Score Lead (rubric)", color: "text-primary-glow" },
                  { icon: GitBranch, label: "If score ≥ 70", color: "text-info" },
                  { icon: Boxes, label: "HubSpot · Create Contact", color: "text-success" },
                  { icon: Workflow, label: "Slack · Post #sales-leads", color: "text-warning" },
                ].map((n, i) => (
                  <ScrollReveal key={i} variant="fade-up" delay={i * 80} duration={500} rootMargin="0px 0px -2% 0px">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-background border border-border">
                        <n.icon className={`h-4 w-4 ${n.color}`} />
                      </div>
                      <span className="text-sm">{n.label}</span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">node {i + 1}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Upload, title: "Upload your docs", desc: "Drop SOPs, PDFs, Notion exports, or raw notes. We extract structure automatically." },
    { icon: Wand2, title: "Describe the process", desc: "Write what should happen in plain English. We turn it into a structured process spec." },
    { icon: Workflow, title: "Generate the workflow", desc: "Get a visual n8n workflow with triggers, nodes, conditions, and error handling — exportable as JSON." },
  ];
  return (
    <section id="how" className="section-y border-t border-border/60">
      <div className="mx-auto max-w-7xl page-x">
        <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-mono">How it works</p>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold">From sticky note to shipped automation in 3 steps</h2>
        </ScrollReveal>
        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 100} variant="fade-up" className="h-full">
            <div className="relative h-full rounded-2xl border border-border bg-surface p-7 shadow-card hover:border-primary/40 transition">
              <div className="absolute -top-3 left-7 px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-mono text-xs">
                step {String(i + 1).padStart(2, "0")}
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 border border-primary/30">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Bot, title: "AI process modeling", desc: "Auto-generates triggers, inputs, conditions, outputs, integrations, and error handling." },
    { icon: FileText, title: "Document grounding", desc: "References your SOPs and PDFs so workflows match how your team actually operates." },
    { icon: Workflow, title: "Visual editor", desc: "Refine generated workflows on a node canvas. Drag, swap, configure — your way." },
    { icon: GitBranch, title: "Versioning & approvals", desc: "Track every change. Review, comment, approve, then deploy with confidence." },
    { icon: Shield, title: "Self-host friendly", desc: "Export clean n8n JSON. Deploy to cloud or your own self-hosted instance." },
    { icon: Boxes, title: "200+ integrations", desc: "Every n8n node is supported — Slack, HubSpot, Stripe, Notion, Airtable, Postgres." },
  ];
  return (
    <section id="features" className="section-y border-t border-border/60">
      <div className="mx-auto max-w-7xl page-x">
        <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-mono">Features</p>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold">Everything you need to ship reliable automations</h2>
        </ScrollReveal>
        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i % 3) * 80 + Math.floor(i / 3) * 120} variant="fade-up" className="h-full">
              <div className="h-full rounded-xl border border-border bg-surface p-6 hover:bg-surface-elevated transition">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowPreview() {
  return (
    <section className="section-y border-t border-border/60 bg-surface/30">
      <div className="mx-auto max-w-7xl page-x grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <ScrollReveal variant="fade-right">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-mono">Process Specs</p>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold">Structured, editable, exportable.</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every workflow starts as a structured spec — not a black box. Review every trigger,
            condition, and integration before a single node is deployed.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Triggers & inputs validated against your sources",
              "Conditional branches with human-readable logic",
              "Error handling and retry policies built in",
              "Export to n8n JSON, copy as Markdown spec",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        </ScrollReveal>
        <ScrollReveal variant="fade-left" delay={120}>
        <div className="rounded-xl border border-border bg-background p-4 sm:p-5 font-mono text-[11px] sm:text-xs leading-relaxed shadow-card overflow-x-auto">
          <pre className="text-muted-foreground whitespace-pre-wrap min-w-0"><span className="text-primary">name:</span> Lead Router v3
<span className="text-primary">trigger:</span>
  type: webhook
  source: website-form
<span className="text-primary">steps:</span>
  - id: score_lead
    node: openai.chat
    using: rubric.md
  - id: branch
    if: score &gt;= 70
    then: [hubspot.create, slack.notify]
    else: [hubspot.archive]
<span className="text-primary">on_error:</span>
  retry: 3
  notify: ops@acme.com</pre>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Maya Chen", role: "Head of Ops, Northwind", quote: "We built our entire onboarding pipeline in an afternoon. N8Nexus did in 3 hours what took our last team 3 weeks." },
    { name: "Daniel Ortiz", role: "Founder, Outpost", quote: "Finally — automations that match how we actually work. The doc-grounding is the killer feature." },
    { name: "Priya Raman", role: "RevOps Lead, Vertex", quote: "I'm not technical, but I'm shipping production workflows. The spec-first approach makes me trust it." },
  ];
  return (
    <section id="testimonials" className="section-y border-t border-border/60">
      <div className="mx-auto max-w-7xl page-x">
        <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-mono">Trusted by operators</p>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold">Teams ship 10× faster with N8Nexus</h2>
        </ScrollReveal>
        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100} variant="fade-up" className="h-full">
            <div className="h-full rounded-xl border border-border bg-surface p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Starter", price: "$0", desc: "For solo builders exploring AI workflows.", features: ["3 automations", "100 AI generations/mo", "Community support", "JSON export"], cta: "Start free" },
    { name: "Pro", price: "$49", desc: "For operators shipping real automations.", features: ["Unlimited automations", "5,000 AI generations/mo", "Version history & approvals", "Priority support", "Self-host export"], cta: "Start 14-day trial", featured: true },
    { name: "Team", price: "$149", desc: "For automation teams with workspaces.", features: ["Everything in Pro", "Workspaces & SSO", "Audit logs", "Team comments", "Dedicated CSM"], cta: "Contact sales" },
  ];
  return (
    <section id="pricing" className="section-y border-t border-border/60">
      <div className="mx-auto max-w-7xl page-x">
        <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-mono">Pricing</p>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold">Start free. Scale when you ship.</h2>
        </ScrollReveal>
        <div className="mt-10 sm:mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((p, i) => (
            <ScrollReveal key={p.name} delay={i * 100} variant="fade-up" className="h-full">
            <div className={`h-full rounded-2xl border p-7 relative ${p.featured ? "border-primary/50 bg-surface shadow-glow" : "border-border bg-surface"}`}>
              {p.featured && <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground">Most popular</Badge>}
              <p className="text-sm font-semibold">{p.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className={`mt-7 w-full ${p.featured ? "bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-sm" : ""}`} variant={p.featured ? "default" : "outline"}>
                <Link to="/signup">{p.cta}</Link>
              </Button>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="section-y">
      <div className="mx-auto max-w-5xl page-x">
        <ScrollReveal variant="scale" duration={800}>
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/30 bg-surface p-8 sm:p-12 text-center shadow-glow">
          <div className="absolute inset-0 bg-radial-glow opacity-60" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Your next automation is one prompt away.</h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Join thousands of operators turning processes into n8n workflows in minutes.
            </p>
            <Button asChild size="lg" className="btn-get-started mt-6 sm:mt-8 h-11 sm:h-12 w-full sm:w-auto rounded-full px-8 sm:px-10 text-base font-medium shadow-none">
              <Link to="/signup">Get started for free</Link>
            </Button>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
