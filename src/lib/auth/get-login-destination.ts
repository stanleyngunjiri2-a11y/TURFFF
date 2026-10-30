import type { SupabaseClient } from "@supabase/supabase-js";

export async function getLoginDestination(
  supabase: SupabaseClient,
  userId: string,
  requestedNext?: string | null
): Promise<string> {
  if (requestedNext === "/reset-password") {
    return "/reset-password";
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Unable to determine your account permissions.");
  }

  if (profile.role === "superadmin") {
    return "/admin/dashboard";
  }

  if (profile.role === "turf_owner") {
    return "/owner/dashboard";
  }

  if (profile.role === "footballer") {
    const { data: application, error: applicationError } = await supabase
      .from("owner_applications")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (applicationError) {
      throw new Error("Unable to check your owner application.");
    }

    if (
      application?.status === "pending" ||
      application?.status === "rejected"
    ) {
      return "/owner/apply";
    }

    if (
      requestedNext === "/owner/apply" ||
      requestedNext === "/owner/dashboard"
    ) {
      return "/owner/apply";
    }

    return "/turfs";
  }

  throw new Error("Your account has an unsupported role.");
}
