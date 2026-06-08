import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Settings, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTodayXP } from "@/hooks/useDailyXP";
import { useProfile } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/learn": "Belajar",
  "/materials": "Materi Belajar",
  "/vocabulary": "Kosakata Saya",
  "/flashcards": "Flashcards",
  "/practice": "Latihan",
  "/progress": "Progress",
  "/exam": "Ujian Simulasi",
  "/settings": "Settings",
};

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: todayXp = 0 } = useTodayXP();
  const { data: profile } = useProfile();
  const dailyGoal = profile?.daily_goal_xp ?? 50;
  const displayName = profile?.display_name || "Learner";
  const [searchQuery, setSearchQuery] = useState("");

  const currentLabel = routeLabels[location.pathname] || "Page";
  const xpProgress = Math.min((todayXp / dailyGoal) * 100, 100);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 h-14 bg-background border-b border-border shrink-0">
      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="normal-case tracking-normal font-medium">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          {location.pathname !== "/" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="normal-case tracking-normal font-medium">
                  {currentLabel}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

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
          className="h-9 pl-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-3 min-w-[120px]">
        <div className="flex-1 hidden sm:block">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1 normal-case tracking-normal">
            <span>XP</span>
            <span>{todayXp}/{dailyGoal}</span>
          </div>
          <Progress value={xpProgress} className="h-1.5" />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-md p-1 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 border-2 border-foreground/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-jp font-bold text-foreground">学</span>
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground truncate max-w-[120px] normal-case">
              {displayName}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="normal-case tracking-normal font-medium">{displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer normal-case tracking-normal">
            <Settings size={14} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive normal-case tracking-normal"
          >
            <LogOut size={14} />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default TopBar;
