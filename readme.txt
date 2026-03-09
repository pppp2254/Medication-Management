ผู้จัดทำ
6710503739 กวินภพ จันเจือ
6710504077 ปัญญวัฒน์ เชื้อวัชรินทร์
6710504310 รัชพล สนิทวงษ์

ลิ้งค์ ไฟล์สรุปข้อมูล database
https://docs.google.com/document/d/1wricOoPUAKSJ5wBYya2PEm1OgCQOpMpJ4VqYSbHiiNw/edit?usp=sharing

ลิ้งค์ คลิปอธิบาย
https://youtu.be/rDISuk_C8DM?si=nDull54tzLZke872

Healthcare Management System
  ระบบนี้ถูกสร้างขึ้นมาเพื่อให้พนักงานใน clinic ใช้ในการตรวจสอบและติดตามช้อมูลคนไข้ได้ง่าย

--เครื่องมือที่ใช้--
Backend
  -Python
  -FastAPI
  -SQLAlchemy
  -Beanie
  -Pydynamic

Frontend
  -React
  -Axios

Databases
  -PostgreSQL
  -MongoDB

Infrastructure
  -Docker

--การใช้งาน--
Docker
  run คำสั่ง
  docker-compose up -d
  
  เมื่อใช้เสร็จ run
  docker-compose down

Backend
  เข้าไปใน folder backend แล้วใข้คำสั่ง
  venv\scripts\activate
  แล้วลง requirment ทั้งหมด
  pip install -r requirement.txt
  จึงสามารถใช้งานตัว application หลักได้
  python main.py

คำสั่งเพิ่มเติม
  คำสั่งสร้าง user admin
  python create-admin.py
  สามารถมี admin ได้แค่ 1 คนต่อระบบเท่านั้น

Frontend
  เข้าไปใน folder frontend แล้วใช้คำสั่ง
  npm install
  เพื่อเตรียมตัว frontend
  แล้ว run
  npm run
  เพื่อเปิดตัว website

--Schemas--
PostgresSQL
Staff
| Field    | Type            | Description     |
| -------- | --------------- | --------------- |
| staff_id | BigInteger (PK) | Staff ID        |
| username | String          | Login username  |
| password | String          | Hashed password |
| name     | String          | Staff full name |
| role     | String          | Work role       |

Patient
| Field      | Type            | Description      |
| ---------- | --------------- | ---------------- |
| p_id       | BigInteger (PK) | Patient ID       |
| name       | String          | Patient name     |
| citizen_id | String          | National ID      |
| password   | String          | Patient password |
| age        | BigInteger      | Age              |
| gender     | String          | Gender           |
| doctor_id  | FK              | Assigned doctor  |
| is_deleted | Boolean         | Soft delete flag |

Treatment
| Field    | Type            | Description       |
| -------- | --------------- | ----------------- |
| t_id     | BigInteger (PK) | Treatment ID      |
| p_id     | FK              | Patient ID        |
| med_id   | FK              | Medication ID     |
| amount   | BigInteger      | Amount prescribed |
| date     | Date            | Treatment date    |
| exp_date | Date            | Expiration date   |

Medication Table
| Field       | Type            | Description     |
| ----------- | --------------- | --------------- |
| med_id      | BigInteger (PK) | Medication ID   |
| name        | String          | Medication name |
| common_name | String          | Generic name    |
| price       | BigInteger      | Price per unit  |

Inventory Table
| Field    | Type            | Description        |
| -------- | --------------- | ------------------ |
| inv_id   | BigInteger (PK) | Inventory ID       |
| med_id   | FK              | Medication ID      |
| in_day   | Date            | Stock arrival date |
| exp_day  | Date            | Expiration date    |
| quantity | BigInteger      | Quantity available |

StockLog Table
| Field          | Type            | Description    |
| -------------- | --------------- | -------------- |
| log_id         | BigInteger (PK) | Log ID         |
| med_id         | FK              | Medication ID  |
| quantity       | BigInteger      | Quantity added |
| price_per_unit | BigInteger      | Purchase price |
| log_date       | Date            | Log date       |

MongoDB
StaffAuth
Role{Admin,Doctor,Pharmacist}
| Field       | Type      |
| ----------- | --------- |
| staff_id    | int       |
| permission  | Role(enum)|
EventLog
| Field       | Type     |
| ----------- | -------- |
| staff_id    | int      |
| date        | datetime |
| action      | string   |
| description | string   |
| visibility  | list     |

MedInfo
| Field     | Type   |
| --------- | ------ |
| med_id    | int    |
| guideline | string |
| warning   | string |

Patient History
| Field      | Type   |
| ---------- | ------ |
| p_id       | int    |
| history    | string |
| diagnosis  | list   |
| medication | list   |
| allergies  | list   |
| image_url  | string |

--Application Pages--
Login Page 
  ใช้ในการ Login

Register Page
  ใช้ในการสร้าง user ใหม่

Patient Page
  ใช้ในการเพิ่มคนไข้
    -Patient File Page
      ใช้ในการเพิ่มประวัติคนไข้,ข้อมูลคนไข้และการจ่ายยา

Add Medication Page
  ใช้เพิ่มประเภทยาและราคายาตัวนั้น

Add Stock Page
  ใช้เพิ่มปริมาณยาในคลังพร้อมกรอกวันหมดอายุและจำนวน

Add Med Info Page
  ใช้เพิ่มข้อมูลของยาทั้งการใช้และอันตราย

View Medications Page
  ใช้ในการตรวจสอบจำนวนยาที่เหลือในคลัง

Drug Report Page
  ใช้ในการแสดงการเข้าออกของยา

Staffs Page
  ใช้แสดง user ทั้งหมดในระบบพร้อมความสามารถในการเข้าถึงข้อมูลต่างๆ

Logs Page
  แสดงข้อว่าพนักงานคนไหน,ทำอะไร,รายละเอียดคืออะไรและเกิดขึ้นวันที่เท่าไหร่

Admin Panel Page
  หน้าที่เข้าถึงได้แค่ Admin เท่านั้น
  ใช้เพิ่ม Permission ให้กับ User ในระบบ
