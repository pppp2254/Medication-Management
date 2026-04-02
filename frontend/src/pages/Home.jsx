import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API = "https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/inventory";

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
    <div style={styles.statIcon}>{icon}</div>
    <p style={styles.statLabel}>{label}</p>
    <p style={{ ...styles.statValue, color }}>{value}</p>
    {sub && <p style={styles.statSub}>{sub}</p>}
  </div>
);

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/dashboard`);
      const json = await res.json();
      if (res.ok) setData(json);
      else setError("Failed to load dashboard");
    } catch {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <div style={styles.center}>Loading dashboard...</div>;
  if (error) return <div style={styles.errorBox}>{error}</div>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>🏥 Clinic Dashboard</h2>
            <p style={styles.subtitle}>Medication & Inventory Overview</p>
          </div>
          <button style={styles.refreshBtn} onClick={fetchDashboard}>↻ Refresh</button>
        </div>

        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          <StatCard icon="💊" label="Total Medications" value={data.total_medications} color="#2563eb" />
          <StatCard icon="📦" label="Total Stock Units" value={data.total_stock_units.toLocaleString()} color="#16a34a" />
          <StatCard icon="฿" label="Inventory Value" value={`฿${data.total_inventory_value.toLocaleString()}`} color="#0891b2" />
          <StatCard icon="🔴" label="Expired Entries" value={data.expired_entries} color="#dc2626" sub="Need removal" />
          <StatCard icon="🟡" label="Expiring Soon" value={data.expiring_soon} color="#d97706" sub="Within 30 days" />
          <StatCard icon="⚠️" label="Out of Stock" value={data.out_of_stock_entries} color="#7c3aed" sub="Zero quantity entries" />
        </div>

        <div style={styles.rowTwo}>

          {/* Recent Stock In */}
          <div style={styles.box}>
            <div style={styles.boxHeader}>
              <h3 style={styles.boxTitle}>📥 Recent Stock In</h3>
              <span style={styles.boxSub}>Last 7 days</span>
            </div>
            {data.recent_stock_in.length === 0 ? (
              <p style={styles.noData}>No recent stock added</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Medication</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Qty</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_stock_in.slice(0, 8).map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                      <td style={styles.td}>{r.name}</td>
                      <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#16a34a" }}>{r.quantity}</td>
                      <td style={{ ...styles.td, textAlign: "right", color: "#64748b" }}>{r.in_day}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Low Stock Warning */}
          <div style={styles.box}>
            <div style={styles.boxHeader}>
              <h3 style={styles.boxTitle}>⚠️ Low Stock Alert</h3>
              <span style={styles.boxSub}>Less than 10 units</span>
            </div>
            {data.low_stock_medications.length === 0 ? (
              <p style={{ ...styles.noData, color: "#16a34a" }}>✅ All medications have sufficient stock!</p>
            ) : (
              data.low_stock_medications.map((m, i) => (
                <div key={i} style={styles.alertRow}>
                  <span style={styles.alertName}>{m.name}</span>
                  <span style={{ ...styles.alertQty, background: m.total_qty === 0 ? "#fee2e2" : "#fef3c7", color: m.total_qty === 0 ? "#dc2626" : "#d97706" }}>
                    {m.total_qty} units left
                  </span>
                </div>
              ))
            )}

            {/* Quick Actions */}
            <div style={styles.quickActions}>
              <h3 style={{ ...styles.boxTitle, marginBottom: "12px" }}>⚡ Quick Actions</h3>
              <div style={styles.actionBtns}>
                <Link to="/inventory/add-medication" style={styles.actionBtn("#dcfce7", "#166534")}>➕ Add Medication</Link>
                <Link to="/inventory/add-stock" style={styles.actionBtn("#dbeafe", "#1e40af")}>📦 Add Stock</Link>
                <Link to="/inventory/add-medinfo" style={styles.actionBtn("#fef3c7", "#92400e")}>📋 Add Med Info</Link>
                <Link to="/inventory/view" style={styles.actionBtn("#f3e8ff", "#6b21a8")}>👁 View All Meds</Link>
                <Link to="/inventory/report" style={styles.actionBtn("#f0fdf4", "#166534")}>📊 Drug Report</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" },
  container: { maxWidth: "960px", margin: "0 auto" },
  center: { textAlign: "center", padding: "80px", fontSize: "16px", color: "#94a3b8" },
  errorBox: { background: "#fee2e2", color: "#991b1b", padding: "16px", borderRadius: "8px", margin: "32px auto", maxWidth: "600px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "14px", color: "#64748b" },
  refreshBtn: { padding: "8px 16px", background: "#e2e8f0", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" },
  statCard: { background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  statIcon: { fontSize: "22px", marginBottom: "8px" },
  statLabel: { margin: "0 0 4px", fontSize: "12px", color: "#64748b", fontWeight: "600" },
  statValue: { margin: "0 0 2px", fontSize: "26px", fontWeight: "800" },
  statSub: { margin: 0, fontSize: "11px", color: "#94a3b8" },
  rowTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  box: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  boxHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  boxTitle: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  boxSub: { fontSize: "11px", color: "#94a3b8" },
  noData: { fontSize: "13px", color: "#94a3b8", fontStyle: "italic", padding: "12px 0" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f8fafc" },
  th: { padding: "8px 10px", fontSize: "11px", fontWeight: "700", color: "#64748b", textAlign: "left", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "8px 10px", fontSize: "13px", color: "#374151", borderBottom: "1px solid #f8fafc" },
  alertRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8fafc" },
  alertName: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  alertQty: { fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px" },
  quickActions: { marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" },
  actionBtns: { display: "flex", flexWrap: "wrap", gap: "8px" },
  actionBtn: (bg, color) => ({ padding: "7px 14px", background: bg, color, borderRadius: "8px", textDecoration: "none", fontSize: "12px", fontWeight: "700" }),
};
