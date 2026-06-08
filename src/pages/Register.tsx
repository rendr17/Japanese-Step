import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/layout/AuthLayout";

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
  if (score <= 20) return "Sangat Lemah";
  if (score <= 40) return "Lemah";
  if (score <= 60) return "Cukup";
  if (score <= 80) return "Kuat";
  return "Sangat Kuat";
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
    const { data, error } = await supabase.auth.signUp({
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
    } else if (data.session) {
      toast({ title: "Berhasil!", description: "Akun Anda siap digunakan." });
      navigate("/onboarding");
    } else {
      toast({ title: "Berhasil!", description: "Silakan cek email untuk verifikasi akun." });
      navigate("/login");
    }
  };

  return (
    <AuthLayout
      jpDisplay="はじめ"
      headline="Start Your"
      highlight="Japanese Journey"
      description="Buat akun dan mulai belajar dengan materi JLPT, latihan interaktif, dan bantuan AI sensei."
    >
      <div className="nori-card space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold uppercase tracking-wide text-foreground">Daftar</h2>
          <p className="text-muted-foreground normal-case tracking-normal font-normal text-sm">
            Buat akun baru untuk mulai belajar
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="normal-case tracking-normal font-medium">Nama Tampilan</Label>
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
            <Label htmlFor="email" className="normal-case tracking-normal font-medium">Email</Label>
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
            <Label htmlFor="password" className="normal-case tracking-normal font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && (
              <div className="space-y-1">
                <Progress value={strength} className="h-1.5" />
                <p className="text-xs text-muted-foreground normal-case tracking-normal">
                  Kekuatan: <span className="font-medium text-foreground">{strengthLabel(strength)}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer normal-case tracking-normal font-normal">
              Saya setuju dengan{" "}
              <span className="text-primary underline">Syarat & Ketentuan</span> dan{" "}
              <span className="text-primary underline">Kebijakan Privasi</span>
            </Label>
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading || !agreed}>
            {loading ? "Mendaftar..." : "Buat Akun"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground normal-case tracking-normal font-normal">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
