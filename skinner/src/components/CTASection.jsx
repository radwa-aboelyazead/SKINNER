import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();

  const benefits = [
    "Access AI-analyzed patient cases",
    "Streamlined patient management",
    "Expand your practice reach",
  ];

  return (
    <section className="w-full bg-white dark:bg-[#0f172a] pb-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-[linear-gradient(90deg,#155DFC_0%,#9810FA_100%)] text-white shadow-lg p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              For Healthcare Professionals
            </h2>
            <p className="text-sm md:text-base text-white/90 mb-8">
              Join our network of verified doctors and help patients get the care they need
            </p>

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
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Start Now Button */}
            <button
              onClick={() => navigate("/register")}
              className="rounded-md bg-white text-blue-600 font-semibold px-8 py-2.5 text-sm hover:bg-gray-100 transition cursor-pointer"
            >
              Start Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
