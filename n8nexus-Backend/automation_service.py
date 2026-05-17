from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from db.models import Automation
from logger import setup_logging
from n8n_deploy import is_webhook_template, webhook_urls
from n8n_registry import get_template
from workflow_state import WorkflowBuildState

log = setup_logging()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _extract_webhook_path_from_url(url: str | None) -> str | None:
    if not url:
        return None
    try:
        from urllib.parse import urlparse

        parts = [p for p in urlparse(url).path.split("/") if p]
        return parts[-1] if parts else None
    except Exception:
        return None


def _resolve_deploy_webhooks(
    template_id: str | None,
    fields: dict[str, str],
    deploy_result: dict,
) -> tuple[str | None, str | None, str | None]:
    path = deploy_result.get("webhook_path") or fields.get("webhook_path")
    test_url = deploy_result.get("webhook_test_url")
    production_url = deploy_result.get("webhook_production_url")

    if template_id and is_webhook_template(template_id) and path:
        if not test_url or not production_url:
            test_url, production_url = webhook_urls(path)
    elif test_url and not path:
        path = _extract_webhook_path_from_url(test_url)

    return path, test_url, production_url


def _workflow_name(workflow: dict) -> str:
    name = workflow.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    return "Untitled workflow"


def automation_to_dict(row: Automation) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "user_id": str(row.user_id),
        "session_id": row.session_id,
        "template_id": row.template_id,
        "template_title": row.template_title,
        "workflow_name": row.workflow_name,
        "workflow_json": row.workflow_json,
        "fields": row.fields,
        "status": row.status,
        "n8n_workflow_id": row.n8n_workflow_id,
        "n8n_instance_url": row.n8n_instance_url,
        "editor_url": row.editor_url,
        "webhook_path": row.webhook_path,
        "webhook_test_url": row.webhook_test_url,
        "webhook_production_url": row.webhook_production_url,
        "active": row.active,
        "deploy_error": row.deploy_error,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "deployed_at": row.deployed_at.isoformat() if row.deployed_at else None,
    }


def get_automation_by_session(
    db: Session,
    user_id: uuid.UUID,
    session_id: str,
) -> Automation | None:
    return _get_by_session(db, user_id, session_id)


def _get_by_session(db: Session, user_id: uuid.UUID, session_id: str) -> Automation | None:
    return (
        db.query(Automation)
        .filter(Automation.user_id == user_id, Automation.session_id == session_id)
        .one_or_none()
    )


def save_automation_from_generate(
    db: Session,
    *,
    user_id: uuid.UUID,
    session_id: str,
    template_id: str,
    template_title: str | None,
    workflow: dict,
    state: WorkflowBuildState,
) -> Automation:
    now = _utcnow()
    row = _get_by_session(db, user_id, session_id)

    if row is None:
        row = Automation(
            user_id=user_id,
            session_id=session_id,
            created_at=now,
        )
        db.add(row)

    row.template_id = template_id
    row.template_title = template_title
    row.workflow_name = _workflow_name(workflow)
    row.workflow_json = workflow
    row.fields = dict(state.fields)
    row.status = "generated"
    row.n8n_workflow_id = None
    row.n8n_instance_url = None
    row.editor_url = None
    row.webhook_path = state.fields.get("webhook_path")
    row.webhook_test_url = None
    row.webhook_production_url = None
    row.active = None
    row.deploy_error = None
    row.deployed_at = None
    row.updated_at = now

    db.commit()
    db.refresh(row)
    return row


def save_automation_from_deploy(
    db: Session,
    *,
    user_id: uuid.UUID,
    session_id: str,
    deploy_result: dict,
    state: WorkflowBuildState,
) -> Automation | None:
    now = _utcnow()
    row = _get_by_session(db, user_id, session_id)

    if row is None:
        try:
            workflow = deploy_result.get("workflow_json")
            if not workflow and state.template_id:
                from workflow_builder import build_workflow

                workflow = build_workflow(state.template_id, state.fields)
        except Exception:
            workflow = {}
        row = Automation(
            user_id=user_id,
            session_id=session_id,
            template_id=deploy_result.get("template_id") or state.template_id,
            template_title=None,
            workflow_name=deploy_result.get("workflow_name") or _workflow_name(workflow or {}),
            workflow_json=workflow or {},
            fields=dict(state.fields),
            status="generated",
            created_at=now,
        )
        db.add(row)

    template_id = deploy_result.get("template_id") or row.template_id or state.template_id
    spec = get_template(template_id) if template_id else None
    if spec:
        row.template_title = spec.title

    workflow_json = deploy_result.get("workflow_json")
    if isinstance(workflow_json, dict) and workflow_json:
        row.workflow_json = workflow_json
        if deploy_result.get("workflow_name"):
            row.workflow_name = str(deploy_result["workflow_name"])
        else:
            row.workflow_name = _workflow_name(workflow_json)

    success = bool(deploy_result.get("success"))
    row.status = "deployed" if success else "deploy_failed"
    row.template_id = template_id
    if deploy_result.get("workflow_name"):
        row.workflow_name = str(deploy_result["workflow_name"])

    row.n8n_workflow_id = deploy_result.get("n8n_workflow_id")
    row.n8n_instance_url = deploy_result.get("n8n_instance_url")
    row.editor_url = deploy_result.get("editor_url")
    row.active = deploy_result.get("active")

    webhook_path, webhook_test_url, webhook_production_url = _resolve_deploy_webhooks(
        template_id,
        dict(state.fields),
        deploy_result,
    )
    row.webhook_path = webhook_path
    row.webhook_test_url = webhook_test_url
    row.webhook_production_url = webhook_production_url

    if success:
        row.deploy_error = None
        row.deployed_at = now
    else:
        summary = deploy_result.get("chat_summary") or "Deploy failed"
        http_status = deploy_result.get("http_status")
        row.deploy_error = (
            f"{summary} (HTTP {http_status})" if http_status else str(summary)
        )
    row.fields = dict(state.fields)
    row.updated_at = now

    log.info(
        "Automation deploy saved session=%s status=%s n8n_id=%s webhooks=%s",
        session_id,
        row.status,
        row.n8n_workflow_id,
        bool(row.webhook_test_url),
    )

    db.commit()
    db.refresh(row)
    return row


def list_automations_for_user(db: Session, user_id: uuid.UUID) -> list[Automation]:
    return (
        db.query(Automation)
        .filter(Automation.user_id == user_id)
        .order_by(Automation.updated_at.desc())
        .all()
    )


def get_automation_for_user(
    db: Session,
    user_id: uuid.UUID,
    automation_id: uuid.UUID,
) -> Automation | None:
    return (
        db.query(Automation)
        .filter(Automation.user_id == user_id, Automation.id == automation_id)
        .one_or_none()
    )
