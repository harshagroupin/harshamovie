import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { SeatSelectionContent } from "./seat-selection-content";

export const metadata = { title: "Select Seats" };

export default function SeatSelectionPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <SeatSelectionContent />
        </Suspense>
      </main>
    </>
  );
}
