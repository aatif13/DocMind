export function chunkText(text: string, chunkSize: number = 500, overlapSize: number = 50): string[] {
  // Simple token-agnostic overlap chunker by characters or approximate words
  // Let's split by words
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  if (words.length === 0) return chunks;
  
  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push(chunkWords.join(" "));
    i += (chunkSize - overlapSize);
  }
  return chunks;
}
