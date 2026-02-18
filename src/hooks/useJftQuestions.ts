import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JftQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  section: string;
  difficulty: number;
  audio_url?: string;
  scenario?: string;
  transcript?: string;
}

const SECTION_DISTRIBUTION = {
  kanji_reading: 10,
  vocabulary: 10,
  conversation: 10,
  situational: 10,
};

export const JFT_SECTIONS = [
  { key: "kanji_reading", label: "Kanji Reading", icon: "漢", count: 10 },
  { key: "vocabulary", label: "Vocabulary", icon: "語", count: 10 },
  { key: "conversation", label: "Conversation", icon: "会", count: 10 },
  { key: "situational", label: "Situational", icon: "場", count: 10 },
];

export const useJftQuestions = () => {
  return useQuery({
    queryKey: ["jft-questions"],
    queryFn: async () => {
      // Try loading from DB first
      const { data, error } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("level", "jft")
        .limit(200);

      const dbQuestions = (data || []).map((q: any) => ({
        ...q,
        options: q.options as string[],
      }));

      const allQuestions: JftQuestion[] = [];

      for (const [section, count] of Object.entries(SECTION_DISTRIBUTION)) {
        const sectionQs = dbQuestions.filter((q: any) => q.section === section);
        const shuffled = sectionQs.sort(() => Math.random() - 0.5).slice(0, count);
        allQuestions.push(...shuffled);

        // Fill with placeholders if not enough
        const needed = count - shuffled.length;
        for (let i = 0; i < needed; i++) {
          allQuestions.push(generateJftQuestion(section, allQuestions.length + i));
        }
      }

      return allQuestions;
    },
    staleTime: Infinity,
  });
};

