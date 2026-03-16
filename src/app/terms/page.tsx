import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — golfEQUALIZER",
  description:
    "Terms of Service for golfEQUALIZER (golfequalizer.ai). Rules and conditions for using our golf course review platform.",
};

/* ─── Shared styles ─── */
const card: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem 2rem",
};
const heading: React.CSSProperties = {
  color: "var(--cg-text-primary)",
  fontSize: "1.25rem",
  fontWeight: 700,
  marginBottom: "1rem",
};
const para: React.CSSProperties = {
  color: "var(--cg-text-secondary)",
  fontSize: "0.875rem",
  lineHeight: 1.75,
  marginBottom: "0.75rem",
};
const item: React.CSSProperties = {
  color: "var(--cg-text-secondary)",
  fontSize: "0.875rem",
  lineHeight: 1.75,
  marginBottom: "0.25rem",
};
const bold: React.CSSProperties = { color: "var(--cg-text-primary)" };
const link: React.CSSProperties = { color: "#01696F", textDecoration: "underline" };

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Terms of Service
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Effective Date: March 16, 2026 &middot; Last Updated: March 16, 2026
          </p>
        </header>

        {/* 1 — Acceptance */}
        <div style={card}>
          <h2 style={heading}>1. Acceptance of Terms</h2>
          <p style={para}>
            By accessing or using golfEQUALIZER at{" "}
            <a href="https://golfequalizer.ai" style={link}>
              golfequalizer.ai
            </a>{" "}
            (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service
            (&ldquo;Terms&rdquo;). If you do not agree to these Terms, do not use the Service.
          </p>
          <p style={para}>
            We may update these Terms from time to time. Material changes will be communicated via
            the Service. Continued use after changes are posted constitutes acceptance of the
            updated Terms.
          </p>
        </div>

        {/* 2 — Description */}
        <div style={card}>
          <h2 style={heading}>2. Description of Service</h2>
          <p style={para}>
            golfEQUALIZER is a dynamic golf course review and ranking platform. We aggregate
            rankings from major golf publications including Golf Digest, Golfweek, GOLF Magazine, and
            Top100GolfCourses.com, and enable users to filter and re-weight courses based on personal
            preferences via our proprietary Equalizer Score. The Service also provides course
            details, insider tips, nearby amenities, airport proximity data, user reviews, and score
            journals.
          </p>
        </div>

        {/* 3 — Accounts */}
        <div style={card}>
          <h2 style={heading}>3. User Accounts</h2>
          <p style={para}>
            You may browse course rankings and details without creating an account. Certain
            features — including the Score Journal, GHIN verification, personalized weight profiles,
            course ratings, and wishlists — require signing in via Google OAuth.
          </p>
          <p style={para}>
            You are responsible for maintaining the confidentiality of your account and for all
            activities that occur under your account. You must notify us immediately of any
            unauthorized use. We reserve the right to suspend or terminate accounts that violate
            these Terms.
          </p>
        </div>

        {/* 4 — User Content & Conduct */}
        <div style={card}>
          <h2 style={heading}>4. User Content &amp; Conduct</h2>
          <p style={para}>
            When using the Service, you may submit course ratings, reviews, score journal entries,
            and GHIN verification screenshots (&ldquo;User Content&rdquo;). You retain ownership of
            your User Content but grant golfEQUALIZER a non-exclusive, worldwide, royalty-free
            license to use, display, reproduce, and distribute it in connection with the Service.
          </p>
          <p style={para}>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>Submit false, misleading, or fraudulent information.</li>
            <li style={item}>
              Upload fraudulent GHIN screenshots or falsify handicap data.
            </li>
            <li style={item}>Use the Service for any unlawful purpose.</li>
            <li style={item}>
              Attempt to gain unauthorized access to any part of the Service, other accounts, or
              computer systems.
            </li>
            <li style={item}>
              Use automated tools, bots, scrapers, or spiders to access, mine, or extract data from
              the Service.
            </li>
            <li style={item}>Interfere with or disrupt the Service or its infrastructure.</li>
            <li style={item}>Impersonate another person or entity.</li>
            <li style={item}>
              Post content that is defamatory, obscene, threatening, or otherwise objectionable.
            </li>
            <li style={item}>
              Attempt to reverse-engineer, decompile, or derive the source code of the Service.
            </li>
          </ul>
          <p style={{ ...para, marginTop: "0.75rem" }}>
            We reserve the right to remove any User Content that violates these Terms and to
            suspend or terminate accounts of repeat offenders.
          </p>
        </div>

        {/* 5 — Intellectual Property */}
        <div style={card}>
          <h2 style={heading}>5. Intellectual Property</h2>
          <p style={para}>
            The Service and its original content (excluding User Content), features, functionality,
            design, and branding are owned by golfEQUALIZER and are protected by copyright,
            trademark, and other intellectual property laws. You may not copy, modify, distribute, or
            create derivative works of any part of the Service without our prior written consent.
          </p>
          <p style={para}>
            Course ranking data is aggregated from publicly available publications. Individual
            rankings remain the intellectual property of their respective publishers (Golf Digest,
            Golfweek, GOLF Magazine, Top100GolfCourses.com). Our aggregation methodology, the
            Equalizer Score algorithm, and the CF Score computation are proprietary.
          </p>
        </div>

        {/* 6 — GHIN Verification */}
        <div style={card}>
          <h2 style={heading}>6. GHIN Verification</h2>
          <p style={para}>
            Our GHIN verification process involves user-submitted GHIN numbers and screenshot
            evidence reviewed by our team. We make reasonable efforts to verify handicap information
            but do not guarantee accuracy. Verified handicaps displayed on the Service are based on
            user-provided data and are not official USGA handicap certifications.
          </p>
          <p style={para}>
            Submitting fraudulent GHIN information is a violation of these Terms and may result in
            immediate account termination.
          </p>
        </div>

        {/* 7 — Third-Party Links */}
        <div style={card}>
          <h2 style={heading}>7. Third-Party Links &amp; Content</h2>
          <p style={para}>
            The Service may contain links to third-party websites or services (course websites,
            booking platforms, restaurants, lodging, attractions, etc.) that are not owned or
            controlled by us. We are not responsible for the content, privacy policies, or practices
            of any third-party sites. You access third-party sites at your own risk.
          </p>
        </div>

        {/* 8 — Payment Terms */}
        <div style={card}>
          <h2 style={heading}>8. Payment Terms</h2>
          <p style={para}>
            Certain features of the Service may require payment in the future. If and when premium
            features are introduced, payments will be processed through Stripe. All fees are
            non-refundable unless otherwise stated. We reserve the right to change pricing with
            reasonable notice.
          </p>
        </div>

        {/* 9 — Disclaimer of Warranties */}
        <div style={card}>
          <h2 style={heading}>9. Disclaimer of Warranties</h2>
          <p style={para}>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
            WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p style={para}>
            We do not warrant that the Service will be uninterrupted, error-free, or free of harmful
            components. Course information, including green fees, contact details, amenities, weather
            data, and nearby attractions, is provided for informational purposes only and may not be
            current. We recommend verifying details directly with each course or establishment.
          </p>
        </div>

        {/* 10 — Limitation of Liability */}
        <div style={card}>
          <h2 style={heading}>10. Limitation of Liability</h2>
          <p style={para}>
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, golfEQUALIZER AND ITS OWNERS,
            OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
            REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
            OR OTHER INTANGIBLE LOSSES RESULTING FROM:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>Your access to or use of (or inability to use) the Service.</li>
            <li style={item}>
              Any conduct or content of any third party on the Service.
            </li>
            <li style={item}>
              Any content obtained from the Service, including course information, rankings, and
              ratings.
            </li>
            <li style={item}>Unauthorized access, use, or alteration of your data.</li>
          </ul>
          <p style={{ ...para, marginTop: "0.75rem" }}>
            In no event shall our total liability exceed the greater of one hundred US dollars
            ($100.00) or the amount you have paid us in the twelve (12) months preceding the claim.
          </p>
        </div>

        {/* 11 — Indemnification */}
        <div style={card}>
          <h2 style={heading}>11. Indemnification</h2>
          <p style={para}>
            You agree to indemnify, defend, and hold harmless golfEQUALIZER and its owners,
            officers, directors, employees, and agents from and against any claims, damages, losses,
            liabilities, costs, and expenses (including reasonable legal fees) arising from or
            related to your use of the Service, your User Content, or your violation of these Terms.
          </p>
        </div>

        {/* 12 — Termination */}
        <div style={card}>
          <h2 style={heading}>12. Termination</h2>
          <p style={para}>
            We may terminate or suspend your account and access to the Service at our sole
            discretion, without prior notice or liability, for conduct that we determine violates
            these Terms, is harmful to other users, us, or third parties, or for any other reason.
          </p>
          <p style={para}>
            Upon termination, your right to use the Service will immediately cease. Provisions of
            these Terms that by their nature should survive termination shall survive, including
            ownership provisions, warranty disclaimers, indemnification, and limitations of
            liability.
          </p>
        </div>

        {/* 13 — Governing Law */}
        <div style={card}>
          <h2 style={heading}>13. Governing Law &amp; Dispute Resolution</h2>
          <p style={para}>
            These Terms shall be governed by and construed in accordance with the laws of the State
            of Delaware, United States, without regard to its conflict of law provisions.
          </p>
          <p style={para}>
            Any dispute arising under or in connection with these Terms shall be resolved
            exclusively in the state or federal courts located in the State of Delaware. You consent
            to the personal jurisdiction of such courts and waive any objection to venue therein.
          </p>
          <p style={para}>
            Before filing any claim, you agree to attempt to resolve the dispute informally by
            contacting us at{" "}
            <a href="mailto:contact@golfequalizer.ai" style={link}>
              contact@golfequalizer.ai
            </a>
            . We will attempt to resolve the dispute within 30 days.
          </p>
        </div>

        {/* 14 — Severability */}
        <div style={card}>
          <h2 style={heading}>14. Severability</h2>
          <p style={para}>
            If any provision of these Terms is found to be unenforceable or invalid by a court of
            competent jurisdiction, that provision shall be limited or eliminated to the minimum
            extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </div>

        {/* 15 — Entire Agreement */}
        <div style={card}>
          <h2 style={heading}>15. Entire Agreement</h2>
          <p style={para}>
            These Terms, together with our{" "}
            <a href="/privacy" style={link}>
              Privacy Policy
            </a>
            , constitute the entire agreement between you and golfEQUALIZER regarding the Service
            and supersede all prior agreements, communications, and proposals, whether oral or
            written.
          </p>
        </div>

        {/* 16 — Contact */}
        <div style={card}>
          <h2 style={heading}>16. Contact Us</h2>
          <p style={para}>
            If you have questions about these Terms of Service, please contact us:
          </p>
          <p style={para}>
            <span style={bold}>golfEQUALIZER</span>
            <br />
            Email:{" "}
            <a href="mailto:contact@golfequalizer.ai" style={link}>
              contact@golfequalizer.ai
            </a>
            <br />
            Website:{" "}
            <a href="https://golfequalizer.ai" style={link}>
              golfequalizer.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
