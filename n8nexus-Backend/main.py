import json
import os
import sys
import uuid
from collections.abc import Iterator
from contextlib import asynccontextmanager
from typing import Literal

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from chat_history import (
    messages_to_transcript,
    session_add_assistant,
    session_add_user_and_snapshot,
    session_create,
    session_delete,
    session_get,
    session_messages_copy,
    session_undo_last_user,
)
from auth import describe_auth_failure, require_user_id, workflow_persist_user_id
from automation_run_service import run_automation
from automation_service import (
    automation_to_dict,
    get_automation_by_session,
    get_automation_for_user,
    list_automations_for_user,
    save_automation_from_deploy,
    save_automation_from_generate,
)
from db.database import get_db_optional, init_db, is_database_configured
from entity import Conversation
from llm import chat_reply, invoke_chat_model, stream_chat_model
from logger import setup_logging
from n8n_registry import list_templates
from prompt import system_message_content
from workflow_service import (
    deploy_workflow_for_session,
    generate_workflow_for_session,
    resolve_ready_state,
    sync_workflow_from_session,
    workflow_status_payload,
)
from workflow_state import workflow_state_get

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if is_database_configured():
        try:
            init_db()
            log.info("Database tables initialized")
        except Exception:
            log.exception("Database init failed")
    else:
        log.warning("DATABASE_URL not set — automations will not be persisted")
    yield

_DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "https://chat-buddy-pal-36.vercel.app",
    "https://n8nexus-frontend.vercel.app",
]

# Vercel production + preview deployments (e.g. *-git-*-*.vercel.app)
_VERCEL_ORIGIN_REGEX = r"https://[\w.-]+\.vercel\.app"


def _cors_origins() -> list[str]:
    extra = os.getenv("CORS_ORIGINS", "")
    if not extra.strip():
        return _DEFAULT_CORS_ORIGINS
    merged = list(_DEFAULT_CORS_ORIGINS)
    for origin in extra.split(","):
        o = origin.strip()
        if o and o not in merged:
            merged.append(o)
    return merged


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=_VERCEL_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
log = setup_logging()
chat_router = APIRouter(tags=["chat"])
workflow_router = APIRouter(tags=["workflows"])
automation_router = APIRouter(tags=["automations"])

RoleIn = Literal["system", "user", "assistant"]


class ChatMessageIn(BaseModel):
    role: RoleIn
    content: str


class ChatRequest(BaseModel):
    """OpenAI-style turns. If the first message is not ``system``, the default system prompt is prepended."""

    messages: list[ChatMessageIn] = Field(..., min_length=1)
    model: str | None = None


class ChatResponse(BaseModel):
    reply: str


class SessionChatRequest(BaseModel):
    """Send one user turn; omit ``session_id`` to start a new conversation."""

    session_id: str | None = None
    message: str = Field(..., min_length=1)
    model: str | None = None


class WorkflowSyncRequest(BaseModel):
    model: str | None = None


class WorkflowStatusOut(BaseModel):
    template_id: str | None = None
    template_title: str | None = None
    fields: dict[str, str] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    field_labels: dict[str, str] = Field(default_factory=dict)
    ready: bool = False
    templates_available: list[str] = Field(default_factory=list)


class SessionChatResponse(BaseModel):
    session_id: str
    reply: str
    workflow: WorkflowStatusOut | None = None


class NewSessionResponse(BaseModel):
    session_id: str


class SessionHistoryResponse(BaseModel):
    session_id: str
    messages: list[dict[str, str]]
    workflow: WorkflowStatusOut | None = None


class TemplateSummaryOut(BaseModel):
    id: str
    title: str
    description: str
    demo_use_case: str
    required_fields: list[str]


class WorkflowGenerateResponse(BaseModel):
    session_id: str
    template_id: str
    workflow: dict
    automation_id: str | None = None


class WorkflowDeployResponse(BaseModel):
    success: bool
    session_id: str
    template_id: str | None = None
    n8n_workflow_id: str | None = None
    workflow_name: str | None = None
    active: bool | None = None
    n8n_instance_url: str | None = None
    editor_url: str | None = None
    webhook_test_url: str | None = None
    webhook_production_url: str | None = None
    chat_summary: str
    http_status: int | None = None
    automation_id: str | None = None


class AutomationOut(BaseModel):
    id: str
    user_id: str
    session_id: str
    template_id: str | None = None
    template_title: str | None = None
    workflow_name: str
    workflow_json: dict
    fields: dict[str, str] = Field(default_factory=dict)
    status: str
    n8n_workflow_id: str | None = None
    n8n_instance_url: str | None = None
    editor_url: str | None = None
    webhook_path: str | None = None
    webhook_test_url: str | None = None
    webhook_production_url: str | None = None
    active: bool | None = None
    deploy_error: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    deployed_at: str | None = None


