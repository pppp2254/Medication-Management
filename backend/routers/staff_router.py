from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.staff_sql_db import StaffInfo
from models.staff_mongo_db import StaffAuth
from pydantic import BaseModel

router = APIRouter()

class StaffPublic(BaseModel):
    staff_id: int
    username: str
    name: str
    role: str

    class Config:
        from_attributes = True

@router.get("/")
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