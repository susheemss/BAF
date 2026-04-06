"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

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

const STORAGE_KEY = "vapi_transcripts_tms";

const CONTACTS: Contact[] = [
  { id: "logistics",  name: "Rajesh Kumar",  role: "Logistics Manager",      initials: "RK", color: "#1f4ed8", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "transport",  name: "Meera Pillai",  role: "Transportation Manager",  initials: "MP", color: "#23b6a2", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "fleet",      name: "Suresh Reddy",  role: "Fleet Coordinator",       initials: "SR", color: "#d58a16", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "carrier",    name: "Anita Desai",   role: "Carrier Relations Head",  initials: "AD", color: "#7c3aed", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
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

  const goBack = () => {
    if (view === "detail") { setView("history"); setDetailCall(null); }
    else if (view === "call") backToPicker();
    else setView("picker");
  };

  const s = {
    panel: { position: "fixed" as const, bottom: 88, right: 24, zIndex: 50, width: 320, maxHeight: 520, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", display: "flex", flexDirection: "column" as const },
    header: { display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "linear-gradient(135deg,#0c1020,#1a2340)", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 as const },
    fab: { position: "fixed" as const, bottom: 24, right: 24, zIndex: 50, width: 54, height: 54, borderRadius: "50%", background: callActive ? "var(--accent)" : "var(--brand)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 18px 30px rgba(31,78,216,0.28)", transition: "transform 0.15s" },
    sectionLabel: { padding: "10px 16px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "var(--muted)" },
    row: (last: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", width: "100%", textAlign: "left" as const, background: "transparent", border: "none", borderBottom: last ? "none" : "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit" }),
    avatar: (color: string): React.CSSProperties => ({ width: 38, height: 38, borderRadius: "50%", background: color, color: "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }),
    bubble: (isUser: boolean): React.CSSProperties => ({ maxWidth: "82%", padding: "8px 12px", borderRadius: 12, fontSize: 12, lineHeight: 1.5, background: isUser ? "var(--brand)" : "var(--surface-strong)", color: isUser ? "white" : "var(--ink)" }),
  };

  return (
    <>
      {open && (
        <div style={s.panel}>
          {/* Header */}
          <div style={s.header}>
            {view !== "picker" && (
              <button onClick={goBack} disabled={view === "call" && callActive}
                style={{ background: "none", border: "none", color: "#23b6a2", cursor: (view === "call" && callActive) ? "not-allowed" : "pointer", opacity: (view === "call" && callActive) ? 0.4 : 1, padding: "0 2px", fontFamily: "inherit", boxShadow: "none", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                ← Back
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#23b6a2" }}>AI Voice Call</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {view === "call" && contact ? contact.name : view === "history" ? "Call Transcripts" : view === "detail" && detailCall ? detailCall.contactName : "Select a contact"}
              </div>
              {view === "call"   && contact    && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{contact.role}</div>}
              {view === "detail" && detailCall && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{fmtDate(detailCall.startedAt)}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {view === "call" && (
                <div style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.07)", color: ["active","speaking","listening"].includes(statusKey) ? "#23b6a2" : "rgba(255,255,255,0.4)" }}>
                  {STATUS_LABEL[statusKey]}
                </div>
              )}
              {view === "picker" && history.length > 0 && (
                <button onClick={() => setView("history")}
                  style={{ position: "relative", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 2, boxShadow: "none", fontSize: 15 }}
                  title="Call history">
                  📋
                  <span style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, background: "#ef4444", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {Math.min(history.length, 9)}
                  </span>
                </button>
              )}
              <button onClick={handleClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0, boxShadow: "none", fontFamily: "inherit" }}>✕</button>
            </div>
          </div>

          {/* PICKER */}
          {view === "picker" && (
            <div style={{ overflowY: "auto", flex: 1 }}>
              <div style={s.sectionLabel}>Logistics &amp; Transport Team</div>
              {CONTACTS.map((c, i) => (
                <button key={c.id} style={s.row(i === CONTACTS.length - 1)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-strong)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => startCall(c)}>
                  <div style={s.avatar(c.color)}>{c.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{c.role}</div>
                  </div>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📞</span>
                </button>
              ))}
            </div>
          )}

          {/* HISTORY */}
          {view === "history" && (
            <div style={{ overflowY: "auto", flex: 1 }}>
              {history.length === 0 ? (
                <div className="muted" style={{ textAlign: "center", padding: "40px 20px", fontSize: 13 }}>No transcripts yet. Completed calls are saved here automatically.</div>
              ) : history.map((call, i) => (
                <button key={call.id} style={s.row(i === history.length - 1)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-strong)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => { setDetailCall(call); setView("detail"); }}>
                  <div style={s.avatar(call.contactColor)}>{call.contactInitials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{call.contactName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>🕐 {fmtDate(call.startedAt)} · {call.lines.length} msgs</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteCall(call.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, padding: "2px 4px", boxShadow: "none", flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                    🗑
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* DETAIL */}
          {view === "detail" && detailCall && (
            <div className="chat-body" style={{ flex: 1, overflowY: "auto", padding: "12px 14px", gap: 8, display: "flex", flexDirection: "column" }}>
              {detailCall.lines.map((line, i) => (
                <div key={i} style={{ display: "flex", justifyContent: line.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={s.bubble(line.role === "user")}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", opacity: 0.5, marginBottom: 3 }}>
                      {line.role === "user" ? "You" : detailCall.contactName}
                    </div>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CALL */}
          {view === "call" && (
            <>
              <div className="chat-body" style={{ flex: 1, maxHeight: 200, overflowY: "auto", padding: "12px 14px", gap: 8, display: "flex", flexDirection: "column" }}>
                {transcript.length === 0 ? (
                  <div className="muted" style={{ fontSize: 12, textAlign: "center", paddingTop: 20 }}>
                    {statusKey === "starting" ? `Connecting to ${contact?.name ?? ""}…`
                      : statusKey === "ended" ? "Call saved to transcript history ✓"
                      : "Transcript will appear here once connected."}
                  </div>
                ) : transcript.map((line, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: line.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={s.bubble(line.role === "user")}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", opacity: 0.5, marginBottom: 3 }}>
                        {line.role === "user" ? "You" : contact?.name ?? "Assistant"}
                      </div>
                      {line.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {error && (
                <div style={{ margin: "0 14px 10px", padding: "8px 12px", background: "rgba(208,71,60,0.1)", border: "1px solid rgba(208,71,60,0.25)", borderRadius: 8, fontSize: 12, color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
                {callActive ? (
                  <button onClick={endCall} style={{ flex: 1, background: "var(--danger)", color: "white", border: "none", borderRadius: 12, padding: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 14, boxShadow: "none" }}>
                    End Call
                  </button>
                ) : statusKey === "ended" ? (
                  <>
                    <button onClick={() => contact && startCall(contact)}
                      style={{ flex: 1, borderRadius: 12, padding: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13, background: "linear-gradient(135deg,var(--brand),var(--brand-strong))", color: "white", border: "none", boxShadow: "0 8px 16px rgba(20,54,161,0.2)" }}>
                      Call Again
                    </button>
                    <button onClick={() => setView("history")} className="ghost"
                      style={{ flex: 1, borderRadius: 12, padding: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                      View Log 📋
                    </button>
                  </>
                ) : (
                  <button disabled style={{ flex: 1, borderRadius: 12, padding: 10, fontFamily: "inherit", fontSize: 14, background: "rgba(31,78,216,0.1)", color: "var(--brand)", border: "none", cursor: "not-allowed", opacity: 0.7 }}>
                    Connecting…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button style={s.fab}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.07)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        onClick={() => setOpen(o => !o)} title="AI Voice Call">
        {callActive ? "🎙" : "📞"}
        {!callActive && history.length > 0 && !open && (
          <span style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: "#ef4444", borderRadius: "50%", fontSize: 10, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Math.min(history.length, 9)}
          </span>
        )}
        {callActive && (
          <span style={{ position: "absolute", width: 54, height: 54, borderRadius: "50%", border: "2px solid var(--accent)", animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.5 }} />
        )}
      </button>

      <style>{`@keyframes ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.7);opacity:0}}`}</style>
    </>
  );
}
