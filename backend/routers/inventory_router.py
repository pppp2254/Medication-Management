from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from database import get_db
from models.med_sql_models import Medication, Inventory, StockLog
from models.med_info_mongo_model import MedInfo
from models.patient_sql_db import Treatment

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
    new_med = Medication(name=data.name, common_name=data.common_name, price=data.price)
    db.add(new_med)
    await db.commit()
    await db.refresh(new_med)
    return {"status": "success", "med_id": new_med.med_id, "name": new_med.name}

@router.get("/medication", summary="Get all medications")
async def get_medications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medication))
    meds = result.scalars().all()
    return [{"med_id": m.med_id, "name": m.name, "common_name": m.common_name, "price": m.price} for m in meds]


# Inventory 

@router.post("/stock", summary="Add stock to inventory")
async def add_stock(data: InventoryCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medication).where(Medication.med_id == data.med_id))
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail=f"Medication with id {data.med_id} not found")

    # Add to inventory
    new_stock = Inventory(med_id=data.med_id, in_day=data.in_day, exp_day=data.exp_day, quantity=data.quantity)
    db.add(new_stock)

    # Log 
    log = StockLog(med_id=data.med_id, quantity=data.quantity, price_per_unit=med.price, log_date=data.in_day)
    db.add(log)

    await db.commit()
    await db.refresh(new_stock)
    return {"status": "success", "inv_id": new_stock.inv_id}

@router.get("/stock", summary="Get all inventory stock")
async def get_stock(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventory))
    stocks = result.scalars().all()
    return [{"inv_id": s.inv_id, "med_id": s.med_id, "in_day": s.in_day, "exp_day": s.exp_day, "quantity": s.quantity} for s in stocks]

# Med Info (MongoDB)


@router.post("/medinfo", summary="Add med info (MongoDB)")
async def add_med_info(data: MedInfoCreate):
    existing = await MedInfo.find_one(MedInfo.med_id == data.med_id)
    if existing:
        raise HTTPException(status_code=400, detail=f"MedInfo for med_id {data.med_id} already exists")
    await MedInfo(med_id=data.med_id, guideline=data.guideline, warning=data.warning).insert()
    return {"status": "success", "med_id": data.med_id}

@router.get("/medinfo", summary="Get all med info (MongoDB)")
async def get_med_info():
    infos = await MedInfo.find_all().to_list()
    return [{"med_id": i.med_id, "guideline": i.guideline, "warning": i.warning} for i in infos]


# stock + med info

@router.get("/view", summary="View all med details with stock and info")
async def view_medications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medication))
    meds = result.scalars().all()
    output = []
    for med in meds:
        stocks = (await db.execute(select(Inventory).where(Inventory.med_id == med.med_id))).scalars().all()
        med_info = await MedInfo.find_one(MedInfo.med_id == med.med_id)
        output.append({
            "med_id": med.med_id, "name": med.name, "common_name": med.common_name, "price": med.price,
            "stock": [{"inv_id": s.inv_id, "in_day": s.in_day, "exp_day": s.exp_day, "quantity": s.quantity} for s in stocks],
            "med_info": {"guideline": med_info.guideline if med_info else None, "warning": med_info.warning if med_info else None}
        })
    return output

# Delete 

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

# Report 

