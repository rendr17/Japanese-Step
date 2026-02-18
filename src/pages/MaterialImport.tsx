import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useImportMaterial } from "@/hooks/useImportMaterial";
import ImportInputStep from "@/components/import/ImportInputStep";
import ImportPreviewStep from "@/components/import/ImportPreviewStep";
import ImportSplitStep from "@/components/import/ImportSplitStep";
import ImportVocabStep from "@/components/import/ImportVocabStep";
import ImportCompleteStep from "@/components/import/ImportCompleteStep";

const stepLabels = ["Input", "Preview", "Split & Pilih", "Kosakata", "Selesai"];

const MaterialImport = () => {
  const {
    step, setStep,
    isAnalyzing, isSaving, saveProgress,
    rawText, setRawText,
    analysis, setAnalysis,
    settings, setSettings,
    savedMaterialIds, savedVocabCount,
    analyze, saveMaterials,
    navigate,
  } = useImportMaterial();

  return (
    <>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/materials")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Import Materi</h1>
            <p className="text-sm text-muted-foreground">Import dari file atau paste teks untuk membuat materi belajar</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={i} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" :
                  isDone ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px] font-bold">
                    {isDone ? "✓" : stepNum}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className="w-4 h-px bg-border" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step content */}
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        {step === 1 && (
          <ImportInputStep
            rawText={rawText}
            setRawText={setRawText}
            settings={settings}
            setSettings={setSettings}
            onAnalyze={analyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {step === 2 && isAnalyzing && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {step === 2 && !isAnalyzing && analysis && (
          <ImportPreviewStep
            analysis={analysis}
            setAnalysis={setAnalysis}
            settings={settings}
            setSettings={setSettings}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && analysis && (
          <ImportSplitStep
            analysis={analysis}
            setAnalysis={setAnalysis}
            settings={settings}
            setSettings={setSettings}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && analysis && (
          <ImportVocabStep
            analysis={analysis}
            setAnalysis={setAnalysis}
            onSave={saveMaterials}
            onBack={() => setStep(3)}
            isSaving={isSaving}
            saveProgress={saveProgress}
          />
        )}

        {step === 5 && (
          <ImportCompleteStep
            materialCount={savedMaterialIds.length}
            vocabCount={savedVocabCount}
            firstMaterialId={savedMaterialIds[0]}
            onNavigate={navigate}
          />
        )}
      </motion.div>
    </>
  );
};

export default MaterialImport;
