import Navbar from "../layouts/navbar";
import Footer from "../layouts/footer";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import CTASection from "../components/CTASection";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
