import React, { useState, useEffect, useRef } from "react";

const API = "https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/inventory";

const RANGES = [
  { label: "7 Days", value: "7d" },
  { label: "15 Days", value: "15d" },
  { label: "30 Days", value: "30d" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
  { label: "All Time", value: "all" },
];

export default function DrugReport() {
  const [range, setRange] = useState("30d");
  const [mode, setMode] = useState("quantity");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/report?range=${range}`);
      const json = await res.json();
      if (res.ok) {
        setMeta({ start: json.start_date, end: json.end_date });
        setData(json.data);
      } else {
        setError("Failed to load report");
      }
    } catch {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [range]);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const paddingLeft = 70;
    const paddingBottom = 70;
    const paddingTop = 30;
    const paddingRight = 30;

    ctx.clearRect(0, 0, W, H);

    const inValues = data.map(d => mode === "quantity" ? d.total_quantity_in : d.total_price_in);
    const outValues = data.map(d => mode === "quantity" ? d.total_quantity_out : d.total_price_out);
    const maxVal = Math.max(...inValues, ...outValues, 1);

    const chartW = W - paddingLeft - paddingRight;
    const chartH = H - paddingTop - paddingBottom;
    const groupWidth = chartW / data.length;
    const barWidth = Math.min(30, groupWidth * 0.35);
    const gap = 4;

    // Grid lines + Y labels
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = paddingTop + chartH - (i / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(W - paddingRight, y);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      const labelVal = Math.round((maxVal * i) / 5);
      ctx.fillText(mode === "price" ? `฿${labelVal.toLocaleString()}` : labelVal, paddingLeft - 8, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const inVal = mode === "quantity" ? d.total_quantity_in : d.total_price_in;
      const outVal = mode === "quantity" ? d.total_quantity_out : d.total_price_out;
      const centerX = paddingLeft + groupWidth * i + groupWidth / 2;

      // Drug In bar (blue)
      const inH = (inVal / maxVal) * chartH;
      const inX = centerX - barWidth - gap / 2;
      const inY = paddingTop + chartH - inH;
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.roundRect(inX, inY, barWidth, inH, [4, 4, 0, 0]);
      ctx.fill();
      if (inVal > 0) {
        ctx.fillStyle = "#1e40af";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(mode === "price" ? `฿${inVal.toLocaleString()}` : inVal, inX + barWidth / 2, inY - 4);
      }

      // Drug Out bar (red)
      const outH = (outVal / maxVal) * chartH;
      const outX = centerX + gap / 2;
      const outY = paddingTop + chartH - outH;
      ctx.fillStyle = outVal > 0 ? "#ef4444" : "#fecaca";
      ctx.beginPath();
      ctx.roundRect(outX, outY > 0 ? outY : paddingTop + chartH - 4, barWidth, outH > 0 ? outH : 4, [4, 4, 0, 0]);
      ctx.fill();
      if (outVal > 0) {
        ctx.fillStyle = "#991b1b";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(mode === "price" ? `฿${outVal.toLocaleString()}` : outVal, outX + barWidth / 2, outY - 4);
      }

      // X label
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      const label = d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name;
      ctx.fillText(label, centerX, H - paddingBottom + 18);
    });

    // Axes
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, paddingTop + chartH);
    ctx.lineTo(W - paddingRight, paddingTop + chartH);
    ctx.stroke();

    // Legend
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(paddingLeft, H - 20, 14, 12);
    ctx.fillStyle = "#374151";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Drug In", paddingLeft + 18, H - 10);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(paddingLeft + 90, H - 20, 14, 12);
    ctx.fillStyle = "#374151";
    ctx.fillText("Drug Out", paddingLeft + 108, H - 10);

  }, [data, mode]);

  const totalQtyIn = data.reduce((s, d) => s + d.total_quantity_in, 0);
  const totalPriceIn = data.reduce((s, d) => s + d.total_price_in, 0);
  const totalQtyOut = data.reduce((s, d) => s + d.total_quantity_out, 0);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>📊 Drug In/Out Report</h2>
        <p style={styles.subtitle}>{meta ? `${meta.start} → ${meta.end}` : "Loading..."}</p>

        {/* Time Range */}
        <div style={styles.rangeRow}>
          {RANGES.map(r => (
            <button key={r.value} style={{ ...styles.rangeBtn, ...(range === r.value ? styles.rangeBtnActive : {}) }} onClick={() => setRange(r.value)}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Mode Toggle */}
        <div style={styles.toggleRow}>
          <button style={{ ...styles.modeBtn, ...(mode === "quantity" ? styles.modeBtnActive : {}) }} onClick={() => setMode("quantity")}>📦 Quantity</button>
          <button style={{ ...styles.modeBtn, ...(mode === "price" ? styles.modeBtnActive : {}) }} onClick={() => setMode("price")}>฿ Price</button>
        </div>

        {/* Summary Cards */}
        {!loading && !error && (
          <div style={styles.cards}>
            <div style={styles.card}>
              <p style={styles.cardLabel}>Total Drug Types</p>
              <p style={styles.cardValue}>{data.length}</p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #3b82f6" }}>
              <p style={styles.cardLabel}>🔵 Total Qty In</p>
              <p style={{ ...styles.cardValue, color: "#2563eb" }}>{totalQtyIn.toLocaleString()} units</p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #3b82f6" }}>
              <p style={styles.cardLabel}>🔵 Total Value In</p>
              <p style={{ ...styles.cardValue, color: "#2563eb" }}>฿{totalPriceIn.toLocaleString()}</p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #ef4444" }}>
              <p style={styles.cardLabel}>🔴 Total Qty Out</p>
              <p style={{ ...styles.cardValue, color: "#dc2626" }}>{totalQtyOut.toLocaleString()} units</p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #ef4444" }}>
              <p style={styles.cardLabel}>🔴 Total Value Out</p>
              <p style={{ ...styles.cardValue, color: "#dc2626" }}>฿{data.reduce((s, d) => s + d.total_price_out, 0).toLocaleString()}</p>
            </div>
          </div>
        )}

        {loading && <div style={styles.center}>Loading...</div>}
        {error && <div style={styles.errorBox}>{error}</div>}
        {!loading && !error && data.length === 0 && (
          <div style={styles.center}>No data for this time range. Add some stock first!</div>
        )}

        {/* Canvas Chart */}
        {!loading && !error && data.length > 0 && (
          <div style={styles.chartBox}>
            <h3 style={styles.chartTitle}>
              {mode === "quantity" ? "Quantity In/Out by Medication" : "Value In/Out by Medication (฿)"}
              
            </h3>
            <canvas ref={canvasRef} width={860} height={380} style={{ width: "100%", height: "auto" }} />
          </div>
        )}

        {/* Table */}
        {!loading && !error && data.length > 0 && (
          <div style={styles.tableBox}>
            <h3 style={styles.chartTitle}>Detail Table</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Medication</th>
                  <th style={{ ...styles.th, textAlign: "right", color: "#2563eb" }}>🔵 Qty In</th>
                  <th style={{ ...styles.th, textAlign: "right", color: "#2563eb" }}>🔵 Value In (฿)</th>
                  <th style={{ ...styles.th, textAlign: "right", color: "#dc2626" }}>🔴 Qty Out</th>
                  <th style={{ ...styles.th, textAlign: "right", color: "#dc2626" }}>🔴 Value Out (฿)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                    <td style={styles.td}>{d.name}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#2563eb" }}>{d.total_quantity_in.toLocaleString()}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#2563eb" }}>฿{d.total_price_in.toLocaleString()}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#dc2626" }}>{d.total_quantity_out.toLocaleString()}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#dc2626" }}>฿{d.total_price_out.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f0fdf4", fontWeight: "800" }}>
                  <td style={styles.td}>Total</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#2563eb" }}>{totalQtyIn.toLocaleString()}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#2563eb" }}>฿{totalPriceIn.toLocaleString()}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#dc2626" }}>{totalQtyOut.toLocaleString()}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#dc2626" }}>฿{data.reduce((s,d) => s + d.total_price_out, 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" },
  container: { maxWidth: "900px", margin: "0 auto" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#0f172a" },
  subtitle: { margin: "0 0 20px", fontSize: "14px", color: "#64748b" },
  rangeRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" },
  rangeBtn: { padding: "7px 14px", background: "#e2e8f0", border: "none", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#475569" },
  rangeBtnActive: { background: "#2563eb", color: "#fff" },
  toggleRow: { display: "flex", gap: "8px", marginBottom: "24px" },
  modeBtn: { padding: "8px 20px", background: "#e2e8f0", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#475569" },
  modeBtnActive: { background: "#0f172a", color: "#fff" },
  cards: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" },
  card: { background: "#fff", borderRadius: "10px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", borderTop: "4px solid #e2e8f0" },
  cardLabel: { margin: "0 0 6px", fontSize: "12px", color: "#64748b", fontWeight: "600" },
  cardValue: { margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" },
  center: { textAlign: "center", padding: "60px", color: "#94a3b8" },
  errorBox: { background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" },
  chartBox: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", marginBottom: "20px" },
  chartTitle: { margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: "#374151" },
  note: { fontSize: "12px", fontWeight: "400", color: "#94a3b8" },
  tableBox: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f1f5f9" },
  th: { padding: "10px 14px", fontSize: "12px", fontWeight: "700", color: "#475569", textAlign: "left", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "10px 14px", fontSize: "13px", color: "#374151", borderBottom: "1px solid #f1f5f9" },
};