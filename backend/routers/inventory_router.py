from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from database import get_db
from models.med_sql_models import Medication, Inventory
from models.med_info_mongo_model import MedInfo

router = APIRouter()

class MedicationCreate(BaseModel):
    name: str
    common_name: Optional[str] = None
    price: int

class InventoryCreate(BaseModel):
    med_id: int
    in_day: date
    exp_day: date
    quantity: int

class MedInfoCreate(BaseModel):
    med_id: int
    guideline: Optional[str] = None
    warning: Optional[str] = None


# Medication 


@router.post("/medication", summary="Add new medication")
async def add_medication(data: MedicationCreate, db: AsyncSession = Depends(get_db)):
    new_med = Medication(
        name=data.name,
        common_name=data.common_name,
        price=data.price
    )
    db.add(new_med)
    await db.commit()
    await db.refresh(new_med)
    return {"status": "success", "med_id": new_med.med_id, "name": new_med.name}


@router.get("/medication", summary="Get all medications")
async def get_medications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medication))
    meds = result.scalars().all()
    return [
        {
            "med_id": m.med_id,
            "name": m.name,
            "common_name": m.common_name,
            "price": m.price
        }
        for m in meds
    ]



@router.post("/stock", summary="Add stock to inventory")
async def add_stock(data: InventoryCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medication).where(Medication.med_id == data.med_id))
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail=f"Medication with id {data.med_id} not found")

    new_stock = Inventory(
        med_id=data.med_id,
        in_day=data.in_day,
        exp_day=data.exp_day,
        quantity=data.quantity
    )
    db.add(new_stock)
    await db.commit()
    await db.refresh(new_stock)
    return {"status": "success", "inv_id": new_stock.inv_id}


@router.get("/stock", summary="Get all inventory stock")
async def get_stock(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventory))
    stocks = result.scalars().all()
    return [
        {
            "inv_id": s.inv_id,
            "med_id": s.med_id,
            "in_day": s.in_day,
            "exp_day": s.exp_day,
            "quantity": s.quantity
        }
        for s in stocks
    ]



# Med Info MongoDB

@router.post("/medinfo", summary="Add med info (MongoDB)")
async def add_med_info(data: MedInfoCreate):
    existing = await MedInfo.find_one(MedInfo.med_id == data.med_id)
    if existing:
        raise HTTPException(status_code=400, detail=f"MedInfo for med_id {data.med_id} already exists")

    new_info = MedInfo(
        med_id=data.med_id,
        guideline=data.guideline,
        warning=data.warning
    )
    await new_info.insert()
    return {"status": "success", "med_id": data.med_id}


@router.get("/medinfo", summary="Get all med info (MongoDB)")
async def get_med_info():
    infos = await MedInfo.find_all().to_list()
    return [
        {
            "med_id": i.med_id,
            "guideline": i.guideline,
            "warning": i.warning
        }
        for i in infos
    ]



@router.get("/view", summary="View all med details with stock and info")
async def view_medications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medication))
    meds = result.scalars().all()

    output = []
    for med in meds:
        stock_result = await db.execute(
            select(Inventory).where(Inventory.med_id == med.med_id)
        )
        stocks = stock_result.scalars().all()

        med_info = await MedInfo.find_one(MedInfo.med_id == med.med_id)

        output.append({
            "med_id": med.med_id,
            "name": med.name,
            "common_name": med.common_name,
            "price": med.price,
            "stock": [
                {
                    "inv_id": s.inv_id,
                    "in_day": s.in_day,
                    "exp_day": s.exp_day,
                    "quantity": s.quantity
                }
                for s in stocks
            ],
            "med_info": {
                "guideline": med_info.guideline if med_info else None,
                "warning": med_info.warning if med_info else None
            }
        })

    return output

@router.delete("/stock/empty/all", summary="Delete all stock entries with quantity 0")
async def delete_empty_stock(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventory).where(Inventory.quantity == 0))
    stocks = result.scalars().all()
    count = len(stocks)
    for stock in stocks:
        await db.delete(stock)
    await db.commit()
    return {"status": "success", "message": f"Deleted {count} empty stock entries"}


@router.delete("/stock/expired/all", summary="Delete all expired stock entries")
async def delete_expired_stock(db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    today = datetime.now().date()
    result = await db.execute(select(Inventory).where(Inventory.exp_day < today))
    stocks = result.scalars().all()
    count = len(stocks)
    for stock in stocks:
        await db.delete(stock)
    await db.commit()
    return {"status": "success", "message": f"Deleted {count} expired stock entries"}


@router.delete("/stock/{inv_id}", summary="Delete a specific stock entry")
async def delete_stock(inv_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventory).where(Inventory.inv_id == inv_id))
    stock = result.scalar_one_or_none()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock entry {inv_id} not found")
    await db.delete(stock)
    await db.commit()
    return {"status": "success", "message": f"Stock entry {inv_id} deleted"}