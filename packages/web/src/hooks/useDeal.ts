"use client";

import { useReadContract, useReadContracts, useAccount } from "wagmi";
import type { Address } from "viem";
import { useLoveChain } from "./useLoveChain";
import type { Deal, BreachClaim, PartnerRole } from "@/types/deal";
import { sameAddress } from "@/lib/format";

/** Read a single deal, its witnesses, and any active breach claim. */
export function useDeal(id?: bigint) {
  const { address, abi, ready } = useLoveChain();
  const { address: account } = useAccount();

  const enabled = ready && id !== undefined;

  const { data, isLoading, isError, refetch } = useReadContracts({
    query: { enabled, refetchInterval: 8000 },
    contracts: enabled
      ? [
          { address, abi, functionName: "getContract", args: [id] },
          { address, abi, functionName: "getWitnesses", args: [id] },
          { address, abi, functionName: "getClaim", args: [id] },
          { address, abi, functionName: "getRules", args: [id] },
        ]
      : [],
  });

  const deal = data?.[0]?.result as Deal | undefined;
  const witnesses = (data?.[1]?.result as Address[] | undefined) ?? [];
  const claim = data?.[2]?.result as BreachClaim | undefined;
  const rules = (data?.[3]?.result as string[] | undefined) ?? [];

  const role = resolveRole(deal, witnesses, account);

  return { deal, witnesses, claim, rules, role, account, isLoading, isError, refetch };
}

/** How many total contracts exist (nextContractId). */
export function useDealCount() {
  const { address, abi, ready } = useLoveChain();
  return useReadContract({
    address,
    abi,
    functionName: "nextContractId",
    query: { enabled: ready, refetchInterval: 10000 },
  });
}

/** Claimable amount for an account on a resolved/expired deal. */
export function useClaimable(id?: bigint, who?: Address) {
  const { address, abi, ready } = useLoveChain();
  return useReadContract({
    address,
    abi,
    functionName: "claimableAmount",
    args: id !== undefined && who ? [id, who] : undefined,
    query: { enabled: ready && id !== undefined && Boolean(who), refetchInterval: 8000 },
  });
}

function resolveRole(
  deal: Deal | undefined,
  witnesses: Address[],
  account?: Address
): PartnerRole {
  if (!deal || !account) return "outsider";
  if (sameAddress(deal.partnerA, account)) return "A";
  if (sameAddress(deal.partnerB, account)) return "B";
  if (witnesses.some((w) => sameAddress(w, account))) return "witness";
  return "outsider";
}
