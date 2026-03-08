import React, { useState } from "react";

const API = "http://localhost:8000/api/v1/inventory";

export default function AddStock() {
  const [form, setForm] = useState({ med_id: "", in_day: "", exp_day: "", quantity: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);

    if (e.target.name === "exp_day") setStatus(null);
  };

  const getExpireStatus = (expDay) => {
    if (!expDay) return null;
    const exp = new Date(expDay);
    exp.setHours(0, 0, 0, 0);
    const diffMs = exp - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expired";
    if (diffDays <= 30) return "soon";
    return "ok";
  };

  const expireStatus = getExpireStatus(form.exp_day);
  const token = localStorage.getItem("token");
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block if expired
    if (expireStatus === "expired") {
      setStatus({ type: "error", msg: "❌ Cannot add stock: Expiry date has already passed." });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}` 
         },
        body: JSON.stringify({ ...form, med_id: parseInt(form.med_id), quantity: parseInt(form.quantity) }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: `✅ Stock added! Inventory ID: ${data.inv_id}` });
        setForm({ med_id: "", in_day: "", exp_day: "", quantity: "" });
      } else {
        setStatus({ type: "error", msg: `❌ Error: ${data.detail}` });
      }
    } catch {
      setStatus({ type: "error", msg: "❌ Cannot connect to server" });
    }
    setLoading(false);
  };

  const expInputStyle = () => {
    if (expireStatus === "expired") return { ...styles.input, borderColor: "#ef4444", background: "#fff1f2" };
    if (expireStatus === "soon") return { ...styles.input, borderColor: "#f59e0b", background: "#fffbeb" };
    return styles.input;
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Add Stock</h2>
        <p style={styles.subtitle}>Add inventory stock for an existing medication</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Medication ID <span style={styles.req}>*</span></label>
          <input
            style={styles.input}
            name="med_id"
            type="number"
            value={form.med_id}
            onChange={handleChange}
            placeholder="e.g. 1"
            required min="1"
          />

          <label style={styles.label}>Date In <span style={styles.req}>*</span></label>
          <input
            style={styles.input}
            name="in_day"
            type="date"
            value={form.in_day}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>Expiry Date <span style={styles.req}>*</span></label>
          <input
            style={expInputStyle()}
            name="exp_day"
            type="date"
            value={form.exp_day}
            onChange={handleChange}
            required
          />
          {expireStatus === "expired" && (
            <span style={styles.expireWarn}>🔴 This date has already expired — stock cannot be added.</span>
          )}
          {expireStatus === "soon" && (
            <span style={styles.expireSoon}>🟡 This stock will expire within 30 days.</span>
          )}

          <label style={styles.label}>Quantity <span style={styles.req}>*</span></label>
          <input
            style={styles.input}
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            placeholder="e.g. 100"
            required min="1"
          />

          <button
            style={{ ...styles.btn, opacity: (loading || expireStatus === "expired") ? 0.5 : 1, cursor: expireStatus === "expired" ? "not-allowed" : "pointer" }}
            type="submit"
            disabled={loading || expireStatus === "expired"}
          >
            {loading ? "Saving..." : "Add Stock"}
          </button>
        </form>

        {status && (
          <div style={{ ...styles.alert, background: status.type === "success" ? "#dbeafe" : "#fee2e2", color: status.type === "success" ? "#1e40af" : "#991b1b" }}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", position: "relative" },
  title: { margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: "#1e3a8a" },
  subtitle: { margin: "0 0 28px", fontSize: "14px", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", marginTop: "10px" },
  req: { color: "#ef4444" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #dbeafe", fontSize: "14px", outline: "none", background: "#f9fafb", transition: "border 0.2s, background 0.2s" },
  expireWarn: { fontSize: "12px", color: "#dc2626", fontWeight: "600", marginTop: "2px" },
  expireSoon: { fontSize: "12px", color: "#d97706", fontWeight: "600", marginTop: "2px" },
  btn: { marginTop: "20px", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "opacity 0.2s" },
  alert: { marginTop: "16px", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500" },
};