import { useNavigate } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";

export default function CTASection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const benefits = [
    t("benefit_1"),
    t("benefit_2"),
    t("benefit_3"),
  ];

  return (
    <section className="w-full bg-white dark:bg-[#0f172a] pb-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-[linear-gradient(90deg,#155DFC_0%,#9810FA_100%)] text-white shadow-lg p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              {t("for_professionals")}
            </h2>
            <div className="text-sm md:text-base text-white/90 mb-8">
              {t("professionals_desc")}
            </div>

            {/* Benefits list */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-sm bg-pink-500 shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-3 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-sm">{benefit}</div>
                </div>
              ))}
            </div>

            {/* Start Now Button */}
            <button
              onClick={() => navigate("/register")}
              className="rounded-md bg-[#ffffff] text-[#155DFC] hover:bg-[#f3f4f6] font-semibold px-8 py-2.5 text-sm transition cursor-pointer border border-[#ffffff]"
            >
              {t("start_now")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
