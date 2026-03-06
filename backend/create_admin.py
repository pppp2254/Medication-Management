import asyncio
import os
import getpass

from sqlalchemy import select

from routers.auth_router import pwd_context
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, connect_mongodb, disconnect_mongodb, AsyncSessionLocal
from models.med_info_mongo_model import MedInfo
from models.staff_sql_db import StaffInfo
from models.staff_mongo_db import StaffAuth, EventLog, Role
from models.patient_mongo_db import Patient_hist 
from routers import inventory_router, patients_router, auth_router

MONGO_URL = "mongodb://admin:adminpassword@localhost:27017"
MONGO_DB_NAME = "clinic_db_mongo"
POSTGRES_URL = "postgresql://user:password@localhost:5432/clinic_db"

MONGO_MODELS = [MedInfo, StaffAuth, EventLog, Patient_hist]

async def create_admin():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Connect Mongo
    await connect_mongodb(document_models=[StaffAuth])

    async with AsyncSessionLocal() as db:
        try:
            print("✅ PostgreSQL Connected & Tables Ready!")
            # Check if Admin Exists
            existing = await StaffAuth.find_one(StaffAuth.permission == Role.ADMIN)

            if existing:
                print("✅ Admin already exists.")
                print("🛑 Cancelling Operation")
                return

            admin_username = input("Enter Admin's username: ")
            while True:
                password = getpass.getpass("Enter Admin's password: ")
                password2 = getpass.getpass("Confirm password: ")

                if(password == password2):
                    break

                print("Password incorrect. Try again.")

            hashed_pw = pwd_context.hash(password)
            admin_name = input("Enter Admin's name: ")
            admin_role = input("Enter Admin's Role: ")

            # Create SQL user (but DO NOT commit yet)
            admin = StaffInfo(
                username=admin_username,
                name=admin_name,
                password=hashed_pw,
                role=admin_role
            )

            db.add(admin)
            await db.flush()  # gets ID without committing

            # Create Mongo permission
            await StaffAuth(
                staff_id=admin.staff_id,
                permission=[Role.ADMIN]
            ).insert()

            # If Mongo succeeds → commit SQL
            await db.commit()
            print("✅ Admin created successfully.")

        except Exception as e:
            await db.rollback()
            print("❌ Failed. SQL rolled back.")
            raise e
        
        finally:
            await disconnect_mongodb()


if __name__ == "__main__":
    asyncio.run(create_admin())