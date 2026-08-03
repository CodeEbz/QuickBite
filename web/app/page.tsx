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

const APK_URL = "https://expo.dev/artifacts/eas/PjfHlmDs07IXcpGya_Sm93sY4m8e-BK6O0ZvwODc2bU.apk";

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  
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
  const [activeTab, setActiveTab] = useState("overview");

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
        try {
          const errObj = JSON.parse(errorText);
          throw new Error(errObj.error || errObj.message || "Invalid login credentials.");
        } catch {
          throw new Error(errorText || "Invalid login credentials.");
        }
      }

      const data = await response.json();

      if (data.role !== "ADMIN" && data.role !== "RESTAURANT") {
        throw new Error("Access denied. Web portal is restricted to administrators and restaurant merchants. Customers and Drivers must log in using the QuickBite Mobile App.");
      }

      setAdminAuth(data.token, data.role, data.name);
      setUserName(data.name);
      setUserRole(data.role);
      setIsLoggedIn(true);
      setShowAuthModal(false);

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

      const data = await response.json();

      setAdminAuth(data.token, data.role, data.name);
      setUserName(data.name);
      setUserRole(data.role);
      setRestaurantName(restaurantNameInput.trim());
      setIsLoggedIn(true);
      setShowAuthModal(false);
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

  // LANDING PAGE VIEW FOR UNAUTHENTICATED VISITORS
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
        {/* Animated ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-600/20 blur-[140px] pointer-events-none rounded-full animate-pulse-glow" />
        <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-amber-600/10 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-[1200px] left-0 w-[600px] h-[600px] bg-orange-700/10 blur-[180px] pointer-events-none rounded-full" />

        {/* TOP NAVIGATION BAR */}
        <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/80 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-orange-600/30">
                QB
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white">QuickBite</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full">
                  Ecosystem
                </span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-zinc-400">
              <a href="#ecosystem" className="hover:text-white transition-colors">Platform</a>
              <a href="#download" className="hover:text-white transition-colors">Mobile App</a>
              <a href="#roles" className="hover:text-white transition-colors">Roles & Access</a>
              <a href="#portal" className="hover:text-white transition-colors">Web Portal</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <a
                href={APK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white font-bold text-xs transition-all shadow-sm group"
              >
                <svg className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download APK</span>
              </a>

              <button
                onClick={() => { setShowAuthModal(true); setError(null); }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition-all cursor-pointer"
              >
                Portal Sign In
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section id="ecosystem" className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border-orange-500/30 text-orange-400 text-xs font-bold shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Next-Generation Food Delivery Platform</span>
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Delicious Food, <br className="hidden sm:inline" />
                <span className="gradient-text-orange">Delivered Fast.</span>
              </h1>

              <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                QuickBite bridges customers, restaurant merchants, dispatch riders, and administrators in one unified platform. Fulfill orders in real-time, track drivers with live GPS, and manage your kitchen effortlessly.
              </p>

              {/* ACCESS GUIDE BOX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
                {/* Customer / Driver Callout */}
                <div className="glass-card p-5 rounded-2xl border-emerald-500/30 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      📱
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">For Customers & Drivers</h3>
                      <p className="text-[11px] text-emerald-400 font-bold">Use Mobile App (APK)</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Order meals, track live dispatch delivery, save addresses, or go online as a driver.
                  </p>
                  <a
                    href={APK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Mobile APK</span>
                  </a>
                </div>

                {/* Merchant / Admin Callout */}
                <div className="glass-card p-5 rounded-2xl border-orange-500/30 relative overflow-hidden group hover:border-orange-500/50 transition-all">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all" />
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                      💻
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">For Merchants & Admins</h3>
                      <p className="text-[11px] text-orange-400 font-bold">Use Web Portal Access</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Manage kitchen queues, edit food menus, respond to customer chats, & audit platform metrics.
                  </p>
                  <button
                    onClick={() => { setShowAuthModal(true); setIsRegisterMode(false); setError(null); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
                  >
                    <span>Log In to Web Portal</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats badges */}
              <div className="pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                <div>
                  <p className="text-2xl font-black text-white">99.9%</p>
                  <p className="text-xs text-zinc-500 font-semibold">Uptime SLA</p>
                </div>
                <div className="w-px h-8 bg-zinc-800 hidden sm:block" />
                <div>
                  <p className="text-2xl font-black text-orange-400">Paystack</p>
                  <p className="text-xs text-zinc-500 font-semibold">Instant Payments</p>
                </div>
                <div className="w-px h-8 bg-zinc-800 hidden sm:block" />
                <div>
                  <p className="text-2xl font-black text-emerald-400">Live GPS</p>
                  <p className="text-xs text-zinc-500 font-semibold">Real-Time Dispatch</p>
                </div>
              </div>
            </div>

            {/* Right Hero Preview Mockup */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Floating Glow backdrop */}
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/30 to-amber-500/20 rounded-3xl blur-2xl transform rotate-3 scale-95" />

                {/* Main Card Graphic */}
                <div className="relative glass-panel p-6 rounded-3xl border border-zinc-700/60 shadow-2xl space-y-5 animate-float">
                  {/* Mock App Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        🍔
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">QuickBite Active Order</p>
                        <p className="text-[10px] text-zinc-400">Ref: #QB-94821</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full animate-pulse">
                      PREPARING
                    </span>
                  </div>

                  {/* Order Items Mock */}
                  <div className="space-y-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-bold">1x Double Smoked Bacon Cheeseburger</span>
                      <span className="text-white font-bold">$14.50</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-bold">1x Loaded Seasoned Curly Fries</span>
                      <span className="text-white font-bold">$5.00</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-zinc-800/80">
                      <span className="text-zinc-400">Paystack Verified</span>
                      <span className="text-emerald-400 font-extrabold">$19.50 Paid</span>
                    </div>
                  </div>

                  {/* Driver Tracker Mock */}
                  <div className="flex items-center justify-between bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        🏍️
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">Rider: Alex Turner</p>
                        <p className="text-[10px] text-emerald-400 font-semibold">Live GPS Active • 8 mins away</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  {/* Merchant Kitchen Notification */}
                  <div className="p-3 bg-orange-950/30 rounded-xl border border-orange-500/20 text-xs text-orange-300 flex items-center justify-between">
                    <span>Kitchen status synced to Web Portal</span>
                    <span className="font-extrabold text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded">Live</span>
                  </div>
                </div>

                {/* Floating secondary badge top left */}
                <div className="absolute -top-6 -left-6 glass-card px-4 py-3 rounded-2xl border border-zinc-700/80 shadow-xl flex items-center space-x-3 animate-float-reverse hidden sm:flex">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                    ⭐
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">4.9 / 5 Rating</p>
                    <p className="text-[10px] text-zinc-400">From 12,000+ orders</p>
                  </div>
                </div>

                {/* Floating secondary badge bottom right */}
                <div className="absolute -bottom-6 -right-6 glass-card px-4 py-3 rounded-2xl border border-zinc-700/80 shadow-xl flex items-center space-x-3 animate-float hidden sm:flex">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                    🚀
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Fast Fulfill</p>
                    <p className="text-[10px] text-zinc-400">Avg delivery 24 mins</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CUSTOMER MOBILE APP DOWNLOAD SPOTLIGHT */}
        <section id="download" className="py-16 sm:py-24 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-y border-zinc-800/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-orange-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-8 space-y-5 text-center lg:text-left">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <span>📱 QuickBite Mobile Application</span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                    Order Food on the Go with <br className="hidden sm:inline" />
                    <span className="gradient-text-orange">Our Official Mobile App</span>
                  </h2>

                  <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                    To start ordering delicious meals, tracking deliveries live, or saving your delivery locations, download our native Android app (.APK file) directly to your device.
                  </p>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                    <a
                      href={APK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center space-x-3 transition-all hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download QuickBite APK (Android)</span>
                    </a>

                    <div className="text-left text-xs text-zinc-400">
                      <p className="font-bold text-white">Direct EAS Expo Build</p>
                      <p className="text-[11px] text-zinc-500">Android Package (.APK) • SDK 54</p>
                    </div>
                  </div>
                </div>

                {/* Steps box */}
                <div className="lg:col-span-4 glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                    <span>Installation Steps</span>
                  </h3>

                  <ol className="space-y-3 text-xs text-zinc-300">
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 rounded-full bg-orange-600/30 text-orange-400 font-bold flex items-center justify-center shrink-0">1</span>
                      <span>Click <strong>Download QuickBite APK</strong> to download the package.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 rounded-full bg-orange-600/30 text-orange-400 font-bold flex items-center justify-center shrink-0">2</span>
                      <span>Allow installation from unknown sources if prompted by Android.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 rounded-full bg-orange-600/30 text-orange-400 font-bold flex items-center justify-center shrink-0">3</span>
                      <span>Open QuickBite, sign up or log in, and enjoy your meal!</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ECOSYSTEM 4-ROLE BREAKDOWN */}
        <section id="roles" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest">Platform Architecture</h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              One Unified Marketplace, <span className="gradient-text-orange">4 Tailored Roles</span>
            </p>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              QuickBite connects customers, restaurants, drivers, and platform operators seamlessly across mobile and web interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Customer Role Card */}
            <div className="glass-card p-6 rounded-3xl border border-zinc-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🛒
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-white">Customers</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md">Mobile App</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Browse active food menus, apply promo codes like <code className="text-orange-400 font-mono">FIRST50</code>, pay safely via Paystack, and track order dispatch live.
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-zinc-800/80 mt-6">
                <a
                  href={APK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <span>Download Mobile APK</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Merchant Role Card */}
            <div className="glass-card p-6 rounded-3xl border border-zinc-800 hover:border-orange-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🍳
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-white">Merchants</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-md">Web & Mobile</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Manage incoming kitchen queues, update prices and food items, upload menu photos, and chat directly with customers.
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-zinc-800/80 mt-6">
                <button
                  onClick={() => { setShowAuthModal(true); setIsRegisterMode(true); setError(null); }}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Register Restaurant Partner</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Driver Role Card */}
            <div className="glass-card p-6 rounded-3xl border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🛵
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-white">Drivers</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md">Mobile App</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Toggle online availability, accept available delivery jobs, stream real-time GPS location, and complete customer drop-offs.
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-zinc-800/80 mt-6">
                <a
                  href={APK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <span>Get Mobile App</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Admin Role Card */}
            <div className="glass-card p-6 rounded-3xl border border-zinc-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-white">Admins</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md">Web Portal</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Approve or suspend restaurant partners, audit platform transaction metrics, manage users, and issue order cancellations.
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-zinc-800/80 mt-6">
                <button
                  onClick={() => { setShowAuthModal(true); setIsRegisterMode(false); setError(null); }}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Admin Portal Login</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* INLINE PORTAL ACCESS SECTION */}
        <section id="portal" className="py-20 bg-zinc-900/40 border-t border-zinc-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-10">
              <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-bold">
                Web Portal Access
              </span>
              <h2 className="text-3xl font-extrabold text-white">
                Log In or Register Your Restaurant
              </h2>
              <p className="text-xs text-zinc-400">
                Restricted portal for verified Restaurant Merchants and Platform Administrators.
              </p>
            </div>

            <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl max-w-md mx-auto">
              {/* Toggle Mode Header */}
              <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Account Login
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sign Up Merchant
                </button>
              </div>

              {error && (
                <div className="p-4 mb-5 bg-red-950/40 border border-red-500/25 rounded-2xl flex items-center space-x-3 text-red-400 text-xs">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {!isRegisterMode ? (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@quickbite.com or merchant@store.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-4 pr-12 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs select-none"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center text-xs cursor-pointer mt-2"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Sign In to Web Portal"
                    )}
                  </button>
                </form>
              ) : (
                /* REGISTER MERCHANT FORM */
                <form onSubmit={handleRegisterMerchant} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Owner Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chef John Smith"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gourmet Burger Hub"
                      value={restaurantNameInput}
                      onChange={(e) => setRestaurantNameInput(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Cuisine Type</label>
                      <select
                        value={cuisineTypeInput}
                        onChange={(e) => setCuisineTypeInput(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-orange-500 text-xs cursor-pointer"
                      >
                        <option value="Burgers & American">Burgers & American</option>
                        <option value="Pizza & Italian">Pizza & Italian</option>
                        <option value="Asian & Sushi">Asian & Sushi</option>
                        <option value="Grill & Steakhouse">Grill & Steakhouse</option>
                        <option value="Desserts & Bakery">Desserts & Bakery</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="merchant@store.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center text-xs mt-2 cursor-pointer"
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
        </section>

        {/* AUTH MODAL POPUP */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="relative w-full max-w-md bg-zinc-900 glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-700 shadow-2xl space-y-6">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-1 text-center">
                <h3 className="text-xl font-extrabold text-white">
                  {isRegisterMode ? "Register Merchant" : "Web Portal Login"}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isRegisterMode ? "Partner with QuickBite to receive orders" : "Sign in with your Merchant or Admin credentials"}
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isRegisterMode ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Portal Login
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isRegisterMode ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Register Merchant
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/25 rounded-xl text-red-400 text-xs">
                  {error}
                </div>
              )}

              {!isRegisterMode ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@quickbite.com or merchant@store.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center text-xs cursor-pointer"
                  >
                    {isLoading ? "Authenticating..." : "Sign In to Web Portal"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterMerchant} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Owner Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chef John Smith"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gourmet Burger Hub"
                      value={restaurantNameInput}
                      onChange={(e) => setRestaurantNameInput(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase">Cuisine</label>
                      <select
                        value={cuisineTypeInput}
                        onChange={(e) => setCuisineTypeInput(e.target.value)}
                        className="w-full h-10 px-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                      >
                        <option value="Burgers & American">Burgers</option>
                        <option value="Pizza & Italian">Pizza</option>
                        <option value="Asian & Sushi">Asian</option>
                        <option value="Grill & Steakhouse">Grill</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="email@store.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer mt-1"
                  >
                    {isLoading ? "Creating Account..." : "Register Restaurant Partner"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 text-zinc-500 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white text-xs">
                QB
              </div>
              <span className="font-extrabold text-white text-sm">QuickBite Platform</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
              <a href="#ecosystem" className="hover:text-zinc-300">Ecosystem</a>
              <a href="#download" className="hover:text-zinc-300">Download App</a>
              <a href="#roles" className="hover:text-zinc-300">Roles</a>
              <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Android APK</a>
            </div>

            <p>© 2026 QuickBite Ecosystem. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // LOGGED-IN DASHBOARD VIEW FOR ADMINS & MERCHANTS
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
