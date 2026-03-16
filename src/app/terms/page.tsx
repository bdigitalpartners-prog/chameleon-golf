import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service — golfEQUALIZER",
  description: "Terms of Service for golfEQUALIZER — rules and conditions for using our platform.",
};

export default function TermsPage() {
  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-3xl">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          style={{ color: "var(--cg-text-primary)" }}
        >
          Terms of Service
        </h1>
        <p
          className="text-sm mb-10"
          style={{ color: "var(--cg-text-muted)" }}
        >
          Last updated: March 16, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--cg-text-secondary)" }}>
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using golfEQUALIZER at golfequalizer.ai (the &ldquo;Service&rdquo;), you agree
              to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms,
              do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              golfEQUALIZER is a dynamic golf course review and ranking platform. We aggregate rankings from
              major golf publications including Golf Digest, Golfweek, GOLF Magazine, and Top100GolfCourses.com,
              and enable users to filter and re-weight courses based on personal preferences. The Service also
              provides course details, nearby amenities, airport proximity data, and user score journals.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <p>
              You may browse course rankings and details without creating an account. Certain features — including
              the Score Journal, GHIN verification, personalized weights, and wishlists — require a Google
              sign-in.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account. You agree to accept
              responsibility for all activities that occur under your account. You must notify us immediately
              of any unauthorized use.
            </p>
          </Section>

          <Section title="4. User Content &amp; Conduct">
            <p>
              When using the Service, you may submit course ratings, reviews, score journal entries, and GHIN
              verification screenshots (&ldquo;User Content&rdquo;). You retain ownership of your User Content
              but grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute it
              in connection with the Service.
            </p>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Upload fraudulent GHIN screenshots or falsify handicap data</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use automated tools to scrape, mine, or extract data from the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Impersonate another person or entity</li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              The Service and its original content (excluding User Content), features, and functionality are
              owned by B Digital Partners LLC and are protected by copyright, trademark, and other intellectual
              property laws.
            </p>
            <p>
              Course ranking data is aggregated from publicly available publications. Individual rankings remain
              the intellectual property of their respective publishers (Golf Digest, Golfweek, GOLF Magazine,
              Top100GolfCourses.com). Our aggregation methodology (the Equalizer Score) is proprietary.
            </p>
          </Section>

          <Section title="6. GHIN Verification">
            <p>
              Our GHIN verification process involves user-submitted GHIN numbers and screenshot evidence. We
              make reasonable efforts to verify handicap information but do not guarantee accuracy. Verified
              handicaps displayed on the Service are based on user-provided data and are not official USGA
              handicap certifications.
            </p>
          </Section>

          <Section title="7. Third-Party Links &amp; Content">
            <p>
              The Service may contain links to third-party websites or services (course websites, booking
              platforms, restaurants, lodging, etc.) that are not owned or controlled by us. We are not responsible
              for the content, privacy policies, or practices of any third-party sites.
            </p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of
              any kind, either express or implied. We do not warrant that the Service will be uninterrupted,
              error-free, or free of harmful components.
            </p>
            <p>
              Course information, including green fees, contact details, amenities, and nearby attractions, is
              provided for informational purposes only and may not be current. We recommend verifying details
              directly with each course.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable law, B Digital Partners LLC shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other
              intangible losses resulting from your use of the Service.
            </p>
          </Section>

          <Section title="10. Indemnification">
            <p>
              You agree to indemnify and hold harmless B Digital Partners LLC and its officers, directors,
              employees, and agents from any claims, damages, losses, liabilities, and expenses (including
              legal fees) arising from your use of the Service or violation of these Terms.
            </p>
          </Section>

          <Section title="11. Modifications">
            <p>
              We reserve the right to modify or replace these Terms at any time. Material changes will be
              communicated via the Service. Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              We may terminate or suspend your account and access to the Service at our sole discretion,
              without notice, for conduct that we determine violates these Terms or is harmful to other users,
              us, or third parties.
            </p>
          </Section>

          <Section title="13. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of
              Florida, without regard to its conflict of law provisions. Any disputes arising under these
              Terms shall be subject to the exclusive jurisdiction of the courts located in Florida.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>
              If you have questions about these Terms, contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:legal@golfequalizer.ai"
                style={{ color: "var(--cg-accent)" }}
                className="hover:underline"
              >
                legal@golfequalizer.ai
              </a>
            </p>
            <p className="mt-1">
              <strong>Operated by:</strong> B Digital Partners LLC
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: "var(--cg-text-primary)" }}
      >
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
