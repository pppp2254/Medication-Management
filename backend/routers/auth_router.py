from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.staff_sql_db import StaffInfo
from models.staff_mongo_db import StaffAuth
from passlib.context import CryptContext
from pydantic import BaseModel, constr
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "your-very-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


class RegisterSchema(BaseModel):
    username: str
    password: constr(min_length=1, max_length=72)
    name: str
    role: str

class LoginSchema(BaseModel):
    username: str
    password: str

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
async def register(payload: RegisterSchema, db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(StaffInfo).where(StaffInfo.username == payload.username))
    exists = result.scalar_one_or_none()

    if exists:
        raise HTTPException(status_code=400, detail="USERNAME_TAKEN")
    
    hashed_pw = pwd_context.hash(payload.password)

    user = StaffInfo(username=payload.username, password=hashed_pw, name=payload.name, role=payload.role)
    try:
        db.add(user)
        await db.flush()
        await StaffAuth(
            staff_id=user.staff_id,
            permission=[]
        ).insert()

        await db.commit()

    except:
        await db.rollback()
        raise HTTPException(status_code=500, detail="DB_ERROR")

    return {"message": "User Created successfully."}

@router.post("/login")
async def login(payload: LoginSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StaffInfo).where(StaffInfo.username == payload.username))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(payload.password, user.password):
        raise HTTPException(status_code=400, detail="Username doesn't exists or wrong password.")
    
    token = create_access_token(data={"id": user.staff_id, "role": user.role, "name": user.name})
    
    return {
        "status": "success",
        "access_token": token, 
        "token_type": "bearer",
        "role": user.role
    }

# ------------------------------------------
# Patient Login (PostgreSQL)
# ------------------------------------------
from models.patient_sql_db import Patient

class PatientLoginSchema(BaseModel):
    name: str
    password: str

@router.post("/patient/login")
async def patient_login(payload: PatientLoginSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.name == payload.name))
    patient = result.scalar_one_or_none()

    if not patient or not pwd_context.verify(payload.password, patient.password):
        raise HTTPException(status_code=400, detail="Patient password is incorrect")
    
    # ---- แก้ไขตรงนี้: สร้างและส่ง JWT Token ของคนไข้ ----
    token = create_access_token(data={"id": patient.p_id, "role": "patient", "name": patient.name})
    
    return {
        "status": "success", 
        "message": "Patient logged in successfully",
        "access_token": token,
        "role": "patient",
        "p_id": patient.p_id
    }