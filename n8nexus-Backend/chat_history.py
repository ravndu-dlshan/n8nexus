import os
import threading
import uuid

from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from prompt import system_message_content

_lock = threading.Lock()
_sessions: dict[str, InMemoryChatMessageHistory] = {}

_DEFAULT_MAX_MESSAGES = 40


def _max_messages() -> int:
    raw = os.environ.get("CHAT_HISTORY_MAX_MESSAGES", str(_DEFAULT_MAX_MESSAGES))
    try:
        return max(8, int(raw))
    except ValueError:
        return _DEFAULT_MAX_MESSAGES


def trim_messages_for_model(messages: list[BaseMessage]) -> list[BaseMessage]:
    """Keep system prompt(s) and the most recent turns to reduce latency."""
    cap = _max_messages()
    if len(messages) <= cap:
        return messages
    system_msgs = [m for m in messages if isinstance(m, SystemMessage)]
    rest = [m for m in messages if not isinstance(m, SystemMessage)]
    keep = max(1, cap - len(system_msgs))
    return system_msgs + rest[-keep:]


def session_create() -> str:
    with _lock:
        sid = str(uuid.uuid4())
        h = InMemoryChatMessageHistory()
        h.add_message(SystemMessage(content=system_message_content()))
        _sessions[sid] = h
        return sid


def session_get(session_id: str) -> InMemoryChatMessageHistory | None:
    with _lock:
        return _sessions.get(session_id)


def session_add_user_and_snapshot(session_id: str, user_text: str) -> list[BaseMessage]:
    with _lock:
        h = _sessions.get(session_id)
        if h is None:
            raise KeyError(session_id)
        h.add_user_message(user_text)
        return trim_messages_for_model(list(h.messages))


def session_undo_last_user(session_id: str) -> None:
    with _lock:
        h = _sessions.get(session_id)
        if h and h.messages and isinstance(h.messages[-1], HumanMessage):
            h.messages.pop()


def session_add_assistant(session_id: str, text: str) -> None:
    with _lock:
        h = _sessions.get(session_id)
        if h is None:
            raise KeyError(session_id)
        h.add_ai_message(text)


def session_messages_copy(session_id: str) -> list[BaseMessage] | None:
    with _lock:
        h = _sessions.get(session_id)
        return list(h.messages) if h else None


def session_delete(session_id: str) -> bool:
    with _lock:
        return _sessions.pop(session_id, None) is not None

def _content_str(content: str | list) -> str:
    if isinstance(content, str):
        return content
    parts: list[str] = []
    for block in content:
        if isinstance(block, dict) and "text" in block:
            parts.append(str(block["text"]))
        else:
            parts.append(str(block))
    return "".join(parts)


def messages_to_transcript(messages: list[BaseMessage]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for m in messages:
        if isinstance(m, SystemMessage):
            role = "system"
        elif isinstance(m, HumanMessage):
            role = "user"
        elif isinstance(m, AIMessage):
            role = "assistant"
        else:
            role = m.type
        out.append({"role": role, "content": _content_str(m.content)})
    return out

