import React, { useState } from 'react';
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = "https://clinic-backend-515936152744.asia-southeast1.run.app/api/v1/auth/";

export default function Register() {
    const [form, setForm] = useState({ username: "", password: "", name: "", role: ""});
    const navigate = useNavigate();
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post( `${API}register`, form);
            navigate("/auth/login");
        }
        catch(err) {
            const msg = err.response?.data?.detail;

            if(msg == "USERNAME_TAKEN"){
                alert("Username has already been taken.")
            }
            else if(msg == "DB_ERROR"){
                alert("Database Error.")
            }
            else{
            alert("Something went wrong :(")
            }
        }
    };

    return (
        <div style = {styles.page}>
            <div style = {styles.card}>
                <h2 style={styles.title}>Register</h2>
                <p style={styles.subtitle}>
                    Enter your username, password, name and role.
                </p>
                <form onSubmit={handleRegister} style={styles.form}>
                    <label style={styles.label}>Username<span style={styles.req}>*</span></label>
                    <input
                        style={styles.input}
                        name="username"
                        type="text"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="e.g. Username1"
                        required minLength={1}
                    />
                    <label style={styles.label}>Password<span style={styles.req}>*</span></label>
                    <input
                        style={styles.input}
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="e.g. P455W0RD"
                        required minLength={1}
                        maxLength={72}
                    />
                    <label style={styles.label}>Name<span style={styles.req}>*</span></label>
                    <input
                        style={styles.input}
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Haru Urara"
                        required minLength={1}
                    />
                    <label style={styles.label}>Role<span style={styles.req}>*</span></label>
                    <input
                        style={styles.input}
                        name="role"
                        type="text"
                        value={form.role}
                        onChange={handleChange}
                        placeholder="e.g. Pharmacist"
                        required minLength={1}
                    />

                    <button type="submit" style={styles.btn}>Register</button>
                </form>
            </div>
        </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#cccae3", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", position: "relative" },
  tag: { position: "absolute", top: "20px", right: "20px", background: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.05em" },
  title: { margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: "#000000" },
  subtitle: { margin: "0 0 28px", fontSize: "14px", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", marginTop: "10px" },
  req: { color: "#ef4444" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #fde68a", fontSize: "14px", outline: "none", background: "#f9fafb" },
  textarea: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #fde68a", fontSize: "14px", outline: "none", background: "#f9fafb", resize: "vertical", fontFamily: "inherit" },
  btn: { marginTop: "20px", padding: "12px", background: "#d97706", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  alert: { marginTop: "16px", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500" },
};
