import React, { useState } from 'react';

export default function PatientHistoryForm({ patient, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    history: '', diagnosis: '', medication: '', allergies: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token'); // 👈 1. ดึง Token

    try {
      const response = await fetch(`http://localhost:8000/api/v1/patients/${patient.p_id}/history`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 👈 2. แนบ Token ตรงนี้
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showMessage('Medical record created successfully.', 'success');
        onSuccess();
      } else if (response.status === 409) {
        showMessage('Record already exists for this patient. Please update via the Patient Profile page.', 'error');
      } else {
        const errorData = await response.json();
        showMessage(`System error: ${JSON.stringify(errorData)}`, 'error');
      }
    } catch (error) {
      showMessage('Unable to connect to the server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalCard}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          New Medical Record Entry
        </h3>
        <p style={styles.subtitle}>Patient: {patient.name} (HN-{patient.p_id})</p>
      </div>

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
        <div style={styles.fullWidth}>
            <label style={styles.label}>Clinical History</label>
            <textarea name="history" placeholder="Enter patient's history" value={formData.history} onChange={handleInputChange} style={styles.textarea} />
        </div>
        <div style={styles.inputContainer}>
            <label style={styles.label}>Diagnosis</label>
            <input type="text" name="diagnosis" placeholder="Current diagnosis" value={formData.diagnosis} onChange={handleInputChange} style={styles.input} />
        </div>
        <div style={styles.inputContainer}>
            <label style={styles.label}>Medication</label>
            <input type="text" name="medication" placeholder="Prescribed medications" value={formData.medication} onChange={handleInputChange} style={styles.input} />
        </div>
        <div style={styles.fullWidth}>
            <label style={styles.label}>Allergies</label>
            <input type="text" name="allergies" placeholder="Known allergies (Leave blank if none)" value={formData.allergies} onChange={handleInputChange} style={styles.input} />
        </div>
        
        <div style={styles.actionRow}>
          <button type="submit" disabled={loading} style={styles.saveBtn}>
            {loading ? 'Saving Record...' : 'Save Medical Record'}
          </button>
          <button type="button" onClick={onCancel} style={styles.cancelBtn}>
            Cancel Entry
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  modalCard: { background: '#ffffff', padding: '25px', borderRadius: '8px', border: '1px solid #1e3a8a', borderTop: '4px solid #1e3a8a', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  header: { marginBottom: '20px' },
  title: { color: '#1e3a8a', margin: '0 0 5px 0', fontSize: '18px' },
  subtitle: { color: '#475569', margin: 0, fontSize: '14px', fontWeight: 'bold' },
  form: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  fullWidth: { flex: '1 1 100%' },
  inputContainer: { flex: '1 1 45%' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px', display: 'block', textTransform: 'uppercase' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' },
  textarea: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box', fontSize: '14px' },
  actionRow: { display: 'flex', gap: '10px', width: '100%', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' },
  saveBtn: { padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  cancelBtn: { padding: '10px 20px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  notification: { padding: '12px 16px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: '500' }
};