import { Card, CardContent } from "../ui/card";
import { useTranslation } from "@/context/LanguageContext";

export function ProfessionalCard() {
  const { t } = useTranslation();

  return (
    <Card className="rounded-lg max-w-sm mx-auto border-0 bg-[linear-gradient(90deg,#155DFC_0%,#9810FA_100%)] text-white shadow-lg">
      <CardContent className="">
        <h3 className="text-sm font-semibold">{t("for_professionals")}</h3>
        <div className="mt-2 text-[11px] leading-4 text-white/90">
          {t("professionals_desc")}
        </div>

        <ul className="mt-4 space-y-2 text-[11px] text-white/90">
          <li className="flex items-center gap-2">
            <div>✓</div>
            <div>{t("benefit_1")}</div>
          </li>
          <li className="flex items-center gap-2">
            <div>✓</div>
            <div>{t("benefit_2")}</div>
          </li>
          <li className="flex items-center gap-2">
            <div>✓</div>
            <div>{t("benefit_3")}</div>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}