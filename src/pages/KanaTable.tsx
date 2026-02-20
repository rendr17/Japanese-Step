import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ── Base tables ──────────────────────────────────────────────────────────────

const hiraganaRows = [
  { vowel: "a",  chars: ["あ","い","う","え","お"] },
  { vowel: "ka", chars: ["か","き","く","け","こ"] },
  { vowel: "sa", chars: ["さ","し","す","せ","そ"] },
  { vowel: "ta", chars: ["た","ち","つ","て","と"] },
  { vowel: "na", chars: ["な","に","ぬ","ね","の"] },
  { vowel: "ha", chars: ["は","ひ","ふ","へ","ほ"] },
  { vowel: "ma", chars: ["ま","み","む","め","も"] },
  { vowel: "ya", chars: ["や","","ゆ","","よ"] },
  { vowel: "ra", chars: ["ら","り","る","れ","ろ"] },
  { vowel: "wa", chars: ["わ","","","","を"] },
  { vowel: "n",  chars: ["ん","","","",""] },
];

const katakanaRows = [
  { vowel: "a",  chars: ["ア","イ","ウ","エ","オ"] },
  { vowel: "ka", chars: ["カ","キ","ク","ケ","コ"] },
  { vowel: "sa", chars: ["サ","シ","ス","セ","ソ"] },
  { vowel: "ta", chars: ["タ","チ","ツ","テ","ト"] },
  { vowel: "na", chars: ["ナ","ニ","ヌ","ネ","ノ"] },
  { vowel: "ha", chars: ["ハ","ヒ","フ","ヘ","ホ"] },
  { vowel: "ma", chars: ["マ","ミ","ム","メ","モ"] },
  { vowel: "ya", chars: ["ヤ","","ユ","","ヨ"] },
  { vowel: "ra", chars: ["ラ","リ","ル","レ","ロ"] },
  { vowel: "wa", chars: ["ワ","","","","ヲ"] },
  { vowel: "n",  chars: ["ン","","","",""] },
];

const baseRomaji = [
  ["a","i","u","e","o"],
  ["ka","ki","ku","ke","ko"],
  ["sa","shi","su","se","so"],
  ["ta","chi","tsu","te","to"],
  ["na","ni","nu","ne","no"],
  ["ha","hi","fu","he","ho"],
  ["ma","mi","mu","me","mo"],
  ["ya","","yu","","yo"],
  ["ra","ri","ru","re","ro"],
  ["wa","","","","wo"],
  ["n","","","",""],
];

// ── Dakuten ───────────────────────────────────────────────────────────────────

const dakutenHiragana = [
  { label: "が行 (ga)", chars: ["が","ぎ","ぐ","げ","ご"] },
  { label: "ざ行 (za)", chars: ["ざ","じ","ず","ぜ","ぞ"] },
  { label: "だ行 (da)", chars: ["だ","ぢ","づ","で","ど"] },
  { label: "ば行 (ba)", chars: ["ば","び","ぶ","べ","ぼ"] },
  { label: "ぱ行 (pa)", chars: ["ぱ","ぴ","ぷ","ぺ","ぽ"] },
];

const dakutenKatakana = [
  { label: "ガ行 (ga)", chars: ["ガ","ギ","グ","ゲ","ゴ"] },
  { label: "ザ行 (za)", chars: ["ザ","ジ","ズ","ゼ","ゾ"] },
  { label: "ダ行 (da)", chars: ["ダ","ヂ","ヅ","デ","ド"] },
  { label: "バ行 (ba)", chars: ["バ","ビ","ブ","ベ","ボ"] },
  { label: "パ行 (pa)", chars: ["パ","ピ","プ","ペ","ポ"] },
];

const dakutenRomaji = [
  ["ga","gi","gu","ge","go"],
  ["za","ji","zu","ze","zo"],
  ["da","di","du","de","do"],
  ["ba","bi","bu","be","bo"],
  ["pa","pi","pu","pe","po"],
];

// ── Youon (combinations) ──────────────────────────────────────────────────────

