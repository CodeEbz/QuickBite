"use client";

import React, { useState, useEffect } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { formatCurrency } from "../lib/format";

interface OrderItem {
  id: number;
  itemName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  restaurant: {
    name: string;
  };
  driverName: string;
  totalPrice: number | string;
  status: "PENDING" | "PREPARING" | "DELIVERING" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("ALL"); // ALL | PENDING | PREPARING | DELIVERING | DELIVERED
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/admin/orders"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch orders.");
      const data = await res.json();
      setOrders(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch orders."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchOrders, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleCancelOrder = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl(`/api/admin/orders/${id}/cancel`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to cancel order.");
      fetchOrders();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to cancel order."));
    }
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

      {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No orders found in this category.
        </div>
      ) : (
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
                  <td className="py-4 pl-4 font-bold text-orange-400">#QB-{o.id}</td>
                  <td className="py-4 font-semibold text-white">{o.customerName}</td>
                  <td className="py-4 text-zinc-300">{o.restaurant?.name || "Unknown"}</td>
                  <td className="py-4 text-zinc-300">
                    <span className={!o.driverName ? "text-zinc-600 italic" : "text-zinc-300 font-semibold"}>
                      {o.driverName || "N/A"}
                    </span>
                  </td>
                  <td className="py-4 text-zinc-400 truncate max-w-[200px]" title={o.items?.map(i => `${i.quantity}x ${i.itemName}`).join(", ") || ""}>
                    {o.items?.map(i => `${i.quantity}x ${i.itemName}`).join(", ") || "No items"}
                  </td>
                  <td className="py-4 font-bold text-white">{formatCurrency(o.totalPrice)}</td>
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
                        className="px-2.5 py-1.5 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
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
      )}
    </div>
  );
}
