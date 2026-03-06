import React, { useState, useEffect } from 'react';
import TreatmentList from './TreatmentList';
import AddTreatmentForm from './AddTreatmentForm';

export default function TreatmentSection({ patient }) {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTreatments = async () => {
    if (!patient || !patient.p_id) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:8000/api/v1/patients/${patient.p_id}/treatments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTreatments(data);
      }
    } catch (error) {
      console.error("Error fetching treatments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.p_id) {
      fetchTreatments();
    }
  }, [patient]);

  const handleAddTreatment = async (treatmentData) => {
    if (!patient || !patient.p_id) {
      alert("Patient data not found. Cannot add treatment.");
      return;
    }
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:8000/api/v1/patients/${patient.p_id}/treatments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(treatmentData),
      });

      if (response.ok) {
        fetchTreatments();
      } else {
        alert("Failed to save treatment record. Please verify the Medication ID.");
      }
    } catch (error) {
      console.error("Error adding treatment:", error);
    }
  };

  return (
    <div style={styles.sectionContainer}>
      <h2 style={styles.sectionTitle}>Treatment Records</h2>
      <AddTreatmentForm onAddTreatment={handleAddTreatment} />
      {loading ? (
        <div style={styles.loadingText}>Loading treatments...</div>
      ) : (
        <TreatmentList treatments={treatments} />
      )}
    </div>
  );
}

const styles = {
  sectionContainer: { 
    marginTop: '30px', 
    padding: '25px', 
    background: '#ffffff', 
    borderRadius: '8px', 
    border: '1px solid #cbd5e1', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
  },
  sectionTitle: { 
    margin: '0 0 20px 0', 
    color: '#1e3a8a', 
    fontSize: '20px', 
    fontWeight: 'bold', 
    borderBottom: '2px solid #e2e8f0', 
    paddingBottom: '10px' 
  },
  loadingText: { 
    color: '#64748b', 
    textAlign: 'center', 
    padding: '20px' 
  }
};