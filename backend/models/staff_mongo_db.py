from beanie import Document
from mongoengine import DateTimeField
from typing import Optional
from datetime import datetime, UTC, timezone
from pydantic import Field
from enum import Enum

class Role(str, Enum):
    ADMIN = "Admin"
    DOCTOR = "Doctor"
    PHARMACIST = "Pharmacist"

class StaffAuth(Document):
    staff_id: int
    permission: list[Role] = Field(default_factory=list)

    class Settings:
        name = "staff_auth"

class EventLog(Document):
    staff_id: int
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    action: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[list[Role]] = None

    class Settings:
        name = "event_log"