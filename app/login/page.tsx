import Image from "next/image";

import Footer from "@/src/components/footer/Footer";
import Header from "@/src/components/header/Header";
import HeroSection from "@/src/components/login/HeroSection";

/**
 * Login page (FRAME GzbNeVGJHz). Background composition mirrors the Figma
 * layer stack:
 *
 *   1. Solid page background (`bg-saa-page` — #00101A)
 *   2. Key visual artwork (decorative)
 *   3. Left-to-right dark gradient (fades artwork on the left)
 *   4. Bottom-up dark gradient (fades artwork to dark at the bottom)
 *   5. Header   — anchored top
 *   6. Hero     — vertically centered between header and footer
 *   7. Footer   — anchored bottom
 *
 * Auth check (FR-002 server-side redirect) and locale resolution land in
 * task T050 — see plan.md Phase 3.
 */
export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-saa-page text-saa-page-fg">
      {/* Layer 2 — key visual artwork */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <Image
          src="/assets/login/images/key-visual.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
      </div>
      {/* Layer 3 — left-to-right dark fade */}
      <div
        aria-hidden="true"
        className="saa-overlay-fade-left absolute inset-0 z-[1]"
      />
      {/* Layer 4 — bottom-up dark fade */}
      <div
        aria-hidden="true"
        className="saa-overlay-fade-bottom absolute inset-x-0 bottom-0 z-[2] h-[1093px]"
      />

      {/* Layer 5 — Header */}
      <Header />
      {/* Layer 6 — Hero */}
      <HeroSection />
      {/* Layer 7 — Footer */}
      <Footer />
    </main>
  );
}
