import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  Layers,
  BarChart3,
  Settings,
  ClipboardCheck,
  FileUp,
  Languages,
  Bot,
  Sparkles,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Materi Belajar", path: "/materials" },
  { icon: FileUp, label: "Import Materi", path: "/materials/import" },
  { icon: BookMarked, label: "Kosakata Saya", path: "/vocabulary" },
  { icon: Languages, label: "Analisis Kalimat", path: "/ai-tools/analyzer" },
  { icon: Sparkles, label: "Generator Materi", path: "/ai-tools/generate" },
  { icon: Bot, label: "Sensei AI", path: "/ai-assistant" },
  { icon: Layers, label: "Flashcards (SRS)", path: "/flashcards", badge: 3 },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: ClipboardCheck, label: "Ujian Simulasi", path: "/exam" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 mb-8", collapsed && !isMobile && "justify-center")}>
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-serif font-bold text-lg">歩</span>
        </div>
        {(!collapsed || isMobile) && (
          <div>
            <h1 className="text-lg font-serif font-bold text-foreground tracking-tight">
              Nihongo-Step
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">
              一歩ずつ
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                collapsed && !isMobile && "justify-center px-2"
              )}
            >
              <Icon size={20} className="shrink-0" />
              {(!collapsed || isMobile) && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge className="bg-srs text-srs-foreground text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && !isMobile && item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-srs text-srs-foreground text-[9px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="pt-4 border-t border-border/50 space-y-3">
        <div className={cn("flex items-center gap-3", collapsed && !isMobile && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-foreground">学</span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Learner</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size={collapsed && !isMobile ? "icon" : "sm"}
          onClick={handleLogout}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          <LogOut size={16} />
          {(!collapsed || isMobile) && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );

  // Mobile
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold">歩</span>
            </div>
            <span className="font-serif font-bold text-foreground">Nihongo-Step</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-14 left-0 bottom-0 z-50 w-[280px] p-5 bg-card/90 backdrop-blur-2xl border-r border-border/50"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="hidden lg:flex flex-col shrink-0 min-h-screen p-4 bg-card/70 backdrop-blur-2xl border-r border-border/50 relative"
    >
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 z-10 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={14} className={cn("transition-transform", collapsed && "rotate-180")} />
      </button>
      {sidebarContent}
    </motion.aside>
  );
};

export default AppSidebar;
