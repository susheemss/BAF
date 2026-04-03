"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { Phone, PhoneOff, X, Mic, MicOff, Volume2, ChevronLeft, Clock, FileText, Trash2 } from "lucide-react";

type Line    = { role: string; text: string };
type Contact = { id: string; name: string; role: string; initials: string; color: string; assistantId: string };
type View    = "picker" | "call" | "history" | "detail";

type SavedCall = {
  id: string;
  contactName: string; contactRole: string;
  contactInitials: string; contactColor: string;
  startedAt: string;
  lines: Line[];
};

const STORAGE_KEY = "vapi_transcripts_wde";

const CONTACTS: Contact[] = [
  { id: "wh-mgr",   name: "Vikram Singh", role: "Warehouse Manager",  initials: "VS", color: "#0B1F3B", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "ops-head", name: "Deepa Nair",   role: "Operations Head",    initials: "DN", color: "#00B3A4", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "inbound",  name: "Amit Verma",   role: "Inbound Supervisor", initials: "AV", color: "#6366F1", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "dispatch", name: "Neha Joshi",   role: "Dispatch Manager",   initials: "NJ", color: "#F59E0B", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
];

const STATUS_LABEL: Record<string, string> = {
  idle: "Ready to connect", starting: "Connecting…", active: "Connected",
  speaking: "Assistant speaking", listening: "Listening…", ended: "Call ended", error: "Error",
};

function loadHistory(): SavedCall[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(calls: SavedCall[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function VapiWidget() {
  const [open,       setOpen]       = useState(false);
  const [view,       setView]       = useState<View>("picker");
  const [contact,    setContact]    = useState<Contact | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [statusKey,  setStatusKey]  = useState("idle");
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [error,      setError]      = useState("");
  const [history,    setHistory]    = useState<SavedCall[]>([]);
  const [detailCall, setDetailCall] = useState<SavedCall | null>(null);
  const vapiRef       = useRef<Vapi | null>(null);
  const bottomRef     = useRef<HTMLDivElement | null>(null);
  const callStartRef  = useRef<string>("");
  const contactRef    = useRef<Contact | null>(null);
  const transcriptRef = useRef<Line[]>([]);

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";

  useEffect(() => { contactRef.current = contact; }, [contact]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { setHistory(loadHistory()); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [transcript]);

  useEffect(() => {
    if (!publicKey) return;
    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;
    const v = vapi as any;
    v.on("call-start",  () => { callStartRef.current = new Date().toISOString(); setCallActive(true); setStatusKey("active"); });
    v.on("speech-start",() => setStatusKey("speaking"));
    v.on("speech-end",  () => setStatusKey("listening"));
    v.on("call-end",    () => {
      setCallActive(false); setStatusKey("ended");
      const c = contactRef.current;
      const lines = transcriptRef.current;
      if (c && lines.length > 0) {
        const saved: SavedCall = {
          id: Date.now().toString(),
          contactName: c.name, contactRole: c.role,
          contactInitials: c.initials, contactColor: c.color,
          startedAt: callStartRef.current || new Date().toISOString(),
          lines,
        };
        setHistory(prev => { const next = [saved, ...prev]; saveHistory(next); return next; });
      }
    });
    v.on("error", (e: any) => {
      setError(typeof e?.message === "string" ? e.message : "Call failed");
      setStatusKey("error"); setCallActive(false);
    });
    v.on("message", (msg: any) => {
      if (msg?.type !== "transcript" || msg?.transcriptType !== "final") return;
      setTranscript(prev => [...prev, { role: msg.role ?? "assistant", text: msg.transcript ?? "" }]);
    });
    return () => { vapi.stop(); vapiRef.current = null; };
  }, [publicKey]);

  const startCall = (c: Contact) => {
    setError(""); setTranscript([]); setStatusKey("starting"); setContact(c); setView("call");
    if (!vapiRef.current) { setError("VAPI client not ready"); return; }
    vapiRef.current.start(c.assistantId);
  };
  const endCall = () => vapiRef.current?.stop();
  const backToPicker = () => {
    if (callActive) vapiRef.current?.stop();
    setView("picker"); setContact(null); setStatusKey("idle"); setTranscript([]); setError("");
  };
  const handleClose = () => {
    if (callActive) vapiRef.current?.stop();
    setOpen(false); setView("picker"); setContact(null); setStatusKey("idle"); setTranscript([]); setError("");
  };
  const deleteCall = (id: string) => {
    setHistory(prev => { const next = prev.filter(c => c.id !== id); saveHistory(next); return next; });
    if (detailCall?.id === id) { setDetailCall(null); setView("history"); }
  };

  // shared inline styles
  const BG  = "#0B1F3B";
  const ACC = "#00B3A4";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col"
          style={{ maxHeight: "540px", boxShadow: "0 24px 60px rgba(11,31,59,0.22)", border: "1px solid rgba(11,31,59,0.12)" }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${BG} 0%, #0d2a50 100%)` }}>
            {(view !== "picker") && (
              <button onClick={() => {
                if (view === "detail") { setView("history"); setDetailCall(null); }
                else if (view === "call") backToPicker();
                else setView("picker");
              }}
                disabled={view === "call" && callActive}
                style={{ background: "none", border: "none", color: ACC, cursor: "pointer", padding: "0 2px", opacity: (view === "call" && callActive) ? 0.4 : 1, flexShrink: 0 }}>
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACC }}>AI Voice Call</p>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {view === "call" && contact ? contact.name
                  : view === "history" ? "Call Transcripts"
                  : view === "detail" && detailCall ? detailCall.contactName
                  : "Select a contact"}
              </p>
              {view === "call" && contact && <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{contact.role}</p>}
              {view === "detail" && detailCall && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{fmtDate(detailCall.startedAt)}</p>}
            </div>
            <div className="flex items-center gap-2">
              {view === "picker" && history.length > 0 && (
                <button onClick={() => setView("history")} className="relative" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 2 }} title="Call history">
                  <FileText size={15} />
                  <span style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, background: "#ef4444", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {Math.min(history.length, 9)}
                  </span>
                </button>
              )}
              <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 0 }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* PICKER */}
          {view === "picker" && (
            <div className="flex-1 overflow-y-auto dark:bg-slate-900">
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Warehouse Operations Team</p>
              {CONTACTS.map((c) => (
                <button key={c.id} onClick={() => startCall(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors hover:bg-teal-50 dark:hover:bg-slate-800">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ background: c.color }}>{c.initials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.role}</p>
                  </div>
                  <Phone size={14} style={{ color: ACC, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {/* HISTORY */}
          {view === "history" && (
            <div className="flex-1 overflow-y-auto dark:bg-slate-900">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-10 px-6 leading-relaxed">No transcripts yet. Completed calls are saved here automatically.</p>
              ) : history.map((call) => (
                <button key={call.id} onClick={() => { setDetailCall(call); setView("detail"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors hover:bg-teal-50 dark:hover:bg-slate-800">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: call.contactColor }}>{call.contactInitials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{call.contactName}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <Clock size={10} className="flex-shrink-0" />
                      {fmtDate(call.startedAt)} · {call.lines.length} msgs
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteCall(call.id); }}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* DETAIL */}
          {view === "detail" && detailCall && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 dark:bg-slate-900">
              {detailCall.lines.map((line, i) => (
                <div key={i} className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    line.role !== "user" ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm" : "rounded-br-sm text-white"
                  }`} style={line.role === "user" ? { background: BG } : {}}>
                    <span className="block text-[10px] font-semibold mb-0.5 uppercase tracking-wide opacity-50">
                      {line.role === "user" ? "You" : detailCall.contactName}
                    </span>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CALL */}
          {view === "call" && (
            <>
              <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0"
                style={{ background: `rgba(0,179,164,0.07)`, borderBottom: `1px solid rgba(0,179,164,0.14)` }}>
                {callActive
                  ? statusKey === "speaking" ? <Volume2 size={12} style={{ color: ACC }} className="flex-shrink-0" />
                    : <Mic size={12} className="text-emerald-500 flex-shrink-0" />
                  : <MicOff size={12} className="text-slate-400 flex-shrink-0" />}
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{STATUS_LABEL[statusKey]}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[140px] dark:bg-slate-900">
                {transcript.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center mt-8 leading-relaxed">
                    {statusKey === "starting" ? `Connecting to ${contact?.name ?? ""}…`
                      : statusKey === "ended" ? "Call saved to transcript history ✓"
                      : "Speak to start the conversation"}
                  </p>
                ) : transcript.map((line, i) => (
                  <div key={i} className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      line.role !== "user" ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm" : "rounded-br-sm text-white"
                    }`} style={line.role === "user" ? { background: BG } : {}}>
                      <span className="block text-[10px] font-semibold mb-0.5 uppercase tracking-wide opacity-50">
                        {line.role === "user" ? "You" : contact?.name ?? "Assistant"}
                      </span>
                      {line.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {error && <div className="mx-3 mb-2 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#b91c1c" }}>{error}</div>}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 flex-shrink-0">
                {callActive ? (
                  <button onClick={endCall} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#EF4444" }}>
                    <PhoneOff size={14} /> End Call
                  </button>
                ) : statusKey === "ended" ? (
                  <>
                    <button onClick={() => contact && startCall(contact)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: BG }}>
                      <Phone size={14} /> Call Again
                    </button>
                    <button onClick={() => setView("history")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all">
                      <FileText size={14} /> View Log
                    </button>
                  </>
                ) : (
                  <button disabled className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed" style={{ background: `rgba(0,179,164,0.12)`, color: ACC }}>
                    <Mic size={14} /> Connecting…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-white"
        style={{ background: callActive ? ACC : BG }} title="AI Voice Call">
        {callActive ? <Mic size={22} /> : <Phone size={22} />}
        {callActive && <span className="absolute w-14 h-14 rounded-full animate-ping opacity-50" style={{ border: `2px solid ${ACC}` }} />}
        {!callActive && history.length > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {Math.min(history.length, 9)}
          </span>
        )}
      </button>
    </div>
  );
}
