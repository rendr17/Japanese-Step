export type FuriganaDisplayMode = "always" | "hover" | "never" | "romaji";

export interface VocabReading {
  kanji: string;
  kana: string;
}

const KANA_READING = "[ぁ-ゖァ-ヶー・]+";
const KANJI_BASE = "[\\u4E00-\\u9FFF々〆ヵヶ]+";
const KANJI_RE = /[\u4E00-\u9FFF々〆ヵヶ]/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceKanjiInPlainText(text: string, kanji: string, kana: string): string {
  if (!text.includes(kanji)) return text;
  const pattern = new RegExp(escapeRegExp(kanji), "g");
  return text.replace(pattern, `<ruby>${kanji}<rt>${kana}</rt></ruby>`);
}

function enrichPlainTextFromVocabulary(text: string, vocabulary: VocabReading[]): string {
  const entries = vocabulary
    .filter((v) => v.kanji && v.kana && KANJI_RE.test(v.kanji))
    .sort((a, b) => b.kanji.length - a.kanji.length);

  return entries.reduce((acc, entry) => {
    const rubyParts = acc.split(/(<ruby>[\s\S]*?<\/ruby>)/g);
    return rubyParts
      .map((part) => {
        if (part.startsWith("<ruby>")) return part;
        return replaceKanjiInPlainText(part, entry.kanji, entry.kana);
      })
      .join("");
  }, text);
}

/** Inject ruby tags from material vocabulary into HTML text segments. */
export function enrichFuriganaFromVocabulary(html: string, vocabulary?: VocabReading[] | null): string {
  if (!html || !vocabulary?.length) return html;

  const parts = html.split(/(<[^>]+>)/g);
  let insideRuby = false;

  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        const lower = part.toLowerCase();
        if (lower.startsWith("<ruby")) insideRuby = true;
        if (lower.startsWith("</ruby")) insideRuby = false;
        return part;
      }
      if (insideRuby) return part;
      return enrichPlainTextFromVocabulary(part, vocabulary);
    })
    .join("");
}

/** True if HTML still has kanji outside existing ruby annotations. */
export function hasKanjiWithoutRuby(html: string): boolean {
  if (!html || typeof document === "undefined") {
    return /[\u4E00-\u9FFF々〆ヵヶ]/.test(html.replace(/<ruby[\s\S]*?<\/ruby>/gi, ""));
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const container = doc.body.firstElementChild;
  if (!container) return false;

  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      return KANJI_RE.test(node.textContent ?? "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const el = node as Element;
    if (el.tagName === "RUBY") return false;
    return Array.from(node.childNodes).some(walk);
  };

  return walk(container);
}

/** Convert 漢字（かんじ） / 漢字(かんじ) to <ruby> tags in plain text segments. */
export function parenthesesToRuby(text: string): string {
  const pattern = new RegExp(`(${KANJI_BASE})[（(](${KANA_READING})[）)]`, "g");
  return text.replace(pattern, "<ruby>$1<rt>$2</rt></ruby>");
}

/** Decode escaped ruby/rt/rp tags produced by TipTap generateHTML. */
export function unescapeRubyTags(html: string): string {
  return html
    .replace(/&lt;ruby&gt;/gi, "<ruby>")
    .replace(/&lt;\/ruby&gt;/gi, "</ruby>")
    .replace(/&lt;rt&gt;/gi, "<rt>")
    .replace(/&lt;\/rt&gt;/gi, "</rt>")
    .replace(/&lt;rp&gt;/gi, "<rp>")
    .replace(/&lt;\/rp&gt;/gi, "</rp>");
}

/** Full HTML entity decode for repair of import content stored as escaped HTML. */
function decodeHtmlEntities(html: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

function isEscapedHtmlBlock(text: string): boolean {
  return /&lt;(p|ruby|h[1-3]|ul|ol|li|strong|em)\b/i.test(text);
}

/** Apply parentheses→ruby conversion only outside existing HTML tags. */
function parenthesesToRubyInHtml(html: string): string {
  const parts = html.split(/(<[^>]+>)/g);
  return parts
    .map((part) => (part.startsWith("<") ? part : parenthesesToRuby(part)))
    .join("");
}

/** Normalize furigana markup: unescape, decode entities, convert parentheses notation. */
export function normalizeFuriganaHtml(html: string): string {
  if (!html) return "";
  let result = unescapeRubyTags(html);
  if (isEscapedHtmlBlock(result)) {
    result = decodeHtmlEntities(result);
    result = unescapeRubyTags(result);
  }
  return parenthesesToRubyInHtml(result);
}

/** CSS rules for furigana display modes (injected via <style>). */
export function getFuriganaCss(mode: FuriganaDisplayMode): string {
  switch (mode) {
    case "never":
      return "rt, rp { display: none; }";
    case "hover":
      return "ruby rt, ruby rp { opacity: 0; transition: opacity 0.15s; } ruby:hover rt, ruby:hover rp { opacity: 1; }";
    case "romaji":
      return "ruby { display: contents; } rt, rp { display: none; }";
    case "always":
    default:
      return "";
  }
}

/** Whether the container should use the furigana-hover class. */
export function isFuriganaHoverMode(mode: FuriganaDisplayMode): boolean {
  return mode === "hover";
}
