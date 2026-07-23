"use client";

import React from "react";

export default function ReportsTab() {
  const reports = [
    { label: "Avg. Order Value", value: "$28.40", desc: "Steady +2.3% growth", icon: "📈" },
    { label: "Commission Collected (10%)", value: "$12,458.03", desc: "Net platform earnings", icon: "🔑" },
    { label: "Driver Net Payouts", value: "$98,420.50", desc: "Tips included directly", icon: "🚲" },
    { label: "Order Cancellation Rate", value: "1.04%", desc: "Under 2.5% platform SLA", icon: "🛡️" },
  ];

  const categories = [
    { name: "Burgers & Sandwiches", percent: 45, color: "bg-orange-500" },
    { name: "Pizza & Italian", percent: 30, color: "bg-amber-500" },
    { name: "Sushi & Asian", percent: 15, color: "bg-yellow-400" },
    { name: "Desserts & Drinks", percent: 10, color: "bg-zinc-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reports.map((r, i) => (
          <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-400 text-sm font-semibold">{r.label}</span>
              <span className="text-xl">{r.icon}</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{r.value}</h3>
            <p className="text-xs text-zinc-500 mt-2">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Popular Food Categories</h3>
          <div className="space-y-5">
            {categories.map((cat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-300">{cat.name}</span>
                  <span className="font-bold text-white">{cat.percent}%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${cat.color}`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Rules Card */}
        <div className="p-6 bg-zinc-900 border border-zinc-850 rounded-2xl border-l-4 border-l-orange-600 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-md font-bold text-white">Platform Commission Structure</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              QuickBite operates on a 10% standard merchant commission rate on subtotal order amounts.
              Driver courier tips are 100% passed through directly to driver wallets and excluded from tax calculations.
            </p>
            <div className="p-3 bg-zinc-850/60 rounded-xl border border-zinc-800">
              <span className="text-xs text-zinc-500 block">Current Payout Cycle</span>
              <span className="text-sm font-bold text-white mt-1 block">Weekly (Every Monday 00:00 UTC)</span>
            </div>
          </div>

          <button className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all mt-6 shadow-md cursor-pointer">
            Export Financial Report
          </button>
        </div>
      </div>
    </div>
  );
}
