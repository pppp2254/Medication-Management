import React, { useState } from 'react';
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = "http://localhost:8000/api/v1/auth/";

export default function Login() {
    const [form, setForm] = useState({ username: "", password: ""});
    const navigate = useNavigate();
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}login`, form);

            localStorage.setItem("token", res.data.access_token);
            localStorage.setItem("role", res.data.role);
            localStorage.setItem("permissions", JSON.stringify(res.data.permissions));

            navigate("/");
        } catch (err) {
            alert("Login Fail");
        }
    };

    return (
        <div style = {styles.page}>
            <div style = {styles.card}>
                <h2 style={styles.title}>Login</h2>
                <p style={styles.subtitle}>
                    Enter your username and password.<br />
                    If you do not have an account go register an account.
                </p>
                <form onSubmit={handleLogin} style={styles.form}>
                    <label style={styles.label}>Username <span style={styles.req}>*</span></label>
                    <input
                        style={styles.input}
                        name="username"
                        type="text"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="e.g. Username1"
                        required minLength={1}
                    />
                    <label style={styles.label}>Password <span style={styles.req}>*</span></label>
                    <input
                        style={styles.input}
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="e.g. P455W0RD"
                        required minLength={1}
                    />

                    <button type="submit" style={styles.btn}>Login</button>
                    <p>Don't have an account? <Link to="/auth/register">Register</Link></p>
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
