import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PatientHistoryForm from '../components/Patient/PatientHistForm';

const PATIENT_API = 'http://localhost:8000/api/v1/patients';
const INVENTORY_API = 'http://localhost:8000/api/v1/inventory';

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ history: '', diagnosis: '', medication: '', allergies: '' });
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Dispense form state
  const [dispenseForm, setDispenseForm] = useState({ med_id: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [dispensing, setDispensing] = useState(false);

  const userRole = localStorage.getItem("role")?.toLowerCase();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPatientData(), fetchPatientHistory(), fetchTreatments(), fetchMedications()]);
    setLoading(false);
  };

  const fetchPatientData = async () => {
    try {
      const res = await fetch(`${PATIENT_API}/${id}`);
      if (res.ok) setPatient(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPatientHistory = async () => {
    try {
      const res = await fetch(`${PATIENT_API}/${id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      if (res.ok) setHistory(await res.json());
      else if (res.status === 404) setHistory(null);
    } catch (e) { console.error(e); }
  };

  const fetchTreatments = async () => {
    try {
      const res = await fetch(`${PATIENT_API}/${id}/treatments`);
      if (res.ok) setTreatments(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchMedications = async () => {
    try {
      const res = await fetch(`${INVENTORY_API}/medication`);
      if (res.ok) setMedications(await res.json());
    } catch (e) { console.error(e); }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleEditClick = () => {
    setEditFormData({
      history: history.history || '',
      diagnosis: Array.isArray(history.diagnosis) ? history.diagnosis.join(', ') : history.diagnosis || '',
      medication: Array.isArray(history.medication) ? history.medication.join(', ') : history.medication || '',
      allergies: Array.isArray(history.allergies) ? history.allergies.join(', ') : history.allergies || '',
    });
    setIsEditing(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${PATIENT_API}/${id}/history`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        showMessage('Medical history updated successfully.', 'success');
        setIsEditing(false);
        fetchPatientHistory();
      } else {
        showMessage('Error saving changes. Please try again.', 'error');
      }
    } catch {
      showMessage('Unable to connect to the server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!dispenseForm.med_id || !dispenseForm.amount) return;
    setDispensing(true);
    try {
      const res = await fetch(`${PATIENT_API}/${id}/treatments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          med_id: parseInt(dispenseForm.med_id),
          amount: parseInt(dispenseForm.amount),
          date: dispenseForm.date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(`✅ Medication dispensed successfully! (Treatment ID: ${data.t_id})`, 'success');
        setDispenseForm({ med_id: '', amount: '', date: new Date().toISOString().split('T')[0] });
        fetchTreatments();
      } else {
        showMessage(`❌ ${data.detail || 'Failed to dispense medication'}`, 'error');
      }
    } catch {
      showMessage('❌ Cannot connect to server', 'error');
    } finally {
      setDispensing(false);
    }
  };

  const getMedName = (med_id) => {
    const med = medications.find(m => m.med_id === med_id);
    return med ? med.name : `Med ID: ${med_id}`;
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading patient data...</div>;
  if (!patient) return <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>Patient record not found.</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <Link to="/patients" style={styles.backBtn}>&larr; Back to Patient Directory</Link>

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

      <h2 style={{ color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', fontSize: '22px' }}>
        Patient Profile: {patient.name}
      </h2>

      {/* General Info + Medical History */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>General Information</h3>
          <table style={styles.infoTable}>
            <tbody>
              <tr><td style={styles.infoLabel}>Patient ID (HN)</td><td>{patient.p_id}</td></tr>
              <tr><td style={styles.infoLabel}>Full Name</td><td>{patient.name}</td></tr>
              <tr><td style={styles.infoLabel}>Age</td><td>{patient.age} years</td></tr>
              <tr><td style={styles.infoLabel}>Gender</td><td>{patient.gender}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ ...styles.card, flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={styles.sectionTitle}>Medical History</h3>
            {history && !isEditing && userRole === 'doctor' && (
              <button onClick={handleEditClick} style={styles.editBtn}>Edit History</button>
            )}
          </div>

          {!history ? (
            <div style={styles.emptyBox}>
              <p>No medical history recorded for this patient.</p>
              {userRole === 'doctor' && !isCreating && (
                <button onClick={() => setIsCreating(true)} style={{ ...styles.editBtn, background: '#1e3a8a', color: '#fff' }}>
                  + Create New History
                </button>
              )}
              {isCreating && (
                <div style={{ marginTop: '20px', textAlign: 'left' }}>
                  <PatientHistoryForm
                    patient={patient}
                    onSuccess={() => { setIsCreating(false); fetchPatientHistory(); }}
                    onCancel={() => setIsCreating(false)}
                  />
                </div>
              )}
            </div>
          ) : isEditing ? (
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['history', 'diagnosis', 'medication', 'allergies'].map(field => (
                <div key={field}>
                  <label style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <textarea
                    style={styles.textarea}
                    name={field}
                    value={editFormData[field]}
                    onChange={e => setEditFormData({ ...editFormData, [e.target.name]: e.target.value })}
                    rows={2}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={styles.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { label: 'Clinical History', key: 'history' },
                { label: 'Diagnosis', key: 'diagnosis' },
                { label: 'Current Medication', key: 'medication' },
              ].map(({ label, key }) => (
                <div key={key} style={styles.historyBox}>
                  <div style={styles.historyLabel}>{label}</div>
                  <div style={styles.historyValue}>
                    {Array.isArray(history[key]) ? history[key].join(', ') : history[key] || '-'}
                  </div>
                </div>
              ))}
              <div style={{ ...styles.historyBox, borderLeft: '4px solid #d32f2f' }}>
                <div style={{ ...styles.historyLabel, color: '#d32f2f' }}>Allergies</div>
                <div style={styles.historyValue}>
                  {Array.isArray(history.allergies) ? history.allergies.join(', ') : history.allergies || 'None'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispense Medication — doctor/pharmacist only */}
      {(userRole === 'doctor' || userRole === 'pharmacist') && (
        <div style={{ ...styles.card, marginTop: '24px' }}>
          <h3 style={styles.sectionTitle}>💊 Dispense Medication</h3>
          <form onSubmit={handleDispense} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '160px' }}>
              <label style={styles.label}>Medication <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                style={styles.input}
                value={dispenseForm.med_id}
                onChange={e => setDispenseForm({ ...dispenseForm, med_id: e.target.value })}
                required
              >
                <option value="">-- Select --</option>
                {medications.map(m => (
                  <option key={m.med_id} value={m.med_id}>
                    {m.name}{m.common_name ? ` (${m.common_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={styles.label}>Amount <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={styles.input}
                type="number"
                min="1"
                value={dispenseForm.amount}
                onChange={e => setDispenseForm({ ...dispenseForm, amount: e.target.value })}
                placeholder="e.g. 10"
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={styles.label}>Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={styles.input}
                type="date"
                value={dispenseForm.date}
                onChange={e => setDispenseForm({ ...dispenseForm, date: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              style={{ ...styles.saveBtn, opacity: dispensing ? 0.7 : 1, whiteSpace: 'nowrap', height: '38px' }}
              disabled={dispensing}
            >
              {dispensing ? 'Dispensing...' : 'Dispense'}
            </button>
          </form>
        </div>
      )}

      {/* Treatment History */}
      <div style={{ ...styles.card, marginTop: '24px' }}>
        <h3 style={styles.sectionTitle}>📋 Treatment History</h3>
        {treatments.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>No treatments recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Medication</th>
                <th style={styles.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...treatments].reverse().map(t => (
                <tr key={t.t_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={styles.td}>{t.date}</td>
                  <td style={styles.td}>{getMedName(t.med_id)}</td>
                  <td style={styles.td}>{t.amount} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1, minWidth: '300px' },
  backBtn: { display: 'inline-block', marginBottom: '20px', textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 'bold' },
  sectionTitle: { margin: '0 0 15px 0', color: '#334155', fontSize: '18px', fontWeight: 'bold' },
  infoTable: { width: '100%', borderCollapse: 'collapse' },
  infoLabel: { fontWeight: 'bold', color: '#64748b', padding: '8px 0', width: '40%' },
  historyBox: { background: '#f8fafc', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1e3a8a' },
  historyLabel: { fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' },
  historyValue: { fontSize: '15px', color: '#1e293b', whiteSpace: 'pre-wrap' },
  emptyBox: { padding: '30px', background: '#f1f5f9', borderRadius: '4px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  editBtn: { padding: '8px 16px', background: '#fff', color: '#1e3a8a', border: '1px solid #1e3a8a', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' },
  textarea: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '70px', fontFamily: 'inherit', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical' },
  saveBtn: { padding: '8px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  cancelBtn: { padding: '8px 20px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  notification: { padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' },
  th: { padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#475569' },
  td: { padding: '10px 12px', color: '#1e293b' },
};