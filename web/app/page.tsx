"use client";

import React, { useState, useEffect } from "react";
import OverviewTab from "../components/OverviewTab";
import RestaurantsTab from "../components/RestaurantsTab";
import OrdersTab from "../components/OrdersTab";
import UsersTab from "../components/UsersTab";
import ReportsTab from "../components/ReportsTab";

export default function Home() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState("overview"); // overview | restaurants | orders | users | reports

  // Check if admin is already logged in from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const name = localStorage.getItem("adminName");
    const role = localStorage.getItem("adminRole");
    if (token && role === "ADMIN") {
      setIsLoggedIn(true);
      setAdminName(name || "Administrator");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("https://quickbite-backend-x63n.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Invalid login credentials.");
      }

      const data = await response.json(); // returns { token, role, name }

      if (data.role !== "ADMIN") {
        throw new Error("Access denied. Admin portal is restricted to administrators.");
      }

      // Save admin credentials
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminRole", data.role);
      localStorage.setItem("adminName", data.name);
      
      setAdminName(data.name);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message || "Unable to login. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminName");
    setIsLoggedIn(false);
    setActiveTab("overview");
  };

  // Render correct sub-view
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "restaurants":
        return <RestaurantsTab />;
      case "orders":
        return <OrdersTab />;
      case "users":
        return <UsersTab />;
      case "reports":
        return <ReportsTab />;
      default:
        return <OverviewTab />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
        {/* Left Visual Column */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-tr from-zinc-950 via-zinc-900 to-orange-950 items-center justify-center p-12 overflow-hidden border-r border-zinc-900">
          <div className="absolute inset-0 opacity-15 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000')] bg-cover bg-center" />
          <div className="absolute top-10 left-10 flex items-center space-x-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-600/30">
              QB
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">QuickBite</span>
          </div>

          <div className="max-w-md relative z-10 space-y-6">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              One Unified Dashboard to Manage Everything.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Verify partner merchants, track active dispatch riders, audit platform transaction metrics, and manage customer tickets instantly from the Super Admin control panel.
            </p>
            <div className="flex items-center space-x-4 pt-4 border-t border-zinc-800">
              <div className="flex -space-x-2">
                <span className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs">🚴</span>
                <span className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs">🍔</span>
                <span className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs">🏪</span>
              </div>
              <span className="text-xs text-zinc-500 font-semibold">Powering a three-sided marketplace</span>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8 bg-zinc-900/40 p-8 rounded-3xl border border-zinc-900 shadow-2xl backdrop-blur-xl">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Administrator Login</h2>
              <p className="text-xs text-zinc-400">Enter your credentials below to access the management portal</p>
            </div>

            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/25 rounded-2xl flex items-center space-x-3 text-red-400 text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@quickbite.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Secret Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none text-md select-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Authenticate Administrator"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 font-sans text-zinc-100 antialiased overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-850 flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-lg">
              QB
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">QuickBite</span>
          </div>

          {/* Nav list */}
          <nav className="space-y-2">
            {[
              { id: "overview", label: "Dashboard", icon: "📊" },
              { id: "restaurants", label: "Restaurants", icon: "🏪" },
              { id: "orders", label: "Live Orders", icon: "🛒" },
              { id: "users", label: "Users Directory", icon: "👤" },
              { id: "reports", label: "Analytics", icon: "📈" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer profile info */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400 text-sm">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="max-w-[120px]">
                <p className="text-xs font-bold text-white truncate" title={adminName}>{adminName}</p>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase">Super Admin</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-xl transition-all"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between px-6 md:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white text-xs">
              QB
            </div>
            <span className="font-extrabold text-sm text-white">QuickBite</span>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-xs font-bold rounded-lg px-2 py-1 text-white focus:outline-none"
            >
              <option value="overview">Dashboard</option>
              <option value="restaurants">Restaurants</option>
              <option value="orders">Orders</option>
              <option value="users">Users</option>
              <option value="reports">Analytics</option>
            </select>
            <button onClick={handleLogout} className="text-sm">🚪</button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-zinc-950">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white capitalize">
                  {activeTab === "overview" ? "System Dashboard" : activeTab}
                </h1>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Platform administration control node and configuration interface
                </p>
              </div>
              <div className="text-xs text-zinc-500 font-semibold hidden md:block">
                SLA Status: <span className="text-emerald-400 font-bold">99.8%</span>
              </div>
            </div>

            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
