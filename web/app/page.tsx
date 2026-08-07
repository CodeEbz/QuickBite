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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [restaurantNameInput, setRestaurantNameInput] = useState("");
  const [cuisineTypeInput, setCuisineTypeInput] = useState("Burgers & American");
  
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
        setActiveTab(role === "RESTAURANT" ? "kitchen" : "overview");
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
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setRestaurantName(data.name);
          }
        } catch (err) {
          console.error("Error loading profile:", err);
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
        headers: { "Content-Type": "application/json" },
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
        throw new Error("Access denied. Web portal is restricted to merchants and administrators. Customers and Drivers must log in using the QuickBite Mobile App.");
      }

      setAdminAuth(data.token, data.role, data.name);
      setUserName(data.name);
      setUserRole(data.role);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      setMobileMenuOpen(false);
      setActiveTab(data.role === "RESTAURANT" ? "kitchen" : "overview");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to login. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !email.trim() || !password || !restaurantNameInput.trim()) {
      setError("Please complete all fields.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/auth/register-merchant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setMobileMenuOpen(false);
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
      case "overview": return <OverviewTab />;
      case "restaurants": return <RestaurantsTab />;
      case "orders": return <OrdersTab />;
      case "users": return <UsersTab />;
      case "reports": return <ReportsTab />;
      case "kitchen": return <KitchenQueue />;
      case "menu": return <MenuManager />;
      case "chat": return <MerchantChat />;
      case "profile": return <MerchantProfile />;
      default: return userRole === "RESTAURANT" ? <KitchenQueue /> : <OverviewTab />;
    }
  };

  // LANDING PAGE FOR VISITORS
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#060608] text-zinc-100 font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden bg-mesh-pattern">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-orange-600/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-[600px] right-0 w-[500px] h-[400px] bg-amber-600/5 blur-[160px] pointer-events-none rounded-full" />

        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-[#060608]/80 backdrop-blur-xl border-b border-white/[0.08] transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-600/30 border border-orange-400/20">
                QB
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-white">QuickBite</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/25 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  Portal
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 p-1.5 rounded-2xl glass-panel border-white/[0.06]">
              <a href="#ecosystem" className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all">
                Platform
              </a>
              <a href="#download" className="px-4 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all">
                Mobile App
              </a>
              <a href="#roles" className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all">
                Roles
              </a>
              <a href="#portal" className="px-4 py-2 text-xs font-semibold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-xl transition-all">
                Merchant Sign In
              </a>
            </nav>

            {/* Header Right CTAs */}
            <div className="hidden sm:flex items-center space-x-3">
              <a
                href={APK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-emerald text-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download APK</span>
              </a>

              <button
                onClick={() => { setShowAuthModal(true); setIsRegisterMode(false); setError(null); }}
                className="btn-primary text-xs"
              >
                Sign In
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white focus:outline-none cursor-pointer transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/[0.08] bg-[#08080c]/98 backdrop-blur-2xl px-5 pt-4 pb-6 space-y-4 animate-slide-down">
              <nav className="flex flex-col space-y-1 text-sm font-semibold">
                <a
                  href="#ecosystem"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <span className="text-base">⚡</span>
                  <span>Platform Overview</span>
                </a>
                <a
                  href="#download"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold transition-colors"
                >
                  <span className="text-base">📱</span>
                  <span>Download Mobile APK</span>
                </a>
                <a
                  href="#roles"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <span className="text-base">👥</span>
                  <span>Ecosystem Roles</span>
                </a>
                <a
                  href="#portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-orange-400 bg-orange-500/10 border border-orange-500/20 font-bold transition-colors"
                >
                  <span className="text-base">💻</span>
                  <span>Merchant & Admin Portal</span>
                </a>
              </nav>

              <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-3">
                <a
                  href={APK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-emerald w-full justify-center text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Mobile APK</span>
                </a>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowAuthModal(true);
                    setError(null);
                  }}
                  className="btn-primary w-full justify-center text-xs"
                >
                  Sign In to Web Portal
                </button>
              </div>
            </div>
          )}
        </header>

        {/* HERO SECTION */}
        <section id="ecosystem" className="relative pt-12 pb-20 sm:pt-24 sm:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full glass-panel border-orange-500/30 text-orange-400 text-xs font-extrabold shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Unified 4-Sided Food Delivery Ecosystem</span>
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.1]">
                Delicious Food, <br />
                <span className="gradient-text-orange">Delivered Fast.</span>
              </h1>

              <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                QuickBite connects customers, local restaurant merchants, dispatch riders, and platform administrators in a single seamless ordering and dispatch experience.
              </p>

              {/* ACTION ACCESS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
                {/* Mobile App Card */}
                <div className="glass-card p-6 rounded-2xl border-emerald-500/30 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
                      📱
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Customers & Drivers</h3>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Mobile App (.APK)</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Download the mobile app to browse menus, track live orders, and accept delivery jobs.
                  </p>
                  <a
                    href={APK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-emerald w-full text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Mobile APK</span>
                  </a>
                </div>

                {/* Web Portal Card */}
                <div className="glass-card p-6 rounded-2xl border-orange-500/30 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 text-xl font-bold">
                      💻
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Merchants & Admins</h3>
                      <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Web Portal Access</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Access web dashboard to manage kitchen queues, update menus, and view live analytics.
                  </p>
                  <button
                    onClick={() => { setShowAuthModal(true); setIsRegisterMode(false); setError(null); }}
                    className="btn-primary w-full text-xs"
                  >
                    <span>Sign In to Portal</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stat Indicators */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-8 sm:gap-12">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">99.9%</p>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Uptime SLA</p>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-orange-400">Paystack</p>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Instant Payments</p>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400">Live GPS</p>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Real-Time Dispatch</p>
                </div>
              </div>
            </div>

            {/* Right Interactive Graphic */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-amber-500/10 rounded-3xl blur-3xl transform scale-95" />

                <div className="relative glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-5 animate-float">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-orange-600/30">
                        🍔
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">Kitchen Order Queue</p>
                        <p className="text-xs text-zinc-400">Order #QB-94821</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full animate-pulse">
                      PREPARING
                    </span>
                  </div>

                  <div className="space-y-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/80 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-300 font-semibold">1x Double Bacon Burger</span>
                      <span className="text-white font-bold">₦14,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-300 font-semibold">1x Loaded Seasoned Fries</span>
                      <span className="text-white font-bold">₦5,000</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2.5 border-t border-zinc-800/80">
                      <span className="text-zinc-400">Payment Status</span>
                      <span className="text-emerald-400 font-bold">Verified (Paystack)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
                        🏍️
                      </div>
                      <div>
                        <p className="font-extrabold text-white text-xs">Courier Assigned</p>
                        <p className="text-xs text-emerald-400">Live GPS Active • 6 mins away</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE APP SPOTLIGHT */}
        <section id="download" className="py-16 sm:py-24 bg-zinc-900/40 border-y border-white/10 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                  <span className="section-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    📱 Mobile Application
                  </span>

                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Get the QuickBite App <br />
                    <span className="gradient-text-orange">For Ordering & Delivery</span>
                  </h2>

                  <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
                    Customers browse local restaurants and make payments, while dispatch riders use the app to receive delivery tasks and share live location.
                  </p>

                  <div className="pt-2">
                    <a
                      href={APK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-emerald text-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download Android APK Package</span>
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Quick Setup Guide
                  </h3>
                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">1</span>
                      <span className="pt-0.5">Click <strong>Download Android APK</strong> above to download the file.</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">2</span>
                      <span className="pt-0.5">Enable installation from unknown sources in Android settings.</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">3</span>
                      <span className="pt-0.5">Open QuickBite, sign up or log in, and begin ordering!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-ROLE ECOSYSTEM GRID */}
        <section id="roles" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="section-badge bg-orange-500/10 text-orange-400 border border-orange-500/30">
              Ecosystem Roles
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              One Platform, <span className="gradient-text-orange">4 Custom Experiences</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Customer */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🛒</span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg">Mobile App</span>
                </div>
                <h3 className="font-extrabold text-lg text-white">Customers</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Browse restaurant menus, add food items to cart, use promo codes, and check out securely via Paystack.
                </p>
              </div>
              <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-400 hover:underline pt-2 inline-block">
                Download APK →
              </a>
            </div>

            {/* Merchant */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🍳</span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-orange-500/20 text-orange-400 rounded-lg">Web Portal</span>
                </div>
                <h3 className="font-extrabold text-lg text-white">Merchants</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Manage live kitchen order queues, edit menu items and prices, chat with customers, and track sales performance.
                </p>
              </div>
              <button onClick={() => { setShowAuthModal(true); setIsRegisterMode(true); setError(null); }} className="text-xs font-bold text-orange-400 hover:underline text-left pt-2 cursor-pointer">
                Register Restaurant →
              </button>
            </div>

            {/* Driver */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🛵</span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg">Mobile App</span>
                </div>
                <h3 className="font-extrabold text-lg text-white">Drivers</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Toggle online status, accept nearby delivery requests, share live GPS position, and fulfill deliveries.
                </p>
              </div>
              <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-400 hover:underline pt-2 inline-block">
                Get Mobile App →
              </a>
            </div>

            {/* Admin */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-3xl">⚡</span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-lg">Web Portal</span>
                </div>
                <h3 className="font-extrabold text-lg text-white">Admins</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Oversee total revenue metrics, approve or suspend merchant accounts, manage user accounts, and view platform reports.
                </p>
              </div>
              <button onClick={() => { setShowAuthModal(true); setIsRegisterMode(false); setError(null); }} className="text-xs font-bold text-purple-400 hover:underline text-left pt-2 cursor-pointer">
                Admin Sign In →
              </button>
            </div>
          </div>
        </section>

        {/* WEB PORTAL SIGN IN SECTION */}
        <section id="portal" className="py-20 sm:py-28 bg-zinc-900/50 border-t border-white/10">
          <div className="max-w-md mx-auto px-4">
            <div className="text-center space-y-3 mb-8">
              <span className="section-badge bg-orange-500/10 text-orange-400 border border-orange-500/30">
                Portal Access
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                Log In or Register Merchant
              </h2>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-zinc-800 shadow-2xl">
              <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    !isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Portal Login
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sign Up Merchant
                </button>
              </div>

              {error && (
                <div className="p-4 mb-5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              {!isRegisterMode ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="qb-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@quickbite.com or merchant@store.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <div>
                    <label className="qb-label">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full text-xs mt-2"
                  >
                    {isLoading ? "Authenticating..." : "Sign In to Web Portal"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterMerchant} className="space-y-4">
                  <div>
                    <label className="qb-label">Owner Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chef John Smith"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <div>
                    <label className="qb-label">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gourmet Burger Hub"
                      value={restaurantNameInput}
                      onChange={(e) => setRestaurantNameInput(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="qb-label">Cuisine</label>
                      <select
                        value={cuisineTypeInput}
                        onChange={(e) => setCuisineTypeInput(e.target.value)}
                        className="qb-input cursor-pointer"
                      >
                        <option value="Burgers & American">Burgers</option>
                        <option value="Pizza & Italian">Pizza</option>
                        <option value="Asian & Sushi">Asian</option>
                        <option value="Grill & Steakhouse">Grill</option>
                      </select>
                    </div>

                    <div>
                      <label className="qb-label">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="email@store.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="qb-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="qb-label">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full text-xs mt-2"
                  >
                    {isLoading ? "Registering..." : "Register Restaurant"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* AUTH MODAL POPUP */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="relative w-full max-w-md bg-[#060608] glass-panel p-8 rounded-3xl border border-zinc-700 shadow-2xl space-y-6">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-1.5 text-center">
                <h3 className="text-xl font-extrabold text-white">
                  {isRegisterMode ? "Register Restaurant" : "Web Portal Login"}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isRegisterMode ? "Partner with QuickBite to receive live orders" : "Sign in with your Merchant or Admin account"}
                </p>
              </div>

              <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    !isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Portal Login
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isRegisterMode ? "bg-orange-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Register Merchant
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {error}
                </div>
              )}

              {!isRegisterMode ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="qb-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@quickbite.com or merchant@store.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <div>
                    <label className="qb-label">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full text-xs mt-2"
                  >
                    {isLoading ? "Authenticating..." : "Sign In to Web Portal"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterMerchant} className="space-y-4">
                  <div>
                    <label className="qb-label">Owner Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chef John Smith"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <div>
                    <label className="qb-label">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gourmet Burger Hub"
                      value={restaurantNameInput}
                      onChange={(e) => setRestaurantNameInput(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="qb-label">Cuisine</label>
                      <select
                        value={cuisineTypeInput}
                        onChange={(e) => setCuisineTypeInput(e.target.value)}
                        className="qb-input cursor-pointer"
                      >
                        <option value="Burgers & American">Burgers</option>
                        <option value="Pizza & Italian">Pizza</option>
                        <option value="Asian & Sushi">Asian</option>
                        <option value="Grill & Steakhouse">Grill</option>
                      </select>
                    </div>

                    <div>
                      <label className="qb-label">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="email@store.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="qb-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="qb-label">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="qb-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full text-xs mt-2"
                  >
                    {isLoading ? "Creating Account..." : "Register Restaurant"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-[#060608] py-12 text-zinc-500 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center font-extrabold text-white text-xs shadow-md">
                QB
              </div>
              <span className="font-extrabold text-white text-sm">QuickBite Platform</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
              <a href="#ecosystem" className="hover:text-zinc-300">Overview</a>
              <a href="#download" className="hover:text-zinc-300 text-emerald-400">Android APK</a>
              <a href="#roles" className="hover:text-zinc-300">Roles</a>
              <a href="#portal" className="hover:text-zinc-300 text-orange-400">Portal Sign In</a>
            </div>

            <p className="text-xs">© 2026 QuickBite Ecosystem.</p>
          </div>
        </footer>
      </div>
    );
  }

  // LOGGED-IN DASHBOARD VIEW FOR MERCHANTS & ADMINS
  return (
    <div className="flex min-h-screen bg-[#08080c] font-sans text-zinc-100 antialiased lg:h-screen lg:overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#09090e] border-r border-white/[0.08] flex-col justify-between hidden lg:flex shadow-2xl z-30">
        <div className="p-6 space-y-6">
          {/* Brand header */}
          <button
            onClick={() => setActiveTab(userRole === "RESTAURANT" ? "kitchen" : "overview")}
            className="flex items-center space-x-3.5 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 group-hover:from-orange-500 group-hover:to-amber-400 flex items-center justify-center font-black text-white text-base shadow-lg shadow-orange-600/30 transition-all border border-orange-400/20">
              QB
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white group-hover:text-orange-400 transition-colors block">QuickBite</span>
              <span className="text-[10px] font-bold text-orange-400/90 uppercase tracking-widest block">Web Portal</span>
            </div>
          </button>

          {/* SLA / Live status indicator */}
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400">System Online</span>
            </div>
            <span className="text-[10px] font-semibold text-zinc-400">99.9%</span>
          </div>

          {/* Navigation Section */}
          <div className="space-y-2">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {userRole === "ADMIN" ? "Platform Control" : "Merchant Operations"}
            </p>
            <nav className="space-y-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`sidebar-nav-item ${activeTab === tab.id ? "active" : ""}`}
                >
                  <NavIcon name={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-white/[0.08] bg-zinc-950/60 space-y-3">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center font-black text-orange-400 text-sm shadow-inner shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="max-w-[140px] min-w-0">
              <p className="text-xs font-bold text-white truncate" title={userName}>{userName}</p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-extrabold bg-zinc-800 text-zinc-400 rounded border border-zinc-700/50 uppercase tracking-wider mt-0.5">
                {userRole === "ADMIN" ? "Super Admin" : "Merchant Partner"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-all border border-red-900/30 cursor-pointer"
          >
            <NavIcon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-[#08080c]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveTab(userRole === "RESTAURANT" ? "kitchen" : "overview")}
              className="min-w-0 flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
                QB
              </div>
              <div className="min-w-0">
                <span className="min-w-0 truncate font-black text-sm text-white block">
                  {userRole === "RESTAURANT" && restaurantName ? restaurantName : "QuickBite"}
                </span>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                  {userRole === "ADMIN" ? "Admin Portal" : "Kitchen POS"}
                </span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="shrink-0 px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <NavIcon name="logout" />
              <span>Exit</span>
            </button>
          </div>

          {/* Clean tab bar with tab-scroll-mask to avoid crowded overflow look */}
          <div className="relative mt-3 pt-1 border-t border-white/[0.06]">
            <nav className="flex gap-2 overflow-x-auto pb-1.5 tab-scroll-mask px-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-pill-item ${activeTab === tab.id ? "active" : ""}`}
                >
                  <NavIcon name={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto bg-[#08080c] p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border-b border-white/[0.08] pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white capitalize leading-tight">
                  {activeTitle}
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  {userRole === "ADMIN" 
                    ? "Platform administration control node and metrics monitor"
                    : "Merchant dashboard portal for managing kitchen queue, menus, profile, and chat"}
                </p>
              </div>
              <div className="text-xs text-zinc-400 font-semibold hidden md:flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SLA Operational: <strong className="text-emerald-400">99.9%</strong></span>
              </div>
            </div>

            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
