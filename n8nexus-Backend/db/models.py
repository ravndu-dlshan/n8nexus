import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Automation(Base):
    __tablename__ = "automations"
    __table_args__ = (
        UniqueConstraint("user_id", "session_id", name="automations_user_session_unique"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(String(128), nullable=False)

    template_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    template_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    workflow_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled workflow")
    workflow_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    fields: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="generated")
    n8n_workflow_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    n8n_instance_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    editor_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    webhook_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    webhook_test_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    webhook_production_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    deploy_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deployed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
