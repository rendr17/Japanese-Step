import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { hasKanjiWithoutRuby } from "@/lib/furigana";

let initPromise: Promise<void> | null = null;
let kuroshiroInstance: Kuroshiro | null = null;

export async function initKuroshiro(): Promise<void> {
  if (kuroshiroInstance) return;
  if (!initPromise) {
    initPromise = (async () => {
      const instance = new Kuroshiro();
      await instance.init(new KuromojiAnalyzer({ dictPath: "/dict/" }));
      kuroshiroInstance = instance;
    })();
  }
  await initPromise;
}

async function convertTextSegment(text: string): Promise<string> {
  if (!kuroshiroInstance || !/[\u4E00-\u9FFF々〆ヵヶ]/.test(text)) return text;
  return kuroshiroInstance.convert(text, { to: "hiragana", mode: "furigana" });
}

/** Add morphological furigana to text nodes that still contain bare kanji. */
export async function enrichMorphologicalFurigana(html: string): Promise<string> {
  if (!html || !hasKanjiWithoutRuby(html)) return html;

  await initKuroshiro();
  if (!kuroshiroInstance) return html;

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const container = doc.body.firstElementChild;
  if (!container) return html;

  const walk = async (node: Node): Promise<void> => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!/[\u4E00-\u9FFF々〆ヵヶ]/.test(text)) return;
      const converted = await convertTextSegment(text);
      if (converted === text) return;
      const wrapper = doc.createElement("span");
      wrapper.innerHTML = converted;
      node.replaceWith(...Array.from(wrapper.childNodes));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.tagName === "RUBY" || el.tagName === "RT" || el.tagName === "RP") return;

    const children = Array.from(node.childNodes);
    for (const child of children) {
      await walk(child);
    }
  };

  await walk(container);
  return container.innerHTML;
}