@router.get("/report", summary="Get drug in/out report by time range")
async def get_report(range: str = "30d", db: AsyncSession = Depends(get_db)):
    from datetime import timedelta

    today = datetime.now().date()
    range_map = {
        "7d": today - timedelta(days=7),
        "15d": today - timedelta(days=15),
        "30d": today - timedelta(days=30),
        "3m": today - timedelta(days=90),
        "6m": today - timedelta(days=180),
        "1y": today - timedelta(days=365),
        "all": None
    }
    start_date = range_map.get(range, today - timedelta(days=30))

    if start_date:
        result = await db.execute(
            select(StockLog, Medication)
            .join(Medication, StockLog.med_id == Medication.med_id)
            .where(StockLog.log_date >= start_date)
        )
    else:
        result = await db.execute(
            select(StockLog, Medication)
            .join(Medication, StockLog.med_id == Medication.med_id)
        )

    rows = result.all()

    med_map = {}
    for log, med in rows:
        if med.med_id not in med_map:
            med_map[med.med_id] = {
                "med_id": med.med_id,
                "name": med.name,
                "total_quantity_in": 0,
                "total_price_in": 0,
                "total_quantity_out": 0,
                "total_price_out": 0,
            }
        med_map[med.med_id]["total_quantity_in"] += log.quantity
        med_map[med.med_id]["total_price_in"] += log.quantity * log.price_per_unit

    if start_date:
        out_result = await db.execute(
            select(Treatment, Medication)
            .join(Medication, Treatment.med_id == Medication.med_id)
            .where(Treatment.date >= start_date)
        )
    else:
        out_result = await db.execute(
            select(Treatment, Medication)
            .join(Medication, Treatment.med_id == Medication.med_id)
        )

    for treatment, med in out_result.all():
        if med.med_id not in med_map:
            med_map[med.med_id] = {
                "med_id": med.med_id,
                "name": med.name,
                "total_quantity_in": 0,
                "total_price_in": 0,
                "total_quantity_out": 0,
                "total_price_out": 0,
            }
        med_map[med.med_id]["total_quantity_out"] += treatment.amount
        med_map[med.med_id]["total_price_out"] += treatment.amount * med.price

    return {
        "range": range,
        "start_date": str(start_date) if start_date else "all time",
        "end_date": str(today),
        "data": list(med_map.values())
    }

# Dashboard 


@router.get("/dashboard", summary="Get dashboard summary stats")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    from datetime import timedelta

    today = datetime.now().date()
    thirty_days = today + timedelta(days=30)
    week_ago = today - timedelta(days=7)

    med_result = await db.execute(select(Medication))
    meds = med_result.scalars().all()
    total_meds = len(meds)

    inv_result = await db.execute(select(Inventory))
    stocks = inv_result.scalars().all()

    total_stock = sum(s.quantity for s in stocks)
    expired_count = sum(1 for s in stocks if s.exp_day < today)
    expiring_soon_count = sum(1 for s in stocks if today <= s.exp_day <= thirty_days)
    out_of_stock = sum(1 for s in stocks if s.quantity == 0)

    inv_value_result = await db.execute(
        select(Inventory, Medication).join(Medication, Inventory.med_id == Medication.med_id)
    )
    total_value = sum(inv.quantity * med.price for inv, med in inv_value_result.all())

    recent_result = await db.execute(
        select(StockLog, Medication)
        .join(Medication, StockLog.med_id == Medication.med_id)
        .where(StockLog.log_date >= week_ago)
        .order_by(StockLog.log_date.desc())
    )
    recent = [
        {"name": med.name, "quantity": log.quantity, "in_day": str(log.log_date), "price": log.price_per_unit}
        for log, med in recent_result.all()
    ]

    med_stock_map = {}
    for s in stocks:
        med_stock_map[s.med_id] = med_stock_map.get(s.med_id, 0) + s.quantity

    low_stock_ids = [mid for mid, qty in med_stock_map.items() if 0 < qty < 10]
    low_stock_meds = [
        {"med_id": m.med_id, "name": m.name, "total_qty": med_stock_map.get(m.med_id, 0)}
        for m in meds if m.med_id in low_stock_ids
    ]

    return {
        "total_medications": total_meds,
        "total_stock_units": total_stock,
        "total_inventory_value": total_value,
        "expired_entries": expired_count,
        "expiring_soon": expiring_soon_count,
        "out_of_stock_entries": out_of_stock,
        "recent_stock_in": recent,
        "low_stock_medications": low_stock_meds,
    }