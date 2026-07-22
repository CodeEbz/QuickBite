"use client";

import React, { useState } from "react";

const INITIAL_ORDERS = [
  {
    id: "#QB-9204",
    customer: "Sarah Jenkins",
    restaurant: "Burger Palace",
    driver: "David Miller",
    items: "2x Cheese Burger, 1x Large Fries",
    price: "$34.20",
    status: "DELIVERING",
    time: "10 mins ago",
  },
  {
    id: "#QB-9201",
    customer: "Michael Chang",
    restaurant: "Pizza Di Roma",
    driver: "Jessica Taylor",
    items: "1x Spicy Pepperoni Pizza, 2x Soda Cane",
    price: "$21.50",
    status: "PREPARING",
    time: "15 mins ago",
  },
  {
    id: "#QB-9188",
    customer: "Emma Watson",
    restaurant: "Sushi Zen",
    driver: "Kevin Parker",
    items: "1x Salmon Nigiri, 1x California Roll",
    price: "$45.00",
    status: "DELIVERED",
    time: "32 mins ago",
  },
  {
    id: "#QB-9182",
    customer: "Robert Downey",
    restaurant: "Burger Palace",
    driver: "N/A",
    items: "1x Chicken Wrap, 1x Vanilla Milkshake",
    price: "$18.90",
    status: "PENDING",
    time: "40 mins ago",
  },
];

export default function OrdersTab() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [filter, setFilter] = useState("ALL"); // ALL | PENDING | PREPARING | DELIVERING | DELIVERED

  const handleCancelOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: "CANCELLED" } : order
      )
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "ALL") return true;
    return o.status === filter;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Live Platform Orders</h3>
          <p className="text-xs text-zinc-400 mt-1">Real-time status updates and order cancel dispatching</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-800/80 p-1 rounded-xl self-start sm:self-auto">
          {["ALL", "PENDING", "PREPARING", "DELIVERING", "DELIVERED"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === t
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "ALL" ? "All Orders" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <th className="pb-3 pl-4">Order ID</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Restaurant</th>
              <th className="pb-3">Driver</th>
              <th className="pb-3">Details</th>
              <th className="pb-3">Price</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {filteredOrders.map((o) => (
              <tr key={o.id} className="group hover:bg-zinc-800/20 transition-all">
                <td className="py-4 pl-4 font-bold text-orange-400">{o.id}</td>
                <td className="py-4 font-semibold text-white">{o.customer}</td>
                <td className="py-4 text-zinc-300">{o.restaurant}</td>
                <td className="py-4 text-zinc-300">
                  <span className={o.driver === "N/A" ? "text-zinc-600 italic" : "text-zinc-300 font-semibold"}>
                    {o.driver}
                  </span>
                </td>
                <td className="py-4 text-zinc-400 truncate max-w-[200px]" title={o.items}>
                  {o.items}
                </td>
                <td className="py-4 font-bold text-white">{o.price}</td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      o.status === "DELIVERED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : o.status === "DELIVERING"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : o.status === "PREPARING"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : o.status === "PENDING"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="py-4 text-right pr-4">
                  {o.status !== "DELIVERED" && o.status !== "CANCELLED" ? (
                    <button
                      onClick={() => handleCancelOrder(o.id)}
                      className="px-2.5 py-1.5 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel Order
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-600 font-medium">Locked</span>
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
