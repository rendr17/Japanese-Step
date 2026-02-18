import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserSettings {
  display_name: string | null;
  avatar_url: string | null;
  current_path: "jlpt_academic" | "jft_practical";
  daily_goal_xp: number;
  default_jlpt_level: string;
  furigana_display: string;
  study_reminder_time: string;
  theme_preference: string;
  ui_language: string;
  font_size: string;
  animations_enabled: boolean;
  reduce_motion: boolean;
  email_reminders: boolean;
  srs_reminders: boolean;
  weekly_report: boolean;
  achievement_notifications: boolean;
  auto_play_pronunciation: boolean;
  tts_voice: string;
  audio_speed: string;
}

const defaults: UserSettings = {
  display_name: null,
  avatar_url: null,
  current_path: "jlpt_academic",
  daily_goal_xp: 50,
  default_jlpt_level: "n5",
  furigana_display: "always",
  study_reminder_time: "20:00",
  theme_preference: "light",
  ui_language: "indonesian",
  font_size: "medium",
  animations_enabled: true,
  reduce_motion: false,
  email_reminders: true,
  srs_reminders: true,
  weekly_report: true,
  achievement_notifications: true,
  auto_play_pronunciation: false,
  tts_voice: "female",
  audio_speed: "1x",
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setSettings({
          display_name: data.display_name,
          avatar_url: (data as any).avatar_url ?? null,
          current_path: data.current_path,
          daily_goal_xp: data.daily_goal_xp,
          default_jlpt_level: (data as any).default_jlpt_level ?? "n5",
          furigana_display: (data as any).furigana_display ?? "always",
          study_reminder_time: (data as any).study_reminder_time ?? "20:00",
          theme_preference: data.theme_preference,
          ui_language: (data as any).ui_language ?? "indonesian",
          font_size: (data as any).font_size ?? "medium",
          animations_enabled: (data as any).animations_enabled ?? true,
          reduce_motion: (data as any).reduce_motion ?? false,
          email_reminders: (data as any).email_reminders ?? true,
          srs_reminders: (data as any).srs_reminders ?? true,
          weekly_report: (data as any).weekly_report ?? true,
          achievement_notifications: (data as any).achievement_notifications ?? true,
          auto_play_pronunciation: (data as any).auto_play_pronunciation ?? false,
          tts_voice: (data as any).tts_voice ?? "female",
          audio_speed: (data as any).audio_speed ?? "1x",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const updateSetting = useCallback(async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!user) return;
    setSettings((prev) => ({ ...prev, [key]: value }));
    const { error } = await supabase.from("profiles").update({ [key]: value } as any).eq("id", user.id);
    if (error) {
      toast.error("Gagal menyimpan pengaturan");
      console.error(error);
    } else {
      toast.success("Settings saved");
    }
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Gagal upload avatar"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    await updateSetting("avatar_url", url);
  }, [user, updateSetting]);

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); return false; }
    toast.success("Password berhasil diubah");
    return true;
  }, []);

  const exportData = useCallback(async () => {
    if (!user) return;
    const [materials, vocab, srs] = await Promise.all([
      supabase.from("materials").select("*").eq("user_id", user.id),
      supabase.from("vocab_bank").select("*").eq("user_id", user.id),
      supabase.from("srs_logs").select("*").eq("user_id", user.id),
    ]);
    const blob = new Blob([JSON.stringify({ settings, materials: materials.data, vocabulary: vocab.data, srs: srs.data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nihongo-step-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor");
  }, [user, settings]);

  const deleteAccount = useCallback(async () => {
    toast.error("Untuk menghapus akun, silakan hubungi support.");
  }, []);

  return { settings, loading, email, updateSetting, uploadAvatar, changePassword, exportData, deleteAccount };
}
