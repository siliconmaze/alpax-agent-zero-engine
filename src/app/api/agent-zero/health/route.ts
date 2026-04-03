import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? process.env.AGENT_ZERO_API_URL ?? "http://localhost:50080";
  const key = req.nextUrl.searchParams.get("key") ?? process.env.AGENT_ZERO_API_KEY ?? "";

  try {
    const res = await fetch(`${url}/api/health`, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ ok: false }, { status: res.status });
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
