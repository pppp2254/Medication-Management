from sqlalchemy import Column, BigInteger, String, Date, ForeignKey,Boolean
from sqlalchemy.orm import relationship
from database import Base

class Patient(Base):
    __tablename__ = "patient"

    p_id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    # ใช้ชื่อเป็น Username (ควรตั้งเป็น unique=True เพื่อไม่ให้ล็อกอินซ้ำกัน)
    name = Column(String(255), nullable=False) 
    
    # เพิ่มเลขบัตรประชาชน และ Password สำหรับให้คนไข้ใช้ล็อกอิน
    citizen_id = Column(String(13), nullable=False, unique=True) 
    password = Column(String(255), nullable=False) 
    
    age = Column(BigInteger, nullable=False) 
    gender = Column(String(100), nullable=False) 
    
    # เชื่อมโยงกับแพทย์เจ้าของไข้
    doctor_id = Column(BigInteger, ForeignKey("staff.staff_id"), nullable=True)

    treatments = relationship("Treatment", back_populates="patient")
    is_deleted = Column(Boolean, default=False)


class Treatment(Base):
    __tablename__ = "treatment"

    t_id = Column(BigInteger, primary_key=True, autoincrement=True)
    p_id = Column(BigInteger, ForeignKey("patient.p_id"), nullable=False)
    med_id = Column(BigInteger, ForeignKey("medication.med_id"), nullable=False)
    amount = Column(BigInteger, nullable=False)
    date = Column(Date, nullable=False)
    exp_date = Column(Date, nullable=True)

    patient = relationship("Patient", back_populates="treatments")