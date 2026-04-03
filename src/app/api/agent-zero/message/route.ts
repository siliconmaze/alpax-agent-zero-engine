import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = process.env.AGENT_ZERO_API_URL ?? "http://localhost:50080";
  const key = process.env.AGENT_ZERO_API_KEY ?? "";

  try {
    const res = await fetch(`${url}/api/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
