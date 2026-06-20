import { Suspense } from "react";
import { Film } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ConfirmationContent } from "./confirmation-content";

export const metadata = { title: "Booking Status" };

export default function ConfirmationPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={
          <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-14 h-14 rounded-2xl bg-[#131316] flex items-center justify-center animate-pulse">
              <Film className="w-7 h-7 text-white" />
            </div>
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
