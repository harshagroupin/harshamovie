import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PaymentStatusContent } from "./payment-status-content";

export const metadata = { title: "Payment Status" };

export default function PaymentStatusPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
              <div className="w-8 h-8 border-2 border-[#0B70D5] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <PaymentStatusContent />
        </Suspense>
      </main>
    </>
  );
}
