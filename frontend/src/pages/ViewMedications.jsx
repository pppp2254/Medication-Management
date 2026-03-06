import React, { useState, useEffect } from "react";

const API = "http://localhost:8000/api/v1/inventory";

const today = new Date();
const isExpired = (exp) => new Date(exp) < today;
const isExpiringSoon = (exp) => {
  const d = new Date(exp);
  const diff = (d - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
};

export default function ViewMedications() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/view`);
      const data = await res.json();
      if (res.ok) setMeds(data);
      else setError("Failed to load medications");
    } catch {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  useEffect(() => { fetchMeds(); }, []);

  const totalStock = (stocks) => stocks.reduce((sum, s) => sum + s.quantity, 0);
  const hasExpired = (stocks) => stocks.some(s => isExpired(s.exp_day));

  const handleConfirm = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      let url = "";
      if (confirm.type === "single") url = `${API}/stock/${confirm.inv_id}`;
      else if (confirm.type === "empty") url = `${API}/stock/empty/all`;
      else if (confirm.type === "expired") url = `${API}/stock/expired/all`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) { setConfirm(null); await fetchMeds(); }
    } catch { alert("Delete failed"); }
    setDeleting(false);
  };

  return (
    <div style={styles.page}>

      {/* Confirm Dialog */}
      {confirm && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>⚠️ Confirm Delete</h3>
            <p style={styles.dialogMsg}>{confirm.label}</p>
            <div style={styles.dialogBtns}>
              <button style={styles.cancelBtn} onClick={() => setConfirm(null)} disabled={deleting}>Cancel</button>
              <button style={styles.confirmBtn} onClick={handleConfirm} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Medication Overview</h2>
          <p style={styles.subtitle}>All medications with stock and info</p>
          <div style={styles.legend}>
            <span>🔴 Expired</span>
            <span>🟡 Expires within 30 days</span>
            <span>🟢 In stock (valid)</span>
          </div>
        </div>
        <div style={styles.headerBtns}>
          <button style={styles.refreshBtn} onClick={fetchMeds}>↻ Refresh</button>
          <button style={styles.deleteEmptyBtn} onClick={() => setConfirm({ type: "empty", label: "Remove all stock entries with 0 quantity?" })}>
            🗑 Remove All Empty Stock
          </button>
          <button style={styles.deleteExpiredBtn} onClick={() => setConfirm({ type: "expired", label: "Remove all expired stock entries?" })}>
            🗑 Remove All Expired
          </button>
        </div>
      </div>

      {loading && <div style={styles.center}>Loading...</div>}
      {error && <div style={styles.errorBox}>{error}</div>}
      {!loading && !error && meds.length === 0 && (
        <div style={styles.center}>No medications found. Add some first!</div>
      )}

      <div style={styles.grid}>
        {meds.map((med) => (
          <div key={med.med_id} style={{ ...styles.card, borderColor: hasExpired(med.stock) ? "#fca5a5" : "#e2e8f0" }}>
            <div style={styles.cardHeader}>
              <div>
                <span style={styles.medId}>ID: {med.med_id}</span>
                <h3 style={styles.medName}>{med.name}</h3>
                {med.common_name && <p style={styles.commonName}>"{med.common_name}"</p>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={styles.price}>฿{med.price.toLocaleString()}</div>
                {hasExpired(med.stock) && <div style={styles.expiredTag}>HAS EXPIRED STOCK</div>}
              </div>
            </div>

            <div style={styles.stockRow}>
              <span style={styles.stockLabel}>Total Stock</span>
              <span style={{ ...styles.stockBadge, background: totalStock(med.stock) > 0 ? "#dcfce7" : "#fee2e2", color: totalStock(med.stock) > 0 ? "#166534" : "#991b1b" }}>
                {totalStock(med.stock)} units
              </span>
            </div>

            <button style={styles.toggleBtn} onClick={() => setExpanded(expanded === med.med_id ? null : med.med_id)}>
              {expanded === med.med_id ? "▲ Hide Details" : "▼ Show Details"}
            </button>

            {expanded === med.med_id && (
              <div style={styles.details}>
                <p style={styles.detailTitle}>📦 Stock Entries</p>
                {med.stock.length === 0 ? (
                  <p style={styles.noData}>No stock entries</p>
                ) : (
                  med.stock.map((s) => {
                    const expired = isExpired(s.exp_day);
                    const soon = isExpiringSoon(s.exp_day);
                    return (
                      <div key={s.inv_id} style={{ ...styles.stockEntry, background: expired ? "#fff1f2" : soon ? "#fffbeb" : "#f8fafc", border: `1px solid ${expired ? "#fca5a5" : soon ? "#fcd34d" : "#e2e8f0"}` }}>
                        <div style={styles.stockInfo}>
                          <span>Qty: <b>{s.quantity}</b></span>
                          <span>In: {s.in_day}</span>
                          <span style={{ color: expired ? "#dc2626" : soon ? "#d97706" : "#374151" }}>
                            Exp: {s.exp_day}
                            {expired && <b style={{ marginLeft: 6, color: "#dc2626" }}>● EXPIRED</b>}
                            {!expired && soon && <b style={{ marginLeft: 6, color: "#d97706" }}>● SOON</b>}
                            {!expired && !soon && <b style={{ marginLeft: 6, color: "#16a34a" }}>● OK</b>}
                          </span>
                        </div>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => setConfirm({ type: "single", inv_id: s.inv_id, label: `Delete stock entry (Qty: ${s.quantity}, Exp: ${s.exp_day})?` })}
                        >🗑</button>
                      </div>
                    );
                  })
                )}

                <p style={{ ...styles.detailTitle, marginTop: "14px" }}>📋 Med Info</p>
                {!med.med_info.guideline && !med.med_info.warning ? (
                  <p style={styles.noData}>No info available</p>
                ) : (
                  <div style={styles.infoBox}>
                    {med.med_info.guideline && (
                      <div>
                        <span style={styles.infoLabel}>Guideline</span>
                        <p style={styles.infoText}>{med.med_info.guideline}</p>
                      </div>
                    )}
                    {med.med_info.warning && (
                      <div style={{ marginTop: "8px" }}>
                        <span style={{ ...styles.infoLabel, color: "#dc2626" }}>⚠ Warning</span>
                        <p style={{ ...styles.infoText, color: "#dc2626" }}>{med.med_info.warning}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  dialog: { background: "#fff", borderRadius: "14px", padding: "28px", width: "360px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" },
  dialogTitle: { margin: "0 0 10px", fontSize: "18px", fontWeight: "800", color: "#0f172a" },
  dialogMsg: { margin: "0 0 20px", fontSize: "14px", color: "#475569" },
  dialogBtns: { display: "flex", gap: "10px", justifyContent: "flex-end" },
  cancelBtn: { padding: "8px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  confirmBtn: { padding: "8px 18px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: "900px", margin: "0 auto 28px", flexWrap: "wrap", gap: "12px" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#0f172a" },
  subtitle: { margin: "0 0 8px", fontSize: "14px", color: "#64748b" },
  legend: { display: "flex", gap: "14px", fontSize: "12px", color: "#64748b" },
  headerBtns: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-start" },
  refreshBtn: { padding: "8px 14px", background: "#e2e8f0", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  deleteEmptyBtn: { padding: "8px 14px", background: "#fef3c7", color: "#92400e", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  deleteExpiredBtn: { padding: "8px 14px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  center: { textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "16px" },
  errorBox: { background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", maxWidth: "900px", margin: "0 auto 20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px", maxWidth: "900px", margin: "0 auto" },
  card: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #e2e8f0" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
  medId: { fontSize: "11px", color: "#94a3b8", fontWeight: "600", letterSpacing: "0.05em" },
  medName: { margin: "2px 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" },
  commonName: { margin: "2px 0 0", fontSize: "13px", color: "#64748b", fontStyle: "italic" },
  price: { fontSize: "18px", fontWeight: "800", color: "#16a34a" },
  expiredTag: { fontSize: "10px", fontWeight: "700", color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: "10px", marginTop: "4px" },
  stockRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  stockLabel: { fontSize: "13px", color: "#64748b" },
  stockBadge: { fontSize: "13px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px" },
  toggleBtn: { width: "100%", padding: "8px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#475569" },
  details: { marginTop: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" },
  detailTitle: { margin: "0 0 8px", fontSize: "13px", fontWeight: "700", color: "#374151" },
  noData: { fontSize: "13px", color: "#94a3b8", fontStyle: "italic" },
  stockEntry: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "8px 10px", borderRadius: "6px", marginBottom: "6px" },
  stockInfo: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" },
  deleteBtn: { background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "14px", flexShrink: 0 },
  infoBox: { background: "#f8fafc", borderRadius: "8px", padding: "12px" },
  infoLabel: { fontSize: "11px", fontWeight: "700", color: "#16a34a", letterSpacing: "0.05em", textTransform: "uppercase" },
  infoText: { margin: "4px 0 0", fontSize: "13px", color: "#374151", lineHeight: "1.5" },
};