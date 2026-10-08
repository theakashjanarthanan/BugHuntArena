import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  return NextResponse.json({
    authenticated: session?.value === "authenticated",
  });
}
