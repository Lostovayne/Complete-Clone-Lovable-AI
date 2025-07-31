"use client";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Home() {
  const trpc = useTRPC();
  const invoke = useMutation(
    trpc.invoke.mutationOptions({
      onSuccess: () => {
        toast.success("Background job invoked successfully!");
      },
    })
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Button onClick={() => invoke.mutate({ text: "Epsaind2" })}>Invoke Background Job</Button>
    </div>
  );
}
