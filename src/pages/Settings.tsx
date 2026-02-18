import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, BookOpen, Monitor, Bell, Volume2, Shield,
  Camera, Mail, Lock, Download, Trash2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";

const sectionNav = [
  { id: "profile", icon: User, label: "Profil" },
  { id: "learning", icon: BookOpen, label: "Pembelajaran" },
  { id: "interface", icon: Monitor, label: "Tampilan" },
  { id: "notifications", icon: Bell, label: "Notifikasi" },
  { id: "audio", icon: Volume2, label: "Audio" },
  { id: "privacy", icon: Shield, label: "Privasi & Data" },
];

const Settings = () => {
  const { settings, loading, email, updateSetting, uploadAvatar, changePassword, exportData, deleteAccount } = useSettings();
  const [activeSection, setActiveSection] = useState("profile");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) return;
    setChangingPassword(true);
    const ok = await changePassword(newPassword);
    if (ok) { setShowPasswordDialog(false); setNewPassword(""); }
    setChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-foreground mb-6">Settings</h1>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="hidden md:flex flex-col gap-1 w-48 shrink-0 sticky top-20 self-start">
          {sectionNav.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Profile */}
          <Card id="settings-profile" className="p-6 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2"><User size={18} /> Profil</h2>
            <div className="flex items-center gap-5">
              <div className="relative group">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={settings.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl font-serif">{settings.display_name?.charAt(0) || "学"}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Camera size={20} className="text-white" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              </div>
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Display Name</Label>
                  <Input
                    value={settings.display_name || ""}
                    onChange={(e) => updateSetting("display_name", e.target.value)}
                    onBlur={(e) => updateSetting("display_name", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <div className="flex items-center gap-2">
                    <Input value={email} disabled className="h-9 opacity-60" />
                    <Mail size={16} className="text-muted-foreground shrink-0" />
                  </div>
                </div>
              </div>
            </div>
            <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Lock size={14} /> Ubah Password</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ubah Password</AlertDialogTitle>
                  <AlertDialogDescription>Masukkan password baru (minimal 6 karakter)</AlertDialogDescription>
                </AlertDialogHeader>
                <Input type="password" placeholder="Password baru" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePasswordChange} disabled={newPassword.length < 6 || changingPassword}>
                    {changingPassword ? <Loader2 size={14} className="animate-spin" /> : "Simpan"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>

          {/* Learning Preferences */}
          <Card id="settings-learning" className="p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2"><BookOpen size={18} /> Preferensi Pembelajaran</h2>

            <SettingRow label="Jalur Belajar">
              <Select value={settings.current_path} onValueChange={(v) => updateSetting("current_path", v as any)}>
                <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jlpt_academic">🎌 JLPT (Akademik)</SelectItem>
                  <SelectItem value="jft_practical">🏢 JFT (Praktis)</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label={`Daily Goal XP: ${settings.daily_goal_xp}`}>
              <Slider
                value={[settings.daily_goal_xp]}
                onValueChange={([v]) => updateSetting("daily_goal_xp", v)}
                min={10} max={200} step={10}
                className="w-[200px]"
              />
            </SettingRow>

            <SettingRow label="Default JLPT Level">
              <Select value={settings.default_jlpt_level} onValueChange={(v) => updateSetting("default_jlpt_level", v)}>
                <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["n5","n4","n3","n2","n1"].map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Tampilan Furigana">
              <Select value={settings.furigana_display} onValueChange={(v) => updateSetting("furigana_display", v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Selalu</SelectItem>
                  <SelectItem value="hover">Saat Hover</SelectItem>
                  <SelectItem value="never">Tidak Pernah</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Waktu Pengingat Belajar">
              <Input
                type="time"
                value={settings.study_reminder_time}
                onChange={(e) => updateSetting("study_reminder_time", e.target.value)}
                className="w-[140px] h-9 text-sm"
              />
            </SettingRow>
          </Card>

          {/* Interface */}
          <Card id="settings-interface" className="p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Monitor size={18} /> Tampilan</h2>

            <SettingRow label="Tema">
              <Select value={settings.theme_preference} onValueChange={(v) => updateSetting("theme_preference", v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">☀️ Light</SelectItem>
                  <SelectItem value="dark">🌙 Dark</SelectItem>
                  <SelectItem value="auto">🔄 Auto</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Bahasa">
              <Select value={settings.ui_language} onValueChange={(v) => updateSetting("ui_language", v)}>
                <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indonesian">🇮🇩 Indonesia</SelectItem>
                  <SelectItem value="english">🇬🇧 English</SelectItem>
                  <SelectItem value="japanese">🇯🇵 日本語</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Ukuran Font">
              <Select value={settings.font_size} onValueChange={(v) => updateSetting("font_size", v)}>
                <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Animasi">
              <Switch checked={settings.animations_enabled} onCheckedChange={(v) => updateSetting("animations_enabled", v)} />
            </SettingRow>

            <SettingRow label="Reduce Motion (Aksesibilitas)">
              <Switch checked={settings.reduce_motion} onCheckedChange={(v) => updateSetting("reduce_motion", v)} />
            </SettingRow>
          </Card>

          {/* Notifications */}
          <Card id="settings-notifications" className="p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Bell size={18} /> Notifikasi</h2>

            <SettingRow label="Email Pengingat">
              <Switch checked={settings.email_reminders} onCheckedChange={(v) => updateSetting("email_reminders", v)} />
            </SettingRow>
            <SettingRow label="Pengingat Review SRS">
              <Switch checked={settings.srs_reminders} onCheckedChange={(v) => updateSetting("srs_reminders", v)} />
            </SettingRow>
            <SettingRow label="Laporan Progress Mingguan">
              <Switch checked={settings.weekly_report} onCheckedChange={(v) => updateSetting("weekly_report", v)} />
            </SettingRow>
            <SettingRow label="Notifikasi Achievement">
              <Switch checked={settings.achievement_notifications} onCheckedChange={(v) => updateSetting("achievement_notifications", v)} />
            </SettingRow>
          </Card>

          {/* Audio */}
          <Card id="settings-audio" className="p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Volume2 size={18} /> Audio</h2>

            <SettingRow label="Auto-play Pelafalan">
              <Switch checked={settings.auto_play_pronunciation} onCheckedChange={(v) => updateSetting("auto_play_pronunciation", v)} />
            </SettingRow>

            <SettingRow label="Suara TTS">
              <Select value={settings.tts_voice} onValueChange={(v) => updateSetting("tts_voice", v)}>
                <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">👩 Female</SelectItem>
                  <SelectItem value="male">👨 Male</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Kecepatan Audio">
              <Select value={settings.audio_speed} onValueChange={(v) => updateSetting("audio_speed", v)}>
                <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5x">0.5x</SelectItem>
                  <SelectItem value="1x">1x</SelectItem>
                  <SelectItem value="1.5x">1.5x</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </Card>

          {/* Privacy & Data */}
          <Card id="settings-privacy" className="p-6 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Shield size={18} /> Privasi & Data</h2>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2" onClick={exportData}>
                <Download size={14} /> Export Semua Data (JSON)
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 size={14} /> Hapus Akun
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Akun?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak bisa dibatalkan. Semua data termasuk materi, kosakata, dan progress belajar akan dihapus secara permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Ya, Hapus Akun
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>

          <div className="h-20" />
        </div>
      </div>
    </motion.div>
  );
};

const SettingRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <Label className="text-sm text-foreground">{label}</Label>
    {children}
  </div>
);

export default Settings;
