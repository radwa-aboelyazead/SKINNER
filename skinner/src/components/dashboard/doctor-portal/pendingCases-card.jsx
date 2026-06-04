import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, FileText } from "lucide-react";

export function PendingCasesCard({ item, onReview, onChat }) {
  return (
    <Card
      key={item.id}
      className="relative w-full p-5 shadow-sm transition-all animate-in fade-in duration-300"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          className="h-24 w-24 rounded-md object-cover sm:h-28 sm:w-28"
          src={item.patient_image}
          alt={item.patient_name}
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-medium text-slate-900">
              {item.patient_name}
            </h3>
            <Badge variant="outline" className="rounded-md font-normal leading-none">
              {item.patient_age} yrs, {item.patient_gender}
            </Badge>
          </div>

          <p className="text-[12px] font-normal text-[#4A5565]">
            AI Diagnosis: {item.ai_diagnosis}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.ai_confidence_level?.toLowerCase() === "high" ? "destructive" : "medium"} className="rounded-md uppercase">
              {item.ai_confidence_level || "unknown"} Confidence
            </Badge>
            <Badge variant="outline" className="rounded-md font-normal leading-none lowercase">
              {item.ai_confidence} confidence
            </Badge>
            <div className="flex items-center gap-1 text-[#4A5565]">
              <Clock className="size-4" />
              <span className="text-xs text-slate-500">{item.submitted_on}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onReview} variant="default" size="sm" className="bg-[#050316] text-white">
              <FileText className="size-4" />
              Review Case
            </Button>
            {onChat && (
              <Button onClick={onChat} variant="outline" size="sm" className="relative border-gray-300 hover:bg-gray-50 text-slate-800 transition dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
                Chat with Patient
                {(item.unread_count > 0 || item.unreadCount > 0) && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                    {item.unread_count || item.unreadCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
