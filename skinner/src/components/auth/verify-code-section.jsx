import { FeatureCard } from "./featureCard";
import { ProfessionalCard } from "./professionalCard";
import VerifyCodeCard from "./VerifyCodeCard";


export default function VerifyCodeSection() {
  return (
    <section className="w-full py-16">
      <div className="mx-auto grid max-w-4xl gap-10 px-6 md:grid-cols-2 md:items-start">
        {/* Left */}
        <div className="space-y-4">
          <FeatureCard />
          <ProfessionalCard />
        </div>

        {/* Right */}
        <div className="flex justify-center md:justify-end">
          <VerifyCodeCard />
        </div>
      </div>
    </section>
  );
}
