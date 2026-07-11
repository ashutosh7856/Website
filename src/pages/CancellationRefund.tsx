import { Mail, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import PageSEO from "@/components/SEO/PageSEO";

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO title="Cancellation & Refund Policy | ProCounsel" description="ProCounsel's cancellation and refund policy for counselling sessions, courses, and subscriptions." canonical="/cancellation-refund" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 lg:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Cancellation & Refund Policy</h1>
            <p className="text-lg text-gray-600">Last Updated: 5th November, 2025</p>
            <p className="text-sm text-gray-500 mt-2">ProCounsel - A product of CATALYSTAI TECHNOLOGY PRIVATE LIMITED</p>
          </div>

          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-8">
              At ProCounsel, we are committed to providing quality education counseling services. This Cancellation & Refund Policy outlines the terms and conditions under which cancellations and refunds are processed for ProCoins purchases and counselor subscriptions.
            </p>

            {/* Refund Request Section */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-8 rounded-r-lg">
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-orange-500 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">How to Request a Refund</h3>
                  <p className="text-gray-700 mb-3">
                    To request a cancellation or refund, please send an email to:
                  </p>
                  <a 
                    href="mailto:support@procounsel.co.in" 
                    className="text-orange-600 hover:text-orange-700 font-semibold text-lg underline"
                  >
                    support@procounsel.co.in
                  </a>
                  <p className="text-gray-700 mt-3 mb-2">
                    Please include the following information in your email:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Your registered name and email address</li>
                    <li>Screenshot of the payment/transaction</li>
                    <li>Order ID or Transaction ID</li>
                    <li>Detailed reason for requesting the refund</li>
                    <li>Date of purchase</li>
                  </ul>
                </div>
              </div>
            </div>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">1. ProCoins Purchase</h2>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">1.1 Non-Refundable Policy</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">
                    <strong>ProCoins purchases are generally non-refundable.</strong> Once you have successfully purchased ProCoins through our payment gateway (Razorpay), the transaction is considered final.
                  </p>
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">1.2 Exceptions for Refunds</h3>
              <p className="text-gray-700 mb-4">We may consider refund requests in the following exceptional cases:</p>
              <div className="space-y-3">
                <div className="flex items-start bg-green-50 p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Technical Error</p>
                    <p className="text-gray-700">ProCoins were deducted from your account but did not reflect in your wallet due to a technical glitch.</p>
                  </div>
                </div>
                <div className="flex items-start bg-green-50 p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Double Charge</p>
                    <p className="text-gray-700">Your payment was processed multiple times for a single transaction.</p>
                  </div>
                </div>
                <div className="flex items-start bg-green-50 p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Unauthorized Transaction</p>
                    <p className="text-gray-700">The payment was made without your authorization (subject to verification).</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">2. Counselor Subscription Cancellation</h2>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">2.1 Cancellation Policy</h3>
              <p className="text-gray-700 mb-4">
                If you have subscribed to a counselor using your ProCoins and wish to cancel:
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">
                    <strong>Cancellations must be requested within 24 hours of subscription</strong> and before any counseling session or interaction with the counselor has taken place.
                  </p>
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">2.2 Refund Eligibility for Subscriptions</h3>
              <div className="space-y-3">
                <div className="flex items-start bg-green-50 p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Eligible for Refund</p>
                    <p className="text-gray-700">No counseling session has been conducted and cancellation requested within 24 hours. ProCoins will be credited back to your wallet.</p>
                  </div>
                </div>
                <div className="flex items-start bg-red-50 p-4 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Not Eligible for Refund</p>
                    <p className="text-gray-700">Any counseling session, chat, or appointment has been conducted. The subscription fee is non-refundable after service utilization.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">3. Refund Processing</h2>
              
              <div className="flex items-start bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded-r-lg">
                <Clock className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-800 mb-2">Processing Time</p>
                  <p className="text-gray-700">
                    Once your refund request is approved, it will be processed within <strong>7-10 business days</strong>. 
                    The refund will be credited to the original payment method used during the transaction.
                  </p>
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">3.1 Refund Methods</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Credit/Debit Cards:</strong> Refunds will be processed back to the original card. It may take 5-7 working days to reflect in your account depending on your bank.</li>
                <li><strong>UPI/Net Banking:</strong> Refunds will be credited to your linked bank account within 3-5 working days.</li>
                <li><strong>Wallet Refunds:</strong> For subscription cancellations, ProCoins will be credited back to your ProCounsel wallet instantly upon approval.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">4. Service Quality Disputes</h2>
              
              <p className="text-gray-700 mb-4">
                If you are dissatisfied with the quality of counseling services provided, please report your concerns to us at <a href="mailto:support@procounsel.co.in" className="text-orange-600 hover:text-orange-700 underline">support@procounsel.co.in</a>. We will:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Review your complaint and the counselor's service records</li>
                <li>Mediate between you and the counselor if necessary</li>
                <li>Take appropriate action, including issuing warnings to the counselor or providing a partial/full refund in exceptional cases</li>
              </ul>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Note:</strong> Refunds for service quality issues are granted at the sole discretion of ProCounsel management and are evaluated on a case-by-case basis.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">5. No Refund Scenarios</h2>
              
              <p className="text-gray-700 mb-4">Refunds will <strong>NOT</strong> be provided in the following cases:</p>
              <div className="space-y-2">
                <div className="flex items-start p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">You have utilized the counseling services (chat, call, appointment)</p>
                </div>
                <div className="flex items-start p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">You change your mind after the 24-hour cancellation window</p>
                </div>
                <div className="flex items-start p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">You provided incorrect information during the purchase or subscription</p>
                </div>
                <div className="flex items-start p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">You violate ProCounsel's Terms of Service or engage in fraudulent activities</p>
                </div>
                <div className="flex items-start p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">The counselor's advice did not meet your personal expectations (subjective dissatisfaction)</p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">6. Contact Information</h2>
              
              <p className="text-gray-700 mb-4">
                For any questions, concerns, or to initiate a cancellation/refund request, please reach out to us:
              </p>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email Support</p>
                      <a href="mailto:support@procounsel.co.in" className="text-lg font-semibold text-orange-600 hover:text-orange-700 underline">
                        support@procounsel.co.in
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="text-gray-800 font-semibold">CATALYSTAI TECHNOLOGY PRIVATE LIMITED</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">7. Changes to This Policy</h2>
              
              <p className="text-gray-700">
                ProCounsel reserves the right to modify or update this Cancellation & Refund Policy at any time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically to stay informed about our refund practices.
              </p>
            </section>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mt-8">
              <p className="text-gray-700 text-center">
                By using ProCounsel and making purchases on our platform, you acknowledge that you have read, understood, and agree to this Cancellation & Refund Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
