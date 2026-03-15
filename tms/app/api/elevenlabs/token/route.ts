import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set." },
      { status: 500 }
    );
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Failed to create ElevenLabs token." },
      { status: 500 }
    );
  }

  const payload = (await response.json()) as { token?: string };
  return NextResponse.json({ token: payload.token ?? "" });
}
