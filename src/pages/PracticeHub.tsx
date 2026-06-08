import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Headphones, Keyboard, MessageSquare, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PracticeSession from "@/components/practice/PracticeSession";
import {
  useGrammarDrillQuestions,
  useListeningVocab,
  useSavePracticeSession,
  type PracticeQuestion,
} from "@/hooks/usePractice";
import { useAddXP } from "@/hooks/useDailyXP";
import { useStudySession } from "@/hooks/useStudySession";
import { useProfile } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function speakJapanese(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = 0.85;
  window.speechSynthesis.speak(utter);
}

const ListeningDrill = ({ onComplete }: { onComplete: (score: number, total: number, duration: number) => void }) => {
  const { data: vocabList = [], isLoading } = useListeningVocab(8);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);
  const startTime = useState(() => Date.now())[0];

  const current = vocabList[index];

  useEffect(() => {
    if (!current || vocabList.length < 4) return;
    const wrong = vocabList
      .filter((v) => v.id !== current.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((v) => v.meaning);
    const opts = [current.meaning, ...wrong].sort(() => Math.random() - 0.5);
    setOptions(opts);
    setSelected(null);
    setShowResult(false);
    speakJapanese(current.kana || current.kanji || "");
  }, [current, vocabList, index]);

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Memuat kosakata...</p>;
  if (vocabList.length < 4) {
    return (
      <Card className="nori-card p-6 text-center">
        <p className="text-muted-foreground">Tambah minimal 4 kosakata di bank vocab untuk latihan listening.</p>
      </Card>
    );
  }

  if (finished) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    onComplete(score, vocabList.length, duration);
    return null;
  }

  const correctIdx = options.indexOf(current.meaning);

  return (
    <Card className="nori-card max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Headphones size={18} /> Dengar & Pilih Arti
        </CardTitle>
        <CardDescription>{index + 1} / {vocabList.length}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full gap-2" onClick={() => speakJapanese(current.kana || current.kanji || "")}>
          <Headphones size={16} /> Putar Ulang Audio
        </Button>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <Button
              key={i}
              variant="outline"
              className={`w-full justify-start ${showResult && i === correctIdx ? "border-secondary" : showResult && i === selected ? "border-destructive" : ""}`}
              disabled={showResult}
              onClick={() => {
                setSelected(i);
                setShowResult(true);
                if (i === correctIdx) setScore((s) => s + 1);
              }}
            >
              {opt}
            </Button>
          ))}
        </div>
        {showResult && (
          <Button
            className="w-full"
            onClick={() => {
              if (index + 1 >= vocabList.length) setFinished(true);
              else setIndex((i) => i + 1);
            }}
          >
            {index + 1 >= vocabList.length ? "Selesai" : "Berikutnya"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const TypingDrill = ({ onComplete }: { onComplete: (score: number, total: number, duration: number) => void }) => {
  const { data: vocabList = [] } = useListeningVocab(5);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const startTime = useState(() => Date.now())[0];

  const current = vocabList[index];
  if (!current) {
    return <p className="text-center text-muted-foreground py-8">Tambah kosakata untuk latihan mengetik.</p>;
  }

  const checkAnswer = () => {
    const expected = (current.kana || current.kanji || "").trim();
    const ok = input.trim() === expected;
    if (ok) setScore((s) => s + 1);
    setFeedback(ok ? "Benar!" : `Salah. Jawaban: ${expected}`);

    setTimeout(() => {
      if (index + 1 >= vocabList.length) {
        onComplete(score + (ok ? 1 : 0), vocabList.length, Math.round((Date.now() - startTime) / 1000));
      } else {
        setIndex((i) => i + 1);
        setInput("");
        setFeedback(null);
      }
    }, 1200);
  };

  return (
    <Card className="nori-card max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Keyboard size={18} /> Ketik Kana/Kanji
        </CardTitle>
        <CardDescription>Arti: {current.meaning} ({index + 1}/{vocabList.length})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik jawaban..."
          className="font-jp text-lg"
          onKeyDown={(e) => e.key === "Enter" && !feedback && checkAnswer()}
        />
        {feedback && <p className={`text-sm ${feedback.startsWith("Benar") ? "text-secondary" : "text-destructive"}`}>{feedback}</p>}
        <Button className="w-full" onClick={checkAnswer} disabled={!!feedback || !input.trim()}>Periksa</Button>
      </CardContent>
    </Card>
  );
};

const PracticeHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultDrill = searchParams.get("drill") ?? "grammar";
  const [activeDrill, setActiveDrill] = useState(defaultDrill);
  const [level, setLevel] = useState("n5");
  const [sessionActive, setSessionActive] = useState(false);
  const [aiTopic, setAiTopic] = useState("文法");
  const [aiQuestions, setAiQuestions] = useState<PracticeQuestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: profile } = useProfile();
  const { data: grammarQuestions = [], isLoading: grammarLoading } = useGrammarDrillQuestions(
    profile?.default_jlpt_level ?? level,
    10
  );
  const saveSession = useSavePracticeSession();
  const addXP = useAddXP();
  const { startSession, endSession } = useStudySession();

  useEffect(() => {
    setActiveDrill(defaultDrill);
  }, [defaultDrill]);

  const handleDrillComplete = async (
    drillType: string,
    score: number,
    total: number,
    duration: number
  ) => {
    const xp = score * 5 + (score === total ? 10 : 0);
    await saveSession.mutateAsync({
      sessionType: drillType,
      score,
      totalQuestions: total,
      durationSeconds: duration,
      xpEarned: xp,
    });
    if (xp > 0) {
      addXP.mutate({ xp, activityType: "practice" });
      await endSession(xp);
    }
    toast.success(`Latihan selesai! +${xp} XP`);
    setSessionActive(false);
    setAiQuestions([]);
  };

  const startGrammar = () => {
    setSessionActive(true);
    startSession("practice_grammar");
  };

  const startAiQuiz = async () => {
    setAiLoading(true);
    setSessionActive(true);
    startSession("practice_ai_quiz");
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-quiz", {
        body: {
          title: aiTopic,
          content_excerpt: `Topik latihan: ${aiTopic} level ${level}`,
          level,
          category: "grammar",
          count: 5,
        },
      });
      if (error) throw error;
      setAiQuestions(data?.questions ?? []);
    } catch {
      toast.error("Gagal membuat kuis AI");
      setSessionActive(false);
    } finally {
      setAiLoading(false);
    }
  };

  if (sessionActive && activeDrill === "grammar") {
    return (
      <PracticeSession
        questions={grammarQuestions}
        title="Grammar Drill"
        isLoading={grammarLoading}
        onComplete={(s, t, d) => handleDrillComplete("grammar", s, t, d)}
        onExit={() => setSessionActive(false)}
      />
    );
  }

  if (sessionActive && activeDrill === "ai-quiz") {
    return (
      <PracticeSession
        questions={aiQuestions}
        title={`AI Quiz: ${aiTopic}`}
        isLoading={aiLoading}
        onComplete={(s, t, d) => handleDrillComplete("ai_quiz", s, t, d)}
        onExit={() => { setSessionActive(false); setAiQuestions([]); }}
      />
    );
  }

  if (sessionActive && activeDrill === "listening") {
    return (
      <ListeningDrill
        onComplete={(s, t, d) => handleDrillComplete("listening", s, t, d)}
      />
    );
  }

  if (sessionActive && activeDrill === "typing") {
    return (
      <TypingDrill
        onComplete={(s, t, d) => handleDrillComplete("typing", s, t, d)}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
          <Dumbbell className="text-primary" size={28} />
          Pusat Latihan
        </h1>
        <p className="text-muted-foreground mt-1">Drill terstruktur per skill — grammar, listening, typing, dan AI quiz</p>
      </div>

      <Tabs value={activeDrill} onValueChange={(v) => { setActiveDrill(v); setSearchParams({ drill: v }); }}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="grammar">Grammar</TabsTrigger>
          <TabsTrigger value="listening">Listening</TabsTrigger>
          <TabsTrigger value="typing">Typing</TabsTrigger>
          <TabsTrigger value="ai-quiz">AI Quiz</TabsTrigger>
          <TabsTrigger value="roleplay">Roleplay</TabsTrigger>
        </TabsList>

        <TabsContent value="grammar" className="mt-4">
          <Card className="nori-card">
            <CardHeader>
              <CardTitle>Grammar MCQ</CardTitle>
              <CardDescription>Soal tata bahasa dari bank ujian JLPT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["n5", "n4", "n3", "n2", "n1"].map((l) => (
                    <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={startGrammar} disabled={grammarLoading}>
                Mulai Grammar Drill (10 soal)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listening" className="mt-4">
          <Card className="nori-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Headphones size={18} /> Listening</CardTitle>
              <CardDescription>Dengar kata Jepang → pilih arti Bahasa Indonesia</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => { setSessionActive(true); startSession("practice_listening"); }}>
                Mulai Listening Drill
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typing" className="mt-4">
          <Card className="nori-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Keyboard size={18} /> Typing</CardTitle>
              <CardDescription>Lihat arti → ketik kana/kanji yang benar</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => { setSessionActive(true); startSession("practice_typing"); }}>
                Mulai Typing Drill
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-quiz" className="mt-4">
          <Card className="nori-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles size={18} /> AI Quiz</CardTitle>
              <CardDescription>Kuis MCQ interaktif generated by AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Topik, mis. 文法 N5" />
              <Button onClick={startAiQuiz} disabled={aiLoading}>
                {aiLoading ? "Menyiapkan..." : "Mulai AI Quiz"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roleplay" className="mt-4">
          <Card className="nori-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare size={18} /> Roleplay</CardTitle>
              <CardDescription>Latihan percakapan terstruktur via Sensei AI</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/ai-assistant">Buka Sensei AI — /practice</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default PracticeHub;
