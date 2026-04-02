import React, { useState } from 'react';

export default function PatientForm({ onAddSuccess }) {
  const [formData, setFormData] = useState({ name: '',citizen_id: '', age: '', gender: 'Male' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(false); // เดิมอาจเป็น true
    
    try {
      // 1. ดึง Token มาจาก localStorage (ใช้ชื่อ 'token' ให้ตรงกับไฟล์ Login.jsx ของคุณ)
      const token = localStorage.getItem('token'); 

      const response = await fetch('https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/patients/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // 2. เพิ่มบรรทัดนี้เพื่อส่ง Token ไปยืนยันตัวตนกับ Backend
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...formData, age: parseInt(formData.age, 10) }),
      });

      if (response.ok) {
        showMessage('Patient registered successfully.', 'success');
        // รีเซ็ตฟอร์ม รวมถึง citizen_id ด้วย
        setFormData({ name: '', citizen_id: '', age: '', gender: 'Male' }); 
        onAddSuccess(); 
      } else {
        const errorData = await response.json(); 
        // แสดงข้อความ Error ที่ละเอียดขึ้นเพื่อให้รู้ว่าซ้ำหรือติดสิทธิ์
        showMessage(`Registration failed: ${errorData.detail || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showMessage('Unable to connect to the server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Register New Patient</h3>
      {message.text && (
        <div style={{
          ...styles.notification,
          backgroundColor: message.type === 'success' ? '#edf7ed' : '#fdeded',
          color: message.type === 'success' ? '#1e4620' : '#5f2120',
          border: `1px solid ${message.type === 'success' ? '#c8e6c9' : '#ffcdd2'}`
        }}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input type="text" name="name" placeholder="Enter full name" value={formData.name} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
            <label style={styles.label}>Citizen ID</label>
            <input type="text" name="citizen_id" placeholder="13-digit ID" value={formData.citizen_id} onChange={handleInputChange} required maxLength="13" style={styles.input} />
        </div>
        <div style={{...styles.inputGroup, maxWidth: '120px'}}>
            <label style={styles.label}>Age</label>
            <input type="number" name="age" placeholder="Years" value={formData.age} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={{...styles.inputGroup, maxWidth: '150px'}}>
            <label style={styles.label}>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} style={styles.input}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Processing...' : 'Register Patient'}
            </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
    card: { background: '#f8fafc', padding: '20px 25px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px' },
    title: { marginTop: 0, color: '#334155', fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' },
    form: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    input: { padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    button: { padding: '10px 20px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '40px' }, 
    notification: { padding: '12px 16px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: '500' }
};