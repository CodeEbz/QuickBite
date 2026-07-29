"use client";

import React, { useState, useEffect } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { formatRating, toNumber } from "../lib/format";

interface Restaurant {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  rating: number | string;
  cuisineType: string;
  image: string;
}

const statusClassName = (status: Restaurant["status"]) =>
  status === "ACTIVE"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : status === "PENDING_APPROVAL"
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20";

const statusLabel = (status: Restaurant["status"]) =>
  status === "ACTIVE" ? "Active" : status === "PENDING_APPROVAL" ? "Pending" : "Suspended";

export default function RestaurantsTab() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | PENDING
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/admin/restaurants"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch restaurants.");
      const data = await res.json();
      setRestaurants(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch restaurants."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchRestaurants, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl(`/api/admin/restaurants/${id}/status?status=${newStatus}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to update status.");
      fetchRestaurants();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to update status."));
    }
  };

  const filteredRestaurants = restaurants.filter((res) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return res.status === "ACTIVE";
    if (filter === "PENDING") return res.status === "PENDING_APPROVAL";
    return true;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-5 shadow-xl animate-fade-in">
      <div className="flex flex-col gap-4 mb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">Restaurant Partners</h3>
          <p className="text-xs text-zinc-400 mt-1">Manage, approve, and suspend merchant registrations</p>
        </div>

        <div className="flex w-full gap-1.5 overflow-x-auto rounded-lg bg-zinc-800/80 p-1 lg:w-auto">
          {["ALL", "ACTIVE", "PENDING"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filter === t
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "PENDING" ? "Pending" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">! {error}</p>}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No restaurants found.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredRestaurants.map((res) => (
              <article key={res.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={res.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"}
                    alt={res.name}
                    className="h-12 w-12 rounded-lg object-cover border border-zinc-800 bg-zinc-800"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-white">{res.name}</h4>
                        <p className="break-all text-xs text-zinc-500 mt-0.5">{res.email}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-bold ${statusClassName(res.status)}`}>
                        {statusLabel(res.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-zinc-900 p-2">
                        <span className="block text-zinc-500">Owner</span>
                        <span className="mt-1 block truncate font-semibold text-zinc-200">{res.ownerName}</span>
                      </div>
                      <div className="rounded-md bg-zinc-900 p-2">
                        <span className="block text-zinc-500">Cuisine</span>
                        <span className="mt-1 block truncate font-semibold text-zinc-200">{res.cuisineType || "General"}</span>
                      </div>
                      <div className="rounded-md bg-zinc-900 p-2">
                        <span className="block text-zinc-500">Rating</span>
                        <span className="mt-1 block font-semibold text-zinc-200">{toNumber(res.rating) > 0 ? formatRating(res.rating) : "N/A"}</span>
                      </div>
                      <div className="rounded-md bg-zinc-900 p-2">
                        <span className="block text-zinc-500">Action</span>
                        {res.status === "PENDING_APPROVAL" ? (
                          <button onClick={() => handleUpdateStatus(res.id, "ACTIVE")} className="mt-1 text-left text-xs font-bold text-orange-400">
                            Approve
                          </button>
                        ) : (
                          <button onClick={() => handleUpdateStatus(res.id, res.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")} className="mt-1 text-left text-xs font-bold text-zinc-300">
                            {res.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left border-collapse">
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
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-800 bg-zinc-800"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white leading-tight truncate">{res.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{res.email}</p>
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
                        <span className="text-yellow-400 mr-1">*</span> {toNumber(res.rating) > 0 ? formatRating(res.rating) : "N/A"}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusClassName(res.status)}`}>
                        {statusLabel(res.status)}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      {res.status === "PENDING_APPROVAL" ? (
                        <button onClick={() => handleUpdateStatus(res.id, "ACTIVE")} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer">
                          Approve Partner
                        </button>
                      ) : (
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
