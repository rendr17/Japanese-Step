import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background w-full">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${isMobile ? "pt-14" : ""}`}>
        <TopBar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
