/** Splits markdown into paragraph-sized chunks, small enough to embed and retrieve individually. */
export function chunkMarkdown(text: string, source: string): { text: string; source: string }[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#"));

  return paragraphs.map((text) => ({ text, source }));
}
