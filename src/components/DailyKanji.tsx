import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const kanjiPool = [
  { character: "努", reading: "ど / つと(める)", meaning: "Effort, Endeavor", stroke: 7, example: "努力する (どりょくする) — to make an effort" },
  { character: "学", reading: "がく / まな(ぶ)", meaning: "Study, Learning", stroke: 8, example: "学生 (がくせい) — student" },
  { character: "食", reading: "しょく / た(べる)", meaning: "Eat, Food", stroke: 9, example: "食べ物 (たべもの) — food" },
  { character: "話", reading: "わ / はな(す)", meaning: "Talk, Story", stroke: 13, example: "電話 (でんわ) — telephone" },
  { character: "読", reading: "どく / よ(む)", meaning: "Read", stroke: 14, example: "読書 (どくしょ) — reading books" },
  { character: "書", reading: "しょ / か(く)", meaning: "Write", stroke: 10, example: "辞書 (じしょ) — dictionary" },
  { character: "見", reading: "けん / み(る)", meaning: "See, Look", stroke: 7, example: "花見 (はなみ) — flower viewing" },
  { character: "聞", reading: "ぶん / き(く)", meaning: "Hear, Listen", stroke: 14, example: "新聞 (しんぶん) — newspaper" },
  { character: "言", reading: "げん / い(う)", meaning: "Say, Word", stroke: 7, example: "言葉 (ことば) — word, language" },
  { character: "思", reading: "し / おも(う)", meaning: "Think, Feel", stroke: 9, example: "思い出 (おもいで) — memory" },
  { character: "行", reading: "こう / い(く)", meaning: "Go, Travel", stroke: 6, example: "旅行 (りょこう) — travel" },
  { character: "来", reading: "らい / く(る)", meaning: "Come, Next", stroke: 7, example: "来年 (らいねん) — next year" },
  { character: "時", reading: "じ / とき", meaning: "Time, Hour", stroke: 10, example: "時間 (じかん) — time" },
  { character: "人", reading: "じん / ひと", meaning: "Person, People", stroke: 2, example: "日本人 (にほんじん) — Japanese person" },
  { character: "日", reading: "にち / ひ", meaning: "Day, Sun", stroke: 4, example: "毎日 (まいにち) — every day" },
  { character: "大", reading: "だい / おお(きい)", meaning: "Big, Large", stroke: 3, example: "大学 (だいがく) — university" },
  { character: "小", reading: "しょう / ちい(さい)", meaning: "Small, Little", stroke: 3, example: "小説 (しょうせつ) — novel" },
  { character: "新", reading: "しん / あたら(しい)", meaning: "New, Fresh", stroke: 13, example: "新しい (あたらしい) — new" },
  { character: "友", reading: "ゆう / とも", meaning: "Friend", stroke: 4, example: "友達 (ともだち) — friend" },
  { character: "気", reading: "き / け", meaning: "Spirit, Energy", stroke: 6, example: "元気 (げんき) — healthy, energetic" },
  { character: "水", reading: "すい / みず", meaning: "Water", stroke: 4, example: "水曜日 (すいようび) — Wednesday" },
  { character: "火", reading: "か / ひ", meaning: "Fire", stroke: 4, example: "火山 (かざん) — volcano" },
  { character: "山", reading: "さん / やま", meaning: "Mountain", stroke: 3, example: "富士山 (ふじさん) — Mt. Fuji" },
  { character: "花", reading: "か / はな", meaning: "Flower", stroke: 7, example: "花火 (はなび) — fireworks" },
  { character: "空", reading: "くう / そら", meaning: "Sky, Empty", stroke: 8, example: "空港 (くうこう) — airport" },
  { character: "雨", reading: "う / あめ", meaning: "Rain", stroke: 8, example: "梅雨 (つゆ) — rainy season" },
  { character: "心", reading: "しん / こころ", meaning: "Heart, Mind", stroke: 4, example: "安心 (あんしん) — relief, peace of mind" },
  { character: "力", reading: "りょく / ちから", meaning: "Power, Strength", stroke: 2, example: "能力 (のうりょく) — ability" },
  { character: "夢", reading: "む / ゆめ", meaning: "Dream", stroke: 13, example: "夢中 (むちゅう) — absorbed, engrossed" },
  { character: "光", reading: "こう / ひかり", meaning: "Light, Ray", stroke: 6, example: "日光 (にっこう) — sunlight" },
  { character: "道", reading: "どう / みち", meaning: "Road, Way", stroke: 12, example: "道具 (どうぐ) — tool" },
];

// Pick kanji based on day of year so it changes daily
const getDailyIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return dayOfYear % kanjiPool.length;
};

const todayKanji = kanjiPool[getDailyIndex()];

const DailyKanji = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
  >
    <div className="flex items-center gap-2 mb-4">
      <Sparkles size={18} className="text-accent" />
      <h2 className="text-xl font-serif font-semibold text-foreground">Today's Kanji</h2>
    </div>

    <div className="zen-card text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
        className="mb-4"
      >
        <span className="text-7xl font-serif text-foreground">{todayKanji.character}</span>
      </motion.div>

      <p className="text-sm font-jp text-muted-foreground mb-1">{todayKanji.reading}</p>
      <p className="text-lg font-semibold text-foreground mb-1">{todayKanji.meaning}</p>
      <p className="text-xs text-muted-foreground mb-4">{todayKanji.stroke} strokes</p>

      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm font-jp text-foreground">{todayKanji.example}</p>
      </div>
    </div>
  </motion.div>
);

export default DailyKanji;
