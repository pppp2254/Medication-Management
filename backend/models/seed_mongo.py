import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import random

# Import your models (make sure the file and class names match)
from med_info_mongo_model import MedInfo
from patient_mongo_db import Patient_hist
from staff_mongo_db import StaffAuth, Role

async def seed_mongodb():
    # 1. Connect to MongoDB (based on your docker-compose.yml credentials)
    client = AsyncIOMotorClient("mongodb://admin:adminpassword@localhost:27017")
    
    # Define the database name (e.g., clinic_db) and register the models
    await init_beanie(
        database=client.clinic_db_mongo, 
        document_models=[MedInfo, Patient_hist, StaffAuth]
    )

    print("Successfully connected to MongoDB. Clearing old data and inserting new mock data...")

    # Clear existing data so the script can be re-run safely

    # 2. Create StaffAuth data (6 staff members) to match the SQL database
    # อิงตามข้อมูล User: ID 1-4 เป็น Doctor, ID 5-6 เป็น Pharmacist
    # staff_auths = [
    #     StaffAuth(staff_id=1, permission=[Role.DOCTOR]),
    #     StaffAuth(staff_id=2, permission=[Role.DOCTOR]),
    #     StaffAuth(staff_id=3, permission=[Role.DOCTOR]),
    #     StaffAuth(staff_id=4, permission=[Role.DOCTOR]),
    #     StaffAuth(staff_id=5, permission=[Role.PHARMACIST]),
    #     StaffAuth(staff_id=6, permission=[Role.PHARMACIST]),
    # ]
    # await StaffAuth.insert_many(staff_auths)
    # print("Successfully inserted StaffAuth data.")

    # 3. Create MedInfo data (for the 5 medications)
    med_infos = [
        MedInfo(med_id=1, guideline="Take immediately after meals", warning="May cause stomach irritation"),
        MedInfo(med_id=2, guideline="Take continuously until finished", warning="Stop taking and consult a doctor if a rash appears"),
        MedInfo(med_id=3, guideline="Take immediately after meals", warning="Do not use if you have Dengue fever"),
        MedInfo(med_id=4, guideline="Take before bedtime", warning="Causes drowsiness. Do not drive or operate machinery"),
        MedInfo(med_id=5, guideline="Take 15-30 minutes before meals", warning="Do not chew or crush the tablet"),
    ]
    await MedInfo.insert_many(med_infos)
    print("Successfully inserted MedInfo data.")

    # 4. Create Patient_hist data (40 patients to match SQL)
    patient_hists = []
    diagnoses_mock = ["Common Cold", "Fever", "Migraine", "Gastritis", "Allergic Rhinitis"]
    
    for i in range(1, 41):
        # Randomize history data
        diag = random.choice(diagnoses_mock)
        has_allergy = random.choice([True, False])
        
        hist = Patient_hist(
            p_id=i,
            history="No severe underlying diseases" if i % 3 != 0 else "History of high blood pressure",
            diagnosis=[diag], # Pass as a List based on your validator
            medication=["Paracetamol", "Vitamin C"] if diag == "Fever" else ["Omeprazole"],
            allergies=["Seafood"] if has_allergy else ["None"],
            image_url=f"https://example.com/images/patient_{i}.jpg"
        )
        patient_hists.append(hist)
        
    await Patient_hist.insert_many(patient_hists)
    print(f"Successfully inserted {len(patient_hists)} Patient_hist records.")

    # 5. Create mock EventLog data (If needed in the future)
    print("Seeding process completed.")
    
if __name__ == "__main__":
    # Run the async loop
    asyncio.run(seed_mongodb())