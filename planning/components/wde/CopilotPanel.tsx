"use client";

import { useState } from "react";
import { Bot, SendHorizonal } from "lucide-react";
import { apiClient } from "@/lib/wde/apiClient";

export default function CopilotPanel() {
  const [prompt, setPrompt] = useState("Which suppliers are volatile?");
  const [answer, setAnswer] = useState("Ask a scoped warehouse question.");
  const [loading, setLoading] = useState(false);

  const runCopilot = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/copilot/chat", { message: prompt });
      setAnswer(data.answer || "No answer returned.");
    } catch {
      setAnswer("Copilot is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="control-card p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-content-center rounded-lg bg-brand-primary text-white">
          <Bot size={16} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">AI Assistant</p>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">WDE Copilot</h3>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <span className="typing-dot inline-block h-2 w-2 rounded-full bg-slate-500" />
              <span className="typing-dot inline-block h-2 w-2 rounded-full bg-slate-500" style={{ animationDelay: "0.2s" }} />
              <span className="typing-dot inline-block h-2 w-2 rounded-full bg-slate-500" style={{ animationDelay: "0.4s" }} />
              Analyzing your question...
            </span>
          ) : (
            answer
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
          <textarea
            className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-brand-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={runCopilot}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <SendHorizonal size={14} /> {loading ? "Thinking..." : "Ask Copilot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
