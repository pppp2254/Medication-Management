import React, { useState, useEffect } from "react";

const API = "http://localhost:8000/api/v1/staff";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/staff/")
      .then(res => res.json())
      .then(data => setStaff(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Staff List</h2>

      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Name</th>
            <th>Role</th>
            <th>Permissions</th>
          </tr>
        </thead>

        <tbody>
          {staff.map((person) => (
            <tr key={person.staff_id}>
              <td>{person.staff_id}</td>
              <td>{person.username}</td>
              <td>{person.name}</td>
              <td>{person.role}</td>

              {/* 🔥 Permission List */}
              <td>
                {person.permission.length > 0 ? (
                  person.permission.map((perm, index) => (
                    <span key={index}>
                      {perm}
                      {index < person.permission.length - 1 && ", "}
                    </span>
                  ))
                ) : (
                  "No Permission"
                )}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}