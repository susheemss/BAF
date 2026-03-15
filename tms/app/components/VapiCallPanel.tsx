"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

type TranscriptMessage = {
  role: string;
  transcript: string;
};

export default function VapiCallPanel({
  disabled
}: {
  disabled: boolean;
}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";

  useEffect(() => {
    if (!publicKey) {
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;
    const vapiEvents = vapi as any;

    vapiEvents.on("call-start", () => {
      setIsCallActive(true);
      setStatus("Call started");
    });

    vapiEvents.on("speech-start", () => {
      setStatus("Assistant speaking");
    });

    vapiEvents.on("speech-end", () => {
      setStatus("Listening");
    });

    vapiEvents.on("transcript", (message: any) => {
      if (message?.transcriptType === "final") {
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role ?? "assistant",
            transcript: message.transcript ?? ""
          }
        ]);
      }
    });

    vapiEvents.on("call-end", () => {
      setIsCallActive(false);
      setStatus("Call ended");
    });

    vapiEvents.on("error", (nextError: any) => {
      setError(
        typeof nextError?.message === "string"
          ? nextError.message
          : "Vapi call failed."
      );
      setStatus("Error");
      setIsCallActive(false);
    });

    return () => {
      vapi.stop();
      vapiRef.current = null;
    };
  }, [publicKey]);

  const toggleCall = () => {
    setError("");
    if (!publicKey) {
      setError("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY");
      return;
    }
    if (!assistantId) {
      setError("Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID");
      return;
    }
    if (!vapiRef.current) {
      setError("Vapi client not initialized.");
      return;
    }

    if (isCallActive) {
      vapiRef.current.stop();
      return;
    }

    setTranscript([]);
    setStatus("Starting call...");
    vapiRef.current.start(assistantId);
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="kpi-label">AI Executive Call (Vapi)</div>
      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
        {status}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={toggleCall} disabled={disabled && !isCallActive}>
          {isCallActive ? "End Call" : "Start Call"}
        </button>
        {disabled && !isCallActive ? (
          <button className="ghost" disabled>
            No Red KPIs
          </button>
        ) : null}
      </div>
      {error ? (
        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Error: {error}
        </div>
      ) : null}
      <div className="chat-body" style={{ marginTop: 12, maxHeight: 220 }}>
        {transcript.length === 0 ? (
          <div className="muted" style={{ fontSize: 12 }}>
            Transcript will appear here after the call starts.
          </div>
        ) : (
          transcript.map((line, index) => (
            <div key={`${line.role}-${index}`} className="chat-bubble assistant">
              <strong>{line.role}:</strong> {line.transcript}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
