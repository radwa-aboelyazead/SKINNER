import { Activity } from "lucide-react";
import { Loader } from "@/components/animated-icon/loader";

export default function LoaderPage() {
  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center gap-y-4 fixed bg-[linear-gradient(135deg,#155DFC_0%,#1447E6_50%,#8200DB_100%)]">
      <div className="size-20 rounded-xl shadow-2xl bg-white flex justify-center items-center">
        <Activity size={40} className="text-[#749FFD]" />
      </div>
      <div className="text-center space-y-1.5">
        <h1 className="font-bold text-white text-3xl">Skinner</h1>
        <p className="text-[#DBEAFE] text-xs">AI-Powered Healthcare Platform</p>
      </div>
      {/* <DotsLoader size="lg" className="text-white"/> */}
      <Loader variant="dots" size="lg" />
    </div>
  );
}
