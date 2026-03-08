import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from database import engine, Base, connect_mongodb, disconnect_mongodb
from models.med_info_mongo_model import MedInfo
from models.staff_mongo_db import StaffAuth, EventLog
from models.patient_mongo_db import Patient_hist 
from routers import inventory_router, patients_router, auth_router, staff_router

#connection
MONGO_URL = "mongodb://admin:adminpassword@localhost:27017"
MONGO_DB_NAME = "clinic_db_mongo"
POSTGRES_URL = "postgresql://user:password@localhost:5432/clinic_db"

MONGO_MODELS = [MedInfo, StaffAuth, EventLog, Patient_hist]

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up... Connecting to databases.")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ PostgreSQL Connected & Tables Ready!")
    await connect_mongodb(document_models=MONGO_MODELS)
    
    print("✅ PostgreSQL Connected!")

    yield 
    
    print("🛑 Shutting down... Closing connections.")
    await disconnect_mongodb()
    print("Shutdown complete!")

#FastAPI
app = FastAPI(
    title="Clinic Management API",
    description="API สำหรับระบบจัดการคลินิก (MySQL + MongoDB)",
    version="1.0.0",
    lifespan=lifespan
)



#CORS
origins = [
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

os.makedirs("uploads/patients", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# คนที่ 1: ระบบผู้ป่วย
app.include_router(patients_router.router, prefix="/api/v1/patients", tags=["Patients"])

# คนที่ 2: ระบบคลังยา
app.include_router(inventory_router.router, prefix="/api/v1/inventory", tags=["Inventory"])

# คนที่ 3: ระบบพนักงานและ Log
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(staff_router.router, prefix="/api/v1/staff", tags=["Staff"])

# API ทดสอบเบื้องต้น
@app.get("/")
def read_root():
    return {"status": "success", "message": "Backend is running with PostgreSQL & MongoDB ready!"}
if __name__ == "__main__":
    import uvicorn
    # สั่งรันเซิร์ฟเวอร์ที่พอร์ต 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)