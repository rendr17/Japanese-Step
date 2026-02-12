import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 6) score += 20;
  if (password.length >= 10) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return score;
};

const strengthLabel = (score: number) => {
  if (score <= 20) return { text: "Sangat Lemah", color: "bg-destructive" };
  if (score <= 40) return { text: "Lemah", color: "bg-[hsl(var(--srs-alert))]" };
  if (score <= 60) return { text: "Cukup", color: "bg-[hsl(var(--accent))]" };
  if (score <= 80) return { text: "Kuat", color: "bg-[hsl(var(--jft))]" };
  return { text: "Sangat Kuat", color: "bg-[hsl(var(--secondary))]" };
};

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = getPasswordStrength(password);
  const strengthInfo = strengthLabel(strength);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: "Syarat & Ketentuan", description: "Anda harus menyetujui syarat & ketentuan.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password terlalu pendek", description: "Minimal 6 karakter.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Registrasi gagal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil!", description: "Silakan cek email untuk verifikasi." });
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[hsl(var(--warm-100))] to-[hsl(var(--jft-muted))] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="zen-card space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">はじめまして</h1>
            <p className="text-muted-foreground">Buat akun baru untuk mulai belajar</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nama Tampilan</Label>
              <Input
                id="displayName"
                placeholder="Nama Anda"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="anda@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-1"
                >
                  <Progress value={strength} className={`h-2 [&>div]:${strengthInfo.color}`} />
                  <p className="text-xs text-muted-foreground">
                    Kekuatan: <span className="font-medium">{strengthInfo.text}</span>
                  </p>
                </motion.div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                Saya setuju dengan{" "}
                <span className="text-primary underline">Syarat & Ketentuan</span> dan{" "}
                <span className="text-primary underline">Kebijakan Privasi</span>
              </Label>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading || !agreed}>
              {loading ? "Mendaftar..." : "Buat Akun"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
