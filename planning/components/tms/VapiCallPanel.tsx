"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

type Line    = { role: string; text: string };
type Contact = { id: string; name: string; role: string; initials: string; color: string; assistantId: string };
type View    = "picker" | "call";

const CONTACTS: Contact[] = [
  { id: "logistics",   name: "Rajesh Kumar",   role: "Logistics Manager",       initials: "RK", color: "#1f4ed8", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "transport",   name: "Meera Pillai",   role: "Transportation Manager",   initials: "MP", color: "#23b6a2", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "fleet",       name: "Suresh Reddy",   role: "Fleet Coordinator",        initials: "SR", color: "#d58a16", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
  { id: "carrier",     name: "Anita Desai",    role: "Carrier Relations Head",   initials: "AD", color: "#7c3aed", assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "" },
];

const STATUS_LABEL: Record<string, string> = {
  idle:      "Ready to connect",
  starting:  "Connecting…",
  active:    "Connected",
  speaking:  "Assistant speaking",
  listening: "Listening…",
  ended:     "Call ended",
  error:     "Error",
};

const avatarStyle = (color: string): React.CSSProperties => ({
  width: 40, height: 40, borderRadius: "50%",
  background: color, color: "white",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 13, fontWeight: 700, flexShrink: 0,
});

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 16px", borderBottom: "1px solid var(--border)",
  cursor: "pointer", background: "transparent", width: "100%",
  textAlign: "left", fontFamily: "inherit",
};

export default function VapiCallPanel({ disabled }: { disabled: boolean }) {
  const [view,       setView]       = useState<View>("picker");
  const [contact,    setContact]    = useState<Contact | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [statusKey,  setStatusKey]  = useState("idle");
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [error,      setError]      = useState("");
  const vapiRef   = useRef<Vapi | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    if (!publicKey) return;
    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;
    const v = vapi as any;
    v.on("call-start",  () => { setCallActive(true);  setStatusKey("active");    });
    v.on("speech-start",() => {                        setStatusKey("speaking");  });
    v.on("speech-end",  () => {                        setStatusKey("listening"); });
    v.on("call-end",    () => { setCallActive(false);  setStatusKey("ended");     });
    v.on("error",       (e: any) => {
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
    if (disabled) return;
    setError(""); setTranscript([]);
    setStatusKey("starting"); setContact(c); setView("call");
    if (!vapiRef.current) { setError("VAPI client not ready"); return; }
    vapiRef.current.start(c.assistantId);
  };

  const endCall = () => { vapiRef.current?.stop(); };

  const backToPicker = () => {
    if (callActive) vapiRef.current?.stop();
    setView("picker"); setContact(null);
    setStatusKey("idle"); setTranscript([]); setError("");
  };

  return (
    <div className="card" style={{ marginTop: 20, padding: 0, overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
        background: "linear-gradient(135deg, #0c1020 0%, #1a2340 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        {view === "call" && (
          <button onClick={backToPicker} disabled={callActive}
            className="ghost"
            style={{
              padding: "4px 8px", fontSize: 13, color: "#23b6a2",
              border: "none", background: "none", cursor: callActive ? "not-allowed" : "pointer",
              opacity: callActive ? 0.4 : 1, boxShadow: "none",
            }}>
            ← Back
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#23b6a2" }}>
            AI Voice Call
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {view === "call" && contact ? contact.name : "Select a contact"}
          </div>
          {view === "call" && contact && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{contact.role}</div>
          )}
        </div>
        {view === "call" && (
          <div style={{
            fontSize: 11, fontWeight: 600, color: statusKey === "active" || statusKey === "speaking" || statusKey === "listening" ? "#23b6a2" : "rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.07)", padding: "3px 8px", borderRadius: 6,
          }}>
            {STATUS_LABEL[statusKey]}
          </div>
        )}
      </div>

      {/* PICKER */}
      {view === "picker" && (
        <div>
          <div style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "var(--muted)" }}>
            Logistics &amp; Transport Team
          </div>
          {disabled && (
            <div style={{ margin: "0 16px 10px", padding: "8px 12px", background: "rgba(213,138,22,0.1)", border: "1px solid rgba(213,138,22,0.25)", borderRadius: 8, fontSize: 12, color: "#a16207" }}>
              No red KPIs — calls available but no immediate escalation needed
            </div>
          )}
          {CONTACTS.map((c, i) => (
            <button key={c.id}
              style={{ ...rowStyle, borderBottom: i === CONTACTS.length - 1 ? "none" : "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-strong)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              onClick={() => startCall(c)}>
              <div style={avatarStyle(c.color)}>{c.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{c.role}</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--brand)", flexShrink: 0 }}>📞</span>
            </button>
          ))}
        </div>
      )}

      {/* CALL */}
      {view === "call" && (
        <div>
          {/* Transcript */}
          <div className="chat-body" style={{ maxHeight: 200, padding: "12px 16px" }}>
            {transcript.length === 0 ? (
              <div className="muted" style={{ fontSize: 12, textAlign: "center", paddingTop: 16 }}>
                {statusKey === "starting" ? `Connecting to ${contact?.name ?? ""}…`
                  : statusKey === "ended" ? "Call ended. Tap ← Back to call someone else."
                  : "Transcript will appear here once connected."}
              </div>
            ) : transcript.map((line, i) => (
              <div key={i} style={{ display: "flex", justifyContent: line.role === "user" ? "flex-end" : "flex-start", marginBottom: 6 }}>
                <div className="chat-bubble assistant" style={{
                  maxWidth: "82%",
                  background: line.role === "user" ? "var(--brand)" : "var(--surface-strong)",
                  color: line.role === "user" ? "white" : "var(--ink)",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", opacity: 0.55, marginBottom: 2 }}>
                    {line.role === "user" ? "You" : contact?.name ?? "Assistant"}
                  </div>
                  {line.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="muted" style={{ padding: "0 16px 10px", fontSize: 12, color: "var(--danger)" }}>
              Error: {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            {callActive ? (
              <button onClick={endCall} style={{ flex: 1, background: "var(--danger)", color: "white", boxShadow: "none" }}>
                End Call
              </button>
            ) : statusKey === "ended" ? (
              <>
                <button onClick={() => contact && startCall(contact)} style={{ flex: 1, fontSize: 13 }}>
                  Call Again
                </button>
                <button className="ghost" onClick={backToPicker} style={{ flex: 1, fontSize: 13 }}>
                  ← Back
                </button>
              </>
            ) : (
              <button disabled style={{ flex: 1, opacity: 0.5, cursor: "not-allowed" }}>
                Connecting…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
