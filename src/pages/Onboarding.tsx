import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type LearningPath = Database["public"]["Enums"]["learning_path"];

const LEVELS = [
  { value: "none" as const, label: "Pemula", desc: "Baru mulai belajar" },
  { value: "n5" as const, label: "N5", desc: "Dasar-dasar bahasa" },
  { value: "n4" as const, label: "N4", desc: "Percakapan sederhana" },
  { value: "n3" as const, label: "N3", desc: "Menengah" },
  { value: "n2" as const, label: "N2", desc: "Lanjutan" },
  { value: "n1" as const, label: "N1", desc: "Mahir" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<LearningPath>("jlpt_academic");
  const [dailyXp, setDailyXp] = useState(50);
  const [level, setLevel] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: onboardingDone, isLoading: statusLoading } = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      if (error) return false;
      return data?.onboarding_completed ?? false;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (authLoading || statusLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (onboardingDone) {
      navigate("/", { replace: true });
    }
  }, [authLoading, statusLoading, user, onboardingDone, navigate]);

  const minutesEstimate = Math.round((dailyXp / 50) * 15);

  const saveOnboarding = async (userId: string) => {
    const payload = {
      current_path: path,
      daily_goal_xp: dailyXp,
      default_jlpt_level: level === "none" ? null : level,
      onboarding_completed: true,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select("onboarding_completed")
      .maybeSingle();

    if (!error && data?.onboarding_completed === true) {
      return { ok: true as const };
    }

    const { data: upserted, error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...payload })
      .select("onboarding_completed")
      .single();

    if (upsertError || upserted?.onboarding_completed !== true) {
      return {
        ok: false as const,
        message: upsertError?.message ?? error?.message ?? "Profil tidak dapat disimpan",
      };
    }

    return { ok: true as const };
  };

  const handleFinish = async () => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    const result = await saveOnboarding(user.id);
    setLoading(false);

    if (!result.ok) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
      return;
    }

    queryClient.setQueryData(["onboarding-status", user.id], true);
    await queryClient.invalidateQueries({ queryKey: ["onboarding-status", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    navigate("/", { replace: true });
  };

  if (authLoading || statusLoading || !user || onboardingDone) {
    return <div className="min-h-screen bg-canvas" />;
  }

  return (
    <div className="min-h-screen bg-canvas p-3 md:p-4 flex items-center justify-center">
      <div className="w-full max-w-lg nori-frame p-6 sm:p-8">
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-sm transition-all duration-200",
                  i === step ? "w-10 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-border",
                )}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="nori-jp-display text-3xl">学習</p>
                <div className="nori-wavy-line mx-auto" />
                <h1 className="text-xl font-bold uppercase tracking-wide text-foreground mt-4">Pilih Jalur Belajar</h1>
                <p className="text-muted-foreground normal-case tracking-normal font-normal text-sm">
                  Sesuaikan dengan tujuan Anda
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPath("jlpt_academic")}
                  className={cn(
                    "p-5 rounded-lg border-2 text-left transition-colors",
                    path === "jlpt_academic"
                      ? "border-foreground bg-card"
                      : "border-border hover:border-foreground/30",
                  )}
                >
                  <span className="nori-jp-display text-2xl block mb-2">試験</span>
                  <h3 className="font-bold text-foreground normal-case tracking-normal">JLPT Academic</h3>
                  <p className="text-sm text-muted-foreground mt-1 normal-case tracking-normal font-normal">
                    Persiapan ujian JLPT N5–N1
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPath("jft_practical")}
                  className={cn(
                    "p-5 rounded-lg border-2 text-left transition-colors",
                    path === "jft_practical"
                      ? "border-primary/35 bg-card"
                      : "border-border hover:border-primary/20",
                  )}
                >
                  <span className="nori-jp-display text-2xl block mb-2">会話</span>
                  <h3 className="font-bold text-foreground normal-case tracking-normal">JFT Practical</h3>
                  <p className="text-sm text-muted-foreground mt-1 normal-case tracking-normal font-normal">
                    Bahasa Jepang praktis sehari-hari
                  </p>
                </button>
              </div>

              <Button className="w-full h-12" onClick={() => setStep(1)}>
                Lanjut
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="nori-jp-display text-3xl">目標</p>
                <div className="nori-wavy-line mx-auto" />
                <h1 className="text-xl font-bold uppercase tracking-wide text-foreground mt-4">Target Harian</h1>
                <p className="text-muted-foreground normal-case tracking-normal font-normal text-sm">
                  Berapa banyak Anda ingin belajar setiap hari?
                </p>
              </div>

              <div className="space-y-6 py-4">
                <div className="text-center">
                  <span className="text-5xl font-bold text-primary">{dailyXp}</span>
                  <span className="text-xl text-muted-foreground ml-2 normal-case">XP</span>
                </div>

                <Slider
                  value={[dailyXp]}
                  onValueChange={(v) => setDailyXp(v[0])}
                  min={10}
                  max={200}
                  step={10}
                  className="py-4"
                />

                <div className="text-center p-4 rounded-lg border border-border bg-card">
                  <p className="text-muted-foreground normal-case tracking-normal font-normal">
                    ≈ <span className="font-bold text-foreground">{minutesEstimate} menit</span> per hari
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(0)}>
                  Kembali
                </Button>
                <Button className="flex-1 h-12" onClick={() => setStep(2)}>
                  Lanjut
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="nori-jp-display text-3xl">レベル</p>
                <div className="nori-wavy-line mx-auto" />
                <h1 className="text-xl font-bold uppercase tracking-wide text-foreground mt-4">Level Saat Ini</h1>
                <p className="text-muted-foreground normal-case tracking-normal font-normal text-sm">
                  Di mana Anda sekarang?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-colors",
                      level === l.value
                        ? "border-primary/35 bg-card"
                        : "border-border hover:border-primary/20",
                    )}
                  >
                    <p className="font-bold text-foreground normal-case tracking-normal">{l.label}</p>
                    <p className="text-xs text-muted-foreground normal-case tracking-normal font-normal">{l.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                  Kembali
                </Button>
                <Button className="flex-1 h-12" onClick={handleFinish} disabled={loading}>
                  {loading ? "Menyimpan..." : "Mulai Belajar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
