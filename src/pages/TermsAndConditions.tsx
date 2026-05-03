import Navbar from "@/components/Navbar";
import { Footer } from "@/components";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="prose prose-lg max-w-none space-y-8">
          <h1 className="text-4xl font-bold text-foreground text-center mb-2">
            Terms and Conditions
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated: May 1, 2025
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Bathra ("the Platform"), you agree to be bound by these Terms and
              Conditions and all applicable laws and regulations. If you do not agree with any of these
              terms, you are prohibited from using or accessing this Platform. These terms apply to all
              visitors, users, and others who access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">2. Platform Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bathra is a simulated investment and networking platform designed to connect early-stage
              startups with accredited investors in the Kingdom of Saudi Arabia and the broader GCC
              region. All investment activity conducted on Bathra uses simulated (paper) capital and does
              not constitute real financial transactions, regulated investment advice, or legally binding
              financial instruments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">3. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years of age to use this Platform. By registering, you represent
              and warrant that you have the legal capacity to enter into these terms and that all
              information you provide is accurate, current, and complete. Bathra reserves the right to
              verify user identities and suspend or terminate accounts that do not meet eligibility
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">4. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account. You agree to notify Bathra immediately
              of any unauthorized use of your account. Bathra will not be liable for any loss or damage
              arising from your failure to protect your account information. Each user may hold only one
              account. Creating duplicate accounts may result in permanent suspension.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">5. Simulated Investment Activity</h2>
            <p className="text-muted-foreground leading-relaxed">
              All investment offers, portfolio positions, and financial figures displayed on Bathra
              represent simulated (paper) transactions only. No real money is transferred, no real
              equity is acquired, and no legally binding financial agreements are formed through the
              Platform. Bathra is not a licensed investment platform, broker-dealer, or financial
              adviser. Nothing on the Platform constitutes financial, legal, or investment advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">6. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use the Platform to: (a) upload false, misleading, or fraudulent
              information about yourself or your company; (b) harass, abuse, or harm other users;
              (c) attempt to gain unauthorized access to any part of the Platform or its infrastructure;
              (d) use automated scripts or bots to access the Platform; (e) post content that violates
              applicable laws or third-party rights. Bathra reserves the right to remove any content and
              suspend any account that violates these guidelines without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform and its original content, features, and functionality are owned by Bathra and
              are protected by applicable intellectual property laws. You may not copy, reproduce,
              distribute, or create derivative works from the Platform without prior written consent from
              Bathra. User-submitted content remains the property of the respective user; by submitting
              content, you grant Bathra a non-exclusive licence to use it for Platform purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">8. Privacy and Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bathra collects and processes personal data in accordance with applicable data protection
              laws, including the Saudi Personal Data Protection Law (PDPL). By using the Platform,
              you consent to the collection and use of your information as described in our Privacy
              Policy. We do not sell personal data to third parties. Data is stored securely and retained
              only as long as necessary for Platform operations or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Bathra shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of profits, data,
              goodwill, or other intangible losses, resulting from your access to or use of (or inability
              to access or use) the Platform. Bathra's total cumulative liability for any claims arising
              out of or relating to these Terms shall not exceed SAR 500.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bathra may terminate or suspend your account at any time, with or without cause, with or
              without notice. Upon termination, your right to use the Platform will immediately cease.
              You may also delete your account at any time by contacting our support team. Provisions of
              these Terms that by their nature should survive termination will remain in effect after
              termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bathra reserves the right to modify these Terms at any time. We will notify users of
              material changes by updating the "Last Updated" date at the top of this page. Continued
              use of the Platform after changes are posted constitutes acceptance of the revised Terms.
              It is your responsibility to review these Terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Kingdom
              of Saudi Arabia. Any disputes arising from these Terms or your use of the Platform shall
              be subject to the exclusive jurisdiction of the competent courts in Riyadh, Saudi Arabia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@bathra.sa" className="text-primary underline">
                legal@bathra.sa
              </a>
              .
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
