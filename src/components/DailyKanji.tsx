import { useProfile } from "@/hooks/useDashboardData";

type KanjiEntry = {
  character: string;
  reading: string;
  meaning: string;
  stroke: number;
  example: string;
};

const kanjiPoolByLevel: Record<string, KanjiEntry[]> = {
  n5: [
    { character: "人", reading: "じん / ひと", meaning: "Person", stroke: 2, example: "日本人 (にほんじん) — orang Jepang" },
    { character: "日", reading: "にち / ひ", meaning: "Day, Sun", stroke: 4, example: "毎日 (まいにち) — setiap hari" },
    { character: "大", reading: "だい / おお(きい)", meaning: "Big", stroke: 3, example: "大学 (だいがく) — universitas" },
    { character: "学", reading: "がく / まな(ぶ)", meaning: "Study", stroke: 8, example: "学生 (がくせい) — pelajar" },
    { character: "食", reading: "しょく / た(べる)", meaning: "Eat", stroke: 9, example: "食べ物 (たべもの) — makanan" },
  ],
  n4: [
    { character: "届", reading: "とど(ける)", meaning: "Deliver", stroke: 8, example: "届ける (とどける) — mengirimkan" },
    { character: "習", reading: "しゅう / なら(う)", meaning: "Learn", stroke: 11, example: "習う (ならう) — belajar" },
  ],
  n3: [
    { character: "認", reading: "にん / みと(める)", meaning: "Recognize", stroke: 14, example: "確認 (かくにん) — konfirmasi" },
  ],
  n2: [
    { character: "環", reading: "かん", meaning: "Ring, Circle", stroke: 17, example: "環境 (かんきょう) — lingkungan" },
  ],
  n1: [
    { character: "瞬", reading: "しゅん / またた(く)", meaning: "Blink, Instant", stroke: 18, example: "一瞬 (いっしゅん) — sekejap" },
  ],
};

const getDailyIndex = (poolLength: number) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return dayOfYear % poolLength;
};

const DailyKanji = () => {
  const { data: profile } = useProfile();
  const level = profile?.default_jlpt_level ?? "n5";
  const pool = kanjiPoolByLevel[level] ?? kanjiPoolByLevel.n5;
  const todayKanji = pool[getDailyIndex(pool.length)];

  return (
    <div>
      <p className="nori-jp-display text-2xl mb-1">漢字</p>
      <h2 className="nori-section-title mb-4">Today&apos;s Kanji</h2>

      <div className="nori-card text-center">
        <span className="text-7xl font-jp text-foreground block mb-4">{todayKanji.character}</span>
        <p className="text-sm font-jp text-muted-foreground mb-1">{todayKanji.reading}</p>
        <p className="text-lg font-bold text-foreground mb-1 normal-case tracking-normal">{todayKanji.meaning}</p>
        <p className="text-xs text-muted-foreground mb-4 normal-case">{todayKanji.stroke} strokes</p>
        <div className="border border-border rounded-md p-3 bg-muted">
          <p className="text-sm font-jp text-foreground">{todayKanji.example}</p>
        </div>
        <span className="inline-block mt-4 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 border border-primary text-primary">
          {level}
        </span>
      </div>
    </div>
  );
};

export default DailyKanji;
