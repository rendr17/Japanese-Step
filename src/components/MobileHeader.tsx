import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  BarChart3,
  Settings,
  GraduationCap,
  X,
} from "lucide-react";

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", active: true },
  { icon: <BookOpen size={20} />, label: "Vocabulary" },
  { icon: <Layers size={20} />, label: "Kanji" },
  { icon: <GraduationCap size={20} />, label: "Grammar" },
  { icon: <BarChart3 size={20} />, label: "Progress" },
  { icon: <Settings size={20} />, label: "Settings" },
];

const MobileHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-serif font-bold">歩</span>
          </div>
          <h1 className="text-lg font-serif font-bold text-foreground">Nihongo-Step</h1>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card border-b border-border p-4 space-y-1"
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setMenuOpen(false)}
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
        </motion.nav>
      )}
    </div>
  );
};

export default MobileHeader;
