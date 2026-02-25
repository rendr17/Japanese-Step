import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Target, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/materials": "Materi Belajar",
  "/vocabulary": "Kosakata Saya",
  "/flashcards": "Flashcards",
  "/progress": "Progress",
  "/exam": "Ujian Simulasi",
  "/settings": "Settings",
};

interface XPRingProps {
  current: number;
  goal: number;
  size?: number;
}

const XPRing = ({ current, goal, size = 36 }: XPRingProps) => {
  const progress = Math.min(current / goal, 1);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[9px] font-bold text-foreground">{Math.round(progress * 100)}%</span>
    </div>
  );
};

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  const currentLabel = routeLabels[location.pathname] || "Page";

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 h-14 bg-background/80 backdrop-blur-xl border-b border-border/50">
      {/* Breadcrumb */}
      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          {location.pathname !== "/" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block w-56">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
              navigate(`/materials?q=${encodeURIComponent(searchQuery.trim())}`);
              setSearchQuery("");
            }
          }}
          className="h-8 pl-8 text-xs bg-muted/50 border-transparent focus-visible:border-border"
        />
      </div>

      {/* XP Ring */}
      <div className="flex items-center gap-2">
        <XPRing current={45} goal={100} />
        <span className="text-xs text-muted-foreground hidden sm:inline">45/100 XP</span>
      </div>

      {/* Focus Mode */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", focusMode && "bg-primary text-primary-foreground")}
        onClick={() => setFocusMode(!focusMode)}
      >
        <Target size={16} />
      </Button>

      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </Button>
    </header>
  );
};

export default TopBar;
