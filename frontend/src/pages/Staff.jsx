import React, { useState, useEffect } from "react";

const API = "https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/staff";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetch(`${API}/staffs`)
      .then(res => res.json())
      .then(data => setStaff(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.headerBar}>
          <h2 style={styles.title}>👨‍⚕️ Staff List</h2>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.header}>ID</th>
              <th style={styles.header}>Username</th>
              <th style={styles.header}>Name</th>
              <th style={styles.header}>Role</th>
              <th style={styles.header}>Permissions</th>
            </tr>
          </thead>

          <tbody>
            {staff.map((person) => (
              <tr key={person.staff_id} style={styles.row}>

                <td style={styles.cell}>
                  <span style={styles.idBox}>{person.staff_id}</span>
                </td>

                <td style={styles.cell}>{person.username}</td>

                <td style={styles.cell}>{person.name}</td>

                <td style={styles.cell}>
                  <span style={styles.roleBox}>{person.role}</span>
                </td>

                <td style={styles.cell}>
                  {person.permission.length > 0 ? (
                    person.permission.map((perm, index) => (
                      <span key={index} style={styles.permissionBox}>
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span style={styles.noPerm}>No Permission</span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

const styles = {

  page: { background: "#f4f6f9", minHeight: "100vh", padding: "40px", fontFamily: "Arial" },

  card: { background: "white", borderRadius: "10px", padding: "0", boxShadow: "0 5px 15px rgba(0,0,0,0.1)", overflow: "hidden" },

  headerBar: { width: "100%", background: "#9ec2a4", padding: "18px 24px", borderBottom: "2px solid #ddd", display: "flex", alignItems: "center" },

  title: { margin: "0", fontSize: "20px" },

  table: { width: "100%", borderCollapse: "collapse" },

  header: { textAlign: "left", padding: "14px", borderBottom: "2px solid #ddd", background: "#f8f9fb", fontWeight: "600" },

  row: { borderBottom: "1px solid #eee" },

  cell: { padding: "14px", verticalAlign: "middle" },

  idBox: { background: "#e3f2fd", color: "#1565c0", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", display: "inline-block" },

  roleBox: { background: "#ede7f6", color: "#5e35b1", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", display: "inline-block" },

  permissionBox: { background: "#e8f5e9", color: "#2e7d32", padding: "5px 10px", borderRadius: "6px", fontWeight: "bold", marginRight: "6px", display: "inline-block", marginBottom: "4px" },

  noPerm: { color: "#888", fontStyle: "italic" }

};