class AutomationRunResponse(BaseModel):
    success: bool
    message: str
    trigger: str | None = None
    execution_id: str | None = None
    finished: bool | None = None
    summary: str | None = None
    response_preview: dict | list | str | int | float | bool | None = None
    http_status: int | None = None


def _persist_generate(
    db: Session | None,
    user_id: uuid.UUID | None,
    session_id: str,
    template_id: str,
    workflow: dict,
    state,
) -> str | None:
    if db is None:
        log.warning("Automation not saved (generate): DATABASE_URL not configured")
        return None
    if user_id is None:
        log.warning(
            "Automation not saved (generate): %s",
            describe_auth_failure(None),
        )
        return None
    try:
        payload = workflow_status_payload(state)
        row = save_automation_from_generate(
            db,
            user_id=user_id,
            session_id=session_id,
            template_id=template_id,
            template_title=payload.get("template_title"),
            workflow=workflow,
            state=state,
        )
        return str(row.id)
    except Exception:
        log.exception("Failed to persist automation after generate for session %s", session_id)
        return None


def _persist_deploy(
    db: Session | None,
    user_id: uuid.UUID | None,
    session_id: str,
    deploy_result: dict,
    state,
) -> str | None:
    if db is None:
        log.warning("Automation not saved (deploy): DATABASE_URL not configured")
        return None
    if user_id is None:
        log.warning(
            "Automation not saved (deploy): %s",
            describe_auth_failure(None),
        )
        return None
    try:
        row = save_automation_from_deploy(
            db,
            user_id=user_id,
            session_id=session_id,
            deploy_result=deploy_result,
            state=state,
        )
        return str(row.id) if row else None
    except Exception:
        log.exception("Failed to persist automation after deploy for session %s", session_id)
        return None


@app.get("/")
def read_root():
    return {
        "Hello": "World",
        "chat_stateless": "POST /chat or POST /api/chat",
        "chat_with_history": "POST /chat/session or POST /api/chat/session",
        "chat_stream": "POST /chat/session/stream or POST /api/chat/session/stream",
        "workflow_sync": "POST /workflows/sessions/{session_id}/sync",
        "new_session": "POST /chat/sessions or POST /api/chat/sessions",
        "get_history": "GET /chat/sessions/{session_id} or GET /api/chat/sessions/{session_id}",
        "workflow_templates": "GET /workflows/templates or GET /api/workflows/templates",
        "workflow_status": "GET /workflows/sessions/{session_id}/status",
        "workflow_generate": "POST /workflows/sessions/{session_id}/generate",
        "workflow_deploy": "POST /workflows/sessions/{session_id}/deploy",
        "automations_list": "GET /automations (Authorization: Bearer <supabase_jwt>)",
        "automation_detail": "GET /automations/{automation_id}",
        "automation_run": "POST /automations/{automation_id}/run",
        "docs": "/docs",
    }


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}


@chat_router.post("/chat", response_model=ChatResponse)
def chat_endpoint(body: ChatRequest) -> ChatResponse:
    conv = Conversation()
    if not body.messages or body.messages[0].role != "system":
        conv.append("system", system_message_content())
    for m in body.messages:
        conv.append(m.role, m.content)
    try:
        reply = chat_reply(conv, model=body.model)
    except Exception as e:
        log.exception("Chat API failed")
        raise HTTPException(status_code=502, detail=str(e)) from e
    return ChatResponse(reply=reply)


@chat_router.post("/chat/sessions", response_model=NewSessionResponse)
def create_chat_session() -> NewSessionResponse:
    return NewSessionResponse(session_id=session_create())


def _resolve_session_id(session_id: str | None) -> str:
    if session_id is None:
        return session_create()
    if session_get(session_id) is None:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    return session_id


