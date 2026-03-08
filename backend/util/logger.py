from models.staff_mongo_db import EventLog, Role
from enum import Enum

class LogAction(str, Enum):
    CREATE_ACCOUNT = "Created New Account"
    ADD_MED = "Added Medication"
    ADD_STOCK = "Added Stock"
    ADD_MED_INFO = "Added Medication Info"
    ADD_PATIENT = "Added New Patient"


async def log_event(staff_id: int, action: LogAction, description: str | None = None, visibility: list[Role] | None = None):
    try:
        log = EventLog(
            staff_id = staff_id,
            action = action,
            description = description,
            visibility = visibility
        )
        await log.insert()
        print("Information successfully logged.")
        return log
    
    except Exception as e:
        print(f"Logging failed: {e}")