import copy
import uuid

from n8n_client import N8nApiError, N8nConfigError, create_workflow, n8n_instance_url
from n8n_registry import normalize_webhook_path


WEBHOOK_TEMPLATE_PREFIX = "webhook_"


def prepare_n8n_create_payload(workflow: dict) -> dict:
    nodes = copy.deepcopy(workflow.get("nodes", []))
    for node in nodes:
        node["id"] = str(uuid.uuid4())
    return {
        "name": workflow.get("name", "Generated Workflow"),
        "nodes": nodes,
        "connections": workflow.get("connections", {}),
        "settings": workflow.get("settings") or {},
    }


def editor_url(workflow_id: str) -> str:
    base = n8n_instance_url().rstrip("/")
    return f"{base}/workflow/{workflow_id}"


def webhook_urls(webhook_path: str) -> tuple[str, str]:
    base = n8n_instance_url().rstrip("/")
    path = normalize_webhook_path(webhook_path)
    test_url = f"{base}/webhook-test/{path}"
    production_url = f"{base}/webhook/{path}"
    return test_url, production_url


def is_webhook_template(template_id: str | None) -> bool:
    return bool(template_id and template_id.startswith(WEBHOOK_TEMPLATE_PREFIX))


def format_success_summary(
    *,
    session_id: str,
    template_id: str,
    n8n_workflow_id: str,
    workflow_name: str,
    active: bool,
    fields: dict[str, str],
) -> str:
    instance = n8n_instance_url()
    lines = [
        "**Workflow published to n8n**",
        "",
        f"- **n8n instance:** {instance}",
        f"- **Workflow ID:** `{n8n_workflow_id}`",
        f"- **Name:** {workflow_name}",
        f"- **Status:** {'Active' if active else 'Inactive'}",
        f"- **Template:** `{template_id}`",
        f"- **Editor URL** (open in n8n when you want to edit): {editor_url(n8n_workflow_id)}",
    ]

    if is_webhook_template(template_id):
        path = fields.get("webhook_path", "")
        if path:
            test_url, production_url = webhook_urls(path)
            lines.extend(
                [
                    "",
                    "**Webhook URLs (for Postman / testing):**",
                    f"- **Test URL** (workflow inactive or “Listen for test event”): `{test_url}`",
                    f"- **Production URL** (after you activate the workflow): `{production_url}`",
                    "",
                    "Use POST with a JSON body when testing the webhook.",
                ]
            )

    if template_id == "manual_http" and fields.get("url"):
        lines.extend(["", f"- **HTTP URL in workflow:** {fields['url']}"])
    elif template_id == "manual_set":
        lines.extend(["", "- **Trigger:** Manual — run from the n8n editor."])

    return "\n".join(lines)


def format_failure_summary(
    *,
    session_id: str,
    template_id: str | None,
    reason: str,
    http_status: int | None = None,
) -> str:
    lines = [
        "**Deploy to n8n failed**",
        "",
        f"- **Reason:** {reason}",
    ]
    if http_status:
        lines.append(f"- **HTTP status:** {http_status}")
    if template_id:
        lines.append(f"- **Template:** `{template_id}`")
    lines.append(f"- **Session:** `{session_id}`")
    lines.append("")
    lines.append(
        "Check that `N8N_BASE_URL` and `N8N_API_KEY` are set on the API server, "
        "then try **Deploy to n8n** again (each deploy creates a new workflow)."
    )
    return "\n".join(lines)


def format_config_error_summary(*, session_id: str, template_id: str | None) -> str:
    return format_failure_summary(
        session_id=session_id,
        template_id=template_id,
        reason="n8n is not configured on the server (missing N8N_BASE_URL or N8N_API_KEY).",
        http_status=None,
    )


def push_workflow_to_n8n(workflow: dict) -> dict:
    payload = prepare_n8n_create_payload(workflow)
    return create_workflow(payload)
