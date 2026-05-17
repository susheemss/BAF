"use client";

import { useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function DataChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "How can I help you analyze your supply chain data today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Chat request failed.");
      }
      setMessages([...nextMessages, { role: "assistant", content: payload.reply || "That is not available from the uploaded data." }]);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Chat request failed.";
      setError(message);
      setMessages([...nextMessages, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[34rem] w-[25rem] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/90">Assistant</p>
                <p className="text-sm font-semibold text-white">Supply Chain Analyst</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/70 px-4 py-3">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              <p>Ask about planning, warehouse, transport, KPIs, risks, delays, lanes, or uploaded operational trends.</p>
            </div>
          </div>

          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            {error && (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask a question..."
                className="min-h-[46px] flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={loading}
                className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                title="Send"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-14 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-lg transition ${
          open ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-950 hover:bg-slate-900"
        }`}
      >
        {open ? <X size={18} /> : <MessageSquare size={18} />}
        {open ? "Close Assistant" : "Ask Assistant"}
      </button>
    </div>
  );
}
