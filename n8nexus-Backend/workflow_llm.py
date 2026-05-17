import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from llm import invoke_chat_model
from logger import setup_logging
from n8n_registry import TEMPLATES, templates_catalog_for_llm

log = setup_logging()

_JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}")


def _parse_json_object(text: str) -> dict:
    text = text.strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    match = _JSON_BLOCK_RE.search(text)
    if match:
        data = json.loads(match.group())
        if isinstance(data, dict):
            return data
    raise ValueError("LLM did not return valid JSON")


def extract_workflow_state(
    transcript: list[dict[str, str]],
    model: str | None = None,
) -> dict:
    """Infer template choice and field values from the conversation."""
    user_assistant = [m for m in transcript if m.get("role") in ("user", "assistant")]
    if not user_assistant:
        return {"template_id": None, "fields": {}, "missing_fields": [], "ready": False}

    convo_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in user_assistant[-20:]
    )
    catalog = templates_catalog_for_llm()
    system = (
        "You extract structured n8n workflow requirements from a chat. "
        "Pick the best matching template_id from the catalog, or null if unclear. "
        "Only include field values explicitly stated or clearly confirmed by the user. "
        "Return ONLY a JSON object with keys: "
        "template_id (string|null), fields (object), missing_fields (string[]), "
        "ready (boolean, true only when every required field is known and valid)."
        f"\n\nTemplates:\n{catalog}"
    )
    human = f"Conversation:\n{convo_text}"

    try:
        raw = invoke_chat_model(
            [SystemMessage(content=system), HumanMessage(content=human)],
            model=model,
        )
        data = _parse_json_object(raw)
    except Exception:
        log.exception("Workflow extraction failed")
        return {"template_id": None, "fields": {}, "missing_fields": [], "ready": False}

    template_id = data.get("template_id")
    if template_id is not None and template_id not in TEMPLATES:
        template_id = None

    fields = data.get("fields") or {}
    if not isinstance(fields, dict):
        fields = {}
    fields = {str(k): str(v) for k, v in fields.items() if v is not None}

    missing = data.get("missing_fields") or []
    if not isinstance(missing, list):
        missing = []
    missing = [str(m) for m in missing]

    ready = bool(data.get("ready", False))
    return {
        "template_id": template_id,
        "fields": fields,
        "missing_fields": missing,
        "ready": ready,
    }
