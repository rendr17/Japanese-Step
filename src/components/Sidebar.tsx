import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  BarChart3,
  Settings,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", active: true },
  { icon: <BookOpen size={20} />, label: "Vocabulary" },
  { icon: <Layers size={20} />, label: "Kanji" },
  { icon: <GraduationCap size={20} />, label: "Grammar" },
  { icon: <BarChart3 size={20} />, label: "Progress" },
  { icon: <Settings size={20} />, label: "Settings" },
];

const Sidebar = () => (
  <motion.aside
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-border p-6"
  >
    {/* Logo */}
    <div className="flex items-center gap-2.5 mb-10">
      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-primary-foreground font-serif font-bold text-lg">歩</span>
      </div>
      <div>
        <h1 className="text-lg font-serif font-bold text-foreground tracking-tight">
          Nihongo-Step
        </h1>
        <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">
          一歩ずつ
        </p>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            item.active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>

    {/* User */}
    <div className="pt-4 border-t border-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-medium text-foreground">学</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Learner</p>
          <p className="text-xs text-muted-foreground">Free Plan</p>
        </div>
      </div>
    </div>
  </motion.aside>
);

export default Sidebar;
