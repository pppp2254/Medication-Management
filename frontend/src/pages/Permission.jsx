import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000/api/v1/auth/";

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
        <div style={{ padding: 40 }}>
        <h2>Admin Permission Management</h2>

        {staff.map(s => (
            <div key={s.staff_id} style={{ marginBottom: 25 }}>
                <h4>Staff ID: {s.staff_id}</h4>
                <p><b>Username:</b> {s.username}</p>
                <p><b>Name:</b> {s.name}</p>
                <p><b>Role:</b> {s.sql_role}</p>
                {roles
                    .filter(role => role !== "Admin")
                    .map(role => (
                    <label key={role} style={{ marginRight: 15 }}>
                        <input
                        type="checkbox"
                        checked={s.permissions.includes(role)}
                        onChange={() =>
                            togglePermission(s.staff_id, role, s.permissions)
                        }
                        />
                        {role}
                    </label>
                    ))}
            </div>
        ))}
        </div>
    );
}