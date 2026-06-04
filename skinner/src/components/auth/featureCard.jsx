import { Activity, Check, Shield, Stethoscope } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export function FeatureCard() {
  const features = [
    {
      icon: <Activity className="size-4 text-blue-600" />,
      title: "AI-Powered Analysis",
      desc: "Advanced machine learning algorithms provide instant preliminary skin condition identification",
      bg: "bg-blue-100",
    },
    {
      icon: <Check className="size-4 text-green-600" />,
      title: "Expert Verification",
      desc: "All AI results are reviewed by verified dermatology specialists",
      bg: "bg-green-100",
    },
    {
      icon: <Shield className="size-4 text-violet-600" />,
      title: "Secure & Private",
      desc: "HIPAA-compliant platform ensuring your health data remains confidential",
      bg: "bg-violet-100",
    },
    {
      icon: <Stethoscope className="size-4 text-orange-600" />,
      title: "Doctor Matching",
      desc: "Get connected with the right specialists based on your condition",
      bg: "bg-orange-100",
    },
  ];

  return (
    <Card className="rounded-lg max-w-sm mx-auto border border-gray-200 shadow-sm">
      <CardContent className="">
        <h3 className="mb-4 font-medium  text-[#0A0A0A]">
          Why Choose Skin Disease Detection System?
        </h3>

        <div className="space-y-4">
          {features.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex size-8 aspect-square items-center justify-center rounded-lg ${item.bg}`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-normal text-[#0A0A0A]">
                  {item.title}
                </p>
                <p className="text-[11px] leading-4 text-[#4A5565]">
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