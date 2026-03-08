from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.staff_sql_db import StaffInfo
from models.staff_mongo_db import StaffAuth, EventLog, Role
from pydantic import BaseModel
from routers.auth_router import get_current_user

router = APIRouter()

class StaffPublic(BaseModel):
    staff_id: int
    username: str
    name: str
    role: str

    class Config:
        from_attributes = True

@router.get("/staffs")
async def get_all_staff(db: AsyncSession = Depends(get_db)):
    # 1️⃣ Get Postgres staff
    result = await db.execute(select(StaffInfo))
    staff_list = result.scalars().all()

    # 2️⃣ Get Mongo staff auth
    auth_list = await StaffAuth.find_all().to_list()

    # Convert Mongo docs → dict
    auth_dict = {
        auth.staff_id: auth.permission
        for auth in auth_list
    }

    # 3️⃣ Merge
    combined = []

    for staff in staff_list:
        combined.append({
            "staff_id": staff.staff_id,
            "username": staff.username,
            "name": staff.name,
            "role": staff.role,
            "permission": auth_dict.get(staff.staff_id, [])
        })

    return combined

@router.get("/logs")
async def get_logs(current_user: StaffAuth = Depends(get_current_user)):

    user_id = current_user.staff_id

    user = await StaffAuth.find_one(StaffAuth.staff_id == user_id)

    user_perm = user.permission

    if Role.ADMIN in user_perm:
        logs = await EventLog.find_all().to_list()
        return logs

    logs = await EventLog.find({
        "$or": [
            {"visibility": None},
            {"visibility": {"$in": user_perm}}
        ]
    }).sort("-date").to_list()

    return logs