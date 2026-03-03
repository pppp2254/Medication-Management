from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from database import engine, Base, connect_mongodb, disconnect_mongodb
from models.med_info_mongo_model import MedInfo
from models.staff_mongo_db import StaffAuth, EventLog
from models.patient_mongo_db import Patient_hist 
from routers import inventory_router, patients_router, auth_router

# ==========================================
# 2. การเชื่อมต่อฐานข้อมูลตอนเปิด/ปิด Server
# ==========================================
MONGO_URL = "mongodb://admin:adminpassword@localhost:27017"
MONGO_DB_NAME = "clinic_db_mongo"
POSTGRES_URL = "postgresql://user:password@localhost:5432/clinic_db"

MONGO_MODELS = [MedInfo, StaffAuth, EventLog, Patient_hist]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- ทำงานตอนเริ่ม Server (Startup) ---
    print("🚀 Starting up... Connecting to databases.")
    
    # เชื่อมต่อ MongoDB ด้วย Motor และ Beanie
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ PostgreSQL Connected & Tables Ready!")
    await connect_mongodb(document_models=MONGO_MODELS)
    
    # เชื่อมต่อ PostgreSQL ด้วย SQLAlchemy
    # Base.metadata.create_all(bind=engine)

    yield # ปล่อยให้ Server ทำงาน
    
    # --- ทำงานตอนปิด Server (Shutdown) ---
    print("🛑 Shutting down... Closing connections.")
    await disconnect_mongodb()
    print("Shutdown complete!")

# ==========================================
# 3. สร้างแอปพลิเคชัน FastAPI
# ==========================================
app = FastAPI(
    title="Clinic Management API",
    description="API สำหรับระบบจัดการคลินิก (MySQL + MongoDB)",
    version="1.0.0",
    lifespan=lifespan
)

# ==========================================
# 4. ตั้งค่า CORS (สำคัญมากสำหรับ React)
# ==========================================
origins = [
    "http://localhost:5173",
    "https://my-clinic-project.vercel.app" # โดเมนจริงของหน้าเว็บ
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # อนุญาตทุก Method (GET, POST, PUT, DELETE)
    allow_headers=["*"], # อนุญาตทุก Header
)

# ==========================================
# 5. ประกอบ API ของเพื่อนๆ แต่ละคนเข้ากับโครงหลัก
# (เอาคอมเมนต์ออกเมื่อเพื่อนเขียนไฟล์เสร็จแล้ว)
# ==========================================
# คนที่ 1: ระบบผู้ป่วย
app.include_router(patients_router.router, prefix="/api/v1/patients", tags=["Patients"])

# คนที่ 2: ระบบคลังยา
app.include_router(inventory_router.router, prefix="/api/v1/inventory", tags=["Inventory"])

# คนที่ 3: ระบบพนักงานและ Log
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])

# API ทดสอบเบื้องต้น
@app.get("/")
def read_root():
    return {"status": "success", "message": "Backend is running with PostgreSQL & MongoDB ready!"}
if __name__ == "__main__":
    import uvicorn
    # สั่งรันเซิร์ฟเวอร์ที่พอร์ต 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)