const youonHiragana = [
  { base: "きゃ行", chars: ["きゃ","きゅ","きょ"], roma: ["kya","kyu","kyo"] },
  { base: "しゃ行", chars: ["しゃ","しゅ","しょ"], roma: ["sha","shu","sho"] },
  { base: "ちゃ行", chars: ["ちゃ","ちゅ","ちょ"], roma: ["cha","chu","cho"] },
  { base: "にゃ行", chars: ["にゃ","にゅ","にょ"], roma: ["nya","nyu","nyo"] },
  { base: "ひゃ行", chars: ["ひゃ","ひゅ","ひょ"], roma: ["hya","hyu","hyo"] },
  { base: "みゃ行", chars: ["みゃ","みゅ","みょ"], roma: ["mya","myu","myo"] },
  { base: "りゃ行", chars: ["りゃ","りゅ","りょ"], roma: ["rya","ryu","ryo"] },
  { base: "ぎゃ行", chars: ["ぎゃ","ぎゅ","ぎょ"], roma: ["gya","gyu","gyo"] },
  { base: "じゃ行", chars: ["じゃ","じゅ","じょ"], roma: ["ja","ju","jo"] },
  { base: "びゃ行", chars: ["びゃ","びゅ","びょ"], roma: ["bya","byu","byo"] },
  { base: "ぴゃ行", chars: ["ぴゃ","ぴゅ","ぴょ"], roma: ["pya","pyu","pyo"] },
];

const youonKatakana = [
  { base: "キャ行", chars: ["キャ","キュ","キョ"], roma: ["kya","kyu","kyo"] },
  { base: "シャ行", chars: ["シャ","シュ","ショ"], roma: ["sha","shu","sho"] },
  { base: "チャ行", chars: ["チャ","チュ","チョ"], roma: ["cha","chu","cho"] },
  { base: "ニャ行", chars: ["ニャ","ニュ","ニョ"], roma: ["nya","nyu","nyo"] },
  { base: "ヒャ行", chars: ["ヒャ","ヒュ","ヒョ"], roma: ["hya","hyu","hyo"] },
  { base: "ミャ行", chars: ["ミャ","ミュ","ミョ"], roma: ["mya","myu","myo"] },
  { base: "リャ行", chars: ["リャ","リュ","リョ"], roma: ["rya","ryu","ryo"] },
  { base: "ギャ行", chars: ["ギャ","ギュ","ギョ"], roma: ["gya","gyu","gyo"] },
  { base: "ジャ行", chars: ["ジャ","ジュ","ジョ"], roma: ["ja","ju","jo"] },
  { base: "ビャ行", chars: ["ビャ","ビュ","ビョ"], roma: ["bya","byu","byo"] },
  { base: "ピャ行", chars: ["ピャ","ピュ","ピョ"], roma: ["pya","pyu","pyo"] },
];

// ── Numbers ───────────────────────────────────────────────────────────────────

