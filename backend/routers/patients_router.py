from fastapi import APIRouter, Depends, HTTPException, status, Query,UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel,Field
from typing import Optional, List
from datetime import date
from passlib.context import CryptContext
import json
import shutil
import os
import time

from models.staff_mongo_db import StaffAuth, Role
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from database import get_db
from models.patient_sql_db import Patient, Treatment
from models.med_sql_models import Medication, Inventory
from models.patient_mongo_db import Patient_hist

from routers.auth_router import SECRET_KEY, ALGORITHM

from util.logger import log_event, LogAction
from routers.auth_router import get_current_user
from models.staff_mongo_db import Role


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

os.makedirs("uploads/patients", exist_ok=True)
# ==========================================
# Helpers
# ==========================================

def parse_csv(value: Optional[str]) -> Optional[List[str]]:
    if value is None:
        return None
    return [item.strip() for item in value.split(",") if item.strip()]

# ==========================================
# Pydantic Schemas
# ==========================================

class PatientCreate(BaseModel):
    name: str
    citizen_id: str = Field(..., pattern=r"^\d+$", min_length=13, max_length=13, description="wrong citizen ID")
    age: int = Field(..., gt=0, description="require age more than 0")
    gender: str

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, gt=0, description="require age more than 0")
    gender: Optional[str] = None

class PatientResponse(BaseModel):
    p_id: int
    name: str
    age: int
    gender: str

    class Config:
        from_attributes = True

class TreatmentCreate(BaseModel):
    med_id: int
    amount: int = Field(..., gt=0, description="cannot dispense 0 amount")
    date: date

class TreatmentResponse(BaseModel):
    t_id: int
    p_id: int
    med_id: int
    amount: int
    date: date
    exp_date: Optional[date] = None

    class Config:
        from_attributes = True

class PatientHistCreate(BaseModel):
    history: Optional[str] = None
    diagnosis: Optional[str] = None
    medication: Optional[str] = None
    allergies: Optional[str] = None
    image_url: Optional[str] = None

class PatientHistResponse(BaseModel):
    p_id: int
    history: Optional[str] = None
    diagnosis: Optional[List[str]] = None
    medication: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    image_url: Optional[str] = None

# ==========================================
# Router
# ==========================================

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================
# Auth dependencies
# ==========================================

async def get_current_user_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
        return {"id": int(user_id), "role": str(role).lower()}
    except JWTError:
        raise credentials_exception

async def require_doctor(current_user: dict = Depends(get_current_user_token)):
    if current_user["role"] == "patient":
        raise HTTPException(status_code=403, detail="Patients cannot perform this action")

    staff_auth = await StaffAuth.find_one(StaffAuth.staff_id == current_user["id"])
    if not staff_auth or Role.DOCTOR not in staff_auth.permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor permission required"
        )
    return current_user


async def require_pharmacist(current_user: dict = Depends(get_current_user_token)):
    """ Middleware เช็คว่ามีสิทธิ์ PHARMACIST ใน MongoDB หรือไม่ """
    if current_user["role"] == "patient":
        raise HTTPException(status_code=403, detail="Patients cannot perform this action")

    # ไปค้นหาสิทธิ์ของพนักงานคนนี้จาก MongoDB
    staff_auth = await StaffAuth.find_one(StaffAuth.staff_id == current_user["id"])
    
    # ถ้าไม่มีสิทธิ์ PHARMACIST ให้เตะออก
    if not staff_auth or Role.PHARMACIST not in staff_auth.permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pharmacist permission required"
        )
    return current_user


async def require_doctor_or_pharmacist(current_user: dict = Depends(get_current_user_token)):
    """ Middleware เช็คว่ามีสิทธิ์ DOCTOR หรือ PHARMACIST อย่างใดอย่างหนึ่ง """
    if current_user["role"] == "patient":
        raise HTTPException(status_code=403, detail="Patients cannot perform this action")

    # ไปค้นหาสิทธิ์ของพนักงานคนนี้จาก MongoDB
    staff_auth = await StaffAuth.find_one(StaffAuth.staff_id == current_user["id"])
    
    # ถ้าไม่พบข้อมูลสิทธิ์ หรือไม่มีทั้งสิทธิ์หมอและเภสัช ให้เตะออก
    if not staff_auth:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff authorization not found"
        )

    has_doctor_role = Role.DOCTOR in staff_auth.permission
    has_pharmacist_role = Role.PHARMACIST in staff_auth.permission

    if not (has_doctor_role or has_pharmacist_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor or Pharmacist permission required"
        )
        
    return current_user

