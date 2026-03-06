import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';

import AddMedication from './pages/AddMedication';
import AddStock from './pages/AddStock';
import AddMedInfo from './pages/AddMedInfo';
import ViewMedications from './pages/ViewMedications';
import DrugReport from './pages/DrugReport';
import Home from './pages/Home';
import StaffPage from './pages/Staff';
import PatientPage from './pages/Patiens';
import PatientDetailPage from './pages/PatientDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPermissionPage from './pages/Permission';

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/patients", label: "Patients" },
  { to: "/inventory/add-medication", label: "Add Medication" },
  { to: "/inventory/add-stock", label: "Add Stock" },
  { to: "/inventory/add-medinfo", label: "Add Med Info" },
  { to: "/inventory/view", label: "View Medications" },
  { to: "/inventory/report", label: "Drug Report" },
  { to: "/staff", label: "Staff" },
];

function Navbar() {
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    window.location.href = "/auth/login";
  }
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
  const isAdmin = permissions.includes("Admin");

  return (
    <nav style={styles.nav}>
      <b style={styles.logo}>🏥 Clinic App</b>
      <div style={styles.links}>
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{ ...styles.link, ...(location.pathname === l.to ? styles.activeLink : {}) }}
          >
            {l.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin/permissions"
            style={{ ...styles.link, ...(location.pathname === "/admin/permissions" ? styles.activeLink : {}) }}
          >
            Admin Panel
          </Link>
        )}
      </div>
      <button onClick={handleLogout} style={styles.btn}>Logout</button>
    </nav>
  );
}

function PublicNavbar() {
  return (
    <nav style={styles.nav}>
      <b style={styles.logo}>🏥 Clinic App</b>
      <div style={styles.links}>
        <Link to="/auth/login" style={styles.link}>Login</Link>
        <Link to="/auth/register" style={styles.link}>Register</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif' }}>
        <Routes>

          {/* 🌐 Public routes */}
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <>
                  <PublicNavbar />
                  <Login />
                </>
              </PublicRoute>
            }
          />

          <Route
            path="/auth/register"
            element={
              <PublicRoute>
                <>
                  <PublicNavbar />
                  <Register />
                </>
              </PublicRoute>
            }
          />

          {/* 🔐 Protected layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/patients" element={<PatientPage />} />
                    <Route path="/patients/:id" element={<PatientDetailPage />} />
                    <Route path="/inventory/add-medication" element={<AddMedication />} />
                    <Route path="/inventory/add-stock" element={<AddStock />} />
                    <Route path="/inventory/add-medinfo" element={<AddMedInfo />} />
                    <Route path="/inventory/view" element={<ViewMedications />} />
                    <Route path="/inventory/report" element={<DrugReport />} />
                    <Route path="/staff" element={<StaffPage />} />
                    {/* 🔐 ADMIN ONLY */}
                    <Route path="/admin/permissions" element={<AdminPermissionPage />} />
                  </Routes>
                </>
              </ProtectedRoute>
            }
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  nav: { padding: "14px 24px", background: "#e0f7fa", borderBottom: "2px solid #b2ebf2", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" },
  logo: { marginRight: "10px", fontSize: "16px" },
  links: { display: "flex", gap: "6px", flexWrap: "wrap" },
  link: { padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "500", color: "#374151" },
  activeLink: { background: "#0891b2", color: "#fff" },
  btn: { marginLeft: "auto", marginTop: "0px", padding: "12px", background: "#d90606", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" },
};

export default App;