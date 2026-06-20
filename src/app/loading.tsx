import { Film } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-[#131316] flex items-center justify-center animate-pulse">
          <Film className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
}
