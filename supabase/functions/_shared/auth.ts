import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function requireAuth(
  req: Request,
): Promise<{ supabase: SupabaseClient; user: User } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  return { supabase, user };
}

export async function requireAdmin(
  req: Request,
): Promise<{ supabase: SupabaseClient; user: User } | Response> {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const { supabase, user } = authResult;
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  return { supabase, user };
}
