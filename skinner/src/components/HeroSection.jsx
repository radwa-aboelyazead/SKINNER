export default function HeroSection() {
  return (
    <section className="relative w-full bg-[linear-gradient(135deg,#DBE7FE_0%,#F1E8FF_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_50%)] pt-16 pb-32 px-6 overflow-hidden dark:border-b dark:border-zinc-800">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-6">
          Skin Disease Detection System
        </h1>
        <p className="text-base md:text-lg text-gray-700 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Advanced AI-powered skin disease identification platform connecting
          patients with verified healthcare professionals
        </p>
      </div>

      {/* Wave divider at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 leading-none">
        <svg
          viewBox="0 0 1440 100"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C360,100 720,0 1080,50 C1260,75 1350,60 1440,50 L1440,100 L0,100 Z"
            fill="currentColor"
            className="text-white dark:text-[#0f172a]"
          />
        </svg>
      </div>
    </section>
  );
}

