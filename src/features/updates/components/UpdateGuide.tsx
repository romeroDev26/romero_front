/** Plain text stays safe: numbered lines become illustrated steps, no HTML needed. */
export default function UpdateGuide({ text }: { text: string }) {
  return <div className="space-y-3">{text.split(/\r?\n/).filter(line => line.trim()).map((line, i) => {
    const step = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    return step ? <div key={i} className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold">{step[1]}</span><p className="text-sm text-dm-text-primary leading-relaxed pt-1">{step[2]}</p></div> : <p key={i} className="text-sm text-dm-text-secondary leading-relaxed whitespace-pre-wrap">{line}</p>;
  })}</div>;
}

export function safeUpdateLink(url?: string | null): string | undefined {
  if (!url) return undefined;
  const value = url.trim();
  if (/^\/(?!\/)/.test(value) && !value.includes('\\')) return value;
  try { const parsed = new URL(value); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined; }
  catch { return undefined; }
}
