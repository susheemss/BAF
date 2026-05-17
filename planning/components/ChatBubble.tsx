"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED = [
  "Which carrier has the highest delay rate?",
  "What is the average shipment cost?",
  "Which route has the most delays?",
  "What is the most common mode of transport?",
];

// Extend Window for webkit speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function ChatBubble() {
  const [open, setOpen]               = useState(false);
  const [input, setInput]             = useState("");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loading, setLoading]         = useState(false);
  const [listening, setListening]     = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speaking, setSpeaking]       = useState(false);

  const bottomRef        = useRef<HTMLDivElement>(null);
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const recognitionRef   = useRef<SpeechRecognition | null>(null);
  const isSendingRef     = useRef(false);
  const finalTranscript  = useRef("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, liveTranscript]);

  // ── Auto-play ElevenLabs for every assistant message ──────────────────────
  const speakText = useCallback(async (text: string) => {
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setSpeaking(false);
    } catch {
      setSpeaking(false);
    }
  }, []);

  // ── Send message to AI ─────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading || isSendingRef.current) return;
    isSendingRef.current = true;
    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLiveTranscript("");
    finalTranscript.current = "";
    setLoading(true);

    try {
      const res    = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data   = await res.json();
      const answer = data.answer ?? "Sorry, I could not get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      // Auto-speak the reply
      speakText(answer);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  }, [loading, messages, speakText]);

  // ── Voice input ────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition is not supported in this browser. Please use Chrome or Edge."); return; }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart  = () => setListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final   = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const current = final || interim;
      setLiveTranscript(current);
      if (final) {
        finalTranscript.current = final;
        setInput(final);
      }
    };

    recognition.onend = () => {
      setListening(false);
      const text = finalTranscript.current.trim();
      if (text) send(text);
    };

    recognition.onerror = () => setListening(false);

    recognition.start();
  }, [send]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const stopSpeaking = () => {
    audioRef.current?.pause();
    setSpeaking(false);
  };

  const clear = () => {
    setMessages([]);
    setInput("");
    setLiveTranscript("");
    stopSpeaking();
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white text-2xl transition-transform hover:scale-110"
        style={{ background: "linear-gradient(135deg, #00B3A4, #0B1F3B)" }}
        title="AI Supply Chain Assistant"
      >
        {open ? "✕" : "✦"}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-24 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 390, height: 540, background: "#F8FAFC", border: "1px solid #E2E8F0" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "#0B1F3B" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">✦</span>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">AI Supply Chain Assistant</p>
                <p className="text-xs" style={{ color: "#00B3A4" }}>Powered by your Supply Chain data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {speaking && (
                <button onClick={stopSpeaking}
                  className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "#00B3A4", color: "#0B1F3B", fontWeight: 600 }}>
                  ⏹ Stop
                </button>
              )}
              <button onClick={clear} className="text-xs text-slate-400 hover:text-white transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !liveTranscript && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 text-center pt-2">
                  Type or speak your supply chain question
                </p>
                <div className="space-y-2">
                  {SUGGESTED.map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50 transition-colors text-slate-600">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "#0B1F3B", color: "#fff", borderBottomRightRadius: 4 }
                      : { background: "#fff", color: "#2D3A4A", border: "1px solid #E2E8F0", borderBottomLeftRadius: 4 }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Live voice transcript */}
            {liveTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed italic"
                  style={{ background: "#0B1F3B80", color: "#fff", borderBottomRightRadius: 4 }}>
                  🎙 {liveTranscript}
                </div>
              </div>
            )}

            {/* Speaking indicator */}
            {speaking && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-xs bg-white border border-teal-200 text-teal-600 flex items-center gap-2">
                  <span className="animate-pulse">🔊</span> Speaking...
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-xl text-sm bg-white border border-slate-200 text-slate-400">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-slate-200 bg-white flex gap-2 items-center">
            {/* Mic button */}
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onClick={listening ? stopListening : startListening}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={
                listening
                  ? { background: "#EF4444", color: "#fff", boxShadow: "0 0 0 4px rgba(239,68,68,0.2)" }
                  : { background: "#F0F4F8", color: "#6B7A90" }
              }
              title={listening ? "Click to stop" : "Click to speak"}
            >
              🎙
            </button>

            <input
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-teal-400 text-slate-800 placeholder-slate-400"
              placeholder={listening ? "Listening..." : "Ask or click 🎙 to speak..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              disabled={loading || listening}
            />

            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim() || listening}
              className="px-3 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-40 flex-shrink-0"
              style={{ background: "#00B3A4" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
