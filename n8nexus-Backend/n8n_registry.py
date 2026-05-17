import json
import re
from dataclasses import dataclass
from pathlib import Path

_TEMPLATES_DIR = Path(__file__).resolve().parent / "n8n_templates"
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


@dataclass(frozen=True)
class FieldSpec:
    name: str
    label: str
    required: bool = True
    default: str | None = None


@dataclass(frozen=True)
class TemplateSpec:
    id: str
    title: str
    description: str
    demo_use_case: str
    fields: tuple[FieldSpec, ...]
    filename: str

    def required_field_names(self) -> list[str]:
        return [f.name for f in self.fields if f.required]

    def field_defaults(self) -> dict[str, str]:
        return {f.name: f.default for f in self.fields if f.default is not None}


TEMPLATES: dict[str, TemplateSpec] = {
    "manual_set": TemplateSpec(
        id="manual_set",
        title="Manual Trigger → Set",
        description="Simplest workflow proof with manual trigger and Set node.",
        demo_use_case="Employee onboarding or any manual data setup workflow.",
        filename="manual_set.json",
        fields=(
            FieldSpec("workflow_name", "Workflow name"),
            FieldSpec("message", "Set node message value"),
            FieldSpec("status", "Set node status value"),
        ),
    ),
    "manual_http": TemplateSpec(
        id="manual_http",
        title="Manual Trigger → HTTP Request",
        description="Calls an external API from a manual trigger.",
        demo_use_case="Fetch data from a REST API on demand.",
        filename="manual_http.json",
        fields=(
            FieldSpec("workflow_name", "Workflow name"),
            FieldSpec("url", "HTTP request URL"),
        ),
    ),
    "webhook_lead": TemplateSpec(
        id="webhook_lead",
        title="Webhook → Set → Respond",
        description="Lead capture API with webhook, Set, and JSON response.",
        demo_use_case="Lead capture automation API.",
        filename="webhook_lead.json",
        fields=(
            FieldSpec("workflow_name", "Workflow name"),
            FieldSpec("webhook_path", "Webhook path (slug, e.g. lead-capture)"),
            FieldSpec("response_status", "Response status message"),
        ),
    ),
    "webhook_ai": TemplateSpec(
        id="webhook_ai",
        title="Webhook → AI Reply → Respond",
        description="Customer support style webhook with mock AI reply.",
        demo_use_case="Customer support assistant API.",
        filename="webhook_ai.json",
        fields=(
            FieldSpec("workflow_name", "Workflow name"),
            FieldSpec("webhook_path", "Webhook path (slug, e.g. ai-chat)"),
            FieldSpec("ai_reply", "Mock AI reply text"),
        ),
    ),
    "webhook_supabase": TemplateSpec(
        id="webhook_supabase",
        title="Webhook → Supabase Ready → Respond",
        description="Registration webhook that prepares a database-ready payload.",
        demo_use_case="Customer registration automation.",
        filename="webhook_supabase.json",
        fields=(
            FieldSpec("workflow_name", "Workflow name"),
            FieldSpec("webhook_path", "Webhook path (slug, e.g. register-user)"),
            FieldSpec(
                "database_label",
                "Database label in Set node",
                required=False,
                default="Supabase",
            ),
            FieldSpec(
                "status_message",
                "Status message in Set node",
                default="Ready for insert",
            ),
        ),
    ),
}


def list_templates() -> list[TemplateSpec]:
    return list(TEMPLATES.values())


def get_template(template_id: str) -> TemplateSpec | None:
    return TEMPLATES.get(template_id)


def load_template_json(template_id: str) -> dict:
    spec = TEMPLATES.get(template_id)
    if spec is None:
        raise KeyError(template_id)
    path = _TEMPLATES_DIR / spec.filename
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def templates_catalog_for_llm() -> str:
    lines: list[str] = []
    for t in TEMPLATES.values():
        fields = ", ".join(f"{f.name} ({f.label})" for f in t.fields)
        lines.append(
            f'- id="{t.id}": {t.title}. {t.description} '
            f"Use when: {t.demo_use_case}. Fields: {fields}."
        )
    return "\n".join(lines)


def normalize_webhook_path(value: str) -> str:
    slug = value.strip().lower().replace("_", "-")
    slug = re.sub(r"[^a-z0-9-]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug or "webhook-endpoint"


def validate_field(template_id: str, field_name: str, value: str) -> str | None:
    if not value or not value.strip():
        return "Value cannot be empty."
    text = value.strip()
    if field_name == "webhook_path":
        path = normalize_webhook_path(text)
        if not _SLUG_RE.match(path):
            return "Webhook path must be a lowercase slug (letters, numbers, hyphens)."
    if field_name == "url" and not _URL_RE.match(text):
        return "URL must start with http:// or https://."
    return None


def compute_missing_fields(template_id: str, fields: dict[str, str]) -> list[str]:
    spec = TEMPLATES.get(template_id)
    if spec is None:
        return []
    missing: list[str] = []
    merged = {**spec.field_defaults(), **fields}
    for f in spec.fields:
        val = merged.get(f.name, "")
        if f.required and (not val or not str(val).strip()):
            missing.append(f.name)
            continue
        if val and validate_field(template_id, f.name, str(val)):
            missing.append(f.name)
    return missing


def is_ready(template_id: str | None, fields: dict[str, str]) -> bool:
    if not template_id or template_id not in TEMPLATES:
        return False
    return len(compute_missing_fields(template_id, fields)) == 0
