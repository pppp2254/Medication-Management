import React, { useState } from "react";

const API = "https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/inventory";

export default function AddMedication() {
  const [form, setForm] = useState({ name: "", common_name: "", price: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const token = localStorage.getItem("token");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/medication`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...form, price: parseInt(form.price) }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: `✅ Added "${data.name}" with ID: ${data.med_id}` });
        setForm({ name: "", common_name: "", price: "" });
      } else {
        setStatus({ type: "error", msg: `❌ Error: ${data.detail}` });
      }
    } catch {
      setStatus({ type: "error", msg: "❌ Cannot connect to server" });
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Add Medication</h2>
        <p style={styles.subtitle}>Register a new medication to the database</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Medication Name <span style={styles.req}>*</span></label>
          <input style={styles.input} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Amoxicillin" required />

          <label style={styles.label}>Common Name</label>
          <input style={styles.input} name="common_name" value={form.common_name} onChange={handleChange} placeholder="e.g. Amoxy" />

          <label style={styles.label}>Price (THB) <span style={styles.req}>*</span></label>
          <input style={styles.input} name="price" type="number" value={form.price} onChange={handleChange} placeholder="e.g. 150" required min="0" />

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add Medication"}
          </button>
        </form>

        {status && (
          <div style={{ ...styles.alert, background: status.type === "success" ? "#d1fae5" : "#fee2e2", color: status.type === "success" ? "#065f46" : "#991b1b" }}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  title: { margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: "#14532d" },
  subtitle: { margin: "0 0 28px", fontSize: "14px", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", marginTop: "10px" },
  req: { color: "#ef4444" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d1fae5", fontSize: "14px", outline: "none", background: "#f9fafb" },
  btn: { marginTop: "20px", padding: "12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  alert: { marginTop: "16px", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500" },
};