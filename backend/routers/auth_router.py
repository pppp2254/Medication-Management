from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.staff_sql_db import StaffInfo
from models.staff_mongo_db import StaffAuth, Role
from passlib.context import CryptContext
from pydantic import BaseModel, constr
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

SECRET_KEY = "your-very-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        staff_id: int = payload.get("sub")

        if staff_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(StaffInfo).where(StaffInfo.staff_id == int(staff_id))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user

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

class PermissionUpdate(BaseModel):
    staff_id: int
    permissions: list[Role]

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def require_admin(current_user=Depends(get_current_user)):
    staff_auth = await StaffAuth.find_one(StaffAuth.staff_id == current_user.staff_id)

    if not staff_auth or Role.ADMIN not in staff_auth.permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required"
        )

    return current_user

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
    
    token = create_access_token(
        data={
            "sub": str(user.staff_id),
            "role": user.role,
            "name": user.name
        }
    )
    
    staff_auth = await StaffAuth.find_one(StaffAuth.staff_id == user.staff_id)
    permissions = staff_auth.permission if staff_auth else []

    return {
        "status": "success",
        "access_token": token, 
        "token_type": "bearer",
        "role": user.role,
        "permissions": permissions
    }

@router.put("/permissions", dependencies=[Depends(require_admin)])
async def update_permissions(data: PermissionUpdate):
    staff_auth = await StaffAuth.find_one(
        StaffAuth.staff_id == data.staff_id
    )

    if not staff_auth:
        raise HTTPException(status_code=404, detail="Staff not found")

    # 🔒 Prevent removing ADMIN role
    if Role.ADMIN in staff_auth.permission and Role.ADMIN not in data.permissions:
        raise HTTPException(
            status_code=403,
            detail="Admin role cannot be removed"
        )

    # 🔒 Prevent granting ADMIN role
    if Role.ADMIN in data.permissions and Role.ADMIN not in staff_auth.permission:
        raise HTTPException(
            status_code=403,
            detail="Admin role cannot be granted here"
        )

    staff_auth.permission = data.permissions
    await staff_auth.save()

    return {"message": "Permissions updated successfully"}

@router.get("/all-staff", dependencies=[Depends(require_admin)])
async def get_all_staff(db: AsyncSession = Depends(get_db)):

    # 1️⃣ Get all staff from PostgreSQL
    result = await db.execute(select(StaffInfo))
    sql_staff = result.scalars().all()

    output = []

    for user in sql_staff:
        # 2️⃣ Get permission from Mongo
        staff_auth = await StaffAuth.find_one(
            StaffAuth.staff_id == user.staff_id
        )

        permissions = staff_auth.permission if staff_auth else []

        # 3️⃣ Combine both
        output.append({
            "staff_id": user.staff_id,
            "username": user.username,
            "name": user.name,
            "sql_role": user.role,   # from SQL
            "permissions": permissions
        })

    return output

@router.get("/roles", dependencies=[Depends(require_admin)])
async def get_roles():
    return [role.value for role in Role]
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
    token = create_access_token(
        data={
            "sub": str(patient.p_id),  # use sub!
            "role": "patient",
            "name": str(patient.name)
        }
    )
    
    return {
        "status": "success", 
        "message": "Patient logged in successfully",
        "access_token": token,
        "role": "patient",
        "p_id": patient.p_id
    }