"use client";

import React, { useState, useEffect } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

interface User {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "DRIVER" | "RESTAURANT" | "ADMIN";
  verified: boolean;
  phone?: string | null;
  createdAt: string;
}

const roleClassName = (role: User["role"]) =>
  role === "ADMIN"
    ? "bg-purple-500/15 text-purple-400"
    : role === "RESTAURANT"
    ? "bg-amber-500/15 text-amber-400"
    : role === "DRIVER"
    ? "bg-blue-500/15 text-blue-400"
    : "bg-zinc-500/15 text-zinc-400";

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState("ALL"); // ALL | CUSTOMER | DRIVER | RESTAURANT | ADMIN
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/admin/users"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch users.");
      const data = await res.json();
      setUsers(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch users."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchUsers, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleVerify = async (id: number) => {
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl(`/api/admin/users/${id}/verify`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to toggle verification.");
      fetchUsers();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to toggle verification."));
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole === "ALL") return true;
    return u.role === filterRole;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-5 shadow-xl animate-fade-in">
      <div className="flex flex-col gap-4 mb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">Registered Users Directory</h3>
          <p className="text-xs text-zinc-400 mt-1">Audit verification state and manage registration access</p>
        </div>

        <div className="flex w-full gap-1.5 overflow-x-auto rounded-lg bg-zinc-800/80 p-1 lg:w-auto">
          {["ALL", "CUSTOMER", "DRIVER", "RESTAURANT", "ADMIN"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`shrink-0 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterRole === r
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">! {error}</p>}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No users found in this role.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((u) => (
              <article key={u.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-500">#{u.id}</p>
                    <h4 className="mt-1 truncate font-bold text-white">{u.name}</h4>
                    <p className="mt-1 break-all text-xs text-zinc-500">{u.email}</p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-1 text-[11px] font-bold ${roleClassName(u.role)}`}>
                    {u.role}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-zinc-900 p-2">
                    <span className="block text-zinc-500">Phone</span>
                    <span className="mt-1 block truncate font-semibold text-zinc-200">{u.phone || "Not set"}</span>
                  </div>
                  <div className="rounded-md bg-zinc-900 p-2">
                    <span className="block text-zinc-500">Joined</span>
                    <span className="mt-1 block font-semibold text-zinc-200">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="rounded-md bg-zinc-900 p-2">
                    <span className="block text-zinc-500">Verified</span>
                    <span className={`mt-1 block font-semibold ${u.verified ? "text-emerald-400" : "text-red-400"}`}>
                      {u.verified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                  <div className="rounded-md bg-zinc-900 p-2">
                    <span className="block text-zinc-500">Action</span>
                    {u.role !== "ADMIN" ? (
                      <button onClick={() => handleToggleVerify(u.id)} className={`mt-1 text-left text-xs font-bold ${u.verified ? "text-red-400" : "text-emerald-400"}`}>
                        {u.verified ? "Deactivate" : "Approve"}
                      </button>
                    ) : (
                      <span className="mt-1 block font-semibold text-zinc-600">Restricted</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3 pl-4">ID</th>
                  <th className="pb-3">User Profile</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Phone</th>
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
                      <div className="min-w-0">
                        <p className="font-bold text-white leading-tight truncate">{u.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${roleClassName(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-zinc-400">{u.phone || "Not set"}</td>
                    <td className="py-4 text-zinc-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-4">
                      <span className="flex items-center">
                        <span className={`h-2 w-2 rounded-full mr-2 ${u.verified ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className={`font-semibold ${u.verified ? "text-emerald-400" : "text-red-400"}`}>
                          {u.verified ? "Verified" : "Unverified"}
                        </span>
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      {u.role !== "ADMIN" ? (
                        <button
                          onClick={() => handleToggleVerify(u.id)}
                          className={`px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            u.verified
                              ? "border-red-950 text-red-400 hover:bg-red-950/20"
                              : "border-emerald-950 text-emerald-400 hover:bg-emerald-950/20"
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
        </>
      )}
    </div>
  );
}