# ------------------------------------------
# Patient CRUD (PostgreSQL)
# ------------------------------------------

@router.get("/", response_model=list[PatientResponse])
async def get_all_patients(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_token) # ใช้ Token Payload โดยตรง
):
    role = current_user["role"]
    u_id = current_user["id"]

    if role == "patient":
        result = await db.execute(select(Patient).where(Patient.p_id == u_id),Patient.is_deleted == False)
        return result.scalars().all()

    # 2. ถ้าเป็นพนักงาน ให้ไปค้นหาสิทธิ์ (Permissions) จาก MongoDB
    staff_auth = await StaffAuth.find_one(StaffAuth.staff_id == u_id)
    permissions = staff_auth.permission if staff_auth else []

    if Role.PHARMACIST in permissions or Role.ADMIN in permissions:
        # เภสัชกร หรือ แอดมิน สามารถดูข้อมูลคนไข้ได้ทั้งหมด
        result = await db.execute(select(Patient).where(Patient.is_deleted == False))
    elif Role.DOCTOR in permissions:
        # หมอ ดูได้เฉพาะคนไข้ในการดูแลของตัวเอง
        result = await db.execute(select(Patient).where(Patient.doctor_id == u_id,Patient.is_deleted == False))
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return result.scalars().all()

@router.get("/search/advanced", response_model=list[PatientResponse])
async def search_patients(
    diagnosis: Optional[str] = Query(None, description="diagnosis"),
    allergy: Optional[str] = Query(None, description="allergy"),
    med_id: Optional[str] = Query(None, description="Med_id (comma-separated)"),
    match_type: str = Query("and", description="select 'and' or 'or'"), 
    raw_mongo_query: Optional[str] = Query(None, description="Raw JSON Query MongoDB"),
    current_user: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    if not diagnosis and not allergy and not med_id:
        raise HTTPException(status_code=400, detail="please input quey")

    mongo_p_ids = None
    sql_p_ids = None
    valid_p_ids = None

    if raw_mongo_query:
        try:
            query_dict = json.loads(raw_mongo_query)
            hist_results = await Patient_hist.find(query_dict).to_list()
            mongo_p_ids = {hist.p_id for hist in hist_results}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"incorrect JSON Query: {str(e)}")

    # 2️⃣ โหมดค้นหาปกติ - ค้นหาใน MongoDB
    elif diagnosis or allergy:
        conditions = []
        if diagnosis:
            diagnosis_terms = [t.strip() for t in diagnosis.split(",") if t.strip()]
            if len(diagnosis_terms) == 1:
                conditions.append({"diagnosis": {"$regex": f"\\b{diagnosis_terms[0]}\\b", "$options": "i"}})
            else:
                term_conditions = [{"diagnosis": {"$regex": f"\\b{t}\\b", "$options": "i"}} for t in diagnosis_terms]
                if match_type == "or":
                    conditions.append({"$or": term_conditions})
                else:
                    conditions.extend(term_conditions)
        if allergy:
            allergy_terms = [t.strip() for t in allergy.split(",") if t.strip()]
            if len(allergy_terms) == 1:
                conditions.append({"allergies": {"$regex": f"\\b{allergy_terms[0]}\\b", "$options": "i"}})
            else:
                term_conditions = [{"allergies": {"$regex": f"\\b{t}\\b", "$options": "i"}} for t in allergy_terms]
                if match_type == "or":
                    conditions.append({"$or": term_conditions})
                else:
                    conditions.extend(term_conditions)
        
        mongo_query = {}
        if conditions:
            # ใช้ AND หรือ OR ตามที่ User เลือกมา
            if match_type == "or":
                mongo_query = {"$or": conditions}
            else:
                mongo_query = {"$and": conditions}
                
        hist_results = await Patient_hist.find(mongo_query).to_list()
        mongo_p_ids = {hist.p_id for hist in hist_results}

    # 3️⃣ ค้นหาใน PostgreSQL (ประวัติการได้ยา)
    if med_id is not None:
        med_id_list = [int(m.strip()) for m in med_id.split(",") if m.strip().isdigit()]
        if not med_id_list:
            raise HTTPException(status_code=400, detail="med_id must be numeric")

        if match_type == "or" or len(med_id_list) == 1:
            # OR: เจอยาตัวใดตัวหนึ่งก็พอ → union p_id ทั้งหมด
            stmt = select(Treatment.p_id).where(Treatment.med_id.in_(med_id_list))
            result = await db.execute(stmt)
            sql_p_ids = set(result.scalars().all())
        else:
            # AND: ต้องเคยได้รับยาครบทุกตัว → intersection p_id ของแต่ละ med_id
            sets = []
            for mid in med_id_list:
                stmt = select(Treatment.p_id).where(Treatment.med_id == mid)
                result = await db.execute(stmt)
                sets.append(set(result.scalars().all()))
            sql_p_ids = sets[0].intersection(*sets[1:])

    # 4️⃣ รวมผลลัพธ์ (Intersection = AND, Union = OR)
    if mongo_p_ids is not None and sql_p_ids is not None:
        if match_type == "or":
            valid_p_ids = mongo_p_ids.union(sql_p_ids) # รวมกัน (เอาทั้งหมดที่เจอ)
        else:
            valid_p_ids = mongo_p_ids.intersection(sql_p_ids) # หาจุดตัด (ต้องเจอทั้งสองฝั่ง)
    elif mongo_p_ids is not None:
        valid_p_ids = mongo_p_ids
    elif sql_p_ids is not None:
        valid_p_ids = sql_p_ids

    # ถ้าไม่เจอเลย
    if not valid_p_ids:
        return []

    # 5️⃣ ดึงข้อมูลคนไข้ตัวเต็ม
    stmt = select(Patient).where(Patient.p_id.in_(valid_p_ids), Patient.is_deleted == False)
    
    role = current_user["role"]
    u_id = current_user["id"]
    if role == "doctor": 
         stmt = stmt.where(Patient.doctor_id == u_id)
         
    final_patients = await db.execute(stmt)
    return final_patients.scalars().all()

