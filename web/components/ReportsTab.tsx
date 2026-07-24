"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { formatCurrency, toNumber } from "../lib/format";

interface Stats {
  totalRevenue: number | string;
  totalOrders: number | string;
  activeDrivers: number | string;
  pendingApprovals: number | string;
  totalRestaurants: number | string;
}

interface Order {
  id: number;
  totalPrice: number | string;
  status: "PENDING" | "PREPARING" | "DELIVERING" | "DELIVERED" | "CANCELLED";
}

interface Restaurant {
  id: number;
  cuisineType?: string;
}

const emptyStats: Stats = {
  totalRevenue: 0,
  totalOrders: 0,
  activeDrivers: 0,
  pendingApprovals: 0,
  totalRestaurants: 0,
};

export default function ReportsTab() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const headers = { Authorization: "Bearer " + token };
      const [statsRes, ordersRes, restaurantsRes] = await Promise.all([
        fetch(apiUrl("/api/admin/stats"), { headers }),
        fetch(apiUrl("/api/admin/orders"), { headers }),
        fetch(apiUrl("/api/admin/restaurants"), { headers }),
      ]);

      if (!statsRes.ok) throw new Error("Failed to fetch platform stats.");
      if (!ordersRes.ok) throw new Error("Failed to fetch order report data.");
      if (!restaurantsRes.ok) throw new Error("Failed to fetch restaurant report data.");

      setStats(await statsRes.json());
      setOrders(await ordersRes.json());
      setRestaurants(await restaurantsRes.json());
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load reports."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchReports, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReports]);

  const reportMetrics = useMemo(() => {
    const totalRevenue = toNumber(stats.totalRevenue);
    const totalOrders = toNumber(stats.totalOrders);
    const cancelledOrders = orders.filter((order) => order.status === "CANCELLED").length;
    const deliveredOrders = orders.filter((order) => order.status === "DELIVERED").length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return [
      { label: "Avg. Order Value", value: formatCurrency(avgOrderValue), desc: "Delivered revenue / total orders", icon: "\uD83D\uDCC8" },
      { label: "Commission Estimate (10%)", value: formatCurrency(totalRevenue * 0.1), desc: "Estimated platform commission", icon: "\uD83D\uDD11" },
      { label: "Delivered Orders", value: deliveredOrders.toString(), desc: "Orders completed successfully", icon: "\u2705" },
      { label: "Order Cancellation Rate", value: cancellationRate.toFixed(1) + "%", desc: cancelledOrders + " cancelled of " + totalOrders + " total", icon: "\uD83D\uDEE1\uFE0F" },
    ];
  }, [orders, stats.totalOrders, stats.totalRevenue]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const restaurant of restaurants) {
      const name = restaurant.cuisineType?.trim() || "General";
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    const total = restaurants.length || 1;
    const colors = ["bg-orange-500", "bg-amber-500", "bg-yellow-400", "bg-zinc-600", "bg-blue-500"];

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
        color: colors[index] || "bg-zinc-600",
      }));
  }, [restaurants]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportMetrics.map((metric) => (
          <div key={metric.label} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-400 text-sm font-semibold">{metric.label}</span>
              <span className="text-xl">{metric.icon}</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{metric.value}</h3>
            <p className="text-xs text-zinc-500 mt-2">{metric.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-2">Restaurant Cuisine Mix</h3>
          <p className="text-xs text-zinc-500 mb-6">Derived from merchant records in the admin database.</p>

          {categories.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-500">No restaurant categories available yet.</div>
          ) : (
            <div className="space-y-5">
              {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between text-sm gap-4">
                    <span className="font-semibold text-zinc-300 truncate">{category.name}</span>
                    <span className="font-bold text-white whitespace-nowrap">{category.count} - {category.percent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full transition-all duration-1000 " + category.color} style={{ width: category.percent + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-850 rounded-2xl border-l-4 border-l-orange-600 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-md font-bold text-white">Platform Snapshot</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              These figures now use live admin data. Commission remains an estimate until a payout ledger is added to the backend.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-850/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 block">Restaurants</span>
                <span className="text-sm font-bold text-white mt-1 block">{toNumber(stats.totalRestaurants)}</span>
              </div>
              <div className="p-3 bg-zinc-850/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 block">Drivers</span>
                <span className="text-sm font-bold text-white mt-1 block">{toNumber(stats.activeDrivers)}</span>
              </div>
              <div className="p-3 bg-zinc-850/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 block">Pending</span>
                <span className="text-sm font-bold text-white mt-1 block">{toNumber(stats.pendingApprovals)}</span>
              </div>
              <div className="p-3 bg-zinc-850/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 block">Orders</span>
                <span className="text-sm font-bold text-white mt-1 block">{toNumber(stats.totalOrders)}</span>
              </div>
            </div>
          </div>

          <button onClick={fetchReports} className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all mt-6 shadow-md cursor-pointer">
            Refresh Report
          </button>
        </div>
      </div>
    </div>
  );
}
