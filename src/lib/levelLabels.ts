export type LevelVariant = "jlpt" | "jft" | "hidden";

export function formatJlptLevel(level: string | null | undefined): {
  label: string;
  variant: LevelVariant;
} {
  if (!level || level === "none") {
    return { label: "JFT", variant: "jft" };
  }

  const normalized = level.toLowerCase();
  if (["n5", "n4", "n3", "n2", "n1"].includes(normalized)) {
    return { label: normalized.toUpperCase(), variant: "jlpt" };
  }

  return { label: "JFT", variant: "jft" };
}
