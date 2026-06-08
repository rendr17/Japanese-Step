import { describe, it, expect } from "vitest";
import {
  parenthesesToRuby,
  normalizeFuriganaHtml,
  getFuriganaCss,
  enrichFuriganaFromVocabulary,
  hasKanjiWithoutRuby,
} from "./furigana";
import { htmlToTiptapJson, jsonToHtml, repairTiptapContent } from "./tiptapHtml";

describe("furigana utilities", () => {
  it("converts parentheses notation to ruby", () => {
    expect(parenthesesToRuby("日本語（にほんご）")).toBe(
      "<ruby>日本語<rt>にほんご</rt></ruby>"
    );
    expect(parenthesesToRuby("漢字(かんじ)")).toBe(
      "<ruby>漢字<rt>かんじ</rt></ruby>"
    );
  });

  it("unescapes and normalizes escaped ruby tags", () => {
    const input = "&lt;ruby&gt;漢字&lt;rt&gt;かんじ&lt;/rt&gt;&lt;/ruby&gt;";
    expect(normalizeFuriganaHtml(input)).toBe(
      "<ruby>漢字<rt>かんじ</rt></ruby>"
    );
  });

  it("repairs import content stored as escaped HTML in a text node", () => {
    const broken = {
      type: "doc",
      content: [{
        type: "paragraph",
        content: [{
          type: "text",
          text: "&lt;p&gt;&lt;ruby&gt;日本&lt;rt&gt;にほん&lt;/rt&gt;&lt;/ruby&gt;&lt;/p&gt;",
        }],
      }],
    };
    const html = jsonToHtml(broken);
    expect(html).toContain("<ruby>");
    expect(html).not.toContain("&lt;ruby&gt;");
    expect(html).toContain("にほん");
  });

  it("round-trips ruby HTML through tiptap JSON", () => {
    const html = "<p><ruby>勉強<rt>べんきょう</rt></ruby>します。</p>";
    const json = htmlToTiptapJson(normalizeFuriganaHtml(html));
    const output = jsonToHtml(json);
    expect(output).toContain("<ruby>");
    expect(output).toContain("<rt>べんきょう</rt>");
  });

  it("returns CSS for each display mode", () => {
    expect(getFuriganaCss("never")).toContain("display: none");
    expect(getFuriganaCss("hover")).toContain("opacity: 0");
    expect(getFuriganaCss("romaji")).toContain("display: contents");
    expect(getFuriganaCss("always")).toBe("");
  });

  it("enriches plain text from material vocabulary (jft-care-vocab-2)", () => {
    const vocab = [
      { kanji: "入浴", kana: "にゅうよく" },
      { kanji: "介助", kana: "かいじょ" },
      { kanji: "排泄", kana: "はいせつ" },
      { kanji: "申し送り", kana: "もうしおくり" },
      { kanji: "記録", kana: "きろく" },
    ];
    const body =
      "<p>入浴の介助をします。</p><p>排泄の記録をつけます。</p><p>申し送りの記録を書きます。</p>";
    const html = enrichFuriganaFromVocabulary(body, vocab);
    expect(html).toContain("<ruby>入浴<rt>にゅうよく</rt></ruby>");
    expect(html).toContain("<ruby>介助<rt>かいじょ</rt></ruby>");
    expect(html).toContain("<ruby>排泄<rt>はいせつ</rt></ruby>");
    expect(html).toContain("<ruby>記録<rt>きろく</rt></ruby>");
    expect(html).toContain("<ruby>申し送り<rt>もうしおくり</rt></ruby>");
  });

  it("prefers longest vocabulary match for 申し送り", () => {
    const vocab = [
      { kanji: "申し", kana: "もうし" },
      { kanji: "申し送り", kana: "もうしおくり" },
    ];
    const html = enrichFuriganaFromVocabulary("<p>申し送りの記録</p>", vocab);
    expect(html).toContain("<ruby>申し送り<rt>もうしおくり</rt></ruby>");
    expect(html).not.toContain("<ruby>申し<rt>もうし</rt></ruby>送り");
  });

  it("does not double-wrap existing ruby tags", () => {
    const vocab = [{ kanji: "漢字", kana: "かんじ" }];
    const html = enrichFuriganaFromVocabulary("<p><ruby>漢字<rt>かんじ</rt></ruby>です</p>", vocab);
    expect(html.match(/<ruby>/g)?.length).toBe(1);
  });

  it("detects kanji remaining outside ruby", () => {
    expect(hasKanjiWithoutRuby("<p>入浴の介助</p>")).toBe(true);
    expect(hasKanjiWithoutRuby("<p><ruby>入浴<rt>にゅうよく</rt></ruby>のみ</p>")).toBe(false);
  });

  it("repairTiptapContent expands raw HTML paragraphs into blocks", () => {
    const repaired = repairTiptapContent({
      type: "paragraph",
      content: [{ type: "text", text: "<p>日本語（にほんご）</p>" }],
    });
    expect(Array.isArray(repaired)).toBe(true);
  });
});
