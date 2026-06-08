import * as wanakana from "wanakana";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import { normalizeFuriganaHtml, enrichFuriganaFromVocabulary, type VocabReading } from "@/lib/furigana";

export interface JsonToHtmlOptions {
  vocabulary?: VocabReading[] | null;
}

export const tiptapExtensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  LinkExtension,
  ImageExt,
];

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "horizontalRule",
  "listItem",
  "hardBreak",
]);

function looksLikeRawHtml(text: string): boolean {
  return /<(?:p|ruby|h[1-3]|ul|ol|li|strong|em|div)\b/i.test(text)
    || /&lt;(?:p|ruby|h[1-3]|ul|ol|li|strong|em|div)\b/i.test(text);
}

/** Detect and re-parse paragraphs that contain raw HTML from broken import paths. */
export function repairTiptapContent(json: any): any {
  if (!json || typeof json !== "object") return json;

  if (json.type === "paragraph" && Array.isArray(json.content)) {
    const singleText =
      json.content.length === 1
      && json.content[0]?.type === "text"
      && typeof json.content[0].text === "string"
      && looksLikeRawHtml(json.content[0].text);

    if (singleText) {
      const repaired = htmlToTiptapJson(normalizeFuriganaHtml(json.content[0].text));
      return repaired.content ?? [json];
    }
  }

  if (Array.isArray(json.content)) {
    const newContent: any[] = [];
    for (const child of json.content) {
      const repaired = repairTiptapContent(child);
      if (Array.isArray(repaired)) {
        newContent.push(...repaired);
      } else {
        newContent.push(repaired);
      }
    }
    return { ...json, content: newContent };
  }

  return json;
}

/** Convert HTML string to a Tiptap-compatible JSON doc. */
export function htmlToTiptapJson(html: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;

  function parseNode(node: Node): any {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (!text) return null;
      return { type: "text", text };
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    const childContent = Array.from(el.childNodes)
      .map(parseNode)
      .filter(Boolean);

    if (tag === "strong" || tag === "b") {
      return childContent.map((c: any) => ({
        ...c,
        marks: [...(c.marks || []), { type: "bold" }],
      }));
    }
    if (tag === "em" || tag === "i") {
      return childContent.map((c: any) => ({
        ...c,
        marks: [...(c.marks || []), { type: "italic" }],
      }));
    }
    if (tag === "u") {
      return childContent.map((c: any) => ({
        ...c,
        marks: [...(c.marks || []), { type: "underline" }],
      }));
    }

    if (tag === "ruby") {
      return { type: "text", text: el.outerHTML };
    }

    if (tag === "p") {
      return {
        type: "paragraph",
        content: childContent.flat().length ? childContent.flat() : [{ type: "text", text: " " }],
      };
    }
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const level = parseInt(tag[1]);
      return {
        type: "heading",
        attrs: { level },
        content: childContent.flat().length ? childContent.flat() : [{ type: "text", text: " " }],
      };
    }
    if (tag === "br") {
      return { type: "hardBreak" };
    }
    if (tag === "ul" || tag === "ol") {
      return { type: tag === "ul" ? "bulletList" : "orderedList", content: childContent.flat() };
    }
    if (tag === "li") {
      const hasBlock = childContent.flat().some((c: any) => BLOCK_TYPES.has(c?.type));
      if (hasBlock) return { type: "listItem", content: childContent.flat() };
      return {
        type: "listItem",
        content: [{
          type: "paragraph",
          content: childContent.flat().length ? childContent.flat() : [{ type: "text", text: " " }],
        }],
      };
    }
    if (tag === "hr") {
      return { type: "horizontalRule" };
    }

    if (childContent.flat().length) return childContent.flat();
    return null;
  }

  const content = Array.from(body.childNodes)
    .map(parseNode)
    .flat()
    .filter(Boolean);

  const blocks = content.map((node: any) => {
    if (BLOCK_TYPES.has(node?.type)) return node;
    return { type: "paragraph", content: [node] };
  });

  return {
    type: "doc",
    content: blocks.length ? blocks : [{ type: "paragraph", content: [{ type: "text", text: " " }] }],
  };
}

export function jsonToHtml(json: any, options?: JsonToHtmlOptions): string {
  if (!json) return "";
  try {
    const repaired = repairTiptapContent(json);
    const html = generateHTML(repaired, tiptapExtensions);
    const normalized = normalizeFuriganaHtml(html);
    return enrichFuriganaFromVocabulary(normalized, options?.vocabulary);
  } catch {
    return typeof json === "string" ? json : "<p>Konten tidak dapat ditampilkan.</p>";
  }
}

const JP_PUNCT_MAP: Record<string, string> = {
  "。": ". ", "、": ", ", "？": "? ", "！": "! ",
  "…": "...", "「": '"', "」": '"', "『": "'", "』": "'",
  "・": " ", "〜": "~", "：": ": ", "；": "; ",
};

function textToRomaji(text: string): string {
  const tokens: Array<{ type: string; value: string }> =
    (wanakana as any).tokenize(text, { detailed: true }) ?? [];
  const parts: string[] = [];

  for (const token of tokens) {
    const val: string = token.value ?? String(token);
    const type: string = token.type ?? "";

    if (type === "hiragana" || type === "katakana") {
      parts.push(wanakana.toRomaji(val));
    } else if (type === "ja_punctuation") {
      let converted = "";
      for (const ch of val) converted += JP_PUNCT_MAP[ch] ?? wanakana.toRomaji(ch);
      parts.push(converted.trimEnd());
    } else {
      parts.push(val);
    }
  }

  let result = parts.join(" ");
  result = result.replace(/\s+([.,!?:;"])/g, "$1");
  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
}

export function htmlToRomaji(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll("ruby").forEach((ruby) => {
    const rt = ruby.querySelector("rt");
    const reading = rt?.textContent?.trim() ?? "";
    const textNode = doc.createTextNode(reading ? reading + " " : "");
    ruby.replaceWith(textNode);
  });

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      node.textContent = textToRomaji(node.textContent);
    } else {
      const tag = (node as Element).tagName;
      if (tag === "RT" || tag === "RP") { node.textContent = ""; return; }
      node.childNodes.forEach(walk);
    }
  };
  doc.body.childNodes.forEach(walk);
  return doc.body.innerHTML;
}
