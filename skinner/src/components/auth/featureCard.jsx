import { Activity, Check, Shield, Stethoscope } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useTranslation } from "@/context/LanguageContext";

export function FeatureCard() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Activity className="size-4 text-blue-600" />,
      title: t("feature_ai_title"),
      desc: t("feature_ai_desc"),
      bg: "bg-blue-100",
    },
    {
      icon: <Check className="size-4 text-green-600" />,
      title: t("feature_expert_title"),
      desc: t("feature_expert_desc"),
      bg: "bg-green-100",
    },
    {
      icon: <Shield className="size-4 text-violet-600" />,
      title: t("feature_secure_title"),
      desc: t("feature_secure_desc"),
      bg: "bg-violet-100",
    },
    {
      icon: <Stethoscope className="size-4 text-orange-600" />,
      title: t("feature_matching_title"),
      desc: t("feature_matching_desc"),
      bg: "bg-orange-100",
    },
  ];

  return (
    <Card className="rounded-lg max-w-sm mx-auto border border-gray-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <CardContent className="">
        <h3 className="mb-4 font-medium text-[#0A0A0A] dark:text-white">
          {t("why_choose_system")}
        </h3>

        <div className="space-y-4">
          {features.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex size-8 aspect-square items-center justify-center rounded-lg ${item.bg} shrink-0`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-normal text-[#0A0A0A] dark:text-white">
                  {item.title}
                </p>
                <p className="text-[11px] leading-4 text-[#4A5565] dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}