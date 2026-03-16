import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — golfEQUALIZER",
  description: "Privacy Policy for golfEQUALIZER — how we collect, use, and protect your data.",
};

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
        <p
          className="text-sm mb-10"
          style={{ color: "var(--cg-text-muted)" }}
        >
          Last updated: March 16, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--cg-text-secondary)" }}>
          <Section title="1. Introduction">
            <p>
              golfEQUALIZER (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website
              golfequalizer.ai (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you visit our Service.
            </p>
            <p>
              By accessing or using the Service, you agree to this Privacy Policy. If you do not agree, please
              discontinue use of the Service immediately.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h4 className="font-semibold mt-3 mb-1" style={{ color: "var(--cg-text-primary)" }}>
              Personal Data
            </h4>
            <p>
              When you create an account, we may collect personally identifiable information such as your name,
              email address, and Google profile information (provided via Google OAuth sign-in). If you use our
              GHIN verification feature, we collect your GHIN number and uploaded screenshot images.
            </p>
            <h4 className="font-semibold mt-3 mb-1" style={{ color: "var(--cg-text-primary)" }}>
              Usage Data
            </h4>
            <p>
              We automatically collect information about your device, browser, IP address, pages viewed, time
              spent on pages, and other diagnostic data through our analytics provider (PostHog). This data is
              anonymized and used solely to improve the Service.
            </p>
            <h4 className="font-semibold mt-3 mb-1" style={{ color: "var(--cg-text-primary)" }}>
              Cookies &amp; Local Storage
            </h4>
            <p>
              We use cookies and local storage for authentication session management and theme preferences.
              We do not use advertising or third-party tracking cookies.
            </p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and maintain our Service</li>
              <li>To authenticate your identity via Google OAuth</li>
              <li>To verify your GHIN handicap information</li>
              <li>To personalize your experience (theme, course preferences, weight settings)</li>
              <li>To monitor usage, detect issues, and improve performance (via PostHog and Sentry)</li>
              <li>To send transactional emails (account-related notifications via Resend)</li>
              <li>To respond to inquiries and provide customer support</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing &amp; Third Parties">
            <p>We do not sell your personal information. We share data only with the following service providers:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Neon</strong> — Serverless database hosting</li>
              <li><strong>Vercel</strong> — Website hosting and deployment</li>
              <li><strong>Google</strong> — OAuth authentication</li>
              <li><strong>PostHog</strong> — Privacy-focused analytics</li>
              <li><strong>Sentry</strong> — Error monitoring</li>
              <li><strong>Resend</strong> — Transactional email delivery</li>
              <li><strong>Cloudflare</strong> — CDN, DNS, and image delivery</li>
              <li><strong>Stripe</strong> — Payment processing (for future premium features)</li>
            </ul>
            <p className="mt-2">
              Each provider processes data solely to perform services on our behalf and is bound by their
              own privacy policies.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your personal data only as long as necessary to fulfill the purposes outlined in this
              policy. Account data is retained while your account is active. You may request deletion of your
              account and associated data at any time by contacting us.
            </p>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement industry-standard security measures including encrypted data transmission (TLS/SSL),
              secure database connections, and hashed authentication tokens. However, no method of electronic
              storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h4 className="font-semibold mt-4 mb-1" style={{ color: "var(--cg-text-primary)" }}>
              California Residents (CCPA)
            </h4>
            <p>
              Under the California Consumer Privacy Act, California residents have the right to know what personal
              information is collected, request deletion, and opt out of the sale of personal information. We do
              not sell personal information.
            </p>

            <h4 className="font-semibold mt-4 mb-1" style={{ color: "var(--cg-text-primary)" }}>
              European Residents (GDPR)
            </h4>
            <p>
              If you are in the European Economic Area, you have rights under the General Data Protection
              Regulation including the right to access, rectify, erase, restrict processing, data portability,
              and the right to object. Our legal basis for processing is your consent (provided at sign-up) and
              our legitimate interest in operating the Service.
            </p>
          </Section>

          <Section title="8. Children&rsquo;s Privacy">
            <p>
              Our Service is not intended for individuals under the age of 13. We do not knowingly collect personal
              information from children under 13. If we become aware that we have collected such data, we will take
              steps to delete it.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated &ldquo;Last updated&rdquo; date. Continued use of the Service after changes constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:privacy@golfequalizer.ai"
                style={{ color: "var(--cg-accent)" }}
                className="hover:underline"
              >
                privacy@golfequalizer.ai
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
