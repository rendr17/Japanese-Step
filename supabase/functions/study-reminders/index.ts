import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, email_reminders, srs_reminders, study_reminder_time")
      .eq("email_reminders", true);

    const reminders: Array<{ user_id: string; type: string; message: string }> = [];

    for (const profile of profiles ?? []) {
      const { count: dueCount } = await supabase
        .from("srs_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .lte("next_review_date", new Date().toISOString())
        .neq("status", "mastered");

      if (profile.srs_reminders && (dueCount ?? 0) > 0) {
        reminders.push({
          user_id: profile.id,
          type: "srs_due",
          message: `Kamu punya ${dueCount} flashcard due untuk direview hari ini.`,
        });
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: xpLog } = await supabase
        .from("daily_xp_logs")
        .select("xp_earned")
        .eq("user_id", profile.id)
        .eq("date", today)
        .maybeSingle();

      if (!xpLog || (xpLog.xp_earned ?? 0) === 0) {
        reminders.push({
          user_id: profile.id,
          type: "daily_study",
          message: "Jangan lupa belajar hari ini! Capai target XP harianmu.",
        });
      }
    }

    return new Response(JSON.stringify({ sent: reminders.length, reminders }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("study-reminders error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
