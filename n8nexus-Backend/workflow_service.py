from chat_history import messages_to_transcript, session_add_assistant, session_messages_copy
from n8n_client import N8nApiError, N8nConfigError, is_n8n_configured, n8n_instance_url
from n8n_deploy import (
    editor_url,
    format_config_error_summary,
    format_failure_summary,
    format_success_summary,
    is_webhook_template,
    push_workflow_to_n8n,
    webhook_urls,
)
from n8n_registry import TEMPLATES, get_template
from workflow_builder import build_workflow
from workflow_llm import extract_workflow_state
from workflow_state import WorkflowBuildState, workflow_state_get, workflow_state_update


def sync_workflow_from_session(session_id: str, model: str | None = None) -> WorkflowBuildState:
    msgs = session_messages_copy(session_id)
    if msgs is None:
        raise KeyError(session_id)
    transcript = messages_to_transcript(msgs)
    extracted = extract_workflow_state(transcript, model=model)
    template_id = extracted.get("template_id")
    fields = extracted.get("fields") or {}
    return workflow_state_update(
        session_id,
        template_id=template_id,
        fields=fields,
    )


def generate_workflow_for_session(session_id: str) -> dict:
    state = workflow_state_get(session_id)
    if not state.template_id:
        raise ValueError("No workflow template selected yet. Keep chatting to describe your automation.")
    if not state.ready:
        missing = ", ".join(state.missing_fields) or "unknown fields"
        raise ValueError(f"Workflow is not ready. Still missing: {missing}")
    return build_workflow(state.template_id, state.fields)


def resolve_ready_state(session_id: str, *, sync_if_needed: bool = True) -> WorkflowBuildState:
    state = workflow_state_get(session_id)
    if not state.template_id and sync_if_needed:
        state = sync_workflow_from_session(session_id)
    return state


def _deploy_webhook_fields(template_id: str | None, fields: dict[str, str]) -> dict[str, str]:
    """Webhook path + test/production URLs for persistence (even when deploy fails)."""
    if not template_id or not is_webhook_template(template_id):
        return {}
    path = fields.get("webhook_path")
    if not path:
        return {}
    test_url, production_url = webhook_urls(path)
    return {
        "webhook_path": path,
        "webhook_test_url": test_url,
        "webhook_production_url": production_url,
    }


def deploy_workflow_for_session(session_id: str) -> dict:
    state = resolve_ready_state(session_id)
    template_id = state.template_id
    if not template_id:
        raise ValueError("No workflow template selected yet. Keep chatting to describe your automation.")
    if not state.ready:
        missing = ", ".join(state.missing_fields) or "unknown fields"
        raise ValueError(f"Workflow is not ready. Still missing: {missing}")

    webhook_fields = _deploy_webhook_fields(template_id, state.fields)
    base_fail = {
        "session_id": session_id,
        "template_id": template_id,
        "n8n_instance_url": n8n_instance_url() or None,
        **webhook_fields,
    }

    if not is_n8n_configured():
        summary = format_config_error_summary(session_id=session_id, template_id=template_id)
        session_add_assistant(session_id, summary)
        return {
            **base_fail,
            "success": False,
            "chat_summary": summary,
        }

    workflow: dict | None = None
    try:
        workflow = build_workflow(template_id, state.fields)
        created = push_workflow_to_n8n(workflow)
    except N8nConfigError as e:
        summary = format_config_error_summary(session_id=session_id, template_id=template_id)
        session_add_assistant(session_id, summary)
        return {
            **base_fail,
            "success": False,
            "chat_summary": summary,
            "workflow_json": workflow,
            "error": str(e),
        }
    except N8nApiError as e:
        summary = format_failure_summary(
            session_id=session_id,
            template_id=template_id,
            reason=e.message,
            http_status=e.status_code or None,
        )
        session_add_assistant(session_id, summary)
        return {
            **base_fail,
            "success": False,
            "chat_summary": summary,
            "workflow_json": workflow,
            "http_status": e.status_code or None,
        }
    except ValueError as e:
        summary = format_failure_summary(
            session_id=session_id,
            template_id=template_id,
            reason=str(e),
        )
        session_add_assistant(session_id, summary)
        return {
            **base_fail,
            "success": False,
            "chat_summary": summary,
            "workflow_json": workflow,
        }
    except Exception as e:
        summary = format_failure_summary(
            session_id=session_id,
            template_id=template_id,
            reason=str(e),
        )
        session_add_assistant(session_id, summary)
        return {
            **base_fail,
            "success": False,
            "chat_summary": summary,
            "workflow_json": workflow,
        }

    workflow_id = str(created.get("id", ""))
    workflow_name = str(created.get("name", workflow.get("name", "Workflow")))
    active = bool(created.get("active", False))

    summary = format_success_summary(
        session_id=session_id,
        template_id=template_id,
        n8n_workflow_id=workflow_id,
        workflow_name=workflow_name,
        active=active,
        fields=state.fields,
    )
    session_add_assistant(session_id, summary)

    return {
        "success": True,
        "session_id": session_id,
        "template_id": template_id,
        "n8n_workflow_id": workflow_id,
        "workflow_name": workflow_name,
        "active": active,
        "n8n_instance_url": n8n_instance_url() or None,
        "editor_url": editor_url(workflow_id) if workflow_id else None,
        "workflow_json": workflow,
        "chat_summary": summary,
        **webhook_fields,
    }


def workflow_status_payload(state: WorkflowBuildState) -> dict:
    spec = get_template(state.template_id) if state.template_id else None
    field_labels = (
        {f.name: f.label for f in spec.fields} if spec else {}
    )
    return {
        **state.to_dict(),
        "template_title": spec.title if spec else None,
        "field_labels": field_labels,
        "templates_available": list(TEMPLATES.keys()),
    }
