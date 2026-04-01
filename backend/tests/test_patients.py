import pytest
import pytest_asyncio
import random 
from httpx import AsyncClient, ASGITransport

from main import app, lifespan 
from routers.patients_router import get_current_user_token, require_doctor, require_doctor_or_pharmacist

async def mock_doctor_user():
    return {"id": 1, "role": "doctor"}


@pytest_asyncio.fixture(scope="session")
async def client():
    app.dependency_overrides[get_current_user_token] = mock_doctor_user
    app.dependency_overrides[require_doctor] = mock_doctor_user
    app.dependency_overrides[require_doctor_or_pharmacist] = mock_doctor_user

    async with lifespan(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_create_patient_success(client):

    fake_id = str(random.randint(1000000000000, 9999999999999))
    
    payload = {
        "name": "Great Patient",
        "citizen_id": fake_id,
        "age": 30,
        "gender": "Male"
    }
    response = await client.post("/api/v1/patients/", json=payload)
    data = response.json()
    assert data["name"] == "Great Patient"
    assert "p_id" in data

@pytest.mark.asyncio
async def test_get_patient_history_not_found(client):
    response = await client.get("/api/v1/patients/999/history")
    assert response.json()["detail"] == "Patient history not found"

@pytest.mark.asyncio
async def test_add_treatment_patient_not_found(client):
    treatment_payload = {
        "med_id": 1,
        "amount": 2,
        "date": "2026-04-01"
    }
    response = await client.post("/api/v1/patients/999/treatments", json=treatment_payload)
    assert response.json()["detail"] == "Patient not found"