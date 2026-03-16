import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service — golfEQUALIZER",
  description:
    "Terms of Service for golfEQUALIZER — rules and conditions for using our platform.",
};

const sections = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "service-description", label: "Description of Service" },
  { id: "user-accounts", label: "User Accounts" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "user-content", label: "User Content" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "ghin-verification", label: "GHIN Verification" },
  { id: "third-party-links", label: "Third-Party Links & Content" },
  { id: "disclaimers", label: "Disclaimer of Warranties" },
  { id: "limitation-of-liability", label: "Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "termination", label: "Termination" },
  { id: "modifications", label: "Modifications" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact Us" },
];

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
        <p className="text-sm mb-10" style={{ color: "var(--cg-text-muted)" }}>
          Effective Date: March 16, 2026
        </p>

        {/* Table of Contents */}
        <nav
          className="rounded-xl p-5 mb-10"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Table of Contents
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="hover:underline transition-colors"
                  style={{ color: "var(--cg-accent)" }}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div
          className="space-y-8 text-sm leading-relaxed"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By accessing or using golfEQUALIZER at golfequalizer.ai (the
              &ldquo;Service&rdquo;), operated by B Digital Partners LLC, you
              agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
              If you do not agree to these Terms, do not use the Service.
            </p>
          </Section>

          <Section id="service-description" title="2. Description of Service">
            <p>
              golfEQUALIZER is a personalized golf course ranking and discovery
              platform. We aggregate rankings from major golf publications
              including Golf Digest, Golfweek, GOLF Magazine, and
              Top100GolfCourses.com, and enable users to filter and re-weight
              courses based on personal preferences. The Service also provides
              course details, nearby amenities, airport proximity data, user
              score journals, social features (Circles and Fist Bumps), and a
              Performance Center with golf improvement content.
            </p>
          </Section>

          <Section id="user-accounts" title="3. User Accounts">
            <p>
              You may browse course rankings and details without creating an
              account. Certain features — including the Score Journal, GHIN
              verification, personalized weights, wishlists, Circles, and Fist
              Bumps — require signing in with Google OAuth.
            </p>
            <p>
              Each person may maintain only one account. You are responsible for
              maintaining the confidentiality of your account and for all
              activities that occur under it. You must provide accurate
              information and notify us immediately of any unauthorized use.
            </p>
          </Section>

          <Section id="acceptable-use" title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                Submit false, misleading, or fraudulent information
              </li>
              <li>
                Upload fraudulent GHIN screenshots or falsify handicap data
              </li>
              <li>
                Abuse the rating system by submitting dishonest or manipulative
                reviews
              </li>
              <li>
                Harass, bully, or intimidate other users through Circles, Fist
                Bumps, or any other community feature
              </li>
              <li>
                Use automated tools, bots, or scrapers to mine, scrape, or
                extract data from the Service
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service,
                other user accounts, or our systems
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure
              </li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Impersonate another person or entity</li>
            </ul>
            <p className="mt-2">
              Violation of these rules may result in immediate account
              suspension or termination.
            </p>
          </Section>

          <Section id="user-content" title="5. User Content">
            <p>
              When using the Service, you may submit course ratings, reviews,
              score journal entries, and GHIN verification screenshots
              (&ldquo;User Content&rdquo;). You retain ownership of your User
              Content but grant B Digital Partners LLC a non-exclusive,
              worldwide, royalty-free license to use, display, reproduce, and
              distribute it in connection with operating and promoting the
              Service.
            </p>
            <p>
              You represent that you own or have the necessary rights to submit
              your User Content and that it does not violate any third
              party&rsquo;s rights.
            </p>
          </Section>

          <Section id="intellectual-property" title="6. Intellectual Property">
            <p>
              The Service and its original content (excluding User Content),
              features, and functionality are owned by B Digital Partners LLC
              and are protected by copyright, trademark, and other intellectual
              property laws.
            </p>
            <p>
              Our aggregation methodology, including the Chameleon Score
              algorithm, course data aggregation logic, and composite ranking
              system (the &ldquo;Equalizer Score&rdquo;), is proprietary.
              Course ranking data is aggregated from publicly available
              publications. Individual rankings remain the intellectual property
              of their respective publishers.
            </p>
          </Section>

          <Section id="ghin-verification" title="7. GHIN Verification">
            <p>
              Our GHIN verification process involves user-submitted GHIN numbers
              and screenshot evidence. We make reasonable efforts to verify
              handicap information but do not guarantee accuracy. Verified
              handicaps displayed on the Service are based on user-provided data
              and are not official USGA handicap certifications.
            </p>
          </Section>

          <Section
            id="third-party-links"
            title="8. Third-Party Links &amp; Content"
          >
            <p>
              The Service may contain links to third-party websites or services
              (course websites, booking platforms, restaurants, lodging, etc.)
              that are not owned or controlled by us. We are not responsible for
              the content, privacy policies, or practices of any third-party
              sites. Use of third-party services is at your own risk.
            </p>
          </Section>

          <Section id="disclaimers" title="9. Disclaimer of Warranties">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, either express or
              implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
            <p>
              Course information, including green fees, tee times, contact
              details, amenities, conditions, and nearby attractions, is
              provided for informational purposes only and may not be current or
              accurate. We are not responsible for actual course conditions,
              fees, or availability. We recommend verifying details directly
              with each course before visiting.
            </p>
          </Section>

          <Section
            id="limitation-of-liability"
            title="10. Limitation of Liability"
          >
            <p>
              To the fullest extent permitted by applicable law, B Digital
              Partners LLC shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of
              profits or revenues, whether incurred directly or indirectly, or
              any loss of data, use, goodwill, or other intangible losses
              resulting from:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Your use of or inability to use the Service</li>
              <li>
                Any unauthorized access to or use of our servers and/or any
                personal information stored therein
              </li>
              <li>
                Any interruption or cessation of transmission to or from the
                Service
              </li>
              <li>
                Any errors, inaccuracies, or omissions in course information,
                rankings, or other content
              </li>
            </ul>
          </Section>

          <Section id="indemnification" title="11. Indemnification">
            <p>
              You agree to indemnify and hold harmless B Digital Partners LLC
              and its officers, directors, employees, and agents from any
              claims, damages, losses, liabilities, and expenses (including
              reasonable legal fees) arising from your use of the Service, your
              User Content, or your violation of these Terms.
            </p>
          </Section>

          <Section id="termination" title="12. Termination">
            <p>
              We may terminate or suspend your account and access to the Service
              at our sole discretion, without prior notice, for conduct that we
              determine violates these Terms, is harmful to other users, us, or
              third parties, or for any other reason. Upon termination, your
              right to use the Service will immediately cease.
            </p>
            <p>
              You may delete your account at any time by contacting us. Account
              data will be removed in accordance with our{" "}
              <a
                href="/privacy"
                style={{ color: "var(--cg-accent)" }}
                className="hover:underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          </Section>

          <Section id="modifications" title="13. Modifications">
            <p>
              We reserve the right to modify or replace these Terms at any time.
              Material changes will be communicated via email to registered
              users and/or posted prominently on the Service. Continued use of
              the Service after changes constitutes acceptance of the new Terms.
            </p>
          </Section>

          <Section id="governing-law" title="14. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the State of Florida, without regard to its conflict
              of law provisions. Any disputes arising under these Terms shall be
              subject to the exclusive jurisdiction of the courts located in the
              State of Florida.
            </p>
          </Section>

          <Section id="contact" title="15. Contact Us">
            <p>
              If you have questions about these Terms, contact us at:
            </p>
            <div
              className="mt-3 rounded-lg p-4"
              style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
            >
              <p>
                <strong>B Digital Partners LLC</strong>
              </p>
              <p className="mt-1">
                Email:{" "}
                <a
                  href="mailto:calvin@bdigitalpartners.com"
                  style={{ color: "var(--cg-accent)" }}
                  className="hover:underline"
                >
                  calvin@bdigitalpartners.com
                </a>
              </p>
              <p className="mt-1">
                Website:{" "}
                <a
                  href="https://golfequalizer.ai"
                  style={{ color: "var(--cg-accent)" }}
                  className="hover:underline"
                >
                  golfequalizer.ai
                </a>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id}>
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
