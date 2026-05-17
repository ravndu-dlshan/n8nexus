import { useEffect, useState } from "react";
import { Building2, Check, Save, Target, Users, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  COMMUNICATION_CHANNELS,
  COMPANY_SIZES,
  DEPARTMENTS,
  INDUSTRIES,
  PROFILE_STORAGE_KEY,
  TOOLS,
  countCompletedSections,
  emptyBusinessProfile,
  type BusinessProfile,
} from "@/types/business-profile";

function loadProfile(): BusinessProfile {
  if (typeof window === "undefined") return emptyBusinessProfile();
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return emptyBusinessProfile();
    return { ...emptyBusinessProfile(), ...JSON.parse(raw) };
  } catch {
    return emptyBusinessProfile();
  }
}

function ToggleChips({
  label,
  hint,
  options,
  selected,
  onChange,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value],
    );
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const COMPANY_SIZE_META: Record<string, { label: string; hint: string }> = {
  "1-10": { label: "1–10", hint: "Micro" },
  "11-50": { label: "11–50", hint: "Small" },
  "51-200": { label: "51–200", hint: "Growing" },
  "201-500": { label: "201–500", hint: "Large" },
  "500+": { label: "500+", hint: "Enterprise" },
};

function CompanySizeCrowdIcon({ active }: { active: boolean }) {
  const crowdClass = active ? "text-primary" : "text-muted-foreground/75 group-hover:text-foreground/85";

  return (
    <div
      className={`grid h-7 w-9 place-items-center rounded-lg border ${
        active
          ? "border-primary/30 bg-primary/10"
          : "border-border/60 bg-muted/30 group-hover:border-primary/20"
      }`}
      aria-hidden
    >
      <Users className={`h-4 w-4 ${crowdClass}`} strokeWidth={1.75} />
    </div>
  );
}

function CompanySizePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (size: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        Company Size
      </Label>
      <p className="text-xs text-muted-foreground">How many people work at your company?</p>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5"
        role="radiogroup"
        aria-label="Company size"
      >
        {COMPANY_SIZES.map((size) => {
          const active = value === size;
          const meta = COMPANY_SIZE_META[size] ?? { label: size, hint: "" };
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(size)}
              className={`group relative flex flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-center transition-all duration-200 ${
                active
                  ? "border-primary bg-gradient-to-b from-primary/20 to-primary/5 shadow-glow-sm ring-1 ring-primary/40"
                  : "border-border bg-background hover:border-primary/35 hover:bg-surface-elevated"
              }`}
            >
              {active && (
                <span className="absolute top-1 right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2 w-2" strokeWidth={3} />
                </span>
              )}
              <CompanySizeCrowdIcon active={active} />
              <span
                className={`text-xs font-semibold tracking-tight leading-none ${
                  active ? "text-primary" : "text-foreground"
                }`}
              >
                {meta.label}
              </span>
              <span
                className={`text-[9px] uppercase tracking-wider font-mono leading-none ${
                  active ? "text-primary/80" : "text-muted-foreground"
                }`}
              >
                {meta.hint}
              </span>
              <span className="sr-only">employees</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 border border-primary/30">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

export function BusinessProfileForm() {
  const [profile, setProfile] = useState<BusinessProfile>(loadProfile);
  const [saving, setSaving] = useState(false);

  const completed = countCompletedSections(profile);
  const totalSections = 4;
  const progressPct = (completed / totalSections) * 100;

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const update = (patch: Partial<BusinessProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      toast.success("Profile saved", {
        description: "Your business context will improve AI suggestions in Chat Workspace.",
      });
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Business Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Help N8Nexus AI understand your business for better automation suggestions.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">
          {completed}/{totalSections} sections
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress value={progressPct} className="h-1.5" />
        <p className="text-[11px] text-muted-foreground font-mono">
          Complete all sections for the best chat and workflow recommendations.
        </p>
      </div>

      <SectionCard icon={Building2} title="Business Basics">
        <div className="space-y-1.5">
          <Label htmlFor="business-name">Business Name</Label>
          <Input
            id="business-name"
            value={profile.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            placeholder="Acme Corporation"
            className="bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Industry</Label>
          <Select
            value={profile.industry || undefined}
            onValueChange={(v) => update({ industry: v })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CompanySizePicker
          value={profile.companySize}
          onChange={(companySize) => update({ companySize })}
        />

        <div className="space-y-1.5">
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            value={profile.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Briefly describe what your business does, your main products/services, and your typical customers…"
            rows={4}
            className="bg-background resize-none"
          />
        </div>
      </SectionCard>

      <SectionCard icon={Wrench} title="Operations & Tools">
        <ToggleChips
          label="Main Departments"
          options={DEPARTMENTS}
          selected={profile.departments}
          onChange={(departments) => update({ departments })}
        />
        <ToggleChips
          label="Tools You Currently Use"
          options={TOOLS}
          selected={profile.tools}
          onChange={(tools) => update({ tools })}
        />
        <ToggleChips
          label="Communication Channels"
          options={COMMUNICATION_CHANNELS}
          selected={profile.communicationChannels}
          onChange={(communicationChannels) => update({ communicationChannels })}
        />
        <div className="space-y-1.5">
          <Label htmlFor="processes">Common Business Processes</Label>
          <Textarea
            id="processes"
            value={profile.commonProcesses}
            onChange={(e) => update({ commonProcesses: e.target.value })}
            placeholder="List the key processes you run regularly (e.g., invoice approvals, employee onboarding, order fulfillment)…"
            rows={4}
            className="bg-background resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approvals">Approval Hierarchy</Label>
          <Textarea
            id="approvals"
            value={profile.approvalHierarchy}
            onChange={(e) => update({ approvalHierarchy: e.target.value })}
            placeholder="Describe who approves what (e.g., Manager approves purchases under $5K, Director for above)…"
            rows={3}
            className="bg-background resize-none"
          />
        </div>
      </SectionCard>

      <SectionCard icon={Target} title="Goals & Pain Points">
        <div className="space-y-1.5">
          <Label htmlFor="goals">Goals for Automation</Label>
          <Textarea
            id="goals"
            value={profile.goalsAutomation}
            onChange={(e) => update({ goalsAutomation: e.target.value })}
            placeholder="What do you hope to achieve with automation? (e.g., reduce manual data entry, speed up approvals, eliminate errors)…"
            rows={4}
            className="bg-background resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pain">Pain Points & Repetitive Tasks</Label>
          <Textarea
            id="pain"
            value={profile.painPoints}
            onChange={(e) => update({ painPoints: e.target.value })}
            placeholder="What tasks take too much time or are error-prone? What do your team members complain about most?…"
            rows={4}
            className="bg-background resize-none"
          />
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-sm"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

