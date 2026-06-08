import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  ChevronLeft,
  Menu,
  X,
  Grid3x3,
  GraduationCap,
  Dumbbell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSrsDueCount } from "@/hooks/useSrsBadge";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: GraduationCap, label: "Belajar", path: "/learn" },
  { icon: Dumbbell, label: "Latihan", path: "/practice" },
  { icon: BookOpen, label: "Materi Belajar", path: "/materials" },
  { icon: FileUp, label: "Import Materi", path: "/materials/import" },
  { icon: BookMarked, label: "Kosakata Saya", path: "/vocabulary" },
  { icon: Languages, label: "Analisis Kalimat", path: "/ai-tools/analyzer" },
  { icon: Sparkles, label: "Generator Materi", path: "/ai-tools/generate" },
  { icon: Bot, label: "Sensei AI", path: "/ai-assistant" },
  { icon: Layers, label: "Flashcards (SRS)", path: "/flashcards", badge: true },
  { icon: Grid3x3, label: "Tabel Kana", path: "/kana" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: ClipboardCheck, label: "Ujian Simulasi", path: "/exam" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NoriLogo = ({ compact = false }: { compact?: boolean }) => (
  <div className={cn("flex items-center gap-2.5", compact && "justify-center")}>
    <div className="w-10 h-10 bg-primary flex flex-col items-center justify-center shrink-0 leading-none">
      <span className="text-primary-foreground font-jp font-bold text-sm">日</span>
      <span className="text-primary-foreground font-jp font-bold text-sm -mt-0.5">歩</span>
    </div>
    {!compact && (
      <div>
        <h1 className="text-base font-bold uppercase tracking-widest text-foreground">Nihongo Step</h1>
        <p className="text-[10px] text-muted-foreground tracking-wider uppercase">一歩ずつ</p>
      </div>
    )}
  </div>
);

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: srsDueCount = 0 } = useSrsDueCount();

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const isPathActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={cn("mb-6", collapsed && !isMobile && "flex justify-center")}>
        <NoriLogo compact={collapsed && !isMobile} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = isPathActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors relative group",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
                collapsed && !isMobile && "justify-center px-2",
              )}
            >
              <Icon size={18} className="shrink-0 text-foreground/70" strokeWidth={1.75} />
              {(!collapsed || isMobile) && (
                <>
                  <span
                    className={cn(
                      "flex-1 text-left normal-case tracking-normal font-medium",
                      isActive && "border-b-2 border-primary/50 pb-0.5 inline-block",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && srsDueCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                      {srsDueCount > 99 ? "99+" : srsDueCount}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && !isMobile && item.badge && srsDueCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-3 left-3 right-3 z-50 flex items-center justify-between px-4 h-12 bg-background border border-[hsl(var(--frame-border))] rounded-lg">
          <NoriLogo />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-foreground hover:bg-muted rounded-md transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-foreground/20"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed top-[4.5rem] left-3 bottom-3 z-50 w-[280px] p-5 bg-background border border-[hsl(var(--frame-border))] rounded-lg overflow-y-auto">
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0 sticky top-0 self-start h-[calc(100vh-2rem)] overflow-y-auto p-4 bg-background border-r border-border relative transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[256px]",
      )}
    >
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 z-10 w-6 h-6 rounded-md bg-background border-2 border-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft size={14} className={cn("transition-transform", collapsed && "rotate-180")} />
      </button>
      {sidebarContent}
    </aside>
  );
};

export default AppSidebar;