@router.get("/{p_id}", response_model=PatientResponse)
async def get_patient(p_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.p_id == p_id, Patient.is_deleted == False))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


# ใช้ dependencies=[Depends(require_doctor)] เพื่อบล็อกถ้าไม่ใช่หมอ
@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_doctor) 
):
    # เช็คว่าเคยมี Citizen ID นี้ในระบบไหม
    result = await db.execute(select(Patient).where(Patient.citizen_id == body.citizen_id))
    existing_patient = result.scalar_one_or_none()

    if existing_patient:
        if not existing_patient.is_deleted:
            raise HTTPException(status_code=400, detail="Patient with this Citizen ID already exists")
        
        existing_patient.is_deleted = False
        existing_patient.name = body.name
        existing_patient.age = body.age
        existing_patient.gender = body.gender
        existing_patient.doctor_id = current_user["id"]
        existing_patient.password = pwd_context.hash(body.citizen_id)
        
        patient = existing_patient
    else:
        hashed_pw = pwd_context.hash(body.citizen_id)
        doctor_id = current_user["id"]
        patient = Patient(
            name=body.name,
            citizen_id=body.citizen_id,
            password=hashed_pw,
            age=body.age,
            gender=body.gender,
            doctor_id=doctor_id,
            is_deleted=False
        )
        db.add(patient)

    try:
        await db.commit()

        try:
            await log_event(
                int(current_user["id"]),
                LogAction.ADD_PATIENT,
                f"Patient ID: {body.citizen_id} was added for Doctor: {doctor_id}",
                [Role.DOCTOR]
            )
        except Exception as e:
            print(f"Logging Failed: {e}")

        await db.refresh(patient)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Cannot create patient")
    return patient


