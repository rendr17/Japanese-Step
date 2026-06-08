import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExamQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  level: string;
  section: string;
  difficulty: number;
}

const SECTION_DISTRIBUTION = {
  vocabulary: 20,
  grammar: 20,
  reading: 20,
};

const JLPT_EXAM_TOTAL = 60;
const POOL_MULTIPLIER = 3;

export function useExamBankStatus(level?: string) {
  return useQuery({
    queryKey: ["exam-bank-status", "jlpt", level],
    queryFn: async () => {
      if (!level) return { ready: false, count: 0, required: JLPT_EXAM_TOTAL };
      const { count, error } = await supabase
        .from("exam_questions")
        .select("*", { count: "exact", head: true })
        .eq("exam_type", "jlpt")
        .eq("is_active", true)
        .eq("level", level.toLowerCase());
      if (error) throw error;
      const total = count ?? 0;
      return { ready: total >= JLPT_EXAM_TOTAL, count: total, required: JLPT_EXAM_TOTAL };
    },
    enabled: !!level,
    staleTime: 5 * 60 * 1000,
  });
}

export const useExamQuestions = (level: string) => {
  return useQuery({
    queryKey: ["exam-questions", level],
    queryFn: async () => {
      const allQuestions: ExamQuestion[] = [];

      for (const [section, count] of Object.entries(SECTION_DISTRIBUTION)) {
        const { data, error } = await supabase
          .from("exam_questions")
          .select("*")
          .eq("exam_type", "jlpt")
          .eq("is_active", true)
          .eq("level", level.toLowerCase())
          .eq("section", section)
          .limit(count * POOL_MULTIPLIER);

        if (error) throw error;

        const questions = (data || []).map((q: any) => ({
          ...q,
          options: q.options as string[],
        }));

        // Fisher-Yates shuffle and take needed count
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        allQuestions.push(...shuffled.slice(0, count));
      }

      if (allQuestions.length < JLPT_EXAM_TOTAL) {
        const needed = JLPT_EXAM_TOTAL - allQuestions.length;
        const sections = ["vocabulary", "grammar", "reading"];
        console.warn(`[exam] Bank ${level} kurang: ${allQuestions.length}/${JLPT_EXAM_TOTAL}, menggunakan placeholder`);
        for (let i = 0; i < needed; i++) {
          const section = sections[i % 3];
          allQuestions.push(generatePlaceholderQuestion(level, section, allQuestions.length + i));
        }
      }

      return allQuestions;
    },
    enabled: !!level,
    staleTime: Infinity,
  });
};

