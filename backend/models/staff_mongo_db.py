from beanie import Document
from mongoengine import DateTimeField
from typing import Optional
from datetime import datetime, UTC
from pydantic import Field
from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"

class StaffAuth(Document):
    staff_id: int
    permission: list[Role] = Field(default_factory=list)

    class Settings:
        name = "staff_auth"

class EventLog(Document):
    event_id: int
    staff_id: int
    date: datetime = DateTimeField(default = lambda: datetime.now(UTC))
    action: Optional[str] = None
    description: Optional[str] = None

    class Settings:
        name = "event_log"