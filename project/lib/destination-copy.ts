/**
 * Counts written the way a person would say them.
 *
 * The first cut of the SEO description read "1 whisky bars, 1 distilleries,
 * 1 events in Sydney" — and that string is what Google prints under the link.
 * Shared so the page heading and the meta description can't drift apart again.
 */
export function countPhrase(counts: { bars: number; distilleries: number; events: number }): string {
  const parts = [
    counts.bars && `${counts.bars} whisky ${counts.bars === 1 ? 'bar' : 'bars'}`,
    counts.distilleries &&
      `${counts.distilleries} ${counts.distilleries === 1 ? 'distillery' : 'distilleries'}`,
    counts.events && `${counts.events} ${counts.events === 1 ? 'event' : 'events'}`,
  ].filter(Boolean) as string[]

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}
