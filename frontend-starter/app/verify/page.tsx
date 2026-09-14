import { Suspense } from "react";
import { VerifyOtpForm } from "@/components/VerifyOtpForm";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-zinc-500">Loading verify form…</p>}
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
