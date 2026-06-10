import { getMovies, getFeaturedMovies } from "@/actions/movies";
import { getActivePromoCodes } from "@/actions/promos";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HomeContent } from "./home-content";
import { APP_NAME, APP_URL, HOMEPAGE_FAQS, BUSINESS } from "@/lib/constants";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
} from "@/lib/schema";

export default async function HomePage() {
  const [movies, featured, promoCodes] = await Promise.all([
    getMovies(),
    getFeaturedMovies(),
    getActivePromoCodes(),
  ]);

  // Server-rendered schemas for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: APP_URL },
  ]);

  const faqSchema = generateFAQSchema(
    HOMEPAGE_FAQS.map((f) => ({ question: f.question, answer: f.answer }))
  );

  // Build dynamic movie names for AEO
  const nowShowingNames = movies
    .filter((m) => {
      const rel = new Date(m.release_date);
      rel.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return rel <= today;
    })
    .slice(0, 5)
    .map((m) => m.title);

  return (
    <>
      {/* Server-rendered JSON-LD for Google + AI crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Navbar />
      <main>
        <HomeContent movies={movies} featuredMovies={featured} promoCodes={promoCodes} />

        {/* ===== SERVER-RENDERED SEO CONTENT FOR AEO/GEO ===== */}
        <section className="w-full max-w-[1264px] mx-auto px-6 sm:px-0 py-12 border-t border-[#E8E8EA]">
          {/* Answer Block — optimized for AI Overview / Featured Snippet */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#131316] mb-4">
              {APP_NAME} — Premium Cinema in {BUSINESS.city}
            </h2>
            <p className="text-[15px] text-[#545459] leading-relaxed max-w-3xl">
              <strong>{APP_NAME}</strong> is a premium movie theater located at{" "}
              <strong>{BUSINESS.address}</strong>. Featuring{" "}
              <strong>{BUSINESS.screens} screens</strong> with{" "}
              <strong>Dolby Atmos surround sound</strong>,{" "}
              <strong>luxury recliner seating</strong>, and{" "}
              <strong>3D projection</strong>, it is the top-rated cinema
              destination in {BUSINESS.city}, {BUSINESS.state}. Ticket prices
              range from <strong>₹150 to ₹500</strong>. The theater is open
              daily from <strong>{BUSINESS.hours}</strong>.
            </p>
          </div>

          {/* Now Showing summary for AI crawlers */}
          {nowShowingNames.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-bold text-[#131316] mb-3">
                Movies Now Showing at {APP_NAME}
              </h3>
              <p className="text-[14px] text-[#545459] leading-relaxed">
                Currently showing:{" "}
                <strong>{nowShowingNames.join(", ")}</strong>.{" "}
                Book tickets online at{" "}
                <a href={APP_URL} className="text-[#0B70D5] font-semibold hover:underline">
                  harshamovies.com
                </a>{" "}
                for the latest showtimes and seat availability.
              </p>
            </div>
          )}

          {/* FAQ Section — AEO optimized, server-rendered */}
          <div>
            <h3 className="text-lg font-bold text-[#131316] mb-6">
              Frequently Asked Questions about {APP_NAME}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {HOMEPAGE_FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-[#E8E8EA] bg-[#FAFAFA]"
                >
                  <h4 className="text-[15px] font-bold text-[#131316] mb-2">
                    {faq.question}
                  </h4>
                  <p className="text-[13px] text-[#545459] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