const numbers = [
  { num: 0,    kanji: "零",      kana: "れい / ゼロ",  roma: "rei / zero" },
  { num: 1,    kanji: "一",      kana: "いち",          roma: "ichi" },
  { num: 2,    kanji: "二",      kana: "に",            roma: "ni" },
  { num: 3,    kanji: "三",      kana: "さん",          roma: "san" },
  { num: 4,    kanji: "四",      kana: "し / よん",     roma: "shi / yon" },
  { num: 5,    kanji: "五",      kana: "ご",            roma: "go" },
  { num: 6,    kanji: "六",      kana: "ろく",          roma: "roku" },
  { num: 7,    kanji: "七",      kana: "しち / なな",   roma: "shichi / nana" },
  { num: 8,    kanji: "八",      kana: "はち",          roma: "hachi" },
  { num: 9,    kanji: "九",      kana: "く / きゅう",   roma: "ku / kyuu" },
  { num: 10,   kanji: "十",      kana: "じゅう",        roma: "juu" },
  { num: 11,   kanji: "十一",    kana: "じゅういち",    roma: "juuichi" },
  { num: 12,   kanji: "十二",    kana: "じゅうに",      roma: "juuni" },
  { num: 20,   kanji: "二十",    kana: "にじゅう",      roma: "nijuu" },
  { num: 30,   kanji: "三十",    kana: "さんじゅう",    roma: "sanjuu" },
  { num: 40,   kanji: "四十",    kana: "よんじゅう",    roma: "yonjuu" },
  { num: 50,   kanji: "五十",    kana: "ごじゅう",      roma: "gojuu" },
  { num: 60,   kanji: "六十",    kana: "ろくじゅう",    roma: "rokujuu" },
  { num: 70,   kanji: "七十",    kana: "ななじゅう",    roma: "nanajuu" },
  { num: 80,   kanji: "八十",    kana: "はちじゅう",    roma: "hachijuu" },
  { num: 90,   kanji: "九十",    kana: "きゅうじゅう",  roma: "kyuujuu" },
  { num: 100,  kanji: "百",      kana: "ひゃく",        roma: "hyaku" },
  { num: 200,  kanji: "二百",    kana: "にひゃく",      roma: "nihyaku" },
  { num: 300,  kanji: "三百",    kana: "さんびゃく",    roma: "sanbyaku" },
  { num: 1000, kanji: "千",      kana: "せん",          roma: "sen" },
  { num: 10000,kanji: "万",      kana: "まん",          roma: "man" },
];

const vowelHeaders = ["a", "i", "u", "e", "o"];

// ── Components ────────────────────────────────────────────────────────────────

const KanaCell = ({ kana, roma }: { kana: string; roma: string }) => {
  const [flipped, setFlipped] = useState(false);
  if (!kana) return <div className="w-14 h-14" />;
  return (
    <button
      onClick={() => setFlipped(!flipped)}
      className="w-14 h-14 rounded-xl border border-border bg-card hover:bg-muted/60 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer select-none"
    >
      {!flipped ? (
        <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
          {kana}
        </span>
      ) : (
        <span className="text-sm font-semibold text-primary">{roma}</span>
      )}
    </button>
  );
};

const YouonCell = ({ kana, roma }: { kana: string; roma: string }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped(!flipped)}
      className="w-16 h-14 rounded-xl border border-border bg-card hover:bg-muted/60 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer select-none px-1"
    >
      {!flipped ? (
        <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
          {kana}
        </span>
      ) : (
        <span className="text-xs font-semibold text-primary">{roma}</span>
      )}
    </button>
  );
};

