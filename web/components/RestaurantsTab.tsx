"use client";

import React, { useState } from "react";

const INITIAL_RESTAURANTS = [
  {
    id: 1,
    name: "Burger Palace",
    owner: "John Smith",
    email: "john@burgerpalace.com",
    status: "ACTIVE",
    rating: "4.8",
    items: 24,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    name: "Pizza Di Roma",
    owner: "Marco Rossi",
    email: "marco@pizzadiroma.com",
    status: "ACTIVE",
    rating: "4.7",
    items: 18,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    name: "Sushi Zen",
    owner: "Yuki Tanaka",
    email: "yuki@sushizen.com",
    status: "ACTIVE",
    rating: "4.9",
    items: 32,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    name: "Gourmet Grill",
    owner: "Laura Vance",
    email: "laura@gourmetgrill.com",
    status: "PENDING_APPROVAL",
    rating: "N/A",
    items: 0,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=100&h=100&fit=crop",
  },
];

export default function RestaurantsTab() {
  const [restaurants, setRestaurants] = useState(INITIAL_RESTAURANTS);
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | PENDING

  const handleApprove = (id: number) => {
    setRestaurants((prev) =>
      prev.map((res) =>
        res.id === id ? { ...res, status: "ACTIVE", rating: "4.0", items: 5 } : res
      )
    );
  };

  const handleSuspend = (id: number) => {
    setRestaurants((prev) =>
      prev.map((res) =>
        res.id === id
          ? {
              ...res,
              status: res.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
            }
          : res
      )
    );
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <th className="pb-3 pl-4">Restaurant</th>
              <th className="pb-3">Owner Contact</th>
              <th className="pb-3">Menu Items</th>
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
                    src={res.image}
                    alt={res.name}
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-800 bg-zinc-800"
                  />
                  <div>
                    <p className="font-bold text-white leading-tight">{res.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{res.email}</p>
                  </div>
                </td>
                <td className="py-4">
                  <p className="font-medium text-zinc-300">{res.owner}</p>
                </td>
                <td className="py-4">
                  <span className="font-semibold text-zinc-300">{res.items}</span>
                </td>
                <td className="py-4">
                  <span className="inline-flex items-center text-zinc-300 font-semibold">
                    <span className="text-yellow-400 mr-1">★</span> {res.rating}
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
                      onClick={() => handleApprove(res.id)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                    >
                      Approve Partner
                    </button>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleSuspend(res.id)}
                        className={`px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all ${
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
    </div>
  );
}
