import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_VOICE = "alloy";
const DEFAULT_MODEL = "eleven_multilingual_v2";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE;
  const modelId = process.env.ELEVENLABS_TTS_MODEL ?? DEFAULT_MODEL;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const text = (body.text as string) ?? "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "ElevenLabs TTS failed." },
      { status: 500 }
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg" }
  });
}
