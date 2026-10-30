import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DESTINATIONS = new Set([
  "/turfs",
  "/reset-password",
]);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");

  // Only permit known internal destinations.
  // Reject external URLs, protocol-relative URLs, backslashes,
  // control characters, and unexpected redirect paths.
  const validDestination =
    requestedNext !== null &&
    ALLOWED_DESTINATIONS.has(requestedNext) &&
    !/[\\\u0000-\u001f\u007f]/.test(requestedNext);

  const nextPath = validDestination ? requestedNext : "/turfs";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", request.url)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", request.url)
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
