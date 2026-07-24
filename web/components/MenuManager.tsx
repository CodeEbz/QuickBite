"use client";

import React, { useState, useEffect } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface ImageUploadResponse {
  imageUrl?: string;
  error?: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function MenuManager() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Burgers");
  const [image, setImage] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/merchant/menu"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch menu.");
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch menu."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchMenu, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      const token = getAdminToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiUrl("/api/merchant/menu/images"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = (await res.json().catch(() => ({}))) as ImageUploadResponse;
      if (!res.ok) throw new Error(data.error || "Failed to upload image.");

      if (!data.imageUrl) throw new Error("Upload succeeded without an image URL.");

      setImage(data.imageUrl);
      setImageFileName(file.name);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload image."));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/merchant/menu"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category,
          image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        }),
      });

      if (!res.ok) throw new Error("Failed to add menu item.");
      
      setName("");
      setDescription("");
      setPrice("");
      setImage("");
      setImageFileName("");
      
      fetchMenu();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add menu item."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddSamples = async () => {
    setIsSubmitting(true);
    setError(null);

    const samples = [
      {
        name: "Signature Double Cheeseburger",
        description: "Double smashed beef patties, sharp cheddar, smoked bacon, house sauce on brioche",
        price: 12.99,
        category: "Burgers",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"
      },
      {
        name: "Crispy Truffle Parmesan Fries",
        description: "Sea-salted potato fries tossed in truffle oil and freshly grated parmesan",
        price: 5.99,
        category: "Burgers",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400"
      },
      {
        name: "Artisan Chocolate Shake",
        description: "Hand-spun cocoa ice cream topped with whipped cream and dark chocolate shavings",
        price: 4.99,
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400"
      }
    ];

    try {
      const token = getAdminToken();
      for (const sample of samples) {
        await fetch(apiUrl("/api/merchant/menu"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sample),
        });
      }
      fetchMenu();
    } catch {
      setError("Failed to add sample products.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl(`/api/merchant/menu/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete item.");
      fetchMenu();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete item."));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Menu Form */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-fit shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Add Menu Item</h3>
          <button
            type="button"
            onClick={handleQuickAddSamples}
            disabled={isSubmitting}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
          >
            + Quick Add Samples
          </button>
        </div>

        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Bacon Cheese Burger"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="10.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="Burgers">Burgers</option>
              <option value="Pizza">Pizza</option>
              <option value="Asian">Asian</option>
              <option value="Desserts">Desserts</option>
              <option value="Drinks">Drinks</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Image</label>
            <label className="flex min-h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-3 py-4 text-center text-sm text-zinc-400 hover:border-orange-500 hover:text-orange-300">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
              />
              {isUploadingImage ? (
                <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
              ) : image ? (
                <span className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Selected dish" className="mx-auto h-24 w-full max-w-48 rounded-lg object-cover border border-zinc-800" />
                  <span className="block text-xs font-bold text-orange-400">{imageFileName || "Uploaded image selected"}</span>
                </span>
              ) : (
                <span>Choose food photo from this computer</span>
              )}
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Image URL Fallback</label>
            <input
              type="text"
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Description</label>
            <textarea
              placeholder="Describe this dish..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500 h-24 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="w-full h-10 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center text-sm cursor-pointer"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Add to Menu"
            )}
          </button>
        </form>
      </div>

      {/* Menu List */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl lg:col-span-2 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Active Menu Catalog</h3>

        {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <span className="w-8 h-8 border-4 border-orange-600/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : menu.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm space-y-3">
            <p>No dishes added to your menu yet.</p>
            <button
              onClick={handleQuickAddSamples}
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              🍔 Populate 3 Sample Dishes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menu.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center space-x-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-800 bg-zinc-800"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm leading-snug">{item.name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">${item.price.toFixed(2)} • {item.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 bg-red-950/20 hover:bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete item"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
