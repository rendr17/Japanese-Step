import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const hiraganaRows = [
  { vowel: "a", chars: ["あ", "い", "う", "え", "お"] },
  { vowel: "ka", chars: ["か", "き", "く", "け", "こ"] },
  { vowel: "sa", chars: ["さ", "し", "す", "せ", "そ"] },
  { vowel: "ta", chars: ["た", "ち", "つ", "て", "と"] },
  { vowel: "na", chars: ["な", "に", "ぬ", "ね", "の"] },
  { vowel: "ha", chars: ["は", "ひ", "ふ", "へ", "ほ"] },
  { vowel: "ma", chars: ["ま", "み", "む", "め", "も"] },
  { vowel: "ya", chars: ["や", "", "ゆ", "", "よ"] },
  { vowel: "ra", chars: ["ら", "り", "る", "れ", "ろ"] },
  { vowel: "wa", chars: ["わ", "", "", "", "を"] },
  { vowel: "n", chars: ["ん", "", "", "", ""] },
];

const katakanaRows = [
  { vowel: "a", chars: ["ア", "イ", "ウ", "エ", "オ"] },
  { vowel: "ka", chars: ["カ", "キ", "ク", "ケ", "コ"] },
  { vowel: "sa", chars: ["サ", "シ", "ス", "セ", "ソ"] },
  { vowel: "ta", chars: ["タ", "チ", "ツ", "テ", "ト"] },
  { vowel: "na", chars: ["ナ", "ニ", "ヌ", "ネ", "ノ"] },
  { vowel: "ha", chars: ["ハ", "ヒ", "フ", "ヘ", "ホ"] },
  { vowel: "ma", chars: ["マ", "ミ", "ム", "メ", "モ"] },
  { vowel: "ya", chars: ["ヤ", "", "ユ", "", "ヨ"] },
  { vowel: "ra", chars: ["ラ", "リ", "ル", "レ", "ロ"] },
  { vowel: "wa", chars: ["ワ", "", "", "", "ヲ"] },
  { vowel: "n", chars: ["ン", "", "", "", ""] },
];

// Romaji mapping per cell [row][col]
const romaji = [
  ["a", "i", "u", "e", "o"],
  ["ka", "ki", "ku", "ke", "ko"],
  ["sa", "shi", "su", "se", "so"],
  ["ta", "chi", "tsu", "te", "to"],
  ["na", "ni", "nu", "ne", "no"],
  ["ha", "hi", "fu", "he", "ho"],
  ["ma", "mi", "mu", "me", "mo"],
  ["ya", "", "yu", "", "yo"],
  ["ra", "ri", "ru", "re", "ro"],
  ["wa", "", "", "", "wo"],
  ["n", "", "", "", ""],
];

const dakutenHiragana = [
  { label: "が行 (ga)", chars: [["が","ぎ","ぐ","げ","ご"], ["za","zi/ji","zu","ze","zo"].map((_,i)=>["za","ji","zu","ze","zo"][i])] },
  { label: "ざ行 (za)", chars: [["ざ","じ","ず","ぜ","ぞ"]] },
  { label: "だ行 (da)", chars: [["だ","ぢ","づ","で","ど"]] },
  { label: "ば行 (ba)", chars: [["ば","び","ぶ","べ","ぼ"]] },
  { label: "ぱ行 (pa)", chars: [["ぱ","ぴ","ぷ","ぺ","ぽ"]] },
];

const dakutenKatakana = [
  { label: "ガ行 (ga)", chars: [["ガ","ギ","グ","ゲ","ゴ"]] },
  { label: "ザ行 (za)", chars: [["ザ","ジ","ズ","ゼ","ゾ"]] },
  { label: "ダ行 (da)", chars: [["ダ","ヂ","ヅ","デ","ド"]] },
  { label: "バ行 (ba)", chars: [["バ","ビ","ブ","ベ","ボ"]] },
  { label: "パ行 (pa)", chars: [["パ","ピ","プ","ペ","ポ"]] },
];

const dakutenRomaji = [
  ["ga","gi","gu","ge","go"],
  ["za","ji","zu","ze","zo"],
  ["da","di","du","de","do"],
  ["ba","bi","bu","be","bo"],
  ["pa","pi","pu","pe","po"],
];

const vowelHeaders = ["a", "i", "u", "e", "o"];

interface KanaCellProps {
  kana: string;
  roma: string;
}

const KanaCell = ({ kana, roma }: KanaCellProps) => {
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

interface KanaGridProps {
  rows: { vowel: string; chars: string[] }[];
  romajiMap: string[][];
}

const KanaGrid = ({ rows, romajiMap }: KanaGridProps) => (
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

interface DakutenGridProps {
  groups: { label: string; chars: string[][] }[];
  romajiMap: string[][];
}

const DakutenGrid = ({ groups, romajiMap }: DakutenGridProps) => (
  <div className="space-y-4">
    {groups.map((group, gi) => (
      <div key={group.label} className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">{group.label}</span>
        <div className="flex gap-1">
          {group.chars[0].map((kana, ci) => (
            <KanaCell key={ci} kana={kana} roma={romajiMap[gi]?.[ci] ?? ""} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const KanaTable = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Tabel Kana</h1>
        <p className="text-muted-foreground text-sm mt-1">Klik karakter untuk melihat cara bacanya (romaji)</p>
      </div>

      <Tabs defaultValue="hiragana">
        <TabsList className="mb-6">
          <TabsTrigger value="hiragana">
            ひらがな <Badge variant="outline" className="ml-2 text-[10px]">Hiragana</Badge>
          </TabsTrigger>
          <TabsTrigger value="katakana">
            カタカナ <Badge variant="outline" className="ml-2 text-[10px]">Katakana</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hiragana" className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Hiragana Dasar</h2>
            <KanaGrid rows={hiraganaRows} romajiMap={romaji} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Dakuten & Handakuten</h2>
            <DakutenGrid groups={dakutenHiragana} romajiMap={dakutenRomaji} />
          </div>
        </TabsContent>

        <TabsContent value="katakana" className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Katakana Dasar</h2>
            <KanaGrid rows={katakanaRows} romajiMap={romaji} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Dakuten & Handakuten</h2>
            <DakutenGrid groups={dakutenKatakana} romajiMap={dakutenRomaji} />
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground pt-2">💡 Tip: Klik setiap karakter untuk toggle tampilan romaji / kana</p>
    </div>
  );
};

export default KanaTable;
