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

type NavIconName = "dashboard" | "restaurants" | "orders" | "users" | "reports" | "kitchen" | "menu" | "chat" | "profile" | "logout";

const NavIcon = ({ name }: { name: NavIconName }) => {
  const commonProps = {
    className: "h-4 w-4 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "restaurants":
      return (
        <svg {...commonProps}>
          <path d="M4 10h16" />
          <path d="M5 10a7 7 0 0 1 14 0" />
          <path d="M7 14h10" />
          <path d="M6 18h12" />
          <path d="M4 21h16" />
        </svg>
      );
    case "orders":
      return (
        <svg {...commonProps}>
          <path d="M7 3h10l2 4v14H5V7l2-4Z" />
          <path d="M7 7h10" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <path d="M16 11a3 3 0 1 0-.5-5.96" />
          <path d="M18 20a5 5 0 0 0-3-4.6" />
        </svg>
      );
    case "reports":
      return (
        <svg {...commonProps}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16v-5" />
          <path d="M12 16V8" />
          <path d="M16 16v-3" />
        </svg>
      );
    case "kitchen":
      return (
        <svg {...commonProps}>
          <path d="M5 3v7" />
          <path d="M8 3v7" />
          <path d="M5 7h3" />
          <path d="M6.5 10v11" />
          <path d="M16 3v18" />
          <path d="M13 3h6" />
          <path d="M13 9h6" />
        </svg>
      );
    case "menu":
      return (
        <svg {...commonProps}>
          <path d="M5 4h14v16H5z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case "chat":
      return (
        <svg {...commonProps}>
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.5-5A8 8 0 1 1 21 12Z" />
          <path d="M8 12h.01" />
          <path d="M12 12h.01" />
          <path d="M16 12h.01" />
        </svg>
      );
    case "profile":
      return (
        <svg {...commonProps}>
          <path d="M4 10h16v10H4z" />
          <path d="M7 10V6l5-3 5 3v4" />
          <path d="M9 20v-5h6v5" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 3v18" />
        </svg>
      );
  }
};
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

  const adminTabs = [
    { id: "overview", label: "Dashboard", icon: "dashboard" as const },
    { id: "restaurants", label: "Restaurants", icon: "restaurants" as const },
    { id: "orders", label: "Orders", icon: "orders" as const },
    { id: "users", label: "Users", icon: "users" as const },
    { id: "reports", label: "Analytics", icon: "reports" as const },
  ];

  const merchantTabs = [
    { id: "kitchen", label: "Kitchen", icon: "kitchen" as const },
    { id: "menu", label: "Menu", icon: "menu" as const },
    { id: "chat", label: "Chat", icon: "chat" as const },
    { id: "profile", label: "Profile", icon: "profile" as const },
  ];

  const visibleTabs = userRole === "ADMIN" ? adminTabs : merchantTabs;

  const activeTitle =
    userRole === "RESTAURANT" && activeTab === "kitchen" && restaurantName
      ? `${restaurantName} Kitchen`
      : activeTab === "overview"
      ? "System Dashboard"
      : visibleTabs.find((tab) => tab.id === activeTab)?.label || activeTab;

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
                <span className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs">QB</span>
                <span className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs">QB</span>
                <span className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs">QB</span>
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
                <span>!</span>
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
                      placeholder="********"
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
                      {showPassword ? "Hide" : "Show"}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="********"
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
    <div className="flex min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased lg:h-screen lg:overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex-col justify-between hidden lg:flex">
        <div className="p-5 space-y-7">
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
                {adminTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <NavIcon name={tab.icon} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </>
            ) : (
              // Merchant links
              <>
                {merchantTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <NavIcon name={tab.icon} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </>
            )}
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all mt-6 border border-red-900/30 cursor-pointer"
            >
              <NavIcon name="logout" />
              <span>Logout Account</span>
            </button>
          </nav>
        </div>

        {/* Footer profile info */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
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
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 bg-zinc-950/95 border-b border-zinc-800 px-3 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveTab(userRole === "RESTAURANT" ? "kitchen" : "overview")}
              className="min-w-0 flex items-center gap-2 text-left focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white text-xs">
                QB
              </div>
              <span className="min-w-0 truncate font-extrabold text-sm text-white">
                {userRole === "RESTAURANT" && restaurantName ? restaurantName : "QuickBite"}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="shrink-0 px-3 py-2 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>

          <nav className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                <NavIcon name={tab.icon} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-3 sm:p-5 lg:p-8 xl:p-10">
          <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b border-zinc-900 pb-4 sm:pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white capitalize leading-tight break-words">
                  {activeTitle}
                </h1>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
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