const KanaGrid = ({ rows, romajiMap }: { rows: { vowel: string; chars: string[] }[]; romajiMap: string[][] }) => (
  <div className="overflow-x-auto">
    <table className="border-separate border-spacing-1">
      <thead>
        <tr>
          <th className="w-10" />
          {vowelHeaders.map((v) => (
            <th key={v} className="w-14 text-center text-xs font-semibold text-muted-foreground pb-1 uppercase tracking-wider">
              -{v}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={row.vowel}>
            <td className="text-xs font-semibold text-muted-foreground pr-2 text-right w-10 uppercase tracking-wider">
              {row.vowel}-
            </td>
            {row.chars.map((kana, ci) => (
              <td key={ci}>
                <KanaCell kana={kana} roma={romajiMap[ri]?.[ci] ?? ""} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DakutenGrid = ({ groups, romajiMap }: { groups: { label: string; chars: string[] }[]; romajiMap: string[][] }) => (
  <div className="space-y-2">
    {groups.map((group, gi) => (
      <div key={group.label} className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">{group.label}</span>
        <div className="flex gap-1">
          {group.chars.map((kana, ci) => (
            <KanaCell key={ci} kana={kana} roma={romajiMap[gi]?.[ci] ?? ""} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const YouonGrid = ({ groups }: { groups: { base: string; chars: string[]; roma: string[] }[] }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3 mb-2">
      <span className="w-24 shrink-0" />
      {["‐ya","‐yu","‐yo"].map((h) => (
        <span key={h} className="w-16 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
      ))}
    </div>
    {groups.map((g) => (
      <div key={g.base} className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{g.base}</span>
        <div className="flex gap-1">
          {g.chars.map((kana, ci) => (
            <YouonCell key={ci} kana={kana} roma={g.roma[ci]} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const NumbersTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-separate border-spacing-y-1">
      <thead>
        <tr>
          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Angka</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kanji</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kana</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Romaji</th>
        </tr>
      </thead>
      <tbody>
        {numbers.map((n) => (
          <tr key={n.num} className="bg-card rounded-lg hover:bg-muted/40 transition-colors">
            <td className="px-3 py-2.5 font-bold text-primary rounded-l-xl">{n.num.toLocaleString()}</td>
            <td className="px-3 py-2.5 font-bold text-foreground text-lg" style={{ fontFamily: "'Noto Serif JP', serif" }}>{n.kanji}</td>
            <td className="px-3 py-2.5 text-foreground" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{n.kana}</td>
            <td className="px-3 py-2.5 text-muted-foreground rounded-r-xl">{n.roma}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const KanaTable = () => (
  <div className="p-6 space-y-6 max-w-4xl">
    <div>
      <h1 className="text-2xl font-serif font-bold text-foreground">Tabel Kana & Angka</h1>
      <p className="text-muted-foreground text-sm mt-1">Klik karakter untuk melihat cara bacanya (romaji)</p>
    </div>

    <Tabs defaultValue="hiragana">
      <TabsList className="mb-6 flex-wrap h-auto gap-1">
        <TabsTrigger value="hiragana">
          ひらがな <Badge variant="outline" className="ml-1.5 text-[10px]">Hiragana</Badge>
        </TabsTrigger>
        <TabsTrigger value="katakana">
          カタカナ <Badge variant="outline" className="ml-1.5 text-[10px]">Katakana</Badge>
        </TabsTrigger>
        <TabsTrigger value="youon">
          きゃ・しゅ <Badge variant="outline" className="ml-1.5 text-[10px]">Youon</Badge>
        </TabsTrigger>
        <TabsTrigger value="numbers">
          １２３ <Badge variant="outline" className="ml-1.5 text-[10px]">Angka</Badge>
        </TabsTrigger>
      </TabsList>

      {/* Hiragana */}
      <TabsContent value="hiragana" className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Hiragana Dasar</h2>
          <KanaGrid rows={hiraganaRows} romajiMap={baseRomaji} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Dakuten & Handakuten</h2>
          <DakutenGrid groups={dakutenHiragana} romajiMap={dakutenRomaji} />
        </div>
      </TabsContent>

      {/* Katakana */}
      <TabsContent value="katakana" className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Katakana Dasar</h2>
          <KanaGrid rows={katakanaRows} romajiMap={baseRomaji} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Dakuten & Handakuten</h2>
          <DakutenGrid groups={dakutenKatakana} romajiMap={dakutenRomaji} />
        </div>
      </TabsContent>

      {/* Youon */}
      <TabsContent value="youon" className="space-y-10">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Youon Hiragana</h2>
          <p className="text-xs text-muted-foreground mb-4">Gabungan konsonan + や・ゆ・よ kecil</p>
          <YouonGrid groups={youonHiragana} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Youon Katakana</h2>
          <p className="text-xs text-muted-foreground mb-4">Gabungan konsonan + ャ・ュ・ョ kecil</p>
          <YouonGrid groups={youonKatakana} />
        </div>
      </TabsContent>

      {/* Numbers */}
      <TabsContent value="numbers">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Angka dalam Bahasa Jepang</h2>
          <p className="text-xs text-muted-foreground mb-4">Bilangan dasar, puluhan, ratusan, dan ribuan</p>
          <NumbersTable />
        </div>
      </TabsContent>
    </Tabs>

    <p className="text-xs text-muted-foreground pt-2">💡 Tip: Klik setiap karakter kana untuk toggle tampilan romaji / kana</p>
  </div>
);

export default KanaTable;
