import React, { useEffect, useState } from "react";

const API = "http://localhost:8000/api/v1/staff";

export default function ViewLogs() {
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API}/logs`, {
        headers: {
        Authorization: `Bearer ${token}`
        }
    })
        .then(res => res.json())
        .then(data => setLogs(data))
        .catch(err => console.error(err));
    }, []);

  return (
    <div>
      <h2>System Logs</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Date</th>
            <th>Staff ID</th>
            <th>Action</th>
            <th>Description</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{new Date(log.date + "Z").toLocaleString()}</td>
              <td>{log.staff_id}</td>
              <td>{log.action}</td>
              <td>{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}