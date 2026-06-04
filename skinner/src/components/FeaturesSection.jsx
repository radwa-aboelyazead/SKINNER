import { Activity, Check, Shield, Stethoscope } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Activity className="size-5 text-blue-600 dark:text-blue-400" />,
      title: "AI-Powered Analysis",
      titleColor: "text-blue-600 dark:text-blue-400",
      desc: "Advanced machine learning algorithms provide instant preliminary skin condition identification",
      bg: "bg-blue-100 dark:bg-blue-950/40",
    },
    {
      icon: <Check className="size-5 text-green-600 dark:text-green-400" />,
      title: "Expert Verification",
      titleColor: "text-green-600 dark:text-green-400",
      desc: "All AI results are reviewed by verified dermatology specialists",
      bg: "bg-green-100 dark:bg-green-950/40",
    },
    {
      icon: <Shield className="size-5 text-violet-600 dark:text-violet-400" />,
      title: "Secure & Private",
      titleColor: "text-violet-600 dark:text-violet-400",
      desc: "HIPAA-compliant platform ensuring your health data remains confidential",
      bg: "bg-violet-100 dark:bg-violet-950/40",
    },
    {
      icon: <Stethoscope className="size-5 text-orange-600 dark:text-orange-400" />,
      title: "Doctor Matching",
      titleColor: "text-orange-600 dark:text-orange-400",
      desc: "Get connected with the right specialists based on your condition",
      bg: "bg-orange-100 dark:bg-orange-950/40",
    },
  ];

  return (
    <section id="features" className="w-full bg-white dark:bg-[#0f172a] py-16 px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Why Choose Skin Disease Detection System?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-blue-500/5 transition-all duration-300 dark:bg-[#111827]"
            >
              <CardContent className="flex flex-col items-center text-center p-5">
                <div
                  className={`flex size-12 items-center justify-center rounded-lg ${feature.bg} mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className={`text-sm font-semibold ${feature.titleColor} mb-2`}>
                  {feature.title}
                </h3>
                <p className="text-[12px] leading-5 text-gray-600 dark:text-zinc-400">
                  {feature.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

