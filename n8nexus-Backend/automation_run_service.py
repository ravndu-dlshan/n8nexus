from __future__ import annotations

from typing import Any

from db.models import Automation
from logger import setup_logging
from n8n_client import N8nApiError, N8nConfigError, is_n8n_configured, trigger_webhook
from n8n_deploy import is_webhook_template, webhook_urls

log = setup_logging()

_MAX_PREVIEW_LEN = 4000


def default_webhook_payload(template_id: str | None) -> dict[str, Any]:
    if template_id == "webhook_lead":
        return {"name": "Test User", "email": "test@example.com", "source": "n8nexus"}
    if template_id == "webhook_ai":
        return {"message": "Hello, I need help with my order", "user_id": "test-user"}
    if template_id == "webhook_supabase":
        return {
            "email": "test@example.com",
            "name": "Test User",
            "plan": "starter",
        }
    return {"test": True, "source": "n8nexus"}


def _trim_preview(value: Any) -> Any:
    if isinstance(value, str) and len(value) > _MAX_PREVIEW_LEN:
        return value[:_MAX_PREVIEW_LEN] + "…"
    if isinstance(value, dict):
        return {k: _trim_preview(v) for k, v in value.items()}
    if isinstance(value, list) and len(value) > 50:
        return [_trim_preview(v) for v in value[:50]] + ["…"]
    return value


def _pick_webhook_url(row: Automation) -> tuple[str | None, str]:
    """Prefer production URL when workflow is active (webhook registered)."""
    if row.active and row.webhook_production_url:
        return row.webhook_production_url, "webhook_production"
    if row.webhook_test_url:
        return row.webhook_test_url, "webhook_test"
    if row.webhook_production_url:
        return row.webhook_production_url, "webhook_production"
    if row.webhook_path and row.n8n_instance_url:
        test_url, production_url = webhook_urls(row.webhook_path)
        if row.active:
            return production_url, "webhook_production"
        return test_url, "webhook_test"
    return None, "webhook_test"


def _run_via_webhook(row: Automation) -> dict[str, Any]:
    url, trigger = _pick_webhook_url(row)
    if not url:
        return {
            "success": False,
            "message": "No webhook URL for this automation. Publish a webhook workflow from Chat first.",
            "http_status": 400,
        }

    payload = default_webhook_payload(row.template_id)
    status_code, body = trigger_webhook(url, payload)

    summary = f"Webhook responded with HTTP {status_code}"
    if trigger == "webhook_production":
        summary += " (production URL)"
    elif not row.active:
        summary += (
            " (test URL — activate the workflow in n8n for production, "
            "or click Execute workflow in n8n once to register the test webhook)"
        )

    return {
        "success": True,
        "message": "Workflow executed successfully.",
        "trigger": trigger,
        "http_status": status_code,
        "summary": summary,
        "response_preview": _trim_preview(body),
        "finished": True,
    }


def run_automation(row: Automation) -> dict[str, Any]:
    if row.status != "deployed":
        return {
            "success": False,
            "message": "Workflow must be published to n8n before running.",
            "http_status": 400,
        }
    if not row.n8n_workflow_id:
        return {
            "success": False,
            "message": "No n8n workflow ID on this automation. Publish from Chat first.",
            "http_status": 400,
        }
    if not is_n8n_configured():
        return {
            "success": False,
            "message": "n8n is not configured on the server (N8N_BASE_URL / N8N_API_KEY).",
            "http_status": 503,
        }

    if not is_webhook_template(row.template_id):
        return {
            "success": False,
            "message": (
                "Run / Test uses the webhook URL and is only available for webhook workflows. "
                "Open manual workflows in the n8n editor to execute them."
            ),
            "http_status": 400,
        }

    try:
        return _run_via_webhook(row)
    except N8nConfigError as e:
        return {"success": False, "message": str(e), "http_status": 503}
    except N8nApiError as e:
        return {
            "success": False,
            "message": e.message,
            "http_status": e.status_code or 502,
        }
    except Exception as e:
        log.exception("Automation run failed id=%s", row.id)
        return {"success": False, "message": str(e), "http_status": 500}
