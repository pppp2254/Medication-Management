import React, { useState } from "react";

const API = "https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/inventory";

export default function AddMedInfo() {
  const [form, setForm] = useState({ med_id: "", guideline: "", warning: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/medinfo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}` 
         },
        body: JSON.stringify({ ...form, med_id: parseInt(form.med_id) }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: `✅ Med info saved for Med ID: ${data.med_id}` });
        setForm({ med_id: "", guideline: "", warning: "" });
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
        <h2 style={styles.title}>Add Med Info</h2>
        <p style={styles.subtitle}>Add guideline and warning info for a medication</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Medication ID <span style={styles.req}>*</span></label>
          <input style={styles.input} name="med_id" type="number" value={form.med_id} onChange={handleChange} placeholder="e.g. 1" required min="1" />

          <label style={styles.label}>Guideline</label>
          <textarea style={styles.textarea} name="guideline" value={form.guideline} onChange={handleChange} placeholder="Usage instructions, dosage, etc." rows={4} />

          <label style={styles.label}>Warning</label>
          <textarea style={{ ...styles.textarea, borderColor: "#fecaca" }} name="warning" value={form.warning} onChange={handleChange} placeholder="Side effects, contraindications, etc." rows={4} />

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Med Info"}
          </button>
        </form>

        {status && (
          <div style={{ ...styles.alert, background: status.type === "success" ? "#fef3c7" : "#fee2e2", color: status.type === "success" ? "#92400e" : "#991b1b" }}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  title: { margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: "#78350f" },
  subtitle: { margin: "0 0 28px", fontSize: "14px", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", marginTop: "10px" },
  req: { color: "#ef4444" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #fde68a", fontSize: "14px", outline: "none", background: "#f9fafb" },
  textarea: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #fde68a", fontSize: "14px", outline: "none", background: "#f9fafb", resize: "vertical", fontFamily: "inherit" },
  btn: { marginTop: "20px", padding: "12px", background: "#d97706", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  alert: { marginTop: "16px", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500" },
};