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

const orderStatusClassName = (status: Order["status"]) =>
  status === "DELIVERED"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : status === "DELIVERING"
    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
    : status === "PREPARING"
    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
    : status === "PENDING"
    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20";

const orderStatusLabel = (status: Order["status"]) => status.charAt(0) + status.slice(1).toLowerCase();

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

  const itemSummary = (order: Order) => order.items?.map((i) => `${i.quantity}x ${i.itemName}`).join(", ") || "No items";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-5 shadow-xl animate-fade-in">
      <div className="flex flex-col gap-4 mb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">Live Platform Orders</h3>
          <p className="text-xs text-zinc-400 mt-1">Real-time status updates and order cancel dispatching</p>
        </div>

        <div className="flex w-full gap-1.5 overflow-x-auto rounded-lg bg-zinc-800/80 p-1 lg:w-auto">
          {["ALL", "PENDING", "PREPARING", "DELIVERING", "DELIVERED"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filter === t
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">! {error}</p>}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No orders found in this category.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredOrders.map((o) => (
              <article key={o.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-orange-400">#QB-{o.id}</p>
                    <h4 className="mt-1 truncate font-bold text-white">{o.customerName}</h4>
                    <p className="mt-1 truncate text-xs text-zinc-500">{o.restaurant?.name || "Unknown restaurant"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${orderStatusClassName(o.status)}`}>
                    {orderStatusLabel(o.status)}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400" title={itemSummary(o)}>
                  {itemSummary(o)}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-zinc-900 p-2">
                    <span className="block text-zinc-500">Driver</span>
                    <span className={`mt-1 block truncate font-semibold ${!o.driverName ? "text-zinc-600 italic" : "text-zinc-200"}`}>
                      {o.driverName || "N/A"}
                    </span>
                  </div>
                  <div className="rounded-md bg-zinc-900 p-2">
                    <span className="block text-zinc-500">Total</span>
                    <span className="mt-1 block font-bold text-white">{formatCurrency(o.totalPrice)}</span>
                  </div>
                </div>

                {o.status !== "DELIVERED" && o.status !== "CANCELLED" ? (
                  <button onClick={() => handleCancelOrder(o.id)} className="mt-3 w-full rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-950/20">
                    Cancel Order
                  </button>
                ) : (
                  <div className="mt-3 rounded-lg border border-zinc-800 px-3 py-2 text-center text-xs font-bold text-zinc-600">Locked</div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[840px] text-left border-collapse">
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
                    <td className="py-4 text-zinc-400 truncate max-w-[220px]" title={itemSummary(o)}>
                      {itemSummary(o)}
                    </td>
                    <td className="py-4 font-bold text-white">{formatCurrency(o.totalPrice)}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${orderStatusClassName(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      {o.status !== "DELIVERED" && o.status !== "CANCELLED" ? (
                        <button onClick={() => handleCancelOrder(o.id)} className="px-2.5 py-1.5 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer">
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
        </>
      )}
    </div>
  );
}
