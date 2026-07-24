"use client";

import React, { useState, useEffect } from "react";
import OverviewTab from "../components/OverviewTab";
import RestaurantsTab from "../components/RestaurantsTab";
import OrdersTab from "../components/OrdersTab";
import UsersTab from "../components/UsersTab";
import ReportsTab from "../components/ReportsTab";
import MenuManager from "../components/MenuManager";
import KitchenQueue from "../components/KitchenQueue";
import MerchantChat from "../components/MerchantChat";
import MerchantProfile from "../components/MerchantProfile";

import { getAdminToken, getAdminRole, getAdminName, setAdminAuth, clearAdminAuth } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

export default function Home() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Login vs Merchant Registration
  
  // Login / Register Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [restaurantNameInput, setRestaurantNameInput] = useState("");
  const [cuisineTypeInput, setCuisineTypeInput] = useState("Burgers & American");
  const [showPassword, setShowPassword] = useState(false);
  
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(""); // ADMIN or RESTAURANT
  const [restaurantName, setRestaurantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState("overview"); // overview | restaurants | orders | users | reports | kitchen | menu | chat | profile

  // Check if user is already logged in from sessionStorage on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = getAdminToken();
      const name = getAdminName();
      const role = getAdminRole();
      if (token && (role === "ADMIN" || role === "RESTAURANT")) {
        setIsLoggedIn(true);
        setUserName(name || "User");
        setUserRole(role);

        if (role === "RESTAURANT") {
          setActiveTab("kitchen");
        } else {
          setActiveTab("overview");
        }
      } else {
        clearAdminAuth();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Fetch restaurant profile details if merchant
  useEffect(() => {
    if (isLoggedIn && userRole === "RESTAURANT") {
      const fetchProfile = async () => {
        try {
          const token = getAdminToken();
          const res = await fetch(apiUrl("/api/merchant/profile"), {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setRestaurantName(data.name);
          }
        } catch (err) {
          console.error("Error loading restaurant profile:", err);
        }
      };
      fetchProfile();
    }
  }, [isLoggedIn, userRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Parse error message if JSON
        try {
          const errObj = JSON.parse(errorText);
          throw new Error(errObj.error || errObj.message || "Invalid login credentials.");
        } catch {
          throw new Error(errorText || "Invalid login credentials.");
        }
      }

      const data = await response.json(); // returns { token, role, name }

      if (data.role !== "ADMIN" && data.role !== "RESTAURANT") {
        throw new Error("Access denied. Portal is restricted to administrators and merchants.");
      }

      // Save credentials into sessionStorage
      setAdminAuth(data.token, data.role, data.name);
      
      setUserName(data.name);
      setUserRole(data.role);
      setIsLoggedIn(true);

      // Route to default tab based on role
      if (data.role === "RESTAURANT") {
        setActiveTab("kitchen");
      } else {
        setActiveTab("overview");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to login. Please try again later."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !email.trim() || !password || !restaurantNameInput.trim()) {
      setError("Please complete all registration fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/auth/register-merchant"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          email: email.trim(),
          password,
          restaurantName: restaurantNameInput.trim(),
          cuisineType: cuisineTypeInput,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errObj = JSON.parse(errorText);
          throw new Error(errObj.error || errObj.message || "Registration failed.");
        } catch {
          throw new Error(errorText || "Registration failed.");
        }
      }

      const data = await response.json(); // returns { token, role, name }

      setAdminAuth(data.token, data.role, data.name);
      setUserName(data.name);
      setUserRole(data.role);
      setRestaurantName(restaurantNameInput.trim());
      setIsLoggedIn(true);
      setActiveTab("kitchen");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to register merchant profile."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminAuth();
    setIsLoggedIn(false);
    setRestaurantName("");
    setUserRole("");
    setEmail("");
    setPassword("");
    setOwnerName("");
    setRestaurantNameInput("");
  };

  // Render correct sub-view
  const renderTabContent = () => {
    switch (activeTab) {
      // Admin views
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
      
      // Merchant views
      case "kitchen":
        return <KitchenQueue />;
      case "menu":
        return <MenuManager />;
      case "chat":
        return <MerchantChat />;
      case "profile":
        return <MerchantProfile />;
      
      default:
        return userRole === "RESTAURANT" ? <KitchenQueue /> : <OverviewTab />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
        {/* Left Visual Column */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-tr from-zinc-950 via-zinc-900 to-orange-950 items-center justify-center p-12 overflow-hidden border-r border-zinc-900">
          <div className="absolute inset-0 opacity-15 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000')] bg-cover bg-center" />
          
          <button 
            onClick={() => { setIsRegisterMode(false); setError(null); }}
            className="absolute top-10 left-10 flex items-center space-x-3 z-10 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600 group-hover:bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-600/30 transition-all">
              QB
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-orange-400 transition-colors">QuickBite</span>
          </button>

          <div className="max-w-md relative z-10 space-y-6">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              One Unified Dashboard to Manage Everything.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Verify partner merchants, track active dispatch riders, audit platform transaction metrics, and manage kitchen queues directly from the portal.
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
          <div className="w-full max-w-md space-y-6 bg-zinc-900/40 p-8 rounded-3xl border border-zinc-900 shadow-2xl backdrop-blur-xl">
            {/* Toggle Mode Header */}
            <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Account Login
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sign Up Merchant
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-white">
                {isRegisterMode ? "Merchant Registration" : "QuickBite Portal"}
              </h2>
              <p className="text-xs text-zinc-400">
                {isRegisterMode 
                  ? "Register your restaurant to receive and fulfill customer orders" 
                  : "Log in to your Admin or Restaurant Merchant account"}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/25 rounded-2xl flex items-center space-x-3 text-red-400 text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {!isRegisterMode ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@quickbite.com or john@burgerpalace.com"
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
                  className="w-full h-12 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center text-sm cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Authenticate Account"
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER MERCHANT FORM */
              <form onSubmit={handleRegisterMerchant} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Owner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chef John Smith"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Restaurant Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gourmet Burger Hub"
                    value={restaurantNameInput}
                    onChange={(e) => setRestaurantNameInput(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cuisine Type</label>
                    <select
                      value={cuisineTypeInput}
                      onChange={(e) => setCuisineTypeInput(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-orange-500 text-sm cursor-pointer"
                    >
                      <option value="Burgers & American">Burgers & American</option>
                      <option value="Pizza & Italian">Pizza & Italian</option>
                      <option value="Asian & Sushi">Asian & Sushi</option>
                      <option value="Grill & Steakhouse">Grill & Steakhouse</option>
                      <option value="Desserts & Bakery">Desserts & Bakery</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="merchant@store.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center text-sm mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Register Restaurant Partner"
                  )}
                </button>
              </form>
            )}
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
          {/* Clickable Logo */}
          <button
            onClick={() => setActiveTab(userRole === "RESTAURANT" ? "kitchen" : "overview")}
            className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
            title="Go to main dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-600 group-hover:bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg transition-all">
              QB
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-orange-400 transition-colors">QuickBite</span>
          </button>

          {/* Role-Based Nav list */}
          <nav className="space-y-2">
            {userRole === "ADMIN" ? (
              // Admin links
              <>
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </>
            ) : (
              // Merchant links
              <>
                {[
                  { id: "kitchen", label: "Kitchen Queue", icon: "🍳" },
                  { id: "menu", label: "Menu Manager", icon: "📖" },
                  { id: "chat", label: "Customer Chat", icon: "??" },
                  { id: "profile", label: "Profile", icon: "??" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </>
            )}
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all mt-6 border border-red-900/30 cursor-pointer"
            >
              <span>🚪</span>
              <span>Logout Account</span>
            </button>
          </nav>
        </div>

        {/* Footer profile info */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400 text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="max-w-[170px]">
              <p className="text-xs font-bold text-white truncate" title={userName}>{userName}</p>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase">{userRole === "ADMIN" ? "Super Admin" : "Merchant"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between px-6 md:hidden">
          <button
            onClick={() => setActiveTab(userRole === "RESTAURANT" ? "kitchen" : "overview")}
            className="flex items-center space-x-2 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white text-xs">
              QB
            </div>
            <span className="font-extrabold text-sm text-white">
              {userRole === "RESTAURANT" && restaurantName ? restaurantName : "QuickBite"}
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-xs font-bold rounded-lg px-2 py-1 text-white focus:outline-none cursor-pointer"
            >
              {userRole === "ADMIN" ? (
                <>
                  <option value="overview">Dashboard</option>
                  <option value="restaurants">Restaurants</option>
                  <option value="orders">Orders</option>
                  <option value="users">Users</option>
                  <option value="reports">Analytics</option>
                </>
              ) : (
                <>
                  <option value="kitchen">Kitchen Queue</option>
                  <option value="menu">Menu Manager</option>
                  <option value="chat">Chat</option>
                  <option value="profile">Profile</option>
                </>
              )}
            </select>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-zinc-950">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white capitalize leading-none">
                  {userRole === "RESTAURANT" && activeTab === "kitchen" && restaurantName 
                    ? `${restaurantName} Kitchen` 
                    : activeTab === "overview" 
                    ? "System Dashboard" 
                    : activeTab}
                </h1>
                <p className="text-xs text-zinc-500 mt-2">
                  {userRole === "ADMIN" 
                    ? "Platform administration control node and configuration interface"
                    : "Merchant dashboard portal for managing menus, chats, profile, and dispatching orders"}
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
