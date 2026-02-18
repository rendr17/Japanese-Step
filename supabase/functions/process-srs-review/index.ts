import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vocab_id, quality } = await req.json();

    if (!vocab_id || quality === undefined || quality < 0 || quality > 5) {
      return new Response(JSON.stringify({ error: "Invalid input: vocab_id and quality (0-5) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current SRS log
    const { data: srsLog, error: fetchError } = await supabase
      .from("srs_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("vocab_id", vocab_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // SM-2 Algorithm
    let easeFactor = srsLog?.ease_factor ?? 2.5;
    let interval = srsLog?.interval_days ?? 0;
    let repetitions = srsLog?.repetitions ?? 0;
    let status: string;

    if (quality < 3) {
      // Failed - reset
      repetitions = 0;
      interval = 0;
      status = "learning";
    } else {
      // Success
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        if (quality === 3) {
          interval = Math.round(interval * 1.2);
        } else if (quality === 4) {
          interval = Math.round(interval * easeFactor);
        } else {
          interval = Math.round(interval * easeFactor * 1.3);
        }
      }

      // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      if (repetitions >= 5 && interval >= 21) {
        status = "mastered";
      } else if (repetitions >= 2) {
        status = "review";
      } else {
        status = "learning";
      }
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const updateData = {
      ease_factor: Math.round(easeFactor * 100) / 100,
      interval_days: interval,
      repetitions,
      status,
      next_review_date: nextReviewDate.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    };

    if (srsLog) {
      const { error: updateError } = await supabase
        .from("srs_logs")
        .update(updateData)
        .eq("id", srsLog.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("srs_logs")
        .insert({
          user_id: user.id,
          vocab_id,
          ...updateData,
        });
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({
      next_review_date: nextReviewDate.toISOString(),
      interval_days: interval,
      ease_factor: updateData.ease_factor,
      repetitions,
      status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("SRS Review error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
