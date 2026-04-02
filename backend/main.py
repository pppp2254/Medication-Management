import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, connect_mongodb, disconnect_mongodb
from models.med_info_mongo_model import MedInfo
from models.staff_mongo_db import StaffAuth, EventLog
from models.patient_mongo_db import Patient_hist
from routers import inventory_router, patients_router, auth_router, staff_router

MONGO_MODELS = [MedInfo, StaffAuth, EventLog, Patient_hist]

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up... Connecting to databases.")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ PostgreSQL Connected & Tables Ready!")
    except Exception as e:
        print(f"❌ PostgreSQL Connection Failed: {e}")

    try:
        await connect_mongodb(document_models=MONGO_MODELS)
        print("✅ MongoDB Connected!")
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")

    yield

    print("🛑 Shutting down... Closing connections.")
    await disconnect_mongodb()
    print("Shutdown complete!")

app = FastAPI(
    title="Clinic Management API",
    description="API สำหรับระบบจัดการคลินิก",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    # Add your deployed frontend URL here after deployment
    # "https://your-frontend.vercel.app",
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

app.include_router(patients_router.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(inventory_router.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(staff_router.router, prefix="/api/v1/staff", tags=["Staff"])

@app.get("/")
def read_root():
    return {"status": "success", "message": "Backend is running with Supabase & MongoDB Atlas!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)