import Navbar from "../layouts/navbar";
import Footer from "../layouts/footer";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

const PHONE_NUMBERS = [
  { display: "+20 103 096 7385", tel: "+201030967385" },
  { display: "+20 101 433 1859", tel: "+201014331859" },
  { display: "+20 122 813 5447", tel: "+201228135447" },
];

const EMAILS = [
  "mahmoudsa4567@gmail.com",
  "abdotako2@gmail.com",
  "radwaaboelyazead@gmail.com",
];

function ContactCard({ icon: Icon, title, children, gradient }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md ${gradient}`}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
        <Icon className="size-6" />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export default function ContactUs() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <section className="flex-1 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_50%,#FAF5FF_100%)]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <MessageCircle className="size-8" />
            </div>
            <h1 className="text-[28px] font-bold text-slate-900 md:text-[36px]">
              Contact Us
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-gray-500">
              Have questions about Skinner? Reach out to our team — we're here to help you with anything related to skin health and our platform.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Phone Numbers */}
            <ContactCard icon={Phone} title="Phone Numbers">
              {PHONE_NUMBERS.map((phone) => (
                <a
                  key={phone.tel}
                  href={`tel:${phone.tel}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Phone className="size-4 shrink-0 text-blue-500" />
                  <span className="font-medium">{phone.display}</span>
                </a>
              ))}
            </ContactCard>

            {/* Email Addresses */}
            <ContactCard icon={Mail} title="Email Addresses">
              {EMAILS.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Mail className="size-4 shrink-0 text-blue-500" />
                  <span className="font-medium break-all">{email}</span>
                </a>
              ))}
            </ContactCard>
          </div>

          {/* Additional Info */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <ContactCard icon={MapPin} title="Our Location">
              <p className="px-3 text-[13px] leading-relaxed text-gray-600">
                Egypt — Cairo & Alexandria
              </p>
              <p className="px-3 text-[12px] text-gray-400">
                Serving patients across the region with AI-powered dermatology.
              </p>
            </ContactCard>

            <ContactCard icon={Clock} title="Working Hours">
              <div className="space-y-1 px-3 text-[13px] text-gray-600">
                <p className="flex justify-between">
                  <span className="text-slate-700 font-medium">Sunday – Thursday</span>
                  <span>9:00 AM – 6:00 PM</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-700 font-medium">Friday – Saturday</span>
                  <span className="text-gray-400">Closed</span>
                </p>
              </div>
            </ContactCard>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50/60 p-8 text-center shadow-sm">
            <h2 className="text-[18px] font-semibold text-slate-900">
              Need Immediate Assistance?
            </h2>
            <p className="mt-2 text-[13px] text-gray-600">
              For urgent medical concerns, please contact your nearest healthcare provider or call emergency services.
            </p>
            <a
              href={`tel:${PHONE_NUMBERS[0].tel}`}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-6 text-[13px] font-medium text-white transition hover:bg-blue-700"
            >
              <Phone className="size-4" />
              Call Us Now
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