@router.put("/{p_id}", response_model=PatientResponse)
async def update_patient(
    p_id: int,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_doctor) # บังคับสิทธิ์หมอ
):
    result = await db.execute(select(Patient).where(Patient.p_id == p_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if body.name is not None: patient.name = body.name
    if body.age is not None: patient.age = body.age
    if body.gender is not None: patient.gender = body.gender

    await db.commit()
    await db.refresh(patient)
    return patient


@router.delete("/{p_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(p_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_doctor)):
    result = await db.execute(select(Patient).where(Patient.p_id == p_id))
    patient = result.scalar_one_or_none()
    
    # ถ้าไม่เจอ หรือ ถูกลบไปแล้ว
    if not patient or patient.is_deleted:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # ซ่อนข้อมูล (Soft Delete)
    patient.is_deleted = True
    await db.commit()
# ------------------------------------------
# Treatment + Stock Deduction (PostgreSQL)
# ------------------------------------------

@router.get("/{p_id}/treatments", response_model=list[TreatmentResponse])
async def get_treatments(p_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Treatment).where(Treatment.p_id == p_id))
    return result.scalars().all()


@router.post("/{p_id}/treatments", response_model=TreatmentResponse, status_code=status.HTTP_201_CREATED)
async def add_treatment(p_id: int, body: TreatmentCreate, db: AsyncSession = Depends(get_db)):
    # 1. Check patient exists
    p_result = await db.execute(select(Patient).where(Patient.p_id == p_id))
    if not p_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Check medication exists
    m_result = await db.execute(select(Medication).where(Medication.med_id == body.med_id))
    if not m_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Medication not found")

    # 3. Get valid (non-expired) stock sorted by expiry date — FEFO (First Expired First Out)
    today = date.today()
    
    stock_result = await db.execute(
        select(Inventory)
        .where(Inventory.med_id == body.med_id)
        .where(Inventory.exp_day >= today)
        .where(Inventory.quantity > 0)
        .order_by(Inventory.exp_day)
    )
    stock_entries = stock_result.scalars().all()

    # 4. Check enough total stock
    total_available = sum(s.quantity for s in stock_entries)
    if total_available < body.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough stock. Available: {total_available}, Requested: {body.amount}"
        )

    # 5. Deduct stock FEFO — use oldest expiry batches first
    remaining = body.amount
    for stock in stock_entries:
        if remaining <= 0:
            break
        deduct = min(stock.quantity, remaining)
        stock.quantity -= deduct
        remaining -= deduct
    dispensed_exp_date = stock_entries[0].exp_day if stock_entries else None
    # 6. Save treatment record
    treatment = Treatment(p_id=p_id, med_id=body.med_id, amount=body.amount, date=body.date,exp_date=dispensed_exp_date)
    db.add(treatment)

    try:
        await db.commit()
        await db.refresh(treatment)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save treatment")

    return treatment

# ------------------------------------------
# Patient History (MongoDB via Beanie)
# ------------------------------------------

@router.get("/{p_id}/history", response_model=PatientHistResponse)
async def get_patient_history(p_id: int, current_user: dict = Depends(get_current_user_token)):
    hist = await Patient_hist.find_one(Patient_hist.p_id == p_id)
    if not hist:
        raise HTTPException(status_code=404, detail="Patient history not found")
    return hist

@router.post("/{p_id}/upload-image")
async def upload_patient_image(
    p_id: int, 
    file: UploadFile = File(...),
    current_user: dict = Depends(require_doctor_or_pharmacist)
):
    # สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    file_location = f"uploads/patients/{p_id}_{file.filename}"
    file_extension = file.filename.split(".")[-1]

    timestamp = int(time.time())
    unique_filename = f"{p_id}_{timestamp}.{file_extension}"

    file_location = f"uploads/patients/{unique_filename}"
    
    # บันทึกไฟล์ลงในระบบ
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # ส่งคืน URL ของรูปภาพ
    return {"image_url": f"/uploads/patients/{unique_filename}"}


@router.post("/{p_id}/history", response_model=PatientHistResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_history(p_id: int, body: PatientHistCreate,current_user: dict = Depends(require_doctor)):
    existing = await Patient_hist.find_one(Patient_hist.p_id == p_id)
    if existing:
        raise HTTPException(status_code=409, detail="History already exists, use PUT to update")

    hist = Patient_hist(
        p_id=p_id,
        history=body.history,
        diagnosis=parse_csv(body.diagnosis),
        medication=parse_csv(body.medication),
        allergies=parse_csv(body.allergies),
        image_url=body.image_url
    )
    await hist.insert()
    return hist


@router.put("/{p_id}/history", response_model=PatientHistResponse)
async def update_patient_history(p_id: int, body: PatientHistCreate,current_user: dict = Depends(require_doctor)):
    hist = await Patient_hist.find_one(Patient_hist.p_id == p_id)
    if not hist:
        raise HTTPException(status_code=404, detail="Patient history not found")

    update_data: dict = {}
    if body.history is not None: update_data["history"] = body.history
    if body.diagnosis is not None: update_data["diagnosis"] = parse_csv(body.diagnosis)
    if body.medication is not None: update_data["medication"] = parse_csv(body.medication)
    if body.allergies is not None: update_data["allergies"] = parse_csv(body.allergies)
    if body.image_url is not None: update_data["image_url"] = body.image_url

    if update_data:
        await hist.set(update_data)

    return hist