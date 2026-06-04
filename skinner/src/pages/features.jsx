import Navbar from "../layouts/navbar";
import Footer from "../layouts/footer";
import {
  Activity,
  Bot,
  Calendar,
  Camera,
  CreditCard,
  FileText,
  Lock,
  MapPin,
  MessageCircle,
  Shield,
  Stethoscope,
  Upload,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Camera,
    title: "AI Skin Analysis",
    description:
      "Upload a photo of your skin condition and receive an instant AI-powered preliminary diagnosis with confidence score — all in seconds.",
    color: "bg-blue-100 text-blue-600",
    tag: "Core Feature",
  },
  {
    icon: Stethoscope,
    title: "Verified Dermatologists",
    description:
      "Browse a network of verified, board-certified dermatologists. View their specialties, experience, ratings, and clinic locations before booking.",
    color: "bg-green-100 text-green-600",
    tag: "Doctor Network",
  },
  {
    icon: MessageCircle,
    title: "Secure Doctor-Patient Chat",
    description:
      "Communicate with your dermatologist through end-to-end encrypted messaging. Share images, files, and documents directly within the conversation.",
    color: "bg-purple-100 text-purple-600",
    tag: "Communication",
  },
  {
    icon: Calendar,
    title: "Smart Appointment Booking",
    description:
      "Book appointments with real-time availability. Select your preferred date and time slot, view the doctor's schedule, and confirm instantly.",
    color: "bg-amber-100 text-amber-600",
    tag: "Scheduling",
  },
  {
    icon: CreditCard,
    title: "Secure Payments with OTP",
    description:
      "Pay for consultations securely with PCI-DSS compliant processing. Every transaction is verified with a one-time password (OTP) for maximum security.",
    color: "bg-rose-100 text-rose-600",
    tag: "Payments",
  },
  {
    icon: Bot,
    title: "AI Health Assistant",
    description:
      "Get instant answers about skin conditions, treatment options, and platform guidance from our HIPAA-compliant AI chatbot — available 24/7.",
    color: "bg-cyan-100 text-cyan-600",
    tag: "AI Powered",
  },
  {
    icon: FileText,
    title: "Medical Reports & Downloads",
    description:
      "Doctors can write detailed medical reports directly within the platform. Patients receive downloadable reports and can review their diagnosis history.",
    color: "bg-indigo-100 text-indigo-600",
    tag: "Documentation",
  },
  {
    icon: Upload,
    title: "Image Upload & Case Review",
    description:
      "Patients upload skin images for analysis. Doctors review cases with full patient information and AI predictions before consulting.",
    color: "bg-teal-100 text-teal-600",
    tag: "Workflow",
  },
  {
    icon: MapPin,
    title: "Clinic Location Maps",
    description:
      "View your doctor's clinic on an interactive Google Maps embed. Get directions to the exact address for your in-person appointment.",
    color: "bg-orange-100 text-orange-600",
    tag: "Navigation",
  },
  {
    icon: Users,
    title: "Doctor Dashboard & Analytics",
    description:
      "Doctors manage pending and reviewed cases, set availability schedules, and track patient analytics — all from a unified dashboard.",
    color: "bg-pink-100 text-pink-600",
    tag: "For Doctors",
  },
  {
    icon: Shield,
    title: "Privacy & Data Protection",
    description:
      "All conversations are end-to-end encrypted. Medical data is handled with HIPAA-compliant standards. Your health information stays private.",
    color: "bg-emerald-100 text-emerald-600",
    tag: "Security",
  },
  {
    icon: Activity,
    title: "Analysis Library",
    description:
      "Access a comprehensive library of past analyses and skin condition information. Track your skin health journey with a complete history of results.",
    color: "bg-violet-100 text-violet-600",
    tag: "Knowledge",
  },
];

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Tag */}
      <span className="mb-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {feature.tag}
      </span>

      {/* Icon */}
      <div className={`mb-4 flex size-12 items-center justify-center rounded-xl ${feature.color}`}>
        <Icon className="size-6" />
      </div>

      {/* Content */}
      <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
        {feature.title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        {feature.description}
      </p>

      {/* Decorative corner gradient */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 size-24 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 transition-opacity group-hover:opacity-100" />
    </article>
  );
}

export default function Features() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <section className="flex-1 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_50%,#FAF5FF_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          {/* Header */}
          <div className="text-center">
            <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-[12px] font-semibold text-blue-700">
              Platform Features
            </span>
            <h1 className="mt-4 text-[28px] font-bold text-slate-900 md:text-[40px]">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Skin Health</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-500">
              From AI-powered diagnosis to verified doctor consultations, Skinner brings together cutting-edge technology and medical expertise in one seamless platform.
            </p>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: "AI-Powered", label: "Skin Analysis" },
              { value: "Verified", label: "Dermatologists" },
              { value: "End-to-End", label: "Encryption" },
              { value: "24/7", label: "AI Assistant" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-[15px] font-bold text-blue-600">{stat.value}</p>
                <p className="mt-1 text-[11px] text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center shadow-lg md:p-12">
            <Lock className="mx-auto size-10 text-white/80" />
            <h2 className="mt-4 text-[22px] font-bold text-white md:text-[26px]">
              Ready to Take Control of Your Skin Health?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/80">
              Join Skinner today and get access to AI-powered skin analysis, verified dermatologists, and secure medical consultations — all in one platform.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href="/register"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[13px] font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Get Started Free
              </a>
              <a
                href="/contact-us"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/30 px-6 text-[13px] font-semibold text-white transition hover:bg-white/10"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
