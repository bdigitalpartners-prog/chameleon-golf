import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — golfEQUALIZER",
  description:
    "Privacy Policy for golfEQUALIZER — how we collect, use, and protect your data.",
};

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-your-information", label: "How We Use Your Information" },
  { id: "cookies-and-tracking", label: "Cookies & Tracking Technologies" },
  { id: "data-sharing", label: "Data Sharing & Third Parties" },
  { id: "data-retention", label: "Data Retention" },
  { id: "data-security", label: "Data Security" },
  { id: "your-rights", label: "Your Rights" },
  { id: "childrens-privacy", label: "Children\u2019s Privacy" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPage() {
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
          Privacy Policy
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
          <Section id="introduction" title="1. Introduction">
            <p>
              golfEQUALIZER (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;), operated by B Digital Partners LLC, provides
              the website at golfequalizer.ai (the &ldquo;Service&rdquo;). This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit or use our Service.
            </p>
            <p>
              By accessing or using the Service, you agree to this Privacy
              Policy. If you do not agree, please discontinue use of the Service
              immediately.
            </p>
          </Section>

          <Section id="information-we-collect" title="2. Information We Collect">
            <h4
              className="font-semibold mt-3 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Account Data
            </h4>
            <p>
              When you create an account via Google OAuth, we collect your name,
              email address, and Google profile picture. If you use our GHIN
              verification feature, we collect your GHIN number and uploaded
              screenshot images.
            </p>

            <h4
              className="font-semibold mt-3 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Usage Data
            </h4>
            <p>
              We collect information about how you interact with the Service,
              including course rankings viewed, slider/weight positions, saved
              lists, wishlist entries, score journal entries, preferences, and
              search queries. This data is tied to your account when you are
              signed in.
            </p>

            <h4
              className="font-semibold mt-3 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Device &amp; Browser Information
            </h4>
            <p>
              We automatically collect information about your device, browser
              type, operating system, IP address, pages viewed, time spent on
              pages, and other diagnostic data through our analytics provider,
              PostHog. This data helps us understand how the Service is used and
              improve it.
            </p>
          </Section>

          <Section
            id="how-we-use-your-information"
            title="3. How We Use Your Information"
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and maintain our Service</li>
              <li>To authenticate your identity via Google OAuth</li>
              <li>To verify your GHIN handicap information</li>
              <li>
                To personalize your experience — including course rankings,
                themes, weight settings, and saved preferences
              </li>
              <li>To generate aggregate, anonymized analytics about course popularity and trends</li>
              <li>
                To monitor usage, detect issues, and improve performance (via
                PostHog analytics and Sentry error monitoring)
              </li>
              <li>
                To send transactional emails such as account-related
                notifications (via Resend)
              </li>
              <li>To respond to inquiries and provide customer support</li>
            </ul>
          </Section>

          <Section
            id="cookies-and-tracking"
            title="4. Cookies &amp; Tracking Technologies"
          >
            <p>We use the following cookies and similar technologies:</p>

            <h4
              className="font-semibold mt-3 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Essential Cookies
            </h4>
            <p>
              NextAuth session cookies are required for authentication. These
              cookies keep you signed in and are deleted when you log out or they
              expire. Without these cookies, authenticated features of the
              Service cannot function.
            </p>

            <h4
              className="font-semibold mt-3 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Analytics Cookies
            </h4>
            <p>
              We use PostHog, a privacy-focused analytics platform, to
              understand how the Service is used. PostHog sets cookies to
              identify unique visitors and sessions. Analytics data is used in
              aggregate to improve the Service. You may opt out of PostHog
              tracking via your browser&rsquo;s Do Not Track setting.
            </p>

            <h4
              className="font-semibold mt-3 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Functionality Cookies
            </h4>
            <p>
              We use local storage to save your theme preference (Midnight,
              Fairway, or Golden Hour) so the Service remembers your visual
              settings between visits.
            </p>

            <h4
              className="font-semibold mt-3 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Advertising Cookies
            </h4>
            <p>
              We do not use any advertising or third-party tracking cookies.
            </p>
          </Section>

          <Section id="data-sharing" title="5. Data Sharing &amp; Third Parties">
            <p>
              We do not sell your personal information. We share data only with
              the following service providers, each of which processes data
              solely to perform services on our behalf:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Google</strong> — OAuth authentication (receives your
                authentication request)
              </li>
              <li>
                <strong>PostHog</strong> — Privacy-focused analytics (receives
                anonymized usage data)
              </li>
              <li>
                <strong>Sentry</strong> — Error monitoring (receives error
                reports and diagnostic data)
              </li>
              <li>
                <strong>Resend</strong> — Transactional email delivery (receives
                your email address for account notifications)
              </li>
              <li>
                <strong>Neon</strong> — Serverless PostgreSQL database hosting
                (stores account and usage data)
              </li>
              <li>
                <strong>Vercel</strong> — Website hosting and deployment
              </li>
              <li>
                <strong>Cloudflare</strong> — CDN, DNS, and image delivery
              </li>
              <li>
                <strong>Stripe</strong> — Payment processing (for future premium
                features; no payment data is collected at this time)
              </li>
            </ul>
            <p className="mt-2">
              Each provider is bound by their own privacy policies and data
              processing agreements.
            </p>
          </Section>

          <Section id="data-retention" title="6. Data Retention">
            <p>
              We retain your personal data only as long as necessary to fulfill
              the purposes outlined in this policy:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Account data</strong> is retained while your account is
                active.
              </li>
              <li>
                <strong>Upon account deletion request</strong>, your personal
                data will be deleted within 30 days. Some anonymized, aggregate
                data (e.g., overall rating averages) may be retained
                indefinitely.
              </li>
              <li>
                <strong>Analytics data</strong> is retained in accordance with
                PostHog&rsquo;s data retention policies.
              </li>
              <li>
                <strong>Error logs</strong> in Sentry are automatically purged
                after 90 days.
              </li>
            </ul>
            <p className="mt-2">
              You may request deletion of your account and associated data at
              any time by contacting us at the address below.
            </p>
          </Section>

          <Section id="data-security" title="7. Data Security">
            <p>
              We implement industry-standard security measures including
              encrypted data transmission (TLS/SSL), secure database connections
              via Neon&rsquo;s encrypted endpoints, and hashed authentication
              tokens. However, no method of electronic storage is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section id="your-rights" title="8. Your Rights">
            <p>
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability (receive your data in a structured, machine-readable format)</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:calvin@bdigitalpartners.com"
                style={{ color: "var(--cg-accent)" }}
                className="hover:underline"
              >
                calvin@bdigitalpartners.com
              </a>
              . We will respond within 30 days.
            </p>

            <h4
              className="font-semibold mt-4 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              California Residents (CCPA)
            </h4>
            <p>
              Under the California Consumer Privacy Act, California residents
              have the right to: know what personal information is collected and
              how it is used; request deletion of personal information; and opt
              out of the sale of personal information. We do not sell personal
              information. To submit a CCPA request, email us at{" "}
              <a
                href="mailto:calvin@bdigitalpartners.com"
                style={{ color: "var(--cg-accent)" }}
                className="hover:underline"
              >
                calvin@bdigitalpartners.com
              </a>
              .
            </p>

            <h4
              className="font-semibold mt-4 mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              European Residents (GDPR)
            </h4>
            <p>
              If you are in the European Economic Area, you have rights under
              the General Data Protection Regulation including the right to
              access, rectify, erase, restrict processing, data portability, and
              the right to object. Our legal basis for processing is your
              consent (provided at sign-up) and our legitimate interest in
              operating the Service. You also have the right to lodge a
              complaint with your local data protection authority.
            </p>
          </Section>

          <Section id="childrens-privacy" title="9. Children&rsquo;s Privacy">
            <p>
              Our Service is not directed at individuals under the age of 13. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have collected such data, we will
              take steps to delete it promptly. If you believe a child under 13
              has provided us with personal information, please contact us at{" "}
              <a
                href="mailto:calvin@bdigitalpartners.com"
                style={{ color: "var(--cg-accent)" }}
                className="hover:underline"
              >
                calvin@bdigitalpartners.com
              </a>
              .
            </p>
          </Section>

          <Section id="changes" title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated effective date. For
              material changes, we will notify registered users via email.
              Continued use of the Service after changes constitutes acceptance
              of the updated policy.
            </p>
          </Section>

          <Section id="contact" title="11. Contact Us">
            <p>
              If you have questions about this Privacy Policy or wish to
              exercise your data rights, contact us at:
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
