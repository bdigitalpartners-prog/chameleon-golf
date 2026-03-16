import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — golfEQUALIZER",
  description:
    "Privacy Policy for golfEQUALIZER (golfequalizer.ai). Learn how we collect, use, and protect your personal information.",
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
const sub: React.CSSProperties = {
  color: "var(--cg-text-primary)",
  fontSize: "1rem",
  fontWeight: 600,
  marginBottom: "0.5rem",
  marginTop: "1.25rem",
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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Effective Date: March 16, 2026 &middot; Last Updated: March 16, 2026
          </p>
        </header>

        {/* Intro */}
        <div style={card}>
          <p style={para}>
            golfEQUALIZER (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the
            website{" "}
            <a href="https://golfequalizer.ai" style={link}>
              golfequalizer.ai
            </a>{" "}
            (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our Service. Please read this policy
            carefully. By using the Service, you consent to the practices described herein.
          </p>
        </div>

        {/* 1 — Information We Collect */}
        <div style={card}>
          <h2 style={heading}>1. Information We Collect</h2>

          <h3 style={sub}>1.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>
              <span style={bold}>Account Information:</span> When you sign in via Google OAuth, we
              receive your name, email address, and profile photo.
            </li>
            <li style={item}>
              <span style={bold}>GHIN Data:</span> If you choose to verify your handicap, we collect
              your GHIN number and any screenshot you upload for verification.
            </li>
            <li style={item}>
              <span style={bold}>Reviews, Ratings &amp; Scores:</span> Course ratings, written
              reviews, and posted golf scores you submit.
            </li>
            <li style={item}>
              <span style={bold}>Weight Profiles:</span> Your personalized Equalizer Score weight
              preferences.
            </li>
            <li style={item}>
              <span style={bold}>Communications:</span> Any messages you send to us via email or
              in-app contact forms.
            </li>
          </ul>

          <h3 style={sub}>1.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>
              <span style={bold}>Log &amp; Device Data:</span> IP address, browser type, operating
              system, referral URLs, pages viewed, and timestamps.
            </li>
            <li style={item}>
              <span style={bold}>Cookies &amp; Tracking:</span> We use cookies and similar
              technologies for authentication and analytics (see Section 4).
            </li>
            <li style={item}>
              <span style={bold}>Analytics:</span> We use PostHog and/or Google Analytics to
              understand usage patterns. These services may collect anonymized interaction data.
            </li>
            <li style={item}>
              <span style={bold}>Error Monitoring:</span> Sentry collects anonymized error reports
              to help us identify and fix issues.
            </li>
          </ul>
        </div>

        {/* 2 — How We Use Your Information */}
        <div style={card}>
          <h2 style={heading}>2. How We Use Your Information</h2>
          <p style={para}>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>Provide, operate, and maintain the Service.</li>
            <li style={item}>Authenticate your identity and manage your account.</li>
            <li style={item}>Process GHIN verification requests and display verified status.</li>
            <li style={item}>Display your reviews, ratings, and scores on the platform.</li>
            <li style={item}>
              Compute and display personalized course scores (Equalizer Score) based on your weight
              preferences.
            </li>
            <li style={item}>
              Analyze usage trends and improve the Service&apos;s functionality and performance.
            </li>
            <li style={item}>
              Send transactional emails (account verification, notifications).
            </li>
            <li style={item}>Respond to your inquiries and provide customer support.</li>
            <li style={item}>
              Detect, prevent, and address technical issues and security threats.
            </li>
            <li style={item}>
              Comply with legal obligations and enforce our Terms of Service.
            </li>
          </ul>
        </div>

        {/* 3 — How We Share Your Information */}
        <div style={card}>
          <h2 style={heading}>3. How We Share Your Information</h2>
          <p style={para}>
            We do <span style={bold}>not</span> sell your personal information. We may share
            information in the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>
              <span style={bold}>Service Providers:</span> We share data with third-party providers
              who help us operate the Service, including Vercel (hosting), Neon (database),
              Cloudflare (CDN &amp; security), Sentry (error monitoring), and PostHog/Google
              (analytics). Each provider processes data solely to perform services on our behalf and
              is bound by their own privacy policies.
            </li>
            <li style={item}>
              <span style={bold}>Payment Processors:</span> If you make a purchase, payment
              information is processed by Stripe. We do not store your credit card details.
            </li>
            <li style={item}>
              <span style={bold}>Public Content:</span> Reviews, ratings, and your display name may
              be visible to other users of the Service.
            </li>
            <li style={item}>
              <span style={bold}>Legal Requirements:</span> We may disclose information if required
              by law, regulation, legal process, or governmental request.
            </li>
            <li style={item}>
              <span style={bold}>Business Transfers:</span> In the event of a merger, acquisition,
              or sale of assets, your information may be transferred as part of that transaction.
            </li>
          </ul>
        </div>

        {/* 4 — Cookies */}
        <div style={card}>
          <h2 style={heading}>4. Cookies &amp; Tracking Technologies</h2>
          <p style={para}>
            We use cookies and similar technologies for authentication, preferences, and analytics.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>
              <span style={bold}>Essential Cookies:</span> Required for authentication (NextAuth
              session cookies), theme preferences, and core functionality. These cannot be disabled
              without breaking the Service.
            </li>
            <li style={item}>
              <span style={bold}>Analytics Cookies:</span> Used by PostHog and/or Google Analytics
              to understand how users interact with the Service. These may be opted out of via
              browser settings.
            </li>
          </ul>
          <p style={{ ...para, marginTop: "0.75rem" }}>
            We do not use advertising or third-party tracking cookies. You can control cookies
            through your browser settings. Disabling essential cookies may prevent you from using
            certain features of the Service.
          </p>
        </div>

        {/* 5 — Data Retention */}
        <div style={card}>
          <h2 style={heading}>5. Data Retention</h2>
          <p style={para}>
            We retain your personal information for as long as your account is active or as needed to
            provide the Service. If you delete your account, we will delete or anonymize your
            personal data within 30 days, except where retention is required by law or for legitimate
            business purposes (e.g., fraud prevention, dispute resolution).
          </p>
          <p style={para}>
            Aggregated, anonymized data that cannot identify you may be retained indefinitely for
            analytics and product improvement.
          </p>
        </div>

        {/* 6 — Data Security */}
        <div style={card}>
          <h2 style={heading}>6. Data Security</h2>
          <p style={para}>
            We implement industry-standard security measures to protect your data, including
            encryption in transit (TLS/HTTPS), secure database connections, hashed authentication
            tokens, and access controls. However, no method of transmission over the Internet or
            electronic storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </div>

        {/* 7 — Your Rights & Choices */}
        <div style={card}>
          <h2 style={heading}>7. Your Rights &amp; Choices</h2>

          <h3 style={sub}>7.1 All Users</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>
              <span style={bold}>Access &amp; Update:</span> You can access and update your profile
              information through your account settings.
            </li>
            <li style={item}>
              <span style={bold}>Delete Account:</span> You may request account deletion by
              contacting us at{" "}
              <a href="mailto:contact@golfequalizer.ai" style={link}>
                contact@golfequalizer.ai
              </a>
              .
            </li>
            <li style={item}>
              <span style={bold}>Opt Out of Analytics:</span> You can opt out of analytics tracking
              by using browser-level tools or extensions.
            </li>
          </ul>

          <h3 style={sub}>7.2 California Residents (CCPA)</h3>
          <p style={para}>If you are a California resident, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>
              Request disclosure of the categories and specific pieces of personal information we
              have collected about you.
            </li>
            <li style={item}>
              Request deletion of your personal information, subject to certain exceptions.
            </li>
            <li style={item}>
              Opt out of the &ldquo;sale&rdquo; of personal information. We do not sell personal
              information as defined under the CCPA.
            </li>
            <li style={item}>Not be discriminated against for exercising your CCPA rights.</li>
          </ul>
          <p style={{ ...para, marginTop: "0.75rem" }}>
            To exercise these rights, contact us at{" "}
            <a href="mailto:contact@golfequalizer.ai" style={link}>
              contact@golfequalizer.ai
            </a>
            . We will verify your identity before processing requests.
          </p>

          <h3 style={sub}>7.3 European Economic Area / UK (GDPR)</h3>
          <p style={para}>
            If you are located in the EEA or UK, you have additional rights under the General Data
            Protection Regulation, including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li style={item}>
              <span style={bold}>Right of Access:</span> Request a copy of your personal data.
            </li>
            <li style={item}>
              <span style={bold}>Right to Rectification:</span> Request correction of inaccurate
              data.
            </li>
            <li style={item}>
              <span style={bold}>Right to Erasure:</span> Request deletion of your data (&ldquo;right
              to be forgotten&rdquo;).
            </li>
            <li style={item}>
              <span style={bold}>Right to Restrict Processing:</span> Request that we limit how we
              use your data.
            </li>
            <li style={item}>
              <span style={bold}>Right to Data Portability:</span> Receive your data in a
              structured, machine-readable format.
            </li>
            <li style={item}>
              <span style={bold}>Right to Object:</span> Object to processing based on legitimate
              interests.
            </li>
            <li style={item}>
              <span style={bold}>Right to Withdraw Consent:</span> Withdraw consent at any time
              where processing is based on consent.
            </li>
          </ul>
          <p style={{ ...para, marginTop: "0.75rem" }}>
            Our legal bases for processing are: consent (where you have given it), contract
            performance (providing the Service), and legitimate interests (improving the Service,
            security). Contact us at{" "}
            <a href="mailto:contact@golfequalizer.ai" style={link}>
              contact@golfequalizer.ai
            </a>{" "}
            to exercise these rights.
          </p>
        </div>

        {/* 8 — International Data Transfers */}
        <div style={card}>
          <h2 style={heading}>8. International Data Transfers</h2>
          <p style={para}>
            The Service is hosted in the United States. If you access the Service from outside the
            US, your information may be transferred to, stored, and processed in the US or other
            countries where our service providers operate. By using the Service, you consent to such
            transfers. We take reasonable steps to ensure that your data is treated securely and in
            accordance with this Privacy Policy.
          </p>
        </div>

        {/* 9 — Children's Privacy */}
        <div style={card}>
          <h2 style={heading}>9. Children&apos;s Privacy</h2>
          <p style={para}>
            The Service is not directed to individuals under the age of 13. We do not knowingly
            collect personal information from children under 13. If we become aware that a child
            under 13 has provided us with personal information, we will take steps to delete such
            information. If you believe we may have collected information from a child under 13,
            please contact us at{" "}
            <a href="mailto:contact@golfequalizer.ai" style={link}>
              contact@golfequalizer.ai
            </a>
            .
          </p>
        </div>

        {/* 10 — Third-Party Links */}
        <div style={card}>
          <h2 style={heading}>10. Third-Party Links</h2>
          <p style={para}>
            The Service may contain links to third-party websites, including golf course websites,
            booking platforms, restaurants, lodging providers, and social media. We are not
            responsible for the privacy practices of these external sites. We encourage you to review
            their privacy policies before providing any personal information.
          </p>
        </div>

        {/* 11 — Changes */}
        <div style={card}>
          <h2 style={heading}>11. Changes to This Policy</h2>
          <p style={para}>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the updated policy on this page and updating the &ldquo;Last
            Updated&rdquo; date. Your continued use of the Service after changes are posted
            constitutes acceptance of the revised policy.
          </p>
        </div>

        {/* 12 — Contact */}
        <div style={card}>
          <h2 style={heading}>12. Contact Us</h2>
          <p style={para}>
            If you have questions or concerns about this Privacy Policy or our data practices,
            please contact us:
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
