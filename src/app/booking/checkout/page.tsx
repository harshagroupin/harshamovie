import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { CheckoutContent } from "./checkout-content";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <CheckoutContent />
        </Suspense>
      </main>
    </>
  );
}