function generateJftQuestion(section: string, index: number): JftQuestion {
  const kanjiQuestions = [
    { q: "「介護」の読み方は？", opts: ["かいご", "かいこ", "けいご", "けいこ"], ans: 0 },
    { q: "「患者」の読み方は？", opts: ["かんしゃ", "かんじゃ", "がんしゃ", "がんじゃ"], ans: 1 },
    { q: "「食事」の読み方は？", opts: ["しょくじ", "しょくし", "しゅくじ", "しゅくし"], ans: 0 },
    { q: "「体温」の読み方は？", opts: ["たいおん", "ていおん", "たいうん", "ていうん"], ans: 0 },
    { q: "「血圧」の読み方は？", opts: ["けつあつ", "ちあつ", "けちあつ", "ちけつ"], ans: 0 },
    { q: "「入浴」の読み方は？", opts: ["にゅうよく", "いりよく", "にゅうあび", "いりあび"], ans: 0 },
    { q: "「排泄」の読み方は？", opts: ["はいせつ", "はいさつ", "ばいせつ", "ばいさつ"], ans: 0 },
    { q: "「服薬」の読み方は？", opts: ["ふくやく", "ふくぐすり", "はくやく", "はくぐすり"], ans: 0 },
    { q: "「記録」の読み方は？", opts: ["きろく", "ぎろく", "きりょく", "ぎりょく"], ans: 0 },
    { q: "「症状」の読み方は？", opts: ["しょうじょう", "せいじょう", "しょうそう", "せいそう"], ans: 0 },
  ];

  const vocabQuestions = [
    { q: "「バイタル」とは何ですか？", opts: ["生命徴候", "薬の名前", "食事の種類", "運動の方法"], ans: 0 },
    { q: "「おむつ交換」の意味は？", opts: ["シーツを替える", "おむつを替える", "服を替える", "靴を替える"], ans: 1 },
    { q: "「車椅子」の読み方は？", opts: ["くるまいす", "しゃいす", "くるまかご", "しゃかご"], ans: 0 },
    { q: "「寝返り」の意味は？", opts: ["起きること", "寝ること", "体の向きを変えること", "歩くこと"], ans: 2 },
    { q: "「誤嚥」の意味は？", opts: ["食べ過ぎ", "飲み込み間違い", "アレルギー反応", "消化不良"], ans: 1 },
    { q: "「褥瘡」とは？", opts: ["骨折", "床ずれ", "やけど", "切り傷"], ans: 1 },
    { q: "「利用者」の意味は？", opts: ["スタッフ", "ケアを受ける人", "医者", "看護師"], ans: 1 },
    { q: "「申し送り」の意味は？", opts: ["手紙を送る", "引き継ぎ報告", "買い物リスト", "休憩時間"], ans: 1 },
    { q: "「清拭」の意味は？", opts: ["掃除すること", "体を拭くこと", "洗濯すること", "料理すること"], ans: 1 },
    { q: "「移乗」の意味は？", opts: ["電車に乗る", "ベッドから車椅子へ移ること", "引っ越し", "旅行"], ans: 1 },
  ];

  const conversationQuestions = [
    { q: "🔊 「すみません、お水をもらえますか。」\n— 利用者さんは何を求めていますか？", opts: ["食事", "水", "薬", "トイレ"], ans: 1, transcript: "利用者：すみません、お水をもらえますか。\n介護士：はい、少々お待ちください。" },
    { q: "🔊 「今日は調子がいいです。」\n— 利用者さんの体調は？", opts: ["悪い", "普通", "良い", "わからない"], ans: 2, transcript: "介護士：今日のご気分はいかがですか？\n利用者：今日は調子がいいです。" },
    { q: "🔊 「少し寒いです。」\n— 何をすべきですか？", opts: ["窓を開ける", "エアコンを下げる", "毛布をかける", "水を持っていく"], ans: 2, transcript: "利用者：少し寒いです。\n介護士：毛布をお持ちしますね。" },
    { q: "🔊 「頭が痛いです。」\n— 利用者さんの症状は？", opts: ["腹痛", "頭痛", "腰痛", "歯痛"], ans: 1, transcript: "利用者：頭が痛いです。\n介護士：看護師に伝えますね。" },
    { q: "🔊 「トイレに行きたいです。」\n— 利用者さんは何をしたいですか？", opts: ["食事", "散歩", "トイレ", "入浴"], ans: 2, transcript: "利用者：トイレに行きたいです。\n介護士：お手伝いしますね。" },
    { q: "🔊 「お薬の時間ですよ。」\n— 介護士は何をしていますか？", opts: ["食事の準備", "服薬の案内", "入浴の準備", "体操の案内"], ans: 1, transcript: "介護士：○○さん、お薬の時間ですよ。\n利用者：ありがとうございます。" },
    { q: "🔊 「腰が痛いので、ゆっくりお願いします。」\n— 何に注意すべきですか？", opts: ["速く動く", "ゆっくり動く", "動かない", "走る"], ans: 1, transcript: "利用者：腰が痛いので、ゆっくりお願いします。\n介護士：はい、ゆっくりしましょうね。" },
    { q: "🔊 「ご飯はもういらないです。」\n— 利用者さんは？", opts: ["もっと食べたい", "食事を終えたい", "飲み物が欲しい", "デザートが欲しい"], ans: 1, transcript: "介護士：もう少し食べますか？\n利用者：ご飯はもういらないです。" },
    { q: "🔊 「散歩に行きましょうか。」\n— 介護士は何を提案していますか？", opts: ["食事", "入浴", "散歩", "睡眠"], ans: 2, transcript: "介護士：天気がいいですね。散歩に行きましょうか。\n利用者：はい、行きたいです。" },
    { q: "🔊 「夜、よく眠れましたか。」\n— 介護士は何を聞いていますか？", opts: ["食事", "睡眠", "排泄", "体温"], ans: 1, transcript: "介護士：おはようございます。夜、よく眠れましたか？\n利用者：はい、ぐっすり眠れました。" },
  ];

  const situationalQuestions = [
    { q: "📋 場面：利用者さんが転倒しました。\n最初に何をしますか？", opts: ["すぐに起こす", "安全を確認して声をかける", "他の利用者に伝える", "記録を書く"], ans: 1, scenario: "利用者が廊下で転倒した場面" },
    { q: "📋 場面：利用者さんが「帰りたい」と言っています。\nどう対応しますか？", opts: ["「帰れません」と言う", "無視する", "気持ちを聞いて寄り添う", "家族に電話する"], ans: 2, scenario: "認知症の利用者が帰宅願望を示す場面" },
    { q: "📋 場面：食事中に利用者さんがむせました。\nどうしますか？", opts: ["水を飲ませる", "食事を続ける", "背中をさすって様子を見る", "すぐに救急車を呼ぶ"], ans: 2, scenario: "食事介助中にむせた場面" },
    { q: "📋 場面：利用者さんの顔色が悪いです。\n何をしますか？", opts: ["そのまま様子を見る", "バイタルを測定し報告する", "食事を提供する", "散歩に連れ出す"], ans: 1, scenario: "利用者の体調変化に気づいた場面" },
    { q: "📋 場面：他の介護士が休憩中です。ナースコールが鳴りました。\nどうしますか？", opts: ["休憩中の人を呼ぶ", "無視する", "自分が対応する", "後で対応する"], ans: 2, scenario: "人手不足時のナースコール対応" },
    { q: "📋 場面：入浴中に利用者さんが「熱い」と言いました。\nどうしますか？", opts: ["我慢してもらう", "すぐに温度を下げる", "入浴を中止する", "水を追加する"], ans: 1, scenario: "入浴介助中の温度調整" },
    { q: "📋 場面：利用者さんが薬を飲みたくないと言っています。\nどうしますか？", opts: ["無理に飲ませる", "看護師に相談する", "薬を捨てる", "次の日に飲ませる"], ans: 1, scenario: "服薬拒否の場面" },
    { q: "📋 場面：夜勤中、利用者さんが眠れないと言っています。\nどうしますか？", opts: ["睡眠薬を渡す", "テレビをつける", "話を聞いて安心させる", "無視する"], ans: 2, scenario: "夜間の不眠対応" },
    { q: "📋 場面：利用者さんの家族が面会に来ました。\n何をしますか？", opts: ["特に何もしない", "利用者の様子を伝える", "家族を帰す", "薬を渡す"], ans: 1, scenario: "家族面会時の対応" },
    { q: "📋 場面：車椅子からベッドに移乗します。\n正しい方法は？", opts: ["一人で抱え上げる", "ブレーキを確認し声かけしてから移乗", "利用者に自分でやらせる", "引きずって移動する"], ans: 1, scenario: "移乗介助の場面" },
  ];

  const questionSets: Record<string, any[]> = {
    kanji_reading: kanjiQuestions,
    vocabulary: vocabQuestions,
    conversation: conversationQuestions,
    situational: situationalQuestions,
  };

  const set = questionSets[section] || kanjiQuestions;
  const qi = index % set.length;
  const q = set[qi];

  return {
    id: `jft-placeholder-${section}-${index}`,
    question_text: q.q,
    options: q.opts,
    correct_answer: q.ans,
    section,
    difficulty: 3,
    transcript: q.transcript,
    scenario: q.scenario,
  };
}
