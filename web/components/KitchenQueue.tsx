"use client";

import React, { useState, useEffect } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

interface OrderItem {
  id: number;
  itemName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
}

export default function KitchenQueue() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/merchant/orders"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch kitchen orders.");
      const data = await res.json();
      setOrders(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch kitchen orders."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchOrders, 0);
    const interval = setInterval(fetchOrders, 10000);
    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const token = getAdminToken();
      const res = await fetch(
        apiUrl(`/api/merchant/orders/${id}/status?status=${newStatus}`),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to update status.");
      fetchOrders();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to update status."));
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl animate-fade-in shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Active Kitchen Queue</h3>
          <p className="text-xs text-zinc-400 mt-1">Incoming live orders. Queue updates automatically.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}

      {isLoading && orders.length === 0 ? (
        <div className="py-20 flex justify-center">
          <span className="w-8 h-8 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No active kitchen orders at the moment. Good time to prep ingredients!
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-orange-400">#QB-{order.id}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide ${
                      order.status === "DELIVERED"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : order.status === "PREPARING"
                        ? "bg-purple-500/10 text-purple-400"
                        : order.status === "READY"
                        ? "bg-blue-500/10 text-blue-400"
                        : order.status === "PENDING"
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="text-sm">
                  <p className="text-white font-bold mb-1">{order.customerName}</p>
                  <p className="text-zinc-400 text-xs">
                    {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t border-zinc-900 md:border-t-0 pt-3 md:pt-0">
                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">Order Total</span>
                  <span className="font-extrabold text-white">${order.totalPrice.toFixed(2)}</span>
                </div>

                {order.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Accept & Prepare
                  </button>
                )}

                {order.status === "PREPARING" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "READY")}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Mark as Ready
                  </button>
                )}

                {order.status === "READY" && (
                  <div className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <span className="text-xs text-emerald-400 font-bold">Waiting for courier</span>
                  </div>
                )}
                
                {order.status === "DELIVERED" && (
                  <div className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-800 rounded-xl">
                    <span className="text-xs text-zinc-400 font-bold">Order Fulfilled</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
