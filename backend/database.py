import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql+asyncpg://postgres.lnsnlboggxrykokgjdrh:jhzp2ULgdHGe9jVY@aws-1-ap-south-1.pooler.supabase.com:5432/postgres")

engine = create_async_engine(POSTGRES_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://punalmonsalmon_db_user:caoXqFM6AHP5YJ1N@medicalmanagementcluste.pgrqqnv.mongodb.net/?appName=medicalManagementCluster0")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "clinic_db_mongo")

mongo_client: AsyncIOMotorClient = None

async def connect_mongodb(document_models: list):
    global mongo_client
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    await init_beanie(
        database=mongo_client[MONGO_DB_NAME],
        document_models=document_models
    )
    print("✅ MongoDB Connected!")

async def disconnect_mongodb():
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("🛑 MongoDB Disconnected!")