import Link from "next/link";
import { Film, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-20 h-20 rounded-2xl bg-[#F5F5F6] flex items-center justify-center mb-6 border border-[#E8E8EA]">
        <Film className="w-10 h-10 text-[#8E8E93]" />
      </div>
      <h1 className="text-6xl font-bold text-[#131316] mb-3">404</h1>
      <p className="text-[#545459] text-lg mb-8 text-center max-w-md">
        This page doesn&apos;t exist. The movie you&apos;re looking for may have ended its run.
      </p>
      <Link href="/">
        <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#131316] text-white font-semibold text-base hover:bg-[#2C2C30] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </Link>
    </div>
  );
}
