import React, { useState, useEffect } from 'react';
import PatientForm from '../components/Patient/PatientForm';
import PatientTable from '../components/Patient/PatientTable';
import PatientHistoryForm from '../components/Patient/PatientHistForm';
import PatientSearch from '../components/Patient/PatientSearch';

export default function PatientPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null); 

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch('https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/patients/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        console.error("Unauthorized or Token expired");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2 style={{ color: '#1e3a8a', margin: 0, fontSize: '24px' }}>
          Patient Management System
        </h2>
      </div>

      <PatientForm onAddSuccess={fetchPatients} />

      <PatientSearch 
        onSearchResults={(data) => setPatients(data)} 
        onClearSearch={fetchPatients}
      />

      {selectedPatient && (
        <PatientHistoryForm 
          patient={selectedPatient} 
          onSuccess={() => setSelectedPatient(null)}
          onCancel={() => setSelectedPatient(null)}
        />
      )}

      <PatientTable 
        patients={patients} 
        onSelectForHistory={(patient) => setSelectedPatient(patient)} 
      />
    </div>
  );
}