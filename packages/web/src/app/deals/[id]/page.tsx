"use client";

import { DealPageShell } from "@/components/features/DealPageShell";
import { DealOverview } from "@/components/features/DealOverview";
import { DealActions } from "@/components/features/DealActions";

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <DealPageShell idParam={id}>
      {({ deal, witnesses, rules, role, refetch }) => (
        <>
          <DealOverview deal={deal} witnesses={witnesses} rules={rules} role={role} />
          <DealActions deal={deal} role={role} refetch={refetch} />
        </>
      )}
    </DealPageShell>
  );
}
