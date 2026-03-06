import { Navigate } from "react-router-dom";
import React from "react";

export default function ProtectedRoute({ children, requiredRole }) {
    const token = localStorage.getItem("token");
    const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");

    if (!token) {
        return <Navigate to="/auth/login" />;
    }

    if (requiredRole && !permissions.includes(requiredRole)) {
        return <h1>Access Denied</h1>;
    }

    return children;
}