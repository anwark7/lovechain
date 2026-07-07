import { FEE_TIERS } from "@/constants/contract";

/** Read-only display of the tiered platform fee (PRD §28.2). */
export function FeeTierTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-rose-50/40">
          <tr>
            <th className="pb-2 pr-4 font-medium">Outcome</th>
            <th className="pb-2 pr-4 font-medium">Fee</th>
            <th className="pb-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {FEE_TIERS.map((tier) => (
            <tr key={tier.key}>
              <td className="py-2 pr-4">
                {tier.emoji} {tier.label}
              </td>
              <td className="py-2 pr-4 font-mono text-rose-300">
                {(tier.bps / 100).toString()}%
              </td>
              <td className="py-2 text-rose-50/50">
                {tier.key === "wedding"
                  ? "Best outcome — lightest fee"
                  : tier.key === "peaceful"
                    ? "Neutral, mutual"
                    : tier.key === "breach"
                      ? "Outcome the system discourages"
                      : "Default withdrawal, like peaceful"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
