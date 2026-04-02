import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/auth/";

export default function AdminPermissionPage() {
const [staff, setStaff] = useState([]);
const [roles, setRoles] = useState([]);
const token = localStorage.getItem("token");

useEffect(() => {
    fetchStaff();
    fetchRoles();
}, []);

const fetchStaff = async () => {
    const res = await axios.get(`${API}all-staff`, {
    headers: { Authorization: `Bearer ${token}` }
    });
    setStaff(res.data);
};

const fetchRoles = async () => {
    const res = await axios.get(`${API}roles`, {
    headers: { Authorization: `Bearer ${token}` }
    });
    setRoles(res.data);
};

const togglePermission = async (staff_id, role, currentPermissions) => {
    let updated;

    if (currentPermissions.includes(role)) {
    updated = currentPermissions.filter(p => p !== role);
    } else {
    updated = [...currentPermissions, role];
    }

    await axios.put(
    `${API}permissions`,
    { staff_id, permissions: updated },
    { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchStaff();
};

return (
    <div style={styles.page}>
    <div style={styles.card}>

        <div style={styles.headerBar}>
        <h2 style={styles.title}>🛠 Admin Permission Management</h2>
        </div>

        <table style={styles.table}>
        <thead>
            <tr>
            <th style={styles.header}>Staff ID</th>
            <th style={styles.header}>Username</th>
            <th style={styles.header}>Name</th>
            <th style={styles.header}>SQL Role</th>
            <th style={styles.header}>Permissions</th>
            </tr>
        </thead>

        <tbody>
            {staff.map((s) => (
            <tr key={s.staff_id} style={styles.row}>

                <td style={styles.cell}>
                <span style={styles.idBox}>{s.staff_id}</span>
                </td>

                <td style={styles.cell}>{s.username}</td>

                <td style={styles.cell}>{s.name}</td>

                <td style={styles.cell}>
                <span style={styles.roleBox}>{s.sql_role}</span>
                </td>

                <td style={styles.permissionCell}>
                {roles
                    .filter(role => role !== "Admin")
                    .map(role => (
                    <label
                        key={role}
                        style={{
                            ...styles.permissionButton,
                            ...(s.permissions.includes(role) ? styles.permissionActive : {})
                        }}
                        >
                        <input
                            type="checkbox"
                            checked={s.permissions.includes(role)}
                            onChange={() =>
                            togglePermission(s.staff_id, role, s.permissions)
                            }
                            style={styles.hiddenCheckbox}
                        />
                        {role}
                    </label>
                    ))}
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

headerBar: { width: "100%", background: "#c5db95", padding: "18px 24px", borderBottom: "2px solid #ddd", display: "flex", alignItems: "center" },

title: { margin: "0", fontSize: "20px" },

table: { width: "100%", borderCollapse: "collapse" },

header: { textAlign: "left", padding: "14px", borderBottom: "2px solid #ddd", background: "#f8f9fb", fontWeight: "600" },

row: { borderBottom: "1px solid #eee" },

cell: { padding: "14px", verticalAlign: "middle" },

idBox: { background: "#e3f2fd", color: "#1565c0", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", display: "inline-block" },

roleBox: { background: "#ede7f6", color: "#5e35b1", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", display: "inline-block" },

permissionItem: { marginRight: "12px", display: "inline-flex", alignItems: "center", marginBottom: "6px" },

permissionLabel: { marginLeft: "6px", background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold" },

permissionCell: { padding: "14px", verticalAlign: "middle", display: "flex", flexWrap: "wrap", gap: "8px" },

permissionButton: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer", background: "#f5f5f5", fontWeight: "bold", userSelect: "none" },

permissionActive: { background: "#4caf50", color: "white", border: "1px solid #4caf50" },

hiddenCheckbox: { display: "none" },
};