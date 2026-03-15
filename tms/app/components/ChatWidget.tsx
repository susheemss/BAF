"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! Ask me about KPIs or alerts." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [voiceBusy, setVoiceBusy] = useState(false);

  const downloadErrorScreenshot = async () => {
    if (!panelRef.current || !lastError) {
      return;
    }
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(panelRef.current, {
      backgroundColor: "#ffffff",
      scale: 2
    });
    const link = document.createElement("a");
    link.download = `chat-error-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const stopVoice = () => {
    wsRef.current?.close();
    wsRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    setVoiceActive(false);
    setVoiceError("");
    setVoiceTranscript("");
    setVoiceReply("");
    setVoiceBusy(false);
  };

  const pcmToBase64 = (pcm: Int16Array) => {
    const bytes = new Uint8Array(pcm.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleVoiceTranscript = async (transcript: string) => {
    try {
      const response = await fetch("/api/lyzr/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Respond only in English." },
            { role: "user", content: transcript }
          ],
          sessionId: `voice-${Date.now()}`
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Lyzr chat failed.");
      }
      const reply = payload.reply ?? "";
      setVoiceReply(reply);

      const ttsResponse = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply })
      });
      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        throw new Error(errText || "TTS failed.");
      }
      const audioBlob = await ttsResponse.blob();
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = URL.createObjectURL(audioBlob);
      await audioRef.current.play();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Voice response failed.";
      setVoiceError(message);
    } finally {
      setVoiceBusy(false);
    }
  };

  const startVoice = async () => {
    if (voiceActive) {
      return;
    }
    setVoiceTranscript("");
    setVoiceError("");
    try {
      const tokenResponse = await fetch("/api/elevenlabs/token", {
        method: "POST"
      });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenPayload.error ?? "Token request failed.");
      }
      const token = tokenPayload.token as string;
      if (!token) {
        throw new Error("Missing ElevenLabs token.");
      }

      const wsUrl =
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime` +
        `?model_id=scribe_v2_realtime` +
        `&audio_format=pcm_16000` +
        `&commit_strategy=vad` +
        `&vad_silence_threshold_secs=1.2` +
        `&vad_threshold=0.4` +
        `&min_speech_duration_ms=120` +
        `&min_silence_duration_ms=120` +
        `&token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.message_type === "partial_transcript") {
            setVoiceTranscript(payload.text ?? "");
          }
          if (payload.message_type === "committed_transcript") {
            const transcript = payload.text ?? "";
            setVoiceTranscript(transcript);
            if (transcript.trim() && !voiceBusy) {
              setVoiceBusy(true);
              stopVoice();
              void handleVoiceTranscript(transcript);
            }
          }
        } catch {
          return;
        }
      };

      ws.onerror = () => {
        setVoiceError("ElevenLabs STT WebSocket error.");
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }
        const input = event.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i += 1) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 32768 : s * 32767;
        }
        const audio_base_64 = pcmToBase64(pcm);
        wsRef.current.send(
          JSON.stringify({
            message_type: "input_audio_chunk",
            audio_base_64,
            sample_rate: 16000
          })
        );
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setVoiceActive(true);
    } catch (error) {
      stopVoice();
      const message =
        error instanceof Error ? error.message : "Voice connection failed.";
      setVoiceError(message);
    }
  };

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed }
    ];
    setMessages(nextMessages);
    setLastError("");
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/lyzr/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });
      const rawBody = await response.text();
      let payload: { reply?: string; error?: string } | null = null;
      try {
        payload = JSON.parse(rawBody) as { reply?: string; error?: string };
      } catch {
        payload = null;
      }
      if (!response.ok) {
        const errorMessage =
          payload?.error ??
          `Chat failed (${response.status}). ${rawBody || "The server returned an empty response."}`;
        throw new Error(errorMessage);
      }
      setMessages([
        ...nextMessages,
        { role: "assistant", content: payload?.reply ?? "" }
      ]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong."
        }
      ]);
      setLastError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      {open ? (
        <div className="chat-panel" ref={panelRef}>
          <div className="chat-header">
            <div>
              <div className="chat-title">KPI Assistant</div>
              <div className="chat-subtitle">Ask about trends and alerts</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="ghost"
                onClick={startVoice}
                title="Start voice"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                Mic
              </button>
              {voiceActive ? (
                <button className="ghost" onClick={stopVoice} title="Stop voice">
                  Stop
                </button>
              ) : null}
              {lastError ? (
                <button className="ghost" onClick={downloadErrorScreenshot}>
                  Save Error Shot
                </button>
              ) : null}
              <button className="ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="chat-body">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-bubble ${message.role}`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={input}
              placeholder="Ask about OTIF or delay rate..."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            <button onClick={sendMessage} disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </div>
          <div style={{ padding: "0 12px 12px" }}>
            {voiceTranscript ? (
              <div className="muted" style={{ fontSize: 12 }}>
                You said: {voiceTranscript}
              </div>
            ) : null}
            {voiceReply ? (
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Assistant: {voiceReply}
              </div>
            ) : null}
            {voiceError ? (
              <div className="muted" style={{ fontSize: 12 }}>
                Voice error: {voiceError}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <button className="chat-fab" onClick={() => setOpen(true)}>
          Chat
        </button>
      )}
    </div>
  );
}
