import React, { useState } from 'react';

export default function PatientSearch({ onSearchResults, onClearSearch }) {
  const [searchMode, setSearchMode] = useState('basic'); // 'basic' หรือ 'raw'
  const [matchType, setMatchType] = useState('and');
  const [searchParams, setSearchParams] = useState({ diagnosis: '', allergy: '', med_id: '' });
  //const [rawQuery, setRawQuery] = useState('{"diagnosis": {"$regex": "flu", "$options": "i"}}');
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);

    if (searchMode === 'basic' && !searchParams.diagnosis && !searchParams.allergy && !searchParams.med_id) {
      setError("please input query");
      return;
    }
    if (searchMode === 'raw' && !rawQuery) {
      setError("input JSON Query");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');
    const query = new URLSearchParams();

    if (searchMode === 'basic') {
      if (searchParams.diagnosis) query.append('diagnosis', searchParams.diagnosis);
      if (searchParams.allergy) query.append('allergy', searchParams.allergy);
      if (searchParams.med_id) query.append('med_id', searchParams.med_id);
      query.append('match_type', matchType);
    } else {
      //query.append('raw_mongo_query', rawQuery);
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/patients/search/advanced?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        onSearchResults(data);
      } else {
        const errData = await response.json();
        setError(errData.detail || "Not found");
      }
    } catch (err) {
      setError("cannot connect server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setSearchParams({ diagnosis: '', allergy: '', med_id: '' });
    setError(null);
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/v1/patients/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        onSearchResults(data);
      }
    } catch (err) {
      setError("cannot connect server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#334155' }}>Search</h3>
        
        <div>
          {/*<button type="button" onClick={() => setSearchMode('basic')} style={searchMode === 'basic' ? activeTabStyle : inactiveTabStyle}>Basic Search</button>
          <button type="button" onClick={() => setSearchMode('raw')} style={searchMode === 'raw' ? activeTabStyle : inactiveTabStyle}>Raw Query</button>*/}
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '14px', margin: '0 0 10px 0' }}>{error}</p>}
      
      <form onSubmit={handleSearch}>
        {searchMode === 'basic' ? (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={matchType} onChange={(e) => setMatchType(e.target.value)} style={selectStyle}>
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
            
            <input name="diagnosis" placeholder="diagnosis (e.g. flu, fever)" value={searchParams.diagnosis} onChange={handleChange} style={inputStyle} />
            <input name="allergy" placeholder="allergy (e.g. penicillin, sulfa)" value={searchParams.allergy} onChange={handleChange} style={inputStyle} />
            <input name="med_id" type="text" placeholder="med_id (e.g. 1, 2, 3)" value={searchParams.med_id} onChange={handleChange} style={inputStyle} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>advance search for patient history</p>
             <textarea 
               value={rawQuery} 
               onChange={(e) => setRawQuery(e.target.value)} 
               style={{...inputStyle, minHeight: '80px', fontFamily: 'monospace'}} 
               placeholder='{"allergies": "Penicillin"}'
             />
          </div>
        )}

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={isLoading} style={searchBtnStyle}>
            {isLoading ? "searching..." : "search"}
          </button>
          <button type="button" onClick={handleClear} style={clearBtnStyle}>
            clear search
          </button>
        </div>
      </form>
    </div>
  );
}

// Styles
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: '1', minWidth: '150px', boxSizing: 'border-box' };
const selectStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' };
const searchBtnStyle = { padding: '8px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const clearBtnStyle = { padding: '8px 20px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const activeTabStyle = { padding: '6px 12px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '4px 0 0 4px', cursor: 'pointer' };
const inactiveTabStyle = { padding: '6px 12px', background: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '0 4px 4px 0', cursor: 'pointer' };