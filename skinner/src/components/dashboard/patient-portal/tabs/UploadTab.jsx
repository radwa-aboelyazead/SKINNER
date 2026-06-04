import { useState } from "react";
import UploadSkinImageCard from "./UploadSkinImageCard";
import PreviousAnalysesCard from "../PreviousAnalysesCard";

export default function UploadTab({ onAnalyze, onViewAnalysis }) {
  const [historyVersion, setHistoryVersion] = useState(0);

  const bumpHistory = () => setHistoryVersion((v) => v + 1);

  return (
    <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[minmax(0,448px)_292px] lg:justify-center">
      <UploadSkinImageCard onAnalyze={onAnalyze} onUploadComplete={bumpHistory} />
      <PreviousAnalysesCard onSelect={onViewAnalysis} reloadSignal={historyVersion} />
    </div>
  );
}
