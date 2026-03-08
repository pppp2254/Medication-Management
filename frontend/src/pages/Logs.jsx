import React, { useEffect, useState } from "react";

const API = "http://localhost:8000/api/v1/staff";

export default function ViewLogs() {
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API}/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerBar}>
          <h2 style={styles.title}>📋 System Logs</h2>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.header}>Date</th>
              <th style={styles.header}>Staff ID</th>
              <th style={styles.header}>Action</th>
              <th style={styles.header}>Description</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log._id} style={styles.row}>
                <td style={styles.cell}>
                  {new Date(log.date + "Z").toLocaleString()}
                </td>

                <td style={styles.cell}>
                  <div style={styles.staffBox}>
                    {log.staff_id}
                  </div>
                </td>

                <td style={styles.cell}>
                  <div style={styles.actionBox}>
                    {log.action}
                  </div>
                </td>

                <td style={styles.cell}>{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div style={styles.empty}>No logs found</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#f4f6f9", minHeight: "100vh", padding: "40px", fontFamily: "Arial" },

  card: { background: "white", borderRadius: "10px", padding: "0", boxShadow: "0 5px 15px rgba(0,0,0,0.1)", overflow: "hidden" },

  headerBar: { width: "100%", background: "#a4b9e5", padding: "18px 24px", borderBottom: "2px solid #ddd", display: "flex", alignItems: "center" },

  title: { margin: "0", fontSize: "20px" },

  table: { width: "100%", borderCollapse: "collapse" },

  header: { textAlign: "left", padding: "14px", borderBottom: "2px solid #ddd", background: "#f8f9fb", fontWeight: "600" },

  row: { borderBottom: "1px solid #eee" },

  cell: { padding: "14px", verticalAlign: "middle" },

  staffBox: { background: "#e3f2fd", color: "#1565c0", padding: "6px 12px", borderRadius: "6px", display: "inline-block", fontWeight: "bold" },

  actionBox: { background: "#e8f5e9", color: "#2e7d32", padding: "6px 12px", borderRadius: "6px", display: "inline-block", fontWeight: "bold" },

  empty: { textAlign: "center", padding: "30px", color: "#888" }
};