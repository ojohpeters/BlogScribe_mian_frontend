"use client"

import Link from "next/link"

export default function TermsAndConditions() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to Blogscribe. By using our service, you agree to these terms and conditions. Please read them carefully before using the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p>
            Blogscribe provides an automated WordPress blog content management service that includes:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Automated content fetching from various sources</li>
            <li>AI-powered content paraphrasing</li>
            <li>WordPress integration</li>
            <li>Content management tools</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
          <p>
            Users are responsible for:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Maintaining the security of their account credentials</li>
            <li>Ensuring they have proper rights to use and modify content</li>
            <li>Complying with WordPress and other third-party service terms</li>
            <li>Using the service in accordance with applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payments</h2>
          <p>
            Our service operates on a subscription basis:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Subscription fees are charged according to the selected plan</li>
            <li>Payments are processed securely through our payment provider</li>
            <li>Subscriptions auto-renew unless cancelled</li>
            <li>Refunds are handled according to our refund policy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Content Usage</h2>
          <p>
            When using our content fetching and paraphrasing services:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Users must respect copyright and intellectual property rights</li>
            <li>Generated content should be reviewed before publishing</li>
            <li>We do not guarantee the accuracy of paraphrased content</li>
            <li>Users are responsible for the final published content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. API Usage and Limitations</h2>
          <p>
            Our service includes API access with the following conditions:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>API requests are limited based on subscription plan</li>
            <li>Rate limiting applies to prevent abuse</li>
            <li>API access may be restricted for violation of terms</li>
            <li>API keys must be kept secure</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data</h2>
          <p>
            We take your privacy seriously:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>User data is handled according to our Privacy Policy</li>
            <li>Content is processed securely</li>
            <li>We do not share your data with third parties without consent</li>
            <li>Users can request data deletion</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Service Modifications</h2>
          <p>
            We reserve the right to:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Modify or discontinue features</li>
            <li>Update pricing and plans</li>
            <li>Change API functionality</li>
            <li>Modify these terms with notice to users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
          <p>
            Accounts may be terminated:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>By user request</li>
            <li>For violation of these terms</li>
            <li>For extended periods of inactivity</li>
            <li>If the service is discontinued</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
          <p>
            For questions about these terms, contact us at support@Blogscribe.com
          </p>
        </section>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
} 