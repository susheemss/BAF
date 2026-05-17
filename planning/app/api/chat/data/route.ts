import { NextResponse } from "next/server";
import { buildUnifiedChatContext } from "@/lib/chatData";

type ChatMessage = { role: "user" | "assistant"; content: string };

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not set." }, { status: 500 });
  }

  const body = await request.json();
  const messages = (body.messages as ChatMessage[]) ?? [];
  const userMessages = messages.filter((message) => message.role === "user");

  if (!userMessages.length) {
    return NextResponse.json({ error: "No user message provided." }, { status: 400 });
  }

  const context = await buildUnifiedChatContext();
  const system = [
    "You are a supply chain data assistant for an internal control tower.",
    "Answer strictly and only from the DATA_CONTEXT provided.",
    "Do not use outside knowledge, assumptions, or generic supply chain advice unless it is directly supported by DATA_CONTEXT.",
    "If the answer is not available in DATA_CONTEXT, say exactly: 'That is not available from the uploaded data.'",
    "If a dataset is unavailable, state that clearly.",
    "When citing numbers, use only values from DATA_CONTEXT.",
    "Keep answers concise and factual.",
  ].join(" ");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3002",
      "X-Title": "BAF Unified App",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "system", content: `DATA_CONTEXT:\n${JSON.stringify(context)}` },
        ...messages.slice(-8).map((message) => ({ role: message.role, content: message.content })),
      ],
    }),
  });

  const raw = await response.text();
  let payload: any = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error?.message || raw || "OpenRouter request failed." },
      { status: 500 }
    );
  }

  const reply = payload?.choices?.[0]?.message?.content?.trim() || "That is not available from the uploaded data.";
  return NextResponse.json({ reply });
}
