"use client";

export const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("adminToken");
};

export const getAdminRole = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("adminRole");
};

export const getAdminName = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("adminName");
};

export const setAdminAuth = (token: string, role: string, name: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("adminToken", token);
  sessionStorage.setItem("adminRole", role);
  sessionStorage.setItem("adminName", name);
};

export const clearAdminAuth = () => {
  if (typeof window === "undefined") return;
  sessionStorage.clear();
  localStorage.clear();
};
