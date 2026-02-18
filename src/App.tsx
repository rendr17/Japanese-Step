import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Materials from "./pages/Materials";
import MaterialEditor from "./pages/MaterialEditor";
import MaterialDetail from "./pages/MaterialDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Vocabulary from "./pages/Vocabulary";
import SentenceAnalyzer from "./pages/SentenceAnalyzer";
import AiAssistant from "./pages/AiAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App routes (with layout) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/materials/:id" element={<MaterialDetail />} />
            <Route path="/materials/:id/edit" element={<MaterialEditor />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route path="/ai-tools/analyzer" element={<SentenceAnalyzer />} />
            <Route path="/ai-assistant" element={<AiAssistant />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
