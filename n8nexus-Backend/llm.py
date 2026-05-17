import os
from collections.abc import Iterator

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from entity import Conversation
from logger import setup_logging

log = setup_logging()


def _conversation_to_messages(conversation: Conversation) -> list[BaseMessage]:
    out: list[BaseMessage] = []
    for m in conversation.messages:
        if m.role == "system":
            out.append(SystemMessage(content=m.content))
        elif m.role == "user":
            out.append(HumanMessage(content=m.content))
        else:
            out.append(AIMessage(content=m.content))
    return out


def _response_text(response: BaseMessage) -> str:
    text = response.content
    if isinstance(text, list):
        text = "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in text
        )
    return text if isinstance(text, str) else str(text)


def _chunk_text(chunk: BaseMessage) -> str:
    text = chunk.content
    if not text:
        return ""
    if isinstance(text, list):
        return "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in text
        )
    return text if isinstance(text, str) else str(text)


def _chat_model(model: str | None) -> ChatOpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to your environment or a .env file."
        )
    model_name = model or os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")
    return ChatOpenAI(api_key=api_key, model=model_name)


def invoke_chat_model(messages: list[BaseMessage], model: str | None = None) -> str:
    llm = _chat_model(model)
    model_name = getattr(llm, "model_name", None) or getattr(llm, "model", "unknown")
    log.info(
        "LangChain ChatOpenAI model=%s messages=%d",
        model_name,
        len(messages),
    )
    response = llm.invoke(messages)
    out = _response_text(response)
    log.info("LangChain invoke done response_class=%s", type(response).__name__)
    return out


def stream_chat_model(
    messages: list[BaseMessage], model: str | None = None
) -> Iterator[str]:
    llm = _chat_model(model)
    model_name = getattr(llm, "model_name", None) or getattr(llm, "model", "unknown")
    log.info(
        "LangChain ChatOpenAI stream model=%s messages=%d",
        model_name,
        len(messages),
    )
    for chunk in llm.stream(messages):
        text = _chunk_text(chunk)
        if text:
            yield text


def chat_reply(conversation: Conversation, model: str | None = None) -> str:
    return invoke_chat_model(_conversation_to_messages(conversation), model)
