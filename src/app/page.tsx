import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import RecentItinerariesSection from "@/components/recent/RecentItinerariesSection";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import TrustBadgesSection from "@/components/trust/TrustBadgesSection";
import Footer from "@/components/footer/Footer";

/**
 * Landing page entry point composes the full marketing experience.
 * Each section lives in its own component for scalability.
 */
export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <RecentItinerariesSection />
      <ReviewsSection />
      <TrustBadgesSection />
      <Footer />
    </main>
  );
}
