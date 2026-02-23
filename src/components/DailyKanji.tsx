import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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
    { character: "小", reading: "しょう / ちい(さい)", meaning: "Small", stroke: 3, example: "小学校 (しょうがっこう) — SD" },
    { character: "山", reading: "さん / やま", meaning: "Mountain", stroke: 3, example: "富士山 (ふじさん) — Gunung Fuji" },
    { character: "水", reading: "すい / みず", meaning: "Water", stroke: 4, example: "水曜日 (すいようび) — Rabu" },
    { character: "火", reading: "か / ひ", meaning: "Fire", stroke: 4, example: "火山 (かざん) — gunung berapi" },
    { character: "友", reading: "ゆう / とも", meaning: "Friend", stroke: 4, example: "友達 (ともだち) — teman" },
    { character: "学", reading: "がく / まな(ぶ)", meaning: "Study", stroke: 8, example: "学生 (がくせい) — pelajar" },
    { character: "食", reading: "しょく / た(べる)", meaning: "Eat", stroke: 9, example: "食べ物 (たべもの) — makanan" },
    { character: "見", reading: "けん / み(る)", meaning: "See", stroke: 7, example: "花見 (はなみ) — melihat bunga" },
    { character: "聞", reading: "ぶん / き(く)", meaning: "Hear", stroke: 14, example: "新聞 (しんぶん) — koran" },
    { character: "言", reading: "げん / い(う)", meaning: "Say", stroke: 7, example: "言葉 (ことば) — kata" },
    { character: "読", reading: "どく / よ(む)", meaning: "Read", stroke: 14, example: "読書 (どくしょ) — membaca" },
    { character: "書", reading: "しょ / か(く)", meaning: "Write", stroke: 10, example: "辞書 (じしょ) — kamus" },
    { character: "行", reading: "こう / い(く)", meaning: "Go", stroke: 6, example: "旅行 (りょこう) — perjalanan" },
    { character: "来", reading: "らい / く(る)", meaning: "Come", stroke: 7, example: "来年 (らいねん) — tahun depan" },
    { character: "時", reading: "じ / とき", meaning: "Time", stroke: 10, example: "時間 (じかん) — waktu" },
    { character: "花", reading: "か / はな", meaning: "Flower", stroke: 7, example: "花火 (はなび) — kembang api" },
    { character: "空", reading: "くう / そら", meaning: "Sky", stroke: 8, example: "空港 (くうこう) — bandara" },
    { character: "雨", reading: "う / あめ", meaning: "Rain", stroke: 8, example: "梅雨 (つゆ) — musim hujan" },
    { character: "気", reading: "き / け", meaning: "Spirit", stroke: 6, example: "元気 (げんき) — sehat" },
    { character: "心", reading: "しん / こころ", meaning: "Heart", stroke: 4, example: "安心 (あんしん) — tenang" },
    { character: "力", reading: "りょく / ちから", meaning: "Power", stroke: 2, example: "能力 (のうりょく) — kemampuan" },
    { character: "光", reading: "こう / ひかり", meaning: "Light", stroke: 6, example: "日光 (にっこう) — sinar matahari" },
    { character: "新", reading: "しん / あたら(しい)", meaning: "New", stroke: 13, example: "新しい (あたらしい) — baru" },
    { character: "話", reading: "わ / はな(す)", meaning: "Talk", stroke: 13, example: "電話 (でんわ) — telepon" },
    { character: "思", reading: "し / おも(う)", meaning: "Think", stroke: 9, example: "思い出 (おもいで) — kenangan" },
    { character: "道", reading: "どう / みち", meaning: "Road", stroke: 12, example: "道具 (どうぐ) — alat" },
    { character: "夢", reading: "む / ゆめ", meaning: "Dream", stroke: 13, example: "夢中 (むちゅう) — terpesona" },
    { character: "努", reading: "ど / つと(める)", meaning: "Effort", stroke: 7, example: "努力 (どりょく) — usaha" },
  ],
  n4: [
    { character: "届", reading: "とど(ける)", meaning: "Deliver", stroke: 8, example: "届ける (とどける) — mengirimkan" },
    { character: "運", reading: "うん / はこ(ぶ)", meaning: "Carry, Luck", stroke: 12, example: "運動 (うんどう) — olahraga" },
    { character: "転", reading: "てん / ころ(がる)", meaning: "Roll, Turn", stroke: 11, example: "自転車 (じてんしゃ) — sepeda" },
    { character: "産", reading: "さん / う(む)", meaning: "Produce", stroke: 11, example: "産業 (さんぎょう) — industri" },
    { character: "業", reading: "ぎょう / わざ", meaning: "Business", stroke: 13, example: "卒業 (そつぎょう) — kelulusan" },
    { character: "決", reading: "けつ / き(める)", meaning: "Decide", stroke: 7, example: "決める (きめる) — memutuskan" },
    { character: "送", reading: "そう / おく(る)", meaning: "Send", stroke: 9, example: "送る (おくる) — mengirim" },
    { character: "急", reading: "きゅう / いそ(ぐ)", meaning: "Hurry", stroke: 9, example: "急行 (きゅうこう) — ekspres" },
    { character: "集", reading: "しゅう / あつ(まる)", meaning: "Gather", stroke: 12, example: "集める (あつめる) — mengumpulkan" },
    { character: "開", reading: "かい / ひら(く)", meaning: "Open", stroke: 12, example: "開く (ひらく) — membuka" },
    { character: "閉", reading: "へい / し(める)", meaning: "Close", stroke: 11, example: "閉める (しめる) — menutup" },
    { character: "止", reading: "し / と(まる)", meaning: "Stop", stroke: 4, example: "中止 (ちゅうし) — pembatalan" },
    { character: "走", reading: "そう / はし(る)", meaning: "Run", stroke: 7, example: "走る (はしる) — berlari" },
    { character: "起", reading: "き / お(きる)", meaning: "Wake up", stroke: 10, example: "起きる (おきる) — bangun" },
    { character: "使", reading: "し / つか(う)", meaning: "Use", stroke: 8, example: "使う (つかう) — menggunakan" },
    { character: "持", reading: "じ / も(つ)", meaning: "Hold", stroke: 9, example: "持つ (もつ) — memegang" },
    { character: "待", reading: "たい / ま(つ)", meaning: "Wait", stroke: 9, example: "待つ (まつ) — menunggu" },
    { character: "始", reading: "し / はじ(める)", meaning: "Begin", stroke: 8, example: "始める (はじめる) — memulai" },
    { character: "終", reading: "しゅう / お(わる)", meaning: "End", stroke: 11, example: "終わる (おわる) — berakhir" },
    { character: "住", reading: "じゅう / す(む)", meaning: "Live, Reside", stroke: 7, example: "住む (すむ) — tinggal" },
    { character: "働", reading: "どう / はたら(く)", meaning: "Work", stroke: 13, example: "働く (はたらく) — bekerja" },
    { character: "歩", reading: "ほ / ある(く)", meaning: "Walk", stroke: 8, example: "歩く (あるく) — berjalan" },
    { character: "知", reading: "ち / し(る)", meaning: "Know", stroke: 8, example: "知る (しる) — mengetahui" },
    { character: "考", reading: "こう / かんが(える)", meaning: "Think", stroke: 6, example: "考える (かんがえる) — berpikir" },
    { character: "教", reading: "きょう / おし(える)", meaning: "Teach", stroke: 11, example: "教える (おしえる) — mengajar" },
    { character: "習", reading: "しゅう / なら(う)", meaning: "Learn", stroke: 11, example: "習う (ならう) — belajar" },
    { character: "研", reading: "けん / と(ぐ)", meaning: "Polish, Research", stroke: 9, example: "研究 (けんきゅう) — penelitian" },
    { character: "質", reading: "しつ / たち", meaning: "Quality", stroke: 15, example: "質問 (しつもん) — pertanyaan" },
    { character: "問", reading: "もん / と(う)", meaning: "Question", stroke: 11, example: "問題 (もんだい) — masalah" },
    { character: "答", reading: "とう / こた(える)", meaning: "Answer", stroke: 12, example: "答える (こたえる) — menjawab" },
    { character: "試", reading: "し / こころ(みる)", meaning: "Try, Test", stroke: 13, example: "試験 (しけん) — ujian" },
  ],
  n3: [
    { character: "退", reading: "たい / しりぞ(く)", meaning: "Retreat", stroke: 9, example: "退院 (たいいん) — keluar RS" },
    { character: "届", reading: "とど(ける)", meaning: "Deliver", stroke: 8, example: "届ける — mengirimkan" },
    { character: "値", reading: "ち / ね / あたい", meaning: "Value, Price", stroke: 10, example: "値段 (ねだん) — harga" },
    { character: "権", reading: "けん / ごん", meaning: "Authority", stroke: 15, example: "権利 (けんり) — hak" },
    { character: "制", reading: "せい", meaning: "System, Control", stroke: 8, example: "制度 (せいど) — sistem" },
    { character: "政", reading: "せい / まつりごと", meaning: "Politics", stroke: 9, example: "政治 (せいじ) — politik" },
    { character: "経", reading: "けい / へ(る)", meaning: "Pass through", stroke: 11, example: "経験 (けいけん) — pengalaman" },
    { character: "済", reading: "さい / す(む)", meaning: "Finish, Settle", stroke: 11, example: "経済 (けいざい) — ekonomi" },
    { character: "容", reading: "よう", meaning: "Contain, Form", stroke: 10, example: "内容 (ないよう) — isi/konten" },
    { character: "認", reading: "にん / みと(める)", meaning: "Recognize", stroke: 14, example: "確認 (かくにん) — konfirmasi" },
    { character: "関", reading: "かん / せき", meaning: "Related", stroke: 14, example: "関係 (かんけい) — hubungan" },
    { character: "係", reading: "けい / かかり", meaning: "Connection", stroke: 9, example: "関係 (かんけい) — relasi" },
    { character: "供", reading: "きょう / とも", meaning: "Offer, Child", stroke: 8, example: "子供 (こども) — anak" },
    { character: "割", reading: "かつ / わ(る)", meaning: "Divide", stroke: 12, example: "割引 (わりびき) — diskon" },
    { character: "比", reading: "ひ / くら(べる)", meaning: "Compare", stroke: 4, example: "比べる (くらべる) — membandingkan" },
    { character: "較", reading: "かく", meaning: "Compare", stroke: 13, example: "比較 (ひかく) — perbandingan" },
    { character: "増", reading: "ぞう / ふ(える)", meaning: "Increase", stroke: 14, example: "増える (ふえる) — bertambah" },
    { character: "減", reading: "げん / へ(る)", meaning: "Decrease", stroke: 12, example: "減る (へる) — berkurang" },
    { character: "際", reading: "さい / きわ", meaning: "Occasion", stroke: 14, example: "国際 (こくさい) — internasional" },
    { character: "状", reading: "じょう", meaning: "Condition", stroke: 7, example: "状態 (じょうたい) — keadaan" },
    { character: "況", reading: "きょう", meaning: "Situation", stroke: 7, example: "状況 (じょうきょう) — situasi" },
    { character: "非", reading: "ひ", meaning: "Non-, Fault", stroke: 8, example: "非常 (ひじょう) — darurat" },
    { character: "常", reading: "じょう / つね", meaning: "Normal, Always", stroke: 11, example: "日常 (にちじょう) — sehari-hari" },
    { character: "識", reading: "しき", meaning: "Knowledge", stroke: 19, example: "知識 (ちしき) — pengetahuan" },
    { character: "職", reading: "しょく", meaning: "Occupation", stroke: 18, example: "職業 (しょくぎょう) — pekerjaan" },
    { character: "務", reading: "む / つと(める)", meaning: "Duty", stroke: 11, example: "事務所 (じむしょ) — kantor" },
    { character: "労", reading: "ろう", meaning: "Labor", stroke: 7, example: "労働 (ろうどう) — tenaga kerja" },
    { character: "効", reading: "こう / き(く)", meaning: "Effect", stroke: 8, example: "効果 (こうか) — efek" },
    { character: "率", reading: "りつ / そつ", meaning: "Rate, Ratio", stroke: 11, example: "効率 (こうりつ) — efisiensi" },
    { character: "導", reading: "どう / みちび(く)", meaning: "Guide", stroke: 15, example: "指導 (しどう) — bimbingan" },
    { character: "構", reading: "こう / かま(える)", meaning: "Structure", stroke: 14, example: "構造 (こうぞう) — struktur" },
  ],
  n2: [
    { character: "維", reading: "い", meaning: "Fiber, Maintain", stroke: 14, example: "維持 (いじ) — pemeliharaan" },
    { character: "織", reading: "しょく / お(る)", meaning: "Weave, Organization", stroke: 18, example: "組織 (そしき) — organisasi" },
    { character: "圧", reading: "あつ", meaning: "Pressure", stroke: 5, example: "気圧 (きあつ) — tekanan udara" },
    { character: "存", reading: "そん / ぞん", meaning: "Exist", stroke: 6, example: "存在 (そんざい) — keberadaan" },
    { character: "在", reading: "ざい", meaning: "Exist, Be at", stroke: 6, example: "現在 (げんざい) — saat ini" },
    { character: "処", reading: "しょ", meaning: "Place, Deal with", stroke: 5, example: "処理 (しょり) — pemrosesan" },
    { character: "策", reading: "さく", meaning: "Plan, Scheme", stroke: 12, example: "対策 (たいさく) — tindakan" },
    { character: "略", reading: "りゃく", meaning: "Strategy, Omit", stroke: 11, example: "戦略 (せんりゃく) — strategi" },
    { character: "環", reading: "かん", meaning: "Ring, Circle", stroke: 17, example: "環境 (かんきょう) — lingkungan" },
    { character: "境", reading: "きょう / さかい", meaning: "Boundary", stroke: 14, example: "環境 (かんきょう) — lingkungan" },
    { character: "汚", reading: "お / けが(す) / よご(す)", meaning: "Dirty", stroke: 6, example: "汚染 (おせん) — polusi" },
    { character: "染", reading: "せん / そ(める)", meaning: "Dye, Infect", stroke: 9, example: "感染 (かんせん) — infeksi" },
    { character: "革", reading: "かく / かわ", meaning: "Leather, Reform", stroke: 9, example: "改革 (かいかく) — reformasi" },
    { character: "創", reading: "そう / つく(る)", meaning: "Create", stroke: 12, example: "創造 (そうぞう) — penciptaan" },
    { character: "豊", reading: "ほう / ゆた(か)", meaning: "Abundant", stroke: 13, example: "豊か (ゆたか) — berlimpah" },
    { character: "貧", reading: "ひん / まず(しい)", meaning: "Poor", stroke: 11, example: "貧乏 (びんぼう) — miskin" },
    { character: "富", reading: "ふ / と(む)", meaning: "Wealth", stroke: 12, example: "豊富 (ほうふ) — berlimpah" },
    { character: "刊", reading: "かん", meaning: "Publish", stroke: 5, example: "出版 (しゅっぱん) — penerbitan" },
    { character: "版", reading: "はん", meaning: "Edition, Printing", stroke: 8, example: "出版 (しゅっぱん) — penerbitan" },
    { character: "誌", reading: "し", meaning: "Magazine", stroke: 14, example: "雑誌 (ざっし) — majalah" },
    { character: "編", reading: "へん / あ(む)", meaning: "Compile, Knit", stroke: 15, example: "編集 (へんしゅう) — editing" },
    { character: "訳", reading: "やく / わけ", meaning: "Translate, Reason", stroke: 11, example: "翻訳 (ほんやく) — terjemahan" },
    { character: "翻", reading: "ほん / ひるがえ(る)", meaning: "Flip, Translate", stroke: 18, example: "翻訳 (ほんやく) — terjemahan" },
    { character: "描", reading: "びょう / えが(く)", meaning: "Draw, Depict", stroke: 11, example: "描く (えがく) — menggambar" },
    { character: "載", reading: "さい / の(せる)", meaning: "Publish, Load", stroke: 13, example: "記載 (きさい) — pencatatan" },
    { character: "掲", reading: "けい / かか(げる)", meaning: "Display, Put up", stroke: 11, example: "掲載 (けいさい) — pemuatan" },
    { character: "抗", reading: "こう", meaning: "Resist", stroke: 7, example: "抵抗 (ていこう) — perlawanan" },
    { character: "抵", reading: "てい", meaning: "Resist", stroke: 8, example: "抵抗 (ていこう) — perlawanan" },
    { character: "衝", reading: "しょう", meaning: "Collision", stroke: 15, example: "衝撃 (しょうげき) — dampak" },
    { character: "撃", reading: "げき / う(つ)", meaning: "Attack, Strike", stroke: 15, example: "攻撃 (こうげき) — serangan" },
    { character: "飢", reading: "き / う(える)", meaning: "Starve", stroke: 10, example: "飢餓 (きが) — kelaparan" },
  ],
  n1: [
    { character: "璧", reading: "へき", meaning: "Perfect Jewel", stroke: 18, example: "完璧 (かんぺき) — sempurna" },
    { character: "瞬", reading: "しゅん / またた(く)", meaning: "Blink, Instant", stroke: 18, example: "一瞬 (いっしゅん) — sekejap" },
    { character: "嘆", reading: "たん / なげ(く)", meaning: "Sigh, Lament", stroke: 13, example: "嘆く (なげく) — meratap" },
    { character: "憂", reading: "ゆう / うれ(い)", meaning: "Grief, Worry", stroke: 15, example: "憂鬱 (ゆううつ) — depresi" },
    { character: "慨", reading: "がい", meaning: "Indignation", stroke: 13, example: "感慨 (かんがい) — perasaan haru" },
    { character: "憤", reading: "ふん / いきどお(る)", meaning: "Anger", stroke: 15, example: "憤慨 (ふんがい) — kemarahan" },
    { character: "漠", reading: "ばく", meaning: "Vague, Desert", stroke: 13, example: "漠然 (ばくぜん) — samar" },
    { character: "膨", reading: "ぼう / ふく(らむ)", meaning: "Swell, Expand", stroke: 16, example: "膨大 (ぼうだい) — sangat besar" },
    { character: "摯", reading: "し", meaning: "Sincere", stroke: 15, example: "真摯 (しんし) — tulus" },
    { character: "朴", reading: "ぼく", meaning: "Simple, Plain", stroke: 6, example: "素朴 (そぼく) — sederhana" },
    { character: "奔", reading: "ほん", meaning: "Run, Rush", stroke: 8, example: "奔走 (ほんそう) — berlari-lari" },
    { character: "拍", reading: "はく", meaning: "Clap, Beat", stroke: 8, example: "拍手 (はくしゅ) — tepuk tangan" },
    { character: "泰", reading: "たい", meaning: "Calm, Peaceful", stroke: 10, example: "泰然 (たいぜん) — tenang" },
    { character: "粛", reading: "しゅく", meaning: "Solemn", stroke: 11, example: "厳粛 (げんしゅく) — khidmat" },
    { character: "繊", reading: "せん", meaning: "Fiber, Slender", stroke: 17, example: "繊維 (せんい) — serat" },
    { character: "淘", reading: "とう", meaning: "Wash, Select", stroke: 11, example: "淘汰 (とうた) — seleksi alam" },
    { character: "汰", reading: "た / おご(る)", meaning: "Luxury, Select", stroke: 7, example: "淘汰 (とうた) — seleksi" },
    { character: "紛", reading: "ふん / まぎ(れる)", meaning: "Confusion", stroke: 10, example: "紛争 (ふんそう) — konflik" },
    { character: "糾", reading: "きゅう", meaning: "Investigate", stroke: 9, example: "糾弾 (きゅうだん) — kecaman" },
    { character: "弾", reading: "だん / ひ(く)", meaning: "Bullet, Play", stroke: 12, example: "弾く (ひく) — memainkan" },
    { character: "搾", reading: "さく / しぼ(る)", meaning: "Squeeze", stroke: 13, example: "搾取 (さくしゅ) — eksploitasi" },
    { character: "畏", reading: "い / おそ(れる)", meaning: "Fear, Awe", stroke: 9, example: "畏敬 (いけい) — penghormatan" },
    { character: "顕", reading: "けん", meaning: "Manifest", stroke: 18, example: "顕著 (けんちょ) — nyata" },
    { character: "賄", reading: "わい / まかな(う)", meaning: "Bribe, Provide", stroke: 13, example: "賄賂 (わいろ) — suap" },
    { character: "賂", reading: "ろ", meaning: "Bribe", stroke: 13, example: "賄賂 (わいろ) — suap" },
    { character: "遮", reading: "しゃ / さえぎ(る)", meaning: "Interrupt", stroke: 14, example: "遮る (さえぎる) — menghalangi" },
    { character: "遡", reading: "そ / さかのぼ(る)", meaning: "Go back", stroke: 13, example: "遡る (さかのぼる) — menelusuri" },
    { character: "凝", reading: "ぎょう / こ(る)", meaning: "Congeal", stroke: 16, example: "凝る (こる) — menyukai" },
    { character: "拙", reading: "せつ / つたな(い)", meaning: "Unskillful", stroke: 8, example: "拙い (つたない) — ceroboh" },
    { character: "斥", reading: "せき", meaning: "Repel", stroke: 5, example: "排斥 (はいせき) — pengusiran" },
    { character: "把", reading: "は", meaning: "Grasp", stroke: 7, example: "把握 (はあく) — pemahaman" },
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-accent" />
        <h2 className="text-xl font-serif font-semibold text-foreground">Today's Kanji</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">{level}</span>
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
};

export default DailyKanji;
