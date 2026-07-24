"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { formatRating } from "../lib/format";

interface RestaurantProfile {
  id: number;
  name: string;
  email: string;
  ownerName: string;
  status: string;
  image?: string;
  rating?: number | string;
  cuisineType?: string;
}

export default function MerchantProfile() {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [name, setName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [image, setImage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback((data: RestaurantProfile) => {
    setProfile(data);
    setName(data.name || "");
    setCuisineType(data.cuisineType || "");
    setImage(data.image || "");
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/merchant/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load merchant profile.");
      hydrate(await res.json());
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load merchant profile."));
    } finally {
      setIsLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    const timer = window.setTimeout(fetchProfile, 0);
    return () => window.clearTimeout(timer);
  }, [fetchProfile]);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const token = getAdminToken();
      let nextImage = image;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const upload = await fetch(apiUrl("/api/merchant/profile/image"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploaded = await upload.json().catch(() => ({}));
        if (!upload.ok) throw new Error(uploaded.error || uploaded.message || "Failed to upload profile image.");
        nextImage = uploaded.image || uploaded.imageUrl || nextImage;
      }

      const res = await fetch(apiUrl("/api/merchant/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), cuisineType: cuisineType.trim(), image: nextImage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to save profile.");
      hydrate(data as RestaurantProfile);
      setFile(null);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save profile."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 flex justify-center"><span className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 animate-fade-in">
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
        <h3 className="text-lg font-bold text-white">Restaurant Profile</h3>
        <p className="text-xs text-zinc-500 mt-1">Matches the mobile merchant profile controls.</p>

        {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-bold text-zinc-400 uppercase">Restaurant Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500" />

          <label className="block text-xs font-bold text-zinc-400 uppercase">Cuisine Type</label>
          <input value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500" />

          <label className="block text-xs font-bold text-zinc-400 uppercase">Image URL</label>
          <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500" />

          <label className="block cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-4 py-5 text-center text-sm text-zinc-400 hover:border-orange-500 hover:text-orange-300">
            {file ? file.name : "Choose new cover photo"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>

          <button onClick={saveProfile} disabled={isSaving} className="w-full rounded-xl bg-orange-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-orange-500 disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name || "Restaurant"} className="h-72 w-full object-cover" />
          ) : (
            <div className="h-72 flex items-center justify-center text-zinc-600">No restaurant image</div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 font-bold uppercase">Status</p>
            <p className="mt-2 text-lg font-extrabold text-emerald-400">{profile?.status || "Unknown"}</p>
          </div>
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 font-bold uppercase">Rating</p>
            <p className="mt-2 text-lg font-extrabold text-yellow-400">★ {formatRating(profile?.rating || 0)}</p>
          </div>
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 font-bold uppercase">Owner</p>
            <p className="mt-2 text-lg font-extrabold text-white truncate">{profile?.ownerName || "Owner"}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 font-bold uppercase">Account Email</p>
          <p className="mt-2 text-sm font-bold text-zinc-200">{profile?.email}</p>
        </div>
      </section>
    </div>
  );
}
