"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminToken } from "../lib/authStorage";
import { apiUrl } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

interface ChatMessage {
  id: number;
  customerEmail: string;
  customerName: string;
  senderRole: string;
  message?: string;
  imageUrl?: string;
  createdAt: string;
}

export default function MerchantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const token = getAdminToken();
      const res = await fetch(apiUrl("/api/chat/merchant"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load chat messages.");
      const data = (await res.json()) as ChatMessage[];
      const list = Array.isArray(data) ? data : [];
      setMessages(list);
      setSelectedCustomer((current) => current || list.at(-1)?.customerEmail || null);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load chat messages."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchMessages, 0);
    const interval = window.setInterval(fetchMessages, 5000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [fetchMessages]);

  const customers = useMemo(() => {
    const map = new Map<string, { email: string; name: string; count: number; last: string }>();
    for (const message of messages) {
      const existing = map.get(message.customerEmail);
      map.set(message.customerEmail, {
        email: message.customerEmail,
        name: message.customerName || message.customerEmail,
        count: (existing?.count || 0) + 1,
        last: message.createdAt,
      });
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.last).getTime() - new Date(a.last).getTime());
  }, [messages]);

  const thread = useMemo(
    () => messages.filter((message) => message.customerEmail === selectedCustomer),
    [messages, selectedCustomer]
  );

  const sendReply = async () => {
    if (!selectedCustomer) return;
    if (!reply.trim() && !file) {
      setError("Type a reply or attach an image.");
      return;
    }

    setIsSending(true);
    try {
      const token = getAdminToken();
      const formData = new FormData();
      formData.append("message", reply.trim());
      if (file) formData.append("file", file);

      const res = await fetch(apiUrl(`/api/chat/merchant/customers/${encodeURIComponent(selectedCustomer)}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to send reply.");

      setMessages((current) => [...current, data as ChatMessage]);
      setReply("");
      setFile(null);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send reply."));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 animate-fade-in">
      <aside className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl h-fit">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Customer Chat</h3>
            <p className="text-xs text-zinc-500 mt-1">Same merchant inbox as mobile.</p>
          </div>
          <button onClick={fetchMessages} className="text-xs font-bold text-orange-400 hover:text-orange-300">Refresh</button>
        </div>

        {customers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-500 text-center">
            No customer conversations yet.
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((customer) => (
              <button
                key={customer.email}
                onClick={() => setSelectedCustomer(customer.email)}
                className={`w-full text-left rounded-xl px-3 py-3 transition-all ${
                  selectedCustomer === customer.email
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <div className="font-bold text-sm truncate">{customer.name}</div>
                <div className={`text-[11px] truncate mt-1 ${selectedCustomer === customer.email ? "text-orange-100" : "text-zinc-500"}`}>
                  {customer.email}
                </div>
                <div className={`text-[10px] mt-2 font-bold ${selectedCustomer === customer.email ? "text-white" : "text-orange-400"}`}>
                  {customer.count} message{customer.count === 1 ? "" : "s"}
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden min-h-[620px] flex flex-col">
        <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">{selectedCustomer || "Select a customer"}</h3>
            <p className="text-xs text-zinc-500 mt-1">Messages poll every 5 seconds, matching the mobile behavior.</p>
          </div>
          {isLoading && <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />}
        </div>

        {error && <div className="mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

        <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-zinc-950/50">
          {!selectedCustomer ? (
            <div className="h-full flex items-center justify-center text-sm text-zinc-500">Choose a customer conversation.</div>
          ) : thread.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-zinc-500">No messages in this thread.</div>
          ) : (
            thread.map((message) => {
              const mine = message.senderRole === "MERCHANT";
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[76%] rounded-2xl px-4 py-3 ${mine ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-100"}`}>
                    <div className={`text-[11px] font-extrabold mb-1 ${mine ? "text-orange-100" : "text-orange-400"}`}>
                      {mine ? "You" : message.customerName || message.customerEmail}
                    </div>
                    {message.message ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p> : null}
                    {message.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={message.imageUrl} alt="Chat attachment" className="mt-2 max-h-56 rounded-xl border border-black/20 object-cover" />
                    ) : null}
                    <div className={`text-[10px] mt-2 ${mine ? "text-orange-100" : "text-zinc-500"}`}>
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-zinc-800 p-4 bg-zinc-900">
          {file && (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-300">
              <span className="truncate">Attached: {file.name}</span>
              <button onClick={() => setFile(null)} className="text-red-400 font-bold">Remove</button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-3 text-xs font-bold text-zinc-300 hover:border-orange-500 hover:text-orange-300 text-center">
              Attach image
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to customer..."
              className="min-h-12 flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
            />
            <button
              onClick={sendReply}
              disabled={isSending || !selectedCustomer}
              className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-orange-500 disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
