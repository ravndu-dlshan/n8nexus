from dataclasses import dataclass, field
from typing import Literal

Role = Literal["system", "user", "assistant"]


@dataclass
class ChatMessage:
    role: Role
    content: str


@dataclass
class Conversation:
    messages: list[ChatMessage] = field(default_factory=list)

    def append(self, role: Role, content: str) -> None:
        self.messages.append(ChatMessage(role=role, content=content))

    def to_api_messages(self) -> list[dict[str, str]]:
        return [{"role": m.role, "content": m.content} for m in self.messages]
