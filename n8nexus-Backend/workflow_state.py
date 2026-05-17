import threading
from dataclasses import dataclass, field

from n8n_registry import compute_missing_fields, is_ready

_lock = threading.Lock()
_states: dict[str, "WorkflowBuildState"] = {}


@dataclass
class WorkflowBuildState:
    template_id: str | None = None
    fields: dict[str, str] = field(default_factory=dict)
    missing_fields: list[str] = field(default_factory=list)
    ready: bool = False

    def to_dict(self) -> dict:
        return {
            "template_id": self.template_id,
            "fields": dict(self.fields),
            "missing_fields": list(self.missing_fields),
            "ready": self.ready,
        }


def workflow_state_get(session_id: str) -> WorkflowBuildState:
    with _lock:
        return _states.setdefault(session_id, WorkflowBuildState())


def workflow_state_update(
    session_id: str,
    *,
    template_id: str | None = None,
    fields: dict[str, str] | None = None,
) -> WorkflowBuildState:
    with _lock:
        state = _states.setdefault(session_id, WorkflowBuildState())
        if template_id is not None:
            state.template_id = template_id
        if fields:
            for key, value in fields.items():
                if value is not None and str(value).strip():
                    state.fields[key] = str(value).strip()
        if state.template_id:
            state.missing_fields = compute_missing_fields(state.template_id, state.fields)
            state.ready = is_ready(state.template_id, state.fields)
        else:
            state.missing_fields = []
            state.ready = False
        return WorkflowBuildState(
            template_id=state.template_id,
            fields=dict(state.fields),
            missing_fields=list(state.missing_fields),
            ready=state.ready,
        )


def workflow_state_clear(session_id: str) -> None:
    with _lock:
        _states.pop(session_id, None)
