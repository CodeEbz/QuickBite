"use client";

import React, { useState, useEffect } from "react";
import { getAdminToken } from "../lib/authStorage";

interface Restaurant {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  rating: number;
  cuisineType: string;
  image: string;
}

export default function RestaurantsTab() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | PENDING
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch("https://quickbite-backend-x63n.onrender.com/api/admin/restaurants", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch restaurants.");
      const data = await res.json();
      setRestaurants(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const token = getAdminToken();
      const res = await fetch(`https://quickbite-backend-x63n.onrender.com/api/admin/restaurants/${id}/status?status=${newStatus}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to update status.");
      fetchRestaurants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredRestaurants = restaurants.filter((res) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return res.status === "ACTIVE";
    if (filter === "PENDING") return res.status === "PENDING_APPROVAL";
    return true;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Restaurant Partners</h3>
          <p className="text-xs text-zinc-400 mt-1">Manage, approve, and suspend merchant registrations</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2 bg-zinc-800/80 p-1 rounded-xl self-start sm:self-auto">
          {["ALL", "ACTIVE", "PENDING"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === t
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "PENDING" ? "Pending Approval" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No restaurants found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <th className="pb-3 pl-4">Restaurant</th>
                <th className="pb-3">Owner Contact</th>
                <th className="pb-3">Cuisine</th>
                <th className="pb-3">Rating</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {filteredRestaurants.map((res) => (
                <tr key={res.id} className="group hover:bg-zinc-800/20 transition-all">
                  <td className="py-4 pl-4 flex items-center space-x-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={res.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"}
                      alt={res.name}
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-800 bg-zinc-800"
                    />
                    <div>
                      <p className="font-bold text-white leading-tight">{res.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{res.email}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-medium text-zinc-300">{res.ownerName}</p>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-zinc-300">{res.cuisineType || "General"}</span>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center text-zinc-300 font-semibold">
                      <span className="text-yellow-400 mr-1">★</span> {res.rating > 0 ? res.rating.toFixed(1) : "N/A"}
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        res.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : res.status === "PENDING_APPROVAL"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {res.status === "ACTIVE"
                        ? "Active"
                        : res.status === "PENDING_APPROVAL"
                        ? "Pending"
                        : "Suspended"}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4">
                    {res.status === "PENDING_APPROVAL" ? (
                      <button
                        onClick={() => handleUpdateStatus(res.id, "ACTIVE")}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Approve Partner
                      </button>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(res.id, res.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}
                          className={`px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            res.status === "SUSPENDED"
                              ? "border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                              : "border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30"
                          }`}
                        >
                          {res.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                        </button>
                      </div>
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
