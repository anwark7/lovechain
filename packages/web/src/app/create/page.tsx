import { CreateDealForm } from "@/components/features/CreateDealForm";

export const metadata = { title: "Create · LoveChain" };

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <CreateDealForm />
    </div>
  );
}
