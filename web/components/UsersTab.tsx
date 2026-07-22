"use client";

import React, { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "DRIVER" | "RESTAURANT" | "ADMIN";
  verified: boolean;
  createdAt: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState("ALL"); // ALL | CUSTOMER | DRIVER | RESTAURANT | ADMIN
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("https://quickbite-backend-x63n.onrender.com/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch users.");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleVerify = async (id: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`https://quickbite-backend-x63n.onrender.com/api/admin/users/${id}/verify`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to toggle verification.");
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole === "ALL") return true;
    return u.role === filterRole;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Registered Users Directory</h3>
          <p className="text-xs text-zinc-400 mt-1">Audit verification state and manage registration access</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-800/80 p-1 rounded-xl self-start sm:self-auto">
          {["ALL", "CUSTOMER", "DRIVER", "RESTAURANT", "ADMIN"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterRole === r
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {r === "ALL" ? "All Users" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No users found in this role.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <th className="pb-3 pl-4">ID</th>
                <th className="pb-3">User Profile</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Joined Date</th>
                <th className="pb-3">Verified</th>
                <th className="pb-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-zinc-800/20 transition-all">
                  <td className="py-4 pl-4 font-bold text-zinc-500">#{u.id}</td>
                  <td className="py-4">
                    <div>
                      <p className="font-bold text-white leading-tight">{u.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{u.email}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        u.role === "ADMIN"
                          ? "bg-purple-500/15 text-purple-400"
                          : u.role === "RESTAURANT"
                          ? "bg-amber-500/15 text-amber-400"
                          : u.role === "DRIVER"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 text-zinc-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="py-4">
                    <span className="flex items-center">
                      <span
                        className={`h-2 w-2 rounded-full mr-2 ${
                          u.verified ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span className={`font-semibold ${u.verified ? "text-emerald-400" : "text-red-400"}`}>
                        {u.verified ? "Verified" : "Unverified"}
                      </span>
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4">
                    {u.role !== "ADMIN" ? (
                      <button
                        onClick={() => handleToggleVerify(u.id)}
                        className={`px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                          u.verified
                            ? "border-red-950 text-red-400 hover:bg-red-650/10"
                            : "border-emerald-950 text-emerald-400 hover:bg-emerald-650/10"
                        }`}
                      >
                        {u.verified ? "Deactivate" : "Approve Account"}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600 font-medium">Restricted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
