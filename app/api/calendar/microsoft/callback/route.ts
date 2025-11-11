// app/api/calendar/microsoft/callback/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.json({ ok: false, error: `OAuth error: ${error}` }, { status: 400 });
    }
    if (!code || !state) {
      return NextResponse.json({ ok: false, error: "Missing code or state" }, { status: 400 });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    } catch {
      parsed = { raw: state };
    }

    // TODO: Exchange `code` with MS token endpoint and store refresh_token for parsed.readerId
    return NextResponse.json({ ok: true, received: { code, parsedState: parsed } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
