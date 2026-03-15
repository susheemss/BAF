"use client";

import { useState } from "react";
import { Bot, MessageCircle, SendHorizonal, X } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function FloatingCopilot() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("What is the top operational risk right now?");
  const [answer, setAnswer] = useState("Ask a scoped question by warehouse, flow, or shift.");
  const [loading, setLoading] = useState(false);

  const runCopilot = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/copilot/chat", { message: prompt });
      setAnswer(data?.answer || "No answer returned.");
    } catch {
      setAnswer("Copilot is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40">
      {open && (
        <div className="pointer-events-auto mb-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-content-center rounded-lg bg-brand-primary text-white">
                <Bot size={14} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Assistant</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">WDE Copilot</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={14} />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {loading ? "Analyzing..." : answer}
          </div>

          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
            <textarea
              className="w-full resize-none rounded-lg border border-slate-200 p-2 text-sm text-slate-900 outline-none focus:border-brand-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={runCopilot}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                <SendHorizonal size={13} /> {loading ? "Thinking..." : "Ask"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-brand-primary bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
      >
        <MessageCircle size={16} />
        Copilot
      </button>
    </div>
  );
}