def _ndjson_line(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


def _session_chat_stream(body: SessionChatRequest) -> Iterator[str]:
    sid = _resolve_session_id(body.session_id)
    try:
        msgs = session_add_user_and_snapshot(sid, body.message)
    except KeyError:
        yield _ndjson_line({"event": "error", "detail": "Unknown session_id"})
        return

    yield _ndjson_line({"event": "session", "session_id": sid})

    parts: list[str] = []
    try:
        for token in stream_chat_model(msgs, model=body.model):
            parts.append(token)
            yield _ndjson_line({"event": "token", "content": token})
        reply = "".join(parts)
        session_add_assistant(sid, reply)
        yield _ndjson_line({"event": "done", "session_id": sid, "reply": reply})
    except KeyError:
        session_undo_last_user(sid)
        yield _ndjson_line({"event": "error", "detail": "Unknown session_id"})
    except Exception as e:
        session_undo_last_user(sid)
        log.exception("Session chat stream failed")
        yield _ndjson_line({"event": "error", "detail": str(e)})


@chat_router.post("/chat/session", response_model=SessionChatResponse)
def chat_with_session_history(body: SessionChatRequest) -> SessionChatResponse:
    sid = _resolve_session_id(body.session_id)
    try:
        msgs = session_add_user_and_snapshot(sid, body.message)
        reply = invoke_chat_model(msgs, model=body.model)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown session_id") from None
    except Exception as e:
        session_undo_last_user(sid)
        log.exception("Session chat failed")
        raise HTTPException(status_code=502, detail=str(e)) from e
    try:
        session_add_assistant(sid, reply)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown session_id") from None

    return SessionChatResponse(session_id=sid, reply=reply, workflow=None)


@chat_router.post("/chat/session/stream")
def chat_with_session_stream(body: SessionChatRequest) -> StreamingResponse:
    return StreamingResponse(
        _session_chat_stream(body),
        media_type="application/x-ndjson",
    )


@chat_router.get("/chat/sessions/{session_id}", response_model=SessionHistoryResponse)
def get_session_history(session_id: str) -> SessionHistoryResponse:
    msgs = session_messages_copy(session_id)
    if msgs is None:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    workflow_out: WorkflowStatusOut | None = None
    state = workflow_state_get(session_id)
    if state.template_id or state.fields:
        workflow_out = WorkflowStatusOut(**workflow_status_payload(state))

    return SessionHistoryResponse(
        session_id=session_id,
        messages=messages_to_transcript(msgs),
        workflow=workflow_out,
    )


@chat_router.delete("/chat/sessions/{session_id}")
def delete_session(session_id: str) -> dict[str, bool]:
    if not session_delete(session_id):
        raise HTTPException(status_code=404, detail="Unknown session_id")
    return {"ok": True}


@workflow_router.get("/workflows/templates", response_model=list[TemplateSummaryOut])
def list_workflow_templates() -> list[TemplateSummaryOut]:
    return [
        TemplateSummaryOut(
            id=t.id,
            title=t.title,
            description=t.description,
            demo_use_case=t.demo_use_case,
            required_fields=t.required_field_names(),
        )
        for t in list_templates()
    ]


@workflow_router.get(
    "/workflows/sessions/{session_id}/status",
    response_model=WorkflowStatusOut,
)
def get_workflow_status(session_id: str) -> WorkflowStatusOut:
    if session_get(session_id) is None:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    state = workflow_state_get(session_id)
    return WorkflowStatusOut(**workflow_status_payload(state))


@workflow_router.post(
    "/workflows/sessions/{session_id}/sync",
    response_model=WorkflowStatusOut,
)
def sync_session_workflow(
    session_id: str,
    body: WorkflowSyncRequest | None = None,
) -> WorkflowStatusOut:
    if session_get(session_id) is None:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    model = body.model if body else None
    try:
        state = sync_workflow_from_session(session_id, model=model)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown session_id") from None
    except Exception as e:
        log.exception("Workflow state sync failed for session %s", session_id)
        raise HTTPException(status_code=502, detail=str(e)) from e
    return WorkflowStatusOut(**workflow_status_payload(state))


@workflow_router.post(
    "/workflows/sessions/{session_id}/generate",
    response_model=WorkflowGenerateResponse,
)
def generate_workflow(
    session_id: str,
    db: Session | None = Depends(get_db_optional),
    user_id: uuid.UUID | None = Depends(workflow_persist_user_id),
) -> WorkflowGenerateResponse:
    if session_get(session_id) is None:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    state = workflow_state_get(session_id)
    if not state.template_id:
        try:
            state = sync_workflow_from_session(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="Unknown session_id") from None
        except Exception:
            log.exception("Workflow sync before generate failed")
    if not state.ready:
        missing = ", ".join(state.missing_fields) or "required details"
        raise HTTPException(
            status_code=400,
            detail=f"Workflow not ready. Missing or invalid: {missing}",
        )
    try:
        workflow = generate_workflow_for_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        log.exception("Workflow generation failed")
        raise HTTPException(status_code=500, detail=str(e)) from e

    automation_id = _persist_generate(
        db, user_id, session_id, state.template_id, workflow, state
    )

    return WorkflowGenerateResponse(
        session_id=session_id,
        template_id=state.template_id,
        workflow=workflow,
        automation_id=automation_id,
    )


@workflow_router.post(
    "/workflows/sessions/{session_id}/deploy",
    response_model=WorkflowDeployResponse,
)
def deploy_workflow(
    session_id: str,
    db: Session | None = Depends(get_db_optional),
    user_id: uuid.UUID | None = Depends(workflow_persist_user_id),
) -> WorkflowDeployResponse:
    if session_get(session_id) is None:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    try:
        resolve_ready_state(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown session_id") from None
    except Exception:
        log.exception("Workflow sync before deploy failed")

    state = workflow_state_get(session_id)
    if not state.ready:
        missing = ", ".join(state.missing_fields) or "required details"
        raise HTTPException(
            status_code=400,
            detail=f"Workflow not ready. Missing or invalid: {missing}",
        )

    try:
        result = deploy_workflow_for_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        log.exception("Workflow deploy failed")
        raise HTTPException(status_code=500, detail=str(e)) from e

    automation_id = _persist_deploy(db, user_id, session_id, result, state)

    return WorkflowDeployResponse(**result, automation_id=automation_id)


def _db_session() -> Session:
    if not is_database_configured():
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured.")
    from db.database import get_session_factory

    return get_session_factory()()


@automation_router.get("/automations", response_model=list[AutomationOut])
def list_automations(
    user_id: uuid.UUID = Depends(require_user_id),
) -> list[AutomationOut]:
    db = _db_session()
    try:
        rows = list_automations_for_user(db, user_id)
    finally:
        db.close()
    return [AutomationOut(**automation_to_dict(row)) for row in rows]


@automation_router.get(
    "/automations/by-session/{session_id}",
    response_model=AutomationOut,
)
def get_automation_for_session_route(
    session_id: str,
    user_id: uuid.UUID = Depends(require_user_id),
) -> AutomationOut:
    db = _db_session()
    try:
        row = get_automation_by_session(db, user_id, session_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Automation not found for this session")
        return AutomationOut(**automation_to_dict(row))
    finally:
        db.close()


@automation_router.get("/automations/{automation_id}", response_model=AutomationOut)
def get_automation(
    automation_id: str,
    user_id: uuid.UUID = Depends(require_user_id),
) -> AutomationOut:
    db = _db_session()
    try:
        try:
            aid = uuid.UUID(automation_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid automation_id") from exc
        row = get_automation_for_user(db, user_id, aid)
        if row is None:
            raise HTTPException(status_code=404, detail="Automation not found")
        return AutomationOut(**automation_to_dict(row))
    finally:
        db.close()


@automation_router.post(
    "/automations/{automation_id}/run",
    response_model=AutomationRunResponse,
)
def run_automation_route(
    automation_id: str,
    user_id: uuid.UUID = Depends(require_user_id),
) -> AutomationRunResponse:
    db = _db_session()
    try:
        try:
            aid = uuid.UUID(automation_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid automation_id") from exc
        row = get_automation_for_user(db, user_id, aid)
        if row is None:
            raise HTTPException(status_code=404, detail="Automation not found")
        result = run_automation(row)
        if not result.get("success"):
            status = int(result.get("http_status") or 400)
            if status < 400:
                status = 400
            raise HTTPException(status_code=status, detail=result.get("message", "Run failed"))
        return AutomationRunResponse(**result)
    finally:
        db.close()


app.include_router(chat_router)
app.include_router(chat_router, prefix="/api")
app.include_router(workflow_router)
app.include_router(workflow_router, prefix="/api")
app.include_router(automation_router)
app.include_router(automation_router, prefix="/api")


def run_chat_cli() -> None:
    load_dotenv()
    history = InMemoryChatMessageHistory()
    history.add_message(SystemMessage(content=system_message_content()))

    print("Simple OpenAI chat — type 'quit' or 'exit' to stop.\n")
    while True:
        try:
            user_text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not user_text:
            continue
        if user_text.lower() in ("quit", "exit"):
            break
        history.add_user_message(user_text)
        try:
            reply = invoke_chat_model(list(history.messages))
        except Exception as e:
            log.exception("Chat request failed")
            print(f"Error: {e}", file=sys.stderr)
            if history.messages and isinstance(history.messages[-1], HumanMessage):
                history.messages.pop()
            continue
        history.add_ai_message(reply)
        print(f"Assistant: {reply}\n")


if __name__ == "__main__":
    run_chat_cli()
