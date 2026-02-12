import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type LearningPath = Database["public"]["Enums"]["learning_path"];

const LEVELS = [
  { value: "none" as const, label: "Pemula", desc: "Baru mulai belajar" },
  { value: "n5" as const, label: "N5", desc: "Dasar-dasar bahasa" },
  { value: "n4" as const, label: "N4", desc: "Percakapan sederhana" },
  { value: "n3" as const, label: "N3", desc: "Menengah" },
  { value: "n2" as const, label: "N2", desc: "Lanjutan" },
  { value: "n1" as const, label: "N1", desc: "Mahir" },
];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<LearningPath>("jlpt_academic");
  const [dailyXp, setDailyXp] = useState(50);
  const [level, setLevel] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUserId(data.session.user.id);
    });
  }, []);

  const minutesEstimate = Math.round((dailyXp / 50) * 15);

  const handleFinish = async () => {
    if (!userId) {
      navigate("/");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ current_path: path, daily_goal_xp: dailyXp })
      .eq("id", userId);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[hsl(var(--warm-100))] to-[hsl(var(--warm-200))] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="zen-card space-y-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/60" : "w-2 bg-border"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">Pilih Jalur Belajar</h1>
                  <p className="text-muted-foreground">Sesuaikan dengan tujuan Anda</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPath("jlpt_academic")}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                      path === "jlpt_academic"
                        ? "border-[hsl(var(--jlpt))] bg-[hsl(var(--jlpt-muted))]"
                        : "border-border hover:border-[hsl(var(--jlpt))/50]"
                    }`}
                  >
                    <span className="text-3xl mb-3 block">📚</span>
                    <h3 className="font-bold text-foreground text-lg">JLPT Academic</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Persiapan ujian JLPT N5–N1
                    </p>
                  </button>

                  <button
                    onClick={() => setPath("jft_practical")}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                      path === "jft_practical"
                        ? "border-[hsl(var(--jft))] bg-[hsl(var(--jft-muted))]"
                        : "border-border hover:border-[hsl(var(--jft))/50]"
                    }`}
                  >
                    <span className="text-3xl mb-3 block">💬</span>
                    <h3 className="font-bold text-foreground text-lg">JFT Practical</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bahasa Jepang praktis sehari-hari
                    </p>
                  </button>
                </div>

                <Button className="w-full h-12" onClick={() => setStep(1)}>
                  Lanjut
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">Target Harian</h1>
                  <p className="text-muted-foreground">Berapa banyak Anda ingin belajar setiap hari?</p>
                </div>

                <div className="space-y-8 py-4">
                  <div className="text-center">
                    <span className="text-5xl font-bold text-primary">{dailyXp}</span>
                    <span className="text-2xl text-muted-foreground ml-2">XP</span>
                  </div>

                  <Slider
                    value={[dailyXp]}
                    onValueChange={(v) => setDailyXp(v[0])}
                    min={10}
                    max={200}
                    step={10}
                    className="py-4"
                  />

                  <div className="text-center p-4 rounded-lg bg-[hsl(var(--warm-100))]">
                    <p className="text-muted-foreground">
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">Level Saat Ini</h1>
                  <p className="text-muted-foreground">Di mana Anda sekarang?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        level === l.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className="font-bold text-foreground">{l.label}</p>
                      <p className="text-xs text-muted-foreground">{l.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                    Kembali
                  </Button>
                  <Button className="flex-1 h-12" onClick={handleFinish} disabled={loading}>
                    {loading ? "Menyimpan..." : "Mulai Belajar 🚀"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
