import type { RawSource, SourceFlag } from '../domain/types';

/**
 * Flags source text that addresses an AI system or tries to issue instructions.
 *
 * This is a DISCLOSURE feature, not the defence. Nexus is safe even when this
 * misses something because (1) the model has no tools or action paths, (2) all
 * decisions are deterministic, and (3) AI output is schema-validated.
 * See docs/security/prompt-injection-model.md.
 */
const PATTERNS: RegExp[] = [
  /\bignore (?:all |any )?(?:the )?(?:previous|prior|above|earlier) (?:instructions|prompts|messages)\b/i,
  /\b(?:note|message|instructions?) (?:to|for) (?:any |the )?(?:ai|assistant|llm|language model|agent)\b/i,
  /\b(?:ai|llm) assistant (?:reading|processing) this\b/i,
  /\bsystem prompt\b/i,
  /\byou are (?:now )?(?:an? )?(?:ai|assistant|chatgpt|claude|gemini)\b/i,
  /\bforward (?:all|every) (?:emails?|messages?|contacts?|data)\b/i,
  /\b(?:mark|treat) this (?:message|email) as (?:safe|confirmed|trusted|verified)\b/i,
];

function textOf(source: RawSource): string {
  switch (source.kind) {
    case 'email':
      return `${source.subject}\n${source.body}\n${source.attachments.map((a) => a.filename).join('\n')}`;
    case 'calendar':
      return `${source.title}\n${source.description ?? ''}\n${source.location ?? ''}`;
    case 'document':
      return `${source.filename}\n${source.text}`;
  }
}

export function scanForInjection(source: RawSource): SourceFlag | undefined {
  const text = textOf(source);
  for (const re of PATTERNS) {
    const m = re.exec(text);
    if (m) {
      const start = Math.max(0, m.index - 40);
      const end = Math.min(text.length, m.index + m[0].length + 40);
      return {
        sourceId: source.id,
        kind: 'instruction_like_text',
        excerpt: `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '…' : ''}`,
      };
    }
  }
  return undefined;
}
