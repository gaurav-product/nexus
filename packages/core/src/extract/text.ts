/** Small, dependency-free text helpers shared by extractors. */

export interface Sentence {
  text: string;
}

/** Split on line breaks, then on sentence punctuation. Keeps each piece trimmed. */
export function sentences(body: string): Sentence[] {
  const out: Sentence[] = [];
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const part of trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
      const t = part.trim();
      if (t) out.push({ text: t });
    }
  }
  return out;
}

const STOP = new Set([
  'the', 'a', 'an', 'my', 'our', 'your', 'their', 'his', 'her', 'its', 'this', 'that', 'these', 'those',
  'you', 'we', 'i', 'to', 'for', 'of', 'and', 'or', 'with', 'on', 'in', 'at', 'by', 'before', 'after',
  'send', 'share', 'confirm', 'forward', 'submit', 'deliver', 'circulate', 'names', 'revised', 'updated',
  'final', 'latest', 'new', 'copy', 'version', 'some', 'few', 'short', 'quick', 'soon', 'team', 'review',
]);

/** Significant words used to match a promised object to later evidence ("portfolio", "proposal"). */
export function keywords(text: string): string[] {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  )];
}

/** FNV-1a 32-bit — stable, fast, good enough for ids/fingerprints (not security). */
export function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function domainOf(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? email.toLowerCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
