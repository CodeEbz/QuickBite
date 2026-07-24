"use client";

import React, { useState, useEffect } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  activeDrivers: number;
  pendingApprovals: number;
  totalRestaurants: number;
}

export default function OverviewTab() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeDrivers: 0,
    pendingApprovals: 0,
    totalRestaurants: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAdminToken();
        const res = await fetch(apiUrl("/api/admin/stats"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to load statistics.");
        const data = await res.json();
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          activeDrivers: data.activeDrivers || 0,
          pendingApprovals: data.pendingApprovals || 0,
          totalRestaurants: data.totalRestaurants || 0
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsList = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, change: "Live sales", icon: "💰", color: "text-emerald-500" },
    { label: "Active Orders", value: stats.totalOrders.toString(), change: "Cumulative orders", icon: "🛒", color: "text-orange-500" },
    { label: "Active Drivers", value: stats.activeDrivers.toString(), change: "Ready for courier dispatch", icon: "🚴", color: "text-blue-500" },
    { label: "Pending Approvals", value: stats.pendingApprovals.toString(), change: "Merchant applications", icon: "⏳", color: "text-amber-500" },
  ];

  const recentLogs = [
    { id: 1, type: "order", text: "New order #QB-9204 placed by Sarah Jenkins ($34.20)", time: "2 min ago" },
    { id: 2, type: "restaurant", text: "Restaurant 'Gourmet Grill' submitted approval request", time: "8 min ago" },
    { id: 3, type: "driver", text: "Driver David Miller changed status to ONLINE", time: "15 min ago" },
    { id: 4, type: "alert", text: "Database CPU utilization reached 78% (autoscaled)", time: "24 min ago" },
    { id: 5, type: "order", text: "Order #QB-9188 successfully delivered by Courier #4", time: "30 min ago" },
  ];

  // SVG chart data simulator
  const weeklySales = [
    { day: "Mon", amount: 1200, height: "h-24" },
    { day: "Tue", amount: 1500, height: "h-32" },
    { day: "Wed", amount: 1800, height: "h-40" },
    { day: "Thu", amount: 1400, height: "h-28" },
    { day: "Fri", amount: 2200, height: "h-48" },
    { day: "Sat", amount: 2600, height: "h-56" },
    { day: "Sun", amount: 2000, height: "h-44" },
  ];

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((stat, i) => (
          <div
            key={i}
            className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white mt-2">{stat.value}</h3>
              </div>
              <span className="text-2xl p-2 bg-zinc-800/80 rounded-xl">{stat.icon}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-4 flex items-center">
              <span className={`mr-1 font-semibold ${stat.color}`}>
                {stat.change}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Weekly Platform Performance</h3>
            <span className="text-xs px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full font-medium">Last 7 Days</span>
          </div>

          <div className="flex items-end justify-between h-64 pt-6 px-4 border-b border-zinc-800">
            {weeklySales.map((sale, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="absolute mb-24 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md pointer-events-none transform -translate-y-2">
                  ${sale.amount.toLocaleString()}
                </div>
                <div
                  className={`w-10 bg-gradient-to-t from-orange-600 to-amber-500 group-hover:from-orange-500 group-hover:to-yellow-400 rounded-t-lg transition-all duration-500 ease-out cursor-pointer ${sale.height}`}
                />
                <span className="text-xs font-medium text-zinc-500 mt-3">{sale.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live system logs */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">System Events Log</h3>
              <div className="flex items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping mr-2" />
                <span className="text-xs font-semibold text-emerald-400">Live</span>
              </div>
            </div>

            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-sm">
                  <div
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      log.type === "order"
                        ? "bg-orange-500"
                        : log.type === "restaurant"
                        ? "bg-purple-500"
                        : log.type === "driver"
                        ? "bg-blue-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-zinc-300 leading-tight">{log.text}</p>
                    <span className="text-[10px] text-zinc-500 mt-1 block">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-2.5 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 rounded-xl text-zinc-400 text-xs font-bold transition-all mt-6">
            View All Logs
          </button>
        </div>
      </div>
    </div>
  );
}