function generatePlaceholderQuestion(level: string, section: string, index: number): ExamQuestion {
  const vocabQuestions = [
    { q: "「食べる」の読み方は？", opts: ["たべる", "のべる", "くべる", "しべる"], ans: 0 },
    { q: "「大きい」の意味は？", opts: ["Small", "Big", "Fast", "Slow"], ans: 1 },
    { q: "「学校」の読み方は？", opts: ["がくこう", "がっこう", "がくこ", "がっこ"], ans: 1 },
    { q: "「飲む」の意味は？", opts: ["To eat", "To sleep", "To drink", "To walk"], ans: 2 },
    { q: "「天気」の読み方は？", opts: ["てんき", "でんき", "てんぎ", "でんぎ"], ans: 0 },
    { q: "「友達」の意味は？", opts: ["Teacher", "Student", "Friend", "Parent"], ans: 2 },
    { q: "「書く」の読み方は？", opts: ["かく", "きく", "けく", "こく"], ans: 0 },
    { q: "「電車」の意味は？", opts: ["Bus", "Car", "Bicycle", "Train"], ans: 3 },
    { q: "「朝」の読み方は？", opts: ["よる", "あさ", "ひる", "ゆう"], ans: 1 },
    { q: "「高い」の意味は？", opts: ["Low", "Cheap", "Expensive/Tall", "Short"], ans: 2 },
    { q: "「走る」の読み方は？", opts: ["あるく", "はしる", "およぐ", "とぶ"], ans: 1 },
    { q: "「病院」の意味は？", opts: ["School", "Hospital", "Station", "Library"], ans: 1 },
    { q: "「新しい」の読み方は？", opts: ["あたらしい", "ふるい", "むずかしい", "やさしい"], ans: 0 },
    { q: "「仕事」の意味は？", opts: ["Hobby", "Work/Job", "Study", "Rest"], ans: 1 },
    { q: "「映画」の読み方は？", opts: ["えが", "えいが", "えいか", "えか"], ans: 1 },
    { q: "「買う」の意味は？", opts: ["To sell", "To buy", "To give", "To receive"], ans: 1 },
    { q: "「入る」の読み方は？", opts: ["はいる", "でる", "いる", "おる"], ans: 0 },
    { q: "「魚」の意味は？", opts: ["Meat", "Vegetable", "Fruit", "Fish"], ans: 3 },
    { q: "「寒い」の読み方は？", opts: ["あつい", "さむい", "すずしい", "あたたかい"], ans: 1 },
    { q: "「窓」の意味は？", opts: ["Door", "Wall", "Window", "Floor"], ans: 2 },
  ];

  const grammarQuestions = [
    { q: "私＿学生です。", opts: ["は", "が", "を", "に"], ans: 0 },
    { q: "東京＿行きます。", opts: ["は", "が", "を", "に"], ans: 3 },
    { q: "水＿飲みます。", opts: ["は", "が", "を", "に"], ans: 2 },
    { q: "昨日、映画＿見ました。", opts: ["は", "が", "を", "に"], ans: 2 },
    { q: "友達＿会いました。", opts: ["は", "が", "を", "に"], ans: 3 },
    { q: "ここ＿座ってください。", opts: ["は", "が", "を", "に"], ans: 3 },
    { q: "日本語＿勉強します。", opts: ["は", "が", "を", "に"], ans: 2 },
    { q: "バス＿乗ります。", opts: ["は", "が", "を", "に"], ans: 3 },
    { q: "この本＿面白いです。", opts: ["は", "が", "を", "に"], ans: 0 },
    { q: "猫＿います。", opts: ["は", "が", "を", "に"], ans: 1 },
    { q: "明日、学校＿行きません。", opts: ["は", "が", "を", "に"], ans: 3 },
    { q: "コーヒー＿好きです。", opts: ["は", "が", "を", "に"], ans: 1 },
    { q: "どこ＿行きますか。", opts: ["は", "が", "を", "に"], ans: 3 },
    { q: "毎朝、六時＿起きます。", opts: ["は", "が", "を", "に"], ans: 3 },
    { q: "これ＿何ですか。", opts: ["は", "が", "を", "に"], ans: 0 },
    { q: "田中さん＿先生です。", opts: ["は", "が", "を", "に"], ans: 0 },
    { q: "公園＿散歩します。", opts: ["は", "が", "を", "で"], ans: 3 },
    { q: "電車＿来ました。", opts: ["は", "が", "を", "に"], ans: 1 },
    { q: "夏＿暑いです。", opts: ["は", "が", "を", "に"], ans: 0 },
    { q: "母＿料理を作ります。", opts: ["は", "が", "を", "に"], ans: 0 },
  ];

  const readingQuestions = [
    { q: "「私は毎日学校に行きます。」— 私はどこに行きますか？", opts: ["家", "学校", "会社", "公園"], ans: 1 },
    { q: "「田中さんは先生です。」— 田中さんの仕事は何ですか？", opts: ["医者", "先生", "学生", "会社員"], ans: 1 },
    { q: "「今日は天気がいいです。」— 天気はどうですか？", opts: ["悪い", "いい", "寒い", "暑い"], ans: 1 },
    { q: "「猫が三匹います。」— 猫は何匹いますか？", opts: ["一匹", "二匹", "三匹", "四匹"], ans: 2 },
    { q: "「日曜日に映画を見ます。」— いつ映画を見ますか？", opts: ["月曜日", "水曜日", "金曜日", "日曜日"], ans: 3 },
    { q: "「この本は面白いです。」— 本はどうですか？", opts: ["つまらない", "難しい", "面白い", "簡単"], ans: 2 },
    { q: "「朝ごはんにパンを食べました。」— 何を食べましたか？", opts: ["ご飯", "パン", "麺", "お菓子"], ans: 1 },
    { q: "「駅まで歩いて10分です。」— 駅まで何分ですか？", opts: ["5分", "10分", "15分", "20分"], ans: 1 },
    { q: "「母は料理が上手です。」— 母は何が上手ですか？", opts: ["掃除", "料理", "運動", "歌"], ans: 1 },
    { q: "「来週、大阪に行きます。」— いつ行きますか？", opts: ["今週", "来週", "先週", "毎週"], ans: 1 },
    { q: "「弟は5歳です。」— 弟は何歳ですか？", opts: ["3歳", "4歳", "5歳", "6歳"], ans: 2 },
    { q: "「図書館で本を借りました。」— どこで借りましたか？", opts: ["本屋", "学校", "図書館", "家"], ans: 2 },
    { q: "「夏休みに海に行きたいです。」— どこに行きたいですか？", opts: ["山", "海", "川", "湖"], ans: 1 },
    { q: "「この花は赤いです。」— 花は何色ですか？", opts: ["白", "青", "赤", "黄色"], ans: 2 },
    { q: "「兄は大学生です。」— 兄は何をしていますか？", opts: ["仕事", "大学", "高校", "中学"], ans: 1 },
    { q: "「昨日、友達と遊びました。」— 誰と遊びましたか？", opts: ["家族", "先生", "友達", "一人"], ans: 2 },
    { q: "「冬は寒いです。」— 冬はどうですか？", opts: ["暑い", "涼しい", "暖かい", "寒い"], ans: 3 },
    { q: "「毎晩、9時に寝ます。」— 何時に寝ますか？", opts: ["8時", "9時", "10時", "11時"], ans: 1 },
    { q: "「父は会社で働いています。」— 父はどこで働いていますか？", opts: ["学校", "病院", "会社", "店"], ans: 2 },
    { q: "「このケーキはおいしいです。」— ケーキはどうですか？", opts: ["まずい", "おいしい", "甘くない", "辛い"], ans: 1 },
  ];

  const questionSets: Record<string, typeof vocabQuestions> = {
    vocabulary: vocabQuestions,
    grammar: grammarQuestions,
    reading: readingQuestions,
  };

  const set = questionSets[section] || vocabQuestions;
  const qi = index % set.length;
  const q = set[qi];

  return {
    id: `placeholder-${section}-${index}`,
    question_text: q.q,
    options: q.opts,
    correct_answer: q.ans,
    level: level.toLowerCase(),
    section,
    difficulty: 3,
  };
}
