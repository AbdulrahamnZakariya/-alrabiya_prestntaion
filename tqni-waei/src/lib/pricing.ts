import { bundles, USD_TO_JOD } from "@/content/site";

export type PriceQuote = {
  totalUsd: number;
  totalJod: number;
  breakdown: string[];
};

/**
 * يحسب أفضل سعر للعميل حسب عدد المكائن المختارة:
 * كل المكائن → سعر باقة "الكل" (إن كان أرخص)، وإلا باقات الثلاث + مكائن مفردة.
 */
export function quote(selected: { slug: string; priceUsd: number }[], allLiveCount: number): PriceQuote {
  const n = selected.length;
  const trio = bundles.find((b) => b.size === 3);
  const all = bundles.find((b) => b.size === "all");

  const sorted = [...selected].sort((a, b) => b.priceUsd - a.priceUsd);
  let totalUsd = 0;
  const breakdown: string[] = [];

  if (trio && n >= 3) {
    const trios = Math.floor(n / 3);
    totalUsd += trios * trio.priceUsd;
    breakdown.push(`${trios} × ${trio.title} (${trio.priceUsd}$)`);
    for (const m of sorted.slice(trios * 3)) totalUsd += m.priceUsd;
    const rest = n - trios * 3;
    if (rest) breakdown.push(`${rest} × ماكينة مفردة`);
  } else {
    for (const m of sorted) totalUsd += m.priceUsd;
    if (n) breakdown.push(`${n} × ماكينة مفردة`);
  }

  if (all && n > 0 && n >= allLiveCount && all.priceUsd < totalUsd) {
    totalUsd = all.priceUsd;
    breakdown.splice(0, breakdown.length, `${all.title} (${all.priceUsd}$)`);
  }

  return { totalUsd, totalJod: Math.round(totalUsd * USD_TO_JOD), breakdown };
}
