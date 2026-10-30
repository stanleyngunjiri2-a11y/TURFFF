import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLoginDestination } from "@/lib/auth/get-login-destination";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", request.url)
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", request.url)
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", request.url)
    );
  }

  try {
    const destination = await getLoginDestination(
      supabase,
      user.id,
      requestedNext
    );

    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=destination_failed", request.url)
    );
  }
}
